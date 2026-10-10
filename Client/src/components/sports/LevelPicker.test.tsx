import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import LevelPicker, { Level, PREFERENCE_SCALES, levelToScore } from "./LevelPicker";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Harness({ start = 3 }: { start?: Level }) {
  const [v, setV] = useState<Level>(start);
  return <LevelPicker scale={PREFERENCE_SCALES.intensity} value={v} onChange={setV} />;
}

let host: HTMLDivElement;
let root: Root;

const radios = () => Array.from(host.querySelectorAll<HTMLElement>('[role="radio"]'));
const checked = () => radios().findIndex((r) => r.getAttribute("aria-checked") === "true") + 1;
const group = () => host.querySelector<HTMLElement>('[role="radiogroup"]')!;
const key = (k: string) =>
  act(() => {
    radios()[checked() - 1]!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

function mount(start: Level = 3) {
  act(() => root.render(<Harness start={start} />));
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("LevelPicker", () => {
  it("maps 5 levels onto the 1-10 prompt scale", () => {
    expect([1, 2, 3, 4, 5].map(levelToScore)).toEqual([1, 3, 6, 8, 10]);
  });

  it("is a labelled radiogroup with one checked radio", () => {
    mount();
    expect(group().getAttribute("aria-label")).toBe("Intensity");
    expect(radios()).toHaveLength(5);
    expect(checked()).toBe(3);
    expect(radios()[2]!.getAttribute("aria-label")).toBe("Intensity 3 of 5, moderate");
  });

  it("selects on click and shows the label", () => {
    mount();
    act(() => radios()[4]!.click());
    expect(checked()).toBe(5);
    expect(host.textContent).toContain("all out");
  });

  it("moves with arrow keys and clamps at the ends", () => {
    mount(5);
    key("ArrowRight");
    expect(checked()).toBe(5);
    key("ArrowLeft");
    expect(checked()).toBe(4);
    key("Home");
    expect(checked()).toBe(1);
    key("ArrowUp");
    expect(checked()).toBe(1);
    key("End");
    expect(checked()).toBe(5);
  });

  it("does not fire onChange when the level does not change", () => {
    const calls: Level[] = [];
    act(() => root.render(<LevelPicker scale={PREFERENCE_SCALES.intensity} value={5} onChange={(level) => calls.push(level)} />));
    act(() => radios()[4]!.click());
    act(() => {
      radios()[4]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(calls).toEqual([]);
    act(() => radios()[1]!.click());
    expect(calls).toEqual([2]);
  });
});
