import React from "react";
import { Box, type Theme } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import { color, radius, type } from "./landingTokens";
import { Frame, Reveal, SectionHead } from "./LandingPrimitives";

type Shot = { src: string; small?: string; width: number; height: number; alt: string };

/*
 * Crops of the real guest pages (demo data). Retake them when those pages change:
 * the size attributes below must match the files in public/landing.
 */
const shots = {
  readiness: {
    src: "/landing/readiness-trend.webp", small: "/landing/readiness-trend-sm.webp", width: 1400, height: 851,
    alt: "Line chart from the demo dashboard: readiness, recovery, intensity and fatigue over seven days.",
  },
  workout: {
    src: "/landing/workout-log.webp", width: 1000, height: 953,
    alt: "Demo workout log for bench press: three sets of 135 lb, two ticked off, and a tip to try about 140 lb next session.",
  },
  match: {
    src: "/landing/sports-match.webp", small: "/landing/sports-match-sm.webp", width: 1000, height: 733,
    alt: "Sports Match preference form: five choices from solo to team sport, with \"Either\" picked.",
  },
} satisfies Record<string, Shot>;

function ProductShot({ shot, Icon, source, title, beside = false, sx, children }: { shot: Shot; Icon: React.ElementType; source?: string; title: string; beside?: boolean; sx: SystemStyleObject<Theme>; children: React.ReactNode }) {
  return (
    <Box
      component="figure"
      sx={[
        // Frame and caption share rows with the shot beside them, so a pair lines up.
        { m: 0, display: "grid", rowGap: 2, gridRow: { sm: "span 2", md: beside ? "auto" : "span 2" }, gridTemplateRows: { sm: "subgrid", md: beside ? "auto" : "subgrid" } },
        beside && { gridTemplateColumns: { md: "minmax(0, 3fr) minmax(0, 2fr)" }, columnGap: { md: 3, lg: 4 }, alignItems: { md: "start" } },
        sx,
      ]}
    >
      <Box sx={{ bgcolor: color.sheet, borderRadius: `${radius.lg}px`, p: { xs: 1.5, md: 2 }, display: "grid", alignItems: "center" }}>
        <picture>
          {shot.small && <source media="(max-width: 599px)" srcSet={shot.small} />}
          <Box
            component="img" src={shot.src} alt={shot.alt} width={shot.width} height={shot.height}
            loading="lazy" decoding="async" sx={{ display: "block", width: "100%", height: "auto" }}
          />
        </picture>
      </Box>
      <Box component="figcaption" sx={beside ? { borderTop: { md: `1px solid ${color.ruleOnInk}` }, pt: { md: 2 } } : undefined}>
        <Claim Icon={Icon} title={title} source={source}>{children}</Claim>
      </Box>
    </Box>
  );
}

function Claim({ Icon, title, source, children }: { Icon: React.ElementType; title: string; source?: string; children: React.ReactNode }) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Icon aria-hidden sx={{ fontSize: 28, color: color.lime, flexShrink: 0 }} />
        <Box component="h3" sx={{ ...type.h3, m: 0, color: color.onInk }}>{title}</Box>
      </Box>
      <Box component="p" sx={{ ...type.body, m: 0, mt: 0.75, color: color.onInk2, maxWidth: "52ch", textWrap: "balance" }}>{children}</Box>
      {source && <Box sx={{ ...type.label, color: color.onInk2, mt: 1 }}>{source}</Box>}
    </>
  );
}

/** One navy section: each claim sits with the product screen that backs it. */
export default function CapabilitiesSection() {
  return (
    <Box component="section" aria-labelledby="capabilities-title" sx={{ bgcolor: color.ink, color: color.onInk, py: { xs: 8, md: 12 } }}>
      <Frame>
        <Reveal>
          <SectionHead title="What it helps with" id="capabilities-title" onInk>
            Built around the decisions coaches and athletes actually make: intensity, recovery, readiness, risk, and what
            to do next.
          </SectionHead>
        </Reveal>

        {/* Phone: one column. Tablet: chart across, then a pair. Desktop: 7/5, twice. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(12, minmax(0, 1fr))" },
            columnGap: { sm: 3, lg: 4 },
            rowGap: { xs: 5, sm: 2 },
          }}
        >
          <ProductShot shot={shots.readiness} Icon={MonitorHeartOutlinedIcon} source="Dashboard, demo data" title="Readiness monitoring" sx={{ gridColumn: { sm: "1 / -1", md: "span 7" } }}>
            Track readiness, recovery, fatigue, and self-rated training intensity in a readable way, so it is all visible
            before training decisions.
          </ProductShot>
          <ProductShot shot={shots.workout} Icon={FitnessCenterIcon} source="My Workout, demo data" title="Workout log" sx={{ gridColumn: { sm: "span 6", md: "span 5" }, mt: { sm: 4, md: 0 } }}>
            Record sets, reps, and weights, and get progression suggestions for your next session.
          </ProductShot>
          <ProductShot shot={shots.match} Icon={SportsTennisIcon} title="Sports Match" beside sx={{ gridColumn: { sm: "span 6", md: "span 7" }, mt: { sm: 4, md: 6 } }}>
            Find sports that match your goals, intensity, and team, contact, and skill preferences.
          </ProductShot>
          <Box sx={{ gridColumn: { sm: "1 / -1", md: "span 5" }, mt: { sm: 4, md: 6 }, borderTop: `1px solid ${color.ruleOnInk}`, pt: 2 }}>
            <Claim Icon={PsychologyOutlinedIcon} title="Mental support" source="Sports Health AI">
              Support confidence, stress control, emotional regulation, and pre-game focus.
            </Claim>
          </Box>
        </Box>
      </Frame>
    </Box>
  );
}
