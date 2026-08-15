import React from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { syncGoogleProfile } from "../services/profileService";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

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

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("primary_sport, experience_level, main_goal")
          .eq("id", session.user.id)
          .maybeSingle();

        if (cancelled) return;
        if (profileError) throw profileError;

        const needsOnboarding =
          !profile?.primary_sport ||
          !profile?.experience_level ||
          !profile?.main_goal;

        navigate(needsOnboarding ? "/onboarding" : "/dashboard", {
          replace: true,
        });
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
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f8fafc",
        px: 2,
      }}
    >
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