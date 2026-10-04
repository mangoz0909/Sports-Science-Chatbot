import { Box, Container, Typography, Chip } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function HealthPage() {
  return (
    <Box sx={{ bgcolor: "#f8fafc" }}>
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3 } }}>
          <Chip label="Health & Performance" sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 900, mb: 1.5 }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 950, letterSpacing: -0.8, color: "#0f172a", fontSize: { xs: "1.5rem", md: "2.6rem" }, mb: 0.5 }}>
            Your Nutrition Plan
          </Typography>
          <Typography color="#64748b">
            AI-generated nutrition plans personalised to your profile and daily check-in data.
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
