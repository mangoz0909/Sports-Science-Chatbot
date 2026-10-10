import { describe, expect, it } from "vitest";
import { groupMeals, normalizeRichPlan, splitFoods } from "./mealMacros";

const base = { summary: "s", calories: "2500 kcal", protein: "150g", carbs: "300g", fat: "80g", hydration: "3L", tip: "t" };

describe("normalizeRichPlan", () => {
  it("keeps per-meal macros and tolerates old plans with timing", () => {
    const plan = normalizeRichPlan({
      ...base,
      meals: [
        { meal: "Breakfast", foods: "Oats, milk", timing: "7am", calories: 600, protein: "30g", carbs: 70, fat: 15 },
        { meal: "Skipped", foods: "" },
        { meal: "Lunch", foods: ["Rice", "Chicken"] },
      ],
    });
    expect(plan?.meals[0]).toMatchObject({ calories: 600, protein: 30, carbs: 70, fat: 15 });
    expect(plan?.meals[1]?.meal).toBe("Lunch");
    expect(plan?.meals[1]?.protein).toBeUndefined();
  });

  it("returns null for unusable input", () => {
    expect(normalizeRichPlan({ meals: [] })).toBeNull();
  });
});

describe("groupMeals", () => {
  it("separates main meals from pre/post and snacks", () => {
    const meals = ["Dinner", "Pre-workout snack", "Breakfast", "Post-workout", "Lunch"].map((meal) => ({
      meal,
      foods: "x",
      timing: "",
    }));
    const { main, extras } = groupMeals(meals);
    expect(main.map((m) => m.kind)).toEqual(["breakfast", "lunch", "dinner"]);
    expect(extras.map((m) => m.meal)).toEqual(["Pre-workout snack", "Post-workout"]);
  });
});

describe("splitFoods", () => {
  it("does not split inside parentheses", () => {
    expect(splitFoods("Oats (80g, dry), banana; 2. milk")).toEqual(["Oats (80g, dry)", "banana", "milk"]);
  });
});
