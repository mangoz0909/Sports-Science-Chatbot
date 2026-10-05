import React from "react";
import { Box } from "@mui/material";
import { color, font, radius, type } from "./landingTokens";
import { Frame, Meter, PrimaryButton, TextLink } from "./LandingPrimitives";

/*
 * An example morning check-in, using the real field names and 1–10 scales from
 * pages/DailyCheckIn.tsx. It is labelled as an example on the page — these are
 * not anyone's results.
 */
const sheet = [
  { label: "Sleep Quality", value: 8 },
  { label: "Energy Level", value: 7 },
  { label: "Muscle Soreness", value: 6, invert: true },
  { label: "Fatigue", value: 4, invert: true },
  { label: "Hydration", value: 5 },
  { label: "Stress Level", value: 3, invert: true },
];

export default function HeroSection() {
  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
      <Frame>
        {/* Visible without JavaScript: no entrance animation on anything here. */}
        <Box component="h1" id="hero-title" sx={{ ...type.hero, m: 0, color: color.ink, maxWidth: "14ch" }}>
          Make athlete decisions easier to understand.
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
            gap: { xs: 5, md: 8 },
            mt: { xs: 4, md: 6 },
            alignItems: "start",
          }}
        >
          <Box>
            <Box component="p" sx={{ ...type.lead, m: 0, color: color.ink2, maxWidth: "40ch" }}>
              SportLab AI helps athletes, coaches, and students explore training load, recovery, readiness, sport
              matching, sports rules, and mental performance.
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, mt: 4 }}>
              <PrimaryButton to="/sports">Open Sports AI</PrimaryButton>
              <TextLink to="/dashboard">View the dashboard</TextLink>
            </Box>
          </Box>

          <Box
            component="figure"
            sx={{ m: 0, bgcolor: color.sheet, border: `1px solid ${color.rule}`, borderRadius: `${radius.lg}px` }}
          >
            <Box
              sx={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2,
                px: { xs: 2, sm: 3 }, py: 2, borderBottom: `1px solid ${color.rule}`,
              }}
            >
              <Box sx={{ fontFamily: font.body, fontWeight: 600, color: color.ink }}>Morning check-in</Box>
              <Box sx={{ ...type.label, color: color.ink3 }}>example · 1–10</Box>
            </Box>

            <Box component="dl" sx={{ m: 0, px: { xs: 2, sm: 3 }, py: 1 }}>
              {sheet.map((row) => (
                <Box
                  key={row.label}
                  sx={{
                    display: "grid", gridTemplateColumns: { xs: "1fr 2ch", sm: "9.5rem 1fr 2ch" },
                    columnGap: 2, rowGap: 1, alignItems: "center", py: 1.25,
                    "& + &": { borderTop: `1px solid ${color.wash}` },
                  }}
                >
                  <Box component="dt" sx={{ fontFamily: font.body, color: color.ink2, fontSize: "0.9375rem" }}>{row.label}</Box>
                  <Box component="dd" sx={{ m: 0, gridColumn: { xs: "1 / -1", sm: "auto" }, gridRow: { xs: 2, sm: "auto" } }}>
                    <Meter label={row.label} value={row.value} invert={row.invert} />
                  </Box>
                  <Box component="dd" sx={{ ...type.data, m: 0, textAlign: "right", color: color.ink, gridColumn: { xs: 2, sm: "auto" }, gridRow: { xs: 1, sm: "auto" } }}>
                    {row.value}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box
              component="figcaption"
              sx={{
                mx: { xs: 2, sm: 3 }, mb: 3, mt: 1, pl: 2, borderLeft: `3px solid ${color.go}`,
                fontFamily: font.body, color: color.ink2, lineHeight: 1.6,
              }}
            >
              <Box component="span" sx={{ ...type.label, display: "block", color: color.go, mb: 0.5 }}>Coach note</Box>
              Maintain normal load. Add mobility and hydration before high-intensity sprint work.
            </Box>
          </Box>
        </Box>
      </Frame>
    </Box>
  );
}
