import React from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { syncGoogleProfile } from "../services/profileService";
import { needsOnboarding, postLoginTarget, readOAuthError, takeReturnPath } from "../lib/postLogin";
import Seo from "../components/Seo";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    // Read before anything else: a cancelled or failed Google sign-in comes
    // back with `error` in the URL and no tokens. Polling for a session first
    // cost the user a 5-second spinner and then reported "session missing".
    const oauthError = readOAuthError(window.location.search, window.location.hash);

    if (oauthError) {
      takeReturnPath();
      const params = new URLSearchParams({ mode: "login", error: oauthError.code });
      if (oauthError.description) params.set("error_description", oauthError.description);
      navigate(`/auth?${params.toString()}`, { replace: true });
      return;
    }

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError("Sign-in is taking too long. Please try again.");
      }
    }, 10000);

    /**
     * supabase-js parses the OAuth tokens out of the URL hash asynchronously,
     * so a single getSession() on mount can return null for a perfectly valid
     * login and bounce the user back to /auth?error=session_missing. Wait for
     * the client to settle before treating "no session" as a real failure.
     */
    async function waitForSession() {
      for (let attempt = 0; attempt < 20; attempt++) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (session?.user) return session;
        if (cancelled) return null;

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      return null;
    }

    async function finishLogin() {
      try {
        const session = await waitForSession();

        if (cancelled) return;

        if (!session?.user) {
          navigate("/auth?mode=login&error=session_missing", { replace: true });
          return;
        }

        await syncGoogleProfile();

        const onboarding = await needsOnboarding(session.user.id);

        if (cancelled) return;

        const target = postLoginTarget(onboarding, takeReturnPath());
        navigate(target.path, { replace: true, state: target.state });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Could not finish Google sign in.");
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    finishLogin();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: "calc(100dvh - var(--app-header-h, 64px))",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f8fafc",
        px: 2,
      }}
    >
      <Seo title="Signing You In" description="Completing your SportLab AI sign in." noIndex />
      <Box textAlign="center">
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button
              variant="outlined"
              onClick={() => navigate("/auth?mode=login")}
              sx={{ borderRadius: 3, fontWeight: 900 }}
            >
              Back to login
            </Button>
          </>
        ) : (
          <>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="#64748b">
              Finishing sign in...
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}