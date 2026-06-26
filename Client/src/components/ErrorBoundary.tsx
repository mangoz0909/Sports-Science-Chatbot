import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Uncaught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
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
              sx={{ fontSize: "4rem", fontWeight: 950, color: "#e2e8f0", lineHeight: 1 }}
            >
              Oops
            </Typography>
            <Typography variant="h5" fontWeight={950} sx={{ mt: 2, color: "#0f172a" }}>
              Something went wrong
            </Typography>
            <Typography color="#64748b" sx={{ mt: 1.5, lineHeight: 1.8 }}>
              An unexpected error occurred. Your data is safe — try going back to the home page.
            </Typography>
            {this.state.message && (
              <Typography
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1,
                  bgcolor: "#fee2e2",
                  borderRadius: 2,
                  fontSize: 13,
                  color: "#991b1b",
                  fontFamily: "monospace",
                }}
              >
                {this.state.message}
              </Typography>
            )}
            <Button
              onClick={this.handleReset}
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

    return this.props.children;
  }
}
