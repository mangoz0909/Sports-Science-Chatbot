import React from "react";
import { Box, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SpeedIcon from "@mui/icons-material/Speed";
import { fadeUp, stagger, viewport } from "./homeAnimations";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const capabilities = [
  { icon: <MonitorHeartIcon />, title: "Readiness Monitoring", desc: "Track recovery, soreness, sleep quality, fatigue, and match readiness in a readable way." },
  { icon: <FitnessCenterIcon />, title: "Training Load", desc: "Understand workload spikes, high-intensity exposure, and session balance." },
  { icon: <SpeedIcon />, title: "Performance Output", desc: "Review sprint speed, endurance trends, power output, and movement quality." },
  { icon: <PsychologyIcon />, title: "Mental Support", desc: "Support confidence, stress control, emotional regulation, and pre-game focus." },
];

export default function CapabilitiesSection() {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };
  const hoverLift = reduceMotion ? undefined : { y: -8, transition: { duration: 0.2 } };

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="xl">
        <MotionBox variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport} transition={transition}>
          <Stack spacing={1.2} sx={{ mb: 4 }}>
            <Typography color="#0284c7" fontWeight={950} letterSpacing={1.4}>WHAT IT HELPS WITH</Typography>
            <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -0.9, fontSize: { xs: "2rem", md: "3rem" } }}>
              Clean tools for sports performance thinking.
            </Typography>
            <Typography color="#64748b" sx={{ maxWidth: 760, lineHeight: 1.8 }}>
              Built around the core decisions coaches and athletes actually care about: load, recovery, readiness, risk, and practical guidance.
            </Typography>
          </Stack>
        </MotionBox>

        <MotionBox variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
          <Grid container spacing={2.5}>
            {capabilities.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <MotionCard
                  variants={fadeUp}
                  transition={transition}
                  whileHover={hoverLift}
                  elevation={0}
                  sx={{
                    height: "100%", borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                    transition: "border-color 180ms ease, box-shadow 180ms ease",
                    "&:hover": { borderColor: "#bae6fd", boxShadow: "0 22px 55px rgba(15,23,42,0.10)" },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ width: 54, height: 54, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "#f1f5f9", color: "#0f172a", mb: 2, "& svg": { fontSize: 30 } }}>
                      {item.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>{item.title}</Typography>
                    <Typography color="#64748b" lineHeight={1.7}>{item.desc}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>
      </Container>
    </Box>
  );
}
