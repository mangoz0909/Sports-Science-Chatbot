/**
 * Per-meal macros and meal grouping for the nutrition page.
 *
 * `lib/nutritionPlan.ts` strips everything but meal/foods/timing, so the page
 * re-reads the raw reply here and attaches optional numeric macros. Plans saved
 * before this existed (no macros, with `timing`) still normalise: macros are
 * simply undefined and the donut is hidden.
 */
import { normalizeNutritionPlan, type MealItem, type NutritionPlan } from "../../lib/nutritionPlan";

export type MealMacros = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type RichMeal = MealItem & MealMacros;
export type RichNutritionPlan = Omit<NutritionPlan, "meals"> & { meals: RichMeal[] };

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
  }
  if (typeof value === "string") {
    const match = value.match(/\d+(?:\.\d+)?/);
    if (match) return Math.round(parseFloat(match[0]));
  }
  return undefined;
}

function hasFoods(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const foods = (value as Record<string, unknown>).foods;
  if (foods === null || foods === undefined) return false;
  if (typeof foods === "string") return foods.trim() !== "";
  if (Array.isArray(foods)) return foods.length > 0;
  return true;
}

/** Normalises a raw or saved plan and keeps any per-meal macros it carries. */
export function normalizeRichPlan(raw: unknown): RichNutritionPlan | null {
  const base = normalizeNutritionPlan(raw);
  if (!base) return null;

  const rawMeals = (raw as { meals: unknown[] }).meals.filter(hasFoods);

  const meals = base.meals.map((meal, i): RichMeal => {
    const source = rawMeals[i];
    if (!source) return meal;
    const rich: RichMeal = { ...meal };
    const calories = toNumber(source.calories);
    const protein = toNumber(source.protein);
    const carbs = toNumber(source.carbs);
    const fat = toNumber(source.fat);
    if (calories !== undefined) rich.calories = calories;
    if (protein !== undefined) rich.protein = protein;
    if (carbs !== undefined) rich.carbs = carbs;
    if (fat !== undefined) rich.fat = fat;
    return rich;
  });

  return { ...base, meals };
}

export type MainKind = "breakfast" | "lunch" | "dinner";

export function mainKindOf(name: string): MainKind | null {
  const n = name.toLowerCase();
  if (/pre[-\s]?workout|post[-\s]?workout|snack/.test(n)) return null;
  if (/breakfast/.test(n)) return "breakfast";
  if (/lunch/.test(n)) return "lunch";
  if (/dinner|supper/.test(n)) return "dinner";
  return null;
}

/**
 * Breakfast, lunch and dinner (first of each) go in the main row; everything
 * else — pre/post-workout, snacks, duplicates — goes in the extras row.
 */
export function groupMeals(meals: RichMeal[]): {
  main: { kind: MainKind; meal: RichMeal }[];
  extras: RichMeal[];
} {
  const found = new Map<MainKind, RichMeal>();
  const extras: RichMeal[] = [];

  for (const meal of meals) {
    const kind = mainKindOf(meal.meal);
    if (kind && !found.has(kind)) found.set(kind, meal);
    else extras.push(meal);
  }

  const order: MainKind[] = ["breakfast", "lunch", "dinner"];
  const main = order.flatMap((kind) => {
    const meal = found.get(kind);
    return meal ? [{ kind, meal }] : [];
  });

  return { main, extras };
}

/** Splits "Oats (80g, dry), banana; milk" into separate foods. */
export function splitFoods(foods: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of foods) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";" || ch === "\n") && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);

  return parts
    .map((p) => p.trim().replace(/^(?:\d+[.)]|[-•*])\s+/, "").replace(/^and\s+/i, ""))
    .filter(Boolean);
}

export function dismissKey(userId: string | null, date: string): string {
  return `nutrition-note-dismissed:${userId ?? "anon"}:${date}`;
}

export function localDateKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
