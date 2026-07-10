import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "../contexts/AuthContext";

function DemoBanner() {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        bgcolor: "#0f172a",
        color: "#fff",
        px: { xs: 2, md: 3 },
        py: 1.25,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 1.5, md: 3 },
        flexWrap: "wrap",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <LockOutlinedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
        <Typography fontSize={13} fontWeight={700} color="#cbd5e1">
          Demo mode — you're viewing placeholder data
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          component={RouterLink}
          to="/auth?mode=login"
          size="small"
          variant="outlined"
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            fontSize: 12,
            textTransform: "none",
            color: "#94a3b8",
            borderColor: "rgba(255,255,255,0.18)",
            py: 0.4,
            px: 1.5,
            "&:hover": { borderColor: "#cbd5e1", color: "#fff", bgcolor: "transparent" },
          }}
        >
          Sign in
        </Button>
        <Button
          component={RouterLink}
          to="/auth?mode=signup"
          size="small"
          variant="contained"
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            fontSize: 12,
            textTransform: "none",
            bgcolor: "#38bdf8",
            color: "#0f172a",
            py: 0.4,
            px: 1.5,
            boxShadow: "none",
            "&:hover": { bgcolor: "#7dd3fc", boxShadow: "none" },
          }}
        >
          Get started free
        </Button>
      </Stack>
    </Box>
  );
}

type Props = { children: React.ReactNode };

export default function DemoRoute({ children }: Props) {
  const { session, loading } = useAuth();

  if (loading) return null;

  return (
    <>
      {!session && <DemoBanner />}
      {children}
    </>
  );
}
