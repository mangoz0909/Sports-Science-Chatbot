import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, GlobalStyles } from "@mui/material";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DailyCheckIn from "./pages/DailyCheckIn";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SportsHome from "./pages/SportsHome";
import SportsListPage from "./pages/SportsListPage";
import MentalHealthHome from "./pages/MentalHealthHome";
import ProfilePage from "./pages/ProfilePage";

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
        <Header />

        <Box component="main" sx={{ flex: 1, width: "100%" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sports" element={<SportsHome />} />
            <Route path="/sports-list" element={<SportsListPage />} />
            <Route path="/mental-health" element={<MentalHealthHome />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/daily-check-in" element={<DailyCheckIn />} />
          </Routes>
        </Box>

        <Footer />
      </BrowserRouter>
    </>
  );
};

export default App;