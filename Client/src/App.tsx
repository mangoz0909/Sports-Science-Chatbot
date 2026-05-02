import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, GlobalStyles, Box } from "@mui/material";

import Home from "./pages/Home";
import SportsHome from "./pages/SportsHome";
import MentalHealthHome from "./pages/MentalHealthHome";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Footer from "./components/Footer";

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
            overflowX: "hidden",
            margin: 0,
            padding: 0,
            backgroundColor: "#f6f8fc",
          },
          "#root": {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          },
          "*": {
            boxSizing: "border-box",
          },
          "img, video, canvas, svg": {
            maxWidth: "100%",
          },
        }}
      />

      <BrowserRouter>
        <Header />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: "100%",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sports" element={<SportsHome />} />
            <Route path="/mental-health" element={<MentalHealthHome />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Box>

        <Footer />
      </BrowserRouter>
    </>
  );
};

export default App;