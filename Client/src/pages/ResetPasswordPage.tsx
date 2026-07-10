import React from "react";
import { Alert, Box, Button, CircularProgress, Container, IconButton, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [sessionReady, setSessionReady] = React.useState(false);

  React.useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also handle the case where getSession already has the recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionReady) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f8fafc" }}>
        <Box textAlign="center">
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="#64748b">Verifying your reset link…</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f8fafc", px: 2 }}>
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, border: "1px solid #e2e8f0" }}>
          <Typography variant="h5" fontWeight={950} color="#0f172a" sx={{ mb: 0.5 }}>
            Set new password
          </Typography>
          <Typography color="#64748b" fontSize={14} sx={{ mb: 3 }}>
            Choose a strong password for your account.
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Password updated. Redirecting to your dashboard…
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          {!success && (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw((v) => !v)} edge="end" aria-label="Toggle password visibility">
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm password"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  bgcolor: "#0f172a",
                  boxShadow: "none",
                  py: 1.25,
                  "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
                }}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : "Update password"}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
