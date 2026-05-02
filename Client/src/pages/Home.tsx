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
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import SpeedIcon from "@mui/icons-material/Speed";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TimelineIcon from "@mui/icons-material/Timeline";

const features = [
  {
    icon: <MonitorHeartIcon />,
    title: "Athlete Load Monitoring",
    desc: "Track training intensity, recovery, fatigue risk, and readiness signals in one interface.",
  },
  {
    icon: <PsychologyIcon />,
    title: "Mental Performance",
    desc: "Support focus, emotional resilience, stress control, and match-day preparation.",
  },
  {
    icon: <AnalyticsIcon />,
    title: "Performance Analytics",
    desc: "Convert raw sport data into useful insights for coaches, players, and analysts.",
  },
  {
    icon: <SportsSoccerIcon />,
    title: "Multi-Sport Assistant",
    desc: "Ask about rules, tactics, drills, injury prevention, and sport-specific training plans.",
  },
];

const metrics = [
  { label: "Readiness", value: 86, color: "#22c55e" },
  { label: "Explosive Power", value: 78, color: "#38bdf8" },
  { label: "Recovery", value: 72, color: "#f59e0b" },
];

const modules = [
  {
    title: "Sports AI Assistant",
    desc: "Ask rules, tactics, training, coaching, and match analysis questions.",
    icon: <SportsCricketIcon />,
    to: "/sports",
    button: "Open Sports AI",
  },
  {
    title: "Mental Health Assistant",
    desc: "Get supportive guidance for anxiety, stress, confidence, and emotional wellbeing.",
    icon: <PsychologyIcon />,
    to: "/mental-health",
    button: "Open MangoMind",
  },
  {
    title: "Performance Dashboard",
    desc: "Review mock athlete analytics, training load, recovery, and performance trends.",
    icon: <TimelineIcon />,
    to: "/dashboard",
    button: "View Dashboard",
  },
];

