import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SpeedIcon from "@mui/icons-material/Speed";

import {
  getMyProfile,
  syncGoogleProfile,
  updateMyProfile,
} from "../services/profileService";

const profileMetrics = [
  { label: "Readiness", value: 84, icon: <MonitorHeartIcon />, helper: "Training availability" },
  { label: "Recovery", value: 78, icon: <FitnessCenterIcon />, helper: "Sleep, soreness, fatigue" },
  { label: "Speed", value: 86, icon: <SpeedIcon />, helper: "Sprint and acceleration" },
  { label: "Focus", value: 88, icon: <PsychologyIcon />, helper: "Mental performance" },
];

const recentActivity = [
  "Asked Sports AI for tennis training alternatives",
  "Reviewed 30-day athlete dashboard",
  "Checked recovery checklist after high intensity session",
  "Opened sport matching engine",
];

const ProfilePage: React.FC = () => {
  const [name, setName] = React.useState("SportLab Athlete");
  const [email, setEmail] = React.useState("");
  const [sport, setSport] = React.useState("Tennis");
  const [goal, setGoal] = React.useState("Improve speed, recovery, and match readiness");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        await syncGoogleProfile();
        const profile = await getMyProfile();

        if (profile) {
          setName(profile.name || "SportLab Athlete");
          setEmail(profile.email || "");
          setSport(profile.primary_sport || "Tennis");
          setGoal(profile.goal || "Improve speed, recovery, and match readiness");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      await updateMyProfile({
        name,
        email,
        primary_sport: sport,
        goal,
      });

      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (err: any) {
      setError(err?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Chip
            label="Athlete Profile"
            sx={{
              width: "fit-content",
              bgcolor: "#ecfdf5",
              color: "#047857",
              fontWeight: 950,
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -0.9 }}>
            Your sports science workspace.
          </Typography>
          <Typography color="#64748b" maxWidth={780} lineHeight={1.8}>
            Store athlete context, track profile metrics, and personalize SportLab AI.
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <Alert severity="info" sx={{ mb: 2 }}>Loading profile...</Alert>}

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid #e2e8f0", height: "100%" }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack alignItems="center" textAlign="center" spacing={2}>
                  <Avatar sx={{ width: 96, height: 96, bgcolor: "#0f172a", color: "#38bdf8", fontWeight: 950, fontSize: 32 }}>
                    {initials}
                  </Avatar>

                  <Box>
                    <Typography variant="h5" fontWeight={950}>{name}</Typography>
                    <Typography color="#64748b">{email}</Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
                    <Chip label={sport} sx={{ fontWeight: 900 }} />
                    <Chip label="Active" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 900 }} />
                  </Stack>
                </Stack>

                <Stack spacing={2} sx={{ mt: 4 }}>
                  {profileMetrics.map((metric) => (
                    <Box key={metric.label}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ color: "#0284c7", display: "flex" }}>{metric.icon}</Box>
                          <Box>
                            <Typography fontWeight={900}>{metric.label}</Typography>
                            <Typography color="#64748b" fontSize={12}>{metric.helper}</Typography>
                          </Box>
                        </Stack>
                        <Typography fontWeight={950}>{metric.value}%</Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={metric.value}
                        sx={{
                          height: 9,
                          borderRadius: 999,
                          bgcolor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: "#0284c7",
                            borderRadius: 999,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid #e2e8f0" }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="h5" fontWeight={950} sx={{ mb: 2 }}>
                      Profile Details
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Primary Sport" value={sport} onChange={(e) => setSport(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Main Goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      onClick={saveProfile}
                      disabled={saving || loading}
                      sx={{
                        mt: 2.5,
                        borderRadius: 3,
                        bgcolor: "#0f172a",
                        fontWeight: 950,
                        px: 3,
                        "&:hover": { bgcolor: "#1e293b" },
                      }}
                    >
                      {saving ? "Saving..." : saved ? "Saved" : "Save Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card elevation={0} sx={{ borderRadius: 5, border: "1px solid #e2e8f0" }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="h5" fontWeight={950} sx={{ mb: 2 }}>
                      Recent Activity
                    </Typography>

                    <Stack spacing={1.2}>
                      {recentActivity.map((item, index) => (
                        <Box
                          key={item}
                          sx={{
                            p: 1.8,
                            borderRadius: 3,
                            bgcolor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            gap: 1.5,
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: "#e0f2fe", color: "#0369a1", display: "grid", placeItems: "center", fontWeight: 950 }}>
                            {index + 1}
                          </Box>
                          <Typography fontWeight={800}>{item}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;