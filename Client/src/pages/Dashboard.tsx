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
  Skeleton,
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  getLatestCheckIn,
  getLast7CheckIns,
  localDateString,
} from "../services/checkinService";
import { getMyProfile } from "../services/profileService";
import { useAuth } from "../contexts/AuthContext";
import Seo from "../components/Seo";
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
const DEMO_WEEKLY = [
  { day: "Mon", readiness: 72, recovery: 68, load: 60, sleep: 7,   fatigue: 35 },
  { day: "Tue", readiness: 78, recovery: 74, load: 75, sleep: 7.5, fatigue: 28 },
  { day: "Wed", readiness: 65, recovery: 60, load: 85, sleep: 6.5, fatigue: 45 },
  { day: "Thu", readiness: 80, recovery: 76, load: 55, sleep: 8,   fatigue: 22 },
  { day: "Fri", readiness: 84, recovery: 78, load: 69, sleep: 7.5, fatigue: 30 },
  { day: "Sat", readiness: 70, recovery: 65, load: 90, sleep: 7,   fatigue: 40 },
  { day: "Sun", readiness: 75, recovery: 72, load: 40, sleep: 8.5, fatigue: 20 },
];


function riskColor(value: number) {
  if (value < 35) return colors.green;
  if (value < 65) return colors.amber;
  return colors.red;
}

/*
 * Advice for today, or an honest refusal.
 *
 * `hasData` is not optional. With no check-in on file every metric below is 0,
 * which is indistinguishable from a genuine reading of zero: the sleep branch
 * fired on `sleep: 0` and told a brand-new athlete their sleep was low and to
 * hold their training load back. Coaching invented from absent data is worse
 * than no coaching, so nothing here runs until there is something to read.
 */
function getAIRecommendation(
  hasData: boolean,
  profile: {
    injuryRisk: number;
    sleep: number;
    fatigue: number;
    load: number;
    recovery: number;
  }
) {
  if (!hasData) {
    return "Log your first daily check-in and your coach tips will start appearing here, based on your own readiness, sleep, and training load.";
  }

  if (profile.injuryRisk >= 60) {
    return "Your injury risk is high. Reduce high-intensity training and focus on mobility, hydration, and sleep.";
  }
  if (profile.sleep < 7) {
    return "Your sleep is slightly low. Avoid increasing training load until your sleep improves.";
  }
  if (profile.fatigue >= 60) {
    return "Your fatigue level is elevated. Today should be a low-intensity recovery day.";
  }
  if (profile.load > 80 && profile.recovery < 70) {
    return "Your training load is high compared to your recovery. Reduce sprint work and add recovery time.";
  }
  return "You are in a stable training zone. Continue normal practice, but keep monitoring sleep and hydration.";
}

