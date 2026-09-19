import React, { Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  Box,
  CssBaseline,
  GlobalStyles,
} from "@mui/material";

import { HelmetProvider } from "react-helmet-async";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DemoRoute from "./components/DemoRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { PageLoader } from "./components/Loading";

import { AuthProvider } from "./contexts/AuthContext";

// Home stays in the main bundle
import Home from "./pages/Home";

/*
 * Other pages are lazy-loaded so they are only downloaded
 * when the user actually visits them.
 */

const AuthPage = React.lazy(() => import("./pages/AuthPage"));

const AuthCallback = React.lazy(
  () => import("./pages/AuthCallback")
);

const DailyCheckIn = React.lazy(
  () => import("./pages/DailyCheckIn")
);

const Dashboard = React.lazy(
  () => import("./pages/Dashboard")
);

// NEW: Progress page
const ProgressPage = React.lazy(
  () => import("./pages/ProgressPage")
);

const SportsHome = React.lazy(
  () => import("./pages/SportsHome")
);

const SportsListPage = React.lazy(
  () => import("./pages/SportsListPage")
);

const ProfilePage = React.lazy(
  () => import("./pages/ProfilePage")
);

const OnboardingSurvey = React.lazy(
  () => import("./pages/OnboardingSurvey")
);

const HealthPage = React.lazy(
  () => import("./pages/HealthPage")
);

const WorkoutPage = React.lazy(
  () => import("./pages/WorkoutPage")
);

const NutritionPage = React.lazy(
  () => import("./pages/NutritionPage")
);

const NotFoundPage = React.lazy(
  () => import("./pages/NotFoundPage")
);

const ResetPasswordPage = React.lazy(
  () => import("./pages/ResetPasswordPage")
);

const MyWorkoutPlan = React.lazy(
  () => import("./pages/MyWorkoutPlan")
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <>
        <CssBaseline />

        <GlobalStyles
          styles={{
            ":root": {
              "--app-header-h": "64px",
            },

            "@media (min-width:900px)": {
              ":root": {
                "--app-header-h": "72px",
              },
            },

            html: {
              minHeight: "100%",
              overflowX: "hidden",
              scrollBehavior: "smooth",
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

            ":focus-visible": {
              outline: "2px solid #2563eb",
              outlineOffset: "2px",
              borderRadius: "6px",
            },

            "@media (prefers-reduced-motion: reduce)": {
              html: {
                scrollBehavior: "auto",
              },

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

              {/* Skip navigation link */}
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

                  "&:focus": {
                    top: 8,
                  },
                }}
              >
                Skip to main content
              </Box>

              <Header />

              <Box
                component="main"
                id="main-content"
                tabIndex={-1}
                sx={{
                  flex: 1,
                  width: "100%",
                  outline: "none",
                }}
              >
                <Suspense
                  fallback={
                    <PageLoader
                      minHeight="70vh"
                      label="Loading"
                    />
                  }
                >
                  <Routes>
                    {/* HOME */}
                    <Route
                      path="/"
                      element={<Home />}
                    />

                    {/* AUTH */}
                    <Route
                      path="/auth"
                      element={<AuthPage />}
                    />

                    <Route
                      path="/auth/callback"
                      element={<AuthCallback />}
                    />

                    <Route
                      path="/reset-password"
                      element={<ResetPasswordPage />}
                    />

                    {/* SPORTS AI */}
                    <Route
                      path="/sports"
                      element={
                        <DemoRoute>
                          <SportsHome />
                        </DemoRoute>
                      }
                    />

                    {/* SPORTS MATCH */}
                    <Route
                      path="/sports-list"
                      element={
                        <DemoRoute>
                          <SportsListPage />
                        </DemoRoute>
                      }
                    />

                    {/* ONBOARDING */}
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <OnboardingSurvey />
                        </ProtectedRoute>
                      }
                    />

                    {/* WORKOUT PLAN */}
                    <Route
                      path="/my-workout-plan"
                      element={
                        <ProtectedRoute>
                          <MyWorkoutPlan />
                        </ProtectedRoute>
                      }
                    />

                    {/* DASHBOARD */}
                    <Route
                      path="/dashboard"
                      element={
                        <DemoRoute>
                          <Dashboard />
                        </DemoRoute>
                      }
                    />

                    {/* PROGRESS - NEW */}
                    <Route
                      path="/progress"
                      element={
                        <DemoRoute>
                          <ProgressPage />
                        </DemoRoute>
                      }
                    />

                    {/* DAILY CHECK-IN */}
                    <Route
                      path="/daily-check-in"
                      element={
                        <ProtectedRoute>
                          <DailyCheckIn />
                        </ProtectedRoute>
                      }
                    />

                    {/* PROFILE */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* HEALTH */}
                    <Route
                      path="/health"
                      element={
                        <DemoRoute>
                          <HealthPage />
                        </DemoRoute>
                      }
                    >
                      <Route
                        index
                        element={
                          <Navigate
                            to="/health/workout"
                            replace
                          />
                        }
                      />

                      <Route
                        path="workout"
                        element={<WorkoutPage />}
                      />

                      <Route
                        path="nutrition"
                        element={<NutritionPage />}
                      />
                    </Route>

                    {/* OLD MENTAL HEALTH URL */}
                    <Route
                      path="/mental-health"
                      element={
                        <Navigate
                          to="/sports"
                          replace
                        />
                      }
                    />

                    {/* 404 */}
                    <Route
                      path="*"
                      element={<NotFoundPage />}
                    />
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