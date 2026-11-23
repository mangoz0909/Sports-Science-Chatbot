import { calculateInjuryRisk, calculateReadiness, calculateRecovery, getAIAdvice, type CheckInData } from "./checkInScores";
import { exampleCheckIn } from "../components/home/heroExample";
import { demoNutritionPlan } from "../components/nutrition/demoPlan";

const base: CheckInData = {
  sleepHours: 7, sleepQuality: 7, energy: 7, soreness: 3, fatigue: 4, stress: 4, mood: 7,
  hydration: 7, nutrition: 7, trainingIntensity: 5, painLevel: 1, notes: "",
};

describe("check-in scores", () => {
  test("readiness spans 0 to 100 at the ends of the sliders", () => {
    const worst: CheckInData = { ...base, sleepQuality: 1, energy: 1, mood: 1, hydration: 1, nutrition: 1, soreness: 10, fatigue: 10, stress: 10, painLevel: 10 };
    const best: CheckInData = { ...base, sleepQuality: 10, energy: 10, mood: 10, hydration: 10, nutrition: 10, soreness: 1, fatigue: 1, stress: 1, painLevel: 0 };
    expect(calculateReadiness(worst)).toBe(0);
    expect(calculateReadiness(best)).toBe(100);
  });

  test("the default check-in keeps the scores it had before the formulas moved here", () => {
    expect([calculateReadiness(base), calculateInjuryRisk(base), calculateRecovery(base)]).toEqual([71, 20, 80]);
  });

  test("high pain outranks every other piece of advice", () => {
    expect(getAIAdvice({ ...base, painLevel: 7 })).toMatch(/^High pain reported/);
  });

  test("the landing page starts on the app's own result", () => {
    expect(calculateReadiness(exampleCheckIn)).toBe(68);
    expect(getAIAdvice(exampleCheckIn)).toMatch(/^You are in a moderate training zone/);
  });

  test("the guest nutrition plan adds up", () => {
    expect(demoNutritionPlan).toMatchObject({ calories: "2534 kcal", protein: "148g", carbs: "328g", fat: "70g" });
    for (const meal of demoNutritionPlan!.meals) {
      expect(meal.calories).toBe(meal.protein! * 4 + meal.carbs! * 4 + meal.fat! * 9);
    }
  });
});
