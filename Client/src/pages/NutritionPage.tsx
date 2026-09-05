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
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

import { Link as RouterLink } from "react-router-dom";
import { getUserPreferences } from "../services/preferencesService";
import {
  getLatestCheckIn,
  getLast7CheckIns,
} from "../services/checkinService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Seo, { breadcrumbs } from "../components/Seo";
import { loadTodaysPlan, saveTodaysPlan } from "../services/planService";
import { cleanJsonResponse } from "../lib/aiJson";
import { functionErrorMessage } from "../lib/functionError";

async function callOpenAI(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-complete", {
    body: {
      prompt,
      task: "nutrition",
      maxTokens: 1400,
      temperature: 0.4,
    },
  });

  if (error) {
    throw new Error(
      await functionErrorMessage(error, "Failed to reach the AI service."),
    );
  }

  const reply = data?.result;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The AI model returned an empty response.");
  }

  return reply.trim();
}

type MacroItem = {
  label: string;
  value: string;
  unit: string;
};

type MealItem = {
  meal: string;
  foods: string;
  timing: string;
};

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
  const { session, loading: authLoading } = useAuth();

  const isLoggedIn = Boolean(session);

  const [plan, setPlan] =
    React.useState<NutritionPlan | null>(null);

  const [loading, setLoading] =
    React.useState(false);

  // Restoring an existing plan, as opposed to paying for a new one. Both hide
  // the empty page; only generating should say so on the button.
  const [restoring, setRestoring] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const [userInstructions, setUserInstructions] =
    React.useState("");

  // Supabase is the source of truth, with the browser cache as the offline
  // fallback, so today's macros are the same on every device the athlete opens
  // and are reused all day rather than regenerated.
  const userId = session?.user?.id ?? null;
  const busy = loading || restoring;

  async function generatePlan() {
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const [prefs, checkIn, last7CheckIns] =
        await Promise.all([
          getUserPreferences(),
          getLatestCheckIn(),
          getLast7CheckIns(),
        ]);

      const extendedPrefs = prefs as any;

      const profileText = prefs
        ? [
            `Sport: ${
              prefs.primary_sport ||
              "General fitness"
            }`,

            `Experience: ${
              prefs.experience_level ||
              "Intermediate"
            }`,

            `Goal: ${
              prefs.main_goal ||
              "General fitness"
            }`,

            `Training days/week: ${
              prefs.training_days || "5"
            }`,

            `Athlete type: ${
              prefs.athlete_type ||
              "General"
            }`,

            `Age: ${
              extendedPrefs.age ||
              "Not provided"
            }`,

            `Height: ${
              extendedPrefs.height_cm
                ? `${extendedPrefs.height_cm} cm`
                : "Not provided"
            }`,

            `Weight: ${
              extendedPrefs.weight_kg
                ? `${extendedPrefs.weight_kg} kg`
                : "Not provided"
            }`,

            `Activity level: ${
              extendedPrefs.activity_level ||
              "Not provided"
            }`,

            `Workout duration: ${
              extendedPrefs.workout_duration ||
              "Not provided"
            }`,

            `Dietary preference: ${
              extendedPrefs.dietary_preference ||
              "No specific preference"
            }`,

            `Food allergies/intolerances: ${
              extendedPrefs.food_allergies ||
              "None reported"
            }`,

            `Foods avoided: ${
              extendedPrefs.foods_avoid ||
              "None reported"
            }`,

            `Meals per day: ${
              extendedPrefs.meals_per_day ||
              "Not provided"
            }`,

            `Cooking access: ${
              extendedPrefs.cooking_access ||
              "Not provided"
            }`,

            `Injuries or restrictions: ${
              prefs.injury_areas ||
              "None reported"
            }`,
          ].join(", ")
        : "General fitness athlete, intermediate level";

      const checkInText = checkIn
        ? `Readiness: ${
            checkIn.readiness_score ?? "N/A"
          }%, Recovery: ${
            checkIn.recovery_score ?? "N/A"
          }%, Hydration: ${
            checkIn.hydration ?? "N/A"
          }L, Training intensity today: ${
            checkIn.training_intensity ?? "N/A"
          }/10`
        : "No check-in data available";

      const weeklyTrendText =
        last7CheckIns &&
        last7CheckIns.length > 0
          ? last7CheckIns
              .map((item) => {
                return [
                  item.checkin_date ||
                    item.created_at ||
                    "Unknown date",

                  `Readiness ${
                    item.readiness_score ??
                    "N/A"
                  }%`,

                  `Recovery ${
                    item.recovery_score ??
                    "N/A"
                  }%`,

                  `Hydration ${
                    item.hydration ??
                    "N/A"
                  }`,

                  `Nutrition ${
                    item.nutrition ??
                    "N/A"
                  }`,

                  `Sleep ${
                    item.sleep_hours ??
                    "N/A"
                  }h`,

                  `Fatigue ${
                    item.fatigue != null
                      ? Math.round(
                          item.fatigue * 10
                        )
                      : "N/A"
                  }%`,

                  `Training intensity ${
                    item.training_intensity ??
                    "N/A"
                  }/10`,
                ].join(", ");
              })
              .join("\n")
          : "No recent 7-day check-in history available.";

      const prompt = `
You are a professional sports nutritionist.

ATHLETE PROFILE:
${profileText}

TODAY'S CONDITION:
${checkInText}

RECENT 7-DAY HISTORY:
${weeklyTrendText}

USER'S CURRENT REQUEST OR EXTRA INFORMATION:
${
  userInstructions.trim() ||
  "No additional instructions provided."
}

Generate a personalised daily nutrition plan as a JSON object with exactly these fields.

Never include foods that conflict with the athlete's stated allergies, intolerances, dietary preference, or foods they avoid.

Do not provide medical treatment advice.

Required JSON fields:

- "summary": 1-2 sentence personalised note about this nutrition plan
- "calories": daily calorie target as a string, e.g. "2800 kcal"
- "protein": daily protein target, e.g. "155g"
- "carbs": daily carbs target, e.g. "320g"
- "fat": daily fat target, e.g. "85g"
- "hydration": daily hydration target, e.g. "3.5L"

- "meals": array of 5 meal objects, each with:
  - "meal": meal name
  - "foods": specific food examples
  - "timing": when to eat

Example meal names:
Breakfast
Pre-workout snack
Lunch
Post-workout
Dinner

- "tip": one practical nutrition tip for this athlete

Nutrition requirements:

- Consider the athlete's recent 7-day training load, recovery, sleep, fatigue, and hydration trends.

- Increase recovery-focused nutrition when training load has been consistently high.

- Account for repeated poor hydration instead of looking only at today's hydration.

- Consider sustained fatigue or poor recovery when recommending energy intake and meal timing.

- Do not overreact to one unusual check-in when the overall weekly trend is different.

- Treat the user's current request or extra information as important context when creating the plan.

- If the user's current message conflicts with older saved preferences, prioritise the user's current message.

- Never ignore saved allergies or intolerances even if the user asks for conflicting foods.

Respond ONLY with valid JSON.
Do not use markdown fences.
Do not include any extra text.
      `.trim();

      const responseText =
        await callOpenAI(prompt);

      // Same salvage the workout page uses: the model wraps the object in a
      // sentence often enough that stripping fences alone is not enough.
      const cleaned = cleanJsonResponse(responseText);

      let parsed: unknown;

      try {
        parsed = JSON.parse(cleaned);
      } catch (jsonError) {
        // The raw parser message — "Unexpected token < in JSON at position 0"
        // — was reaching the athlete verbatim. Keep the reply in the console
        // for debugging and show them something they can act on.
        console.error("Invalid AI JSON response:", responseText);

        throw new Error(
          "The AI returned an invalid plan format. Please regenerate the plan."
        );
      }

      // Not named `plan`: that is the state variable, and shadowing it inside
      // this function is how a later edit reads the wrong one.
      const generated = parsed as NutritionPlan | null;

      // A reply that parses to null or a bare array reached `.meals` on a
      // non-object and surfaced a TypeError to the athlete.
      if (
        !generated ||
        typeof generated !== "object" ||
        Array.isArray(generated) ||
        !Array.isArray(generated.meals) ||
        generated.meals.length === 0
      ) {
        console.error("Unexpected nutrition response:", parsed);

        throw new Error(
          "The nutrition plan came back incomplete. Please regenerate it."
        );
      }

      setPlan(generated);

      if (userId) {
        // Caches locally, then syncs to Supabase. A failed sync is logged and
        // swallowed rather than reported as a failed generation.
        await saveTodaysPlan<NutritionPlan>(
          "nutrition",
          userId,
          generated
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to generate plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (
      authLoading ||
      !isLoggedIn ||
      !userId
    ) {
      return;
    }

    let cancelled = false;
    setRestoring(true);

    (async () => {
      try {
        // Falls back to the browser cache on its own if Supabase fails.
        const saved =
          await loadTodaysPlan<NutritionPlan>(
            "nutrition",
            userId
          );

        if (cancelled) return;

        if (saved?.meals?.length) {
          setPlan(saved);
          return;
        }

        // Generate only when today has no plan anywhere — a first visit, or
        // the first visit of a new day.
        void generatePlan();
      } catch (error) {
        // loadTodaysPlan handles its own failures, so this should not fire.
        // It is here because the cost of being wrong is a skeleton that never
        // resolves — restoring would stay true with nothing left to clear it.
        console.error("Could not restore today's nutrition plan:", error);

        if (!cancelled) void generatePlan();
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    // Also stops StrictMode's double-invoked effect from starting two
    // generations — and paying for both — on the first visit of the day.
    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    isLoggedIn,
    userId,
  ]);

  const macros: MacroItem[] =
    plan
      ? [
          {
            label: "Calories",
            value: plan.calories,
            unit: "",
          },
          {
            label: "Protein",
            value: plan.protein,
            unit: "",
          },
          {
            label: "Carbs",
            value: plan.carbs,
            unit: "",
          },
          {
            label: "Fat",
            value: plan.fat,
            unit: "",
          },
          {
            label: "Hydration",
            value: plan.hydration,
            unit: "",
          },
        ]
      : [];

  const macroColors = [
    "#ef4444",
    "#0284c7",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
  ];

  return (
    <Box>
      <Seo
        title="AI Nutrition Plan"
        description="Get a daily macro and meal plan tailored to your sport, training goals, and today's check-in data."
        path="/health/nutrition"
        jsonLd={breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Health & Performance", path: "/health" },
          { name: "Nutrition Plan", path: "/health/nutrition" },
        ])}
      />

      <Stack
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={950}
            color="#0f172a"
          >
            Daily Nutrition Plan
          </Typography>

          <Typography
            color="#64748b"
            fontSize={14}
          >
            Personalised based on your
            sport, goals, today's check-in,
            and recent training trends.
          </Typography>
        </Box>

        {isLoggedIn && (
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1.5}
            alignItems="stretch"
          >
            <TextField
              fullWidth
              value={userInstructions}
              onChange={(e) =>
                setUserInstructions(
                  e.target.value
                )
              }
              placeholder="Tell the AI what changed... e.g. I have a match today, I want more protein, I don't have access to a kitchen, or I want a lighter meal."
              multiline
              minRows={2}
              disabled={busy}
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    borderRadius: 3,
                    bgcolor: "#fff",
                  },
              }}
            />

            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <RefreshIcon />
                )
              }
              disabled={busy}
              onClick={() => {
                void generatePlan();
              }}
              sx={{
                minWidth: {
                  md: 190,
                },
                borderRadius: 3,
                fontWeight: 800,
                textTransform:
                  "none",
                bgcolor: "#0f172a",
                "&:hover": {
                  bgcolor:
                    "#1e293b",
                },
              }}
            >
              {loading
                ? "Generating…"
                : "Regenerate Plan"}
            </Button>
          </Stack>
        )}
      </Stack>

      {!authLoading &&
        !isLoggedIn && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 3,
            }}
            action={
              <Button
                component={RouterLink}
                to="/auth?mode=login"
                size="small"
                sx={{
                  fontWeight: 800,
                  textTransform:
                    "none",
                }}
              >
                Sign in
              </Button>
            }
          >
            Sign in to generate your
            personalised nutrition plan.
          </Alert>
        )}

      {error &&
        isLoggedIn && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 3,
            }}
          >
            {error}
          </Alert>
        )}

      {isLoggedIn &&
        busy &&
        !plan && (
          <Grid
            container
            spacing={2.5}
          >
            <Grid item xs={12}>
              <Skeleton
                variant="rounded"
                height={64}
                sx={{
                  borderRadius: 3,
                }}
              />
            </Grid>

            {Array.from({
              length: 5,
            }).map((_, i) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={2.4}
                key={i}
              >
                <Skeleton
                  variant="rounded"
                  height={90}
                  sx={{
                    borderRadius: 3,
                  }}
                />
              </Grid>
            ))}

            {Array.from({
              length: 5,
            }).map((_, i) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={i}
              >
                <Skeleton
                  variant="rounded"
                  height={110}
                  sx={{
                    borderRadius: 3,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}

      {plan && (
        <Grid
          container
          spacing={2.5}
        >
          {/* AI Summary */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: "14px 18px",
                borderRadius: 3,
                bgcolor: "#ecfdf5",
                border:
                  "1px solid #bbf7d0",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                <AutoAwesomeIcon
                  sx={{
                    fontSize: 16,
                    color: "#047857",
                  }}
                />

                <Typography
                  fontSize={11}
                  fontWeight={800}
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="#047857"
                >
                  AI Nutritionist Note
                </Typography>
              </Stack>

              <Typography
                color="#064e3b"
                fontSize={14}
                lineHeight={1.75}
              >
                {plan.summary}
              </Typography>
            </Box>
          </Grid>

          {/* Macro targets */}
          {macros.map(
            (macro, i) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={2.4}
                key={macro.label}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border:
                      "1px solid #e2e8f0",
                    height: "100%",
                    "&:hover": {
                      borderColor:
                        "#93c5fd",
                    },
                    transition:
                      "border-color 0.15s ease",
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      textAlign:
                        "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: `${macroColors[i]}18`,
                        color:
                          macroColors[i],
                        display: "grid",
                        placeItems:
                          "center",
                        mx: "auto",
                        mb: 1,
                      }}
                    >
                      {i === 4 ? (
                        <WaterDropIcon
                          sx={{
                            fontSize: 18,
                          }}
                        />
                      ) : i === 0 ? (
                        <LocalFireDepartmentIcon
                          sx={{
                            fontSize: 18,
                          }}
                        />
                      ) : (
                        <RestaurantMenuIcon
                          sx={{
                            fontSize: 18,
                          }}
                        />
                      )}
                    </Box>

                    <Typography
                      fontWeight={950}
                      fontSize={15}
                      color="#0f172a"
                    >
                      {macro.value}
                    </Typography>

                    <Typography
                      color="#64748b"
                      fontSize={12}
                      fontWeight={700}
                    >
                      {macro.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}

          {/* Meal plan */}
          {plan.meals.map(
            (meal) => (
              <Grid
                item
                xs={12}
                sm={6}
                key={meal.meal}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border:
                      "1px solid #e2e8f0",
                    height: "100%",
                    "&:hover": {
                      borderColor:
                        "#bbf7d0",
                    },
                    transition:
                      "border-color 0.15s ease",
                  }}
                >
                  <CardContent
                    sx={{ p: 2.5 }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Typography
                        fontWeight={950}
                        color="#0f172a"
                      >
                        {meal.meal}
                      </Typography>

                      <Typography
                        fontSize={12}
                        color="#94a3b8"
                        fontWeight={700}
                        sx={{
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        {meal.timing}
                      </Typography>
                    </Stack>

                    <Typography
                      color="#475569"
                      fontSize={14}
                      lineHeight={1.7}
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      {meal.foods}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}

          {/* Tip */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: {
                  xs: 2,
                  sm: 2.5,
                },
                borderRadius: 3,
                bgcolor: "#fef3c7",
                border:
                  "1px solid #fde68a",
              }}
            >
              <Typography
                fontWeight={950}
                color="#92400e"
                sx={{ mb: 0.5 }}
              >
                💡 Nutrition Tip
              </Typography>

              <Typography
                color="#78350f"
                fontSize={14}
                lineHeight={1.75}
              >
                {plan.tip}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}