import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import AnalyticsIcon from "@mui/icons-material/Analytics";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import SpeedIcon from "@mui/icons-material/Speed";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const capabilities = [
  {
    icon: <MonitorHeartIcon />,
    title: "Readiness Monitoring",
    desc: "Track recovery, soreness, sleep quality, fatigue, and match readiness in a readable way.",
  },
  {
    icon: <FitnessCenterIcon />,
    title: "Training Load",
    desc: "Understand workload spikes, high-intensity exposure, and session balance.",
  },
  {
    icon: <SpeedIcon />,
    title: "Performance Output",
    desc: "Review sprint speed, endurance trends, power output, and movement quality.",
  },
  {
    icon: <PsychologyIcon />,
    title: "Mental Support",
    desc: "Support confidence, stress control, emotional regulation, and pre-game focus.",
  },
];

const workspaceCards = [
  {
    title: "Daily Athlete Check-In",
    desc: "Log your daily sleep, fatigue, soreness, hydration, recovery, training intensity, and wellness data.",
    icon: <MonitorHeartIcon />,
    to: "/daily-check-in",
    cta: "Open Check-In",
    color: "#ec4899",
  },
  {
    title: "Sports AI Assistant",
    desc: "Ask about rules, tactics, drills, coaching cues, match strategy, and sports science.",
    icon: <SportsCricketIcon />,
    to: "/sports",
    cta: "Open Sports AI",
    color: "#38bdf8",
  },
  {
    title: "Mental Health Assistant",
    desc: "Get supportive guidance around stress, anxiety, confidence, and emotional wellbeing.",
    icon: <PsychologyIcon />,
    to: "/mental-health",
    cta: "Open MangoMind",
    color: "#8b5cf6",
  },
  {
    title: "Sports Matching Engine",
    desc: "Search one sport and discover similar sports based on movement, equipment, intensity, and sport science profile.",
    icon: <SportsSoccerIcon />,
    to: "/sports-list",
    cta: "Find Sports",
    color: "#f59e0b",
  },
  {
    title: "Athlete Dashboard",
    desc: "Explore performance, recovery, workload, injury risk, and team readiness visuals.",
    icon: <AnalyticsIcon />,
    to: "/dashboard",
    cta: "View Dashboard",
    color: "#22c55e",
  },
];

const metrics = [
  { label: "Recovery", value: 78, color: "#22c55e" },
  { label: "Training Load", value: 69, color: "#0284c7" },
  { label: "Focus", value: 88, color: "#8b5cf6" },
];

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const viewport = {
  once: true,
  amount: 0.18,
};

