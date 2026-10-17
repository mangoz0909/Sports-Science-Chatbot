import { cleanJsonResponse } from "./aiJson";

/*
 * Sports Match renders the model's reply as Markdown, but gpt-4o-mini answers
 * the "top 5 / match percentage / explanation" brief as JSON often enough to
 * matter — the call runs at temperature 0.7, so one click could come back as
 * Markdown and the next as a JSON object, which the result card printed brace
 * by brace. The prompt now asks for Markdown explicitly; this is the backstop
 * for when the model answers in JSON anyway. It is kept dependency free so the
 * rules can be tested without the page.
 */

type JsonRecord = Record<string, unknown>;

// Fields that name the sport an item is about, most specific first. Compared
// after normaliseKey, because the model writes "sport", "Sport" and
// "sport_name" interchangeably, often echoing the prompt's own wording.
const NAME_KEYS = ["sport", "sportname", "name", "title"];

// "match_percentage", "matchPercent", "percentage" and the like. Only used when
// the value actually reads as a percentage, so a "why_it_matches" sentence
// stays text.
const PERCENT_KEY = /match|percent/i;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** The key holding the sport's name, if this object describes one sport. */
function nameKeyOf(record: JsonRecord): string | undefined {
  for (const wanted of NAME_KEYS) {
    const key = Object.keys(record).find(
      (candidate) =>
        normaliseKey(candidate) === wanted &&
        typeof record[candidate] === "string" &&
        (record[candidate] as string).trim()
    );
    if (key) return key;
  }
  return undefined;
}

function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasContent);
  if (isRecord(value)) return Object.values(value).some(hasContent);
  return true;
}

/** "top_5_recommended_sports" / "nextStep" → "Top 5 recommended sports" / "Next step". */
function humanize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function asPercent(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    // 0.85 and 85 both mean 85%.
    return `${Math.round(value > 0 && value < 1 ? value * 100 : value)}%`;
  }

  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{1,3}(?:\.\d+)?)\s*%?$/);
    if (match) return `${match[1]}%`;
  }

  return null;
}

function joinSentences(parts: string[]): string {
  return parts
    .map((part, index) =>
      index < parts.length - 1 && !/[.!?:]$/.test(part) ? `${part}.` : part
    )
    .join(" ");
}

function inlineText(value: unknown): string {
  if (Array.isArray(value)) return value.filter(hasContent).map(inlineText).join(", ");
  if (isRecord(value)) return itemLine(value);
  return String(value).trim();
}

/** One recommendation as "**Tennis** — 92% match: why it fits." */
function itemLine(item: JsonRecord): string {
  const nameKey = nameKeyOf(item);
  const percentKey = Object.keys(item).find(
    (key) => key !== nameKey && PERCENT_KEY.test(key) && asPercent(item[key]) !== null
  );

  const head = [
    nameKey ? `**${(item[nameKey] as string).trim()}**` : "",
    percentKey ? `${asPercent(item[percentKey])} match` : "",
  ]
    .filter(Boolean)
    .join(" — ");

  // The first remaining field is the explanation; anything after it keeps its
  // label so a stray "next_step" inside an item still reads as one.
  const body = joinSentences(
    Object.entries(item)
      .filter(([key, value]) => key !== nameKey && key !== percentKey && hasContent(value))
      .map(([key, value], index) =>
        index === 0 ? inlineText(value) : `${humanize(key)}: ${inlineText(value)}`
      )
  );

  return [head, body].filter(Boolean).join(": ");
}

// A single recommendation rather than a group of sections.
function isItem(record: JsonRecord): boolean {
  return (
    nameKeyOf(record) !== undefined ||
    Object.values(record).every((value) => !Array.isArray(value) && !isRecord(value))
  );
}

function writeSection(value: unknown, heading: string | null, depth: number, lines: string[]) {
  if (!hasContent(value)) return;

  if (heading) lines.push(`${depth === 0 ? "##" : "###"} ${heading}`);

  if (Array.isArray(value)) {
    value.filter(hasContent).forEach((item, index) => {
      lines.push(isRecord(item) ? `${index + 1}. ${itemLine(item)}` : `- ${inlineText(item)}`);
    });
    return;
  }

  // The top level is always split into sections, even when it is flat:
  // {"next_step": "..."} should keep its heading.
  if (isRecord(value) && (!heading || !isItem(value))) {
    for (const [key, child] of Object.entries(value)) {
      writeSection(child, humanize(key), heading ? depth + 1 : depth, lines);
    }
    return;
  }

  lines.push(inlineText(value));
}

function jsonToMarkdown(value: unknown): string {
  // {"response": "## Top 5 sports ..."} is Markdown in a wrapper, not data.
  if (isRecord(value)) {
    const values = Object.values(value);
    const only = values.length === 1 ? values[0] : undefined;
    if (typeof only === "string") return only.trim();
  }

  const lines: string[] = [];
  writeSection(value, null, 0, lines);
  return lines.join("\n");
}

function parseJson(text: string): unknown {
  const candidate = cleanJsonResponse(text);
  if (!/^[[{]/.test(candidate)) return undefined;

  try {
    const value: unknown = JSON.parse(candidate);
    return typeof value === "object" && value !== null ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The model's Sports Match reply as Markdown the result card can render.
 *
 * Markdown passes through. A fenced block that holds JSON is rebuilt as
 * headings and numbered lines; any other fence just loses its ``` lines. A
 * bare JSON answer — optionally after a lead-in sentence — is rebuilt the same
 * way, but only when it is an object or a list of objects, so a Markdown line
 * that happens to start with "[" is never mistaken for data.
 */
export function matchResponseToMarkdown(raw: string): string {
  const unfenced = raw
    .replace(/```[\w-]*[^\S\n]*\n?([\s\S]*?)```/g, (_block, body: string) => {
      const parsed = parseJson(body);
      return parsed === undefined ? body.trim() : jsonToMarkdown(parsed);
    })
    // An unclosed fence (a reply cut off at the token limit) has no partner.
    .replace(/^[ \t]*```[\w-]*[ \t]*$/gm, "");

  const start = unfenced.search(/^[ \t]*[[{]/m);

  if (start !== -1) {
    const parsed = parseJson(unfenced.slice(start));

    if (isRecord(parsed) || (Array.isArray(parsed) && parsed.some(isRecord))) {
      const lead = unfenced.slice(0, start).trim();
      return [lead, jsonToMarkdown(parsed)].filter(Boolean).join("\n\n");
    }
  }

  return unfenced.trim();
}
