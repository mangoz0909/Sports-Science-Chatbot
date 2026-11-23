# AI Output Format Variance: Parser Pattern

## Problem
You prompt an AI model: "Answer in Markdown, never JSON." Sometimes it complies; sometimes it returns JSON anyway. The raw response lands in your UI, breaking the layout.

## Root cause
AI models are not deterministic on format despite instructions. In-context variance, model updates, and prompt phrasing all shift behavior unpredictably.

## Solution: Client-side normalization
Add a pure parser function that:
1. Detects which format the response actually is (JSON, Markdown, plain text, etc.)
2. Converts to a canonical format (e.g., always Markdown for display)
3. Returns the normalized result or throws with a clear error message

## Example structure
```typescript
function matchResponseToMarkdown(raw: string): string {
  // If it's a JSON code block, extract and parse
  const jsonMatch = raw.match(/^```json\n([\s\S]*?)\n```$/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[1]);
      return formatJsonAsMarkdown(obj); // Convert parsed JSON to Markdown
    } catch (e) {
      throw new Error("Malformed JSON in response");
    }
  }
  
  // If it's already Markdown, return as-is
  if (raw.startsWith("##") || raw.includes("**")) {
    return raw;
  }
  
  // Fallback: plain text → Markdown
  return `Raw response:\n\n${raw}`;
}
```

## Testing strategy
1. Stub the API response in the page (no real backend call).
2. Pass samples of each format the model might send to the parser.
3. Verify the output is canonical and renders correctly.
4. Test with malformed input (incomplete JSON, nested code blocks, etc.).
