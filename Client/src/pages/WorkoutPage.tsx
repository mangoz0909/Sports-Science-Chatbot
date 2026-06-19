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

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: (prompt: string, options?: { model?: string }) => Promise<any>;
      };
    };
  }
}

type WorkoutDay = {
  day: string;
  focus: string;
  exercises: string;
  intensity: "High" | "Medium" | "Low" | "Recovery";
  duration: string;
};

const PUTER_SCRIPT_ID = "puter-js-v2";

function loadPuterScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.puter?.ai?.chat) { resolve(); return; }
    const existing = document.getElementById(PUTER_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Puter.js.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = PUTER_SCRIPT_ID;
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter.js."));
    document.body.appendChild(script);
  });
}

function intensityColor(intensity: string) {
  if (intensity === "High") return { bg: "#fee2e2", color: "#991b1b" };
  if (intensity === "Medium") return { bg: "#fef3c7", color: "#92400e" };
  if (intensity === "Recovery") return { bg: "#f3e8ff", color: "#6b21a8" };
  return { bg: "#dcfce7", color: "#166534" };
}

export default function WorkoutPage() {
  const [plan, setPlan] = React.useState<WorkoutDay[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState("");
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

      const profileText = prefs
        ? `Sport: ${prefs.primary_sport || "General fitness"}, Experience: ${prefs.experience_level || "Intermediate"}, Goal: ${prefs.main_goal || "General fitness"}, Training days/week: ${prefs.training_days || "5"}, Injuries: ${prefs.injury_areas || "None"}, Priorities: ${prefs.priorities || "General"}, Athlete type: ${prefs.athlete_type || "General"}`
        : "General fitness athlete, intermediate level";

      const checkInText = checkIn
        ? `Today's data — Readiness: ${checkIn.readiness_score ?? "N/A"}%, Recovery: ${checkIn.recovery_score ?? "N/A"}%, Fatigue: ${checkIn.fatigue != null ? checkIn.fatigue * 10 : "N/A"}%, Sleep: ${checkIn.sleep_hours ?? "N/A"}h`
        : "No check-in data available";

      const prompt = `You are a professional sports scientist and strength & conditioning coach.

ATHLETE: ${profileText}
TODAY: ${checkInText}

Generate a personalised 7-day weekly workout plan as a JSON array. Each element must have exactly these fields:
- "day": weekday name (Monday through Sunday)
- "focus": short session focus (e.g. "Upper body strength")
- "exercises": 2-3 specific exercises with sets/reps (e.g. "3x8 squats, 3x10 lunges, 2x12 step-ups")
- "intensity": one of exactly "High", "Medium", "Low", or "Recovery"
- "duration": session duration (e.g. "45 min")

Also include a brief "summary" field as the first element with key "type": "summary" and "text": a 1-2 sentence personalised note.

Respond ONLY with valid JSON array, no markdown fences, no extra text.`;

      await loadPuterScript();
      if (!window.puter?.ai?.chat) throw new Error("AI unavailable.");

      const response = await window.puter.ai.chat(prompt, { model: "claude-haiku-4-5" });
      const raw = typeof response === "string" ? response : response?.text || response?.message?.content || "";
      const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((c: any) => c.text).join("") : "";

      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed: any[] = JSON.parse(cleaned);

      const summaryItem = parsed.find((i) => i.type === "summary");
      const days = parsed.filter((i) => i.type !== "summary") as WorkoutDay[];

      if (summaryItem?.text) setSummary(summaryItem.text);
      setPlan(days);
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

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={950} color="#0f172a">
            Weekly Training Plan
          </Typography>
          <Typography color="#64748b" fontSize={14}>
            Personalised based on your profile and today's check-in data.
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

      {summary && (
        <Box sx={{ mb: 3, p: "14px 18px", borderRadius: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <AutoAwesomeIcon sx={{ fontSize: 16, color: "#2563eb" }} />
            <Typography fontSize={11} fontWeight={800} letterSpacing="0.08em" textTransform="uppercase" color="#2563eb">
              AI Coach Note
            </Typography>
          </Stack>
          <Typography color="#1e3a5f" fontSize={14} lineHeight={1.75}>
            {summary}
          </Typography>
        </Box>
      )}

      {loading && !plan && (
        <Grid container spacing={2}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Grid item xs={12} sm={6} lg={4} key={i}>
              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Skeleton variant="text" width="40%" height={28} />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {plan && (
        <Grid container spacing={2}>
          {plan.map((item) => {
            const ic = intensityColor(item.intensity);
            return (
              <Grid item xs={12} sm={6} lg={4} key={item.day}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                    "&:hover": { borderColor: "#93c5fd", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
                    transition: "all 0.15s ease",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#eff6ff", display: "grid", placeItems: "center", color: "#2563eb" }}>
                          <FitnessCenterIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Typography fontWeight={950} fontSize={15}>{item.day}</Typography>
                      </Stack>
                      <Chip
                        label={item.intensity}
                        size="small"
                        sx={{ bgcolor: ic.bg, color: ic.color, fontWeight: 900, fontSize: 11 }}
                      />
                    </Stack>

                    <Typography fontWeight={800} color="#0f172a" sx={{ mb: 0.5 }}>
                      {item.focus}
                    </Typography>

                    <Typography color="#475569" fontSize={13} lineHeight={1.7}>
                      {item.exercises}
                    </Typography>

                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #f1f5f9" }}>
                      <Typography fontSize={12} color="#94a3b8" fontWeight={700}>
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
