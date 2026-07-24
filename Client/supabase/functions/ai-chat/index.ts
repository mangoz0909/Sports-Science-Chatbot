import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://sports-science-chatbot.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";

  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : "https://sports-science-chatbot.onrender.com",
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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Browser CORS preflight
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

    const message =
      typeof requestBody.message === "string"
        ? requestBody.message.trim()
        : "";

    const chatType =
      typeof requestBody.chatType === "string"
        ? requestBody.chatType.trim()
        : "sports";

    if (!message) {
      return jsonResponse(
        { error: "Message is required" },
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
          temperature: 0.7,
          max_tokens: 500,
        }),
      },
    );
    
    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI error:", errorText);
      throw new Error("Failed to generate an AI response.");
    }
    
    const openAiData = await openAiResponse.json();
    
    const reply =
      openAiData?.choices?.[0]?.message?.content?.trim();
    
    if (!reply) {
      throw new Error("OpenAI returned an empty response.");
    }
    
    return jsonResponse(
      { reply },
      200,
      corsHeaders,
    );
  }
});