import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import CheckIcon from "@mui/icons-material/Check";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { Link as RouterLink } from "react-router-dom";
import { getUserPreferences } from "../../services/preferencesService";
import {
  getLatestCheckIn,
  getLast7CheckIns,
  isCheckInFromToday,
} from "../../services/checkinService";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { cleanJsonResponse } from "../../lib/aiJson";
import { functionErrorMessage } from "../../lib/functionError";
import { isAIWorkoutSaved, summarizeWorkouts, workoutTypeFromAI, type WorkoutType } from "../../lib/workoutPlan";
import { loadTodaysPlan, saveTodaysPlan } from "../../services/planService";
import {
  BODY,
  INK,
  LINE,
  LINE_STRONG,
  MUTED,
  captionSx,
  cardSx,
  fieldSx,
  primaryButtonSx,
  secondaryButtonSx,
  textButtonSx,
} from "./ui";

type WorkoutIntensity = "High" | "Medium" | "Low" | "Recovery";

type ExerciseItem = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
};

type DailyWorkoutPlan = {
  day: string;
  date: string;
  focus: string;
  intensity: WorkoutIntensity;
  totalDuration: string;
  coachNote: string;
  warmup: string[];
  exercises: ExerciseItem[];
  cooldown: string[];
  recoveryNote: string;
};

async function callOpenAI(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-complete", {
    timeout: 60_000,
    body: {
      prompt,
      task: "workout",
      maxTokens: 2200,
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

function intensityColor(intensity: WorkoutIntensity) {
  if (intensity === "High") return { bg: "#fee2e2", color: "#991b1b" };
  if (intensity === "Medium") return { bg: "#fef3c7", color: "#92400e" };
  if (intensity === "Recovery") return { bg: "#f3e8ff", color: "#6b21a8" };
  return { bg: "#dcfce7", color: "#166534" };
}

function normalizeIntensity(value: unknown): WorkoutIntensity {
  if (value === "High" || value === "Medium" || value === "Low" || value === "Recovery") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "high") return "High";
    if (normalized === "medium") return "Medium";
    if (normalized === "recovery") return "Recovery";
  }
  return "Low";
}

function stringValue(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeExercises(value: unknown): ExerciseItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      return {
        name: stringValue(record.name, "Exercise"),
        sets: stringValue(record.sets, "As appropriate"),
        reps: stringValue(record.reps, "As appropriate"),
        rest: stringValue(record.rest, "60 sec"),
        notes: stringValue(record.notes, ""),
      };
    })
    .filter((item): item is ExerciseItem => item !== null);
}

function normalizePlan(value: unknown): DailyWorkoutPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The AI returned an invalid workout plan.");
  }

  const record = value as Record<string, unknown>;
  const exercises = normalizeExercises(record.exercises);
  if (exercises.length === 0) {
    throw new Error("The AI workout plan did not include any exercises.");
  }

  return {
    day: stringValue(record.day, new Date().toLocaleDateString(undefined, { weekday: "long" })),
    date: stringValue(record.date, new Date().toLocaleDateString()),
    focus: stringValue(record.focus, "Today's training"),
    intensity: normalizeIntensity(record.intensity),
    totalDuration: stringValue(record.totalDuration, "45-60 min"),
    coachNote: stringValue(record.coachNote, ""),
    warmup: normalizeStringArray(record.warmup),
    exercises,
    cooldown: normalizeStringArray(record.cooldown),
    recoveryNote: stringValue(record.recoveryNote, ""),
  };
}

export type SaveWorkoutOptions = { startToday: boolean };

