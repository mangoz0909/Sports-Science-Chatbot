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
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SpeedIcon from "@mui/icons-material/Speed";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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

  const title = mode === "login" ? "Welcome back" : "Create your account";

  const subtitle =
    mode === "login"
      ? "Log in to access your sports science workspace."
      : "Create an account to start using SportLab AI.";

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
        if (remember) localStorage.setItem("token", data.token);
        else sessionStorage.setItem("token", data.token);
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
        bgcolor: "#f8fafc",
        py: { xs: 4, md: 7 },
        display: "grid",
        alignItems: "center",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                minHeight: { xs: "auto", md: 640 },
                borderRadius: 5,
                p: { xs: 3, md: 4 },
                bgcolor: "#0f172a",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#38bdf8",
                    color: "#0f172a",
                  }}
                >
                  <MonitorHeartIcon />
                </Box>

                <Box>
                  <Typography variant="h5" fontWeight={950}>
                    SportLab AI
                  </Typography>
                  <Typography color="#94a3b8" fontSize={14}>
                    Athlete intelligence platform
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ flex: 1, display: "grid", alignContent: "center", py: 5 }}>
                <Chip
                  label="Clean access for performance teams"
                  sx={{
                    width: "fit-content",
                    bgcolor: "rgba(56,189,248,0.12)",
                    color: "#7dd3fc",
                    fontWeight: 900,
                    mb: 2,
                  }}
                />

                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 950,
                    lineHeight: 1.02,
                    letterSpacing: -1,
                    fontSize: { xs: "2.3rem", md: "3.3rem" },
                    mb: 2,
                  }}
                >
                  One login for sports AI, recovery insights, and dashboards.
                </Typography>

                <Typography sx={{ color: "#cbd5e1", lineHeight: 1.8 }}>
                  Keep the product focused: easy onboarding, clean forms, readable
                  visuals, and clear access to the athlete workspace.
                </Typography>

                <Grid container spacing={1.5} sx={{ mt: 3 }}>
                  {[
                    { icon: <SpeedIcon />, label: "Performance" },
                    { icon: <FitnessCenterIcon />, label: "Load" },
                    { icon: <PsychologyIcon />, label: "Mindset" },
                    { icon: <ShieldOutlinedIcon />, label: "Secure" },
                  ].map((item) => (
                    <Grid item xs={6} key={item.label}>
                      <Box
                        sx={{
                          p: 1.6,
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ color: "#38bdf8", display: "flex" }}>{item.icon}</Box>
                          <Typography fontWeight={850}>{item.label}</Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Typography color="#64748b" fontSize={14}>
                Sports science tools for athletes, coaches, and student projects.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                height: "100%",
                minHeight: { xs: "auto", md: 640 },
                borderRadius: 5,
                p: { xs: 3, sm: 4, md: 5 },
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "grid",
                alignContent: "center",
              }}
            >
              <Stack spacing={2.4} sx={{ maxWidth: 520, mx: "auto", width: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    onClick={() => navigate("/")}
                    size="small"
                    aria-label="Back to home"
                    sx={{ bgcolor: "#f1f5f9" }}
                  >
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>

                  <Typography
                    variant="overline"
                    color="#64748b"
                    fontWeight={900}
                    letterSpacing={1}
                  >
                    Back to home
                  </Typography>
                </Stack>

                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 950,
                      letterSpacing: -0.8,
                      color: "#0f172a",
                      fontSize: { xs: "2rem", md: "2.7rem" },
                    }}
                  >
                    {title}
                  </Typography>

                  <Typography color="#64748b" lineHeight={1.8} sx={{ mt: 1 }}>
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
                      color: mode === "login" ? "#fff" : "#0f172a",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: mode === "login" ? "#1e293b" : "#f8fafc",
                        boxShadow: "none",
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
                      color: mode === "signup" ? "#fff" : "#0f172a",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: mode === "signup" ? "#1e293b" : "#f8fafc",
                        boxShadow: "none",
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
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
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
                      sx={{ fontWeight: 850 }}
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
                    py: 1.35,
                    borderRadius: 3,
                    bgcolor: "#0f172a",
                    fontWeight: 950,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#1e293b",
                      boxShadow: "none",
                    },
                  }}
                >
                  {submitting
                    ? mode === "login"
                      ? "Logging in..."
                      : "Creating account..."
                    : mode === "login"
                    ? "Login"
                    : "Create account"}
                </Button>

                <Typography textAlign="center" color="#64748b">
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
                        Login
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