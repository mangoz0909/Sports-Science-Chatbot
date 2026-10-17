/**
 * Sports Match showed raw JSON on a re-run.
 *
 * The first "Generate AI Matches" came back as Markdown and rendered as cards;
 * pressing it again could come back as a JSON object, which the card printed
 * line by line, braces and all.
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { vi } from "vitest";
import { SportsFinder } from "./SportsListPage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ session: { user: { id: "athlete" } }, loading: false }) }));
vi.mock("../lib/supabaseClient", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("../services/preferencesService", () => ({ getUserPreferences: vi.fn().mockResolvedValue({ primary_sport: "Tennis" }) }));

const markdownReply = "## Top 5 sports\n1. **Tennis** — 92% match: Builds on your racket skills.";
const jsonReply = "```json\n" + JSON.stringify({
  top_5_recommended_sports: [{ sport: "Badminton", match_percentage: 88, explanation: "Fast footwork, little contact." }],
  next_step: "Book a beginner session this week.",
}, null, 2) + "\n```";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.clearAllMocks();
});

const bold = (text: string) => Array.from(host.querySelectorAll("span")).some((span) => span.textContent === text);

it("renders a JSON answer on the second run as formatted matches, not raw JSON", async () => {
  mocks.invoke
    .mockResolvedValueOnce({ data: { result: markdownReply }, error: null })
    .mockResolvedValueOnce({ data: { result: jsonReply }, error: null });

  await act(async () => root.render(<SportsFinder />));
  const button = Array.from(host.querySelectorAll("button")).find((item) => item.textContent === "Generate AI Matches")!;

  await act(async () => button.click());
  expect(bold("Tennis")).toBe(true);

  await act(async () => button.click());
  expect(bold("Badminton")).toBe(true);
  expect(host.textContent).toContain("88% match: Fast footwork, little contact.");
  expect(host.textContent).toContain("Next step");
  expect(host.textContent).not.toMatch(/[{}"]|```|match_percentage/);
  expect(mocks.invoke).toHaveBeenLastCalledWith("ai-complete", expect.objectContaining({
    body: expect.objectContaining({ task: "sports_match", prompt: expect.stringContaining("never JSON") }),
  }));
});
