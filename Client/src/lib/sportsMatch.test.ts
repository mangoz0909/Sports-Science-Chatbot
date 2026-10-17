import { matchResponseToMarkdown } from "./sportsMatch";

// The shape gpt-4o-mini reaches for when it answers the Sports Match brief as
// data instead of prose.
const jsonAnswer = {
  top_5_recommended_sports: [
    { sport: "Tennis", match_percentage: 92, explanation: "Builds on your racket skills." },
    { sport: "Badminton", match_percentage: "88%", explanation: "Fast footwork, little contact" },
  ],
  surprising_sport_suggestion: { sport: "Fencing", explanation: "Rewards your reaction speed." },
  next_step: "Book a beginner session this week.",
};

const expectedMarkdown = [
  "## Top 5 recommended sports",
  "1. **Tennis** — 92% match: Builds on your racket skills.",
  "2. **Badminton** — 88% match: Fast footwork, little contact",
  "## Surprising sport suggestion",
  "**Fencing**: Rewards your reaction speed.",
  "## Next step",
  "Book a beginner session this week.",
].join("\n");

describe("matchResponseToMarkdown", () => {
  it("passes a Markdown answer through unchanged", () => {
    const markdown = "## Top 5 sports\n1. **Tennis** — 92% match: Builds on your racket skills.";
    expect(matchResponseToMarkdown(`\n${markdown}\n`)).toBe(markdown);
  });

  it("rebuilds a ```json answer as headings and numbered lines", () => {
    const fenced = "```json\n" + JSON.stringify(jsonAnswer, null, 2) + "\n```";
    expect(matchResponseToMarkdown(fenced)).toBe(expectedMarkdown);
  });

  it("rebuilds bare JSON and keeps the sentence that introduced it", () => {
    const reply = `Here are your matches:\n${JSON.stringify(jsonAnswer, null, 2)}\nGood luck!`;
    expect(matchResponseToMarkdown(reply)).toBe(`Here are your matches:\n\n${expectedMarkdown}`);
  });

  it("reads keys that echo the prompt's wording", () => {
    const reply = JSON.stringify({
      "Top 5 Recommended Sports": [{ Sport: "Tennis", "Match Percentage": "92%", "Short Explanation": "Builds on your racket skills." }],
      "One Next Step": "Book a beginner session this week.",
    });
    expect(matchResponseToMarkdown(reply)).toBe(
      "## Top 5 recommended sports\n1. **Tennis** — 92% match: Builds on your racket skills.\n## One next step\nBook a beginner session this week."
    );
  });

  it("numbers a top-level list of sports", () => {
    const reply = JSON.stringify([
      { name: "Rowing", matchPercent: 0.81, reason: "Low impact on your knee" },
      { name: "Swimming", reason: "Builds your aerobic base" },
    ]);
    expect(matchResponseToMarkdown(reply)).toBe(
      "1. **Rowing** — 81% match: Low impact on your knee\n2. **Swimming**: Builds your aerobic base"
    );
  });

  it("nests wrapper objects one heading level down", () => {
    const reply = JSON.stringify({
      recommendations: { topSports: [{ sport: "Golf", match: "75" }], tips: ["Warm up", "Stretch"] },
    });
    expect(matchResponseToMarkdown(reply)).toBe(
      "## Recommendations\n### Top sports\n1. **Golf** — 75% match\n### Tips\n- Warm up\n- Stretch"
    );
  });

  it("unwraps Markdown the model put inside a JSON string", () => {
    const reply = JSON.stringify({ response: "## Top 5 sports\n1. **Tennis**" });
    expect(matchResponseToMarkdown(reply)).toBe("## Top 5 sports\n1. **Tennis**");
  });

  it("keeps a sentence about matching as text, not a percentage", () => {
    const reply = JSON.stringify({ sports: [{ sport: "Judo", why_it_matches: "You enjoy contact" }] });
    expect(matchResponseToMarkdown(reply)).toBe("## Sports\n1. **Judo**: You enjoy contact");
  });

  it("drops the fence lines around a Markdown answer", () => {
    expect(matchResponseToMarkdown("```markdown\n## Next step\nJoin a club.\n```")).toBe(
      "## Next step\nJoin a club."
    );
  });

  it("drops an unclosed fence from a reply cut off mid-answer", () => {
    expect(matchResponseToMarkdown("```\n## Next step\nJoin a")).toBe("## Next step\nJoin a");
  });

  it("does not mistake a Markdown line starting with a bracket for JSON", () => {
    // "[1]" on its own parses as JSON; it is not an answer.
    const markdown = "[1] Tennis suits you.\n## Next step\nJoin a club.";
    expect(matchResponseToMarkdown(markdown)).toBe(markdown);
  });
});
