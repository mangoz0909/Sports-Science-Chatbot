/**
 * The AI chat's safety line and its example questions (bug hunt v4, 16 Nov 2026).
 *
 * V4-02: the chat's only safety text ("For emergencies, contact local services
 * or a trusted adult immediately") sat in the side panel, which is
 * display:none at 640px and below, so phone users never saw it, and nothing in
 * the chat said its answers are not medical advice. The line now sits in the
 * composer, which is on screen at every width. jsdom has no layout, so this
 * checks where the line is in the page; the 390 and 1440 px check is the
 * Playwright probe in the fix round's evidence folder.
 *
 * V4-13: the example questions were <li role="button">, which strips the list
 * semantics screen readers announce (axe "list", serious). Each item is now a
 * list item holding a real button.
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import UnifiedAIHome from "./SportsHome";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ session: null, loading: false }) }));
vi.mock("../lib/supabaseClient", () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock("../components/Seo", () => ({ default: () => null, breadcrumbs: () => ({}) }));
vi.mock("../services/chatService", () => ({
  getChatHistory: vi.fn().mockResolvedValue([]),
  clearChatHistory: vi.fn(),
  saveChatExchange: vi.fn(),
}));
vi.mock("../services/preferencesService", () => ({ getUserPreferences: vi.fn() }));
vi.mock("../services/checkinService", () => ({ getLatestCheckIn: vi.fn(), isCheckInFromToday: vi.fn() }));

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;
let root: Root;

beforeAll(() => {
  // AiChatHome measures the page chrome with a ResizeObserver and scrolls its
  // message list; jsdom implements neither.
  vi.stubGlobal("ResizeObserver", NoopResizeObserver);
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(async () => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<MemoryRouter><UnifiedAIHome /></MemoryRouter>));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("V4-02: the chat's safety line", () => {
  it("sits in the composer, not in the side panel that phones hide", () => {
    const composer = host.querySelector("form.chat-input");
    expect(composer).not.toBeNull();
    expect(composer!.textContent).toContain("Educational only, not medical advice.");
    expect(composer!.textContent).toContain(
      "For emergencies, contact local services or a trusted adult immediately."
    );
  });

  it("is said once, so desktop does not show the emergency line twice", () => {
    const count = host.textContent!.split("For emergencies, contact local services").length - 1;
    expect(count).toBe(1);
    expect(host.querySelector(".side-panel")!.textContent).not.toContain("For emergencies");
  });
});

describe("V4-13: example questions", () => {
  it("keep the list semantics and use real buttons", () => {
    const list = host.querySelector(".side-panel ul")!;
    const items = Array.from(list.children);
    expect(items).toHaveLength(6);
    expect(list.querySelectorAll('[role="button"]')).toHaveLength(0);
    for (const item of items) {
      expect(item.tagName).toBe("LI");
      expect(item.querySelector("button[type='button']")?.textContent).toBe(item.textContent);
    }
  });

  it("still ask the question when pressed (a guest is told to sign in)", async () => {
    const button = host.querySelector<HTMLButtonElement>(".side-panel ul li button");
    expect(button).not.toBeNull();
    await act(async () => button!.click());
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "Sign in to start chatting with the AI."
    );
  });
});
