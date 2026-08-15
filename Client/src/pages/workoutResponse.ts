/**
 * Helpers for turning the AI's raw workout-plan text into parseable JSON.
 *
 * Kept in its own dependency-free module so the parsing rules can be tested
 * without pulling in the whole page component.
 */
export function cleanJsonResponse(responseText: string): string {
  const withoutFences = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // The model occasionally wraps the array in a sentence ("Here is your
  // plan: [...] Let me know..."), which fails JSON.parse outright. Falling
  // back to the outermost array salvages those responses.
  const start = withoutFences.indexOf("[");
  const end = withoutFences.lastIndexOf("]");

  if (start !== -1 && end > start) {
    return withoutFences.slice(start, end + 1);
  }

  return withoutFences;
}
