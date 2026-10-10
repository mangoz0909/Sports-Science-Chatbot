/**
 * Shapes an AI nutrition reply (or a cached copy of one) into what the page
 * renders.
 *
 * The page used to render `meal.foods` and the macro fields raw. The model
 * regularly answers "foods" with an array — strings ran together
 * ("OatsBananaMilk"), objects threw "Objects are not valid as a React child" —
 * and because the plan is cached for the day, the crash came back on every
 * visit until midnight. Everything here ends up a plain string.
 */

export type MealItem = {
  meal: string;
  foods: string;
  timing: string;
};

export type NutritionPlan = {
  summary: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  hydration: string;
  meals: MealItem[];
  tip: string;
};

/** Flattens whatever the model sent into readable text. */
function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    // e.g. { name: "Oats", amount: "80g" } or { value: 155, unit: "g" }
    return Object.values(value as Record<string, unknown>)
      .map(toText)
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

/** True when a raw meal would survive normalisation (it has non-empty foods). */
export function mealHasFoods(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return toText((value as Record<string, unknown>).foods) !== "";
}

function normalizeMeal(value: unknown, index: number): MealItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const foods = toText(record.foods);
  if (!foods) return null;

  return {
    meal: toText(record.meal) || `Meal ${index + 1}`,
    foods,
    timing: toText(record.timing),
  };
}

/**
 * Returns a renderable plan, or null when there is nothing usable (not an
 * object, or no meal with any foods). Callers treat null as "regenerate".
 */
export function normalizeNutritionPlan(value: unknown): NutritionPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.meals)) return null;

  const meals = record.meals
    .map(normalizeMeal)
    .filter((meal): meal is MealItem => meal !== null);

  if (meals.length === 0) return null;

  return {
    summary: toText(record.summary),
    calories: toText(record.calories),
    protein: toText(record.protein),
    carbs: toText(record.carbs),
    fat: toText(record.fat),
    hydration: toText(record.hydration),
    meals,
    tip: toText(record.tip),
  };
}
