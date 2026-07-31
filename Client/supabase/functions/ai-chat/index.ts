import { createClient } from "npm:@supabase/supabase-js@2";

type RequestBody = {
  message?: unknown;
  chatType?: unknown;
  systemPrompt?: unknown;
};

type ChatType = "sports" | "mental_health";

type OpenAIResponseBody = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

const MAX_MESSAGE_LENGTH = 5000;
const MAX_SYSTEM_PROMPT_LENGTH = 4000;

const allowedOrigins = new Set([
  "https://sports-science-chatbot.onrender.com",
  "https://sportlabai.com",
  "https://www.sportlabai.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const allowedChatTypes = new Set<ChatType>([
  "sports",
  "mental_health",
]);

const SPORTS_SYSTEM_PROMPT = `
You are a supportive sports performance assistant.

Give practical, safe, and personalized advice about:
- sports training
- workout planning
- athletic performance
- recovery
- nutrition
- confidence
- motivation
- stress

Ask for the user's sport, experience level, goals, available equipment,
and limitations when that information is needed.

Do not diagnose medical conditions.
Do not claim to replace a doctor, physical therapist, coach,
dietitian, psychologist, or other qualified professional.

If the user describes severe pain, chest pain, trouble breathing,
loss of consciousness, a serious injury, or another possible emergency,
tell them to stop exercising and seek immediate professional help.

Keep answers clear, supportive, organized, and easy to understand.
`.trim();

const MENTAL_HEALTH_SYSTEM_PROMPT = `
You are a supportive assistant that provides general emotional support.

Listen carefully, respond calmly, and suggest practical and healthy
coping strategies.

Do not diagnose mental health conditions.
Do not claim to replace a therapist, counselor, doctor,
or emergency service.

If the user appears to be in immediate danger or may harm themselves
or another person, encourage them to contact local emergency services
and a trusted adult immediately.

Keep answers compassionate, practical, and easy to understand.
`.trim();

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

function getDefaultSystemPrompt(chatType: ChatType): string {
  if (chatType === "mental_health") {
    return MENTAL_HEALTH_SYSTEM_PROMPT;
  }

  return SPORTS_SYSTEM_PROMPT;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405,
      corsHeaders,
    );
  }

  try {
    const origin = req.headers.get("origin") ?? "";

    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(
        { error: "Origin not allowed." },
        403,
        corsHeaders,
      );
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing or invalid authorization header." },
        401,
        corsHeaders,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY.",
      );

      return jsonResponse(
        { error: "Supabase server configuration is missing." },
        500,
        corsHeaders,
      );
    }

    if (!openAiApiKey) {
      console.error("Missing OPENAI_API_KEY.");

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
        { error: "Unauthorized." },
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
        ? body.message
          .trim()
          .slice(0, MAX_MESSAGE_LENGTH)
        : "";

    if (!message) {
      return jsonResponse(
        { error: "Message is required." },
        400,
        corsHeaders,
      );
    }

    const requestedChatType =
      typeof body.chatType === "string"
        ? body.chatType.trim()
        : "sports";

    const chatType: ChatType =
      allowedChatTypes.has(requestedChatType as ChatType)
        ? requestedChatType as ChatType
        : "sports";

    const customSystemPrompt =
      typeof body.systemPrompt === "string"
        ? body.systemPrompt
          .trim()
          .slice(0, MAX_SYSTEM_PROMPT_LENGTH)
        : "";

    const systemPrompt =
      customSystemPrompt || getDefaultSystemPrompt(chatType);

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
              content: message,
            },
          ],
          temperature: 0.6,
          max_tokens: 600,
        }),
      },
    );

    const openAiData =
      await openAiResponse.json() as OpenAIResponseBody;

    if (!openAiResponse.ok) {
      console.error(
        "OpenAI request failed:",
        JSON.stringify(openAiData),
      );

      return jsonResponse(
        {
          error:
            openAiData.error?.message ??
            "Failed to generate an AI response.",
        },
        openAiResponse.status,
        corsHeaders,
      );
    }

    const reply =
      openAiData.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error(
        "OpenAI returned an empty response:",
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
  } catch (error) {
    console.error("ai-chat function error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected server error occurred.",
      },
      500,
      corsHeaders,
    );
  }
});