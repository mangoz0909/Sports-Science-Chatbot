import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, GlobalStyles } from "@mui/material";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DemoRoute from "./components/DemoRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";

import DailyCheckIn from "./pages/DailyCheckIn";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import SportsHome from "./pages/SportsHome";
import SportsListPage from "./pages/SportsListPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingSurvey from "./pages/OnboardingSurvey";
import HealthPage from "./pages/HealthPage";
import WorkoutPage from "./pages/WorkoutPage";
import NutritionPage from "./pages/NutritionPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const App: React.FC = () => {
  return (
    <>
      <CssBaseline />

      <GlobalStyles
        styles={{
          html: {
            minHeight: "100%",
            overflowX: "hidden",
            scrollBehavior: "smooth",
          },
          body: {
            minHeight: "100%",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
            backgroundColor: "#f8fafc",
            color: "#0f172a",
          },
          "#root": {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          },
          "*": {
            boxSizing: "border-box",
          },
          "img, svg, video, canvas": {
            maxWidth: "100%",
          },
          a: {
            textDecoration: "none",
          },
        }}
      />

      <BrowserRouter>
        <AuthProvider>
        <ErrorBoundary>
        <ScrollToTop />
        <Header />

        <Box component="main" sx={{ flex: 1, width: "100%" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/sports"
              element={
                <DemoRoute>
                  <SportsHome />
                </DemoRoute>
              }
            />
            <Route
              path="/sports-list"
              element={
                <DemoRoute>
                  <SportsListPage />
                </DemoRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingSurvey />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <DemoRoute>
                  <Dashboard />
                </DemoRoute>
              }
            />

            <Route
              path="/daily-check-in"
              element={
                <ProtectedRoute>
                  <DailyCheckIn />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/health"
              element={
                <DemoRoute>
                  <HealthPage />
                </DemoRoute>
              }
            >
              <Route index element={<Navigate to="/health/workout" replace />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="nutrition" element={<NutritionPage />} />
            </Route>

            <Route
              path="/mental-health"
              element={
                <DemoRoute>
                  <SportsHome />
                </DemoRoute>
              }
            />

            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>

        <Footer />
        </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
};

export default App;