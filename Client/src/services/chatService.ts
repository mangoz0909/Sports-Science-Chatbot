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

/**
 * Save a completed question-and-answer turn.
 *
 * Both rows go in one insert with explicit, ordered timestamps. Saving them as
 * two back-to-back inserts let the database stamp them microseconds apart, and
 * history is ordered by `created_at` — so a turn could come back reply-first
 * on reload. An explicit 1ms gap makes the order unambiguous.
 */
export async function saveChatExchange(
  userContent: string,
  botContent: string,
  chatType: ChatType,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not logged in.");

  const askedAt = new Date();
  const answeredAt = new Date(askedAt.getTime() + 1);

  const { error } = await supabase.from("chat_messages").insert([
    {
      user_id: user.id,
      chat_type: chatType,
      role: "user" as StoredChatRole,
      content: userContent,
      created_at: askedAt.toISOString(),
    },
    {
      user_id: user.id,
      chat_type: chatType,
      role: "assistant" as StoredChatRole,
      content: botContent,
      created_at: answeredAt.toISOString(),
    },
  ]);

  if (error) {
    console.error("Failed to save chat exchange:", error);
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