import React from "react";
import { Box } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "./Loading";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    // A cached session resolves almost instantly, so this stays blank for a
    // moment rather than flashing a spinner on every protected navigation.
    return (
      <Box sx={{ bgcolor: "#f8fafc" }}>
        <PageLoader minHeight="70vh" label="Checking your session" />
      </Box>
    );
  }

  if (!session) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <>{children}</>;
}
