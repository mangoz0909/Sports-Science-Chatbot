import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";

interface State {
  hasError: boolean;
  /** A lazy route chunk failed to download — almost always a deploy that
   * replaced the files this tab was built against. Reloading fixes it. */
  isChunkError: boolean;
}

interface Props {
  children: React.ReactNode;
  /** When this changes (e.g. the route), a caught error is cleared so
   * navigating away from a broken page recovers without a reload. */
  resetKey?: string;
}

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i;

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, isChunkError: CHUNK_ERROR.test(message) };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, isChunkError: false });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Uncaught error:", error, info);
  }

  handleReset = () => {
    if (this.state.isChunkError) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, isChunkError: false });
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
              {this.state.isChunkError ? "SportLab AI was just updated" : "Something went wrong"}
            </Typography>
            <Typography color="#64748b" sx={{ mt: 1.5, lineHeight: 1.8 }}>
              {this.state.isChunkError
                ? "This page needs the latest version. Reload to continue — your data is safe."
                : "An unexpected error occurred. Your data is safe — try going back to the home page."}
            </Typography>
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
              {this.state.isChunkError ? "Reload page" : "Back to Home"}
            </Button>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}
