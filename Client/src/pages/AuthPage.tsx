import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import SpeedIcon from "@mui/icons-material/Speed";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ShieldIcon from "@mui/icons-material/Shield";

type Mode = "login" | "signup";

const API_BASE = process.env.REACT_APP_API_URL?.trim() || "http://localhost:5000";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const qs = useQuery();

  const initialMode = (qs.get("mode") === "signup" ? "signup" : "login") as Mode;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("mode", mode);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", url);
  }, [mode]);

  const title = mode === "login" ? "Welcome back, athlete" : "Create your performance account";

  const subtitle =
    mode === "login"
      ? "Log in to continue tracking training, recovery, and AI assistant insights."
      : "Start your AI-powered sports science workspace in minutes.";

  const validate = () => {
    if (!email || !email.includes("@")) return "Please enter a valid email.";
    if (mode === "signup" && name.trim().length < 2) return "Please enter your full name.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError(null);
    setSuccessMsg(null);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const url =
        mode === "login"
          ? `${API_BASE}/api/auth/login`
          : `${API_BASE}/api/auth/signup`;

      const payload =
        mode === "login"
          ? { email, password, remember }
          : { name, email, password };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Request failed.";

        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch {
          // keep default message
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data?.token) {
        if (remember) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setSuccessMsg(
        mode === "login"
          ? "Logged in successfully."
          : "Account created successfully."
      );

      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        alignItems: "center",
        py: { xs: 4, md: 7 },
        bgcolor: "#06111f",
        background:
          "radial-gradient(circle at 10% 10%, rgba(56,189,248,0.22), transparent 28%), radial-gradient(circle at 90% 20%, rgba(34,197,94,0.14), transparent 26%), linear-gradient(135deg, #06111f 0%, #0f172a 60%, #020617 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="stretch">
          {/* Left Visual Panel */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                minHeight: { xs: 420, md: 650 },
                borderRadius: 5,
                p: { xs: 3, md: 4 },
                color: "#fff",
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
                  width: 340,
                  height: 340,
                  borderRadius: "50%",
                  right: -120,
                  top: -100,
                  background: "rgba(56,189,248,0.18)",
                  filter: "blur(2px)",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  left: -100,
                  bottom: -90,
                  background: "rgba(34,197,94,0.16)",
                }}
              />

              <Stack sx={{ position: "relative", height: "100%" }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "#38bdf8",
                      color: "#06111f",
                    }}
                  >
                    <MonitorHeartIcon />
                  </Box>

                  <Box>
                    <Typography variant="h5" fontWeight={950}>
                      SportLab AI
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.65)">
                      Sports science assistant platform
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ flex: 1, display: "grid", alignContent: "center", py: 5 }}>
                  <Chip
                    label="Secure athlete workspace"
                    sx={{
                      width: "fit-content",
                      mb: 2,
                      bgcolor: "rgba(34,197,94,0.14)",
                      color: "#86efac",
                      border: "1px solid rgba(134,239,172,0.24)",
                      fontWeight: 900,
                    }}
                  />

                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 950,
                      lineHeight: 1,
                      letterSpacing: -1,
                      fontSize: { xs: "2.4rem", md: "3.7rem" },
                      mb: 2,
                    }}
                  >
                    Your AI coach, analyst, and recovery companion.
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "rgba(255,255,255,0.72)",
                      lineHeight: 1.7,
                      maxWidth: 560,
                    }}
                  >
                    Access sports Q&A, athlete dashboards, training analytics,
                    and mental readiness support from one clean system.
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 3 }}>
                    {[
                      {
                        icon: <SpeedIcon />,
                        label: "Sprint analytics",
                      },
                      {
                        icon: <FitnessCenterIcon />,
                        label: "Load monitoring",
                      },
                      {
                        icon: <PsychologyIcon />,
                        label: "Mental readiness",
                      },
                      {
                        icon: <ShieldIcon />,
                        label: "Secure access",
                      },
                    ].map((item) => (
                      <Grid item xs={12} sm={6} key={item.label}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Box sx={{ color: "#7dd3fc" }}>{item.icon}</Box>
                            <Typography fontWeight={800}>{item.label}</Typography>
                          </Stack>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Typography variant="body2" color="rgba(255,255,255,0.55)">
                  Built for modern sports teams, student projects, and AI-powered coaching tools.
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Auth Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                height: "100%",
                minHeight: { xs: "auto", md: 650 },
                borderRadius: 5,
                p: { xs: 3, sm: 4, md: 5 },
                bgcolor: "#fff",
                display: "grid",
                alignContent: "center",
                boxShadow: "0 28px 80px rgba(0,0,0,0.25)",
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton
                    onClick={() => navigate("/")}
                    size="small"
                    aria-label="Back to home"
                    sx={{ bgcolor: "#f1f5f9" }}
                  >
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>

                  <Typography variant="overline" color="text.secondary" fontWeight={900}>
                    Back to home
                  </Typography>
                </Stack>

                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 950,
                      letterSpacing: -0.8,
                      fontSize: { xs: "2rem", md: "2.6rem" },
                      color: "#0f172a",
                    }}
                  >
                    {title}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                    {subtitle}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    type="button"
                    variant={mode === "login" ? "contained" : "outlined"}
                    onClick={() => setMode("login")}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 900,
                      bgcolor: mode === "login" ? "#0f172a" : "transparent",
                      "&:hover": {
                        bgcolor: mode === "login" ? "#1e293b" : "#f8fafc",
                      },
                    }}
                  >
                    Login
                  </Button>

                  <Button
                    type="button"
                    variant={mode === "signup" ? "contained" : "outlined"}
                    onClick={() => setMode("signup")}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 900,
                      bgcolor: mode === "signup" ? "#0f172a" : "transparent",
                      "&:hover": {
                        bgcolor: mode === "signup" ? "#1e293b" : "#f8fafc",
                      },
                    }}
                  >
                    Sign up
                  </Button>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}
                {successMsg && <Alert severity="success">{successMsg}</Alert>}

                {mode === "signup" && (
                  <TextField
                    label="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    fullWidth
                  />
                )}

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  fullWidth
                />

                <TextField
                  label="Password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPw ? "Hide password" : "Show password"}
                          onClick={() => setShowPw((value) => !value)}
                          edge="end"
                        >
                          {showPw ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {mode === "login" && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={remember}
                          onChange={(event) => setRemember(event.target.checked)}
                        />
                      }
                      label="Remember me"
                    />

                    <Link
                      component="button"
                      type="button"
                      underline="hover"
                      onClick={() => alert("Connect this to your reset password flow.")}
                      sx={{ fontWeight: 800 }}
                    >
                      Forgot password?
                    </Link>
                  </Stack>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    py: 1.4,
                    borderRadius: 3,
                    fontWeight: 950,
                    bgcolor: "#22c55e",
                    color: "#052e16",
                    boxShadow: "0 12px 30px rgba(34,197,94,0.25)",
                    "&:hover": {
                      bgcolor: "#86efac",
                    },
                  }}
                >
                  {submitting
                    ? mode === "login"
                      ? "Logging in..."
                      : "Creating account..."
                    : mode === "login"
                    ? "Log in"
                    : "Create account"}
                </Button>

                <Typography textAlign="center" color="text.secondary">
                  {mode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <Link
                        component="button"
                        type="button"
                        onClick={() => setMode("signup")}
                        sx={{ fontWeight: 900 }}
                      >
                        Sign up
                      </Link>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link
                        component="button"
                        type="button"
                        onClick={() => setMode("login")}
                        sx={{ fontWeight: 900 }}
                      >
                        Log in
                      </Link>
                    </>
                  )}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthPage;