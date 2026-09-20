import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  toISODate,
  type Plan,
  type WorkoutType,
} from "../../lib/workoutPlan";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  days: Date[];
  selectedISO: string;
  todayISO: string;
  plan: Plan;
  onSelect: (iso: string) => void;
  onShiftWeek: (weeks: number) => void;
};

/**
 * The week as seven squares: pick a day, see what was trained on it.
 *
 * Each square carries the colour of whatever workout type is logged that day,
 * so a week's split is legible at a glance without opening any of them.
 */
export default function WeekStrip({
  days,
  selectedISO,
  todayISO,
  plan,
  onSelect,
  onShiftWeek,
}: Props) {
  const typeById = new Map<string, WorkoutType>(
    plan.types.map((type) => [type.id, type])
  );

  const monthLabel = days[0].toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
        <Typography fontWeight={800}>{monthLabel}</Typography>

        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            aria-label="Previous week"
            onClick={() => onShiftWeek(-1)}
          >
            <ChevronLeftIcon />
          </IconButton>

          <IconButton
            size="small"
            aria-label="Next week"
            onClick={() => onShiftWeek(1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: { xs: 0.75, sm: 1.5 },
        }}
      >
        {days.map((day, index) => {
          const iso = toISODate(day);
          const session = plan.days[iso];
          const type = session ? typeById.get(session.typeId) : undefined;
          const isSelected = iso === selectedISO;
          const isToday = iso === todayISO;

          return (
            <Box
              key={iso}
              component="button"
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={`${day.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}${type ? ` — ${type.name}` : ""}`}
              aria-pressed={isSelected}
              sx={{
                cursor: "pointer",
                font: "inherit",
                textAlign: "center",
                px: 0,
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2.5,
                // The selected day is outlined rather than filled so the type
                // colour underneath stays readable.
                border: "2px solid",
                borderColor: isSelected ? "#0f172a" : "divider",
                bgcolor: isSelected ? "#f1f5f9" : "#fff",
                transition: "border-color 150ms ease, background-color 150ms ease",

                "&:hover": {
                  borderColor: isSelected ? "#0f172a" : "#94a3b8",
                },
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color={isToday ? "primary.main" : "text.secondary"}
                display="block"
              >
                {WEEKDAYS[index]}
              </Typography>

              <Typography
                fontWeight={800}
                fontSize={{ xs: 15, sm: 18 }}
                lineHeight={1.4}
              >
                {day.getDate()}
              </Typography>

              {/* A fixed-height slot keeps every square the same height
                  whether or not the day has a session. */}
              <Box
                sx={{
                  height: 6,
                  mt: 0.5,
                  mx: "auto",
                  width: type ? { xs: 16, sm: 22 } : 6,
                  borderRadius: 3,
                  bgcolor: type ? type.color : "transparent",
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
