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

function getSystemPrompt(chatType: string): string {
  if (chatType === "sports") {
    return `
You are a supportive sports-performance assistant for student athletes.

Provide practical, safe, and personalized guidance about:
- training
- recovery
- confidence
- motivation
- stress
- sleep
- injury prevention
- athletic performance

Ask about the user's sport, experience, schedule, goals, injuries, and available
equipment when that information is necessary.

Do not diagnose injuries or medical conditions. When symptoms may require
medical attention, clearly advise the user to speak with a doctor, athletic
trainer, physical therapist, coach, parent, or another qualified professional.

Keep answers clear, encouraging, realistic, and age-appropriate.
`.trim();
  }

  return `
You are a supportive mental-health assistant for students.

Provide calm, respectful, practical emotional support. Help users describe
their feelings, consider healthy coping strategies, and identify people who
may be able to support them.

Do not claim to be a therapist, doctor, counselor, or replacement for
professional care. Do not diagnose mental-health conditions.

Encourage the user to speak with a trusted adult, parent, school counselor,
doctor, therapist, or emergency professional when appropriate.

If the user appears to be in immediate danger or considering self-harm,
encourage them to contact emergency services and a trusted person immediately.

Keep responses compassionate, age-appropriate, and nonjudgmental.
`.trim();
}

/**
 * Extracts assistant text from a raw REST response from /v1/responses.
 *
 * The JavaScript SDK exposes response.output_text as a convenience property,
 * but a raw fetch response should be read from the output/content structure.
 */
function extractOpenAIText(data: OpenAIResponseBody): string {
  if (!Array.isArray(data.output)) {
    return "";
  }

  const textParts: string[] = [];

  for (const outputItem of data.output) {
    if (!Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        const text = contentItem.text.trim();

        if (text) {
          textParts.push(text);
        }
      }
    }
  }

  return textParts.join("\n").trim();
}

async function saveChatMessage(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  sender: ChatSender,
  chatType: string,
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: userId,
      message,
      sender,
      chat_type: chatType,
    });

  if (error) {
    console.error(`Failed to save ${sender} message:`, error);

    throw new Error(`Unable to save ${sender} message.`);
  }
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

    if (!message) {
      return jsonResponse(
        { error: "Message is required." },
        400,
        corsHeaders,
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(
        {
          error:
            `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        },
        400,
        corsHeaders,
      );
    }

    if (!allowedChatTypes.has(chatType)) {
      return jsonResponse(
        { error: "Invalid chat type." },
        400,
        corsHeaders,
      );
    }

    /*
     * Save the user's message before calling OpenAI.
     */
    await saveChatMessage(
      supabase,
      user.id,
      message,
      "user",
      chatType,
    );

    const systemPrompt = getSystemPrompt(chatType);

    /*
     * Generate the assistant response.
     */
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
      console.error(
        "OpenAI request failed:",
        openAiResponse.status,
        JSON.stringify(openAiData),
      );

      return jsonResponse(
        {
          error:
            "The assistant could not generate a response. Please try again.",
        },
        502,
        corsHeaders,
      );
    }

    const reply = extractOpenAIText(openAiData);

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

    /*
     * Save the assistant's response.
     */
    await saveChatMessage(
      supabase,
      user.id,
      reply,
      "bot",
      chatType,
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
          "An unexpected server error occurred. Please try again.",
      },
      500,
      corsHeaders,
    );
  }
});