import { supabase } from "../lib/supabaseClient";

export type ChatType = "sports";

export type ChatRole = "user" | "bot";

type StoredChatRole = "user" | "assistant";

type StoredChatMessage = {
  id: string;
  user_id: string;
  chat_type: ChatType;
  role: StoredChatRole | "bot";
  content: string;
  created_at: string;
};

/**
 * Save a chat message.
 *
 * The frontend uses "bot", while the database stores the standard
 * OpenAI-style role "assistant".
 */
export async function saveChatMessage(
  content: string,
  role: ChatRole,
  chatType: ChatType,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const databaseRole: StoredChatRole =
    role === "bot" ? "assistant" : "user";

  const { error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: user.id,
      chat_type: chatType,
      role: databaseRole,
      content,
    });

  if (error) {
    console.error("Failed to save chat message:", error);
    throw error;
  }
}

export async function clearChatHistory(chatType: ChatType) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", user.id)
    .eq("chat_type", chatType);

  if (error) {
    console.error("Failed to clear chat history:", error);
    throw error;
  }
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

  if (error) {
    console.error("Failed to load chat history:", error);
    throw error;
  }

  /*
   * Convert database "assistant" messages back to the frontend's
   * expected "bot" role.
   *
   * "bot" is also accepted here so any older rows still work.
   */
  return ((data ?? []) as StoredChatMessage[]).map((row) => ({
    ...row,
    role: row.role === "assistant" ? "bot" : row.role,
  }));
}