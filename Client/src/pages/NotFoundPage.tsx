import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f8fafc",
        px: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            fontSize: { xs: "5rem", md: "8rem" },
            fontWeight: 950,
            lineHeight: 1,
            color: "#e2e8f0",
            letterSpacing: -4,
          }}
        >
          404
        </Typography>
        <Typography
          variant="h4"
          fontWeight={950}
          sx={{ mt: 2, color: "#0f172a", letterSpacing: -0.5 }}
        >
          Page not found
        </Typography>
        <Typography color="#64748b" sx={{ mt: 1.5, lineHeight: 1.8 }}>
          The page you're looking for doesn't exist or may have been moved.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          sx={{
            mt: 4,
            borderRadius: 3,
            bgcolor: "#0f172a",
            fontWeight: 800,
            textTransform: "none",
            px: 3,
            py: 1.25,
            boxShadow: "none",
            "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
          }}
        >
          Back to Home
        </Button>
      </Container>
    </Box>
  );
}
