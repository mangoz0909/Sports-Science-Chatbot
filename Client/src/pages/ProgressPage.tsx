import React from "react";
import { Box } from "@mui/material";
import MyWorkoutPlan from "./MyWorkoutPlan";

const ProgressPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f8fafc",
      }}
    >
      <MyWorkoutPlan />
    </Box>
  );
};

export default ProgressPage;