const Home: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#06111f",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* HERO */}
      <Box
        component="section"
        sx={{
          position: "relative",
          py: { xs: 8, md: 12 },
          background:
            "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.25), transparent 28%), radial-gradient(circle at 85% 10%, rgba(34,197,94,0.18), transparent 30%), linear-gradient(135deg, #06111f 0%, #0f172a 60%, #111827 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="Sports Science AI"
                    sx={{
                      bgcolor: "rgba(56,189,248,0.14)",
                      color: "#7dd3fc",
                      border: "1px solid rgba(125,211,252,0.28)",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    label="Training • Recovery • Analytics"
                    sx={{
                      bgcolor: "rgba(34,197,94,0.12)",
                      color: "#86efac",
                      border: "1px solid rgba(134,239,172,0.25)",
                      fontWeight: 700,
                    }}
                  />
                </Stack>

                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 950,
                    letterSpacing: -1.5,
                    lineHeight: 0.96,
                    fontSize: {
                      xs: "2.7rem",
                      sm: "3.5rem",
                      md: "4.9rem",
                    },
                  }}
                >
                  Train smarter with AI-powered sports science.
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.7,
                    maxWidth: 620,
                  }}
                >
                  A modern athlete intelligence platform for coaching support,
                  performance analytics, sport-specific Q&A, and mental readiness.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ pt: 1 }}
                >
                  <Button
                    component={RouterLink}
                    to="/sports"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: "#38bdf8",
                      color: "#06111f",
                      fontWeight: 900,
                      px: 3,
                      py: 1.3,
                      borderRadius: 3,
                      "&:hover": { bgcolor: "#7dd3fc" },
                    }}
                  >
                    Start Sports AI
                  </Button>

                  <Button
                    component={RouterLink}
                    to="/dashboard"
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    sx={{
                      borderColor: "rgba(255,255,255,0.3)",
                      color: "#fff",
                      fontWeight: 800,
                      px: 3,
                      py: 1.3,
                      borderRadius: 3,
                      "&:hover": {
                        borderColor: "#38bdf8",
                        bgcolor: "rgba(56,189,248,0.08)",
                      },
                    }}
                  >
                    View Analytics
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 5,
                  bgcolor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(18px)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 70% 20%, rgba(34,197,94,0.2), transparent 30%)",
                  }}
                />

                <Box sx={{ position: "relative" }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography fontWeight={900} variant="h5">
                        Athlete Readiness
                      </Typography>
                      <Typography color="rgba(255,255,255,0.6)">
                        Match-day performance model
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 62,
                        height: 62,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "rgba(56,189,248,0.18)",
                        border: "1px solid rgba(125,211,252,0.3)",
                      }}
                    >
                      <FitnessCenterIcon sx={{ color: "#7dd3fc", fontSize: 34 }} />
                    </Box>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <Box
                        sx={{
                          height: 240,
                          borderRadius: 4,
                          bgcolor: "rgba(15,23,42,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          display: "grid",
                          placeItems: "center",
                          position: "relative",
                        }}
                      >
                        <Box
                          sx={{
                            width: 170,
                            height: 170,
                            borderRadius: "50%",
                            background:
                              "conic-gradient(#22c55e 0deg 292deg, rgba(255,255,255,0.12) 292deg 360deg)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 132,
                              height: 132,
                              borderRadius: "50%",
                              bgcolor: "#0f172a",
                              display: "grid",
                              placeItems: "center",
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="h3" fontWeight={950}>
                              86
                            </Typography>
                            <Typography variant="caption" color="rgba(255,255,255,0.6)">
                              READY
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={7}>
                      <Stack spacing={2}>
                        {metrics.map((item) => (
                          <Box key={item.label}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              sx={{ mb: 0.8 }}
                            >
                              <Typography fontWeight={800}>{item.label}</Typography>
                              <Typography color="rgba(255,255,255,0.68)">
                                {item.value}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={item.value}
                              sx={{
                                height: 10,
                                borderRadius: 999,
                                bgcolor: "rgba(255,255,255,0.1)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: item.color,
                                  borderRadius: 999,
                                },
                              }}
                            />
                          </Box>
                        ))}

                        <Box
                          sx={{
                            mt: 1,
                            p: 2,
                            borderRadius: 3,
                            bgcolor: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.2)",
                          }}
                        >
                          <Typography fontWeight={900} color="#86efac">
                            AI Recommendation
                          </Typography>
                          <Typography
                            variant="body2"
                            color="rgba(255,255,255,0.72)"
                            sx={{ mt: 0.5, lineHeight: 1.6 }}
                          >
                            Maintain current intensity. Add mobility work and
                            hydration before high-speed drills.
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FEATURES */}
      <Box component="section" sx={{ py: { xs: 7, md: 10 }, bgcolor: "#f8fafc", color: "#0f172a" }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} textAlign="center" sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: "#0284c7", fontWeight: 900, letterSpacing: 2 }}
            >
              PLATFORM CAPABILITIES
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.8,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Built for coaches, players, and performance teams.
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 720, mx: "auto" }}>
              Combine sport knowledge, recovery support, and performance insights
              in one clean interface.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border: "1px solid #e5e7eb",
                    transition: "0.2s ease",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#e0f2fe",
                        color: "#0284c7",
                        mb: 2,
                        "& svg": { fontSize: 32 },
                      }}
                    >
                      {feature.icon}
                    </Box>

                    <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
                      {feature.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* MODULES */}
      <Box
        component="section"
        sx={{
          py: { xs: 7, md: 10 },
          bgcolor: "#eef6ff",
          color: "#0f172a",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={1.5} textAlign="center" sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: "#16a34a", fontWeight: 900, letterSpacing: 2 }}
            >
              QUICK ACCESS
            </Typography>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.8,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Choose your performance workspace.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {modules.map((module) => (
              <Grid item xs={12} md={4} key={module.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 5,
                    overflow: "hidden",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: 4,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#0f172a",
                        color: "#38bdf8",
                        mb: 3,
                        "& svg": { fontSize: 38 },
                      }}
                    >
                      {module.icon}
                    </Box>

                    <Typography variant="h5" fontWeight={950} sx={{ mb: 1.2 }}>
                      {module.title}
                    </Typography>

                    <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
                      {module.desc}
                    </Typography>

                    <Button
                      component={RouterLink}
                      to={module.to}
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 900,
                        bgcolor: "#0f172a",
                        "&:hover": { bgcolor: "#1e293b" },
                      }}
                    >
                      {module.button}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        component="section"
        sx={{
          py: { xs: 7, md: 10 },
          bgcolor: "#06111f",
          color: "#fff",
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: "center",
              borderRadius: 5,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundImage:
                "radial-gradient(circle at top left, rgba(56,189,248,0.2), transparent 30%), radial-gradient(circle at bottom right, rgba(34,197,94,0.2), transparent 30%)",
            }}
          >
            <SpeedIcon sx={{ fontSize: 56, color: "#38bdf8", mb: 2 }} />

            <Typography
              variant="h3"
              fontWeight={950}
              sx={{ fontSize: { xs: "2rem", md: "3rem" }, mb: 2 }}
            >
              Ready to build your athlete intelligence system?
            </Typography>

            <Typography color="rgba(255,255,255,0.72)" sx={{ mb: 4, lineHeight: 1.8 }}>
              Start with the sports assistant, review performance insights, and
              expand into real athlete data when your backend is ready.
            </Typography>

            <Button
              component={RouterLink}
              to="/auth?mode=signup"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: "#22c55e",
                color: "#06111f",
                fontWeight: 950,
                px: 4,
                py: 1.4,
                borderRadius: 3,
                "&:hover": { bgcolor: "#86efac" },
              }}
            >
              Create Account
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;