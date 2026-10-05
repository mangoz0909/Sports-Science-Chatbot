import React from "react";
import { Box } from "@mui/material";
import { color, type } from "./landingTokens";
import { Frame, Reveal, SectionHead } from "./LandingPrimitives";

const capabilities = [
  { title: "Readiness monitoring", desc: "Track recovery, soreness, sleep quality, fatigue, and match readiness in a readable way." },
  { title: "Training load", desc: "Understand workload spikes, high-intensity exposure, and session balance." },
  { title: "Performance output", desc: "Review sprint speed, endurance trends, power output, and movement quality." },
  { title: "Mental support", desc: "Support confidence, stress control, emotional regulation, and pre-game focus." },
];

/** A ruled two-column list instead of a row of icon cards. */
export default function CapabilitiesSection() {
  return (
    <Box component="section" aria-labelledby="capabilities-title" sx={{ py: { xs: 8, md: 12 } }}>
      <Frame>
        <Reveal>
          <SectionHead index="01" title="What it helps with" id="capabilities-title">
            Built around the decisions coaches and athletes actually make: load, recovery, readiness, risk, and what to
            do next.
          </SectionHead>
        </Reveal>

        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: 8 }}>
          {capabilities.map((item, i) => (
            <Box component="li" key={item.title} sx={{ borderTop: `1px solid ${color.rule}`, py: 3, display: "grid", gridTemplateColumns: "3rem 1fr" }}>
              <Box sx={{ ...type.label, color: color.ink3, pt: 0.5 }}>{String(i + 1).padStart(2, "0")}</Box>
              <Box>
                <Box component="h3" sx={{ ...type.h3, m: 0, color: color.ink }}>{item.title}</Box>
                <Box component="p" sx={{ ...type.body, m: 0, mt: 1, color: color.ink2, maxWidth: "46ch" }}>{item.desc}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Frame>
    </Box>
  );
}
