import React from "react";
import { Box, Container, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#0a0f1e",
        color: "#fff",
        mt: "auto",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {/* Brand column */}
          <Grid item xs={12} md={4.5}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                component="img"
                src="/sportslab_logo.png"
                alt="SportLab AI"
                sx={{
                  width: 44,
                  height: 44,
                  objectFit: "contain",
                  borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.06)",
                  p: 0.5,
                }}
              />
              <Box>
                <Typography fontWeight={800} fontSize="1.05rem" lineHeight={1.2}>
                  SportLab AI
                </Typography>
                <Typography fontSize={12} sx={{ color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Sports Science Platform
                </Typography>
              </Box>
            </Stack>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.85, fontSize: 14, maxWidth: 380 }}>
              An all-in-one sports science app for AI coaching, sport discovery, athlete
              readiness, recovery tracking, performance analytics, and mental support.
            </Typography>
          </Grid>

          {/* Platform links */}
          <Grid item xs={6} sm={4} md={2.1}>
            <Typography fontWeight={700} fontSize={13} sx={{ mb: 2, color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Platform
            </Typography>
            <Stack spacing={1.25}>
              {[
                { label: "Home", to: "/" },
                { label: "Sports AI", to: "/sports" },
                { label: "Sports Match", to: "/sports-list" },
                { label: "Dashboard", to: "/dashboard" },
              ].map((link) => (
                <Link
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 14,
                    textDecoration: "none",
                    fontWeight: 500,
                    transition: "color 0.15s",
                    "&:hover": { color: "#38bdf8" },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Account links */}
          <Grid item xs={6} sm={4} md={2.1}>
            <Typography fontWeight={700} fontSize={13} sx={{ mb: 2, color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Account
            </Typography>
            <Stack spacing={1.25}>
              {[
                { label: "Profile", to: "/profile" },
                { label: "Check-In", to: "/daily-check-in" },
                { label: "Log in", to: "/auth?mode=login" },
                { label: "Sign up", to: "/auth?mode=signup" },
              ].map((link) => (
                <Link
                  key={link.label}
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 14,
                    textDecoration: "none",
                    fontWeight: 500,
                    transition: "color 0.15s",
                    "&:hover": { color: "#38bdf8" },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Focus blurb */}
          <Grid item xs={12} sm={4} md={3.3}>
            <Typography fontWeight={700} fontSize={13} sx={{ mb: 2, color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              What we cover
            </Typography>
            <Stack spacing={1}>
              {[
                "Training load & readiness",
                "Recovery monitoring",
                "Sport matching engine",
                "Mental performance support",
                "AI-powered coaching",
              ].map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#38bdf8", flexShrink: 0 }} />
                  <Typography fontSize={13} sx={{ color: "rgba(255,255,255,0.55)" }}>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.07)" }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            © {new Date().getFullYear()} SportLab AI. All rights reserved.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            Built for sports science workflows.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
