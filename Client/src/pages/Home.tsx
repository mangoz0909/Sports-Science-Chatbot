import React from "react";
import { Box } from "@mui/material";
import Seo from "../components/Seo";
import HeroSection from "../components/home/HeroSection";
import CapabilitiesSection from "../components/home/CapabilitiesSection";
import PerformanceStrip from "../components/home/PerformanceStrip";
import WorkspacesSection from "../components/home/WorkspacesSection";
import FinalCtaSection from "../components/home/FinalCtaSection";
import { color, font } from "../components/home/landingTokens";

const Home: React.FC = () => (
  <Box sx={{ bgcolor: color.paper, color: color.ink, fontFamily: font.body, overflow: "hidden" }}>
    <Seo
      title="SportLab AI — Sports Science Platform for Athletes"
      description="Track readiness, recovery and training load, get AI coaching for training, nutrition and mental performance, and find the sport that fits you."
      path="/"
    />
    <HeroSection />
    <CapabilitiesSection />
    <PerformanceStrip />
    <WorkspacesSection />
    <FinalCtaSection />
  </Box>
);

export default Home;
