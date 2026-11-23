import React from "react";
import { Box } from "@mui/material";
import { color, type } from "./landingTokens";
import { Frame, PrimaryButton, Reveal, TextLink } from "./LandingPrimitives";

/** Half a tennis court in plan, in the same hairlines as the rest of the page. */
function CourtLines() {
  return (
    <Box
      component="svg" viewBox="0 0 360 400" aria-hidden
      sx={{ display: { xs: "none", md: "block" }, position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", height: { md: 300, lg: 340 }, color: color.onInk2 }}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55">
        <path d="M20 390V10H340V390" />
        <path d="M60 390V10M300 390V10M60 200H300M180 200V390M180 10V22" />
      </g>
      <path d="M4 390H356" stroke="currentColor" strokeWidth="4" strokeDasharray="4 4" opacity="0.55" />
      <circle cx="236" cy="92" r="7" fill={color.lime} />
    </Box>
  );
}

/** Closing band: left-aligned, one action. */
export default function FinalCtaSection() {
  return (
    <Box component="section" aria-labelledby="cta-title" sx={{ bgcolor: color.ink, color: color.onInk, py: { xs: 8, md: 12 } }}>
      <Frame sx={{ position: "relative" }}>
        <CourtLines />
        <Reveal sx={{ position: "relative" }}>
          <Box component="h2" id="cta-title" sx={{ ...type.hero, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", m: 0, maxWidth: "20ch" }}>
            Start with tomorrow morning&rsquo;s <Box component="span" sx={{ whiteSpace: "nowrap" }}>check-in.</Box>
          </Box>
          <Box component="p" sx={{ ...type.lead, m: 0, mt: 3, color: color.onInk2, maxWidth: "48ch" }}>
            Create an account, log one check-in, and the dashboard has something to read.
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, mt: 5 }}>
            <PrimaryButton to="/auth?mode=signup" onInk>Create account</PrimaryButton>
            <TextLink to="/auth" onInk>I already have one</TextLink>
          </Box>
        </Reveal>
      </Frame>
    </Box>
  );
}
