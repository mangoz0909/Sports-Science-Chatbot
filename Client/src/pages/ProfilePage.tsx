import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SpeedIcon from "@mui/icons-material/Speed";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { supabase } from "../lib/supabaseClient";
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from "../services/preferencesService";
import { getLatestCheckIn } from "../services/checkinService";

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [checkIn, setCheckIn] = React.useState<any>(null);

  const [form, setForm] = React.useState<UserPreferences>({
    primary_sport: "",
    experience_level: "",
    main_goal: "",
    training_days: "",
    competition_level: "",
    injury_areas: "",
    priorities: "",
    sleep_range: "",
    athlete_type: "",
  });

  React.useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;
        if (userError) throw userError;
        if (!user) throw new Error("You must be logged in.");

        setEmail(user.email || "");
        setName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            ""
        );

        const [prefs, latestCheckIn] = await Promise.all([
          getUserPreferences(),
          getLatestCheckIn(),
        ]);

        if (!mounted) return;

        setCheckIn(latestCheckIn);

        if (prefs) {
          setForm({
            primary_sport: prefs.primary_sport || "",
            experience_level: prefs.experience_level || "",
            main_goal: prefs.main_goal || "",
            training_days: prefs.training_days || "",
            competition_level: prefs.competition_level || "",
            injury_areas: prefs.injury_areas || "",
            priorities: prefs.priorities || "",
            sleep_range: prefs.sleep_range || "",
            athlete_type: prefs.athlete_type || "",
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function updateField<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
        },
      });

      await saveUserPreferences({
        primary_sport: form.primary_sport.trim(),
        experience_level: form.experience_level.trim(),
        main_goal: form.main_goal.trim(),
        training_days: form.training_days.trim(),
        competition_level: form.competition_level.trim(),
        injury_areas: form.injury_areas.trim(),
        priorities: form.priorities.trim(),
        sleep_range: form.sleep_range.trim(),
        athlete_type: form.athlete_type.trim(),
      });

      setSuccess("Information updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update information.");
    } finally {
      setSaving(false);
    }
  }

  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const metrics = [
    {
      label: "Readiness",
      subtitle: "Training availability",
      value: checkIn?.readiness_score ?? 0,
      icon: <MonitorHeartIcon />,
    },
    {
      label: "Recovery",
      subtitle: "Sleep, soreness, fatigue",
      value: checkIn?.recovery_score ?? 0,
      icon: <FitnessCenterIcon />,
    },
    {
      label: "Training Load",
      subtitle: "Session intensity",
      value: checkIn?.training_intensity
        ? Math.round(checkIn.training_intensity * 10)
        : 0,
      icon: <SpeedIcon />,
    },
    {
      label: "Sleep Quality",
      subtitle: "Mental performance",
      value: checkIn?.sleep_quality
        ? Math.round(checkIn.sleep_quality * 10)
        : 0,
      icon: <PsychologyIcon />,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: { xs: 3, md: 6 } }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Chip
              label="Athlete Profile"
              sx={{
                bgcolor: "#dcfce7",
                color: "#047857",
                fontWeight: 900,
                mb: 2,
              }}
            />

            <Typography
              variant="h2"
              sx={{
                fontWeight: 950,
                letterSpacing: -1.2,
                fontSize: { xs: "1.75rem", md: "4rem" },
                color: "#0f172a",
              }}
            >
              Your sports science workspace.
            </Typography>

            <Typography
              color="#64748b"
              fontSize={{ xs: 15, md: 18 }}
              sx={{ mt: 1 }}
            >
              Store athlete context, track profile metrics, and personalize
              SportLab AI.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  height: "100%",
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                <Stack spacing={3} alignItems="center">
                  <Avatar
                    sx={{
                      width: { xs: 88, md: 112 },
                      height: { xs: 88, md: 112 },
                      bgcolor: "#0f172a",
                      color: "#38bdf8",
                      fontWeight: 950,
                      fontSize: { xs: 26, md: 34 },
                    }}
                  >
                    {initials}
                  </Avatar>

                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={950}>
                      {name || "Athlete"}
                    </Typography>
                    <Typography color="#64748b">{email}</Typography>

                    <Stack
                      direction="row"
                      justifyContent="center"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 2 }}
                    >
                      <Chip
                        label={form.primary_sport || "Sport"}
                        sx={{ fontWeight: 900 }}
                      />
                      <Chip
                        label="Active"
                        sx={{
                          bgcolor: "#dcfce7",
                          color: "#047857",
                          fontWeight: 900,
                        }}
                      />
                    </Stack>
                  </Box>

                  <Stack spacing={2.5} sx={{ width: "100%", mt: 2 }}>
                    {metrics.map((metric) => (
                      <Box key={metric.label}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={{ xs: 1, md: 0 }}
                          sx={{
                            mb: 0.8,
                            textAlign: { xs: "center", md: "left" },
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.2}
                            alignItems="center"
                          >
                            <Box sx={{ color: "#0284c7" }}>{metric.icon}</Box>
                            <Box>
                              <Typography fontWeight={900}>
                                {metric.label}
                              </Typography>
                              <Typography color="#64748b" fontSize={13}>
                                {metric.subtitle}
                              </Typography>
                            </Box>
                          </Stack>

                          <Typography fontWeight={950}>
                            {metric.value}%
                          </Typography>
                        </Stack>

                        <LinearProgress
                          variant="determinate"
                          value={metric.value}
                          sx={{
                            height: 8,
                            borderRadius: 99,
                            bgcolor: "#e2e8f0",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 99,
                              bgcolor: "#0284c7",
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <Card
                  elevation={0}
                  sx={{
                    width: "100%",
                    textAlign: { xs: "center", md: "left" },
                    borderRadius: 5,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="h5" fontWeight={950} gutterBottom>
                      Profile Details
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={email}
                          disabled
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Primary Sport"
                          placeholder="Example: Tennis"
                          value={form.primary_sport}
                          onChange={(e) =>
                            updateField("primary_sport", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Main Goal"
                          placeholder="Example: Improve speed and recovery"
                          value={form.main_goal}
                          onChange={(e) =>
                            updateField("main_goal", e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card
                  elevation={0}
                  sx={{
                    width: "100%",
                    textAlign: { xs: "center", md: "left" },
                    borderRadius: 5,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="h5" fontWeight={950} gutterBottom>
                      Add / Update Athlete Information
                    </Typography>

                    <Typography color="#64748b" sx={{ mb: 3 }}>
                      Add extra survey details here. Sports Match and SportLab AI
                      will use this information.
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Experience Level"
                          placeholder="Example: Beginner, intermediate, advanced"
                          value={form.experience_level}
                          onChange={(e) =>
                            updateField("experience_level", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Training Days Per Week"
                          placeholder="Example: 5"
                          value={form.training_days}
                          onChange={(e) =>
                            updateField("training_days", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Competition Level"
                          placeholder="Example: School team, club team, regional"
                          value={form.competition_level}
                          onChange={(e) =>
                            updateField("competition_level", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Average Sleep"
                          placeholder="Example: 7–8 hours"
                          value={form.sleep_range}
                          onChange={(e) =>
                            updateField("sleep_range", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label="Training Priorities"
                          placeholder="Example: Speed, strength, recovery, flexibility"
                          value={form.priorities}
                          onChange={(e) =>
                            updateField("priorities", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label="Injuries or Areas of Concern"
                          placeholder="Example: Knee soreness, shoulder pain, none"
                          value={form.injury_areas}
                          onChange={(e) =>
                            updateField("injury_areas", e.target.value)
                          }
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Athlete Type"
                          placeholder="Example: Power athlete, endurance athlete, team sport athlete"
                          value={form.athlete_type}
                          onChange={(e) =>
                            updateField("athlete_type", e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      disabled={saving}
                      onClick={handleSave}
                      sx={{
                        mt: 3,
                        mx: { xs: "auto", md: 0 },
                        display: "block",
                        borderRadius: 3,
                        bgcolor: "#0f172a",
                        fontWeight: 950,
                        px: 3,
                        py: 1.1,
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: "#1e293b",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {saving ? "Updating..." : "Update Information"}
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}