import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

import { Link as RouterLink } from "react-router-dom";
import { getUserPreferences } from "../services/preferencesService";
import {
  getLatestCheckIn,
  getLast7CheckIns,
  isCheckInFromToday,
} from "../services/checkinService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Seo, { breadcrumbs } from "../components/Seo";
import { loadTodaysPlan, saveTodaysPlan } from "../services/planService";
import { cleanJsonResponse } from "../lib/aiJson";
import { functionErrorMessage } from "../lib/functionError";
import MealCards from "../components/nutrition/MealCards";
import {
  dismissKey,
  localDateKey,
  normalizeRichPlan,
  type RichNutritionPlan as NutritionPlan,
} from "../components/nutrition/mealMacros";
import {
  INK,
  MUTED,
  cardSx,
  fieldSx,
  primaryButtonSx,
} from "../components/workout/ui";

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

  /*
   * The user this component is currently showing. A generation takes several
   * seconds; if the session ends or switches account meanwhile, its result
   * belongs to nobody on screen and must not be shown or cached.
   */
  const activeUserRef = React.useRef(userId);
  activeUserRef.current = userId;

  // Signing out (here or in another tab) or switching account used to leave
  // the previous athlete's plan on screen under the demo banner.
  React.useEffect(() => {
    setPlan(null);
    setError(null);
  }, [userId]);
  const busy = loading || restoring;

  // The AI note can be closed; remembered per user and day so it stays closed
  // across re-renders and reloads, and returns with tomorrow's plan.
  const noteKey = dismissKey(userId, localDateKey());
  const [noteDismissed, setNoteDismissed] = React.useState(false);

  React.useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(noteKey) === "1";
    } catch {
      // Storage blocked (private mode): fall back to in-memory state only.
    }
    setNoteDismissed(dismissed);
  }, [noteKey]);

  function dismissNote() {
    setNoteDismissed(true);
    try {
      window.localStorage.setItem(noteKey, "1");
    } catch {
      // Ignore: dismissal still holds for this page view.
    }
  }

  async function generatePlan() {
    const requestUserId = userId;
    setLoading(true);
    setError(null);

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

      // getLatestCheckIn returns the most recent row at ANY date, so this is
      // only today's reading when the athlete actually checked in today.
      const checkInFreshness = isCheckInFromToday(checkIn)
        ? "Filed today"
        : `Filed on ${
            checkIn?.checkin_date ?? "an earlier date"
          } — the athlete has NOT checked in today, so treat these numbers as out of date and lean on the 7-day history instead`;

      // Hydration is the athlete's own 1-10 rating from the daily check-in, not
      // a volume. Sending it as "7L" told the nutritionist model they were
      // already drinking seven litres a day, which skewed every hydration
      // target it returned.
      const checkInText = checkIn
        ? `${checkInFreshness}. Readiness: ${
            checkIn.readiness_score ?? "N/A"
          }%, Recovery: ${
            checkIn.recovery_score ?? "N/A"
          }%, Self-rated hydration: ${
            checkIn.hydration ?? "N/A"
          }/10, Training intensity: ${
            checkIn.training_intensity ?? "N/A"
          }/10`
        : "No check-in on file";

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

                  // Both are 1-10 self-ratings, like the current reading above.
                  // Unlabelled, the model was free to read them as litres and
                  // servings.
                  `Hydration ${
                    item.hydration ??
                    "N/A"
                  }/10`,

                  `Nutrition quality ${
                    item.nutrition ??
                    "N/A"
                  }/10`,

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

MOST RECENT CHECK-IN:
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
  - "foods": specific food examples as ONE plain string, comma-separated (not an array)
  - "calories": calories in this meal, as a number (e.g. 650)
  - "protein": grams of protein in this meal, as a number (e.g. 40)
  - "carbs": grams of carbs in this meal, as a number (e.g. 75)
  - "fat": grams of fat in this meal, as a number (e.g. 18)
  Do not include meal times. The per-meal numbers should add up to roughly the daily targets.

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
      } catch {
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
      // Normalised before it is shown or cached: a raw array or object in
      // `foods` crashed the page, and the cached copy crashed it all day.
      const generated = normalizeRichPlan(parsed);

      if (!generated) {
        console.error("Unexpected nutrition response:", parsed);

        throw new Error(
          "The nutrition plan came back incomplete. Please regenerate it."
        );
      }

      if (activeUserRef.current !== requestUserId) return;

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
          await loadTodaysPlan<unknown>(
            "nutrition",
            userId
          );

        if (cancelled) return;

        // Plans cached before normalisation existed can still hold arrays
        // or objects; an unusable one is regenerated rather than rendered.
        const restored = normalizeRichPlan(saved);

        if (restored) {
          setPlan(restored);
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
        sx={{ mb: 2 }}
      >
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
              inputProps={{
                "aria-label":
                  "Tell the AI what changed",
              }}
              sx={fieldSx}
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
                ...primaryButtonSx,
                minWidth: {
                  md: 190,
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
        <Stack spacing={3}>
          {/* AI Summary */}
          {plan.summary && !noteDismissed && (
            <Box
              role="note"
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
                    fontSize: 18,
                    color: "#047857",
                  }}
                />

                <Typography
                  fontSize={13}
                  fontWeight={800}
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="#047857"
                  sx={{ flexGrow: 1 }}
                >
                  AI Nutritionist Note
                </Typography>

                <IconButton
                  size="small"
                  aria-label="Dismiss note"
                  onClick={dismissNote}
                  sx={{
                    color: "#047857",
                    mr: -0.75,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Typography
                color="#064e3b"
                fontSize={15}
                lineHeight={1.75}
              >
                {plan.summary}
              </Typography>
            </Box>
          )}

          {/* Macro targets */}
          <Box component="section">
            <Typography
              variant="h6"
              component="h2"
              sx={{
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
              }}
            >
              Daily targets
            </Typography>
            <Grid
              container
              spacing={2}
            >
              {macros.map(
                (macro, i) => {
                  const m = macro.value.match(
                    /^\s*([\d.,]+)\s*(.*)$/
                  );
                  const num = m ? m[1] : macro.value;
                  const unit = m ? m[2] : "";
                  const big = i === 0;

                  return (
                    <Grid
                      item
                      xs={big ? 12 : 6}
                      sm={4}
                      md={2.4}
                      key={macro.label}
                    >
                      <Box
                        sx={{
                          ...cardSx,
                          height: "100%",
                          p: 2,
                          textAlign: "left",
                          borderTop: `4px solid ${macroColors[i]}`,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Box
                            aria-hidden
                            sx={{
                              color: macroColors[i],
                              display: "grid",
                            }}
                          >
                            {i === 4 ? (
                              <WaterDropIcon sx={{ fontSize: 20 }} />
                            ) : i === 0 ? (
                              <LocalFireDepartmentIcon sx={{ fontSize: 20 }} />
                            ) : (
                              <RestaurantMenuIcon sx={{ fontSize: 20 }} />
                            )}
                          </Box>
                          <Typography
                            color={MUTED}
                            fontSize={14}
                            fontWeight={800}
                          >
                            {macro.label}
                          </Typography>
                        </Stack>

                        <Typography
                          component="p"
                          fontWeight={950}
                          color={INK}
                          lineHeight={1.1}
                          sx={{
                            fontSize: {
                              xs: big ? 40 : 32,
                              md: 36,
                            },
                            overflowWrap: "anywhere",
                          }}
                        >
                          {num}
                          {unit && (
                            <Box
                              component="span"
                              sx={{
                                ml: 0.5,
                                fontSize: 16,
                                fontWeight: 800,
                                color: MUTED,
                              }}
                            >
                              {unit}
                            </Box>
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                }
              )}
            </Grid>
          </Box>

          {/* Meal plan */}
          <MealCards meals={plan.meals} />

          {/* Tip */}
          {plan.tip && (
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
                component="h2"
                fontWeight={950}
                color="#92400e"
                sx={{ mb: 0.5 }}
              >
                Nutrition Tip
              </Typography>

              <Typography
                color="#78350f"
                fontSize={15}
                lineHeight={1.75}
              >
                {plan.tip}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}