const Home: React.FC = () => {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const transition = reduceMotion
    ? { duration: 0 }
    : {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as const,
      };

  const hoverLift = reduceMotion
    ? undefined
    : {
        y: -8,
        transition: { duration: 0.2 },
      };

  return (
    <Box
      sx={{
        bgcolor: "#f8fafc",
        color: "#0f172a",
        overflow: "hidden",
      }}
    >
      {/* HERO */}
      <Box
        component="section"
        sx={{
          position: "relative",
          py: { xs: 7, md: 10, lg: 12 },
          borderBottom: "1px solid #e2e8f0",
          background:
            "radial-gradient(circle at 10% 10%, rgba(14,165,233,0.11), transparent 30%), radial-gradient(circle at 90% 20%, rgba(34,197,94,0.08), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 5, md: 7 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <MotionBox
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <Stack spacing={3}>
                  <MotionBox variants={fadeUp} transition={transition}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label="Sports Science AI Platform"
                        sx={{
                          width: "fit-content",
                          bgcolor: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: 900,
                          borderRadius: 999,
                        }}
                      />

                      <Chip
                        label="Training • Recovery • Readiness"
                        sx={{
                          width: "fit-content",
                          bgcolor: "#ecfdf5",
                          color: "#047857",
                          fontWeight: 900,
                          borderRadius: 999,
                        }}
                      />
                    </Stack>
                  </MotionBox>

                  <MotionBox variants={fadeUp} transition={transition}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontWeight: 950,
                        letterSpacing: { xs: -1.1, md: -1.8 },
                        lineHeight: 0.98,
                        color: "#0f172a",
                        fontSize: {
                          xs: "2.55rem",
                          sm: "3.45rem",
                          md: "4.7rem",
                          lg: "5.25rem",
                        },
                      }}
                    >
                      Make athlete decisions easier to understand.
                    </Typography>
                  </MotionBox>

                  <MotionBox variants={fadeUp} transition={transition}>
                    <Typography
                      sx={{
                        color: "#475569",
                        lineHeight: 1.85,
                        maxWidth: 660,
                        fontSize: { xs: "1rem", md: "1.1rem" },
                      }}
                    >
                      SportLab AI helps athletes, coaches, and students explore
                      training load, recovery, readiness, sport matching, sports rules,
                      and mental performance through a clean AI-powered interface.
                    </Typography>
                  </MotionBox>

                  <MotionBox variants={fadeUp} transition={transition}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
                      <Button
                        component={RouterLink}
                        to="/sports"
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderRadius: 3,
                          bgcolor: "#0f172a",
                          fontWeight: 900,
                          px: 3,
                          py: 1.35,
                          boxShadow: "0 12px 30px rgba(15,23,42,0.16)",
                          transition:
                            "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
                          "&:hover": {
                            bgcolor: "#1e293b",
                            transform: "translateY(-2px)",
                            boxShadow: "0 18px 40px rgba(15,23,42,0.22)",
                          },
                        }}
                      >
                        Open Sports AI
                      </Button>

                      <Button
                        component={RouterLink}
                        to="/dashboard"
                        variant="outlined"
                        size="large"
                        sx={{
                          borderRadius: 3,
                          borderColor: "#cbd5e1",
                          color: "#0f172a",
                          fontWeight: 900,
                          px: 3,
                          py: 1.35,
                          transition:
                            "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "#94a3b8",
                            bgcolor: "#f1f5f9",
                          },
                        }}
                      >
                        View Dashboard
                      </Button>
                    </Stack>
                  </MotionBox>

                  <MotionBox variants={fadeUp} transition={transition}>
                    <Grid container spacing={1.5} sx={{ pt: 2 }}>
                      {[
                        { label: "Readiness", value: "84%" },
                        { label: "Risk Alerts", value: "Live" },
                        { label: "AI Guidance", value: "24/7" },
                      ].map((item) => (
                        <Grid item xs={4} key={item.label}>
                          <MotionBox
                            whileHover={hoverLift}
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              borderRadius: 3,
                              bgcolor: "#fff",
                              border: "1px solid #e2e8f0",
                              textAlign: "center",
                              boxShadow: "0 10px 28px rgba(15,23,42,0.04)",
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 950,
                                color: "#0f172a",
                                fontSize: { xs: "1.1rem", sm: "1.4rem" },
                              }}
                            >
                              {item.value}
                            </Typography>
                            <Typography
                              sx={{
                                color: "#64748b",
                                fontSize: { xs: 12, sm: 13 },
                                fontWeight: 800,
                              }}
                            >
                              {item.label}
                            </Typography>
                          </MotionBox>
                        </Grid>
                      ))}
                    </Grid>
                  </MotionBox>
                </Stack>
              </MotionBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={transition}
                sx={{ position: "relative" }}
              >
                
                <MotionPaper
                  elevation={0}
                  whileHover={reduceMotion || isMobile ? undefined : { y: -5 }}
                  transition={{ duration: 0.22 }}
                  sx={{
                    position: "relative",
                    borderRadius: { xs: 4, md: 5 },
                    p: { xs: 2.25, sm: 2.75, md: 3 },
                    bgcolor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
                    overflow: "hidden",
                  }}
                >
                  <MotionBox
                    aria-hidden
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            x: ["-100%", "100%"],
                          }
                    }
                    transition={{
                      duration: 4.4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: 3,
                      background:
                        "linear-gradient(90deg, transparent, #38bdf8, #22c55e, transparent)",
                    }}
                  />

                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1.5}
                    >
                      <Box>
                        <Typography variant="h5" fontWeight={950}>
                          Athlete Snapshot
                        </Typography>
                        <Typography color="#64748b">
                          Today’s performance readiness
                        </Typography>
                      </Box>

                      <MotionBox
                        animate={
                          reduceMotion
                            ? undefined
                            : {
                                boxShadow: [
                                  "0 0 0 0 rgba(56,189,248,0.32)",
                                  "0 0 0 18px rgba(56,189,248,0)",
                                  "0 0 0 0 rgba(56,189,248,0)",
                                ],
                              }
                        }
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "14px",
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "#e0f2fe",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          component="img"
                          src="/sportslab_logo.png"
                          alt="SportLab AI"
                          sx={{ width: 44, height: 44, objectFit: "contain" }}
                        />
                      </MotionBox>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={5}>
                        <Box
                          sx={{
                            height: { xs: 210, sm: 230 },
                            borderRadius: 4,
                            bgcolor: "#0f172a",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            position: "relative",
                            overflow: "hidden",
                            background:
                              "radial-gradient(circle at 30% 20%, rgba(56,189,248,0.20), transparent 34%), #0f172a",
                          }}
                        >
                          <MotionBox
                            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                            transition={{ duration: 0.25 }}
                            sx={{
                              position: "relative",
                              zIndex: 1,
                              width: 154,
                              height: 154,
                              borderRadius: "50%",
                              background:
                                "conic-gradient(#22c55e 0deg 302deg, #334155 302deg 360deg)",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                width: 118,
                                height: 118,
                                borderRadius: "50%",
                                bgcolor: "#0f172a",
                                display: "grid",
                                placeItems: "center",
                                textAlign: "center",
                              }}
                            >
                              <Box>
                                <Typography variant="h3" fontWeight={950}>
                                  84
                                </Typography>
                                <Typography fontSize={12} color="#94a3b8" fontWeight={900}>
                                  READY
                                </Typography>
                              </Box>
                            </Box>
                          </MotionBox>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={7}>
                        <Stack spacing={2}>
                          {metrics.map((metric, index) => (
                            <MotionBox
                              key={metric.label}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                ...transition,
                                delay: reduceMotion ? 0 : 0.45 + index * 0.1,
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                                <Typography fontWeight={900}>{metric.label}</Typography>
                                <Typography color="#64748b" fontWeight={800}>
                                  {metric.value}%
                                </Typography>
                              </Stack>

                              <LinearProgress
                                variant="determinate"
                                value={metric.value}
                                sx={{
                                  height: 10,
                                  borderRadius: 999,
                                  bgcolor: "#e2e8f0",
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: metric.color,
                                    borderRadius: 999,
                                    transition: "transform 900ms ease",
                                  },
                                }}
                              />
                            </MotionBox>
                          ))}

                          <MotionBox
                            whileHover={hoverLift}
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              bgcolor: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <Typography color="#166534" fontWeight={950}>
                              AI Coach Note
                            </Typography>
                            <Typography
                              color="#475569"
                              fontSize={14}
                              lineHeight={1.7}
                              sx={{ mt: 0.5 }}
                            >
                              Maintain normal load. Add mobility and hydration
                              before high-intensity sprint work.
                            </Typography>
                          </MotionBox>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Stack>
                </MotionPaper>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CAPABILITIES */}
      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="xl">
          <MotionBox
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={transition}
          >
            <Stack spacing={1.2} sx={{ mb: 4 }}>
              <Typography color="#0284c7" fontWeight={950} letterSpacing={1.4}>
                WHAT IT HELPS WITH
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  letterSpacing: -0.9,
                  fontSize: { xs: "2rem", md: "3rem" },
                }}
              >
                Clean tools for sports performance thinking.
              </Typography>

              <Typography color="#64748b" sx={{ maxWidth: 760, lineHeight: 1.8 }}>
                Built around the core decisions coaches and athletes actually care
                about: load, recovery, readiness, risk, and practical guidance.
              </Typography>
            </Stack>
          </MotionBox>

          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <Grid container spacing={2.5}>
              {capabilities.map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.title}>
                  <MotionCard
                    variants={fadeUp}
                    transition={transition}
                    whileHover={hoverLift}
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#fff",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                      transition: "border-color 180ms ease, box-shadow 180ms ease",
                      "&:hover": {
                        borderColor: "#bae6fd",
                        boxShadow: "0 22px 55px rgba(15,23,42,0.10)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: 3,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "#f1f5f9",
                          color: "#0f172a",
                          mb: 2,
                          "& svg": { fontSize: 30 },
                        }}
                      >
                        {item.icon}
                      </Box>

                      <Typography variant="h6" fontWeight={950} sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>

                      <Typography color="#64748b" lineHeight={1.7}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionBox>
        </Container>
      </Box>

      {/* PERFORMANCE STRIP */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, md: 7 },
          bgcolor: "#0f172a",
          color: "#fff",
        }}
      >
        <Container maxWidth="xl">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <Grid container spacing={2.5}>
              {[
                {
                  icon: <TimelineIcon />,
                  title: "Load trends",
                  desc: "Spot rising workload before it becomes a problem.",
                },
                {
                  icon: <TrendingUpIcon />,
                  title: "Progress clarity",
                  desc: "Show performance changes without messy dashboards.",
                },
                {
                  icon: <MonitorHeartIcon />,
                  title: "Recovery signals",
                  desc: "Keep readiness visible before training decisions.",
                },
              ].map((item) => (
                <Grid item xs={12} md={4} key={item.title}>
                  <MotionBox
                    variants={fadeUp}
                    transition={transition}
                    whileHover={hoverLift}
                    sx={{
                      p: 3,
                      height: "100%",
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: "#38bdf8",
                          color: "#0f172a",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </Box>

                      <Box>
                        <Typography variant="h6" fontWeight={950}>
                          {item.title}
                        </Typography>
                        <Typography color="#cbd5e1" lineHeight={1.7} sx={{ mt: 0.5 }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  </MotionBox>
                </Grid>
              ))}
            </Grid>
          </MotionBox>
        </Container>
      </Box>

      {/* WORKSPACES */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 9 },
          bgcolor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <Container maxWidth="xl">
          <MotionBox
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={transition}
          >
            <Stack spacing={1.2} sx={{ mb: 4 }}>
              <Typography color="#0284c7" fontWeight={950} letterSpacing={1.4}>
                WORKSPACES
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  letterSpacing: -0.9,
                  fontSize: { xs: "2rem", md: "3rem" },
                }}
              >
                Move between AI support and analytics.
              </Typography>
            </Stack>
          </MotionBox>

          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <Grid container spacing={2.5}>
              {workspaceCards.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.title}>
                  <MotionCard
                    variants={fadeUp}
                    transition={transition}
                    whileHover={hoverLift}
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#fff",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                      "&:hover": {
                        borderColor: "#bae6fd",
                        boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        bgcolor: item.color,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3.5 }}>
                      <Box
                        sx={{
                          width: 62,
                          height: 62,
                          borderRadius: 3.5,
                          bgcolor: "#0f172a",
                          color: item.color,
                          display: "grid",
                          placeItems: "center",
                          mb: 2.5,
                          "& svg": { fontSize: 34 },
                        }}
                      >
                        {item.icon}
                      </Box>

                      <Typography variant="h5" fontWeight={950} sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>

                      <Typography color="#64748b" lineHeight={1.8} sx={{ mb: 3 }}>
                        {item.desc}
                      </Typography>

                      <Button
                        component={RouterLink}
                        to={item.to}
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderRadius: 3,
                          fontWeight: 900,
                          color: "#0f172a",
                          borderColor: "#cbd5e1",
                          "&:hover": {
                            borderColor: "#94a3b8",
                            bgcolor: "#f8fafc",
                          },
                        }}
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

      {/* FINAL CTA */}
      <Box component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <MotionPaper
            elevation={0}
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewport}
            transition={transition}
            sx={{
              p: { xs: 3.5, md: 6 },
              borderRadius: 5,
              bgcolor: "#0f172a",
              color: "#fff",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                bgcolor: "rgba(56,189,248,0.16)",
                top: -120,
                left: -90,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 240,
                height: 240,
                borderRadius: "50%",
                bgcolor: "rgba(34,197,94,0.12)",
                right: -90,
                bottom: -100,
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <MotionBox
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, -10, 0],
                      }
                }
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <SportsSoccerIcon
                  sx={{
                    fontSize: 54,
                    color: "#38bdf8",
                    mb: 2,
                  }}
                />
              </MotionBox>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  letterSpacing: -0.8,
                  fontSize: { xs: "2rem", md: "3rem" },
                  mb: 1.5,
                }}
              >
                Build a sharper sports science experience.
              </Typography>

              <Typography
                sx={{
                  color: "#cbd5e1",
                  maxWidth: 720,
                  mx: "auto",
                  lineHeight: 1.8,
                  mb: 3.5,
                }}
              >
                Use the assistant pages for Q&A, the dashboard for performance
                visualization, and the auth page for user access.
              </Typography>

              <Button
                component={RouterLink}
                to="/auth?mode=signup"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: "#38bdf8",
                  color: "#0f172a",
                  borderRadius: 3,
                  fontWeight: 950,
                  px: 3.5,
                  py: 1.35,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#7dd3fc",
                    boxShadow: "0 18px 42px rgba(56,189,248,0.22)",
                  },
                }}
              >
                Create Account
              </Button>
            </Box>
          </MotionPaper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;