/**
 * The chat transcript must come back as the athlete's MOST RECENT turns.
 *
 * getChatHistory ordered ascending and then limited, which applies the cap to
 * the wrong end: past the limit, every reload showed the first hundred turns
 * the athlete ever sent and nothing since — new messages appeared during the
 * session and vanished on refresh.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryCall = { column: string; ascending: boolean; limit: number };

const calls: QueryCall[] = [];
let rows: Array<Record<string, unknown>> = [];

vi.mock("../lib/supabaseClient", () => {
  const builder: Record<string, unknown> = {};
  let order: { column: string; ascending: boolean } = {
    column: "",
    ascending: true,
  };

  builder.select = () => builder;
  builder.eq = () => builder;
  builder.order = (column: string, options: { ascending: boolean }) => {
    order = { column, ascending: options.ascending };
    return builder;
  };
  builder.limit = (count: number) => {
    calls.push({ ...order, limit: count });

    // Mirror Postgres: order first, then cut. Ascending keeps the oldest rows,
    // descending keeps the newest.
    const sorted = [...rows].sort((a, b) =>
      order.ascending
        ? String(a.created_at).localeCompare(String(b.created_at))
        : String(b.created_at).localeCompare(String(a.created_at))
    );

    return Promise.resolve({ data: sorted.slice(0, count), error: null });
  };

  return {
    supabase: {
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: "athlete-1" } }, error: null }),
      },
      from: () => builder,
    },
  };
});

const { getChatHistory } = await import("./chatService");

/** 150 turns, oldest first, so the 100-row cap has to drop something. */
function transcript(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `m${index}`,
    user_id: "athlete-1",
    chat_type: "sports",
    role: index % 2 === 0 ? "user" : "assistant",
    content: `turn ${index}`,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
  }));
}

describe("getChatHistory", () => {
  beforeEach(() => {
    calls.length = 0;
    rows = transcript(150);
  });

  it("asks the database for the newest rows, not the oldest", async () => {
    await getChatHistory("sports");

    expect(calls).toEqual([
      { column: "created_at", ascending: false, limit: 100 },
    ]);
  });

  it("keeps the most recent turns when the transcript is over the limit", async () => {
    const history = await getChatHistory("sports");

    expect(history).toHaveLength(100);
    // turns 50..149 survive; 0..49 are the ones dropped.
    expect(history[0].content).toBe("turn 50");
    expect(history[history.length - 1].content).toBe("turn 149");
  });

  it("still renders oldest-first so the conversation reads in order", async () => {
    const history = await getChatHistory("sports");
    const stamps = history.map((row) => row.created_at);

    expect([...stamps].sort()).toEqual(stamps);
  });

  it("returns a short transcript whole", async () => {
    rows = transcript(4);

    const history = await getChatHistory("sports");

    expect(history.map((row) => row.content)).toEqual([
      "turn 0",
      "turn 1",
      "turn 2",
      "turn 3",
    ]);
  });

  it("maps stored assistant rows back to the bot role the UI expects", async () => {
    rows = transcript(2);

    const history = await getChatHistory("sports");

    expect(history.map((row) => row.role)).toEqual(["user", "bot"]);
  });
});
