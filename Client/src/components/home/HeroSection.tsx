import React from "react";
import { Box } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { color, font, radius, type } from "./landingTokens";
import { calculateReadiness, getAIAdvice } from "../../lib/checkInScores";
import { Frame, PrimaryButton, SliderMeter, TextLink } from "./LandingPrimitives";
import { exampleCheckIn, heroRows } from "./heroExample";

/** A check-in anyone can try: the app's own score and advice on navy, then the answers behind them. */
function CheckInSheet() {
  const [data, setData] = React.useState(exampleCheckIn);
  const readiness = calculateReadiness(data);

  return (
    <Box
      role="group"
      aria-label="Try a morning check-in"
      sx={{ bgcolor: color.sheet, border: `1px solid ${color.rule}`, borderRadius: `${radius.lg}px`, overflow: "hidden" }}
    >
      <Box
        aria-live="polite"
        sx={{
          bgcolor: color.ink, color: color.onInk, px: { xs: 2, sm: 3 }, py: { xs: 2.5, sm: 3 },
          display: "grid", gridTemplateColumns: "auto 1fr", columnGap: { xs: 2.5, sm: 4 }, alignItems: "center",
          // Room for the longest advice, so moving a slider never moves the page.
          minHeight: { xs: 156, sm: 152 },
        }}
      >
        <Box>
          <Box sx={{ fontFamily: font.body, fontWeight: 600, color: color.onInk }}>Readiness score</Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mt: 0.5, minWidth: { xs: "7.75rem", lg: "9rem" } }}>
            <Box component="span" sx={{ ...type.score, color: color.lime }}>{readiness}</Box>
            <Box component="span" sx={{ ...type.label, color: color.onInk2 }}>/100</Box>
          </Box>
        </Box>
        <Box component="p" sx={{ ...type.body, fontSize: { xs: "0.9375rem", sm: "1rem" }, lineHeight: 1.5, m: 0, color: color.onInk, textWrap: "balance" }}>
          {getAIAdvice(data)}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2,
          px: { xs: 2, sm: 3 }, py: 1.5, borderBottom: `1px solid ${color.rule}`,
        }}
      >
        <Box sx={{ fontFamily: font.body, fontWeight: 600, color: color.ink }}>Morning check-in</Box>
        <Box sx={{ fontFamily: font.body, fontSize: "0.875rem", color: color.ink3 }}>Try it: move a bar</Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 0.5 }}>
        {heroRows.map((row) => (
          <Box
            component="label"
            key={row.key}
            sx={{
              display: "grid", gridTemplateColumns: { xs: "1fr 2ch", sm: "9rem 1fr 2ch" },
              columnGap: 2, alignItems: "center", py: { xs: 0.75, sm: 0.5 },
              "& + &": { borderTop: `1px solid ${color.wash}` },
            }}
          >
            <Box component="span" sx={{ fontFamily: font.body, color: color.ink2, fontSize: "0.9375rem" }}>{row.label}</Box>
            <Box component="span" sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, gridRow: { xs: 2, sm: "auto" } }}>
              <SliderMeter
                label={row.label}
                value={data[row.key]}
                invert={row.invert}
                onChange={(value) => setData((prev) => ({ ...prev, [row.key]: value }))}
              />
            </Box>
            <Box component="span" aria-hidden sx={{ ...type.data, textAlign: "right", color: color.ink, gridColumn: { xs: 2, sm: "auto" }, gridRow: { xs: 1, sm: "auto" } }}>
              {data[row.key]}
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        component="p"
        sx={{
          m: 0, px: { xs: 2, sm: 3 }, py: 1.75, borderTop: `1px solid ${color.rule}`,
          fontFamily: font.body, fontSize: "0.875rem", lineHeight: 1.5, color: color.ink3, textWrap: "pretty",
        }}
      >
        Example numbers, nothing is saved. Also in the score: mood {data.mood}, nutrition quality {data.nutrition}, pain level {data.painLevel}. Educational only, not medical advice.
      </Box>
    </Box>
  );
}

export default function HeroSection() {
  const { session } = useAuth();

  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 8, md: 10 } }}>
      <Frame>
        {/* Visible without JavaScript: no entrance animation on anything here. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 13fr) minmax(0, 12fr)" },
            gap: { xs: 5, md: 5, lg: 8 },
            alignItems: "center",
          }}
        >
          <Box>
            <Box
              component="h1"
              id="hero-title"
              sx={{
                ...type.hero,
                fontSize: { xs: "clamp(2.5rem, 12vw, 3rem)", sm: "5.25rem", md: "clamp(3.5rem, 7vw, 5.375rem)" },
                m: 0,
                color: color.ink,
                maxWidth: "7em", // em, not ch: ch changes when the web font swaps in
              }}
            >
              Make athlete decisions easier to understand.
            </Box>
            <Box component="p" sx={{ ...type.lead, m: 0, mt: { xs: 3, md: 4 }, color: color.ink2, maxWidth: "25em", textWrap: "pretty" }}>
              SportLab AI helps athletes, coaches, and students explore training intensity, recovery, readiness, sport
              matching, and mental performance.
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 3, rowGap: 2, mt: 4 }}>
              {session ? (
                <PrimaryButton to="/daily-check-in">Open the check-in</PrimaryButton>
              ) : (
                <PrimaryButton to="/auth?mode=signup">Create account</PrimaryButton>
              )}
              <TextLink to="/dashboard">{session ? "View the dashboard" : "View the demo"}</TextLink>
            </Box>
          </Box>

          <CheckInSheet />
        </Box>
      </Frame>
    </Box>
  );
}
