/**
 * Shared look for the My Workout page: one slate palette, one card, one
 * primary and one secondary button. Components import these instead of
 * repeating hex values, so the planner, AI tab and dialog stay in step.
 */
export const INK = "#0f172a";
export const INK_HOVER = "#1e293b";
export const BODY = "#475569";
export const MUTED = "#64748b";
export const LINE = "#e2e8f0";
export const LINE_STRONG = "#cbd5e1";
export const SURFACE = "#f8fafc";
export const TRACK = "#eef2f7";

export const cardSx = {
  border: `1px solid ${LINE}`,
  borderRadius: 3,
  bgcolor: "#fff",
} as const;

export const captionSx = {
  fontSize: 12,
  fontWeight: 800,
  color: MUTED,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
} as const;

export const primaryButtonSx = {
  textTransform: "none",
  fontWeight: 800,
  borderRadius: 3,
  boxShadow: "none",
  bgcolor: INK,
  "&:hover": { bgcolor: INK_HOVER, boxShadow: "none" },
} as const;

export const secondaryButtonSx = {
  textTransform: "none",
  fontWeight: 800,
  borderRadius: 3,
  color: INK,
  borderColor: LINE_STRONG,
  bgcolor: "#fff",
  "&:hover": { borderColor: INK, bgcolor: "#fff" },
} as const;

export const textButtonSx = {
  textTransform: "none",
  fontWeight: 800,
  color: INK,
  borderRadius: 2,
} as const;

export const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" },
} as const;

/** Muted icon that turns red on hover, for remove/delete actions. */
export const removeIconSx = {
  color: MUTED,
  "&:hover": { color: "error.main", bgcolor: "#fef2f2" },
} as const;

export const progressSx = (color: string, height = 8) => ({
  height,
  borderRadius: 10,
  bgcolor: TRACK,
  "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 10 },
});
