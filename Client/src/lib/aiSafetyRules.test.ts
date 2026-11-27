/**
 * Server-side AI rules for young athletes and disordered eating (bug hunt v4,
 * V4-03, 16 Nov 2026), and the injury score's label (V4-04).
 *
 * The OPERATOR RULES in both edge functions covered diagnosis, severe pain,
 * self-harm, injuries and allergies, and nothing about users under 18, eating
 * disorders, weight cutting, a calorie floor or supplements, in an app whose
 * onboarding age slider starts at 12. The rules now come from one shared block
 * that both functions put inside their OPERATOR RULES, where nothing a request
 * sends can remove them (SAFETY_PRECEDENCE). Nothing here calls OpenAI: this
 * pins the rules and where they sit.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const functionsDir = join(__dirname, "..", "..", "supabase", "functions");

const read = (file: string) => {
  const path = join(functionsDir, file);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

const rules = read("_shared/safetyRules.ts");
const chat = read("ai-chat/index.ts");
const complete = read("ai-complete/index.ts");

/** The body of a `const NAME = \`...\`.trim();` block in a function file. */
function block(source: string, name: string): string {
  return source.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`\\.trim\\(\\);`))?.[1] ?? "";
}

describe("V4-03: rules for under-18s and disordered eating", () => {
  it("reads both functions", () => {
    // Guards the parsing below: an empty block would make every check vacuous.
    expect(block(chat, "SAFETY_CORE")).toContain("OPERATOR RULES");
    expect(block(complete, "SAFETY_CORE")).toContain("OPERATOR RULES");
  });

  it.each([
    ["athletes under 18", /under 18/i],
    ["an unknown age, treated as under 18", /age is not known/i],
    ["no calorie deficit or weight cutting for minors", /calorie deficit[\s\S]*weight cutting/i],
    ["no supplements for minors", /supplements[\s\S]*creatine/i],
    ["substances banned in sport", /banned in sport/i],
    ["involving a parent or guardian, a coach or a doctor", /parent or guardian[\s\S]*coach[\s\S]*doctor/i],
    ["disordered eating", /disordered eating/i],
    ["no restrictive plan when eating may be disordered", /restrictive meal plan/i],
    ["a calorie floor for adults", /below 1,500 kcal/],
    ["a request can't relax them", /never relaxes these rules/i],
  ])("cover %s", (_name, pattern) => {
    expect(rules).toMatch(pattern);
  });

  it.each([
    ["ai-chat", chat],
    ["ai-complete", complete],
  ])("%s puts the shared rules inside its OPERATOR RULES", (_name, source) => {
    expect(source).toContain('import { YOUTH_AND_EATING_RULES } from "../_shared/safetyRules.ts";');
    expect(block(source, "SAFETY_CORE")).toContain("${YOUTH_AND_EATING_RULES}");
  });
});

describe("V4-04: the injury score is not a measurement", () => {
  it("ai-chat tells the model a check-in's injury_risk is a score from self-ratings", () => {
    expect(block(chat, "DATA_USAGE_GUIDANCE")).toMatch(
      /injury_risk[\s\S]*not a measured or validated injury prediction/
    );
  });
});
