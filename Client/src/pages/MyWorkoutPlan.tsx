import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import TuneIcon from "@mui/icons-material/Tune";

import Seo from "../components/Seo";
import CustomizeTypesDialog from "../components/workout/CustomizeTypesDialog";
import ExerciseCard from "../components/workout/ExerciseCard";
import RecommendationCards from "../components/workout/RecommendationCards";
import WeekStrip from "../components/workout/WeekStrip";
import { useAuth } from "../contexts/AuthContext";

import {
  addDays,
  demoPlan,
  fromISODate,
  loadPlan,
  nextId,
  recommendWorkouts,
  savePlan,
  sessionFromType,
  sessionProgress,
  storageKeyFor,
  toISODate,
  toNumber,
  weekDays,
  type DaySession,
  type Plan,
  type PlannedExercise,
  type WorkoutType,
} from "../lib/workoutPlan";

/**
 * One page for the whole training week: pick a day, pick what to train from a
 * recovery-ranked split, then log sets against it. Workout types and their
 * default exercises are set up once in the customize dialog.
 */
export default function MyWorkoutPlan() {
  const { user } = useAuth();

  const storageKey = user ? storageKeyFor(user.id) : null;

  const todayISO = toISODate(new Date());
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  const [plan, setPlan] = useState<Plan>(() =>
    storageKey ? loadPlan(storageKey) : demoPlan()
  );

  // Signing in or out mid-visit swaps which plan is on screen: the demo seed
  // must not be written into a real account, and one account's plan must not
  // linger into another's.
  const loadedKey = useRef(storageKey);
  useEffect(() => {
    if (loadedKey.current === storageKey) return;
    loadedKey.current = storageKey;
    setPlan(storageKey ? loadPlan(storageKey) : demoPlan());
  }, [storageKey]);

  // Nothing is persisted for signed-out visitors — the demo plan is scratch
  // data, and saving it would leak into their first signed-in session.
  useEffect(() => {
    if (!storageKey || loadedKey.current !== storageKey) return;
    savePlan(storageKey, plan);
  }, [plan, storageKey]);

  const selectedDate = useMemo(() => fromISODate(selectedISO), [selectedISO]);
  const days = useMemo(() => weekDays(selectedDate), [selectedDate]);

  const session: DaySession | undefined = plan.days[selectedISO];

  const typeById = useMemo(
    () => new Map<string, WorkoutType>(plan.types.map((type) => [type.id, type])),
    [plan.types]
  );

  const activeType = session ? typeById.get(session.typeId) : undefined;
  const accent = activeType?.color ?? "#0f172a";

  const recommendations = useMemo(
    () => recommendWorkouts(plan, selectedISO),
    [plan, selectedISO]
  );

  const { completed, total, percent } = sessionProgress(session);

  const dayLabel =
    selectedISO === todayISO
      ? "today"
      : `on ${selectedDate.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}`;

  /* ── day mutations ───────────────────────────────────────────────────── */

  const updateSession = (update: (current: DaySession) => DaySession) =>
    setPlan((current) => {
      const existing = current.days[selectedISO];
      if (!existing) return current;

      return {
        ...current,
        days: { ...current.days, [selectedISO]: update(existing) },
      };
    });

  const updateExercises = (
    update: (current: PlannedExercise[]) => PlannedExercise[]
  ) =>
    updateSession((current) => ({
      ...current,
      exercises: update(current.exercises),
    }));

  const startWorkout = (typeId: string) => {
    const type = typeById.get(typeId);
    if (!type) return;

    setPlan((current) => ({
      ...current,
      days: { ...current.days, [selectedISO]: sessionFromType(type) },
    }));
  };

  const clearWorkout = () =>
    setPlan((current) => {
      const days = { ...current.days };
      delete days[selectedISO];
      return { ...current, days };
    });

  const mapSet = (
    exerciseId: number,
    setId: number,
    update: (set: DaySession["exercises"][number]["sets"][number]) =>
      DaySession["exercises"][number]["sets"][number]
  ) =>
    updateExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? update(set) : set
              ),
            }
          : exercise
      )
    );

  const addExercise = () => {
    const name = newExerciseName.trim();
    if (!name || !session) return;

    updateExercises((current) => [
      ...current,
      {
        id: nextId(),
        name,
        targetReps: 8,
        cues: [],
        sets: [{ id: nextId(), reps: "8", weight: "0", completed: false }],
      },
    ]);

    setNewExerciseName("");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: { xs: 3, md: 5 } }}>
      <Seo
        title="My Workout Plan"
        description="Plan your training week, pick the workout your body is most recovered for, and log every set, rep, and weight."
        path="/my-workout-plan"
        noIndex
      />

      <Container maxWidth="lg">
        {/* HEADER */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FitnessCenterIcon sx={{ fontSize: 32 }} />

              <Typography variant="h4" component="h1" fontWeight={800}>
                My Workout Plan
              </Typography>
            </Stack>

            <Typography color="text.secondary" mt={1}>
              Plan your week, train what is recovered, and log every set.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {session && (
              <Chip label={`${completed} / ${total} sets`} variant="outlined" />
            )}

            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setCustomizeOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                color: "#0f172a",
                borderColor: "#cbd5e1",

                "&:hover": { borderColor: "#94a3b8", bgcolor: "#fff" },
              }}
            >
              Customize
            </Button>
          </Stack>
        </Stack>

        {/* WEEK */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <WeekStrip
            days={days}
            selectedISO={selectedISO}
            todayISO={todayISO}
            plan={plan}
            onSelect={setSelectedISO}
            onShiftWeek={(weeks) =>
              setSelectedISO(toISODate(addDays(selectedDate, weeks * 7)))
            }
          />
        </Paper>

        {/* THE SELECTED DAY */}
        {!session ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            {recommendations.length > 0 ? (
              <RecommendationCards
                recommendations={recommendations}
                onStart={startWorkout}
                dayLabel={dayLabel}
              />
            ) : (
              <Stack alignItems="center" textAlign="center" py={3}>
                <FitnessCenterIcon sx={{ fontSize: 40, color: "text.disabled" }} />

                <Typography variant="h6" fontWeight={800} mt={1}>
                  No workout types yet
                </Typography>

                <Typography color="text.secondary" mt={1} mb={2}>
                  Add your first workout type — push, pull, legs, or whatever
                  you split your week into.
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<TuneIcon />}
                  onClick={() => setCustomizeOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  Customize workouts
                </Button>
              </Stack>
            )}
          </Paper>
        ) : (
          <>
            {/* SESSION HEADER */}
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 6, bgcolor: accent }} />

              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={3}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      {selectedDate
                        .toLocaleDateString(undefined, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                        .toUpperCase()}
                    </Typography>

                    <Typography variant="h5" fontWeight={800} mt={0.5}>
                      {activeType?.name ?? "Workout"}
                    </Typography>

                    <Button
                      size="small"
                      color="inherit"
                      onClick={clearWorkout}
                      sx={{
                        mt: 1,
                        px: 0,
                        textTransform: "none",
                        fontWeight: 700,
                        color: "text.secondary",
                      }}
                    >
                      Change workout
                    </Button>
                  </Box>

                  <Box sx={{ minWidth: { md: 260 } }}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600}>
                        Workout progress
                      </Typography>

                      <Typography variant="body2">{percent}%</Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{
                        height: 9,
                        borderRadius: 10,
                        bgcolor: "#eef2f7",

                        "& .MuiLinearProgress-bar": {
                          bgcolor: accent,
                          borderRadius: 10,
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* EXERCISES */}
            <Stack spacing={3}>
              {session.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  accent={accent}
                  onUpdateSet={(setId, field, value) =>
                    mapSet(exercise.id, setId, (set) => ({
                      ...set,
                      [field]: value,
                    }))
                  }
                  onNormaliseSet={(setId, field) =>
                    mapSet(exercise.id, setId, (set) => ({
                      ...set,
                      [field]: String(toNumber(set[field])),
                    }))
                  }
                  onToggleSet={(setId) =>
                    mapSet(exercise.id, setId, (set) => ({
                      ...set,
                      completed: !set.completed,
                    }))
                  }
                  onAddSet={() =>
                    updateExercises((current) =>
                      current.map((entry) => {
                        if (entry.id !== exercise.id) return entry;

                        const last = entry.sets[entry.sets.length - 1];

                        return {
                          ...entry,
                          sets: [
                            ...entry.sets,
                            {
                              id: nextId(),
                              reps: last?.reps ?? String(entry.targetReps),
                              weight: last?.weight ?? "0",
                              completed: false,
                            },
                          ],
                        };
                      })
                    )
                  }
                  onRemoveSet={(setId) =>
                    updateExercises((current) =>
                      current.map((entry) =>
                        entry.id === exercise.id
                          ? {
                              ...entry,
                              sets: entry.sets.filter((set) => set.id !== setId),
                            }
                          : entry
                      )
                    )
                  }
                  onRemove={() =>
                    updateExercises((current) =>
                      current.filter((entry) => entry.id !== exercise.id)
                    )
                  }
                />
              ))}
            </Stack>

            {session.exercises.length === 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" fontWeight={800}>
                  No exercises in this session
                </Typography>

                <Typography color="text.secondary" mt={1}>
                  Add one below, or set defaults for{" "}
                  {activeType?.name ?? "this workout"} under Customize.
                </Typography>
              </Paper>
            )}

            {/* ADD EXERCISE */}
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 3,
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography fontWeight={800} mb={2}>
                Add Exercise
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  placeholder="Exercise name — e.g. Barbell Squat"
                  value={newExerciseName}
                  inputProps={{ "aria-label": "New exercise name" }}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addExercise();
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addExercise}
                  sx={{
                    px: 3,
                    whiteSpace: "nowrap",
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  Add Exercise
                </Button>
              </Stack>
            </Paper>
          </>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={3}
        >
          {user
            ? "Your plan is saved on this device. Recovery percentages and load suggestions are simple estimates — adjust training based on technique, fatigue, recovery, and coaching guidance."
            : "Sign in to save your own plan. Recovery percentages and load suggestions are simple estimates — adjust training based on technique, fatigue, recovery, and coaching guidance."}
        </Typography>
      </Container>

      <CustomizeTypesDialog
        open={customizeOpen}
        types={plan.types}
        onClose={() => setCustomizeOpen(false)}
        onSave={(types) => {
          setPlan((current) => ({ ...current, types }));
          setCustomizeOpen(false);
        }}
      />
    </Box>
  );
}
