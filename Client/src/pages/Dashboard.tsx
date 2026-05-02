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

import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SpeedIcon from "@mui/icons-material/Speed";
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
type GroupKey = "Full Squad" | "Attackers" | "Midfielders" | "Defenders";

const groups: GroupKey[] = ["Full Squad", "Attackers", "Midfielders", "Defenders"];

const colors = {
  slate: "#0f172a",
  blue: "#0284c7",
  cyan: "#06b6d4",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
};

const makeSeries = (days: number) =>
  Array.from({ length: days }, (_, index) => {
    const load = Math.round(64 + Math.sin(index / 2.7) * 10 + (index % 4));
    const recovery = Math.round(73 + Math.cos(index / 3.4) * 8 - (index % 3));
    const readiness = Math.round((recovery * 0.58 + (100 - Math.abs(load - 72)) * 0.42));
    const sprint = Number((29.5 + Math.sin(index / 3) * 1.7 + (index % 5) * 0.12).toFixed(1));

    return {
      day: `D${index + 1}`,
      load,
      recovery,
      readiness,
      sprint,
    };
  });

const seriesMap: Record<RangeKey, ReturnType<typeof makeSeries>> = {
  "7d": makeSeries(7),
  "30d": makeSeries(30),
  "90d": makeSeries(90),
};

const injuryRisk = [
  { name: "Low", value: 64 },
  { name: "Moderate", value: 25 },
  { name: "High", value: 11 },
];

const trainingZones = [
  { zone: "Z1", minutes: 44 },
  { zone: "Z2", minutes: 62 },
  { zone: "Z3", minutes: 49 },
  { zone: "Z4", minutes: 31 },
  { zone: "Z5", minutes: 15 },
];

const athleticProfile = [
  { metric: "Speed", score: 86 },
  { metric: "Power", score: 79 },
  { metric: "Endurance", score: 82 },
  { metric: "Agility", score: 76 },
  { metric: "Recovery", score: 73 },
  { metric: "Focus", score: 88 },
];

const watchlist = [
  { name: "Arjun", role: "Batter", readiness: 91, risk: "Low" },
  { name: "Ravi", role: "Bowler", readiness: 74, risk: "Moderate" },
  { name: "Karan", role: "Winger", readiness: 83, risk: "Low" },
  { name: "Dev", role: "Defender", readiness: 66, risk: "High" },
];

