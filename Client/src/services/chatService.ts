import { supabase } from "../../lib/supabaseClient";

export type ChatType = "sports" | "mental_health";

export async function sendAiMessage(message: string, chatType: ChatType) {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: {
      message,
      chatType,
    },
  });

  if (error) throw error;

  return data as {
    reply: string;
  };
}

export async function getChatHistory(chatType: ChatType) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("chat_type", chatType)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}