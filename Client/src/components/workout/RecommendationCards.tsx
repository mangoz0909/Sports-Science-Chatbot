import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import type { Recommendation } from "../../lib/workoutPlan";

type Props = {
  recommendations: Recommendation[];
  onStart: (typeId: string) => void;
  dayLabel: string;
};

/**
 * What to train on the selected day, ranked by how recovered each muscle
 * group is. The percentages are a recovery split, not a prediction — the
 * reason line under each one says what drove it, so the number is never the
 * only thing on offer.
 */
export default function RecommendationCards({
  recommendations,
  onStart,
  dayLabel,
}: Props) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={800}>
        What are you training {dayLabel}?
      </Typography>

      <Typography color="text.secondary" mt={0.5} mb={2.5}>
        Ranked by how long each muscle group has had to recover.
      </Typography>

      <Grid container spacing={2}>
        {recommendations.map((entry) => (
          <Grid item xs={12} sm={6} md={4} key={entry.type.id}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
                transition: "border-color 200ms ease, box-shadow 200ms ease",

                "&:hover": {
                  borderColor: entry.type.color,
                  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                },
              }}
            >
              <Box sx={{ height: 6, bgcolor: entry.type.color }} />

              <CardContent
                sx={{
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                >
                  <Typography variant="h6" fontWeight={800}>
                    {entry.type.name}
                  </Typography>

                  <Typography
                    fontWeight={900}
                    fontSize={24}
                    color={entry.type.color}
                  >
                    {entry.percent}%
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={entry.percent}
                  sx={{
                    my: 1.5,
                    height: 7,
                    borderRadius: 10,
                    bgcolor: "#eef2f7",

                    "& .MuiLinearProgress-bar": {
                      bgcolor: entry.type.color,
                      borderRadius: 10,
                    },
                  }}
                />

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {entry.reason}
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => onStart(entry.type.id)}
                  sx={{
                    mt: "auto",
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: 2,
                    color: "#0f172a",
                    borderColor: "#cbd5e1",

                    "&:hover": {
                      borderColor: entry.type.color,
                      bgcolor: "#f8fafc",
                    },
                  }}
                >
                  Start {entry.type.name}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
