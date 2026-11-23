import { normalizeRichPlan } from "./mealMacros";

/*
 * What a signed-out visitor sees on the Health page, in the same shape as a
 * generated plan. Placeholder data like the demo dashboard's (a tennis player),
 * under the same demo banner; nobody's real plan.
 */
export const demoNutritionPlan = normalizeRichPlan({
  summary:
    "Example plan for a tennis player on a moderate training day: more carbs around practice, protein spread across the day.",
  hydration: "2.8 L",
  meals: [
    { meal: "Breakfast", foods: "Oats with milk and banana, Greek yogurt, two eggs", calories: 584, protein: 32, carbs: 78, fat: 16 },
    { meal: "Pre-practice snack", foods: "Banana, granola bar", calories: 240, protein: 6, carbs: 45, fat: 4 },
    { meal: "Lunch", foods: "Chicken and rice bowl, black beans, mixed vegetables", calories: 670, protein: 42, carbs: 85, fat: 18 },
    { meal: "Post-practice snack", foods: "Chocolate milk, turkey sandwich", calories: 384, protein: 28, carbs: 50, fat: 8 },
    { meal: "Dinner", foods: "Salmon, roast potatoes, green beans, bread roll", calories: 656, protein: 40, carbs: 70, fat: 24 },
  ],
  tip: "Drink steadily through the day instead of catching up after practice.",
});
