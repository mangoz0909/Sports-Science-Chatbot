import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SpeedIcon from "@mui/icons-material/Speed";
import PsychologyIcon from "@mui/icons-material/Psychology";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RangeKey = "7d" | "30d" | "90d";
type AthleteKey = "Squad" | "Forwards" | "Midfielders" | "Defenders";

const COLORS = {
  cyan: "#06b6d4",
  blue: "#2563eb",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
};

const athleteGroups: AthleteKey[] = ["Squad", "Forwards", "Midfielders", "Defenders"];

const buildPerformanceData = (days: number) =>
  Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return {
      day: `D${day}`,
      load: Math.round(62 + Math.sin(index / 2) * 12 + Math.random() * 12),
      readiness: Math.round(72 + Math.cos(index / 3) * 9 + Math.random() * 9),
      recovery: Math.round(68 + Math.sin(index / 4) * 10 + Math.random() * 10),
      sprint: Math.round(28 + Math.sin(index / 3) * 4 + Math.random() * 4),
    };
  });

const dataMap: Record<RangeKey, ReturnType<typeof buildPerformanceData>> = {
  "7d": buildPerformanceData(7),
  "30d": buildPerformanceData(30),
  "90d": buildPerformanceData(90),
};

const injuryRisk = [
  { name: "Low Risk", value: 62 },
  { name: "Moderate", value: 27 },
  { name: "High Risk", value: 11 },
];

const trainingZones = [
  { zone: "Zone 1", minutes: 42 },
  { zone: "Zone 2", minutes: 64 },
  { zone: "Zone 3", minutes: 52 },
  { zone: "Zone 4", minutes: 35 },
  { zone: "Zone 5", minutes: 18 },
];

const radarData = [
  { metric: "Speed", value: 86 },
  { metric: "Power", value: 78 },
  { metric: "Endurance", value: 82 },
  { metric: "Agility", value: 74 },
  { metric: "Recovery", value: 71 },
  { metric: "Focus", value: 88 },
];

const teamTable = [
  {
    name: "Arjun",
    role: "Batter",
    readiness: 91,
    load: "Optimal",
    risk: "Low",
  },
  {
    name: "Ravi",
    role: "Bowler",
    readiness: 74,
    load: "High",
    risk: "Moderate",
  },
  {
    name: "Karan",
    role: "Winger",
    readiness: 82,
    load: "Optimal",
    risk: "Low",
  },
  {
    name: "Dev",
    role: "Defender",
    readiness: 65,
    load: "Heavy",
    risk: "High",
  },
];

