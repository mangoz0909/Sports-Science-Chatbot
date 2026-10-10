import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { INK, LINE, MUTED, SURFACE } from "../workout/ui";
import { RANGE_OPTIONS, type RangeDays } from "./trendRange";

type Props = {
  value: RangeDays;
  onChange: (next: RangeDays) => void;
};

/**
 * Page-level range switch. It sits above the chart row because it drives every
 * check-in based chart on the dashboard, not just one card.
 */
export default function RangeFilter({ value, onChange }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        mb: 2,
      }}
    >
      <Typography sx={{ color: MUTED, fontSize: 14, fontWeight: 700 }} id="trend-range-label">
        Trend range
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        aria-labelledby="trend-range-label"
        onChange={(_, next: RangeDays | null) => {
          if (next) onChange(next);
        }}
        sx={{
          bgcolor: "#fff",
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 800,
            fontSize: 13,
            px: 1.75,
            py: 0.5,
            color: MUTED,
            borderColor: LINE,
            "&.Mui-selected": { bgcolor: INK, color: "#fff", "&:hover": { bgcolor: INK } },
            "&:not(.Mui-selected):hover": { bgcolor: SURFACE },
          },
        }}
      >
        {RANGE_OPTIONS.map((d) => (
          <ToggleButton key={d} value={d} aria-label={`${d} days`}>
            {d} days
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
