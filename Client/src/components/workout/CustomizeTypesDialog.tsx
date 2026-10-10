import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import {
  TYPE_COLORS,
  type WorkoutType,
} from "../../lib/workoutPlan";
import { INK, LINE, MUTED, captionSx, fieldSx } from "./ui";

type Props = {
  open: boolean;
  types: WorkoutType[];
  onClose: () => void;
  onSave: (types: WorkoutType[]) => void;
};

const COLOR_NAMES = ["Red", "Green", "Blue", "Amber", "Purple", "Teal"];

const ROW_COLUMNS = "28px minmax(0, 1fr) 76px 96px 40px";
const ROW_COLUMNS_REST = "28px minmax(0, 1fr) 76px 96px 96px 40px";

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
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setDraft(types);
      setNewTypeName("");
    }
  }
  if (open && syncedFrom !== types) {
    setSyncedFrom(types);
    setDraft(types);
  }

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  // Column headings carry the labels on wider screens; phones keep per-field labels.
  const smUp = !fullScreen;

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      scroll="paper"
      aria-labelledby="customize-workouts-title"
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 } } }}
    >
      <DialogTitle id="customize-workouts-title" sx={{ px: { xs: 2.5, sm: 3 }, pt: 3, pb: 2, pr: 7 }}>
        <Typography component="span" display="block" fontWeight={950} fontSize={22} color={INK}>
          Customize workouts
        </Typography>
        <Typography component="span" display="block" color={MUTED} fontSize={14} mt={0.5}>
          Name each workout, pick a colour, and set the exercises it starts
          with. Starting a session fills these in for you.
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 16, top: 20, color: MUTED }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ px: { xs: 2, sm: 3 }, py: 3, bgcolor: "#f8fafc", borderColor: LINE }}
      >
        <Stack spacing={2.5}>
          {draft.map((type) => {
            const hasRest = type.exercises.some((exercise) => exercise.prescription);
            const columns = hasRest ? ROW_COLUMNS_REST : ROW_COLUMNS;

            return (
              <Paper
                key={type.id}
                elevation={0}
                sx={{
                  border: `1px solid ${LINE}`,
                  borderTop: `4px solid ${type.color}`,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                {/* Workout header: name, colour, remove */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ sm: "center" }}
                  sx={{ p: { xs: 2, sm: 2.5 }, pb: 2 }}
                >
                  <TextField
                    label="Workout name"
                    size="small"
                    value={type.name}
                    inputProps={{ "aria-label": "Workout name" }}
                    onChange={(e) => updateType(type.id, { name: e.target.value })}
                    sx={{ flex: 1, ...fieldSx }}
                  />

                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      role="group"
                      aria-label={`Colour for ${type.name || "workout"}`}
                    >
                      {TYPE_COLORS.map((color, index) => {
                        const selected = type.color === color;
                        return (
                          <Box
                            key={color}
                            component="button"
                            type="button"
                            aria-label={`${COLOR_NAMES[index] ?? "Colour"}${selected ? " (selected)" : ""}`}
                            aria-pressed={selected}
                            onClick={() => updateType(type.id, { color })}
                            sx={{
                              width: 28,
                              height: 28,
                              p: 0,
                              cursor: "pointer",
                              borderRadius: "50%",
                              bgcolor: color,
                              border: "none",
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${INK}` : "none",
                              transition: "box-shadow 150ms ease, transform 150ms ease",
                              "&:hover": { transform: "scale(1.08)" },
                              "&:focus-visible": { outline: `2px solid ${INK}`, outlineOffset: 3 },
                              "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
                            }}
                          >
                            {selected && <CheckIcon sx={{ fontSize: 16 }} />}
                          </Box>
                        );
                      })}
                    </Stack>

                    <Tooltip title="Delete workout">
                      <IconButton
                        aria-label={`Delete ${type.name}`}
                        onClick={() =>
                          setDraft((current) =>
                            current.filter((entry) => entry.id !== type.id)
                          )
                        }
                        sx={{ color: MUTED, "&:hover": { color: "error.main", bgcolor: "#fef2f2" } }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Box sx={{ borderTop: `1px solid ${LINE}`, px: { xs: 2, sm: 2.5 }, pt: 1.5, pb: 2 }}>
                  {/* Column headings replace a floating label on every row. */}
                  {type.exercises.length > 0 && (
                    <Box
                      aria-hidden
                      sx={{
                        display: { xs: "none", sm: "grid" },
                        gridTemplateColumns: columns,
                        gap: 1.5,
                        px: 1,
                        mb: 0.5,
                      }}
                    >
                      <span />
                      {["Exercise", "Sets", type.exercises.some((exercise) => exercise.prescription?.kind === "duration") ? "Reps / time" : "Reps", ...(hasRest ? ["Rest"] : [])].map((heading) => (
                        <Typography key={heading} sx={captionSx}>{heading}</Typography>
                      ))}
                      <span />
                    </Box>
                  )}

                  <Stack spacing={0.5}>
                    {type.exercises.map((exercise, index) => {
                      const timed = exercise.prescription?.kind === "duration";
                      return (
                        <Box
                          key={`${type.id}-${index}`}
                          role="group"
                          aria-label={`Exercise ${index + 1}: ${exercise.name}`}
                          sx={{
                            display: "grid",
                            // Phones: number + name on one line, numbers below.
                            gridTemplateColumns: { xs: "28px 1fr 1fr 1fr 40px", sm: columns },
                            gridTemplateAreas: {
                              xs: hasRest
                                ? `"num name name name del" ". sets reps rest ."`
                                : `"num name name name del" ". sets reps reps ."`,
                              sm: "none",
                            },
                            gap: 1.5,
                            alignItems: "center",
                            p: 1,
                            borderRadius: 2,
                            "&:hover": { bgcolor: "#f8fafc" },
                          }}
                        >
                          <Box
                            sx={{
                              gridArea: { xs: "num", sm: "auto" },
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              bgcolor: "#f1f5f9",
                              color: MUTED,
                              fontSize: 13,
                              fontWeight: 800,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            {index + 1}
                          </Box>

                          <TextField
                            size="small"
                            value={exercise.name}
                            placeholder="Exercise name"
                            inputProps={{ "aria-label": "Exercise name" }}
                            onChange={(e) =>
                              updateExercise(type.id, index, { name: e.target.value })
                            }
                            sx={{ gridArea: { xs: "name", sm: "auto" }, minWidth: 0, ...fieldSx }}
                          />

                          <TextField
                            size="small"
                            type="number"
                            value={exercise.sets}
                            label={smUp ? undefined : "Sets"}
                            inputProps={{ min: 1, max: 10, "aria-label": "Sets" }}
                            onChange={(e) =>
                              updateExercise(type.id, index, {
                                sets: Math.min(10, Math.max(1, Math.floor(Number(e.target.value)) || 1)),
                              })
                            }
                            sx={{ gridArea: { xs: "sets", sm: "auto" }, ...fieldSx }}
                          />

                          <TextField
                            size="small"
                            type={exercise.prescription ? "text" : "number"}
                            label={smUp ? undefined : timed ? "Duration" : "Reps"}
                            value={exercise.prescription?.target ?? exercise.targetReps}
                            inputProps={{ min: 1, max: 100, "aria-label": timed ? "Duration" : "Reps" }}
                            onChange={(e) =>
                              updateExercise(type.id, index, {
                                targetReps: timed ? 0 : Math.max(1, Number.parseInt(e.target.value.match(/[-–]\s*(\d+)/)?.[1] ?? e.target.value, 10) || 1),
                                ...(exercise.prescription ? { prescription: { ...exercise.prescription, target: e.target.value } } : {}),
                              })
                            }
                            sx={{ gridArea: { xs: "reps", sm: "auto" }, ...fieldSx }}
                          />

                          {hasRest && (exercise.prescription ? (
                            <TextField
                              size="small"
                              label={smUp ? undefined : "Rest"}
                              value={exercise.prescription.rest}
                              inputProps={{ "aria-label": "Rest" }}
                              onChange={(event) => updateExercise(type.id, index, { prescription: { ...exercise.prescription!, rest: event.target.value } })}
                              sx={{ gridArea: { xs: "rest", sm: "auto" }, ...fieldSx }}
                            />
                          ) : <Box sx={{ gridArea: { xs: "rest", sm: "auto" } }} />)}

                          <Tooltip title="Remove exercise">
                            <IconButton
                              size="small"
                              aria-label={`Remove ${exercise.name} from ${type.name}`}
                              onClick={() => removeExercise(type.id, index)}
                              sx={{ gridArea: { xs: "del", sm: "auto" }, color: MUTED, "&:hover": { color: "error.main" } }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Stack>

                  {type.exercises.length === 0 && (
                    <Typography variant="body2" color={MUTED} sx={{ py: 1.5 }}>
                      No exercises yet. Add one below, or add them while you
                      train.
                    </Typography>
                  )}

                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addExercise(type.id)}
                    sx={{ mt: 1, ml: 0.5, textTransform: "none", fontWeight: 800, color: INK, borderRadius: 2 }}
                  >
                    Add exercise
                  </Button>
                </Box>
              </Paper>
            );
          })}

          {/* New workout */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: "1.5px dashed #cbd5e1",
              borderRadius: 3,
              bgcolor: "transparent",
            }}
          >
            <Typography fontWeight={900} color={INK} mb={0.25}>
              New workout
            </Typography>
            <Typography color={MUTED} fontSize={14} mb={1.5}>
              For example Chest, Arms, Conditioning or Mobility.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Workout name"
                value={newTypeName}
                inputProps={{ "aria-label": "New workout name" }}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addType();
                }}
                sx={fieldSx}
              />

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addType}
                disabled={!newTypeName.trim()}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  borderRadius: 3,
                  px: 2.5,
                  color: INK,
                  borderColor: "#cbd5e1",
                  bgcolor: "#fff",
                  "&:hover": { borderColor: INK, bgcolor: "#fff" },
                }}
              >
                Add workout
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 800, color: MUTED, borderRadius: 3 }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() => onSave(draft)}
          disableElevation
          sx={{
            textTransform: "none",
            fontWeight: 800,
            px: 3.5,
            borderRadius: 3,
            bgcolor: INK,
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
