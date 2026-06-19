import React from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { syncGoogleProfile } from "../services/profileService";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function finishLogin() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/auth?mode=login&error=session_missing", { replace: true });
          return;
        }

        await syncGoogleProfile();
        navigate("/dashboard", { replace: true });
      } catch (err: any) {
        setError(err?.message || "Could not finish Google sign in.");
      }
    }

    finishLogin();
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
          <Alert severity="error">{error}</Alert>
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