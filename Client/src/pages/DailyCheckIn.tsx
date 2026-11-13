import React from "react";
import Seo from "../components/Seo";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import HotelIcon from "@mui/icons-material/Hotel";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PsychologyIcon from "@mui/icons-material/Psychology";

import {
  createDailyCheckIn,
  getCheckInForDate,
  getCheckInDateBounds,
  localDateString,
  validateCheckInDate,
} from "../services/checkinService";

type CheckInData = {
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  soreness: number;
  fatigue: number;
  stress: number;
  mood: number;
  hydration: number;
  nutrition: number;
  trainingIntensity: number;
  painLevel: number;
  notes: string;
};

const defaultData: CheckInData = {
  sleepHours: 7,
  sleepQuality: 7,
  energy: 7,
  soreness: 3,
  fatigue: 4,
  stress: 4,
  mood: 7,
  hydration: 7,
  nutrition: 7,
  trainingIntensity: 5,
  painLevel: 1,
  notes: "",
};

const sections = [
  {
    title: "Sleep & Recovery",
    icon: <HotelIcon />,
    color: "#8b5cf6",
    fields: [
      // Hours, not a 1-10 score: 0 and 11-12 are real nights. No score formula
      // reads this value, so the wider range changes no calculation.
      { key: "sleepHours", label: "Sleep Hours", min: 0, max: 12 },
      { key: "sleepQuality", label: "Sleep Quality", min: 1, max: 10 },
      { key: "energy", label: "Energy Level", min: 1, max: 10 },
      { key: "soreness", label: "Muscle Soreness", min: 1, max: 10 },
      { key: "fatigue", label: "Fatigue", min: 1, max: 10 },
    ],
  },
  {
    title: "Wellness",
    icon: <MonitorHeartIcon />,
    color: "#22c55e",
    fields: [
      { key: "stress", label: "Stress Level", min: 1, max: 10 },
      { key: "mood", label: "Mood", min: 1, max: 10 },
      { key: "hydration", label: "Hydration", min: 1, max: 10 },
      { key: "nutrition", label: "Nutrition Quality", min: 1, max: 10 },
    ],
  },
  {
    title: "Training & Injury",
    icon: <FitnessCenterIcon />,
    color: "#0284c7",
    fields: [
      { key: "trainingIntensity", label: "Training Intensity", min: 1, max: 10 },
      { key: "painLevel", label: "Pain Level", min: 0, max: 10 },
    ],
  },
] as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// Theoretical bounds of `positive - negative` below, given each slider's 1-10
// range (painLevel is 0-10). Used to normalize the weighted score to 0-100
// instead of clamping — clamping alone saturated at 100 for most real inputs.
const READINESS_RAW_MIN = 1 * 1.5 + 1 * 1.4 + 1 + 1 + 1 - (10 * 1.2 + 10 * 1.5 + 10 + 10 * 1.6);
const READINESS_RAW_MAX = 10 * 1.5 + 10 * 1.4 + 10 + 10 + 10 - (1 * 1.2 + 1 * 1.5 + 1 + 0 * 1.6);

function calculateReadiness(data: CheckInData) {
  const positive =
    data.sleepQuality * 1.5 +
    data.energy * 1.4 +
    data.mood +
    data.hydration +
    data.nutrition;

  const negative =
    data.soreness * 1.2 +
    data.fatigue * 1.5 +
    data.stress +
    data.painLevel * 1.6;

  const raw = positive - negative;
  const normalized =
    ((raw - READINESS_RAW_MIN) / (READINESS_RAW_MAX - READINESS_RAW_MIN)) * 100;

  return clamp(Math.round(normalized));
}

function calculateInjuryRisk(data: CheckInData) {
  return clamp(
    Math.round(
      data.painLevel * 8 +
        data.soreness * 4 +
        data.fatigue * 5 +
        data.trainingIntensity * 3 -
        data.sleepQuality * 3 -
        data.hydration * 2
    )
  );
}

function calculateRecovery(data: CheckInData) {
  return clamp(
    Math.round(
      data.sleepQuality * 7 +
        data.energy * 5 +
        data.hydration * 3 -
        data.fatigue * 4 -
        data.soreness * 3
    )
  );
}

function getColor(value: number) {
  if (value >= 75) return "#22c55e";
  if (value >= 45) return "#f59e0b";
  return "#ef4444";
}

function getAIAdvice(data: CheckInData) {
  const readiness = calculateReadiness(data);
  const injuryRisk = calculateInjuryRisk(data);

  if (data.painLevel >= 7) {
    return "High pain reported. Avoid intense training today and consider speaking with a qualified professional.";
  }

  if (injuryRisk >= 65) {
    return "Injury risk is elevated. Reduce sprinting, heavy lifting, and high-impact work today.";
  }

  if (data.sleepHours < 7 || data.sleepQuality <= 5) {
    return "Sleep is limiting your recovery. Keep training light and aim for better sleep tonight.";
  }

  if (data.fatigue >= 7 || data.soreness >= 7) {
    return "Your body is showing fatigue. Choose mobility, stretching, or low-intensity skill work.";
  }

  if (readiness >= 80) {
    return "You look ready for a strong training day. Keep hydration high and warm up properly.";
  }

  return "You are in a moderate training zone. A balanced practice with recovery work is recommended.";
}

