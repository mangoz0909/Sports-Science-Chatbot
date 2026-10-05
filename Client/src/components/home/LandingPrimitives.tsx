import React from "react";
import { Box, ButtonBase, type SxProps, type Theme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { motion as fm, useReducedMotion } from "framer-motion";
import { color, focusRing, font, layout, motion, radius, type } from "./landingTokens";

/** Page-width wrapper. Every landing section sits inside one. */
export function Frame({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box sx={{ maxWidth: layout.maxWidth, mx: "auto", px: layout.gutter, ...sx }}>
      {children}
    </Box>
  );
}

/**
 * Section heading: a mono index ("02") and an uppercase condensed title over a
 * 2px rule. Replaces the old pill eyebrow + h2 + grey paragraph stack.
 */
export function SectionHead({
  index,
  title,
  children,
  onInk = false,
  id,
}: {
  index: string;
  title: string;
  children?: React.ReactNode;
  onInk?: boolean;
  id?: string;
}) {
  return (
    <Box sx={{ borderTop: `2px solid ${onInk ? color.onInk : color.ruleStrong}`, pt: 2, mb: { xs: 4, md: 6 } }}>
      <Box component="span" sx={{ ...type.label, display: "block", color: onInk ? color.accentOnInk : color.accent, mb: 1.5 }}>
        {index}
      </Box>
      <Box component="h2" id={id} sx={{ ...type.h2, m: 0, color: onInk ? color.onInk : color.ink, maxWidth: "22ch" }}>
        {title}
      </Box>
      {children && (
        <Box component="p" sx={{ ...type.lead, m: 0, mt: 2, maxWidth: "56ch", color: onInk ? color.onInk2 : color.ink2 }}>
          {children}
        </Box>
      )}
    </Box>
  );
}

const buttonBase = {
  fontFamily: font.body,
  fontWeight: 600,
  fontSize: "1rem",
  lineHeight: 1,
  borderRadius: `${radius.md}px`,
  px: 3,
  minHeight: 48,
  gap: 1,
  transition: `background-color ${motion.fast}s ease, color ${motion.fast}s ease, border-color ${motion.fast}s ease`,
  "&:active": { transform: "translateY(1px)" },
  "&.Mui-focusVisible": { boxShadow: focusRing },
} as const;

/** Solid action. One per section, at most. */
export function PrimaryButton({ to, children, onInk = false }: { to: string; children: React.ReactNode; onInk?: boolean }) {
  return (
    <ButtonBase
      component={RouterLink}
      to={to}
      sx={{
        ...buttonBase,
        bgcolor: onInk ? color.accentOnInk : color.accent,
        color: onInk ? color.ink : "#fff",
        "&:hover": { bgcolor: onInk ? color.onInk : color.accentHover },
      }}
    >
      {children}
      <Box component="span" aria-hidden sx={{ fontFamily: font.mono }}>→</Box>
    </ButtonBase>
  );
}

/** Secondary action: underlined text, no box. */
export function TextLink({ to, children, onInk = false }: { to: string; children: React.ReactNode; onInk?: boolean }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        fontFamily: font.body,
        fontWeight: 600,
        color: onInk ? color.onInk : color.ink,
        textDecoration: "underline",
        textDecorationThickness: "1px",
        textUnderlineOffset: "4px",
        textDecorationColor: onInk ? color.onInk2 : color.rule,
        transition: `text-decoration-color ${motion.fast}s ease`,
        "&:hover": { textDecorationColor: onInk ? color.accentOnInk : color.accent },
        "&:focus-visible": { outline: "none", boxShadow: focusRing, borderRadius: `${radius.sm}px` },
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Ten-segment meter for a 1–10 check-in value. Reads like a scale on a form,
 * not a progress bar. `invert` for fields where high is bad (fatigue, soreness).
 */
export function Meter({ value, max = 10, invert = false, label }: { value: number; max?: number; invert?: boolean; label: string }) {
  const goodness = invert ? max - value : value;
  const tone = goodness >= 7 ? color.go : goodness >= 4 ? color.caution : color.stop;
  return (
    <Box role="img" aria-label={`${label}: ${value} out of ${max}`} sx={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: max }, (_, i) => (
        <Box key={i} sx={{ flex: 1, height: 10, borderRadius: `${radius.sm}px`, bgcolor: i < value ? tone : color.wash }} />
      ))}
    </Box>
  );
}

const MotionBox = fm.create(Box);

/**
 * The only entrance animation on the landing page: fade + 12px rise, once.
 * Hero content must NOT use this (it has to be visible before JS runs).
 */
export function Reveal({ children, delay = 0, sx }: { children: React.ReactNode; delay?: number; sx?: SxProps<Theme> }) {
  const reduce = useReducedMotion();
  return (
    <MotionBox
      initial={reduce ? false : { opacity: 0, y: motion.rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: motion.slow, ease: motion.easeOut, delay }}
      sx={sx}
    >
      {children}
    </MotionBox>
  );
}
