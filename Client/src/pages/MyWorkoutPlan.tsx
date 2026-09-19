import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

type WorkoutSet = {
  id: number;
  reps: number;
  weight: number;
  completed: boolean;
};

type Exercise = {
  id: number;
  name: string;
  targetReps: number;
  sets: WorkoutSet[];
};

const initialExercises: Exercise[] = [
  {
    id: 1,
    name: "Bench Press",
    targetReps: 8,
    sets: [
      { id: 1, reps: 8, weight: 135, completed: true },
      { id: 2, reps: 8, weight: 135, completed: true },
      { id: 3, reps: 6, weight: 135, completed: false },
    ],
  },
  {
    id: 2,
    name: "Incline Dumbbell Press",
    targetReps: 10,
    sets: [
      { id: 1, reps: 10, weight: 45, completed: false },
      { id: 2, reps: 10, weight: 45, completed: false },
      { id: 3, reps: 10, weight: 45, completed: false },
    ],
  },
];

export default function MyWorkoutPlan() {
  const [workoutName, setWorkoutName] = useState("Push Day");
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [newExerciseName, setNewExerciseName] = useState("");

  const totalSets = useMemo(
    () => exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
    [exercises]
  );

  const completedSets = useMemo(
    () =>
      exercises.reduce(
        (total, exercise) =>
          total + exercise.sets.filter((set) => set.completed).length,
        0
      ),
    [exercises]
  );

  const progress =
    totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);

  const updateSet = (
    exerciseId: number,
    setId: number,
    field: "reps" | "weight",
    value: number
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? {
                      ...set,
                      [field]: Math.max(0, value),
                    }
                  : set
              ),
            }
          : exercise
      )
    );
  };

  const toggleSetComplete = (exerciseId: number, setId: number) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? { ...set, completed: !set.completed }
                  : set
              ),
            }
          : exercise
      )
    );
  };

  const addSet = (exerciseId: number) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;

        const lastSet = exercise.sets[exercise.sets.length - 1];

        const newSet: WorkoutSet = {
          id: Date.now(),
          reps: lastSet?.reps ?? exercise.targetReps,
          weight: lastSet?.weight ?? 0,
          completed: false,
        };

        return {
          ...exercise,
          sets: [...exercise.sets, newSet],
        };
      })
    );
  };

  const removeSet = (exerciseId: number, setId: number) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise
      )
    );
  };

  const addExercise = () => {
    const name = newExerciseName.trim();

    if (!name) return;

    const newExercise: Exercise = {
      id: Date.now(),
      name,
      targetReps: 8,
      sets: [
        {
          id: Date.now() + 1,
          reps: 8,
          weight: 0,
          completed: false,
        },
      ],
    };

    setExercises((current) => [...current, newExercise]);
    setNewExerciseName("");
  };

  const removeExercise = (exerciseId: number) => {
    setExercises((current) =>
      current.filter((exercise) => exercise.id !== exerciseId)
    );
  };

  const getWeightSuggestion = (exercise: Exercise) => {
    const completed = exercise.sets.filter((set) => set.completed);

    if (completed.length === 0) {
      return "Complete your working sets to get a recommendation.";
    }

    const allReachedTarget = completed.every(
      (set) => set.reps >= exercise.targetReps
    );

    const averageWeight =
      completed.reduce((sum, set) => sum + set.weight, 0) / completed.length;

    if (allReachedTarget && averageWeight > 0) {
      const increase = averageWeight >= 100 ? 5 : 2.5;
      const suggested = Math.round((averageWeight + increase) * 2) / 2;

      return `You hit your target reps. Consider trying about ${suggested} lb next session.`;
    }

    return `Stay around ${Math.round(
      averageWeight
    )} lb next session and aim to complete all ${exercise.targetReps} reps before increasing the load.`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: 5 }}>
      <Container maxWidth="lg">
        {/* HEADER */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          mb={4}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FitnessCenterIcon sx={{ fontSize: 32 }} />

              <Typography variant="h4" fontWeight={800}>
                My Workout Plan
              </Typography>
            </Stack>

            <Typography color="text.secondary" mt={1}>
              Build your workout, track every set, and improve over time.
            </Typography>
          </Box>

          <Chip
            label={`${completedSets} / ${totalSets} sets completed`}
            variant="outlined"
          />
        </Stack>

        {/* WORKOUT OVERVIEW */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
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
                WORKOUT
              </Typography>

              <TextField
                variant="standard"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                inputProps={{
                  style: {
                    fontSize: 24,
                    fontWeight: 700,
                  },
                }}
                sx={{ display: "block", mt: 0.5, maxWidth: 350 }}
              />
            </Box>

            <Box sx={{ minWidth: { md: 260 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="body2" fontWeight={600}>
                  Workout progress
                </Typography>

                <Typography variant="body2">{progress}%</Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 9,
                  borderRadius: 10,
                }}
              />
            </Box>
          </Stack>
        </Paper>

        {/* EXERCISES */}
        <Stack spacing={3}>
          {exercises.map((exercise, exerciseIndex) => (
            <Card
              key={exercise.id}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {/* EXERCISE HEADER */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DragIndicatorIcon color="disabled" />

                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {exercise.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Exercise {exerciseIndex + 1} • Target{" "}
                        {exercise.targetReps} reps
                      </Typography>
                    </Box>
                  </Stack>

                  <IconButton
                    color="error"
                    onClick={() => removeExercise(exercise.id)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* COLUMN HEADINGS */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "50px 1fr 1fr 55px 45px",
                    gap: 1.5,
                    px: 1,
                    mb: 1,
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    SET
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    WEIGHT (LB)
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    REPS
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    DONE
                  </Typography>

                  <Box />
                </Box>

                {/* SET ROWS */}
                <Stack spacing={1}>
                  {exercise.sets.map((set, setIndex) => (
                    <Box
                      key={set.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "50px 1fr 1fr 55px 45px",
                        gap: 1.5,
                        alignItems: "center",
                        p: 1,
                        borderRadius: 2,
                        bgcolor: set.completed
                          ? "action.selected"
                          : "transparent",
                      }}
                    >
                      <Typography fontWeight={700}>
                        {setIndex + 1}
                      </Typography>

                      <TextField
                        type="number"
                        size="small"
                        value={set.weight}
                        onChange={(e) =>
                          updateSet(
                            exercise.id,
                            set.id,
                            "weight",
                            Number(e.target.value)
                          )
                        }
                      />

                      <TextField
                        type="number"
                        size="small"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(
                            exercise.id,
                            set.id,
                            "reps",
                            Number(e.target.value)
                          )
                        }
                      />

                      <IconButton
                        onClick={() =>
                          toggleSetComplete(exercise.id, set.id)
                        }
                      >
                        {set.completed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )}
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() =>
                          removeSet(exercise.id, set.id)
                        }
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addSet(exercise.id)}
                  sx={{ mt: 2 }}
                >
                  Add Set
                </Button>

                {/* SUGGESTION */}
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" spacing={1.5}>
                    <LightbulbOutlinedIcon />

                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        Next-session suggestion
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                      >
                        {getWeightSuggestion(exercise)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </CardContent>
            </Card>
          ))}
        </Stack>

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
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addExercise();
                }
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addExercise}
              sx={{
                px: 3,
                whiteSpace: "nowrap",
              }}
            >
              Add Exercise
            </Button>
          </Stack>
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={3}
        >
          Load suggestions are simple progression estimates. Adjust training
          based on technique, fatigue, recovery, and coaching guidance.
        </Typography>
      </Container>
    </Box>
  );
}