import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { weightSuggestion, type PlannedExercise } from "../../lib/workoutPlan";

const COLUMNS = "44px 1fr 1fr 52px 44px";

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

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: 4, bgcolor: accent }} />

      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {exercise.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Exercise {index + 1} • Target {exercise.targetReps} reps
            </Typography>
          </Box>

          <IconButton
            color="error"
            aria-label={`Remove ${exercise.name}`}
            onClick={onRemove}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>

        {exercise.cues.length > 0 && (
          <Box mb={1.5}>
            <Button
              size="small"
              onClick={() => setShowCues((open) => !open)}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showCues ? "rotate(180deg)" : "none",
                    transition: "transform 150ms ease",
                  }}
                />
              }
              sx={{ textTransform: "none", fontWeight: 700, px: 0 }}
            >
              {showCues ? "Hide form guide" : "How to do this"}
            </Button>

            <Collapse in={showCues}>
              <Box component="ol" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                {exercise.cues.map((cue) => (
                  <Typography
                    key={cue}
                    component="li"
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    {cue}
                  </Typography>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: COLUMNS,
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

        <Stack spacing={1}>
          {exercise.sets.map((set, setIndex) => (
            <Box
              key={set.id}
              sx={{
                display: "grid",
                gridTemplateColumns: COLUMNS,
                gap: 1.5,
                alignItems: "center",
                p: 1,
                borderRadius: 2,
                bgcolor: set.completed ? "action.selected" : "transparent",
              }}
            >
              <Typography fontWeight={700}>{setIndex + 1}</Typography>

              <TextField
                type="number"
                size="small"
                value={set.weight}
                inputProps={{
                  min: 0,
                  step: "any",
                  "aria-label": `${exercise.name} set ${
                    setIndex + 1
                  } weight in pounds`,
                }}
                onChange={(e) => onUpdateSet(set.id, "weight", e.target.value)}
                onBlur={() => onNormaliseSet(set.id, "weight")}
              />

              <TextField
                type="number"
                size="small"
                value={set.reps}
                inputProps={{
                  min: 0,
                  step: 1,
                  "aria-label": `${exercise.name} set ${setIndex + 1} reps`,
                }}
                onChange={(e) => onUpdateSet(set.id, "reps", e.target.value)}
                onBlur={() => onNormaliseSet(set.id, "reps")}
              />

              <IconButton
                aria-label={`Mark ${exercise.name} set ${setIndex + 1} ${
                  set.completed ? "incomplete" : "complete"
                }`}
                onClick={() => onToggleSet(set.id)}
              >
                {set.completed ? (
                  <CheckCircleIcon sx={{ color: accent }} />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </IconButton>

              <IconButton
                size="small"
                aria-label={`Remove ${exercise.name} set ${setIndex + 1}`}
                onClick={() => onRemoveSet(set.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>

        <Button
          startIcon={<AddIcon />}
          onClick={onAddSet}
          sx={{ mt: 2, textTransform: "none", fontWeight: 700 }}
        >
          Add Set
        </Button>

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

              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {weightSuggestion(exercise)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </CardContent>
    </Card>
  );
}
