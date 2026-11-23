// The prompt asks for Markdown, but the model still answers in JSON now
// and then; that used to land in the card as raw braces.
const result =
  typeof data?.result === "string" ? matchResponseToMarkdown(data.result) : "";
if (!result) {
  throw new Error("The AI returned an empty response.");
}

setAiMatches(result);