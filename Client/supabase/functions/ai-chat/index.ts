import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatType = "sports" | "mental_health";

function getSystemPrompt(chatType: ChatType) {
  if (chatType === "mental_health") {
    return `
You are MangoMind, a supportive wellbeing assistant.
Give general mental health information, stress-management strategies, emotional support, and practical coping steps.
Do not diagnose.
Do not prescribe medication.
For emergencies, self-harm risk, or immediate danger, tell the user to contact local emergency services or a trusted person immediately.
`;
  }

  return `
You are a sports science assistant for SportLab AI.
Give practical, concise help about sport rules, athlete performance, training load, recovery, tactics, mental performance, and beginner drills.
For injuries or medical concerns, do not diagnose. Recommend a qualified clinician.
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !openAiApiKey) {
      throw new Error("Missing environment variables.");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const body = await req.json();

    const message = String(body.message || "").trim();
    const chatType = String(body.chatType || "sports") as ChatType;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!["sports", "mental_health"].includes(chatType)) {
      return new Response(JSON.stringify({ error: "Invalid chat type." }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .eq("chat_type", chatType)
      .order("created_at", { ascending: false })
      .limit(10);

    const formattedHistory =
      history
        ?.reverse()
        .map((item) => ({
          role: item.role,
          content: item.content,
        })) || [];

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      chat_type: chatType,
      role: "user",
      content: message,
    });

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: getSystemPrompt(chatType),
          },
          ...formattedHistory,
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      throw new Error(errorText);
    }

    const openAiData = await openAiResponse.json();

    const reply =
      openAiData?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      chat_type: chatType,
      role: "assistant",
      content: reply,
    });

    return new Response(JSON.stringify({ reply }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});