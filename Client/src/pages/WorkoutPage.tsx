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
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getUserPreferences } from "../services/preferencesService";
import { getLatestCheckIn } from "../services/checkinService";
import Seo from "../components/Seo";

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-4o-mini";

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
            "You are a careful sports scientist and strength and conditioning assistant. Provide general educational fitness guidance only. Respect injuries, restrictions, equipment access, experience level, recovery, and age. Do not diagnose medical conditions. Return valid JSON when requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 1800,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));

    const message =
      errorBody &&
      typeof errorBody === "object" &&
      "error" in errorBody &&
      errorBody.error &&
      typeof errorBody.error === "object" &&
      "message" in errorBody.error &&
      typeof errorBody.error.message === "string"
        ? errorBody.error.message
        : `OpenAI request failed with status ${response.status}.`;

    throw new Error(message);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;

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

function cleanJsonResponse(responseText: string): string {
  return responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export default function WorkoutPage() {
  const [plan, setPlan] =
    React.useState<WorkoutDay[] | null>(null);

  const [loading, setLoading] =
    React.useState(false);

  const [error, setError] =
    React.useState<string | null>(null);

  const [summary, setSummary] =
    React.useState("");

  const hasGenerated = React.useRef(false);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    setPlan(null);
    setSummary("");

    try {
      const [prefs, checkIn] = await Promise.all([
        getUserPreferences(),
        getLatestCheckIn(),
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

      const prompt = `
You are a professional sports scientist and strength and conditioning coach.

ATHLETE:
${profileText}

TODAY:
${checkInText}

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

Important requirements:

- The exercises field MUST be one plain text string.
- Do not return exercises as an array.
- Do not return exercises as an object.
- Include Monday through Sunday.
- Use exactly one intensity value: High, Medium, Low, or Recovery.
- Respect injuries, age, experience, equipment access, recovery, and readiness.
- Include enough recovery across the week.
- Do not prescribe exercises that conflict with injuries or restrictions.
- If readiness or recovery is low, reduce intensity.
- Keep each plan practical for the stated duration and equipment.
- Do not provide medical treatment advice.
- Respond only with a valid JSON array.
- Do not use markdown fences.
- Do not include any text outside the JSON array.
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

      if (summaryText) {
        setSummary(summaryText);
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
    if (!hasGenerated.current) {
      hasGenerated.current = true;
      void generatePlan();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Seo
        title="AI Workout Plan"
        description="Get a personalised 7-day training plan generated from your sport, fitness level, and today's readiness data."
        path="/health/workout"
      />

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
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
            Personalised based on your profile
            and today's check-in data.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <RefreshIcon />
            )
          }
          disabled={loading}
          onClick={() => {
            void generatePlan();
          }}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            textTransform: "none",
            borderColor: "#cbd5e1",
          }}
        >
          {loading
            ? "Generating…"
            : "Regenerate"}
        </Button>
      </Stack>

      {error && (
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