import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";

import HotelIcon from "@mui/icons-material/Hotel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { getLatestCheckIn, getLast7CheckIns } from "../services/checkinService";
import { getMyProfile } from "../services/profileService";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = {
  green: "#22c55e",
  blue: "#0284c7",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
};

export default function Dashboard() {
  const [latestCheckIn, setLatestCheckIn] = React.useState<any>(null);
  const [weeklyCheckIns, setWeeklyCheckIns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [snackError, setSnackError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadDashboard() {
      try {
        const [latest, last7, prof] = await Promise.all([
          getLatestCheckIn(),
          getLast7CheckIns(),
          getMyProfile(),
        ]);
        setLatestCheckIn(latest);
        setWeeklyCheckIns(last7);
        setProfile(prof);
      } catch (error: any) {
        setSnackError(error?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

const userProfile = {
  name: profile?.name || "Athlete",
  sport: profile?.primary_sport || "Sport",
  readiness: latestCheckIn?.readiness_score ?? 0,
  recovery: latestCheckIn?.recovery_score ?? 0,
  load: latestCheckIn?.training_intensity ? latestCheckIn.training_intensity * 10 : 0,
  sleep: latestCheckIn?.sleep_hours ?? 0,
  sleepQuality: latestCheckIn?.sleep_quality ? latestCheckIn.sleep_quality * 10 : 0,
  fatigue: latestCheckIn?.fatigue ? latestCheckIn.fatigue * 10 : 0,
  injuryRisk: latestCheckIn?.injury_risk ?? 0,
  hydration: latestCheckIn?.hydration ?? 0,
  hydrationGoal: 10,
};

const weeklyData = weeklyCheckIns.map((item) => ({
  day: new Date(item.created_at).toLocaleDateString("en-US", {
    weekday: "short",
  }),
  readiness: item.readiness_score ?? 0,
  recovery: item.recovery_score ?? 0,
  load: item.training_intensity ? item.training_intensity * 10 : 0,
  sleep: item.sleep_hours ?? 0,
  fatigue: item.fatigue ? item.fatigue * 10 : 0,
}));

if (loading) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Typography fontWeight={950}>Loading dashboard...</Typography>
    </Box>
  );
}




function riskColor(value: number) {
  if (value < 35) return colors.green;
  if (value < 65) return colors.amber;
  return colors.red;
}

function getAIRecommendation(userProfile: any) {
  if (userProfile.injuryRisk >= 60) {
    return "Your injury risk is high. Reduce high-intensity training and focus on mobility, hydration, and sleep.";
  }

  if (userProfile.sleep < 7) {
    return "Your sleep is slightly low. Avoid increasing training load until your sleep improves.";
  }

  if (userProfile.fatigue >= 60) {
    return "Your fatigue level is elevated. Today should be a low-intensity recovery day.";
  }

  if (userProfile.load > 80 && userProfile.recovery < 70) {
    return "Your training load is high compared to your recovery. Reduce sprint work and add recovery time.";
  }

  return "You are in a stable training zone. Continue normal practice, but keep monitoring sleep and hydration.";
}
  const kpis = [
    {
      label: "My Readiness",
      value: `${userProfile.readiness}%`,
      icon: <MonitorHeartIcon />,
      color: colors.green,
      progress: userProfile.readiness,
    },
    {
      label: "Training Load",
      value: `${userProfile.load}`,
      icon: <FitnessCenterIcon />,
      color: colors.blue,
      progress: userProfile.load,
    },
    {
      label: "Fatigue",
      value: `${userProfile.fatigue}%`,
      icon: <LocalFireDepartmentIcon />,
      color: colors.amber,
      progress: userProfile.fatigue,
    },
    {
      label: "Injury Risk",
      value: `${userProfile.injuryRisk}%`,
      icon: <WarningAmberIcon />,
      color: riskColor(userProfile.injuryRisk),
      progress: userProfile.injuryRisk,
    },
    {
      label: "Sleep Score",
      value: `${userProfile.sleepQuality}%`,
      icon: <HotelIcon />,
      color: colors.purple,
      progress: userProfile.sleepQuality,
    },
    {
      label: "Hydration",
      value: `${userProfile.hydration}/${userProfile.hydrationGoal}L`,
      icon: <WaterDropIcon />,
      color: colors.cyan,
      progress: Math.round((userProfile.hydration / userProfile.hydrationGoal) * 100),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Snackbar
        open={!!snackError}
        autoHideDuration={6000}
        onClose={() => setSnackError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setSnackError(null)}>
          {snackError}
        </Alert>
      </Snackbar>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Chip
            label="Personal Sports Health Dashboard"
            sx={{
              width: "fit-content",
              bgcolor: "#e0f2fe",
              color: "#0369a1",
              fontWeight: 950,
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              letterSpacing: -0.8,
              color: "#0f172a",
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            Welcome back, {userProfile.name}
          </Typography>

          <Typography color="#64748b">
            Your personal dashboard for {userProfile.sport} training, recovery, sleep, nutrition, and injury prevention.
          </Typography>
        </Stack>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {kpis.map((item) => (
            <Grid item xs={6} sm={4} md={4} lg={2} key={item.label}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  bgcolor: "#fff",
                  border: "1px solid #e2e8f0",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography color="#64748b" fontWeight={850} fontSize={14}>
                        {item.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={950} sx={{ mt: 0.5 }}>
                        {item.value}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: `${item.color}18`,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{
                      mt: 2,
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: item.color,
                        borderRadius: 999,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ height: "100%", minHeight: 460, borderRadius: 4, border: "1px solid #e2e8f0" }}>              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  My Weekly Readiness Trend
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Readiness, recovery, fatigue, and training load over the week.
                </Typography>

                <ResponsiveContainer width="100%" height="82%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[0, 110]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="readiness" stroke={colors.green} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="recovery" stroke={colors.purple} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="load" stroke={colors.blue} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="fatigue" stroke={colors.amber} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
          <Card elevation={0} sx={{ height: "100%", minHeight: 460, borderRadius: 4, border: "1px solid #e2e8f0" }}>              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PsychologyIcon sx={{ color: colors.blue }} />
                  <Typography variant="h6" fontWeight={950}>
                    My AI Coach
                  </Typography>
                </Stack>

                <Box sx={{ mt: 2, p: "14px 16px", borderRadius: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", position: "relative", overflow: "hidden" }}>
                  <Box sx={{ position: "absolute", top: 0, left: 0, width: 4, bottom: 0, bgcolor: "#2563eb", borderRadius: "4px 0 0 4px" }} />
                  <Box sx={{ pl: "8px" }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography fontSize={11} fontWeight={800} letterSpacing="0.08em" textTransform="uppercase" color="#2563eb">
                        AI Recommendation
                      </Typography>
                    </Stack>
                    <Typography color="#1e3a5f" fontSize={14} lineHeight={1.8}>
                      {getAIRecommendation(userProfile)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Typography fontWeight={950}>Today’s Focus</Typography>
                  <Typography color="#475569" fontSize={14} lineHeight={1.75} sx={{ mt: 1 }}>
                    Keep today balanced: tennis skill work, hydration, and at least 8 hours of sleep tonight.
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <Typography fontWeight={950} color="#c2410c">
                    Fatigue Detection
                  </Typography>
                  <Typography color="#475569" fontSize={14} lineHeight={1.75} sx={{ mt: 1 }}>
                    Current fatigue is {userProfile.fatigue}%. You are not overloaded, but avoid stacking too many high-intensity sessions.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: 350, borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  My Sleep Trend
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Sleep duration across the week.
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <AreaChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[4, 10]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sleep"
                      stroke={colors.purple}
                      strokeWidth={3}
                      fill={colors.purple}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: 350, borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  My Training Load
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Daily training load for this week.
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="load" fill={colors.blue} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid #bfdbfe",
                bgcolor: "#eff6ff",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "#dbeafe", display: "grid", placeItems: "center", color: "#1d4ed8" }}>
                    <FitnessCenterIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={950} color="#1e3a5f">My Workout Plan</Typography>
                    <Typography fontSize={13} color="#3b82f6">AI-personalised for {userProfile.sport}</Typography>
                  </Box>
                </Stack>
                <Typography color="#1e40af" fontSize={14} lineHeight={1.8}>
                  Get a full AI-generated weekly training plan tailored to your sport, fitness level, fatigue, and recovery data.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/health/workout"
                  variant="contained"
                  sx={{ mt: 2.5, borderRadius: 3, bgcolor: "#1d4ed8", fontWeight: 800, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: "#1e40af", boxShadow: "none" } }}
                >
                  View Workout Plan →
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid #bbf7d0",
                bgcolor: "#ecfdf5",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "#d1fae5", display: "grid", placeItems: "center", color: "#047857" }}>
                    <RestaurantMenuIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={950} color="#064e3b">My Nutrition Plan</Typography>
                    <Typography fontSize={13} color="#10b981">AI-personalised for your goals</Typography>
                  </Box>
                </Stack>
                <Typography color="#065f46" fontSize={14} lineHeight={1.8}>
                  Get an AI-generated nutrition plan with calorie targets, macros, hydration, and meal timing tailored to your training.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/health/nutrition"
                  variant="contained"
                  sx={{ mt: 2.5, borderRadius: 3, bgcolor: "#047857", fontWeight: 800, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: "#065f46", boxShadow: "none" } }}
                >
                  View Nutrition Plan →
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  My Training Heatmap
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Green = light/recovery, yellow = moderate, red = high load.
                </Typography>

                <Grid container spacing={1}>
                  {weeklyData.map((item) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={item.day}>
                      <Box
                        sx={{
                          height: 72,
                          borderRadius: 3,
                          bgcolor: riskColor(item.load),
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          textAlign: "center",
                          fontWeight: 950,
                        }}
                      >
                        <Box>
                          <Typography fontWeight={950}>{item.day}</Typography>
                          <Typography fontSize={13}>{item.load}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}