import React from "react";
import { Alert, Box, Button, CircularProgress, Container, IconButton, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { entryLocation, supabase } from "../lib/supabaseClient";
import Seo from "../components/Seo";

/**
 * What brought the user to this page.
 *
 * The form must only be reachable from a reset link. It previously opened for
 * *any* active session, so a signed-in athlete who typed the URL — or anyone
 * at their unlocked browser — got a change-password form with nothing proving
 * they owned the account.
 */
type ResetArrival =
  | { kind: "recovery" }
  | { kind: "link-error" }
  | { kind: "not-a-link" };

function readResetArrival(): ResetArrival {
  const hash = new URLSearchParams(entryLocation.hash.replace(/^#/, ""));
  const query = new URLSearchParams(entryLocation.search);
  const param = (name: string) => hash.get(name) ?? query.get(name);

  // An expired or already-used link comes back with an error rather than a
  // token. That is still an arrival from a link, and deserves the "expired"
  // message straight away instead of an eight-second spinner first.
  if (param("error") || param("error_code")) return { kind: "link-error" };

  // The implicit flow puts tokens in the hash with type=recovery; the PKCE and
  // token-hash flows send an exchange code in the query instead.
  if (param("type") === "recovery" || query.has("code") || query.has("token_hash")) {
    return { kind: "recovery" };
  }

  return { kind: "not-a-link" };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [sessionReady, setSessionReady] = React.useState(false);
  // An expired, already-used, or malformed link fires neither PASSWORD_RECOVERY
  // nor returns a session, which used to leave the user on the "Verifying…"
  // spinner indefinitely with no error and no way forward.
  const [linkInvalid, setLinkInvalid] = React.useState(false);
  const redirectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read once, on the first render, from the URL snapshot taken at import.
  const [arrival] = React.useState(readResetArrival);

  React.useEffect(() => {
    // No reset link, no form — whatever session the browser happens to hold.
    if (arrival.kind !== "recovery") {
      setLinkInvalid(true);
      return;
    }

    let settled = false;

    const markReady = () => {
      settled = true;
      setSessionReady(true);
    };

    // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markReady();
      }
    });

    // PASSWORD_RECOVERY can fire before this listener attaches, because
    // supabase-js starts reading the URL at import time — well before React
    // mounts. Accepting the session covers that race, and is only safe because
    // the check above already established a recovery link brought us here.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const giveUp = setTimeout(() => {
      if (!settled) setLinkInvalid(true);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(giveUp);
    };
  }, [arrival]);

  React.useEffect(
    () => () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    },
    []
  );

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
      redirectTimerRef.current = setTimeout(
        () => navigate("/dashboard", { replace: true }),
        2000
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionReady) {
    return (
      <Box sx={{ minHeight: "calc(100dvh - var(--app-header-h, 64px))", display: "grid", placeItems: "center", bgcolor: "#f8fafc", px: 2 }}>
        <Box textAlign="center" role="status" aria-live="polite">
          {linkInvalid ? (
            <Container maxWidth="xs" disableGutters>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: "left" }}>
                {arrival.kind === "not-a-link"
                  ? "Open this page from the link in your password reset email. For your security, the form is only available from that link."
                  : "This password reset link is invalid or has expired. Reset links can only be used once, and stop working after a short time."}
              </Alert>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate("/auth?mode=login")}
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
                {arrival.kind === "not-a-link" ? "Email me a reset link" : "Request a new link"}
              </Button>
            </Container>
          ) : (
            <>
              <CircularProgress />
              <Typography sx={{ mt: 2 }} color="#64748b">Verifying your reset link…</Typography>
            </>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "calc(100dvh - var(--app-header-h, 64px))", display: "grid", placeItems: "center", bgcolor: "#f8fafc", px: 2 }}>
      <Seo
        title="Reset Your Password"
        description="Choose a new password for your SportLab AI account."
        noIndex
      />
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
                autoComplete="new-password"
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
                autoComplete="new-password"
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
