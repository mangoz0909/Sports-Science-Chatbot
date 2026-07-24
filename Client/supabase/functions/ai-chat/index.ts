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
  message?: unknown;
  chatType?: unknown;
};

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function extractResponseText(data: OpenAIResponse): string {
  for (const outputItem of data.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text.trim();
      }
    }
  }

  return "";
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

    const chatType =
      typeof body.chatType === "string" && body.chatType.trim()
        ? body.chatType.trim()
        : "sports";

    if (!message) {
      return jsonResponse(
        { error: "Message is required." },
        400,
        corsHeaders,
      );
    }

    if (message.length > 5000) {
      return jsonResponse(
        { error: "Message is too long." },
        400,
        corsHeaders,
      );
    }

    const systemPrompt =
      chatType === "sports"
        ? `
You are a supportive sports performance assistant for student athletes.

Your responsibilities:
- Give practical advice about training, recovery, confidence, motivation,
  performance anxiety, stress management, sleep, hydration, and routines.
- Personalize advice using information the user provides.
- Ask one or two useful follow-up questions when important information is
  missing, such as the user's sport, age, schedule, injury status, or goals.
- Keep responses clear, encouraging, and actionable.
- Do not diagnose medical or mental health conditions.
- Do not tell users to ignore injuries or professional advice.
- For serious pain, injury symptoms, medical emergencies, or mental health
  crises, encourage the user to contact a qualified professional or emergency
  service.
- Do not claim that you have accessed an athlete profile unless profile
  information was actually included in the conversation.
`.trim()
        : `
You are a helpful assistant. Give accurate, clear, and practical answers.
`.trim();

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

      console.error(
        `OpenAI API error ${openAiResponse.status}:`,
        errorText,
      );

      return jsonResponse(
        {
          error: "Failed to generate an AI response.",
          status: openAiResponse.status,
        },
        502,
        corsHeaders,
      );
    }

    const openAiData =
      await openAiResponse.json() as OpenAIResponse;

    const reply = extractResponseText(openAiData);

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

    console.log(
      `Generated sports response for user ${user.id}`,
    );

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
            : "Internal server error",
      },
      500,
      corsHeaders,
    );
  }
});