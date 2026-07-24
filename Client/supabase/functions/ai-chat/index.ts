import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

/*
 * Expected chat_messages table columns:
 *
 * id          uuid / bigint
 * user_id     uuid
 * message     text
 * sender      text: "user" or "bot"
 * chat_type   text
 * created_at  timestamptz
 */

type RequestBody = {
  message?: unknown;
  chatType?: unknown;
};

type ChatSender = "user" | "bot";

type OpenAIContentItem = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAIContentItem[];
};

type OpenAIResponseBody = {
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

const MAX_MESSAGE_LENGTH = 5000;

const allowedOrigins = new Set([
  "https://sports-science-chatbot.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const allowedChatTypes = new Set([
  "sports",
  "mental_health",
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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  /*
   * The browser sends an OPTIONS request before the real POST request.
   */
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
    /*
     * Reject browser requests from origins that are not approved.
     * Requests with no Origin header, such as server-to-server requests,
     * continue to authentication.
     */
    const origin = req.headers.get("origin") ?? "";

    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(
        { error: "Origin not allowed." },
        403,
        corsHeaders,
      );
    }

    /*
     * Read the signed-in user's access token.
     */
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing or invalid authorization header." },
        401,
        corsHeaders,
      );
    }

    /*
     * Read server-side environment variables.
     */
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

    /*
     * Create a Supabase client using the user's token.
     *
     * Database operations made with this client follow the user's
     * Row Level Security permissions.
     */
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

    /*
     * Verify the supplied access token and obtain the authenticated user.
     */
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

    /*
     * Parse and validate the request body.
     */
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

    const clientSystemPrompt =
      typeof requestBody.systemPrompt === "string"
        ? requestBody.systemPrompt.trim().slice(0, MAX_SYSTEM_PROMPT_LENGTH)
        : "";

    if (!message) {
      return jsonResponse(
        { error: "Message is required." },
        400,
        corsHeaders,
      );
    }

    /*
     * Replace this placeholder with your OpenAI request.
     *
     * Example:
     * const reply = await generateReply({
     *   message,
     *   chatType,
     *   userId: user.id,
     * });
     */

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const systemPrompt =
      chatType === "sports"
        ? `You are a supportive sports performance assistant.
    Give practical, safe, and personalized advice about training, recovery,
    confidence, motivation, and stress. Ask for the user's sport and goals when
    needed. Do not diagnose medical conditions.`
        : `You are a helpful assistant.`;
    
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

    const openAiData =
      await openAiResponse.json() as OpenAIResponseBody;

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI error:", errorText);
      throw new Error("Failed to generate an AI response.");
    }
    
    const openAiData = await openAiResponse.json();
    
    const reply =
      openAiData?.choices?.[0]?.message?.content?.trim();
    
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
  }
});