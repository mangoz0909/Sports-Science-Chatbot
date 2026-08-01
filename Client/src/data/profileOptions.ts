/**
 * Shared vocabulary for the athlete profile fields.
 *
 * OnboardingSurvey and ProfilePage both write these columns. They previously
 * used different controls for the same field — a <Select> in the survey and a
 * free-text box on the profile — so a value typed on one screen could render
 * blank or fail validation on the other. Both screens now build their inputs
 * from these lists.
 */

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Elite",
] as const;

export const ACTIVITY_LEVELS = [
  "Mostly sedentary",
  "Lightly active",
  "Moderately active",
  "Very active",
  "Highly active or training twice daily",
] as const;

export const DIETARY_PREFERENCES = [
  "No specific preference",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Halal",
  "Kosher",
  "Other",
] as const;

export const COOKING_ACCESS_OPTIONS = [
  "School dining hall only",
  "Dining hall and microwave",
  "Limited kitchen access",
  "Full kitchen access",
] as const;

/** Numeric ranges enforced by the survey, mirrored by the profile inputs. */
export const NUMERIC_RANGES = {
  age: { min: 10, max: 100 },
  height_cm: { min: 100, max: 250 },
  weight_kg: { min: 30, max: 300 },
  training_days: { min: 0, max: 7 },
  meals_per_day: { min: 1, max: 10 },
} as const;

/**
 * Coerces a value loaded from Postgres into the string the forms expect.
 *
 * The survey submits every field as text, but if the underlying column is
 * numeric Postgres coerces on write and PostgREST hands back a number on read.
 * That number then reached `.trim()` on a retake and threw. Normalising here
 * keeps the forms working whatever the column types turn out to be.
 */
export function toFormString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/**
 * True when `value` can be shown in a <Select> built from `options`. MUI renders
 * an out-of-range value as an empty box, silently hiding what the user saved.
 */
export function isKnownOption(
  value: string,
  options: readonly string[]
): boolean {
  return options.includes(value);
}
