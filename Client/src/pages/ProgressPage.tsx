import React from "react";
import { Box, Container, Typography } from "@mui/material";

const ProgressPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Typography
          component="h1"
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.03em",
            mb: 1,
          }}
        >
          Your Progress
        </Typography>

        <Typography
          sx={{
            color: "#64748b",
            fontSize: "1.1rem",
          }}
        >
          Track your training, recovery, and athletic performance over time.
        </Typography>
      </Container>
    </Box>
  );
};

export default ProgressPage;