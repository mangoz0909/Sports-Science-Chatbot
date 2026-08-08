import { createClient } from "npm:@supabase/supabase-js@2";

type RequestBody = {
  message?: unknown;
  history?: unknown;
  chatType?: unknown;
  systemPrompt?: unknown;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatType = "sports" | "mental_health";

type OpenAIToolCall = {
  id: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type OpenAIResponseBody = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
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

// Preceding turns sent back so the assistant can follow the conversation.
// Capped on both count and total size to bound token spend per request.
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 12000;

// Origins that may call this function. Set ALLOWED_ORIGINS in the function's
// environment (comma-separated) when the app moves to a new domain — the
// defaults below are only a fallback so an unset variable can't break prod.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://sportslabai.onrender.com",
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

// Tools the model may call to read the athlete's own records. Everything runs
// through the caller's JWT-scoped Supabase client, so RLS still applies and a
// user can only ever reach their own rows. Read-only by design — nothing here
// writes to the database.
const PROFILE_COLUMNS =
  "name, primary_sport, experience_level, main_goal, training_days, " +
  "competition_level, injury_areas, priorities, sleep_range, athlete_type, " +
  "age, height_cm, weight_kg, activity_level, workout_duration, " +
  "equipment_access, dietary_preference, food_allergies, foods_avoid, " +
  "meals_per_day, cooking_access";

const CHECKIN_COLUMNS =
  "checkin_date, readiness_score, recovery_score, injury_risk, sleep_hours, " +
  "sleep_quality, energy, soreness, fatigue, stress, mood, hydration, " +
  "nutrition, training_intensity, pain_level, notes";

const MAX_CHECKIN_ROWS = 90;
const MAX_TOOL_ROUNDS = 3;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_profile",
      description:
        "Read the athlete's saved profile: sport, experience level, goals, " +
        "training days per week, injuries and restrictions, body metrics, and " +
        "dietary needs. Call this before giving advice that should be tailored " +
        "to this specific athlete.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_checkins",
      description:
        "Read the athlete's daily check-in history for a date range, including " +
        "readiness, recovery, injury risk, sleep, fatigue, soreness and training " +
        "intensity, each stamped with its date. Call this for anything about " +
        "trends, recent load, or a specific past day. Today's date is supplied " +
        "in the system instructions.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "First date to include, formatted YYYY-MM-DD.",
          },
          to: {
            type: "string",
            description: "Last date to include, formatted YYYY-MM-DD.",
          },
        },
        required: ["from", "to"],
        additionalProperties: false,
      },
    },
  },
];

// deno-lint-ignore no-explicit-any
async function runTool(
  supabase: any,
  userId: string,
  name: string,
  rawArguments: string,
): Promise<unknown> {
  let args: Record<string, unknown> = {};

  try {
    const parsed = JSON.parse(rawArguments || "{}");
    if (typeof parsed === "object" && parsed !== null) {
      args = parsed as Record<string, unknown>;
    }
  } catch {
    return { error: "Tool arguments were not valid JSON." };
  }

  if (name === "get_profile") {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) {
      return {
        error:
          "This athlete has not completed the onboarding survey yet. Ask them " +
          "for the details you need, and suggest filling in their profile.",
      };
    }

    return data;
  }

  if (name === "get_checkins") {
    const from = typeof args.from === "string" ? args.from.trim() : "";
    const to = typeof args.to === "string" ? args.to.trim() : "";

    if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
      return { error: "Both 'from' and 'to' must be dates formatted YYYY-MM-DD." };
    }

    if (from > to) {
      return { error: "'from' must be on or before 'to'." };
    }

    const { data, error } = await supabase
      .from("daily_checkins")
      .select(CHECKIN_COLUMNS)
      .eq("user_id", userId)
      .gte("checkin_date", from)
      .lte("checkin_date", to)
      .order("checkin_date", { ascending: true })
      .limit(MAX_CHECKIN_ROWS);

    if (error) return { error: error.message };

    const rows = data ?? [];

    return {
      count: rows.length,
      truncated: rows.length === MAX_CHECKIN_ROWS,
      checkins: rows,
    };
  }

  return { error: `Unknown tool: ${name}` };
}

function normalizeHistory(value: unknown): HistoryMessage[] {
  if (!Array.isArray(value)) return [];

  const cleaned: HistoryMessage[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;

    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;

    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || !content.trim()) continue;

    cleaned.push({ role, content: content.trim() });
  }

  // Keep the most recent turns, then trim from the front until the whole
  // window fits the character budget.
  const recent = cleaned.slice(-MAX_HISTORY_MESSAGES);

  let total = recent.reduce((sum, item) => sum + item.content.length, 0);

  while (recent.length > 0 && total > MAX_HISTORY_CHARS) {
    total -= recent[0].content.length;
    recent.shift();
  }

  return recent;
}

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
async function getAthleteProfile(
  supabase: any,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load athlete profile:", error);
    return null;
  }

  return data;
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

    const history = normalizeHistory(body.history);

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

    // The model reads the athlete's records through tools rather than being
    // handed a snapshot, so it always sees current data and can look up any
    // date. It needs today's date to turn "last week" into a real range.
    const today = new Date().toISOString().slice(0, 10);

    const athleteProfile = await getAthleteProfile(
      supabase,
      user.id,
    );
    
    const profileContext = athleteProfile
      ? `
    ATHLETE PROFILE / SURVEY DATA:
    ${JSON.stringify(athleteProfile, null, 2)}
    
    Use this saved profile whenever it is relevant.
    Do not ask the user for information already listed here.
    If the current message conflicts with the saved profile, trust the current message.
    `
      : `
    ATHLETE PROFILE / SURVEY DATA:
    No saved athlete profile was found.
    `;
    
    const systemPrompt = [
      customSystemPrompt || getDefaultSystemPrompt(chatType),
      "",
      `Today's date is ${today}.`,
      profileContext,
      "",
      "Use get_checkins when you need dated check-in information such as sleep, fatigue, recovery, soreness, mood, pain, readiness, or training load.",
    ].join("\n");

    // deno-lint-ignore no-explicit-any
    const conversation: any[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    let reply = "";
    const toolsUsed: string[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
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
            messages: conversation,
            tools: TOOLS,
            tool_choice: "auto",
            temperature: 0.6,
            max_tokens: 1200,
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

      const assistantMessage = openAiData.choices?.[0]?.message;

      if (!assistantMessage) {
        break;
      }

      const toolCalls = assistantMessage.tool_calls ?? [];

      if (toolCalls.length === 0) {
        reply = assistantMessage.content?.trim() ?? "";
        break;
      }

      // Echo the assistant's tool request back verbatim, then answer each call.
      conversation.push(assistantMessage);

      for (const call of toolCalls) {
        const toolName = call.function?.name ?? "";
        toolsUsed.push(toolName);

        const result = await runTool(
          supabase,
          user.id,
          toolName,
          call.function?.arguments ?? "{}",
        );

        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!reply) {
      console.error(
        "No reply produced after tool rounds. Tools used:",
        toolsUsed.join(", ") || "none",
      );

      return jsonResponse(
        {
          error:
            "The assistant could not finish that request. Please try rephrasing it.",
        },
        502,
        corsHeaders,
      );
    }

    return jsonResponse(
      { reply, toolsUsed },
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