export default function Dashboard() {
  const { session } = useAuth();
  const [latestCheckIn, setLatestCheckIn] = React.useState<any>(null);
  const [weeklyCheckIns, setWeeklyCheckIns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [snackError, setSnackError] = React.useState<string | null>(null);

  const isGuest = !session;

  // The session object gets a new identity on every silent token refresh
  // (roughly hourly). Keying the data load on the user id instead stops the
  // dashboard from re-running three queries and flashing its loading state.
  const userId = session?.user?.id ?? null;

  React.useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const [latest, last7, prof] = await Promise.all([
          getLatestCheckIn(),
          getLast7CheckIns(),
          getMyProfile(),
        ]);
        if (!mounted) return;
        setLatestCheckIn(latest);
        setWeeklyCheckIns(last7);
        setProfile(prof);
      } catch (error: any) {
        if (!mounted) return;
        setSnackError(error?.message || "Failed to load dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { mounted = false; };
  }, [userId]);

const userProfile = isGuest ? {
  name: "Demo Athlete",
  sport: "Tennis",
  readiness: 84,
  recovery: 78,
  load: 69,
  sleep: 7.5,
  sleepQuality: 80,
  fatigue: 30,
  injuryRisk: 15,
  hydration: 7,
  hydrationGoal: 10,
} : {
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

const weeklyData = isGuest ? DEMO_WEEKLY : weeklyCheckIns.map((item) => ({
  // Weekday labels repeat once check-ins span more than a week, which collided
  // as React keys in the heatmap below. The date is unique; the label is not.
  key: item.checkin_date,
  day: new Date(item.checkin_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
  readiness: item.readiness_score ?? 0,
  recovery: item.recovery_score ?? 0,
  load: item.training_intensity ? item.training_intensity * 10 : 0,
  sleep: item.sleep_hours ?? 0,
  fatigue: item.fatigue ? item.fatigue * 10 : 0,
}));

if (loading) {
  // Mirrors the real layout below (heading, 6 KPI cards, two chart panels) so
  // the page doesn't reflow when data lands. The old centred spinner replaced
  // the entire page and every element jumped into place afterwards.
  return (
    <Box sx={{ bgcolor: "#f8fafc" }} aria-busy="true" aria-live="polite">
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Skeleton variant="rounded" width={230} height={32} sx={{ borderRadius: 999 }} />
          <Skeleton variant="text" width="min(460px, 80%)" height={56} />
          <Skeleton variant="text" width="min(620px, 95%)" height={24} />
        </Stack>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Skeleton
              variant="rounded"
              sx={{ borderRadius: 4, height: { xs: 300, md: 460 } }}
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton
              variant="rounded"
              sx={{ borderRadius: 4, height: { xs: 300, md: 460 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={350} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={350} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

const hasNoData = !isGuest && weeklyCheckIns.length === 0 && !latestCheckIn;

  const today = localDateString();
  const checkedInToday = !isGuest && latestCheckIn?.checkin_date === today;

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
      // Hydration is the 1-10 self-rating from the daily check-in, not a volume.
      // This used to render "7/10L", inventing a litre goal the app never asked for.
      value: `${userProfile.hydration}/${userProfile.hydrationGoal}`,
      icon: <WaterDropIcon />,
      color: colors.cyan,
      progress: Math.round((userProfile.hydration / userProfile.hydrationGoal) * 100),
    },
  ];

  return (
    <Box sx={{ bgcolor: "#f8fafc" }}>
      <Seo
        title="My Dashboard"
        description="View your athlete readiness, recovery, training load, sleep trends, and AI coach insights — all in one place."
        path="/dashboard"
        noIndex
      />
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
              fontSize: { xs: "1.6rem", md: "3rem" },
            }}
          >
            Welcome back, {userProfile.name}
          </Typography>

          <Typography color="#64748b">
            {isGuest
              ? "Showing demo data — sign in to see your real training, recovery, and readiness metrics."
              : `Your personal dashboard for ${userProfile.sport} training, recovery, sleep, nutrition, and injury prevention.`}
          </Typography>
        </Stack>

        {/* No data banner */}
        {hasNoData && (
          <Box
            sx={{
              mb: 3,
              px: { xs: 2, md: 2.5 },
              py: 2,
              borderRadius: 3,
              border: "1px solid #bfdbfe",
              bgcolor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AddCircleOutlineIcon sx={{ color: "#2563eb", fontSize: 22, flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800} fontSize={14} color="#1e3a5f">
                Start tracking to unlock your dashboard
              </Typography>
              <Typography fontSize={12} color="#3b82f6" fontWeight={600}>
                Log your first daily check-in to see readiness scores, trends, and AI recommendations.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/daily-check-in"
              variant="contained"
              size="small"
              sx={{ borderRadius: 2, bgcolor: "#2563eb", fontWeight: 800, textTransform: "none", boxShadow: "none", flexShrink: 0, "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" } }}
            >
              Log check-in
            </Button>
          </Box>
        )}

        {/* Check-In Banner */}
        {!isGuest && <Box
          component={checkedInToday ? "div" : RouterLink}
          to={checkedInToday ? undefined : "/daily-check-in"}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 3,
            px: { xs: 2, md: 2.5 },
            py: 1.5,
            borderRadius: 3,
            border: "1px solid",
            textDecoration: "none",
            cursor: checkedInToday ? "default" : "pointer",
            bgcolor: checkedInToday ? "#f0fdf4" : "#fffbeb",
            borderColor: checkedInToday ? "#bbf7d0" : "#fde68a",
            transition: "box-shadow 0.15s ease",
            "&:hover": checkedInToday ? {} : { boxShadow: "0 4px 16px rgba(234,179,8,0.14)" },
          }}
        >
          {checkedInToday ? (
            <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 22, flexShrink: 0 }} />
          ) : (
            <AddCircleOutlineIcon sx={{ color: "#d97706", fontSize: 22, flexShrink: 0 }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={800} fontSize={14} color={checkedInToday ? "#15803d" : "#92400e"}>
              {checkedInToday ? "Checked in today ✓" : "Log today's check-in"}
            </Typography>
            <Typography fontSize={12} color={checkedInToday ? "#4ade80" : "#b45309"} fontWeight={600}>
              {checkedInToday
                ? "Your dashboard stats reflect today's data."
                : "Dashboard KPIs will update once you log your daily check-in."}
            </Typography>
          </Box>
          {!checkedInToday && (
            <Typography fontSize={13} fontWeight={800} color="#d97706" sx={{ flexShrink: 0 }}>
              Tap to log →
            </Typography>
          )}
        </Box>}

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
          <Card elevation={0} sx={{ height: "100%", minHeight: { xs: 300, md: 460 }, borderRadius: 4, border: "1px solid #e2e8f0" }}>              <CardContent sx={{ height: "100%", p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={950}>
                  My Weekly Readiness Trend
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Readiness, recovery, fatigue, and training load over the week.
                </Typography>

                <Box sx={{ height: { xs: 210, md: 340 } }}>
                  {weeklyData.length === 0 ? (
                    <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                      <Box textAlign="center">
                        <Typography fontWeight={700} color="#94a3b8">No data yet</Typography>
                        <Typography fontSize={13} color="#cbd5e1" sx={{ mt: 0.5 }}>Complete daily check-ins to see your weekly trends.</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} tickMargin={6} />
                        <YAxis stroke="#64748b" domain={[0, 110]} tick={{ fontSize: 12 }} width={44} />
                        <Tooltip />
                        <Line type="monotone" dataKey="readiness" stroke={colors.green} strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="recovery" stroke={colors.purple} strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="load" stroke={colors.blue} strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="fatigue" stroke={colors.amber} strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
          <Card elevation={0} sx={{ height: "100%", minHeight: { xs: 300, md: 460 }, borderRadius: 4, border: "1px solid #e2e8f0" }}>              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
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
                        Coach Tip
                      </Typography>
                    </Stack>
                    <Typography color="#1e3a5f" fontSize={14} lineHeight={1.8}>
                      {getAIRecommendation(!hasNoData, userProfile)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Typography fontWeight={950}>Today’s Focus</Typography>
                  <Typography color="#475569" fontSize={14} lineHeight={1.75} sx={{ mt: 1 }}>
                    {hasNoData
                      ? `Once you have logged a check-in, today's focus will be tailored to your readiness and recovery.`
                      : userProfile.fatigue >= 60
                      ? `High fatigue detected. Keep ${userProfile.sport} work technical and low-intensity today — prioritise sleep and hydration.`
                      : userProfile.recovery < 50
                      ? `Recovery is low. Focus on ${userProfile.sport} skill drills rather than high-load sessions, and aim for 8+ hours sleep tonight.`
                      : `Keep today balanced: ${userProfile.sport} skill work, stay hydrated, and aim for at least 8 hours of sleep tonight.`}
                  </Typography>
                </Box>

                {/*
                  Hidden rather than zeroed: with no check-in on file this read
                  "Current fatigue is 0%. You are not overloaded" — a reassuring
                  measurement of nothing.
                */}
                {!hasNoData && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                    <Typography fontWeight={950} color="#c2410c">
                      Fatigue Detection
                    </Typography>
                    <Typography color="#475569" fontSize={14} lineHeight={1.75} sx={{ mt: 1 }}>
                      Current fatigue is {userProfile.fatigue}%. You are not overloaded, but avoid stacking too many high-intensity sessions.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ height: "100%", p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={950}>
                  My Sleep Trend
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Sleep duration across the week.
                </Typography>

                <Box sx={{ height: { xs: 200, md: 230 } }}>
                  {weeklyData.length === 0 ? (
                    <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                      <Typography fontWeight={700} color="#94a3b8">No sleep data yet</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} tickMargin={6} />
                        <YAxis stroke="#64748b" domain={[4, 10]} tick={{ fontSize: 12 }} width={44} />
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
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ height: "100%", p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={950}>
                  My Training Load
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Daily training load for this week.
                </Typography>

                <Box sx={{ height: { xs: 200, md: 230 } }}>
                  {weeklyData.length === 0 ? (
                    <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                      <Typography fontWeight={700} color="#94a3b8">No training data yet</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} tickMargin={6} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 12 }} width={44} />
                        <Tooltip />
                        <Bar dataKey="load" fill={colors.blue} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
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

                {weeklyData.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography fontWeight={700} color="#94a3b8">No heatmap data yet — log daily check-ins to see your load distribution.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1}>
                    {weeklyData.map((item) => (
                      <Grid
                        item
                        xs={6}
                        sm={4}
                        md={3}
                        lg={2}
                        key={"key" in item ? item.key : item.day}
                      >
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
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}