import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RefreshIcon from "@mui/icons-material/Refresh";

import { cleanJsonResponse } from "./workoutResponse";

import { Link as RouterLink } from "react-router-dom";
import { getUserPreferences } from "../services/preferencesService";
import {
  getLatestCheckIn,
  getLast7CheckIns,
} from "../services/checkinService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Seo from "../components/Seo";

const WORKOUT_SYSTEM_PROMPT =
  "You are a careful sports scientist and strength and conditioning assistant. Provide general educational fitness guidance only. Respect injuries, restrictions, equipment access, experience level, recovery, and age. Do not diagnose medical conditions. Return valid JSON when requested.";

type WorkoutIntensity = "High" | "Medium" | "Low" | "Recovery";

type WorkoutDay = {
  day: string;
  focus: string;
  exercises: string;
  intensity: WorkoutIntensity;
  duration: string;
};

type SummaryItem = {
  type: "summary";
  text: string;
};

type UnknownRecord = Record<string, unknown>;

async function callOpenAI(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-complete", {
    body: {
      prompt,
      systemPrompt: WORKOUT_SYSTEM_PROMPT,
      // A full 7-day plan plus the summary object was already close to the
      // ceiling; the 7-day history in the prompt pushes output longer still,
      // and a truncated response is unparseable JSON. 2500 is the server cap.
      maxTokens: 2500,
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

function intensityColor(intensity: WorkoutIntensity) {
  if (intensity === "High") {
    return {
      bg: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (intensity === "Medium") {
    return {
      bg: "#fef3c7",
      color: "#92400e",
    };
  }

  if (intensity === "Recovery") {
    return {
      bg: "#f3e8ff",
      color: "#6b21a8",
    };
  }

  return {
    bg: "#dcfce7",
    color: "#166534",
  };
}

function isObject(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Converts exercises returned by the AI into a displayable string.
 *
 * Supported AI formats:
 *
 * "Squats: 3 sets of 10"
 *
 * [
 *   "Squats: 3 sets of 10",
 *   "Lunges: 3 sets of 8"
 * ]
 *
 * [
 *   {
 *     "exercise": "Squats",
 *     "sets": 3,
 *     "reps": 10
 *   }
 * ]
 */
function formatExercises(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const formattedExercises = value
      .map((exercise) => {
        if (typeof exercise === "string") {
          return exercise.trim();
        }

        if (isObject(exercise)) {
          const name =
            exercise.exercise ??
            exercise.name ??
            exercise.title ??
            "Exercise";

          const sets = exercise.sets;
          const reps = exercise.reps;
          const duration =
            exercise.duration ??
            exercise.time;

          const details: string[] = [];

          if (
            typeof sets === "string" ||
            typeof sets === "number"
          ) {
            details.push(`${sets} sets`);
          }

          if (
            typeof reps === "string" ||
            typeof reps === "number"
          ) {
            details.push(`${reps} reps`);
          }

          if (
            typeof duration === "string" ||
            typeof duration === "number"
          ) {
            details.push(String(duration));
          }

          const safeName =
            typeof name === "string" ||
            typeof name === "number"
              ? String(name)
              : "Exercise";

          if (details.length > 0) {
            return `${safeName}: ${details.join(" × ")}`;
          }

          return safeName;
        }

        if (
          typeof exercise === "number" ||
          typeof exercise === "boolean"
        ) {
          return String(exercise);
        }

        return "";
      })
      .filter(Boolean);

    return formattedExercises.join(" • ");
  }

  if (isObject(value)) {
    const name =
      value.exercise ??
      value.name ??
      value.title;

    const sets = value.sets;
    const reps = value.reps;
    const duration =
      value.duration ??
      value.time;

    const parts: string[] = [];

    if (
      typeof name === "string" ||
      typeof name === "number"
    ) {
      parts.push(String(name));
    }

    if (
      typeof sets === "string" ||
      typeof sets === "number"
    ) {
      parts.push(`${sets} sets`);
    }

    if (
      typeof reps === "string" ||
      typeof reps === "number"
    ) {
      parts.push(`${reps} reps`);
    }

    if (
      typeof duration === "string" ||
      typeof duration === "number"
    ) {
      parts.push(String(duration));
    }

    if (parts.length > 0) {
      return parts.join(" • ");
    }

    return Object.entries(value)
      .map(([key, item]) => {
        if (
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
        ) {
          return `${key}: ${item}`;
        }

        return "";
      })
      .filter(Boolean)
      .join(" • ");
  }

  return "No exercises provided.";
}

function stringValue(
  value: unknown,
  fallback: string
): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function normalizeIntensity(
  value: unknown
): WorkoutIntensity {
  if (
    value === "High" ||
    value === "Medium" ||
    value === "Low" ||
    value === "Recovery"
  ) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "high") {
      return "High";
    }

    if (normalized === "medium") {
      return "Medium";
    }

    if (normalized === "recovery") {
      return "Recovery";
    }
  }

  return "Low";
}

function normalizeWorkoutDay(
  value: unknown,
  index: number
): WorkoutDay | null {
  if (!isObject(value)) {
    return null;
  }

  if (value.type === "summary") {
    return null;
  }

  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return {
    day: stringValue(
      value.day,
      weekdays[index] ?? `Day ${index + 1}`
    ),
    focus: stringValue(
      value.focus,
      "General training"
    ),
    exercises: formatExercises(value.exercises),
    intensity: normalizeIntensity(value.intensity),
    duration: stringValue(
      value.duration,
      "45 min"
    ),
  };
}

function extractSummary(value: unknown): string {
  if (!isObject(value)) {
    return "";
  }

  if (
    value.type === "summary" &&
    typeof value.text === "string"
  ) {
    return value.text.trim();
  }

  return "";
}


export default function WorkoutPage() {
  const { session, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(session);
  const [plan, setPlan] =
    React.useState<WorkoutDay[] | null>(null);

  const [loading, setLoading] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const [summary, setSummary] =
    React.useState("");
  const [userInstructions, setUserInstructions] = React.useState("");
  const storageKey = session?.user?.id
  ? `workout-plan-${session.user.id}`
  : null;
  async function generatePlan() {
    setLoading(true);
    setError(null);
    setPlan(null);
    setSummary("");

    try {
      const [prefs, checkIn, last7CheckIns] = await Promise.all([
        getUserPreferences(),
        getLatestCheckIn(),
        getLast7CheckIns(),
      ]);

      const extendedPrefs = prefs as
        | Record<string, unknown>
        | null;

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
            `Injuries or restrictions: ${
              prefs.injury_areas ||
              "None reported"
            }`,
            `Priorities: ${
              prefs.priorities ||
              "General fitness"
            }`,
            `Athlete type: ${
              prefs.athlete_type ||
              "General"
            }`,
            `Age: ${
              extendedPrefs?.age ||
              "Not provided"
            }`,
            `Height: ${
              extendedPrefs?.height_cm
                ? `${extendedPrefs.height_cm} cm`
                : "Not provided"
            }`,
            `Weight: ${
              extendedPrefs?.weight_kg
                ? `${extendedPrefs.weight_kg} kg`
                : "Not provided"
            }`,
            `Activity level: ${
              extendedPrefs?.activity_level ||
              "Not provided"
            }`,
            `Preferred workout duration: ${
              extendedPrefs?.workout_duration ||
              "Not provided"
            }`,
            `Equipment access: ${
              extendedPrefs?.equipment_access ||
              "Not provided"
            }`,
            `Average sleep: ${
              prefs.sleep_range ||
              "Not provided"
            }`,
          ].join(", ")
        : "General fitness athlete, intermediate level";

      const checkInText = checkIn
        ? `Today's data — Readiness: ${
            checkIn.readiness_score ?? "N/A"
          }%, Recovery: ${
            checkIn.recovery_score ?? "N/A"
          }%, Fatigue: ${
            checkIn.fatigue != null
              ? checkIn.fatigue * 10
              : "N/A"
          }%, Sleep: ${
            checkIn.sleep_hours ?? "N/A"
          }h, Training intensity today: ${
            checkIn.training_intensity ?? "N/A"
          }/10`
        : "No check-in data available";

        const weeklyTrendText =
  last7CheckIns && last7CheckIns.length > 0
    ? last7CheckIns
        .map((item) => {
          return [
            item.checkin_date || item.created_at || "Unknown date",
            `Readiness ${item.readiness_score ?? "N/A"}%`,
            `Recovery ${item.recovery_score ?? "N/A"}%`,
            `Fatigue ${
              item.fatigue != null
                ? Math.round(item.fatigue * 10)
                : "N/A"
            }%`,
            `Sleep ${item.sleep_hours ?? "N/A"}h`,
            `Training intensity ${
              item.training_intensity ?? "N/A"
            }/10`,
            `Soreness ${item.soreness ?? "N/A"}`,
            `Stress ${item.stress ?? "N/A"}`,
            `Injury risk ${item.injury_risk ?? "N/A"}%`,
          ].join(", ");
        })
        .join("\n")
    : "No recent 7-day check-in history available.";
      const prompt = `
You are a professional sports scientist and strength and conditioning coach.

ATHLETE PROFILE:
${profileText}

TODAY'S CONDITION:
${checkInText}

RECENT 7-DAY HISTORY:
${weeklyTrendText}

USER'S CURRENT REQUEST OR EXTRA INFORMATION:
${userInstructions.trim() || "No additional instructions provided."}

Generate a personalised 7-day weekly workout plan as a JSON array.

The first element must have this structure:

{
  "type": "summary",
  "text": "A 1-2 sentence personalised note"
}

The remaining seven elements must each have exactly this structure:

{
  "day": "Monday",
  "focus": "Upper-body strength",
  "exercises": "Bench press: 3 sets of 8 reps; Rows: 3 sets of 10 reps",
  "intensity": "Medium",
  "duration": "45 min"
}

Format requirements (the response is parsed by a program, not read by a human):
- Respond only with a valid JSON array containing exactly 8 elements: the summary object, then Monday through Sunday in order.
- Do not use markdown fences. Do not include any text outside the JSON array.
- The "exercises" field MUST be one plain text string. Do not return it as an array or an object.
- "intensity" must be exactly one of: High, Medium, Low, Recovery.
- Keep each "exercises" string under 220 characters so the plan fits in the response.

Coaching requirements:
- Respect the athlete's injuries, age, experience, equipment access, recovery, and readiness.
- Use the 7-day history to identify fatigue, recovery, sleep, and workload trends.
- Do not base the entire plan on a single unusually good or bad day.
- If fatigue has been consistently high, reduce weekly intensity.
- If recovery/readiness have been consistently low, increase recovery sessions.
- If recent training load has been consistently high, avoid unnecessary high-intensity sessions.
- If sleep has been consistently poor, reduce training stress where appropriate.
- Do not prescribe exercises that conflict with stated injuries or restrictions.
- Keep the plan practical for the stated workout duration and equipment.
- Do not provide medical treatment advice.
- Treat the user's current request as important context.
- If today's message conflicts with older profile information, prioritise today's message.
- Respect all injuries and medical restrictions.
- Respect equipment availability.
- Never ignore allergies or injuries even if the user requests something unsafe.
      `.trim();

      const responseText = await callOpenAI(prompt);
      const cleaned =
        cleanJsonResponse(responseText);

      let parsed: unknown;

      try {
        parsed = JSON.parse(cleaned);
      } catch (jsonError) {
        console.error(
          "Invalid AI JSON response:",
          responseText
        );

        throw new Error(
          "The AI returned an invalid plan format. Please regenerate the plan."
        );
      }

      if (!Array.isArray(parsed)) {
        throw new Error(
          "The workout plan response was not a valid array."
        );
      }

      const summaryText = parsed
        .map(extractSummary)
        .find((text) => Boolean(text));

      const rawDays = parsed.filter(
        (item) =>
          !(
            isObject(item) &&
            item.type === "summary"
          )
      );

      const days = rawDays
        .map((item, index) =>
          normalizeWorkoutDay(item, index)
        )
        .filter(
          (day): day is WorkoutDay =>
            day !== null
        )
        .slice(0, 7);

      if (days.length !== 7) {
        console.error(
          "Unexpected workout response:",
          parsed
        );

        throw new Error(
          `The workout plan included ${days.length} valid days instead of 7. Please regenerate it.`
        );
      }

      const finalSummary = summaryText || "";

setSummary(finalSummary);
setPlan(days);

if (storageKey) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      plan: days,
      summary: finalSummary,
      savedAt: new Date().toISOString(),
    })
  );
}
      setPlan(days);
    } catch (err: unknown) {
      console.error(
        "Workout plan generation failed:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate the workout plan. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (authLoading || !isLoggedIn || !storageKey) {
      return;
    }
  
    const saved = localStorage.getItem(storageKey);
  
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
  
        if (Array.isArray(parsed.plan)) {
          setPlan(parsed.plan);
          setSummary(parsed.summary || "");
          return;
        }
      } catch (error) {
        console.error("Failed to load saved workout plan:", error);
        localStorage.removeItem(storageKey);
      }
    }
  
    // Only automatically generate when the user has never had a plan before.
    void generatePlan();
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn, storageKey]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn]);

  return (
    <Box>
      <Seo
        title="AI Workout Plan"
        description="Get a personalised 7-day training plan generated from your sport, fitness level, and today's readiness data."
        path="/health/workout"
      />

<Stack spacing={2} sx={{ mb: 3 }}>
  <Box>
    <Typography
      variant="h5"
      fontWeight={950}
      color="#0f172a"
    >
      Weekly Training Plan
    </Typography>

    <Typography
      color="#64748b"
      fontSize={14}
    >
      Personalised using your athlete profile, today's check-in, and recent training trends.
    </Typography>
  </Box>

  {isLoggedIn && (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      alignItems="stretch"
    >
      <TextField
        fullWidth
        value={userInstructions}
        onChange={(e) => setUserInstructions(e.target.value)}
        placeholder="Tell the AI what changed... e.g. I only have 30 minutes today, my legs are sore, or I have a match tomorrow."
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
        startIcon={
          loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <RefreshIcon />
          )
        }
        disabled={loading}
        onClick={() => {
          void generatePlan();
        }}
        sx={{
          minWidth: { md: 190 },
          borderRadius: 3,
          fontWeight: 800,
          textTransform: "none",
          bgcolor: "#0f172a",
          "&:hover": {
            bgcolor: "#1e293b",
          },
        }}
      >
        {loading ? "Generating…" : "Generate New Plan"}
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
          Sign in to generate your personalised workout plan.
        </Alert>
      )}

      {error && isLoggedIn && (
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

      {summary && (
        <Box
          sx={{
            mb: 3,
            p: "14px 18px",
            borderRadius: 3,
            bgcolor: "#eff6ff",
            border: "1px solid #bfdbfe",
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
                color: "#2563eb",
              }}
            />

            <Typography
              fontSize={11}
              fontWeight={800}
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="#2563eb"
            >
              AI Coach Note
            </Typography>
          </Stack>

          <Typography
            color="#1e3a5f"
            fontSize={14}
            lineHeight={1.75}
          >
            {summary}
          </Typography>
        </Box>
      )}

      {loading && !plan && (
        <Grid container spacing={2}>
          {Array.from({
            length: 7,
          }).map((_, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              lg={4}
              key={index}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={28}
                  />
                  <Skeleton
                    variant="text"
                    width="70%"
                  />
                  <Skeleton
                    variant="text"
                    width="90%"
                  />
                  <Skeleton
                    variant="text"
                    width="60%"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {plan && (
        <Grid container spacing={2}>
          {plan.map((item) => {
            const intensityStyle =
              intensityColor(item.intensity);

            return (
              <Grid
                item
                xs={12}
                sm={6}
                lg={4}
                key={item.day}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border:
                      "1px solid #e2e8f0",
                    "&:hover": {
                      borderColor: "#93c5fd",
                      boxShadow:
                        "0 4px 16px rgba(0,0,0,0.06)",
                    },
                    transition:
                      "all 0.15s ease",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            flexShrink: 0,
                            borderRadius: 2,
                            bgcolor: "#eff6ff",
                            display: "grid",
                            placeItems: "center",
                            color: "#2563eb",
                          }}
                        >
                          <FitnessCenterIcon
                            sx={{ fontSize: 16 }}
                          />
                        </Box>

                        <Typography
                          fontWeight={950}
                          fontSize={15}
                        >
                          {item.day}
                        </Typography>
                      </Stack>

                      <Chip
                        label={item.intensity}
                        size="small"
                        sx={{
                          flexShrink: 0,
                          bgcolor:
                            intensityStyle.bg,
                          color:
                            intensityStyle.color,
                          fontWeight: 900,
                          fontSize: 11,
                        }}
                      />
                    </Stack>

                    <Typography
                      fontWeight={800}
                      color="#0f172a"
                      sx={{ mb: 0.5 }}
                    >
                      {item.focus}
                    </Typography>

                    <Typography
                      color="#475569"
                      fontSize={13}
                      lineHeight={1.7}
                    >
                      {item.exercises}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1.5,
                        pt: 1.5,
                        borderTop:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <Typography
                        fontSize={12}
                        color="#94a3b8"
                        fontWeight={700}
                      >
                        ⏱ {item.duration}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}