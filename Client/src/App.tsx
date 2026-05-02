import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, GlobalStyles } from "@mui/material";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SportsHome from "./pages/SportsHome";
import MentalHealthHome from "./pages/MentalHealthHome";

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
            <Route path="/mental-health" element={<MentalHealthHome />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>

        <Footer />
      </BrowserRouter>
    </>
  );
};

export default App;