export default function DailyCheckIn() {
  const [data, setData] = React.useState<CheckInData>(defaultData);
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = React.useState(false);
  // Whether the last successful save replaced an existing row, captured before
  // the save so a first entry reads "saved", not "updated".
  const [savedAsUpdate, setSavedAsUpdate] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(() => localDateString());
  // Until the selected date is loaded, saving could replace an existing row
  // with defaults because the save is an upsert.
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">("loading");
  // Keep a slow date lookup from overwriting edits made while it was loading.
  const editedDateRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoadState("loading");
    setAlreadyCheckedIn(false);
    setSubmitted(false);
    setError(null);
    setData(defaultData);

    getCheckInForDate(selectedDate).then((existing) => {
      if (!mounted) return;
      setLoadState("ready");
      if (existing) {
        setAlreadyCheckedIn(true);
        if (editedDateRef.current === selectedDate) return;
        setData({
          sleepHours: existing.sleep_hours ?? defaultData.sleepHours,
          sleepQuality: existing.sleep_quality ?? defaultData.sleepQuality,
          energy: existing.energy ?? defaultData.energy,
          soreness: existing.soreness ?? defaultData.soreness,
          fatigue: existing.fatigue ?? defaultData.fatigue,
          stress: existing.stress ?? defaultData.stress,
          mood: existing.mood ?? defaultData.mood,
          hydration: existing.hydration ?? defaultData.hydration,
          nutrition: existing.nutrition ?? defaultData.nutrition,
          trainingIntensity: existing.training_intensity ?? defaultData.trainingIntensity,
          painLevel: existing.pain_level ?? defaultData.painLevel,
          notes: existing.notes ?? "",
        });
      }
    }).catch((err) => {
      console.error("Could not load the selected check-in:", err);
      if (mounted) setLoadState("error");
    });
    return () => { mounted = false; };
  }, [selectedDate]);

  const readiness = calculateReadiness(data);
  const injuryRisk = calculateInjuryRisk(data);
  const recovery = calculateRecovery(data);

  const updateValue = (key: keyof CheckInData, value: number | string) => {
    editedDateRef.current = selectedDate;
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSubmitted(false);
    setError(null);
  };

  const changeSelectedDate = (date: string) => {
    if (!date) return;
    // min/max only constrain the picker; a typed date can still fall outside
    // the window, and loading it would fail as if the lookup had broken.
    try {
      validateCheckInDate(date);
    } catch (err: any) {
      setError(err?.message || "Choose a valid check-in date.");
      return;
    }
    setSelectedDate(date);
    setData(defaultData);
    setSubmitted(false);
    setError(null);
    editedDateRef.current = null;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      await createDailyCheckIn({
        sleep_hours: data.sleepHours,
        sleep_quality: data.sleepQuality,
        energy: data.energy,
        soreness: data.soreness,
        fatigue: data.fatigue,
        stress: data.stress,
        mood: data.mood,
        hydration: data.hydration,
        nutrition: data.nutrition,
        training_intensity: data.trainingIntensity,
        pain_level: data.painLevel,
        notes: data.notes,
        readiness_score: readiness,
        recovery_score: recovery,
        injury_risk: injuryRisk,
      }, selectedDate);
      // The date field is disabled while saving, so selectedDate is unchanged.
      setSavedAsUpdate(alreadyCheckedIn);
      setAlreadyCheckedIn(true);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to save daily check-in.");
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = [
    {
      label: "Readiness Score",
      value: readiness,
      icon: <MonitorHeartIcon />,
      color: getColor(readiness),
    },
    {
      label: "Recovery Score",
      value: recovery,
      icon: <HotelIcon />,
      color: getColor(recovery),
    },
    {
      label: "Injury Risk",
      value: injuryRisk,
      icon: <WarningAmberIcon />,
      color: injuryRisk >= 65 ? "#ef4444" : injuryRisk >= 35 ? "#f59e0b" : "#22c55e",
    },
    {
      label: "Nutrition Score",
      value: data.nutrition * 10,
      icon: <RestaurantIcon />,
      color: getColor(data.nutrition * 10),
    },
  ];
  const { earliest, latest } = getCheckInDateBounds();
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );
  // The button repeats the date; the long form wraps to three lines on phones.
  const selectedDateShort = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    undefined,
    { weekday: "short", month: "short", day: "numeric" }
  );
  const isRetrospective = selectedDate !== latest;

  return (
    <Box sx={{ bgcolor: "#f8fafc" }}>
      <Seo
        title="Daily Check-In"
        description="Log today's sleep, fatigue, soreness, mood, and wellness to get your athlete readiness and recovery scores."
        path="/daily-check-in"
        noIndex
      />
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Chip
            label="Daily Athlete Check-In"
            sx={{
              width: "fit-content",
              bgcolor: "#e0f2fe",
              color: "#0369a1",
              fontWeight: 950,
            }}
          />

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 950,
              letterSpacing: -0.8,
              color: "#0f172a",
              fontSize: { xs: "1.6rem", md: "3rem" },
            }}
          >
            {isRetrospective
              ? `How were you feeling on ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}?`
              : "How are you feeling today?"}
          </Typography>

          <Typography color="#64748b" maxWidth={760} lineHeight={1.8}>
            Enter your daily sleep, recovery, training, nutrition, and injury data.
            Your AI coach will estimate readiness, recovery, and injury risk.
          </Typography>
        </Stack>

        <Card elevation={0} sx={{ mb: 2.5, borderRadius: 4, border: "1px solid #e2e8f0" }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField
                type="date"
                label="Check-in date"
                value={selectedDate}
                disabled={saving}
                onChange={(event) => changeSelectedDate(event.target.value)}
                inputProps={{ min: earliest, max: latest, "aria-label": "Check-in date" }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: "100%", sm: 240 } }}
              />
              <Typography color="#64748b" fontSize={14} lineHeight={1.7}>
                Choose today or one of the previous six days. Existing entries for
                the selected date will be loaded so you can update them.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {alreadyCheckedIn && !submitted && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            A check-in already exists for {selectedDateLabel}. Saving again will update it.
          </Alert>
        )}

        {submitted && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Check-in for {selectedDateLabel} {savedAsUpdate ? "updated" : "saved"} successfully.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {summaryCards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography color="#64748b" fontWeight={850} fontSize={14}>
                        {card.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={950}>
                        {card.value}%
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: `${card.color}18`,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={card.value}
                    sx={{
                      mt: 2,
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: card.color,
                        borderRadius: 999,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={2.5}>
              {sections.map((section) => (
                <Card
                  key={section.title}
                  elevation={0}
                  sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 3,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: `${section.color}18`,
                          color: section.color,
                        }}
                      >
                        {section.icon}
                      </Box>

                      <Typography variant="h6" fontWeight={950}>
                        {section.title}
                      </Typography>
                    </Stack>

                    <Grid container spacing={2.5}>
                      {section.fields.map((field) => {
                        const key = field.key as keyof CheckInData;
                        const value = data[key] as number;

                        return (
                          <Grid item xs={12} md={6} key={field.key}>
                            <Stack spacing={0.8}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography fontWeight={900}>{field.label}</Typography>
                                <Chip
                                  label={value}
                                  size="small"
                                  sx={{
                                    bgcolor: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontWeight: 950,
                                  }}
                                />
                              </Stack>

                              <Slider
                                value={value}
                                min={field.min}
                                max={field.max}
                                step={1}
                                marks
                                aria-label={field.label}
                                onChange={(_, newValue) =>
                                  updateValue(key, newValue as number)
                                }
                              />
                            </Stack>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>
                    Notes
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Add anything important: pain, match schedule, training notes, or recovery concerns."
                    value={data.notes}
                    onChange={(event) => updateValue("notes", event.target.value)}
                    // Matches the daily_checkins_notes_size constraint, so a long
                    // note is stopped here rather than rejected by the database.
                    inputProps={{ maxLength: 2000, "aria-label": "Notes" }}
                    helperText={data.notes.length > 1800 ? `${data.notes.length}/2000` : " "}
                  />
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Stack spacing={2.5} sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <PsychologyIcon sx={{ color: "#0284c7" }} />
                    <Typography variant="h6" fontWeight={950}>
                      AI Coach Summary
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      mt: 2,
                      p: "14px 16px",
                      borderRadius: 3,
                      bgcolor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ position: "absolute", top: 0, left: 0, width: 4, bottom: 0, bgcolor: "#2563eb", borderRadius: "4px 0 0 4px" }} />
                    <Box sx={{ pl: "8px" }}>
                      <Typography fontSize={12} fontWeight={800} letterSpacing="0.08em" textTransform="uppercase" color="#2563eb" sx={{ mb: 0.75 }}>
                        Coach Tip
                      </Typography>
                      <Typography color="#1e3a5f" fontSize={14} lineHeight={1.8}>
                        {getAIAdvice(data)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={950} sx={{ mb: 2 }}>
                    {isRetrospective ? "Save Past Check-In" : "Save Today’s Check-In"}
                  </Typography>

                  <Typography color="#64748b" lineHeight={1.8} sx={{ mb: 2 }}>
                    This will save your readiness, recovery, injury risk, and input data
                    for {selectedDateLabel} to your account.
                  </Typography>

                  {loadState === "error" && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                      We couldn't check whether a check-in exists for this date. Please
                      reload and try again before saving to avoid replacing stored data.
                    </Alert>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={saving || loadState !== "ready"}
                    sx={{
                      borderRadius: 3,
                      bgcolor: "#0f172a",
                      fontWeight: 950,
                      py: 1.3,
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#1e293b",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {saving
                      ? "Saving..."
                      : loadState === "loading"
                      ? "Loading selected check-in…"
                      : alreadyCheckedIn
                      ? `Update Check-In for ${selectedDateShort}`
                      : `Save Check-In for ${selectedDateShort}`}
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}