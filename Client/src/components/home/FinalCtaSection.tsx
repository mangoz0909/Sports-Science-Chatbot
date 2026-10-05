import React from "react";
import { Box } from "@mui/material";
import { color, type } from "./landingTokens";
import { Frame, PrimaryButton, Reveal, TextLink } from "./LandingPrimitives";

/** Closing band: left-aligned, one action, nothing floating. */
export default function FinalCtaSection() {
  return (
    <Box component="section" aria-labelledby="cta-title" sx={{ bgcolor: color.ink, color: color.onInk, py: { xs: 8, md: 12 } }}>
      <Frame>
        <Reveal>
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