const Dashboard: React.FC = () => {
  const [range, setRange] = React.useState<RangeKey>("30d");
  const [group, setGroup] = React.useState<AthleteKey>("Squad");

  const data = React.useMemo(() => dataMap[range], [range]);

  const latest = data[data.length - 1];
  const previous = data[0];

  const avgReadiness = Math.round(
    data.reduce((sum, item) => sum + item.readiness, 0) / data.length
  );

  const avgLoad = Math.round(
    data.reduce((sum, item) => sum + item.load, 0) / data.length
  );

  const avgRecovery = Math.round(
    data.reduce((sum, item) => sum + item.recovery, 0) / data.length
  );

  const sprintChange = latest.sprint - previous.sprint;

  const handleRange = (event: SelectChangeEvent) => {
    setRange(event.target.value as RangeKey);
  };

  const kpis = [
    {
      label: "Readiness Score",
      value: `${avgReadiness}%`,
      helper: "Team match-day readiness",
      icon: <MonitorHeartIcon />,
      progress: avgReadiness,
      color: COLORS.green,
    },
    {
      label: "Training Load",
      value: `${avgLoad}`,
      helper: "Average workload index",
      icon: <FitnessCenterIcon />,
      progress: avgLoad,
      color: COLORS.cyan,
    },
    {
      label: "Recovery Index",
      value: `${avgRecovery}%`,
      helper: "Sleep, soreness, fatigue",
      icon: <DirectionsRunIcon />,
      progress: avgRecovery,
      color: COLORS.amber,
    },
    {
      label: "Sprint Speed",
      value: `${latest.sprint} km/h`,
      helper: `${sprintChange >= 0 ? "+" : ""}${sprintChange} km/h vs start`,
      icon: <SpeedIcon />,
      progress: Math.min(100, latest.sprint * 3),
      color: COLORS.purple,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f8fc",
        background:
          "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.15), transparent 28%), radial-gradient(circle at 100% 0%, rgba(34,197,94,0.12), transparent 28%)",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Chip
              label="Sports Science Command Center"
              sx={{
                mb: 1.5,
                bgcolor: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 900,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: 950,
                letterSpacing: -1,
                color: "#0f172a",
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Athlete Performance Dashboard
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.8 }}>
              Monitor training load, recovery, readiness, sprint output, and injury risk.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: "#fff" }}>
              <InputLabel>Date Range</InputLabel>
              <Select value={range} label="Date Range" onChange={handleRange}>
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {athleteGroups.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onClick={() => setGroup(item)}
                  sx={{
                    fontWeight: 800,
                    bgcolor: group === item ? "#0f172a" : "#fff",
                    color: group === item ? "#fff" : "#0f172a",
                    border: "1px solid #e5e7eb",
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>

        {/* KPI Cards */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {kpis.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.label}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={800}>
                        {item.label}
                      </Typography>

                      <Typography variant="h4" fontWeight={950} sx={{ mt: 0.7 }}>
                        {item.value}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: `${item.color}18`,
                        color: item.color,
                        "& svg": { fontSize: 30 },
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    {item.helper}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{
                      height: 9,
                      borderRadius: 999,
                      bgcolor: "#eef2f7",
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

        {/* Main Charts */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Card
              elevation={0}
              sx={{
                height: 420,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={950}>
                      Performance Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Load, readiness, and recovery over selected range
                    </Typography>
                  </Box>

                  <Chip label={group} sx={{ bgcolor: "#ecfeff", color: "#0369a1", fontWeight: 900 }} />
                </Stack>

                <ResponsiveContainer width="100%" height="82%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 110]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="readiness"
                      stroke={COLORS.green}
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="recovery"
                      stroke={COLORS.amber}
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="load"
                      stroke={COLORS.cyan}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card
              elevation={0}
              sx={{
                height: 420,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Injury Risk Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Based on load spikes and recovery signals
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <PieChart>
                    <Tooltip />
                    <Pie
                      data={injuryRisk}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="82%"
                      paddingAngle={4}
                    >
                      {injuryRisk.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={[COLORS.green, COLORS.amber, COLORS.red][index]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: 360,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Training Zone Minutes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Intensity distribution across sessions
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <BarChart data={trainingZones}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill={COLORS.blue} radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: 360,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Athletic Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Composite score across key performance pillars
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke={COLORS.purple}
                      fill={COLORS.purple}
                      fillOpacity={0.35}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Card
              elevation={0}
              sx={{
                height: 360,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Sprint Output
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Top speed trend across recent sessions
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="sprintFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sprint"
                      stroke={COLORS.cyan}
                      strokeWidth={3}
                      fill="url(#sprintFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                minHeight: 360,
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <WarningAmberIcon sx={{ color: COLORS.amber }} />
                  <Typography variant="h6" fontWeight={950}>
                    Athlete Watchlist
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {teamTable.map((athlete) => (
                    <Box
                      key={athlete.name}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <Box>
                          <Typography fontWeight={950}>{athlete.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {athlete.role}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${athlete.readiness}%`}
                            size="small"
                            sx={{
                              bgcolor:
                                athlete.readiness >= 80
                                  ? "#dcfce7"
                                  : athlete.readiness >= 70
                                  ? "#fef3c7"
                                  : "#fee2e2",
                              color:
                                athlete.readiness >= 80
                                  ? "#166534"
                                  : athlete.readiness >= 70
                                  ? "#92400e"
                                  : "#991b1b",
                              fontWeight: 900,
                            }}
                          />

                          <Chip
                            label={athlete.risk}
                            size="small"
                            sx={{
                              fontWeight: 900,
                              bgcolor:
                                athlete.risk === "Low"
                                  ? "#ecfdf5"
                                  : athlete.risk === "Moderate"
                                  ? "#fffbeb"
                                  : "#fef2f2",
                              color:
                                athlete.risk === "Low"
                                  ? "#047857"
                                  : athlete.risk === "Moderate"
                                  ? "#b45309"
                                  : "#b91c1c",
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PsychologyIcon sx={{ color: "#2563eb" }} />
                    <Typography fontWeight={950} color="#1d4ed8">
                      AI Coach Note
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                    Reduce heavy sprint volume for high-risk athletes and move
                    them into recovery-focused technical drills.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;