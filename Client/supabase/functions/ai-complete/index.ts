import { createClient } from "npm:@supabase/supabase-js@2";

// Origins that may call this function. Set ALLOWED_ORIGINS in the function's
// environment (comma-separated) when the app moves to a new domain — the
// defaults below are only a fallback so an unset variable can't break prod.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://sports-science-chatbot.onrender.com",
  "https://sportlabai.com",
  "https://www.sportlabai.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";

  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : DEFAULT_ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const DEFAULT_SYSTEM_PROMPT =
  "You are a careful sports science assistant. Provide general educational " +
  "guidance only, avoid diagnosis, and return valid JSON when requested.";

const MAX_PROMPT_LENGTH = 12000;
const MAX_SYSTEM_PROMPT_LENGTH = 4000;
const MIN_TOKENS = 100;
const MAX_TOKENS = 2500;
const DEFAULT_TOKENS = 1200;
const DEFAULT_TEMPERATURE = 0.4;

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, num));
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
      corsHeaders,
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing or invalid authorization header" },
        401,
        corsHeaders,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

      return jsonResponse(
        { error: "Server configuration error" },
        500,
        corsHeaders,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);

      return jsonResponse(
        { error: "Unauthorized" },
        401,
        corsHeaders,
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Request body must be valid JSON" },
        400,
        corsHeaders,
      );
    }

    const requestBody =
      typeof body === "object" && body !== null
        ? body as Record<string, unknown>
        : {};

    const prompt =
      typeof requestBody.prompt === "string"
        ? requestBody.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
        : "";

    if (!prompt) {
      return jsonResponse(
        { error: "Prompt is required" },
        400,
        corsHeaders,
      );
    }

    const systemPrompt =
      typeof requestBody.systemPrompt === "string" && requestBody.systemPrompt.trim()
        ? requestBody.systemPrompt.trim().slice(0, MAX_SYSTEM_PROMPT_LENGTH)
        : DEFAULT_SYSTEM_PROMPT;

    const maxTokens = clampNumber(requestBody.maxTokens, MIN_TOKENS, MAX_TOKENS, DEFAULT_TOKENS);
    const temperature = clampNumber(requestBody.temperature, 0, 1, DEFAULT_TEMPERATURE);

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      },
    );

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI error:", errorText);
      throw new Error("Failed to generate an AI response.");
    }

    const openAiData = await openAiResponse.json();

    const result =
      openAiData?.choices?.[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("OpenAI returned an empty response.");
    }

    return jsonResponse(
      { result },
      200,
      corsHeaders,
    );
  } catch (err) {
    console.error("ai-complete error:", err);

    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      500,
      corsHeaders,
    );
  }
});