const Dashboard: React.FC = () => {
  const [range, setRange] = React.useState<RangeKey>("30d");
  const [group, setGroup] = React.useState<GroupKey>("Full Squad");

  const data = React.useMemo(() => seriesMap[range], [range]);

  const latest = data[data.length - 1];

  const avg = (key: "load" | "recovery" | "readiness") =>
    Math.round(data.reduce((sum, item) => sum + item[key], 0) / data.length);

  const kpis = [
    {
      label: "Readiness",
      value: `${avg("readiness")}%`,
      helper: "Composite team readiness",
      icon: <MonitorHeartIcon />,
      progress: avg("readiness"),
      color: colors.green,
    },
    {
      label: "Training Load",
      value: `${avg("load")}`,
      helper: "Average workload index",
      icon: <FitnessCenterIcon />,
      progress: avg("load"),
      color: colors.blue,
    },
    {
      label: "Recovery",
      value: `${avg("recovery")}%`,
      helper: "Fatigue and recovery score",
      icon: <DirectionsRunIcon />,
      progress: avg("recovery"),
      color: colors.amber,
    },
    {
      label: "Top Speed",
      value: `${latest.sprint} km/h`,
      helper: "Latest sprint output",
      icon: <SpeedIcon />,
      progress: Math.min(100, latest.sprint * 3),
      color: colors.purple,
    },
  ];

  const riskColor = (risk: string) => {
    if (risk === "Low") return { bg: "#dcfce7", color: "#166534" };
    if (risk === "Moderate") return { bg: "#fef3c7", color: "#92400e" };
    return { bg: "#fee2e2", color: "#991b1b" };
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ mb: 3 }}
        >
          <Box>
            <Chip
              label="Performance Dashboard"
              sx={{
                bgcolor: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 900,
                mb: 1.3,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.9,
                color: "#0f172a",
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              Athlete Monitoring
            </Typography>

            <Typography color="#64748b" sx={{ mt: 0.75 }}>
              Readable sports science metrics for load, recovery, readiness, and risk.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: "#fff" }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={range}
                label="Date Range"
                onChange={(event: SelectChangeEvent) =>
                  setRange(event.target.value as RangeKey)
                }
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {groups.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onClick={() => setGroup(item)}
                  sx={{
                    bgcolor: group === item ? "#0f172a" : "#ffffff",
                    color: group === item ? "#ffffff" : "#0f172a",
                    border: "1px solid #e2e8f0",
                    fontWeight: 850,
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {kpis.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.label}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  bgcolor: "#fff",
                  border: "1px solid #e2e8f0",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography color="#64748b" fontWeight={850}>
                        {item.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={950} sx={{ mt: 0.5 }}>
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
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Stack>

                  <Typography color="#64748b" fontSize={14} sx={{ mt: 2, mb: 1 }}>
                    {item.helper}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{
                      height: 9,
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
            <Card
              elevation={0}
              sx={{
                height: 420,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={950}>
                      Readiness Trend
                    </Typography>
                    <Typography color="#64748b" fontSize={14}>
                      Training load, recovery, and readiness over time
                    </Typography>
                  </Box>

                  <Chip
                    label={group}
                    sx={{ bgcolor: "#f1f5f9", color: "#0f172a", fontWeight: 900 }}
                  />
                </Stack>

                <ResponsiveContainer width="100%" height="82%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[0, 110]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="readiness"
                      stroke={colors.green}
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="recovery"
                      stroke={colors.amber}
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="load"
                      stroke={colors.blue}
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
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Injury Risk
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Distribution based on recovery and workload
                </Typography>

                <ResponsiveContainer width="100%" height="80%">
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
                      {injuryRisk.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={[colors.green, colors.amber, colors.red][index]}
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
                height: 350,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Training Zones
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Minutes spent across intensity zones
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <BarChart data={trainingZones}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="zone" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="minutes" fill={colors.blue} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: 350,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Athletic Profile
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Composite view across performance pillars
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <RadarChart data={athleticProfile}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={colors.purple}
                      fill={colors.purple}
                      fillOpacity={0.28}
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
                height: 350,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ height: "100%", p: 3 }}>
                <Typography variant="h6" fontWeight={950}>
                  Sprint Output
                </Typography>
                <Typography color="#64748b" fontSize={14} sx={{ mb: 2 }}>
                  Latest top-speed development
                </Typography>

                <ResponsiveContainer width="100%" height="78%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="sprintFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.cyan} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={colors.cyan} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sprint"
                      stroke={colors.cyan}
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
                minHeight: 350,
                height: "100%",
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <WarningAmberIcon sx={{ color: colors.amber }} />
                  <Typography variant="h6" fontWeight={950}>
                    Athlete Watchlist
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {watchlist.map((athlete) => {
                    const risk = riskColor(athlete.risk);

                    return (
                      <Box
                        key={athlete.name}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                          <Box>
                            <Typography fontWeight={950}>{athlete.name}</Typography>
                            <Typography color="#64748b" fontSize={14}>
                              {athlete.role}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={`${athlete.readiness}%`}
                              size="small"
                              sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 900 }}
                            />

                            <Chip
                              label={athlete.risk}
                              size="small"
                              sx={{
                                bgcolor: risk.bg,
                                color: risk.color,
                                fontWeight: 900,
                              }}
                            />
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
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
                    <Typography color="#1d4ed8" fontWeight={950}>
                      AI Recommendation
                    </Typography>
                  </Stack>

                  <Typography color="#475569" fontSize={14} lineHeight={1.75} sx={{ mt: 1 }}>
                    Keep high-risk athletes below peak sprint load today. Prioritize
                    mobility, low-intensity skill work, and recovery monitoring.
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