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
  MenuItem,
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

type ExtendedUserPreferences = UserPreferences & {
  age: string;
  height_cm: string;
  weight_kg: string;
  activity_level: string;
  workout_duration: string;
  equipment_access: string;
  dietary_preference: string;
  food_allergies: string;
  foods_avoid: string;
  meals_per_day: string;
  cooking_access: string;
};

const initialForm: ExtendedUserPreferences = {
  primary_sport: "",
  experience_level: "",
  main_goal: "",
  training_days: "",
  competition_level: "",
  injury_areas: "",
  priorities: "",
  sleep_range: "",
  athlete_type: "",
  age: "",
  height_cm: "",
  weight_kg: "",
  activity_level: "",
  workout_duration: "",
  equipment_access: "",
  dietary_preference: "",
  food_allergies: "",
  foods_avoid: "",
  meals_per_day: "",
  cooking_access: "",
};

export default function OnboardingSurvey() {
  const navigate = useNavigate();

  const [form, setForm] = React.useState<ExtendedUserPreferences>(initialForm);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getUserPreferences()
      .then((prefs) => {
        if (!prefs) return;

        const extendedPrefs = prefs as Partial<ExtendedUserPreferences>;

        setForm({
          ...initialForm,
          ...extendedPrefs,
          primary_sport: extendedPrefs.primary_sport || "",
          experience_level: extendedPrefs.experience_level || "",
          main_goal: extendedPrefs.main_goal || "",
          training_days: extendedPrefs.training_days || "",
          competition_level: extendedPrefs.competition_level || "",
          injury_areas: extendedPrefs.injury_areas || "",
          priorities: extendedPrefs.priorities || "",
          sleep_range: extendedPrefs.sleep_range || "",
          athlete_type: extendedPrefs.athlete_type || "",
          age: extendedPrefs.age || "",
          height_cm: extendedPrefs.height_cm || "",
          weight_kg: extendedPrefs.weight_kg || "",
          activity_level: extendedPrefs.activity_level || "",
          workout_duration: extendedPrefs.workout_duration || "",
          equipment_access: extendedPrefs.equipment_access || "",
          dietary_preference: extendedPrefs.dietary_preference || "",
          food_allergies: extendedPrefs.food_allergies || "",
          foods_avoid: extendedPrefs.foods_avoid || "",
          meals_per_day: extendedPrefs.meals_per_day || "",
          cooking_access: extendedPrefs.cooking_access || "",
        });
      })
      .catch(() => {
        setError("We could not load your existing preferences.");
      })
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof ExtendedUserPreferences>(
    key: K,
    value: ExtendedUserPreferences[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function validateNumber(
    value: string,
    label: string,
    minimum: number,
    maximum: number
  ) {
    const parsed = Number(value);

    if (!value.trim()) return `Please enter your ${label}.`;
    if (!Number.isFinite(parsed)) return `${label} must be a number.`;
    if (parsed < minimum || parsed > maximum) {
      return `Please enter a realistic ${label} between ${minimum} and ${maximum}.`;
    }

    return null;
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

    const ageError = validateNumber(form.age, "age", 10, 100);
    if (ageError) return ageError;

    const heightError = validateNumber(form.height_cm, "height in centimeters", 100, 250);
    if (heightError) return heightError;

    const weightError = validateNumber(form.weight_kg, "weight in kilograms", 30, 300);
    if (weightError) return weightError;

    if (!form.activity_level.trim()) return "Please choose your activity level.";
    if (!form.workout_duration.trim()) return "Please enter your preferred workout duration.";
    if (!form.equipment_access.trim()) return "Please describe the equipment you can access.";
    if (!form.dietary_preference.trim()) return "Please select your dietary preference.";
    if (!form.food_allergies.trim()) return "Please enter food allergies or type None.";
    if (!form.foods_avoid.trim()) return "Please enter foods you avoid or type None.";
    if (!form.meals_per_day.trim()) return "Please enter your usual number of meals per day.";
    if (!form.cooking_access.trim()) return "Please describe your access to food preparation.";

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
      const preferencesToSave: ExtendedUserPreferences = {
        primary_sport: form.primary_sport.trim(),
        experience_level: form.experience_level.trim(),
        main_goal: form.main_goal.trim(),
        training_days: form.training_days.trim(),
        competition_level: form.competition_level.trim(),
        injury_areas: form.injury_areas.trim(),
        priorities: form.priorities.trim(),
        sleep_range: form.sleep_range.trim(),
        athlete_type: form.athlete_type.trim(),
        age: form.age.trim(),
        height_cm: form.height_cm.trim(),
        weight_kg: form.weight_kg.trim(),
        activity_level: form.activity_level.trim(),
        workout_duration: form.workout_duration.trim(),
        equipment_access: form.equipment_access.trim(),
        dietary_preference: form.dietary_preference.trim(),
        food_allergies: form.food_allergies.trim(),
        foods_avoid: form.foods_avoid.trim(),
        meals_per_day: form.meals_per_day.trim(),
        cooking_access: form.cooking_access.trim(),
      };

      await saveUserPreferences(preferencesToSave);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save preferences.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f8fafc",
        }}
      >
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
              Your answers help SportLab create safer, more useful workout and
              nutrition guidance. You can edit them later from your profile.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={900} gutterBottom>
                    Body Information
                  </Typography>

                  <Typography sx={{ color: "text.secondary", mb: 2, fontSize: 14 }}>
                    These measurements help estimate appropriate exercise volume
                    and general nutrition needs. They are not used for medical diagnosis.
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Age"
                      placeholder="Example: 16"
                      value={form.age}
                      onChange={(event) => updateField("age", event.target.value)}
                      inputProps={{ min: 10, max: 100 }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Height (cm)"
                        placeholder="Example: 175"
                        value={form.height_cm}
                        onChange={(event) =>
                          updateField("height_cm", event.target.value)
                        }
                        inputProps={{ min: 100, max: 250, step: 0.1 }}
                      />

                      <TextField
                        fullWidth
                        type="number"
                        label="Weight (kg)"
                        placeholder="Example: 68"
                        value={form.weight_kg}
                        onChange={(event) =>
                          updateField("weight_kg", event.target.value)
                        }
                        inputProps={{ min: 30, max: 300, step: 0.1 }}
                      />
                    </Stack>

                    <TextField
                      fullWidth
                      select
                      label="Overall activity level"
                      value={form.activity_level}
                      onChange={(event) =>
                        updateField("activity_level", event.target.value)
                      }
                    >
                      <MenuItem value="Mostly sedentary">Mostly sedentary</MenuItem>
                      <MenuItem value="Lightly active">Lightly active</MenuItem>
                      <MenuItem value="Moderately active">Moderately active</MenuItem>
                      <MenuItem value="Very active">Very active</MenuItem>
                      <MenuItem value="Highly active or training twice daily">
                        Highly active or training twice daily
                      </MenuItem>
                    </TextField>
                  </Stack>
                </CardContent>
              </Card>

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
                      onChange={(event) =>
                        updateField("primary_sport", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      select
                      label="Experience level"
                      value={form.experience_level}
                      onChange={(event) =>
                        updateField("experience_level", event.target.value)
                      }
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                      <MenuItem value="Elite">Elite</MenuItem>
                    </TextField>

                    <TextField
                      fullWidth
                      label="Do you compete? If yes, at what level?"
                      placeholder="Example: School team, club, regional, no competition..."
                      value={form.competition_level}
                      onChange={(event) =>
                        updateField("competition_level", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      label="What type of athlete are you?"
                      placeholder="Example: Endurance, power, skill, or team-sport athlete..."
                      value={form.athlete_type}
                      onChange={(event) =>
                        updateField("athlete_type", event.target.value)
                      }
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
                      placeholder="Example: Improve speed, build strength, gain endurance..."
                      value={form.main_goal}
                      onChange={(event) =>
                        updateField("main_goal", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="How many days per week do you train?"
                      placeholder="Example: 5"
                      value={form.training_days}
                      onChange={(event) =>
                        updateField("training_days", event.target.value)
                      }
                      inputProps={{ min: 0, max: 7 }}
                    />

                    <TextField
                      fullWidth
                      label="Preferred workout duration"
                      placeholder="Example: 45–60 minutes"
                      value={form.workout_duration}
                      onChange={(event) =>
                        updateField("workout_duration", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="What equipment can you access?"
                      placeholder="Example: Full gym, dumbbells, resistance bands, bodyweight only..."
                      value={form.equipment_access}
                      onChange={(event) =>
                        updateField("equipment_access", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="What are your top training priorities?"
                      placeholder="Example: Speed, strength, recovery, flexibility..."
                      value={form.priorities}
                      onChange={(event) =>
                        updateField("priorities", event.target.value)
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={900} gutterBottom>
                    Recovery and Safety
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Any injuries, medical restrictions, or areas of concern?"
                      placeholder="Example: Knee pain, shoulder soreness, asthma, none..."
                      value={form.injury_areas}
                      onChange={(event) =>
                        updateField("injury_areas", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      label="How much do you usually sleep?"
                      placeholder="Example: 7–8 hours"
                      value={form.sleep_range}
                      onChange={(event) =>
                        updateField("sleep_range", event.target.value)
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={900} gutterBottom>
                    Nutrition and Food Access
                  </Typography>

                  <Typography sx={{ color: "text.secondary", mb: 2, fontSize: 14 }}>
                    SportLab should never recommend foods that conflict with your
                    allergies, dietary needs, or available food options.
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      select
                      label="Dietary preference"
                      value={form.dietary_preference}
                      onChange={(event) =>
                        updateField("dietary_preference", event.target.value)
                      }
                    >
                      <MenuItem value="No specific preference">
                        No specific preference
                      </MenuItem>
                      <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                      <MenuItem value="Vegan">Vegan</MenuItem>
                      <MenuItem value="Pescatarian">Pescatarian</MenuItem>
                      <MenuItem value="Halal">Halal</MenuItem>
                      <MenuItem value="Kosher">Kosher</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Food allergies or intolerances"
                      placeholder="Example: Peanuts, shellfish, lactose; type None if none"
                      value={form.food_allergies}
                      onChange={(event) =>
                        updateField("food_allergies", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Foods you dislike or avoid"
                      placeholder="Example: Mushrooms, pork, spicy food; type None if none"
                      value={form.foods_avoid}
                      onChange={(event) =>
                        updateField("foods_avoid", event.target.value)
                      }
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="How many meals do you usually eat per day?"
                      placeholder="Example: 3"
                      value={form.meals_per_day}
                      onChange={(event) =>
                        updateField("meals_per_day", event.target.value)
                      }
                      inputProps={{ min: 1, max: 10 }}
                    />

                    <TextField
                      fullWidth
                      select
                      label="Access to food preparation"
                      value={form.cooking_access}
                      onChange={(event) =>
                        updateField("cooking_access", event.target.value)
                      }
                    >
                      <MenuItem value="School dining hall only">
                        School dining hall only
                      </MenuItem>
                      <MenuItem value="Dining hall and microwave">
                        Dining hall and microwave
                      </MenuItem>
                      <MenuItem value="Limited kitchen access">
                        Limited kitchen access
                      </MenuItem>
                      <MenuItem value="Full kitchen access">
                        Full kitchen access
                      </MenuItem>
                    </TextField>
                  </Stack>
                </CardContent>
              </Card>

              <Alert severity="info">
                SportLab provides general fitness and nutrition guidance, not
                medical treatment. Users with injuries, food allergies, medical
                conditions, or significant dietary concerns should follow advice
                from a qualified professional.
              </Alert>

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