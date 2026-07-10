import React from "react";
import { Box } from "@mui/material";
import Seo from "../components/Seo";
import HeroSection from "../components/home/HeroSection";
import CapabilitiesSection from "../components/home/CapabilitiesSection";
import PerformanceStrip from "../components/home/PerformanceStrip";
import WorkspacesSection from "../components/home/WorkspacesSection";
import FinalCtaSection from "../components/home/FinalCtaSection";

const Home: React.FC = () => (
  <Box sx={{ bgcolor: "#f8fafc", color: "#0f172a", overflow: "hidden" }}>
    <Seo
      title="SportLab AI — Sports Science Platform for Athletes"
      description="All-in-one sports science platform. Track readiness, recovery, and training load. Get AI coaching, mental health support, and personalized sport matching."
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
