import React from "react";
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

import { createDailyCheckIn } from "../services/checkinService";

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
      { key: "sleepHours", label: "Sleep Hours", min: 1, max: 10 },
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

  return clamp(Math.round(positive * 7 - negative * 4));
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

  const readiness = calculateReadiness(data);
  const injuryRisk = calculateInjuryRisk(data);
  const recovery = calculateRecovery(data);

  const updateValue = (key: keyof CheckInData, value: number | string) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSubmitted(false);
    setError(null);
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
      });

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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
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
            sx={{
              fontWeight: 950,
              letterSpacing: -0.8,
              color: "#0f172a",
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            How are you feeling today?
          </Typography>

          <Typography color="#64748b" maxWidth={760} lineHeight={1.8}>
            Enter your daily sleep, recovery, training, nutrition, and injury data.
            Your AI coach will estimate readiness, recovery, and injury risk.
          </Typography>
        </Stack>

        {submitted && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Daily check-in saved successfully.
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
                      <Typography fontSize={11} fontWeight={800} letterSpacing="0.08em" textTransform="uppercase" color="#2563eb" sx={{ mb: 0.75 }}>
                        AI Recommendation
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
                    Save Today’s Check-In
                  </Typography>

                  <Typography color="#64748b" lineHeight={1.8} sx={{ mb: 2 }}>
                    This will save your readiness, recovery, injury risk, and input data
                    to your Supabase database.
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={saving}
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
                    {saving ? "Saving..." : "Save Daily Check-In"}
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