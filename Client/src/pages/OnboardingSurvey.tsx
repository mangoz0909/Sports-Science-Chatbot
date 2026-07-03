import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from "../services/preferencesService";

export default function OnboardingSurvey() {
  const navigate = useNavigate();

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

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getUserPreferences()
      .then((prefs) => {
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  function validate() {
    if (!form.primary_sport.trim()) return "Please enter your primary sport.";
    if (!form.experience_level.trim()) return "Please enter your experience level.";
    if (!form.main_goal.trim()) return "Please enter your main goal.";
    if (!form.training_days.trim()) return "Please enter your training days.";
    if (!form.competition_level.trim()) return "Please enter your competition level.";
    if (!form.injury_areas.trim()) return "Please enter injury areas or type None.";
    if (!form.priorities.trim()) return "Please enter your fitness priorities.";
    if (!form.sleep_range.trim()) return "Please enter your average sleep.";
    if (!form.athlete_type.trim()) return "Please enter your athlete type.";
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
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

      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to save preferences.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f8fafc" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: { xs: 3, md: 5 },
              bgcolor: "#0f172a",
              color: "#fff",
            }}
          >
            <Chip
              label="SportLab Survey"
              sx={{
                bgcolor: "rgba(56,189,248,0.15)",
                color: "#7dd3fc",
                fontWeight: 900,
                mb: 2,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.8,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Personalize your SportLab experience
            </Typography>

            <Typography sx={{ color: "#cbd5e1", mt: 1.5, lineHeight: 1.8 }}>
              Type your preferences below. You can edit these later from your profile.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={900} gutterBottom>
                    Sport Background
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="What sports do you currently play?"
                      placeholder="Example: Tennis, basketball, swimming..."
                      value={form.primary_sport}
                      onChange={(e) => updateField("primary_sport", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="How would you describe your experience level?"
                      placeholder="Example: Beginner, intermediate, advanced..."
                      value={form.experience_level}
                      onChange={(e) => updateField("experience_level", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="Do you compete? If yes, at what level?"
                      placeholder="Example: School team, club, regional, no competition..."
                      value={form.competition_level}
                      onChange={(e) => updateField("competition_level", e.target.value)}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={900} gutterBottom>
                    Goals and Training
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="What are your main athletic goals?"
                      placeholder="Example: Improve speed, build strength, prevent injuries..."
                      value={form.main_goal}
                      onChange={(e) => updateField("main_goal", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="How many days per week do you train?"
                      placeholder="Example: 5"
                      value={form.training_days}
                      onChange={(e) => updateField("training_days", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="What are your top training priorities?"
                      placeholder="Example: Speed, strength, recovery, flexibility..."
                      value={form.priorities}
                      onChange={(e) => updateField("priorities", e.target.value)}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={900} gutterBottom>
                    Recovery and Personalization
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Any injuries or areas of concern?"
                      placeholder="Example: Knee pain, shoulder soreness, none..."
                      value={form.injury_areas}
                      onChange={(e) => updateField("injury_areas", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="How much do you usually sleep?"
                      placeholder="Example: 7–8 hours"
                      value={form.sleep_range}
                      onChange={(e) => updateField("sleep_range", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="What type of athlete are you?"
                      placeholder="Example: Endurance athlete, power athlete, team sport athlete..."
                      value={form.athlete_type}
                      onChange={(e) => updateField("athlete_type", e.target.value)}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    borderRadius: 3,
                    bgcolor: "#0f172a",
                    fontWeight: 950,
                    py: 1.4,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#1e293b",
                      boxShadow: "none",
                    },
                  }}
                >
                  {submitting ? "Saving..." : "Save Preferences"}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 900,
                    py: 1.4,
                  }}
                >
                  Skip for now
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}