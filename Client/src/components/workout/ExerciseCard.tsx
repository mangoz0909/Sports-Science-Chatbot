import React, { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { weightSuggestion, type PlannedExercise } from "../../lib/workoutPlan";
import { BODY, INK, LINE, MUTED, SURFACE, captionSx, cardSx, fieldSx, removeIconSx, textButtonSx } from "./ui";

const COLUMNS = "32px minmax(0, 1fr) minmax(0, 1fr) 44px 36px";
const TIMED_COLUMNS = "32px minmax(0, 1fr) 44px 36px";

type Props = {
  exercise: PlannedExercise;
  index: number;
  accent: string;
  onUpdateSet: (setId: number, field: "reps" | "weight", value: string) => void;
  onNormaliseSet: (setId: number, field: "reps" | "weight") => void;
  onToggleSet: (setId: number) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: number) => void;
  onRemove: () => void;
};

export default function ExerciseCard({
  exercise,
  index,
  accent,
  onUpdateSet,
  onNormaliseSet,
  onToggleSet,
  onAddSet,
  onRemoveSet,
  onRemove,
}: Props) {
  // Form cues are collapsed by default: they matter when you are learning a
  // lift and are noise once you are not.
  const [showCues, setShowCues] = useState(false);

  const timed = exercise.prescription?.kind === "duration";
  const columns = timed ? TIMED_COLUMNS : COLUMNS;
  const doneSets = exercise.sets.filter((set) => set.completed).length;
  const allDone = exercise.sets.length > 0 && doneSets === exercise.sets.length;

  const target = exercise.prescription
    ? `${exercise.prescription.target}${timed ? "" : " reps"} · Rest ${exercise.prescription.rest}`
    : exercise.targetReps > 0
      ? `Target ${exercise.targetReps} reps`
      : null;

  return (
    <Box component="section" aria-label={exercise.name} sx={{ ...cardSx, p: { xs: 2, md: 2.5 } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 32,
            height: 32,
            mt: 0.25,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontWeight: 900,
            bgcolor: allDone ? accent : "#f1f5f9",
            color: allDone ? "#fff" : MUTED,
          }}
        >
          {allDone ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : index + 1}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h3" fontWeight={900} fontSize={17} color={INK} lineHeight={1.3}>
            {exercise.name}
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color={MUTED}>
              {target ? `${target} · ` : ""}{doneSets}/{exercise.sets.length} sets
            </Typography>

            {!timed && exercise.lastWeight ? (
              <Typography variant="caption" color={MUTED}>
                Last time: {exercise.lastWeight} lb
              </Typography>
            ) : null}

            {exercise.cues.length > 0 && (
              <Button
                size="small"
                onClick={() => setShowCues((open) => !open)}
                aria-expanded={showCues}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transform: showCues ? "rotate(180deg)" : "none",
                      transition: "transform 150ms ease",
                      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                    }}
                  />
                }
                sx={{ ...textButtonSx, px: 0, minWidth: 0, fontSize: 13, color: MUTED, "&:hover": { color: INK, bgcolor: "transparent" } }}
              >
                Form tips
              </Button>
            )}
          </Stack>
        </Box>

        <Tooltip title="Remove exercise">
          <IconButton size="small" aria-label={`Remove ${exercise.name}`} onClick={onRemove} sx={removeIconSx}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Collapse in={showCues}>
        <Box component="ul" sx={{ m: 0, mt: 1.5, p: 1.5, pl: 4, borderRadius: 2, bgcolor: SURFACE }}>
          {exercise.cues.map((cue) => (
            <Typography key={cue} component="li" variant="body2" color={BODY} sx={{ mb: 0.25 }}>
              {cue}
            </Typography>
          ))}
        </Box>
      </Collapse>

      {/* SET TABLE */}
      <Box
        aria-hidden
        sx={{ display: "grid", gridTemplateColumns: columns, gap: 1, px: 0.5, mt: 2, mb: 0.5 }}
      >
        <Typography sx={captionSx}>Set</Typography>
        {!timed && <Typography sx={captionSx}>Lb</Typography>}
        <Typography sx={captionSx}>{timed ? "Time" : "Reps"}</Typography>
        <Typography sx={{ ...captionSx, textAlign: "center" }}>Done</Typography>
        <span />
      </Box>

      <Stack spacing={0.5}>
        {exercise.sets.map((set, setIndex) => (
          <Box
            key={set.id}
            sx={{
              display: "grid",
              gridTemplateColumns: columns,
              gap: 1,
              alignItems: "center",
              px: 0.5,
              py: 0.5,
              borderRadius: 2,
              bgcolor: set.completed ? `${accent}14` : "transparent",
              transition: "background-color 150ms ease",
            }}
          >
            <Typography fontWeight={800} color={set.completed ? INK : MUTED} textAlign="center">
              {setIndex + 1}
            </Typography>

            {!timed && (
              <TextField
                type="number"
                size="small"
                value={set.weight}
                inputProps={{
                  min: 0,
                  step: "any",
                  inputMode: "decimal",
                  "aria-label": `${exercise.name} set ${setIndex + 1} weight in pounds`,
                }}
                onChange={(e) => onUpdateSet(set.id, "weight", e.target.value)}
                onBlur={() => onNormaliseSet(set.id, "weight")}
                sx={fieldSx}
              />
            )}

            <TextField
              type={timed ? "text" : "number"}
              size="small"
              value={set.reps}
              inputProps={{
                min: 0,
                step: 1,
                inputMode: timed ? "text" : "numeric",
                "aria-label": `${exercise.name} set ${setIndex + 1} ${timed ? "duration" : "reps"}`,
              }}
              onChange={(e) => onUpdateSet(set.id, "reps", e.target.value)}
              onBlur={() => onNormaliseSet(set.id, "reps")}
              sx={fieldSx}
            />

            <IconButton
              aria-label={`Mark ${exercise.name} set ${setIndex + 1} ${set.completed ? "incomplete" : "complete"}`}
              aria-pressed={set.completed}
              onClick={() => onToggleSet(set.id)}
              sx={{ justifySelf: "center" }}
            >
              {set.completed ? (
                <CheckCircleIcon sx={{ color: accent }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ color: "#94a3b8" }} />
              )}
            </IconButton>

            <IconButton
              size="small"
              aria-label={`Remove ${exercise.name} set ${setIndex + 1}`}
              onClick={() => onRemoveSet(set.id)}
              sx={{ ...removeIconSx, color: "#94a3b8" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        sx={{ mt: 1 }}
      >
        <Button size="small" startIcon={<AddIcon />} onClick={onAddSet} sx={{ ...textButtonSx, alignSelf: "flex-start" }}>
          Add set
        </Button>

        {/* The next-session tip only means something once a set is logged. */}
        {doneSets > 0 && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ px: 1.5, py: 0.75, borderRadius: 2, bgcolor: SURFACE, border: `1px solid ${LINE}` }}
          >
            <LightbulbOutlinedIcon sx={{ fontSize: 18, color: MUTED }} />
            <Typography variant="body2" color={BODY}>
              {weightSuggestion(exercise)}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
