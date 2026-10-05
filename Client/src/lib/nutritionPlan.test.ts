import { normalizeNutritionPlan } from "./nutritionPlan";

const base = {
  summary: "Fuel for a heavy week.",
  calories: "2800 kcal",
  protein: "155g",
  carbs: "320g",
  fat: "85g",
  hydration: "3.5L",
  tip: "Sip water through practice.",
};

describe("normalizeNutritionPlan", () => {
  it("passes a well-formed plan through unchanged", () => {
    const meals = [{ meal: "Breakfast", foods: "Oats, banana", timing: "7am" }];
    expect(normalizeNutritionPlan({ ...base, meals })).toEqual({ ...base, meals });
  });

  it("joins an array of food strings instead of running them together", () => {
    const plan = normalizeNutritionPlan({
      ...base,
      meals: [{ meal: "Breakfast", foods: ["Oats", "Banana", "Milk"], timing: "7am" }],
    });
    expect(plan?.meals[0].foods).toBe("Oats, Banana, Milk");
  });

  it("flattens food objects to text so React never receives an object", () => {
    const plan = normalizeNutritionPlan({
      ...base,
      meals: [{ meal: "Lunch", foods: [{ name: "Rice", amount: "150g" }, { name: "Chicken" }], timing: 12 }],
    });
    expect(plan?.meals[0]).toEqual({ meal: "Lunch", foods: "Rice 150g, Chicken", timing: "12" });
  });

  it("drops null and food-less meals but keeps the rest", () => {
    const plan = normalizeNutritionPlan({
      ...base,
      meals: [null, { meal: "Snack" }, { foods: "Yoghurt" }],
    });
    expect(plan?.meals).toEqual([{ meal: "Meal 3", foods: "Yoghurt", timing: "" }]);
  });

  it("turns object macro values into strings", () => {
    const plan = normalizeNutritionPlan({
      ...base,
      protein: { value: 155, unit: "g" },
      meals: [{ meal: "Dinner", foods: "Salmon", timing: "7pm" }],
    });
    expect(plan?.protein).toBe("155 g");
  });

  it.each([null, [], "plan", { ...base }, { ...base, meals: [] }, { ...base, meals: [null] }])(
    "returns null for an unusable reply (%j)",
    (value) => {
      expect(normalizeNutritionPlan(value)).toBeNull();
    }
  );
});
