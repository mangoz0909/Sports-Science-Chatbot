import React from "react";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { fadeUp, stagger, viewport } from "./homeAnimations";

const MotionBox = motion(Box);

const items = [
  { icon: <TimelineIcon />, title: "Load trends", desc: "Spot rising workload before it becomes a problem." },
  { icon: <TrendingUpIcon />, title: "Progress clarity", desc: "Show performance changes without messy dashboards." },
  { icon: <MonitorHeartIcon />, title: "Recovery signals", desc: "Keep readiness visible before training decisions." },
];

export default function PerformanceStrip() {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 7 }, bgcolor: "#0f172a", color: "#fff", position: "relative", overflow: "hidden" }}>
      {!reduceMotion && (
        <MotionBox
          aria-hidden
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          sx={{
            position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
            background: "linear-gradient(105deg, transparent 40%, rgba(56,189,248,0.04) 50%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}
      <Container maxWidth="xl">
        <MotionBox variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
          <Grid container spacing={2.5}>
            {items.map((item) => (
              <Grid item xs={12} md={4} key={item.title}>
                <MotionBox
                  variants={fadeUp}
                  transition={transition}
                  whileHover={reduceMotion ? undefined : { y: -8, scale: 1.015, transition: { duration: 0.2 } }}
                  sx={{
                    p: 3, height: "100%", borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                    transition: "background-color 200ms ease, border-color 200ms ease",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)", borderColor: "rgba(56,189,248,0.3)" },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: "#38bdf8", color: "#0f172a", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={950}>{item.title}</Typography>
                      <Typography color="#cbd5e1" lineHeight={1.7} sx={{ mt: 0.5 }}>{item.desc}</Typography>
                    </Box>
                  </Stack>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </MotionBox>
      </Container>
    </Box>
  );
}
