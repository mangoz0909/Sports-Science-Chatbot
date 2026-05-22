import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HotelIcon from "@mui/icons-material/Hotel";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

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

const userProfile = {
  name: "Mango",
  sport: "Tennis",
  readiness: 82,
  recovery: 76,
  load: 68,
  sleep: 7.2,
  sleepQuality: 81,
  fatigue: 36,
  injuryRisk: 24,
  calories: 2900,
  protein: 145,
  hydration: 3.4,
  hydrationGoal: 4.0,
};

const weeklyData = [
  { day: "Mon", readiness: 78, recovery: 72, load: 64, sleep: 7.1, fatigue: 42 },
  { day: "Tue", readiness: 81, recovery: 75, load: 68, sleep: 7.3, fatigue: 38 },
  { day: "Wed", readiness: 74, recovery: 67, load: 82, sleep: 6.5, fatigue: 55 },
  { day: "Thu", readiness: 84, recovery: 79, load: 70, sleep: 7.6, fatigue: 34 },
  { day: "Fri", readiness: 88, recovery: 82, load: 74, sleep: 8.0, fatigue: 29 },
  { day: "Sat", readiness: 80, recovery: 76, load: 77, sleep: 7.4, fatigue: 41 },
  { day: "Sun", readiness: 86, recovery: 84, load: 52, sleep: 8.2, fatigue: 25 },
];

const trainingPlan = [
  { day: "Monday", plan: "Tennis footwork + light strength", intensity: "Medium" },
  { day: "Tuesday", plan: "Skill practice and serve accuracy", intensity: "Medium" },
  { day: "Wednesday", plan: "Recovery mobility + stretching", intensity: "Low" },
  { day: "Thursday", plan: "Speed and reaction drills", intensity: "High" },
  { day: "Friday", plan: "Match simulation", intensity: "High" },
  { day: "Saturday", plan: "Light cardio + flexibility", intensity: "Low" },
  { day: "Sunday", plan: "Rest and sleep recovery", intensity: "Recovery" },
];

const dietPlan = [
  { item: "Calories", target: `${userProfile.calories} kcal/day` },
  { item: "Protein", target: `${userProfile.protein}g/day` },
  { item: "Hydration", target: `${userProfile.hydrationGoal}L/day` },
  { item: "Pre-workout", target: "Banana + water + light carbs" },
  { item: "Post-workout", target: "Protein + carbs within 60 minutes" },
];

function riskColor(value: number) {
  if (value < 35) return colors.green;
  if (value < 65) return colors.amber;
  return colors.red;
}

function getAIRecommendation() {
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

export default function Dashboard() {
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
            <Grid item xs={12} sm={6} md={4} lg={2} key={item.label}>
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
          <Card elevation={0} sx={{ height: "100%", minHeight: 460, borderRadius: 4, border: "1px solid #e2e8f0" }}>              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PsychologyIcon sx={{ color: colors.blue }} />
                  <Typography variant="h6" fontWeight={950}>
                    My AI Coach
                  </Typography>
                </Stack>

                <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <Typography fontWeight={950} color="#1d4ed8">
                    Recommendation
                  </Typography>
                  <Typography color="#475569" fontSize={14} lineHeight={1.75} sx={{ mt: 1 }}>
                    {getAIRecommendation()}
                  </Typography>
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

          <Grid item xs={12} lg={7}>
            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  My Weekly Training Plan
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  A balanced plan based on tennis performance, fatigue, and recovery.
                </Typography>

                <Stack spacing={1.3}>
                  {trainingPlan.map((item) => (
                    <Box
                      key={item.day}
                      sx={{
                        p: 1.7,
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography fontWeight={950}>{item.day}</Typography>
                          <Typography color="#475569" fontSize={14}>
                            {item.plan}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.intensity}
                          size="small"
                          sx={{
                            bgcolor:
                              item.intensity === "High"
                                ? "#fee2e2"
                                : item.intensity === "Medium"
                                ? "#fef3c7"
                                : "#dcfce7",
                            color:
                              item.intensity === "High"
                                ? "#991b1b"
                                : item.intensity === "Medium"
                                ? "#92400e"
                                : "#166534",
                            fontWeight: 900,
                          }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  My Diet Plan
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Nutrition targets for training and recovery.
                </Typography>

                <Stack spacing={1.4}>
                  {dietPlan.map((item) => (
                    <Box
                      key={item.item}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Typography fontWeight={950}>{item.item}</Typography>
                      <Typography color="#475569" fontSize={14}>
                        {item.target}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#ecfdf5", border: "1px solid #bbf7d0" }}>
                  <Typography fontWeight={950} color="#047857">
                    Nutrition Tip
                  </Typography>
                  <Typography color="#475569" fontSize={14} lineHeight={1.7} sx={{ mt: 1 }}>
                    For tennis, combine carbohydrates for energy with protein for muscle recovery after practice.
                  </Typography>
                </Box>
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
                    <Grid item xs={12} sm={6} md={3} lg={1.7} key={item.day}>
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