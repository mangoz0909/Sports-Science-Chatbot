import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { Link as RouterLink } from "react-router-dom";
import { getUserPreferences } from "../services/preferencesService";
import { getLatestCheckIn, getLast7CheckIns } from "../services/checkinService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Seo, { breadcrumbs } from "../components/Seo";

const WORKOUT_SYSTEM_PROMPT =
  "You are a careful sports scientist and strength and conditioning assistant. Provide general educational fitness guidance only. Respect injuries, restrictions, equipment access, experience level, recovery, and age. Do not diagnose medical conditions. Return valid JSON when requested.";

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
    body: {
      prompt,
      systemPrompt: WORKOUT_SYSTEM_PROMPT,
      maxTokens: 2200,
      temperature: 0.4,
    },
  });

  if (error) throw error;

  const reply = data?.result;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("The AI model returned an empty response.");
  }
  return reply.trim();
}

function cleanJsonResponse(responseText: string): string {
  return responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
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

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function WorkoutPage() {
  const { session, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(session);

  const [plan, setPlan] = React.useState<DailyWorkoutPlan | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [userInstructions, setUserInstructions] = React.useState("");

  const todayKey = getLocalDateKey();
  const todayName = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const todayDisplay = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const storageKey = session?.user?.id
    ? `workout-plan-${session.user.id}-${todayKey}`
    : null;

  async function generatePlan() {
    setLoading(true);
    setError(null);

    try {
      const [prefs, checkIn, last7CheckIns] = await Promise.all([
        getUserPreferences(),
        getLatestCheckIn(),
        getLast7CheckIns(),
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

      const checkInText = checkIn
        ? `Today's data — Readiness: ${checkIn.readiness_score ?? "N/A"}%, Recovery: ${checkIn.recovery_score ?? "N/A"}%, Fatigue: ${checkIn.fatigue != null ? Math.round(checkIn.fatigue * 10) : "N/A"}%, Sleep: ${checkIn.sleep_hours ?? "N/A"}h, Training intensity today: ${checkIn.training_intensity ?? "N/A"}/10, Soreness: ${checkIn.soreness ?? "N/A"}, Stress: ${checkIn.stress ?? "N/A"}, Injury risk: ${checkIn.injury_risk ?? "N/A"}%`
        : "No check-in data available";

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

TODAY'S CONDITION:
${checkInText}

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
- Use today's check-in heavily when deciding intensity and exercise selection.
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
      } catch (jsonError) {
        console.error("Invalid AI JSON response:", responseText);
        throw new Error("The AI returned an invalid plan format. Please regenerate the plan.");
      }

      const normalizedPlan = normalizePlan(parsed);
      setPlan(normalizedPlan);

      if (storageKey) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ plan: normalizedPlan, savedAt: new Date().toISOString() })
        );
      }
    } catch (err: unknown) {
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
    if (authLoading || !isLoggedIn || !storageKey) return;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.plan) {
          setPlan(normalizePlan(parsed.plan));
          return;
        }
      } catch (error) {
        console.error("Failed to load saved daily workout plan:", error);
        localStorage.removeItem(storageKey);
      }
    }

    void generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn, storageKey]);

  const intensityStyle = plan
    ? intensityColor(plan.intensity)
    : intensityColor("Low");

  return (
    <Box>
      <Seo
        title="Today's AI Workout"
        description="Get one detailed workout for today based on your athlete profile, readiness, recovery, and recent training trends."
        path="/health/workout"
        jsonLd={breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Health & Performance", path: "/health" },
          { name: "Workout Plan", path: "/health/workout" },
        ])}
      />

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={950} color="#0f172a">
            Today's Training Plan
          </Typography>
          <Typography color="#64748b" fontSize={14}>
            One detailed session for {todayName}, personalised using your profile,
            today's check-in, and recent training trends.
          </Typography>
        </Box>

        {isLoggedIn && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="stretch">
            <TextField
              fullWidth
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="Tell the AI what changed today... e.g. I only have 30 minutes, my legs are sore, I have a match tomorrow, or I want more speed work."
              multiline
              minRows={2}
              disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#fff",
                },
              }}
            />

            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              disabled={loading}
              onClick={() => void generatePlan()}
              sx={{
                minWidth: { md: 190 },
                borderRadius: 3,
                fontWeight: 800,
                textTransform: "none",
                bgcolor: "#0f172a",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              {loading ? "Generating…" : "Regenerate Today"}
            </Button>
          </Stack>
        )}
      </Stack>

      {!authLoading && !isLoggedIn && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 3 }}
          action={
            <Button
              component={RouterLink}
              to="/auth?mode=login"
              size="small"
              sx={{ fontWeight: 800, textTransform: "none" }}
            >
              Sign in
            </Button>
          }
        >
          Sign in to generate today's personalised workout.
        </Alert>
      )}

      {error && isLoggedIn && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {loading && !plan && (
        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width="35%" height={32} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rounded" height={72} sx={{ my: 2 }} />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={82} sx={{ mb: 1.5 }} />
            ))}
          </CardContent>
        </Card>
      )}

      {plan && (
        <Stack spacing={2.5}>
          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography fontSize={12} color="#64748b" fontWeight={800}>
                    {plan.day} • {plan.date}
                  </Typography>
                  <Typography variant="h5" fontWeight={950} color="#0f172a" sx={{ mt: 0.25 }}>
                    {plan.focus}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={plan.intensity}
                    sx={{
                      bgcolor: intensityStyle.bg,
                      color: intensityStyle.color,
                      fontWeight: 900,
                    }}
                  />
                  <Chip
                    icon={<TimerOutlinedIcon />}
                    label={plan.totalDuration}
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>
              </Stack>

              {plan.coachNote && (
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 17, color: "#2563eb" }} />
                    <Typography
                      fontSize={11}
                      fontWeight={900}
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="#2563eb"
                    >
                      AI Coach Note
                    </Typography>
                  </Stack>
                  <Typography color="#1e3a5f" fontSize={14} lineHeight={1.75}>
                    {plan.coachNote}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1.5 }}>
                Warm-up
              </Typography>
              <Stack spacing={0.8}>
                {plan.warmup.map((item, index) => (
                  <Typography key={index} color="#475569" fontSize={14}>
                    {index + 1}. {item}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FitnessCenterIcon sx={{ color: "#2563eb" }} />
                <Typography fontWeight={950} color="#0f172a">
                  Main Workout
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {plan.exercises.map((exercise, index) => (
                  <Box key={`${exercise.name}-${index}`}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <Typography fontWeight={900} color="#0f172a">
                          {index + 1}. {exercise.name}
                        </Typography>
                        {exercise.notes && (
                          <Typography color="#64748b" fontSize={13} lineHeight={1.6} sx={{ mt: 0.5 }}>
                            {exercise.notes}
                          </Typography>
                        )}
                      </Box>

                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
                        <Chip size="small" label={`${exercise.sets} sets`} variant="outlined" />
                        <Chip size="small" label={`${exercise.reps} reps`} variant="outlined" />
                        <Chip size="small" label={`Rest ${exercise.rest}`} variant="outlined" />
                      </Stack>
                    </Stack>

                    {index < plan.exercises.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography fontWeight={950} color="#0f172a" sx={{ mb: 1.5 }}>
                Cooldown
              </Typography>
              <Stack spacing={0.8}>
                {plan.cooldown.map((item, index) => (
                  <Typography key={index} color="#475569" fontSize={14}>
                    {index + 1}. {item}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {plan.recoveryNote && (
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "#ecfdf5", border: "1px solid #bbf7d0" }}>
              <Typography fontWeight={950} color="#047857" sx={{ mb: 0.5 }}>
                Recovery for Today
              </Typography>
              <Typography color="#065f46" fontSize={14} lineHeight={1.75}>
                {plan.recoveryNote}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
