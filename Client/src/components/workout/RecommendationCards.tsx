import React from "react";
import { Box, ButtonBase, Chip, LinearProgress, Stack, Typography } from "@mui/material";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

import type { Recommendation } from "../../lib/workoutPlan";
import { INK, LINE, MUTED, SURFACE, progressSx } from "./ui";

type Props = {
  recommendations: Recommendation[];
  onStart: (typeId: string) => void;
  dayLabel: string;
};

/**
 * What to train on the selected day, best fit first. Each row is one button:
 * a single click starts that workout, so a long library of saved AI workouts
 * stays a short list instead of a wall of cards.
 */
export default function RecommendationCards({
  recommendations,
  onStart,
  dayLabel,
}: Props) {
  return (
    <Box>
      <Typography component="h2" fontWeight={950} fontSize={20} color={INK}>
        What are you training {dayLabel}?
      </Typography>

      <Typography color={MUTED} fontSize={14} mt={0.5} mb={2}>
        Best fit first, based on what you trained recently. Tap one to start.
      </Typography>

      <Stack spacing={1}>
        {recommendations.map((entry, index) => (
          <ButtonBase
            key={entry.type.id}
            onClick={() => onStart(entry.type.id)}
            aria-label={`Start ${entry.type.name}, ${entry.percent}% fit. ${entry.reason}`}
            sx={{
              display: "grid",
              gridTemplateColumns: "6px minmax(0, 1fr) auto",
              alignItems: "center",
              columnGap: 2,
              width: "100%",
              textAlign: "left",
              p: 1.75,
              pl: 1.5,
              borderRadius: 3,
              border: `1px solid ${index === 0 ? INK : LINE}`,
              bgcolor: "#fff",
              transition: "border-color 150ms ease, background-color 150ms ease",
              "&:hover": { borderColor: entry.type.color, bgcolor: SURFACE },
              "&.Mui-focusVisible": { outline: `2px solid ${INK}`, outlineOffset: 2 },
            }}
          >
            <Box sx={{ alignSelf: "stretch", borderRadius: 3, bgcolor: entry.type.color }} />

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={900} color={INK} noWrap>
                  {entry.type.name}
                </Typography>
                {index === 0 && (
                  <Chip label="Best fit" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 900, bgcolor: INK, color: "#fff" }} />
                )}
              </Stack>
              <Typography variant="body2" color={MUTED} sx={{ mt: 0.25 }}>
                {entry.reason}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={entry.percent}
                aria-hidden
                sx={{ ...progressSx(entry.type.color, 5), mt: 1, maxWidth: 240 }}
              />
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={950} fontSize={18} color={INK}>
                {entry.percent}%
              </Typography>
              <Box
                aria-hidden
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: index === 0 ? INK : "#f1f5f9",
                  color: index === 0 ? "#fff" : INK,
                }}
              >
                <PlayArrowRoundedIcon />
              </Box>
            </Stack>
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}
