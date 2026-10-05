import React from "react";
import { Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { color, focusRing, font, motion, type } from "./landingTokens";
import { Frame, Reveal, SectionHead } from "./LandingPrimitives";

const workspaces = [
  { title: "Daily Athlete Check-In", desc: "Log sleep, fatigue, soreness, hydration, recovery, training intensity, and wellness data.", to: "/daily-check-in" },
  { title: "Sports Health AI", desc: "Ask about training, recovery, performance, injury prevention, nutrition, stress, focus, and confidence.", to: "/sports" },
  { title: "Athlete Dashboard", desc: "Track readiness, recovery, workload, fatigue, sleep, hydration, injury risk, and weekly trends.", to: "/dashboard" },
  { title: "My Workout Plan", desc: "Build your own workouts, record sets, reps, and weights, and get progression suggestions for your next session.", to: "/my-workout-plan" },
  { title: "AI Workout Planner", desc: "Generate training plans based on your sport, goals, schedule, and athlete profile.", to: "/health/workout" },
  { title: "Sports Match", desc: "Find sports that match your interests, movement style, intensity, and athletic profile.", to: "/sports-list" },
  { title: "Nutrition Planner", desc: "Get nutrition guidance based on your sport, goals, dietary needs, and training demands.", to: "/health/nutrition" },
];

/**
 * An index of the app, one row per workspace — the whole row is the link.
 * Replaces seven identical cards with coloured top bars and bobbing icons.
 */
export default function WorkspacesSection() {
  return (
    <Box component="section" aria-labelledby="workspaces-title" sx={{ py: { xs: 8, md: 12 } }}>
      <Frame>
        <Reveal>
          <SectionHead index="02" title="Everything in the app" id="workspaces-title">
            Move between AI support and analytics. Each one is a page you can open now.
          </SectionHead>
        </Reveal>

        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, borderBottom: `1px solid ${color.rule}` }}>
          {workspaces.map((item) => (
            <Box component="li" key={item.to} sx={{ borderTop: `1px solid ${color.rule}` }}>
              <Box
                component={RouterLink}
                to={item.to}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr auto", md: "16rem 1fr 11rem auto" },
                  columnGap: 4,
                  rowGap: 0.5,
                  alignItems: "baseline",
                  py: 2.5,
                  px: { xs: 0, md: 1.5 },
                  mx: { md: -1.5 },
                  color: color.ink,
                  textDecoration: "none",
                  transition: `background-color ${motion.fast}s ease`,
                  "&:hover": { bgcolor: color.wash },
                  "&:hover .arrow": { color: color.accent },
                  "&:focus-visible": { outline: "none", boxShadow: focusRing },
                }}
              >
                <Box component="h3" sx={{ ...type.h3, fontSize: "1.125rem", m: 0 }}>{item.title}</Box>
                <Box component="p" sx={{ ...type.body, m: 0, color: color.ink2, gridColumn: { xs: "1 / -1", md: "auto" }, gridRow: { xs: 2, md: "auto" } }}>
                  {item.desc}
                </Box>
                <Box sx={{ ...type.label, color: color.ink3, display: { xs: "none", md: "block" } }}>{item.to}</Box>
                <Box className="arrow" aria-hidden sx={{ fontFamily: font.mono, color: color.ink3, transition: `color ${motion.fast}s ease` }}>→</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Frame>
    </Box>
  );
}
