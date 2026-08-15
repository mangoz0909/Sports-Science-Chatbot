import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, GlobalStyles } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";

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
    <HelmetProvider>
    <>
      <CssBaseline />

      <GlobalStyles
        styles={{
          ":root": {
            // Sticky elements below the AppBar offset against this instead of
            // hardcoding a magic number that drifts when the header changes.
            "--app-header-h": "64px",
          },
          "@media (min-width:900px)": {
            ":root": { "--app-header-h": "72px" },
          },
          html: {
            minHeight: "100%",
            overflowX: "hidden",
            scrollBehavior: "smooth",
            // Stop iOS inflating text in landscape without disabling zoom.
            WebkitTextSizeAdjust: "100%",
          },
          body: {
            minHeight: "100%",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            WebkitFontSmoothing: "antialiased",
          },
          "#root": {
            minHeight: "100vh",
            // dvh tracks the shrinking viewport as mobile browser chrome hides;
            // the vh line above stays as the fallback for older browsers.
            "@supports (min-height: 100dvh)": {
              minHeight: "100dvh",
            },
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
          // Keyboard users get a visible ring; mouse users don't. Previously
          // native buttons in the chat had no focus indicator at all.
          ":focus-visible": {
            outline: "2px solid #2563eb",
            outlineOffset: "2px",
            borderRadius: "6px",
          },
          "@media (prefers-reduced-motion: reduce)": {
            html: { scrollBehavior: "auto" },
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        }}
      />

      <BrowserRouter>
        <AuthProvider>
        <ErrorBoundary>
        <ScrollToTop />

        {/*
          Keyboard and screen-reader users otherwise tab through the whole
          header on every page before reaching the content. Visually hidden
          until focused, then pinned above the sticky AppBar.
        */}
        <Box
          component="a"
          href="#main-content"
          sx={{
            position: "absolute",
            left: 8,
            top: -80,
            zIndex: 2000,
            px: 2,
            py: 1.25,
            borderRadius: "10px",
            bgcolor: "#0f172a",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            transition: "top 120ms ease-in",
            "&:focus": { top: 8 },
          }}
        >
          Skip to main content
        </Box>

        <Header />

        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{ flex: 1, width: "100%", outline: "none" }}
        >
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

            <Route path="/mental-health" element={<Navigate to="/sports" replace />} />

            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>

        <Footer />
        </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </>
    </HelmetProvider>
  );
};

export default App;