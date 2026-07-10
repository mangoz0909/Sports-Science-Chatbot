import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { getUserPreferences } from "../services/preferencesService";
import { getLatestCheckIn } from "../services/checkinService";
import Seo from "../components/Seo";


const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-4o-mini";

async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Add REACT_APP_OPENAI_API_KEY to your Render environment variables."
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a careful sports nutrition assistant. Provide general educational guidance only, avoid diagnosis, respect allergies and dietary restrictions, and return valid JSON when requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 1400,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message ||
        `OpenAI request failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The ChatGPT model returned an empty response.");
  }

  return reply.trim();
}

type MacroItem = { label: string; value: string; unit: string };
type MealItem = { meal: string; foods: string; timing: string };
type NutritionPlan = {
  summary: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  hydration: string;
  meals: MealItem[];
  tip: string;
};

export default function NutritionPage() {
  const [plan, setPlan] = React.useState<NutritionPlan | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasGenerated = React.useRef(false);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const [prefs, checkIn] = await Promise.all([
        getUserPreferences(),
        getLatestCheckIn(),
      ]);

      const extendedPrefs = prefs as any;

      const profileText = prefs
        ? [
            `Sport: ${prefs.primary_sport || "General fitness"}`,
            `Experience: ${prefs.experience_level || "Intermediate"}`,
            `Goal: ${prefs.main_goal || "General fitness"}`,
            `Training days/week: ${prefs.training_days || "5"}`,
            `Athlete type: ${prefs.athlete_type || "General"}`,
            `Age: ${extendedPrefs.age || "Not provided"}`,
            `Height: ${extendedPrefs.height_cm ? `${extendedPrefs.height_cm} cm` : "Not provided"}`,
            `Weight: ${extendedPrefs.weight_kg ? `${extendedPrefs.weight_kg} kg` : "Not provided"}`,
            `Activity level: ${extendedPrefs.activity_level || "Not provided"}`,
            `Workout duration: ${extendedPrefs.workout_duration || "Not provided"}`,
            `Dietary preference: ${extendedPrefs.dietary_preference || "No specific preference"}`,
            `Food allergies/intolerances: ${extendedPrefs.food_allergies || "None reported"}`,
            `Foods avoided: ${extendedPrefs.foods_avoid || "None reported"}`,
            `Meals per day: ${extendedPrefs.meals_per_day || "Not provided"}`,
            `Cooking access: ${extendedPrefs.cooking_access || "Not provided"}`,
            `Injuries or restrictions: ${prefs.injury_areas || "None reported"}`,
          ].join(", ")
        : "General fitness athlete, intermediate level";

      const checkInText = checkIn
        ? `Readiness: ${checkIn.readiness_score ?? "N/A"}%, Recovery: ${checkIn.recovery_score ?? "N/A"}%, Hydration: ${checkIn.hydration ?? "N/A"}L, Training intensity today: ${checkIn.training_intensity ?? "N/A"}/10`
        : "No check-in data available";

      const prompt = `You are a professional sports nutritionist.

ATHLETE: ${profileText}
TODAY: ${checkInText}

Generate a personalised daily nutrition plan as a JSON object with exactly these fields. Never include foods that conflict with the athlete's stated allergies, intolerances, dietary preference, or foods they avoid. Do not provide medical treatment advice:
- "summary": 1-2 sentence personalised note about this nutrition plan
- "calories": daily calorie target as a string (e.g. "2800 kcal")
- "protein": daily protein target (e.g. "155g")
- "carbs": daily carbs target (e.g. "320g")
- "fat": daily fat target (e.g. "85g")
- "hydration": daily hydration target (e.g. "3.5L")
- "meals": array of 5 meal objects, each with:
  - "meal": meal name (e.g. "Breakfast", "Pre-workout snack", "Lunch", "Post-workout", "Dinner")
  - "foods": specific food examples (e.g. "Oats with banana, eggs, and milk")
  - "timing": when to eat (e.g. "7:00–8:00 AM")
- "tip": one practical nutrition tip for this athlete

