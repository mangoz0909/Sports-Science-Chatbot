import { cleanJsonResponse } from "./workoutResponse";

describe("cleanJsonResponse", () => {
  const plan = '[{"type":"summary","text":"hi"},{"day":"Monday"}]';

  it("passes a bare JSON array through unchanged", () => {
    expect(JSON.parse(cleanJsonResponse(plan))).toHaveLength(2);
  });

  it("strips ```json fences", () => {
    expect(
      JSON.parse(cleanJsonResponse("```json\n" + plan + "\n```"))
    ).toHaveLength(2);
  });

  it("strips bare ``` fences", () => {
    expect(JSON.parse(cleanJsonResponse("```\n" + plan + "\n```"))).toHaveLength(
      2
    );
  });

  it("salvages an array the model wrapped in prose", () => {
    const wrapped = `Here is your plan:\n${plan}\nLet me know if you want changes.`;
    expect(JSON.parse(cleanJsonResponse(wrapped))).toHaveLength(2);
  });

  it("keeps the outermost array when days contain nested arrays", () => {
    const nested = '[{"day":"Monday","tags":["a","b"]}]';
    expect(JSON.parse(cleanJsonResponse(`Plan: ${nested} done`))).toHaveLength(
      1
    );
  });

  it("leaves unparseable text alone rather than inventing JSON", () => {
    expect(cleanJsonResponse("I cannot help with that.")).toBe(
      "I cannot help with that."
    );
  });
});
