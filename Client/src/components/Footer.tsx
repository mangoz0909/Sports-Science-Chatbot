import React from "react";
import { Box, Container, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import { Link as RouterLink } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: "#0f172a", color: "#fff", mt: "auto", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4.5}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "#38bdf8", color: "#0f172a" }}>
                <MonitorHeartIcon />
              </Box>
              <Box>
                <Typography fontWeight={950} fontSize="1.15rem">SportLab AI</Typography>
                <Typography fontSize={13} color="rgba(255,255,255,0.64)">Sports science and athlete intelligence</Typography>
              </Box>
            </Stack>
            <Typography sx={{ mt: 2, maxWidth: 520, color: "rgba(255,255,255,0.68)", lineHeight: 1.8 }}>
              An all-in-one sports science app for AI coaching, sport discovery, athlete readiness,
              recovery tracking, performance analytics, and mental support.
            </Typography>
          </Grid>

          <Grid item xs={6} sm={4} md={2.1}>
            <Typography fontWeight={950} sx={{ mb: 1.5, color: "rgba(255,255,255,0.9)" }}>Platform</Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/" color="inherit" underline="hover">Home</Link>
              <Link component={RouterLink} to="/sports" color="inherit" underline="hover">Sports AI</Link>
              <Link component={RouterLink} to="/sports-list" color="inherit" underline="hover">Sports List</Link>
              <Link component={RouterLink} to="/dashboard" color="inherit" underline="hover">Dashboard</Link>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={4} md={2.1}>
            <Typography fontWeight={950} sx={{ mb: 1.5, color: "rgba(255,255,255,0.9)" }}>Account</Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/profile" color="inherit" underline="hover">Profile</Link>
              <Link component={RouterLink} to="/auth?mode=login" color="inherit" underline="hover">Login</Link>
              <Link component={RouterLink} to="/auth?mode=signup" color="inherit" underline="hover">Sign up</Link>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={4} md={3.3}>
            <Typography fontWeight={950} sx={{ mb: 1.5, color: "rgba(255,255,255,0.9)" }}>Focus</Typography>
            <Typography color="rgba(255,255,255,0.68)" lineHeight={1.8}>
              Training load, recovery, readiness, sport matching, athlete profile, AI guidance, and safer wellbeing support.
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Typography color="rgba(255,255,255,0.58)" fontSize={14}>© {new Date().getFullYear()} SportLab AI. All rights reserved.</Typography>
          <Typography color="rgba(255,255,255,0.58)" fontSize={14}>Built for sports science workflows.</Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