Respond ONLY with valid JSON, no markdown fences, no extra text.`;

      const responseText = await callOpenAI(prompt);

      const cleaned = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned) as NutritionPlan;

      if (!Array.isArray(parsed.meals) || parsed.meals.length === 0) {
        throw new Error("The nutrition plan format was incomplete.");
      }

      setPlan(parsed);
    } catch (err: any) {
      setError(err?.message || "Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!hasGenerated.current) {
      hasGenerated.current = true;
      generatePlan();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const macros: MacroItem[] = plan
    ? [
        { label: "Calories", value: plan.calories, unit: "" },
        { label: "Protein", value: plan.protein, unit: "" },
        { label: "Carbs", value: plan.carbs, unit: "" },
        { label: "Fat", value: plan.fat, unit: "" },
        { label: "Hydration", value: plan.hydration, unit: "" },
      ]
    : [];

  const macroColors = ["#ef4444", "#0284c7", "#f59e0b", "#8b5cf6", "#06b6d4"];

  return (
    <Box>
      <Seo
        title="AI Nutrition Plan"
        description="Get a daily macro and meal plan tailored to your sport, training goals, and today's check-in data."
        path="/health/nutrition"
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={950} color="#0f172a">
            Daily Nutrition Plan
          </Typography>
          <Typography color="#64748b" fontSize={14}>
            Personalised based on your sport, goals, and today's check-in data.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          disabled={loading}
          onClick={generatePlan}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: "none", borderColor: "#cbd5e1" }}
        >
          {loading ? "Generating…" : "Regenerate"}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {loading && !plan && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={64} sx={{ borderRadius: 3 }} />
          </Grid>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={2.4} key={i}>
              <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {plan && (
        <Grid container spacing={2.5}>
          {/* AI Summary */}
          <Grid item xs={12}>
            <Box sx={{ p: "14px 18px", borderRadius: 3, bgcolor: "#ecfdf5", border: "1px solid #bbf7d0" }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <AutoAwesomeIcon sx={{ fontSize: 16, color: "#047857" }} />
                <Typography fontSize={11} fontWeight={800} letterSpacing="0.08em" textTransform="uppercase" color="#047857">
                  AI Nutritionist Note
                </Typography>
              </Stack>
              <Typography color="#064e3b" fontSize={14} lineHeight={1.75}>
                {plan.summary}
              </Typography>
            </Box>
          </Grid>

          {/* Macro targets */}
          {macros.map((macro, i) => (
            <Grid item xs={12} sm={6} md={2.4} key={macro.label}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  height: "100%",
                  "&:hover": { borderColor: "#93c5fd" },
                  transition: "border-color 0.15s ease",
                }}
              >
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: `${macroColors[i]}18`,
                      color: macroColors[i],
                      display: "grid",
                      placeItems: "center",
                      mx: "auto",
                      mb: 1,
                    }}
                  >
                    {i === 4 ? <WaterDropIcon sx={{ fontSize: 18 }} /> : i === 0 ? <LocalFireDepartmentIcon sx={{ fontSize: 18 }} /> : <RestaurantMenuIcon sx={{ fontSize: 18 }} />}
                  </Box>
                  <Typography fontWeight={950} fontSize={15} color="#0f172a">
                    {macro.value}
                  </Typography>
                  <Typography color="#64748b" fontSize={12} fontWeight={700}>
                    {macro.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Meal plan */}
          {plan.meals.map((meal) => (
            <Grid item xs={12} sm={6} key={meal.meal}>
              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", height: "100%", "&:hover": { borderColor: "#bbf7d0" }, transition: "border-color 0.15s ease" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography fontWeight={950} color="#0f172a">
                      {meal.meal}
                    </Typography>
                    <Typography fontSize={12} color="#94a3b8" fontWeight={700} sx={{ flexShrink: 0, ml: 1 }}>
                      {meal.timing}
                    </Typography>
                  </Stack>
                  <Typography color="#475569" fontSize={14} lineHeight={1.7} sx={{ mt: 0.5 }}>
                    {meal.foods}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Tip */}
          <Grid item xs={12}>
            <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "#fef3c7", border: "1px solid #fde68a" }}>
              <Typography fontWeight={950} color="#92400e" sx={{ mb: 0.5 }}>
                💡 Nutrition Tip
              </Typography>
              <Typography color="#78350f" fontSize={14} lineHeight={1.75}>
                {plan.tip}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}