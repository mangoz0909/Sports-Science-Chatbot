import React from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { viewport } from "./homeAnimations";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

export default function FinalCtaSection() {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <MotionPaper
          elevation={0}
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={viewport}
          transition={transition}
          sx={{
            p: { xs: 3.5, md: 6 }, borderRadius: 5, bgcolor: "#0f172a", color: "#fff",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}
        >
          <Box sx={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", bgcolor: "rgba(56,189,248,0.16)", top: -120, left: -90 }} />
          <Box sx={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", bgcolor: "rgba(34,197,94,0.12)", right: -90, bottom: -100 }} />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <MotionBox
              animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              sx={{ display: "inline-block", position: "relative", mb: 2 }}
            >
              {!reduceMotion && (
                <MotionBox
                  animate={{ scale: [1, 1.55, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
                  sx={{ position: "absolute", inset: -14, borderRadius: "50%", border: "2px solid rgba(56,189,248,0.45)", pointerEvents: "none" }}
                />
              )}
              <SportsSoccerIcon sx={{ fontSize: 54, color: "#38bdf8", display: "block" }} />
            </MotionBox>

            <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -0.8, fontSize: { xs: "2rem", md: "3rem" }, mb: 1.5 }}>
              Build a sharper sports science experience.
            </Typography>
            <Typography sx={{ color: "#cbd5e1", maxWidth: 720, mx: "auto", lineHeight: 1.8, mb: 3.5 }}>
              Use the assistant pages for Q&A, the dashboard for performance visualization, and the auth page for user access.
            </Typography>
            <Button
              component={RouterLink}
              to="/auth?mode=signup"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: "#38bdf8", color: "#0f172a", borderRadius: 3, fontWeight: 950, px: 3.5, py: 1.35, boxShadow: "none",
                "&:hover": { bgcolor: "#7dd3fc", boxShadow: "0 18px 42px rgba(56,189,248,0.22)" },
              }}
            >
              Create Account
            </Button>
          </Box>
        </MotionPaper>
      </Container>
    </Box>
  );
}
