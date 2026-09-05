import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, GlobalStyles } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DemoRoute from "./components/DemoRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { PageLoader } from "./components/Loading";
import { AuthProvider } from "./contexts/AuthContext";

// Home is the landing page and the most common entry point, so it stays in the
// main bundle — code-splitting it would only add a round trip before first
// paint.
import Home from "./pages/Home";

/*
 * Every other route is loaded on demand.
 *
 * All fifteen pages used to be static imports, so a visitor who only ever saw
 * the landing page still downloaded recharts, framer-motion, the whole MUI
 * surface and every authenticated screen — one 1.15 MB chunk before anything
 * rendered. Splitting on the route boundary means the dashboard's charting
 * library arrives when someone opens the dashboard.
 *
 * Safe for SEO: scripts/prerender.js waits for each route's own <h1> and
 * canonical tag rather than a timer, so it captures the resolved page, not the
 * Suspense fallback.
 */
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));
const DailyCheckIn = React.lazy(() => import("./pages/DailyCheckIn"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const SportsHome = React.lazy(() => import("./pages/SportsHome"));
const SportsListPage = React.lazy(() => import("./pages/SportsListPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const OnboardingSurvey = React.lazy(() => import("./pages/OnboardingSurvey"));
const HealthPage = React.lazy(() => import("./pages/HealthPage"));
const WorkoutPage = React.lazy(() => import("./pages/WorkoutPage"));
const NutritionPage = React.lazy(() => import("./pages/NutritionPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));

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
          <Suspense fallback={<PageLoader minHeight="70vh" label="Loading" />}>
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
          </Suspense>
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