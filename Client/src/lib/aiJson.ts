/**
 * Turns a model's raw reply into text JSON.parse can accept.
 *
 * Shared by the workout and nutrition pages: both ask for strict JSON, and
 * both get prose wrapped around it often enough to matter. Kept dependency
 * free so the parsing rules can be tested without a page component.
 */
export function cleanJsonResponse(responseText: string): string {
  const withoutFences = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // The model occasionally wraps the payload in a sentence ("Here is your
  // plan: {...} Let me know..."), which fails JSON.parse outright. Falling
  // back to the outermost JSON value salvages those responses.
  //
  // Object and array are both handled because the two callers want different
  // shapes: the daily workout is one object, and a multi-day plan is an array.
  // Whichever bracket opens first is the outer value — anchoring on "[" alone
  // would reach past a workout object and return its nested exercises array.
  const firstObject = withoutFences.indexOf("{");
  const firstArray = withoutFences.indexOf("[");

  const outermost =
    firstArray !== -1 && (firstObject === -1 || firstArray < firstObject)
      ? { start: firstArray, closer: "]" }
      : firstObject !== -1
        ? { start: firstObject, closer: "}" }
        : null;

  if (outermost) {
    const end = withoutFences.lastIndexOf(outermost.closer);

    if (end > outermost.start) {
      return withoutFences.slice(outermost.start, end + 1);
    }
  }

  return withoutFences;
}
