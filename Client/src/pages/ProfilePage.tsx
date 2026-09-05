import React from "react";
import Seo from "../components/Seo";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SpeedIcon from "@mui/icons-material/Speed";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { supabase } from "../lib/supabaseClient";
import {
  ExtendedUserPreferences,
  getUserPreferences,
  saveUserPreferences,
} from "../services/preferencesService";
import { getLatestCheckIn } from "../services/checkinService";
import { saveMyName } from "../services/profileService";
import {
  ACTIVITY_LEVELS,
  COOKING_ACCESS_OPTIONS,
  DIETARY_PREFERENCES,
  EXPERIENCE_LEVELS,
  NUMERIC_RANGES,
  isKnownOption,
  toFormString,
} from "../data/profileOptions";

/**
 * A <Select> that still shows a value outside its option list.
 *
 * The survey reads these columns into dropdowns and renders anything
 * unrecognised as an empty box, silently hiding what the athlete saved. This
 * keeps a legacy value visible until they pick a real option.
 */
function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}) {
  return (
    <TextField
      fullWidth
      select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {value && !isKnownOption(value, options) && (
        <MenuItem value={value}>{value} (unrecognised - please reselect)</MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );
}

/**
 * Blank passes: the profile page edits an existing athlete, so an untouched
 * column stays untouched. A filled one has to satisfy the same range the
 * survey enforces.
 */
function rangeError(
  value: string,
  label: string,
  key: keyof typeof NUMERIC_RANGES
): string | null {
  const text = value.trim();

  if (!text) return null;

  const parsed = Number(text);
  const { min, max } = NUMERIC_RANGES[key];

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return `${label} must be a number between ${min} and ${max}.`;
  }

  return null;
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [checkIn, setCheckIn] = React.useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

  const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const [form, setForm] = React.useState<ExtendedUserPreferences>({
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
          const stored = prefs as Record<string, unknown>;

          // Normalised for the same reason as the survey: a numeric column
          // comes back as a number and would break `.trim()` on save.
          setForm({
            primary_sport: toFormString(stored.primary_sport),
            experience_level: toFormString(stored.experience_level),
            main_goal: toFormString(stored.main_goal),
            training_days: toFormString(stored.training_days),
            competition_level: toFormString(stored.competition_level),
            injury_areas: toFormString(stored.injury_areas),
            priorities: toFormString(stored.priorities),
            sleep_range: toFormString(stored.sleep_range),
            athlete_type: toFormString(stored.athlete_type),
            age: toFormString(stored.age),
            height_cm: toFormString(stored.height_cm),
            weight_kg: toFormString(stored.weight_kg),
            activity_level: toFormString(stored.activity_level),
            workout_duration: toFormString(stored.workout_duration),
            equipment_access: toFormString(stored.equipment_access),
            dietary_preference: toFormString(stored.dietary_preference),
            food_allergies: toFormString(stored.food_allergies),
            foods_avoid: toFormString(stored.foods_avoid),
            meals_per_day: toFormString(stored.meals_per_day),
            cooking_access: toFormString(stored.cooking_access),
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

  function updateField<K extends keyof ExtendedUserPreferences>(
    key: K,
    value: ExtendedUserPreferences[K]
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
      // Every numeric column is held to the range the survey enforces, so a
      // value saved here can never block a later retake. Blank is allowed —
      // this is an edit form, and existing athletes have columns never filled.
      const numericError =
        rangeError(form.training_days, "Training days per week", "training_days") ??
        rangeError(form.age, "Age", "age") ??
        rangeError(form.height_cm, "Height", "height_cm") ??
        rangeError(form.weight_kg, "Weight", "weight_kg") ??
        rangeError(form.meals_per_day, "Meals per day", "meals_per_day");

      if (numericError) {
        setError(numericError);
        return;
      }

      const cleanName = name.trim();

      if (!cleanName) {
        setError("Please enter your name.");
        return;
      }

      // Both stores, deliberately. The metadata is what this form reads back
      // and what syncGoogleProfile re-derives from on the next OAuth sign-in;
      // profiles.name is what the dashboard greeting reads. Writing one and
      // not the other is what left the two showing different names.
      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
        },
      });

      await saveMyName(cleanName);

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
      });

      setSuccess("Information updated.");
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to update information.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("You must be logged in.");

      const supabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Missing REACT_APP_SUPABASE_URL.");

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Failed to delete account.");
      }

      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to delete account.");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const initials =
    name
      .split(" ")
      .filter(Boolean)
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

  const inputGridSx = {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
    gap: 2,
  };

  // Spans the grid so a section reads as a break rather than a stray label.
  const sectionHeadingSx = {
    gridColumn: "1 / -1",
    mt: 1,
    pt: 2.5,
    borderTop: "1px solid #e2e8f0",
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: "#f8fafc", py: { xs: 4, md: 7 } }} aria-busy="true">
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Stack spacing={3} alignItems="center">
            <Skeleton variant="text" width="min(560px, 90%)" height={68} />
            <Skeleton variant="text" width="min(400px, 70%)" height={26} />
            <Box
              sx={{
                width: "100%",
                maxWidth: 1180,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
                gap: 3,
              }}
            >
              <Skeleton variant="rounded" height={470} sx={{ borderRadius: 5 }} />
              <Stack spacing={3}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: 5 }} />
                <Skeleton variant="rounded" height={340} sx={{ borderRadius: 5 }} />
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100dvh - var(--app-header-h, 64px))",
        bgcolor: "#f8fafc",
        py: { xs: 4, md: 7 },
        overflowX: "hidden",
      }}
    >
      <Seo
        title="My Profile"
        description="Manage your athlete profile, sport preferences, training goals, and account settings."
        path="/profile"
        noIndex
      />
      <Container
        maxWidth="lg"
        disableGutters
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
          mx: "auto",
          boxSizing: "border-box",
        }}
      >
        <Stack spacing={3} sx={{ width: "100%", alignItems: "center" }}>
          <Box sx={{ width: "100%", maxWidth: 900, mx: "auto", textAlign: "center" }}>
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
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3.7rem" },
                color: "#0f172a",
              }}
            >
              Your sports science workspace.
            </Typography>

            <Typography
              color="#64748b"
              fontSize={{ xs: 16, md: 18 }}
              sx={{ mt: 1, maxWidth: 680, mx: "auto", lineHeight: 1.7 }}
            >
              Store athlete context, track profile metrics, and personalize SportLab AI.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: "100%", maxWidth: 1180 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: "100%", maxWidth: 1180 }}>
              {success}
            </Alert>
          )}

          {/* Two-column layout */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 1180,
              mx: "auto",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            {/* Left: avatar + metrics */}
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: { xs: 520, md: "none" },
                mx: "auto",
                p: { xs: 3, sm: 4 },
                borderRadius: 5,
                border: "1px solid #e2e8f0",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              <Stack spacing={3} alignItems="center">
                <Avatar
                  sx={{
                    width: { xs: 96, md: 112 },
                    height: { xs: 96, md: 112 },
                    bgcolor: "#0f172a",
                    color: "#38bdf8",
                    fontWeight: 950,
                    fontSize: { xs: 30, md: 34 },
                  }}
                >
                  {initials}
                </Avatar>

                <Box textAlign="center" sx={{ minWidth: 0 }}>
                  <Typography variant="h5" fontWeight={950}>
                    {name || "Athlete"}
                  </Typography>

                  <Typography color="#64748b" sx={{ wordBreak: "break-word" }}>
                    {email}
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="center"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 2 }}
                  >
                    <Chip label={form.primary_sport || "Sport"} sx={{ fontWeight: 900 }} />
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
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        sx={{ mb: 0.8, textAlign: "left" }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ color: "#0284c7", display: "flex" }}>
                            {metric.icon}
                          </Box>

                          <Box>
                            <Typography fontWeight={900}>{metric.label}</Typography>
                            <Typography color="#64748b" fontSize={13}>
                              {metric.subtitle}
                            </Typography>
                          </Box>
                        </Stack>

                        <Typography fontWeight={950}>{metric.value}%</Typography>
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

            {/* Right: forms */}
            <Stack spacing={3} sx={{ width: "100%", minWidth: 0 }}>
              <Card
                elevation={0}
                sx={{
                  width: "100%",
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  boxSizing: "border-box",
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h5" fontWeight={950} gutterBottom>
                    Profile Details
                  </Typography>

                  <Box sx={inputGridSx}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />

                    <TextField fullWidth label="Email" value={email} disabled />

                    <TextField
                      fullWidth
                      label="Primary Sport"
                      placeholder="Example: Tennis"
                      value={form.primary_sport}
                      onChange={(e) => updateField("primary_sport", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="Main Goal"
                      placeholder="Example: Improve speed and recovery"
                      value={form.main_goal}
                      onChange={(e) => updateField("main_goal", e.target.value)}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card
                elevation={0}
                sx={{
                  width: "100%",
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  boxSizing: "border-box",
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1.5}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="h5" fontWeight={950}>
                      Add / Update Athlete Information
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate("/onboarding", { state: { returnTo: "/profile" } })
                      }
                      sx={{
                        borderRadius: 3,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      Retake Survey
                    </Button>
                  </Stack>

                  <Typography color="#64748b" sx={{ mb: 3 }}>
                    Add extra survey details here. Sports Match and SportLab AI will use
                    this information.
                  </Typography>

                  <Box sx={inputGridSx}>
                    <OptionSelect
                      label="Experience Level"
                      value={form.experience_level}
                      options={EXPERIENCE_LEVELS}
                      onChange={(next) => updateField("experience_level", next)}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Training Days Per Week"
                      placeholder="Example: 5"
                      value={form.training_days}
                      onChange={(e) => updateField("training_days", e.target.value)}
                      inputProps={{
                        min: NUMERIC_RANGES.training_days.min,
                        max: NUMERIC_RANGES.training_days.max,
                      }}
                      helperText={`Whole days per week (${NUMERIC_RANGES.training_days.min}–${NUMERIC_RANGES.training_days.max})`}
                    />

                    <TextField
                      fullWidth
                      label="Preferred Workout Duration"
                      placeholder="Example: 45-60 minutes"
                      value={form.workout_duration}
                      onChange={(e) => updateField("workout_duration", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="Equipment Access"
                      placeholder="Example: Full gym, dumbbells only, bodyweight"
                      value={form.equipment_access}
                      onChange={(e) => updateField("equipment_access", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="Competition Level"
                      placeholder="Example: School team, club team, regional"
                      value={form.competition_level}
                      onChange={(e) => updateField("competition_level", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      label="Average Sleep"
                      placeholder="Example: 7–8 hours"
                      value={form.sleep_range}
                      onChange={(e) => updateField("sleep_range", e.target.value)}
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Training Priorities"
                      placeholder="Example: Speed, strength, recovery, flexibility"
                      value={form.priorities}
                      onChange={(e) => updateField("priorities", e.target.value)}
                      sx={{ gridColumn: "1 / -1" }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Injuries or Areas of Concern"
                      placeholder="Example: Knee soreness, shoulder pain, none"
                      value={form.injury_areas}
                      onChange={(e) => updateField("injury_areas", e.target.value)}
                      sx={{ gridColumn: "1 / -1" }}
                    />

                    <TextField
                      fullWidth
                      label="Athlete Type"
                      placeholder="Example: Power athlete, endurance athlete, team sport athlete"
                      value={form.athlete_type}
                      onChange={(e) => updateField("athlete_type", e.target.value)}
                      sx={{ gridColumn: "1 / -1" }}
                    />

                    <Typography variant="h6" fontWeight={900} sx={sectionHeadingSx}>
                      Body Information
                    </Typography>

                    <TextField
                      fullWidth
                      type="number"
                      label="Age"
                      placeholder="Example: 17"
                      value={form.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      inputProps={{ min: NUMERIC_RANGES.age.min, max: NUMERIC_RANGES.age.max }}
                      helperText={`Years (${NUMERIC_RANGES.age.min}-${NUMERIC_RANGES.age.max})`}
                    />

                    <OptionSelect
                      label="Overall Activity Level"
                      value={form.activity_level}
                      options={ACTIVITY_LEVELS}
                      onChange={(next) => updateField("activity_level", next)}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Height (cm)"
                      placeholder="Example: 175"
                      value={form.height_cm}
                      onChange={(e) => updateField("height_cm", e.target.value)}
                      inputProps={{
                        min: NUMERIC_RANGES.height_cm.min,
                        max: NUMERIC_RANGES.height_cm.max,
                      }}
                      helperText={`Centimetres (${NUMERIC_RANGES.height_cm.min}-${NUMERIC_RANGES.height_cm.max})`}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Weight (kg)"
                      placeholder="Example: 68"
                      value={form.weight_kg}
                      onChange={(e) => updateField("weight_kg", e.target.value)}
                      inputProps={{
                        min: NUMERIC_RANGES.weight_kg.min,
                        max: NUMERIC_RANGES.weight_kg.max,
                      }}
                      helperText={`Kilograms (${NUMERIC_RANGES.weight_kg.min}-${NUMERIC_RANGES.weight_kg.max})`}
                    />

                    <Typography variant="h6" fontWeight={900} sx={sectionHeadingSx}>
                      Nutrition and Food Access
                    </Typography>

                    {/* The nutrition plan is told never to ignore a saved
                        allergy, which only holds if the athlete can correct one
                        here rather than by finding the survey again. */}
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Food Allergies or Intolerances"
                      placeholder="Example: Peanuts, lactose intolerant, none"
                      value={form.food_allergies}
                      onChange={(e) => updateField("food_allergies", e.target.value)}
                      sx={{ gridColumn: "1 / -1" }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Foods You Dislike or Avoid"
                      placeholder="Example: Seafood, spicy food, none"
                      value={form.foods_avoid}
                      onChange={(e) => updateField("foods_avoid", e.target.value)}
                      sx={{ gridColumn: "1 / -1" }}
                    />

                    <OptionSelect
                      label="Dietary Preference"
                      value={form.dietary_preference}
                      options={DIETARY_PREFERENCES}
                      onChange={(next) => updateField("dietary_preference", next)}
                    />

                    <OptionSelect
                      label="Access to Food Preparation"
                      value={form.cooking_access}
                      options={COOKING_ACCESS_OPTIONS}
                      onChange={(next) => updateField("cooking_access", next)}
                    />

                    <TextField
                      fullWidth
                      type="number"
                      label="Meals Per Day"
                      placeholder="Example: 4"
                      value={form.meals_per_day}
                      onChange={(e) => updateField("meals_per_day", e.target.value)}
                      inputProps={{
                        min: NUMERIC_RANGES.meals_per_day.min,
                        max: NUMERIC_RANGES.meals_per_day.max,
                      }}
                      helperText={`Meals (${NUMERIC_RANGES.meals_per_day.min}-${NUMERIC_RANGES.meals_per_day.max})`}
                    />
                  </Box>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ mt: 3 }}
                  >
                    <Button
                      variant="contained"
                      disabled={saving}
                      onClick={handleSave}
                      sx={{
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

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setDeleteConfirmText("");
                        setDeleteDialogOpen(true);
                      }}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 950,
                        px: 3,
                        py: 1.1,
                      }}
                    >
                      Delete Account
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Stack>
      </Container>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 950, color: "#b91c1c" }}>
          Delete Account
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will permanently delete your account and all your data including profile,
            preferences, and check-in history. <strong>This cannot be undone.</strong>
          </DialogContentText>

          <DialogContentText sx={{ mb: 1.5, fontWeight: 700, color: "#0f172a" }}>
            Type <strong>DELETE</strong> to confirm:
          </DialogContentText>

          <TextField
            fullWidth
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={deleting}
            autoComplete="off"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ borderRadius: 3, fontWeight: 900 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== "DELETE" || deleting}
            onClick={handleDeleteAccount}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              borderRadius: 3,
              fontWeight: 900,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            {deleting ? "Deleting..." : "Delete My Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
