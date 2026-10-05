import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  CheckRounded,
  FitnessCenterRounded,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

import Seo from "../components/Seo";

import {
  ExtendedUserPreferences,
  getUserPreferences,
  saveUserPreferences,
} from "../services/preferencesService";

import { toFormString } from "../data/profileOptions";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type FormState = ExtendedUserPreferences & {
  soreness_level?: string;
  energy_level?: string;
  training_age?: string;
  nutrition_goal?: string;
};

type OptionCardProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  description?: string;
};

type MultiOptionProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

/* -------------------------------------------------------------------------- */
/*                                  OPTIONS                                   */
/* -------------------------------------------------------------------------- */

const ACTIVITY_OPTIONS = [
  {
    value: "Low",
    label: "Low",
    description: "Mostly sedentary outside training",
  },
  {
    value: "Moderate",
    label: "Moderate",
    description: "Active during parts of the day",
  },
  {
    value: "High",
    label: "High",
    description: "Very active most days",
  },
  {
    value: "Very High",
    label: "Very High",
    description: "Heavy training or highly active lifestyle",
  },
];

const EXPERIENCE_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Competitive",
];

const COMPETITION_OPTIONS = [
  "None",
  "Recreational",
  "School",
  "Club",
  "Regional",
  "National+",
];

const ATHLETE_TYPES = [
  "Strength",
  "Power",
  "Speed",
  "Endurance",
  "Skill",
  "Mixed",
];

const GOAL_OPTIONS = [
  "Build strength",
  "Build muscle",
  "Improve speed",
  "Improve endurance",
  "Improve explosiveness",
  "Improve mobility",
  "Improve sport performance",
  "Lose body fat",
  "Gain weight / mass",
  "Improve recovery",
];

const EQUIPMENT_OPTIONS = [
  "Full gym",
  "Home gym",
  "Dumbbells",
  "Resistance bands",
  "Bodyweight only",
];

const SLEEP_OPTIONS = [
  "<6 hours",
  "6–7 hours",
  "7–8 hours",
  "8–9 hours",
  "9+ hours",
];

const TRAINING_AGE_OPTIONS = [
  "<1 year",
  "1–2 years",
  "3–5 years",
  "5+ years",
];

const DIET_OPTIONS = [
  "No preference",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Halal",
  "Kosher",
  "Other",
];

const NUTRITION_GOALS = [
  "Maintain",
  "Gain muscle / weight",
  "Support performance",
  "General healthy eating",
];

const COOKING_OPTIONS = [
  "No cooking access",
  "Microwave / basic prep",
  "Shared kitchen",
  "Full kitchen",
  "Dining hall / meal plan",
];

const BODY_AREAS = [
  "None",
  "Shoulder",
  "Elbow",
  "Wrist",
  "Back",
  "Hip",
  "Knee",
  "Ankle",
  "Other",
];

/* -------------------------------------------------------------------------- */
/*                               INITIAL STATE                                */
/* -------------------------------------------------------------------------- */

const initialForm: FormState = {
  primary_sport: "",
  experience_level: "",
  main_goal: "",
  training_days: "4",
  competition_level: "",
  injury_areas: "None",
  priorities: "",
  sleep_range: "",
  athlete_type: "",
  age: "16",

  // Keep metric internally for compatibility with existing DB.
  height_cm: "175",
  weight_kg: "68",

  activity_level: "",
  workout_duration: "60",
  equipment_access: "",
  dietary_preference: "No preference",
  food_allergies: "None",
  foods_avoid: "None",
  meals_per_day: "3",
  cooking_access: "",

  soreness_level: "",
  energy_level: "",
  training_age: "",
  nutrition_goal: "",
};

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function cmToTotalInches(cm: number) {
  return cm / 2.54;
}

function inchesToCm(inches: number) {
  return inches * 2.54;
}

function kgToLb(kg: number) {
  return kg * 2.2046226218;
}

function lbToKg(lb: number) {
  return lb / 2.2046226218;
}

function calculateBMI(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return null;

  const meters = heightCm / 100;

  if (meters <= 0) return null;

  return weightKg / (meters * meters);
}

