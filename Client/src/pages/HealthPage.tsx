import React from "react";
import { Box, Container, Tab, Tabs, Typography, Chip } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function HealthPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const tabValue = pathname.startsWith("/health/nutrition") ? 1 : 0;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(newValue === 0 ? "/health/workout" : "/health/nutrition");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Box sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 5 }, pb: 0 }}>
          <Chip
            label="Health & Performance"
            sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 900, mb: 1.5 }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              letterSpacing: -0.8,
              color: "#0f172a",
              fontSize: { xs: "1.8rem", md: "2.6rem" },
              mb: 0.5,
            }}
          >
            Your Health Plans
          </Typography>
          <Typography color="#64748b" sx={{ mb: 2 }}>
            AI-generated workout and nutrition plans personalised to your profile and daily check-in data.
          </Typography>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 800,
                fontSize: "0.95rem",
                textTransform: "none",
                minHeight: 48,
                color: "#64748b",
              },
              "& .Mui-selected": { color: "#0284c7" },
              "& .MuiTabs-indicator": { bgcolor: "#0284c7", height: 3 },
            }}
          >
            <Tab
              icon={<FitnessCenterIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Workout Plan"
            />
            <Tab
              icon={<RestaurantMenuIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Nutrition Plan"
            />
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
