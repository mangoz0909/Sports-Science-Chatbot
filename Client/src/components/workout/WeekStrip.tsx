import React from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  toISODate,
  type Plan,
  type WorkoutType,
} from "../../lib/workoutPlan";
import { INK, LINE, MUTED, textButtonSx } from "./ui";

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
        <Typography fontWeight={900} color={INK}>{monthLabel}</Typography>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {selectedISO !== todayISO && (
            <Button size="small" onClick={() => onSelect(todayISO)} sx={{ ...textButtonSx, minWidth: 0, px: 1.25 }}>
              Today
            </Button>
          )}
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
          // Days keep their own name and colour, so removing a type from the
          // library does not blank out the history.
          const label = session?.name ?? type?.name;
          const color = session?.color ?? type?.color;
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
              })}${isToday ? ", today" : ""}${label ? ` — ${label}` : ""}`}
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
                borderColor: isSelected ? INK : LINE,
                bgcolor: isSelected ? "#f1f5f9" : "#fff",
                transition: "border-color 150ms ease, background-color 150ms ease",

                "&:hover": {
                  borderColor: isSelected ? INK : "#94a3b8",
                },
              }}
            >
              <Typography
                variant="caption"
                fontWeight={isToday ? 900 : 700}
                color={isToday ? INK : MUTED}
                display="block"
              >
                {isToday ? (
                  <>
                    {/* "Today" does not fit a phone-width square. */}
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Today</Box>
                    <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>{WEEKDAYS[index]}</Box>
                  </>
                ) : WEEKDAYS[index]}
              </Typography>

              <Typography
                fontWeight={800}
                fontSize={{ xs: 15, sm: 18 }}
                color={INK}
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
                  width: color ? { xs: 16, sm: 22 } : 6,
                  borderRadius: 3,
                  bgcolor: color ?? "transparent",
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
