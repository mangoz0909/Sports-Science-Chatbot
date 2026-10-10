import { Box, Stack, Typography } from "@mui/material";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import { Link as RouterLink } from "react-router-dom";

import type { FuelItem } from "../../lib/workoutPlan";
import { BODY, INK, LINE, MUTED, SURFACE, captionSx } from "./ui";

const LINK_SX = { fontSize: 13, fontWeight: 800, color: INK, whiteSpace: "nowrap" } as const;

/** Compact pre- or post-workout food strip shown inside the session. */
export function FuelCard({ label, items }: { label: string; items: FuelItem[] }) {
  if (items.length === 0) return null;
  return (
    <Box component="section" aria-label={label} sx={{ mt: 1.5, px: 2, py: 1.25, borderRadius: 2, bgcolor: SURFACE, border: `1px solid ${LINE}` }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <LocalDiningIcon aria-hidden sx={{ fontSize: 16, color: MUTED }} />
            <Typography sx={captionSx}>{label}</Typography>
          </Stack>
          {items.map((item) => (
            <Typography key={`${item.meal}-${item.foods}`} fontSize={14} color={BODY} lineHeight={1.5} mt={0.25}>
              {item.foods}
              {item.timing ? <Box component="span" sx={{ color: MUTED }}>{` · ${item.timing}`}</Box> : null}
            </Typography>
          ))}
        </Box>
        <Box component={RouterLink} to="/health/nutrition" sx={LINK_SX}>
          Full nutrition plan
        </Box>
      </Stack>
    </Box>
  );
}

/** Shown when signed in but no nutrition plan exists for today. */
export function FuelEmptyHint() {
  return (
    <Typography variant="body2" color={MUTED} mt={1.5}>
      No fuel plan for today yet.{" "}
      <Box component={RouterLink} to="/health/nutrition" sx={{ ...LINK_SX, whiteSpace: "normal" }}>
        Generate today&apos;s nutrition plan
      </Box>
    </Typography>
  );
}
