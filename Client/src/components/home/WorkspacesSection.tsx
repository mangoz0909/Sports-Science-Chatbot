import React from "react";
import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { fadeUp, stagger, viewport } from "./homeAnimations";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const workspaceCards = [
  {
    title: "Daily Athlete Check-In",
    desc: "Log sleep, fatigue, soreness, hydration, recovery, training intensity, and wellness data.",
    icon: <MonitorHeartIcon />,
    to: "/daily-check-in",
    cta: "Open Check-In",
    color: "#ec4899",
  },
  {
    title: "Sports Health AI",
    desc: "Ask about training, recovery, performance, injury prevention, nutrition, stress, focus, and confidence.",
    icon: <PsychologyIcon />,
    to: "/sports",
    cta: "Open AI Coach",
    color: "#38bdf8",
  },
  {
    title: "Sports Match",
    desc: "Find sports that match your interests, movement style, intensity, and athletic profile.",
    icon: <SportsSoccerIcon />,
    to: "/sports-list",
    cta: "Find Sports",
    color: "#f59e0b",
  },
  {
    title: "Athlete Dashboard",
    desc: "Track readiness, recovery, workload, fatigue, sleep, hydration, injury risk, and weekly trends.",
    icon: <AnalyticsIcon />,
    to: "/dashboard",
    cta: "View Dashboard",
    color: "#22c55e",
  },
];

export default function WorkspacesSection() {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
      <Container maxWidth="xl">
        <MotionBox variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport} transition={transition}>
          <Stack spacing={1.2} sx={{ mb: 4 }}>
            <Typography color="#0284c7" fontWeight={950} letterSpacing={1.4}>WORKSPACES</Typography>
            <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -0.9, fontSize: { xs: "2rem", md: "3rem" } }}>
              Move between AI support and analytics.
            </Typography>
          </Stack>
        </MotionBox>

        <MotionBox variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
          <Grid container spacing={2.5}>
            {workspaceCards.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.title}>
                <MotionCard
                  variants={fadeUp}
                  transition={transition}
                  whileHover={reduceMotion ? undefined : { y: -10, transition: { duration: 0.22 } }}
                  elevation={0}
                  sx={{
                    height: "100%", borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff",
                    position: "relative", overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                    transition: "border-color 200ms ease, box-shadow 200ms ease",
                    "&:hover": { borderColor: "#bae6fd", boxShadow: "0 24px 60px rgba(15,23,42,0.10)" },
                    "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: 4, bgcolor: item.color },
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <MotionBox
                      animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      sx={{ width: 62, height: 62, borderRadius: 3.5, bgcolor: "#0f172a", color: item.color, display: "grid", placeItems: "center", mb: 2.5, "& svg": { fontSize: 34 } }}
                    >
                      {item.icon}
                    </MotionBox>
                    <Typography variant="h5" fontWeight={950} sx={{ mb: 1 }}>{item.title}</Typography>
                    <Typography color="#64748b" lineHeight={1.8} sx={{ mb: 3 }}>{item.desc}</Typography>
                    <Button
                      component={RouterLink}
                      to={item.to}
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ borderRadius: 3, fontWeight: 900, color: "#0f172a", borderColor: "#cbd5e1", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" } }}
                    >
                      {item.cta}
                    </Button>
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