function toggleListValue(current: string, value: string) {
  const values = current
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.includes(value)) {
    return values.filter((item) => item !== value).join(", ");
  }

  return [...values, value].join(", ");
}

/* -------------------------------------------------------------------------- */
/*                              SMALL COMPONENTS                              */
/* -------------------------------------------------------------------------- */

function OptionCard({
  label,
  selected,
  onClick,
  description,
}: OptionCardProps) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: 3,
        borderWidth: 2,
        borderColor: selected ? "#0f172a" : "#e2e8f0",
        bgcolor: selected ? "#f8fafc" : "#fff",
        transition: "all 160ms ease",
        height: "100%",
        "&:hover": {
          borderColor: "#64748b",
          transform: "translateY(-1px)",
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        },
      }}
    >
      <Box sx={{ p: 2.25 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography fontWeight={850}>{label}</Typography>

          {selected && (
            <Box
              sx={{
                width: 25,
                height: 25,
                borderRadius: "50%",
                bgcolor: "#0f172a",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <CheckRounded sx={{ fontSize: 17 }} />
            </Box>
          )}
        </Stack>

        {description && (
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 13,
              lineHeight: 1.5,
              mt: 0.7,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

function MultiOption({ label, selected, onClick }: MultiOptionProps) {
  return (
    <Chip
      clickable
      label={label}
      onClick={onClick}
      icon={selected ? <CheckRounded /> : undefined}
      sx={{
        height: 42,
        borderRadius: 2.5,
        px: 0.7,
        fontWeight: 800,
        bgcolor: selected ? "#0f172a" : "#f8fafc",
        color: selected ? "#fff" : "#334155",
        border: "1px solid",
        borderColor: selected ? "#0f172a" : "#e2e8f0",

        "& .MuiChip-icon": {
          color: selected ? "#fff" : undefined,
        },

        "&:hover": {
          bgcolor: selected ? "#1e293b" : "#f1f5f9",
        },
      }}
    />
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        sx={{
          color: "#0284c7",
          textTransform: "uppercase",
          letterSpacing: 1.3,
          fontSize: 12,
          fontWeight: 950,
          mb: 0.8,
        }}
      >
        {eyebrow}
      </Typography>

      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 950,
          letterSpacing: -0.6,
          color: "#0f172a",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          color: "#64748b",
          mt: 1,
          lineHeight: 1.7,
          maxWidth: 650,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function SliderBlock({
  title,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
  marks,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  onChange: (value: number) => void;
  marks?: { value: number; label: string }[];
}) {
  return (
    <Box
      sx={{
        p: { xs: 2.25, sm: 3 },
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        bgcolor: "#fff",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography fontWeight={850}>{title}</Typography>

        <Box
          sx={{
            bgcolor: "#f1f5f9",
            px: 1.5,
            py: 0.7,
            borderRadius: 2,
            minWidth: 72,
            textAlign: "center",
          }}
        >
          <Typography fontWeight={950} color="#0f172a">
            {displayValue}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ px: 1 }}>
        <Slider
          value={value}
          min={min}
          max={max}
          step={step}
          marks={marks}
          onChange={(_, newValue) => onChange(newValue as number)}
          sx={{
            color: "#0f172a",
            height: 7,

            "& .MuiSlider-thumb": {
              width: 22,
              height: 22,
            },

            "& .MuiSlider-rail": {
              opacity: 0.18,
            },

            "& .MuiSlider-markLabel": {
              fontSize: 11,
              color: "#94a3b8",
            },
          }}
        />
      </Box>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function OnboardingSurvey() {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ??
    "/dashboard";

  const [form, setForm] = React.useState<FormState>(initialForm);
  const [step, setStep] = React.useState(0);

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalSteps = 5;

  /* ---------------------------------------------------------------------- */
  /*                              LOAD PROFILE                              */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    getUserPreferences()
      .then((prefs) => {
        if (!prefs) return;

        const stored = prefs as Record<string, unknown>;

        setForm((previous) => ({
          ...previous,

          primary_sport: toFormString(stored.primary_sport),
          experience_level: toFormString(stored.experience_level),
          main_goal: toFormString(stored.main_goal),

          training_days:
            toFormString(stored.training_days) || previous.training_days,

          competition_level: toFormString(stored.competition_level),

          injury_areas:
            toFormString(stored.injury_areas) || previous.injury_areas,

          priorities: toFormString(stored.priorities),
          sleep_range: toFormString(stored.sleep_range),
          athlete_type: toFormString(stored.athlete_type),

          age: toFormString(stored.age) || previous.age,

          height_cm:
            toFormString(stored.height_cm) || previous.height_cm,

          weight_kg:
            toFormString(stored.weight_kg) || previous.weight_kg,

          activity_level: toFormString(stored.activity_level),

          workout_duration:
            toFormString(stored.workout_duration) ||
            previous.workout_duration,

          equipment_access: toFormString(stored.equipment_access),

          dietary_preference:
            toFormString(stored.dietary_preference) ||
            previous.dietary_preference,

          food_allergies:
            toFormString(stored.food_allergies) ||
            previous.food_allergies,

          foods_avoid:
            toFormString(stored.foods_avoid) ||
            previous.foods_avoid,

          meals_per_day:
            toFormString(stored.meals_per_day) ||
            previous.meals_per_day,

          cooking_access: toFormString(stored.cooking_access),
        }));
      })
      .catch(() => {
        setError("We could not load your existing athlete profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                              UPDATE FIELD                              */
  /* ---------------------------------------------------------------------- */

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError(null);
  }

  /* ---------------------------------------------------------------------- */
  /*                           DERIVED BODY VALUES                           */
  /* ---------------------------------------------------------------------- */

  const heightCm = Number(form.height_cm) || 175;
  const weightKg = Number(form.weight_kg) || 68;

  const totalHeightInches = Math.round(cmToTotalInches(heightCm));

  const heightFeet = Math.floor(totalHeightInches / 12);
  const heightInches = totalHeightInches % 12;

  const weightLb = Math.round(kgToLb(weightKg));

  const bmi = calculateBMI(weightKg, heightCm);

  /* ---------------------------------------------------------------------- */
  /*                               VALIDATION                               */
  /* ---------------------------------------------------------------------- */

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      if (!form.age.trim()) return "Please provide your age.";

      if (!form.activity_level.trim()) {
        return "Please select your activity level.";
      }
    }

    if (currentStep === 1) {
      if (!form.primary_sport.trim()) {
        return "Please enter your primary sport.";
      }

      if (!form.experience_level.trim()) {
        return "Please choose your experience level.";
      }
    }

    if (currentStep === 2) {
      if (!form.main_goal.trim()) {
        return "Please choose at least one training goal.";
      }

      if (!form.training_days.trim()) {
        return "Please choose your weekly training frequency.";
      }

      if (!form.workout_duration.trim()) {
        return "Please choose your preferred workout duration.";
      }

      if (!form.equipment_access.trim()) {
        return "Please choose your available equipment.";
      }
    }

    return null;
  }

  function nextStep() {
    const validationError = validateStep(step);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, totalSteps - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousStep() {
    setError(null);

    setStep((current) => Math.max(current - 1, 0));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ---------------------------------------------------------------------- */
  /*                                  SAVE                                  */
  /* ---------------------------------------------------------------------- */

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    /*
     * Pressing Enter in a step's only text field (e.g. "Primary sport")
     * submits the whole form — the browser does that even with no submit
     * button on screen. Treat it as "Continue" until the final step.
     */
    if (step < totalSteps - 1) {
      nextStep();
      return;
    }

    for (let s = 0; s < totalSteps; s++) {
      const validationError = validateStep(s);

      if (validationError) {
        setStep(s);
        setError(validationError);
        return;
      }
    }

    setError(null);
    setSubmitting(true);

    try {
      const preferencesToSave: ExtendedUserPreferences = {
        primary_sport: form.primary_sport.trim(),
        experience_level: form.experience_level.trim(),
        main_goal: form.main_goal.trim(),

        training_days: form.training_days.trim(),

        competition_level:
          form.competition_level.trim() || "None",

        injury_areas:
          form.injury_areas.trim() || "None",

        priorities:
          form.priorities.trim() || form.main_goal.trim(),

        sleep_range:
          form.sleep_range.trim() || "Not provided",

        athlete_type:
          form.athlete_type.trim() || "Mixed",

        age: form.age.trim(),

        // Still metric in database:
        height_cm: form.height_cm.trim(),
        weight_kg: form.weight_kg.trim(),

        activity_level: form.activity_level.trim(),

        workout_duration:
          form.workout_duration.trim(),

        equipment_access:
          form.equipment_access.trim(),

        dietary_preference:
          form.dietary_preference.trim() || "No preference",

        food_allergies:
          form.food_allergies.trim() || "None",

        foods_avoid:
          form.foods_avoid.trim() || "None",

        meals_per_day:
          form.meals_per_day.trim() || "3",

        cooking_access:
          form.cooking_access.trim() || "Not provided",
      };

      await saveUserPreferences(preferencesToSave);

      navigate(returnTo);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save your athlete profile.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                                LOADING                                 */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f8fafc",
          py: { xs: 3, md: 6 },
        }}
      >
        <Container maxWidth="md">
          <Skeleton
            variant="rounded"
            height={150}
            sx={{ borderRadius: 5, mb: 3 }}
          />

          <Skeleton
            variant="rounded"
            height={500}
            sx={{ borderRadius: 5 }}
          />
        </Container>
      </Box>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                              STEP CONTENT                              */
  /* ---------------------------------------------------------------------- */

  function renderStep() {
    /* ------------------------------ STEP 1 ------------------------------ */

    if (step === 0) {
      return (
        <>
          <SectionTitle
            eyebrow="Step 1 · Athlete profile"
            title="Tell us about you"
            description="Basic body and activity information helps SportLab personalize training recommendations."
          />

          <Stack spacing={3}>
            <SliderBlock
              title="Age"
              value={Number(form.age) || 16}
              min={12}
              max={80}
              displayValue={`${form.age || 16}`}
              onChange={(value) =>
                updateField("age", String(value))
              }
              marks={[
                { value: 12, label: "12" },
                { value: 30, label: "30" },
                { value: 50, label: "50" },
                { value: 80, label: "80" },
              ]}
            />

            <SliderBlock
              title="Height"
              value={totalHeightInches}
              min={48}
              max={84}
              displayValue={`${heightFeet}' ${heightInches}"`}
              onChange={(value) =>
                updateField(
                  "height_cm",
                  inchesToCm(value).toFixed(1)
                )
              }
              marks={[
                { value: 48, label: "4'" },
                { value: 60, label: "5'" },
                { value: 72, label: "6'" },
                { value: 84, label: "7'" },
              ]}
            />

            <SliderBlock
              title="Weight"
              value={weightLb}
              min={70}
              max={350}
              displayValue={`${weightLb} lb`}
              onChange={(value) =>
                updateField(
                  "weight_kg",
                  lbToKg(value).toFixed(1)
                )
              }
              marks={[
                { value: 70, label: "70" },
                { value: 150, label: "150" },
                { value: 250, label: "250" },
                { value: 350, label: "350" },
              ]}
            />

            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: "#f0f9ff",
                border: "1px solid #bae6fd",
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography
                    fontWeight={900}
                    color="#0c4a6e"
                  >
                    Estimated BMI
                  </Typography>

                  <Typography
                    sx={{
                      color: "#0369a1",
                      fontSize: 13,
                      mt: 0.4,
                    }}
                  >
                    Calculated automatically from your height
                    and weight.
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: 27,
                    fontWeight: 950,
                    color: "#0c4a6e",
                  }}
                >
                  {bmi ? bmi.toFixed(1) : "—"}
                </Typography>
              </Stack>

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: 12,
                  mt: 1.5,
                  lineHeight: 1.5,
                }}
              >
                BMI is only one general body-size measure and
                does not directly measure athletic fitness or
                body composition.
              </Typography>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Overall activity level
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 1.5,
                }}
              >
                {ACTIVITY_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    selected={
                      form.activity_level === option.value
                    }
                    onClick={() =>
                      updateField(
                        "activity_level",
                        option.value
                      )
                    }
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </>
      );
    }

    /* ------------------------------ STEP 2 ------------------------------ */

    if (step === 1) {
      return (
        <>
          <SectionTitle
            eyebrow="Step 2 · Sport"
            title="Your athletic background"
            description="Tell SportLab what you play and your current training experience."
          />

          <Stack spacing={3.5}>
            <TextField
              fullWidth
              label="Primary sport"
              placeholder="Tennis, soccer, basketball..."
              value={form.primary_sport}
              onChange={(event) =>
                updateField(
                  "primary_sport",
                  event.target.value
                )
              }
            />

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Experience level
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 1.25,
                }}
              >
                {EXPERIENCE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option}
                    label={option}
                    selected={
                      form.experience_level === option
                    }
                    onClick={() =>
                      updateField(
                        "experience_level",
                        option
                      )
                    }
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Competition level
              </Typography>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {COMPETITION_OPTIONS.map((option) => (
                  <MultiOption
                    key={option}
                    label={option}
                    selected={
                      form.competition_level === option
                    }
                    onClick={() =>
                      updateField(
                        "competition_level",
                        option
                      )
                    }
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                What best describes you?
              </Typography>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {ATHLETE_TYPES.map((option) => (
                  <MultiOption
                    key={option}
                    label={option}
                    selected={
                      form.athlete_type === option
                    }
                    onClick={() =>
                      updateField("athlete_type", option)
                    }
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </>
      );
    }

    /* ------------------------------ STEP 3 ------------------------------ */

    if (step === 2) {
      const selectedGoals = form.main_goal
        .split(",")
        .map((goal) => goal.trim())
        .filter(Boolean);

      return (
        <>
          <SectionTitle
            eyebrow="Step 3 · Training"
            title="Build around your goals"
            description="Choose what you want to improve and how much time and equipment you have."
          />

          <Stack spacing={4}>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography fontWeight={900}>
                  Top goals
                </Typography>

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: 13,
                  }}
                >
                  Choose up to 3
                </Typography>
              </Stack>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {GOAL_OPTIONS.map((goal) => {
                  const selected =
                    selectedGoals.includes(goal);

                  return (
                    <MultiOption
                      key={goal}
                      label={goal}
                      selected={selected}
                      onClick={() => {
                        if (
                          !selected &&
                          selectedGoals.length >= 3
                        ) {
                          setError(
                            "Choose up to three main training goals."
                          );
                          return;
                        }

                        updateField(
                          "main_goal",
                          toggleListValue(
                            form.main_goal,
                            goal
                          )
                        );
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <SliderBlock
              title="Training days per week"
              value={Number(form.training_days) || 4}
              min={1}
              max={7}
              displayValue={`${form.training_days || 4} days`}
              onChange={(value) =>
                updateField(
                  "training_days",
                  String(value)
                )
              }
              marks={[
                { value: 1, label: "1" },
                { value: 3, label: "3" },
                { value: 5, label: "5" },
                { value: 7, label: "7" },
              ]}
            />

            <SliderBlock
              title="Preferred workout duration"
              value={
                Number(form.workout_duration) || 60
              }
              min={20}
              max={120}
              step={5}
              displayValue={`${
                form.workout_duration || 60
              } min`}
              onChange={(value) =>
                updateField(
                  "workout_duration",
                  String(value)
                )
              }
              marks={[
                { value: 20, label: "20m" },
                { value: 60, label: "60m" },
                { value: 90, label: "90m" },
                { value: 120, label: "120m" },
              ]}
            />

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Equipment access
              </Typography>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {EQUIPMENT_OPTIONS.map((option) => (
                  <MultiOption
                    key={option}
                    label={option}
                    selected={
                      form.equipment_access === option
                    }
                    onClick={() =>
                      updateField(
                        "equipment_access",
                        option
                      )
                    }
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </>
      );
    }

    /* ------------------------------ STEP 4 ------------------------------ */

    if (step === 3) {
      return (
        <>
          <SectionTitle
            eyebrow="Step 4 · Recovery"
            title="Train around your recovery"
            description="Recovery information helps SportLab avoid treating every athlete as if they have the same readiness."
          />

          <Stack spacing={4}>
            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Average sleep
              </Typography>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {SLEEP_OPTIONS.map((option) => (
                  <MultiOption
                    key={option}
                    label={option}
                    selected={
                      form.sleep_range === option
                    }
                    onClick={() =>
                      updateField(
                        "sleep_range",
                        option
                      )
                    }
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Years of structured training
              </Typography>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {TRAINING_AGE_OPTIONS.map((option) => (
                  <MultiOption
                    key={option}
                    label={option}
                    selected={
                      form.training_age === option
                    }
                    onClick={() =>
                      updateField(
                        "training_age",
                        option
                      )
                    }
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Typical energy
              </Typography>

              <Stack direction="row" gap={1}>
                {["Low", "Moderate", "High"].map(
                  (option) => (
                    <MultiOption
                      key={option}
                      label={option}
                      selected={
                        form.energy_level === option
                      }
                      onClick={() =>
                        updateField(
                          "energy_level",
                          option
                        )
                      }
                    />
                  )
                )}
              </Stack>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Typical muscle soreness
              </Typography>

              <Stack direction="row" gap={1}>
                {["Low", "Moderate", "High"].map(
                  (option) => (
                    <MultiOption
                      key={option}
                      label={option}
                      selected={
                        form.soreness_level === option
                      }
                      onClick={() =>
                        updateField(
                          "soreness_level",
                          option
                        )
                      }
                    />
                  )
                )}
              </Stack>
            </Box>

            <Box>
              <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                Injuries or areas to protect
              </Typography>

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {BODY_AREAS.map((area) => (
                  <MultiOption
                    key={area}
                    label={area}
                    selected={form.injury_areas
                      .split(",")
                      .map((item) => item.trim())
                      .includes(area)}
                    onClick={() => {
                      if (area === "None") {
                        updateField(
                          "injury_areas",
                          "None"
                        );
                        return;
                      }

                      const withoutNone =
                        form.injury_areas
                          .split(",")
                          .map((item) => item.trim())
                          .filter(
                            (item) =>
                              item &&
                              item !== "None"
                          )
                          .join(", ");

                      updateField(
                        "injury_areas",
                        toggleListValue(
                          withoutNone,
                          area
                        ) || "None"
                      );
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </>
      );
    }

    /* ------------------------------ STEP 5 ------------------------------ */

    return (
      <>
        <SectionTitle
          eyebrow="Step 5 · Nutrition"
          title="Finish your athlete profile"
          description="A few nutrition preferences help SportLab make recommendations that actually fit your routine."
        />

        <Stack spacing={4}>
          <Box>
            <Typography fontWeight={900} sx={{ mb: 1.5 }}>
              Nutrition goal
            </Typography>

            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              {NUTRITION_GOALS.map((option) => (
                <MultiOption
                  key={option}
                  label={option}
                  selected={
                    form.nutrition_goal === option
                  }
                  onClick={() =>
                    updateField(
                      "nutrition_goal",
                      option
                    )
                  }
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography fontWeight={900} sx={{ mb: 1.5 }}>
              Dietary preference
            </Typography>

            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              {DIET_OPTIONS.map((option) => (
                <MultiOption
                  key={option}
                  label={option}
                  selected={
                    form.dietary_preference === option
                  }
                  onClick={() =>
                    updateField(
                      "dietary_preference",
                      option
                    )
                  }
                />
              ))}
            </Stack>
          </Box>

          <SliderBlock
            title="Meals per day"
            value={Number(form.meals_per_day) || 3}
            min={1}
            max={6}
            displayValue={`${form.meals_per_day || 3}`}
            onChange={(value) =>
              updateField(
                "meals_per_day",
                String(value)
              )
            }
            marks={[
              { value: 1, label: "1" },
              { value: 3, label: "3" },
              { value: 6, label: "6" },
            ]}
          />

          <Box>
            <Typography fontWeight={900} sx={{ mb: 1.5 }}>
              Food preparation
            </Typography>

            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              {COOKING_OPTIONS.map((option) => (
                <MultiOption
                  key={option}
                  label={option}
                  selected={
                    form.cooking_access === option
                  }
                  onClick={() =>
                    updateField(
                      "cooking_access",
                      option
                    )
                  }
                />
              ))}
            </Stack>
          </Box>

          <TextField
            fullWidth
            label="Food allergies or intolerances"
            placeholder="None, peanuts, shellfish, lactose..."
            value={form.food_allergies}
            onChange={(event) =>
              updateField(
                "food_allergies",
                event.target.value
              )
            }
          />

          <TextField
            fullWidth
            label="Foods you avoid"
            placeholder="None, pork, mushrooms..."
            value={form.foods_avoid}
            onChange={(event) =>
              updateField(
                "foods_avoid",
                event.target.value
              )
            }
          />

          {/* Athlete summary */}

          <Box
            sx={{
              bgcolor: "#0f172a",
              color: "#fff",
              borderRadius: 4,
              p: { xs: 2.5, sm: 3.5 },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <FitnessCenterRounded />

              <Typography
                variant="h6"
                fontWeight={950}
              >
                Your athlete profile
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  SPORT
                </Typography>

                <Typography fontWeight={850}>
                  {form.primary_sport || "—"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  BODY
                </Typography>

                <Typography fontWeight={850}>
                  {heightFeet}' {heightInches}" ·{" "}
                  {weightLb} lb
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  BMI
                </Typography>

                <Typography fontWeight={850}>
                  {bmi ? bmi.toFixed(1) : "—"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  TRAINING
                </Typography>

                <Typography fontWeight={850}>
                  {form.training_days} days/week
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  SESSION
                </Typography>

                <Typography fontWeight={850}>
                  {form.workout_duration} min
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  EXPERIENCE
                </Typography>

                <Typography fontWeight={850}>
                  {form.experience_level || "—"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                                  PAGE                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <Box
      sx={{
        bgcolor: "#f8fafc",
        minHeight: "100vh",
        py: { xs: 2, md: 5 },
      }}
    >
      <Seo
        title="Build Your Athlete Profile"
        description="Personalize SportLab AI around your body, sport, goals, recovery, and nutrition."
        path="/onboarding"
        noIndex
      />

      <Container maxWidth="md">
        {/* Header */}

        <Box sx={{ mb: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.2 }}
          >
            <Typography
              sx={{
                fontWeight: 950,
                color: "#0f172a",
                fontSize: 14,
              }}
            >
              SportLab Athlete Setup
            </Typography>

            <Typography
              sx={{
                color: "#64748b",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {step + 1} / {totalSteps}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={((step + 1) / totalSteps) * 100}
            sx={{
              height: 7,
              borderRadius: 20,
              bgcolor: "#e2e8f0",

              "& .MuiLinearProgress-bar": {
                borderRadius: 20,
                bgcolor: "#0f172a",
              },
            }}
          />
        </Box>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: { xs: 3, md: 5 },
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          <Box
            sx={{
              p: {
                xs: 2.5,
                sm: 4,
                md: 5,
              },
            }}
          >
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

            {renderStep()}
          </Box>

          {/* Navigation */}

          <Box
            sx={{
              borderTop: "1px solid #e2e8f0",
              bgcolor: "#fafafa",
              p: {
                xs: 2,
                sm: 2.5,
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1.5}
            >
              <Button
                type="button"
                variant="text"
                startIcon={<ArrowBackRounded />}
                disabled={step === 0}
                onClick={previousStep}
                sx={{
                  color: "#475569",
                  fontWeight: 850,
                  borderRadius: 2.5,
                }}
              >
                Back
              </Button>

              {step < totalSteps - 1 ? (
                <Button
                  type="button"
                  variant="contained"
                  endIcon={<ArrowForwardRounded />}
                  onClick={nextStep}
                  sx={{
                    bgcolor: "#0f172a",
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.15,
                    fontWeight: 900,
                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#1e293b",
                      boxShadow: "none",
                    },
                  }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  endIcon={
                    !submitting ? (
                      <ArrowForwardRounded />
                    ) : undefined
                  }
                  sx={{
                    bgcolor: "#0f172a",
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.15,
                    fontWeight: 900,
                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#1e293b",
                      boxShadow: "none",
                    },
                  }}
                >
                  {submitting
                    ? "Creating profile..."
                    : "Create my profile"}
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>

        <Typography
          sx={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: 12,
            mt: 2,
            lineHeight: 1.6,
          }}
        >
          SportLab provides general fitness and nutrition
          guidance and does not provide medical diagnosis or
          treatment.
        </Typography>
      </Container>
    </Box>
  );
}