import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import {
  TYPE_COLORS,
  type WorkoutType,
} from "../../lib/workoutPlan";

type Props = {
  open: boolean;
  types: WorkoutType[];
  onClose: () => void;
  onSave: (types: WorkoutType[]) => void;
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Set up your workout types and their default exercises once, so starting a
 * session is a single click rather than retyping the same lifts every time.
 *
 * Edits are held locally and committed on Save: abandoning the dialog should
 * not rewrite the plan behind you.
 */
export default function CustomizeTypesDialog({
  open,
  types,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<WorkoutType[]>(types);
  const [newTypeName, setNewTypeName] = useState("");

  // Reopening the dialog should show what is saved now, not the last draft.
  const [syncedFrom, setSyncedFrom] = useState(types);
  if (open && syncedFrom !== types) {
    setSyncedFrom(types);
    setDraft(types);
  }

  const updateType = (id: string, patch: Partial<WorkoutType>) =>
    setDraft((current) =>
      current.map((type) => (type.id === id ? { ...type, ...patch } : type))
    );

  const addType = () => {
    const name = newTypeName.trim();
    if (!name) return;

    const base = slugify(name) || "workout";
    // Ids key the day log, so a duplicate would silently merge two types'
    // history together.
    const taken = new Set(draft.map((type) => type.id));
    let id = base;
    let suffix = 2;
    while (taken.has(id)) id = `${base}-${suffix++}`;

    setDraft((current) => [
      ...current,
      {
        id,
        name,
        color: TYPE_COLORS[current.length % TYPE_COLORS.length],
        exercises: [],
      },
    ]);

    setNewTypeName("");
  };

  const addExercise = (typeId: string) =>
    setDraft((current) =>
      current.map((type) =>
        type.id === typeId
          ? {
              ...type,
              exercises: [
                ...type.exercises,
                { name: "New exercise", targetReps: 8, sets: 3, cues: [] },
              ],
            }
          : type
      )
    );

  const updateExercise = (
    typeId: string,
    index: number,
    patch: Partial<WorkoutType["exercises"][number]>
  ) =>
    setDraft((current) =>
      current.map((type) =>
        type.id === typeId
          ? {
              ...type,
              exercises: type.exercises.map((exercise, i) =>
                i === index ? { ...exercise, ...patch } : exercise
              ),
            }
          : type
      )
    );

  const removeExercise = (typeId: string, index: number) =>
    setDraft((current) =>
      current.map((type) =>
        type.id === typeId
          ? {
              ...type,
              exercises: type.exercises.filter((_, i) => i !== index),
            }
          : type
      )
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        Customize workouts
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography color="text.secondary" mb={3}>
          Name your workout types, pick a colour, and list the exercises each
          one starts from. Starting a session fills in this list for you.
        </Typography>

        <Stack spacing={3}>
          {draft.map((type) => (
            <Paper
              key={type.id}
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ sm: "center" }}
                mb={2}
              >
                <TextField
                  label="Workout name"
                  size="small"
                  value={type.name}
                  onChange={(e) => updateType(type.id, { name: e.target.value })}
                  sx={{ flex: 1 }}
                />

                <Stack direction="row" spacing={0.75} alignItems="center">
                  {TYPE_COLORS.map((color) => (
                    <Tooltip key={color} title="Set colour">
                      <Box
                        component="button"
                        type="button"
                        aria-label={`Use colour ${color} for ${type.name}`}
                        aria-pressed={type.color === color}
                        onClick={() => updateType(type.id, { color })}
                        sx={{
                          width: 24,
                          height: 24,
                          p: 0,
                          cursor: "pointer",
                          borderRadius: "50%",
                          bgcolor: color,
                          border: "2px solid",
                          borderColor:
                            type.color === color ? "#0f172a" : "transparent",
                        }}
                      />
                    </Tooltip>
                  ))}
                </Stack>

                <Tooltip title="Remove workout">
                  <IconButton
                    color="error"
                    aria-label={`Remove ${type.name}`}
                    onClick={() =>
                      setDraft((current) =>
                        current.filter((entry) => entry.id !== type.id)
                      )
                    }
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5}>
                {type.exercises.map((exercise, index) => (
                  <Stack
                    key={`${type.id}-${index}`}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <TextField
                      size="small"
                      label="Exercise"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(type.id, index, { name: e.target.value })
                      }
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      size="small"
                      label="Sets"
                      type="number"
                      value={exercise.sets}
                      inputProps={{ min: 1, max: 10 }}
                      onChange={(e) =>
                        updateExercise(type.id, index, {
                          sets: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      sx={{ width: 90 }}
                    />

                    <TextField
                      size="small"
                      label="Reps"
                      type="number"
                      value={exercise.targetReps}
                      inputProps={{ min: 1, max: 100 }}
                      onChange={(e) =>
                        updateExercise(type.id, index, {
                          targetReps: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      sx={{ width: 90 }}
                    />

                    <IconButton
                      size="small"
                      aria-label={`Remove ${exercise.name} from ${type.name}`}
                      onClick={() => removeExercise(type.id, index)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}

                {type.exercises.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No default exercises yet — add one below, or add them while
                    you train.
                  </Typography>
                )}
              </Stack>

              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addExercise(type.id)}
                sx={{ mt: 1.5, textTransform: "none", fontWeight: 700 }}
              >
                Add default exercise
              </Button>
            </Paper>
          ))}
        </Stack>

        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2.5,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <Typography fontWeight={800} mb={1.5}>
            Add a workout type
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Chest, Arms, Conditioning"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addType();
              }}
            />

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addType}
              sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
            >
              Add
            </Button>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() => onSave(draft)}
          sx={{ textTransform: "none", fontWeight: 800, px: 3 }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
