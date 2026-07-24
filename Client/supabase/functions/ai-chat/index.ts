import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://sports-science-chatbot.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
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

type RequestBody = {
  message?: string;
  systemPrompt?: string;
};

const DEFAULT_SYSTEM_PROMPT = `You are SportLab AI, a supportive sports performance and student-athlete
wellbeing assistant. Give practical, safe, and personalized advice about
training, recovery, nutrition, confidence, motivation, and stress. Ask for
the user's sport and goals when needed. Do not diagnose medical conditions
or mental health disorders. If the user mentions self-harm, suicide,
immediate danger, abuse, or any emergency situation, tell them to contact
emergency services, a trusted adult, parent, coach, counselor, or crisis
hotline immediately.`;

const MAX_SYSTEM_PROMPT_LENGTH = 8000;

// The Responses API returns output text either as a top-level `output_text`
// convenience field or nested in `output[].content[].text` — handle both.
function extractResponsesApiText(data: unknown): string {
  const record = data as Record<string, unknown>;

  if (typeof record?.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim();
  }

  const output = Array.isArray(record?.output) ? record.output : [];

  return output
    .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
    .filter((part: any) => typeof part?.text === "string")
    .map((part: any) => part.text)
    .join("")
    .trim();
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle browser CORS preflight before authentication.
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
    const origin = req.headers.get("origin") ?? "";

    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(
        { error: "Origin not allowed" },
        403,
        corsHeaders,
      );
    }

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
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variable.",
      );

      return jsonResponse(
        { error: "Supabase server configuration is missing." },
        500,
        corsHeaders,
      );
    }

    if (!openAiApiKey) {
      console.error("Missing OPENAI_API_KEY environment variable.");

      return jsonResponse(
        { error: "OpenAI server configuration is missing." },
        500,
        corsHeaders,
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

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

    let body: RequestBody;

    try {
      body = await req.json() as RequestBody;
    } catch {
      return jsonResponse(
        { error: "Request body must be valid JSON." },
        400,
        corsHeaders,
      );
    }

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const clientSystemPrompt =
      typeof body.systemPrompt === "string"
        ? body.systemPrompt.trim().slice(0, MAX_SYSTEM_PROMPT_LENGTH)
        : "";

    if (!message) {
      return jsonResponse(
        { error: "Message is required." },
        400,
        corsHeaders,
      );
    }

    const systemPrompt = clientSystemPrompt || DEFAULT_SYSTEM_PROMPT;

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: systemPrompt,
          input: message,
          max_output_tokens: 600,
        }),
      },
    );

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI error:", errorText);
      throw new Error("Failed to generate an AI response.");
    }

    const openAiData = await openAiResponse.json();
    const reply = extractResponsesApiText(openAiData);

    if (!reply) {
      console.error(
        "OpenAI returned no output text:",
        JSON.stringify(openAiData),
      );

      return jsonResponse(
        { error: "OpenAI returned an empty response." },
        502,
        corsHeaders,
      );
    }

    return jsonResponse(
      { reply },
      200,
      corsHeaders,
    );
  } catch (err) {
    console.error("ai-chat error:", err);

    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      500,
      corsHeaders,
    );
  }
});
