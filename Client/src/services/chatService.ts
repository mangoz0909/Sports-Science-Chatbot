import { supabase } from "../lib/supabaseClient";

export type ChatType = "sports" | "mental_health";

export async function saveChatMessage(content: string, role: "user" | "bot", chatType: ChatType) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return;

  const { error } = await supabase
    .from("chat_messages")
    .insert({ user_id: user.id, chat_type: chatType, role, content });

  if (error) console.warn("Failed to save chat message:", error.message);
}

export async function clearChatHistory(chatType: ChatType) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return;

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", user.id)
    .eq("chat_type", chatType);

  if (error) console.warn("Failed to clear chat history:", error.message);
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
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;

  return data;
}
