import React from "react";
import { Box } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "./Loading";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

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
    // The page they were opening rides along, so login can return them to it
    // instead of the dashboard.
    return (
      <Navigate
        to="/auth?mode=login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <React.Fragment key={session.user.id}>{children}</React.Fragment>;
}
