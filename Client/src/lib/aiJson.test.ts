import { cleanJsonResponse } from "./aiJson";

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

  // The daily workout is a single object whose "exercises" field is an array.
  // Salvaging on "[" alone would return that inner array and lose the plan.
  describe("single daily workout object", () => {
    const workout =
      '{"day":"Monday","focus":"Lower body","exercises":[{"name":"Squat"}]}';

    it("passes a bare JSON object through unchanged", () => {
      expect(JSON.parse(cleanJsonResponse(workout))).toMatchObject({
        day: "Monday",
      });
    });

    it("salvages an object the model wrapped in prose", () => {
      const wrapped = `Here is today's session:\n${workout}\nGood luck!`;
      expect(JSON.parse(cleanJsonResponse(wrapped))).toMatchObject({
        focus: "Lower body",
      });
    });

    it("keeps the whole object rather than its nested exercises array", () => {
      const parsed = JSON.parse(cleanJsonResponse(`Plan: ${workout} done`));
      expect(Array.isArray(parsed)).toBe(false);
      expect(parsed.exercises).toHaveLength(1);
    });

    it("strips fences and trailing commentary around an object", () => {
      const fenced = "```json\n" + workout + "\n```\nLet me know how it goes.";
      expect(JSON.parse(cleanJsonResponse(fenced))).toMatchObject({
        day: "Monday",
      });
    });
  });
});
