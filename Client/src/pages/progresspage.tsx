import React from "react";
import { Box, Container, Typography } from "@mui/material";

const ProgressPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#0f172a",
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