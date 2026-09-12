import { supabase } from "../lib/supabaseClient";
import { getCurrentUser, requireCurrentUser } from "../lib/currentUser";

export type ChatType = "sports";

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
 * Most recent turns restored when the chat page mounts. Two rows per exchange,
 * so this is fifty question-and-answer pairs.
 */
const HISTORY_LIMIT = 100;

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
  const user = await requireCurrentUser(
    "You must be logged in to save this conversation.",
  );

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
  const user = await requireCurrentUser(
    "You must be logged in to clear your chat history.",
  );

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
  const user = await getCurrentUser();

  // `/sports` is open to signed-out visitors, who simply have no transcript.
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("chat_type", chatType)
    // Descending + limit so a long transcript drops its OLDEST turns. Ordering
    // ascending applied the cap to the wrong end: once an athlete passed
    // HISTORY_LIMIT messages, every reload showed the first hundred turns they
    // ever sent and nothing since, with new turns vanishing on refresh.
    // Reversed below so the page still renders them oldest-first.
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

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
  return ((data ?? []) as StoredChatMessage[])
    .slice()
    .reverse()
    .map((row) => ({
      ...row,
      role: row.role === "assistant" ? "bot" : row.role,
    }));
}