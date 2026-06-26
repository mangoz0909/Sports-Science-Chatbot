import React from "react";
import { Box } from "@mui/material";

import HeroSection from "../components/home/HeroSection";
import CapabilitiesSection from "../components/home/CapabilitiesSection";
import PerformanceStrip from "../components/home/PerformanceStrip";
import WorkspacesSection from "../components/home/WorkspacesSection";
import FinalCtaSection from "../components/home/FinalCtaSection";

const Home: React.FC = () => (
  <Box sx={{ bgcolor: "#f8fafc", color: "#0f172a", overflow: "hidden" }}>
    <HeroSection />
    <CapabilitiesSection />
    <PerformanceStrip />
    <WorkspacesSection />
    <FinalCtaSection />
  </Box>
);

export default Home;
