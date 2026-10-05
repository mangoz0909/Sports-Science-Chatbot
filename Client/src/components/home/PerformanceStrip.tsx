import React from "react";
import { Box } from "@mui/material";
import { color, type } from "./landingTokens";
import { Frame } from "./LandingPrimitives";

const items = [
  { title: "Load trends", desc: "Spot rising workload before it becomes a problem." },
  { title: "Progress clarity", desc: "Show performance changes without messy dashboards." },
  { title: "Recovery signals", desc: "Keep readiness visible before training decisions." },
];

/** Full-bleed ink band: three columns split by hairlines. No icons, no shimmer. */
export default function PerformanceStrip() {
  return (
    <Box component="section" aria-label="What you see over a season" sx={{ bgcolor: color.ink, color: color.onInk, py: { xs: 6, md: 8 } }}>
      <Frame>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
          {items.map((item, i) => (
            <Box
              key={item.title}
              sx={{
                py: { xs: 3, md: 0 },
                px: { md: 4 },
                pl: { md: i === 0 ? 0 : 4 },
                borderTop: { xs: i === 0 ? "none" : `1px solid ${color.ruleOnInk}`, md: "none" },
                borderLeft: { md: i === 0 ? "none" : `1px solid ${color.ruleOnInk}` },
              }}
            >
              <Box component="h3" sx={{ ...type.h2, fontSize: { xs: "1.75rem", md: "2rem" }, m: 0, color: color.onInk }}>{item.title}</Box>
              <Box component="p" sx={{ ...type.body, m: 0, mt: 1, color: color.onInk2 }}>{item.desc}</Box>
            </Box>
          ))}
        </Box>
      </Frame>
    </Box>
  );
}
