import React from "react";
import { Box, CircularProgress, Fade } from "@mui/material";

/**
 * True only once `active` has been on for `delayMs`.
 *
 * Most of these loads resolve from cache in well under 200ms. Rendering a
 * spinner immediately makes that flash on screen and vanish, which reads as a
 * glitch — worse than showing nothing. Waiting a beat means fast loads look
 * instant and only genuinely slow ones get an indicator.
 */
export function useDelayedFlag(active: boolean, delayMs = 220): boolean {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }

    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
}

type PageLoaderProps = {
  /** Reserve the same height the loaded content will occupy, to avoid a jump. */
  minHeight?: number | string;
  label?: string;
};

/**
 * Centred spinner for whole-page waits. Fades in after a short delay so quick
 * loads never flash, and announces itself to screen readers.
 */
export function PageLoader({ minHeight = "60vh", label = "Loading" }: PageLoaderProps) {
  const show = useDelayedFlag(true);

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      sx={{ minHeight, display: "grid", placeItems: "center", px: 2 }}
    >
      <Fade in={show} timeout={200}>
        <Box sx={{ display: "grid", placeItems: "center", gap: 1.5 }}>
          <CircularProgress size={32} thickness={4} />
          <Box
            component="span"
            sx={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}
          >
            {label}
          </Box>
        </Box>
      </Fade>
    </Box>
  );
}