export default function AiWorkoutGenerator({ onSaveWorkout, workoutTypes = [] }: {
  /** Adds the workout to the library; with startToday it also becomes today's session. */
  onSaveWorkout?: (workout: WorkoutType, options: SaveWorkoutOptions) => void;
  workoutTypes?: WorkoutType[];
}) {
  const { session, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(session);

  const [plan, setPlan] = React.useState<DailyWorkoutPlan | null>(null);
  const [loading, setLoading] = React.useState(false);
  // Distinct from `loading`: restoring is looking up a plan that already
  // exists, generating is paying for a new one. Both hide the empty page, but
  // only one of them should put "Generating…" on the button.
  const [restoring, setRestoring] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const savedToLibrary = Boolean(plan && isAIWorkoutSaved(workoutTypes, plan));
  const [userInstructions, setUserInstructions] = React.useState("");

  const todayName = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const todayDisplay = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Supabase is the source of truth, with the browser cache as the offline
  // fallback — so a session generated on a phone at 7am is the same session the
  // laptop shows at 7pm, and is reused all day rather than regenerated.
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

  async function generatePlan() {
    const requestUserId = userId;
    setLoading(true);
    setError(null);

    try {
      const [prefs, checkIn, last7CheckIns] = await Promise.all([
        getUserPreferences().catch(() => {
          throw new Error("Could not load your athlete profile. Please try again before generating a workout.");
        }),
        getLatestCheckIn().catch(() => {
          throw new Error("Could not load your latest check-in. Please try again.");
        }),
        getLast7CheckIns().catch(() => {
          throw new Error("Could not load your recent check-ins. Please try again.");
        }),
      ]);

      const extendedPrefs = prefs as Record<string, unknown> | null;

      const profileText = prefs
        ? [
            `Sport: ${prefs.primary_sport || "General fitness"}`,
            `Experience: ${prefs.experience_level || "Intermediate"}`,
            `Goal: ${prefs.main_goal || "General fitness"}`,
            `Training days/week: ${prefs.training_days || "5"}`,
            `Injuries or restrictions: ${prefs.injury_areas || "None reported"}`,
            `Priorities: ${prefs.priorities || "General fitness"}`,
            `Athlete type: ${prefs.athlete_type || "General"}`,
            `Age: ${extendedPrefs?.age || "Not provided"}`,
            `Height: ${extendedPrefs?.height_cm ? `${extendedPrefs.height_cm} cm` : "Not provided"}`,
            `Weight: ${extendedPrefs?.weight_kg ? `${extendedPrefs.weight_kg} kg` : "Not provided"}`,
            `Activity level: ${extendedPrefs?.activity_level || "Not provided"}`,
            `Preferred workout duration: ${extendedPrefs?.workout_duration || "Not provided"}`,
            `Equipment access: ${extendedPrefs?.equipment_access || "Not provided"}`,
            `Average sleep: ${prefs.sleep_range || "Not provided"}`,
          ].join(", ")
        : "General fitness athlete, intermediate level";

      // getLatestCheckIn returns the most recent row at ANY date. Calling that
      // "today's data" unconditionally meant a five-day-old entry was handed to
      // the model as the athlete's current condition, and today's session was
      // built around a readiness score they no longer have.
      const checkInFreshness = isCheckInFromToday(checkIn)
        ? "Filed today"
        : `Filed on ${checkIn?.checkin_date ?? "an earlier date"} — the athlete has NOT checked in today, so treat these numbers as out of date and lean on the 7-day history instead`;

      const checkInText = checkIn
        ? `${checkInFreshness}. Readiness: ${checkIn.readiness_score ?? "N/A"}%, Recovery: ${checkIn.recovery_score ?? "N/A"}%, Fatigue: ${checkIn.fatigue != null ? Math.round(checkIn.fatigue * 10) : "N/A"}%, Sleep: ${checkIn.sleep_hours ?? "N/A"}h, Training intensity: ${checkIn.training_intensity ?? "N/A"}/10, Soreness: ${checkIn.soreness ?? "N/A"}/10, Stress: ${checkIn.stress ?? "N/A"}/10, Injury risk: ${checkIn.injury_risk ?? "N/A"}%`
        : "No check-in on file";

      const weeklyTrendText =
        last7CheckIns && last7CheckIns.length > 0
          ? last7CheckIns
              .map((item) =>
                [
                  item.checkin_date || item.created_at || "Unknown date",
                  `Readiness ${item.readiness_score ?? "N/A"}%`,
                  `Recovery ${item.recovery_score ?? "N/A"}%`,
                  `Fatigue ${item.fatigue != null ? Math.round(item.fatigue * 10) : "N/A"}%`,
                  `Sleep ${item.sleep_hours ?? "N/A"}h`,
                  `Training intensity ${item.training_intensity ?? "N/A"}/10`,
                  `Soreness ${item.soreness ?? "N/A"}`,
                  `Stress ${item.stress ?? "N/A"}`,
                  `Injury risk ${item.injury_risk ?? "N/A"}%`,
                ].join(", ")
              )
              .join("\n")
          : "No recent 7-day check-in history available.";

      const prompt = `
You are creating ONE detailed workout for TODAY ONLY.

TODAY:
${todayName}, ${todayDisplay}

ATHLETE PROFILE:
${profileText}

MOST RECENT CHECK-IN:
${checkInText}

EXISTING USER WORKOUTS:
${summarizeWorkouts(workoutTypes)}
Use these as examples of the user's preferred exercises and session structure, adapting to readiness and requests. Any workout focus is allowed, including full body, conditioning, mobility, and sport-specific training.

RECENT 7-DAY HISTORY:
${weeklyTrendText}

USER'S CURRENT REQUEST OR EXTRA INFORMATION:
${userInstructions.trim() || "No additional instructions provided."}

Create one detailed training session for today. Do NOT create a weekly plan and do NOT include any other day.

Return exactly one JSON object with this structure:
{
  "day": "${todayName}",
  "date": "${todayDisplay}",
  "focus": "Main goal of today's session",
  "intensity": "Medium",
  "totalDuration": "60 min",
  "coachNote": "2-4 sentence explanation of why today's session fits the athlete's current readiness, recovery, recent training trend, sport, and goals.",
  "warmup": [
    "5 min easy bike or jog",
    "10 walking lunges each side",
    "10 arm circles each direction"
  ],
  "exercises": [
    {
      "name": "Exercise name",
      "sets": "4",
      "reps": "6-8",
      "rest": "2 min",
      "notes": "Specific coaching cue, load guidance, tempo, or modification."
    }
  ],
  "cooldown": [
    "5 min easy movement",
    "Hip flexor stretch: 30 sec each side"
  ],
  "recoveryNote": "Specific post-workout recovery advice for today."
}

Requirements:
- TODAY ONLY. Return one workout, not seven days.
- Include 5-8 main exercises unless recovery/readiness suggests a lighter session.
- Make the session much more detailed than a weekly overview.
- Include exact sets, reps or time, rest periods, and useful coaching notes.
- Use the athlete's current sport, goals, equipment, preferred duration, and experience level.
- Use the most recent check-in heavily when deciding intensity and exercise selection, but only in proportion to how current it is.
- Use the last 7 check-ins to detect fatigue, recovery, sleep, and workload trends.
- Do not overreact to one unusual check-in if the 7-day pattern suggests otherwise.
- Respect all injuries and physical restrictions.
- If fatigue or injury risk is high, reduce intensity and use safer alternatives.
- If equipment is limited, only prescribe available or bodyweight exercises.
- Treat the user's current request as important context.
- Do not provide medical diagnosis or treatment.
- "intensity" must be exactly one of: High, Medium, Low, Recovery.
- Respond ONLY with valid JSON.
- No markdown fences and no text outside the JSON object.
      `.trim();

      const responseText = await callOpenAI(prompt);
      const cleaned = cleanJsonResponse(responseText);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("Invalid AI JSON response:", responseText);
        throw new Error("The AI returned an invalid plan format. Please regenerate the plan.");
      }

      const normalizedPlan = normalizePlan(parsed);
      if (activeUserRef.current !== requestUserId) return;

      setPlan(normalizedPlan);

      if (userId) {
        // Caches locally, then syncs to Supabase. A failed sync is logged and
        // swallowed: the plan is already on screen, and failing here would
        // report a successful generation as an error.
        await saveTodaysPlan<DailyWorkoutPlan>("workout", userId, normalizedPlan);
      }
    } catch (err: unknown) {
      if (activeUserRef.current !== requestUserId) return;
      console.error("Workout plan generation failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate today's workout. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (authLoading || !isLoggedIn || !userId) return;

    let cancelled = false;
    setRestoring(true);

    (async () => {
      try {
        // Falls back to the browser cache on its own if Supabase fails.
        const saved = await loadTodaysPlan<DailyWorkoutPlan>("workout", userId);

        if (cancelled) return;

        if (saved) {
          try {
            const restored = normalizePlan(saved);
            setPlan(restored);
            return;
          } catch (error) {
            // Ignore an incompatible saved plan so the athlete can request
            // a fresh one with their current instructions.
            console.error("Saved workout plan could not be read:", error);
          }
        }

      } catch (error) {
        // loadTodaysPlan handles its own failures, so this should not fire.
        // Always clear the skeleton so a fresh generation remains available.
        console.error("Could not restore today's workout:", error);

      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, userId]);

  const intensityStyle = plan
    ? intensityColor(plan.intensity)
    : intensityColor("Low");

  const save = (startToday: boolean) => {
    if (!plan || !onSaveWorkout) return;
    try {
      setError(null);
      onSaveWorkout(workoutTypeFromAI(plan, plan.focus), { startToday });
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message
        ? `Could not save this workout: ${saveError.message}`
        : "Could not save this workout. Please try again.");
    }
  };

  return (
    <Box>
      {/* ASK */}
      <Box sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, mb: 2.5 }}>
        <Typography component="h2" fontWeight={950} fontSize={20} color={INK}>
          Today's AI workout
        </Typography>
        <Typography color={MUTED} fontSize={14} mt={0.25}>
          One session for {todayName}, built from your profile, latest check-in
          and recent training.
        </Typography>

        {isLoggedIn ? (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="stretch" mt={2}>
            <TextField
              fullWidth
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="Anything different today? e.g. only 30 minutes, sore legs, match tomorrow"
              inputProps={{ "aria-label": "Anything different today" }}
              multiline
              minRows={1}
              maxRows={4}
              disabled={busy}
              sx={fieldSx}
            />

            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : plan ? <RefreshIcon /> : <AutoAwesomeIcon />}
              disabled={busy}
              onClick={() => void generatePlan()}
              sx={{ ...primaryButtonSx, minWidth: { md: 190 }, py: 1.25 }}
            >
              {loading ? "Generating…" : plan ? "Regenerate" : "Generate Workout"}
            </Button>
          </Stack>
        ) : !authLoading && (
          <Alert
            severity="info"
            sx={{ mt: 2, borderRadius: 3 }}
            action={
              <Button component={RouterLink} to="/auth?mode=login" size="small" sx={textButtonSx}>
                Sign in
              </Button>
            }
          >
            Sign in to generate today's personalised workout.
          </Alert>
        )}
      </Box>

      {error && isLoggedIn && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {busy && !plan && (
        <Box sx={{ ...cardSx, p: 3 }}>
          <Skeleton variant="text" width="35%" height={32} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rounded" height={72} sx={{ my: 2 }} />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={56} sx={{ mb: 1 }} />
          ))}
        </Box>
      )}

      {plan && (
        <Box component="article" aria-label={plan.focus} sx={{ ...cardSx, overflow: "hidden" }}>
          {/* SUMMARY + ACTIONS */}
          <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: `1px solid ${LINE}` }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={captionSx}>
                  {plan.day} · {plan.date}
                </Typography>
                <Typography component="h3" fontWeight={950} fontSize={{ xs: 22, md: 26 }} color={INK} lineHeight={1.2} mt={0.5}>
                  {plan.focus}
                </Typography>
                <Stack direction="row" spacing={1} mt={1.25}>
                  <Chip
                    size="small"
                    label={`${plan.intensity} intensity`}
                    sx={{ bgcolor: intensityStyle.bg, color: intensityStyle.color, fontWeight: 900 }}
                  />
                  <Chip
                    size="small"
                    icon={<TimerOutlinedIcon />}
                    label={plan.totalDuration}
                    variant="outlined"
                    sx={{ fontWeight: 800, borderColor: LINE_STRONG }}
                  />
                  <Chip
                    size="small"
                    label={`${plan.exercises.length} exercises`}
                    variant="outlined"
                    sx={{ fontWeight: 800, borderColor: LINE_STRONG }}
                  />
                </Stack>
              </Box>

              {isLoggedIn && onSaveWorkout && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" }, flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowRoundedIcon />}
                    disabled={busy}
                    onClick={() => save(true)}
                    sx={{ ...primaryButtonSx, px: 2.5, py: 1.1 }}
                  >
                    Train this today
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={savedToLibrary ? <CheckIcon /> : <BookmarkAddOutlinedIcon />}
                    disabled={busy || savedToLibrary}
                    onClick={() => save(false)}
                    sx={{ ...secondaryButtonSx, px: 2.5, py: 1.1 }}
                  >
                    {savedToLibrary ? "Saved" : "Save for later"}
                  </Button>
                </Stack>
              )}
            </Stack>

            {plan.coachNote && (
              <Stack direction="row" spacing={1.25} sx={{ mt: 2.5, p: 2, borderRadius: 2.5, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <AutoAwesomeIcon sx={{ fontSize: 18, color: "#2563eb", mt: 0.25 }} />
                <Typography color="#1e3a5f" fontSize={14} lineHeight={1.7}>
                  {plan.coachNote}
                </Typography>
              </Stack>
            )}
          </Box>

          {/* SESSION */}
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {plan.warmup.length > 0 && (
              <GuideList title="Warm-up" items={plan.warmup} />
            )}

            <Typography sx={{ ...captionSx, mt: plan.warmup.length > 0 ? 3 : 0, mb: 1 }}>
              Main workout
            </Typography>
            <Stack divider={<Box sx={{ borderTop: `1px solid ${LINE}` }} />}>
              {plan.exercises.map((exercise, index) => (
                <Stack
                  key={`${exercise.name}-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{ py: 1.5 }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                    <Box
                      aria-hidden
                      sx={{ flexShrink: 0, width: 26, height: 26, mt: 0.1, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#f1f5f9", color: MUTED, fontSize: 13, fontWeight: 900 }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} color={INK}>
                        {exercise.name}
                      </Typography>
                      {exercise.notes && (
                        <Typography color={MUTED} fontSize={13} lineHeight={1.6} sx={{ mt: 0.25 }}>
                          {exercise.notes}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  <Typography
                    fontSize={14}
                    fontWeight={800}
                    color={BODY}
                    sx={{ flexShrink: 0, pl: { xs: 4.75, sm: 0 }, whiteSpace: { sm: "nowrap" } }}
                  >
                    {exercise.sets} × {exercise.reps} · rest {exercise.rest}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {plan.cooldown.length > 0 && (
              <Box mt={3}>
                <GuideList title="Cooldown" items={plan.cooldown} />
              </Box>
            )}

            {plan.recoveryNote && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: "#ecfdf5", border: "1px solid #bbf7d0" }}>
                <Typography fontWeight={900} color="#047857" fontSize={14}>
                  Recovery
                </Typography>
                <Typography color="#065f46" fontSize={14} lineHeight={1.7} mt={0.25}>
                  {plan.recoveryNote}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function GuideList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box>
      <Typography sx={{ ...captionSx, mb: 1 }}>{title}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {items.map((item, index) => (
          <Typography key={index} component="li" color={BODY} fontSize={14} sx={{ mb: 0.5 }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
