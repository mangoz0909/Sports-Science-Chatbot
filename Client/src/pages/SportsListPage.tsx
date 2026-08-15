import React, { ReactNode } from "react";
import Seo from "../components/Seo";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { getUserPreferences } from "../services/preferencesService";
import { supabase } from "../lib/supabaseClient";

type SportsFinderProps = {
  compact?: boolean;
};
function formatAiMatchResponse(content: string): ReactNode {
  const lines = content.split("\n");

  return (
    <Stack spacing={1.2}>
      {lines.map((raw, index) => {
        const line = raw.trim();

        if (!line) return null;

        // Markdown headings
        if (line.startsWith("### ")) {
          return (
            <Typography
              key={index}
              fontWeight={900}
              fontSize={16}
              color="#0f172a"
              sx={{ mt: 1.5 }}
            >
              {formatInlineText(line.slice(4))}
            </Typography>
          );
        }

        if (line.startsWith("## ")) {
          return (
            <Typography
              key={index}
              fontWeight={950}
              fontSize={18}
              color="#0f172a"
              sx={{ mt: 1.5 }}
            >
              {formatInlineText(line.slice(3))}
            </Typography>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <Typography
              key={index}
              fontWeight={950}
              fontSize={20}
              color="#0f172a"
              sx={{ mt: 1 }}
            >
              {formatInlineText(line.slice(2))}
            </Typography>
          );
        }

        // Numbered recommendations
        const numbered = line.match(/^(\d+)\.\s+(.*)$/);

        if (numbered) {
          return (
            <Stack
              key={index}
              direction="row"
              spacing={1.3}
              alignItems="flex-start"
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #dbeafe",
                borderRadius: 2.5,
                px: 1.5,
                py: 1.3,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: "#dbeafe",
                  color: "#1d4ed8",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 950,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {numbered[1]}
              </Box>

              <Typography
                component="div"
                color="#334155"
                fontWeight={700}
                lineHeight={1.7}
              >
                {formatInlineText(numbered[2])}
              </Typography>
            </Stack>
          );
        }

        // Bullet points
        if (/^[-*•]\s+/.test(line)) {
          const text = line.replace(/^[-*•]\s+/, "");

          return (
            <Stack
              key={index}
              direction="row"
              spacing={1}
              alignItems="flex-start"
              sx={{ pl: 0.5 }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#3b82f6",
                  mt: "9px",
                  flexShrink: 0,
                }}
              />

              <Typography
                component="div"
                color="#475569"
                lineHeight={1.75}
              >
                {formatInlineText(text)}
              </Typography>
            </Stack>
          );
        }

        return (
          <Typography
            key={index}
            component="div"
            color="#475569"
            lineHeight={1.75}
          >
            {formatInlineText(line)}
          </Typography>
        );
      })}
    </Stack>
  );
}

function formatInlineText(text: string): ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Box
              key={index}
              component="span"
              sx={{
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {part.slice(2, -2)}
            </Box>
          );
        }

        return part;
      })}
    </>
  );
}
type SurveyKey = "teamwork" | "intensity" | "contact" | "coordination";
type SurveyAnswers = Record<SurveyKey, number>;

const defaultAnswers: SurveyAnswers = {
  teamwork: 5,
  intensity: 5,
  contact: 3,
  coordination: 7,
};

const questions = [
  {
    key: "teamwork",
    label: "Team vs Solo",
    description: "Do you prefer team-based sports?",
  },
  {
    key: "intensity",
    label: "Intensity",
    description: "How physically intense should the sport be?",
  },
  {
    key: "contact",
    label: "Contact",
    description: "Are you comfortable with contact or collision?",
  },
  {
    key: "coordination",
    label: "Skill & Coordination",
    description: "Do you enjoy technical skill and hand-eye coordination?",
  },
] as const;

const SPORTS_MATCH_SYSTEM_PROMPT =
  "You are SportLab's sports matching coach. Recommend sports based on the athlete's profile and preferences like an experienced coach, not a rigid scoring algorithm.";

export function SportsFinder({ compact = false }: SportsFinderProps) {
  const [answers, setAnswers] = React.useState<SurveyAnswers>(defaultAnswers);
  const [pastSports, setPastSports] = React.useState("");
  const [aiMatches, setAiMatches] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [loadingPrefs, setLoadingPrefs] = React.useState(true);
  const [error, setError] = React.useState("");
  const [prefs, setPrefs] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadPreferences() {
      try {
        const data = await getUserPreferences();

        if (data) {
          setPrefs(data);

          if (data.primary_sport) {
            setPastSports(data.primary_sport);
          }
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setLoadingPrefs(false);
      }
    }

    loadPreferences();
  }, []);

  const generateAiMatches = async () => {
    setAiLoading(true);
    setError("");
    setAiMatches("");

    try {
      const prompt = `
You are SportLab's sports matching coach.

Use the user's profile and preferences to recommend sports. Do not use a rigid scoring algorithm. Think like a coach: consider goals, current sport, experience, injury concerns, training style, sleep, and preferences.

User profile:
Primary sport: ${prefs?.primary_sport || pastSports || "Not provided"}
Experience level: ${prefs?.experience_level || "Not provided"}
Main goal: ${prefs?.main_goal || "Not provided"}
Competition level: ${prefs?.competition_level || "Not provided"}
Training days per week: ${prefs?.training_days || "Not provided"}
Injury areas: ${prefs?.injury_areas || "Not provided"}
Training priorities: ${prefs?.priorities || "Not provided"}
Sleep: ${prefs?.sleep_range || "Not provided"}
Athlete type: ${prefs?.athlete_type || "Not provided"}

Extra preference sliders:
Team preference: ${answers.teamwork}/10
Intensity preference: ${answers.intensity}/10
Contact comfort: ${answers.contact}/10
Coordination preference: ${answers.coordination}/10

Return:
1. Top 5 recommended sports
2. Match percentage for each
3. Short explanation for each
4. One surprising sport suggestion
5. One next step for the user

Keep it concise, practical, and student-friendly.
`;

      const { data, error: fnError } = await supabase.functions.invoke("ai-complete", {
        body: {
          prompt,
          systemPrompt: SPORTS_MATCH_SYSTEM_PROMPT,
          maxTokens: 900,
          temperature: 0.7,
        },
      });

      if (fnError) throw fnError;

      const result = data?.result;
      if (typeof result !== "string" || !result.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setAiMatches(result.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate AI matches."
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box className={compact ? "sports-finder-compact" : undefined}>
      <Stack spacing={{ xs: 2, md: compact ? 2 : 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: { xs: 38, md: 44 },
              height: { xs: 38, md: 44 },
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "#e0f2fe",
              color: "#0284c7",
            }}
          >
            <SportsTennisIcon fontSize="small" />
          </Box>

          <Box>
            <Typography
              variant={compact ? "h6" : "h4"}
              fontWeight={950}
              sx={{
                fontSize: {
                  xs: "1.45rem",
                  md: compact ? "1.25rem" : "2.125rem",
                },
              }}
            >
              Sports Match
            </Typography>
            <Typography
              color="#64748b"
              fontSize={{ xs: 12.5, md: compact ? 13 : 15 }}
            >
              AI uses your survey and preferences to recommend sports.
            </Typography>
          </Box>
        </Stack>

        {loadingPrefs && (
          <Alert severity="info">Loading your saved sport preferences...</Alert>
        )}

        {!loadingPrefs && prefs?.primary_sport && (
          <Alert severity="success">
            Loaded from your survey: <b>{prefs.primary_sport}</b>
            {prefs.main_goal ? (
              <>
                {" "}
                • Goal: <b>{prefs.main_goal}</b>
              </>
            ) : null}
          </Alert>
        )}

        {!loadingPrefs && !prefs && (
          <Alert severity="warning">
            No saved survey found yet. You can still type your sport below.
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            borderRadius: { xs: 3, md: 4 },
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: compact ? 2 : 3 } }}>
            <Stack spacing={{ xs: 2, md: 2.5 }}>
              <TextField
                label="Your sport"
                placeholder="Example: tennis, basketball, soccer"
                value={pastSports}
                onChange={(event) => {
                  setAiMatches("");
                  setPastSports(event.target.value);
                }}
                fullWidth
                size="small"
              />

              <Grid container spacing={{ xs: 1.5, md: compact ? 1.5 : 2.5 }}>
                {questions.map((question) => (
                  <Grid item xs={12} md={compact ? 12 : 6} key={question.key}>
                    <Stack spacing={{ xs: 0.35, md: 0.7 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Box>
                          <Typography
                            fontWeight={900}
                            sx={{ fontSize: { xs: 14, md: 16 } }}
                          >
                            {question.label}
                          </Typography>
                          <Typography
                            color="#64748b"
                            fontSize={{ xs: 11.5, md: 13 }}
                          >
                            {question.description}
                          </Typography>
                        </Box>

                        <Chip
                          label={answers[question.key]}
                          size="small"
                          sx={{
                            bgcolor: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: 950,
                            minWidth: { xs: 26, md: 34 },
                            height: { xs: 24, md: 30 },
                            "& .MuiChip-label": {
                              fontSize: { xs: 11, md: 13 },
                              px: { xs: 0.8, md: 1 },
                            },
                          }}
                        />
                      </Stack>

                      <Slider
                        value={answers[question.key]}
                        // Without this every slider announced as an unnamed
                        // "5 out of 10"; the visible label is a sibling, not
                        // a <label>, so it never reached the control.
                        aria-label={question.label}
                        valueLabelDisplay="auto"
                        min={1}
                        max={10}
                        step={1}
                        marks
                        onChange={(_, value) => {
                          setAiMatches("");

                          setAnswers((prev) => ({
                            ...prev,
                            [question.key]: value as number,
                          }));
                        }}
                        sx={{
                          width: {
                            xs: "78%",
                            md: "100%",
                          },
                          mx: "auto",
                          mt: { xs: 0.5, md: 1 },

                          "& .MuiSlider-thumb": {
                            width: {
                              xs: 16,
                              md: 24,
                            },
                            height: {
                              xs: 16,
                              md: 24,
                            },
                          },

                          "& .MuiSlider-track": {
                            height: {
                              xs: 4,
                              md: 6,
                            },
                          },

                          "& .MuiSlider-rail": {
                            height: {
                              xs: 4,
                              md: 6,
                            },
                          },

                          "& .MuiSlider-mark": {
                            width: {
                              xs: 3,
                              md: 4,
                            },
                            height: {
                              xs: 3,
                              md: 4,
                            },
                          },
                        }}
                      />
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <Button
                variant="contained"
                startIcon={
                  aiLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                onClick={generateAiMatches}
                disabled={aiLoading}
                sx={{
                  alignSelf: { xs: "stretch", sm: "flex-start" },
                  borderRadius: 3,
                  bgcolor: "#0f172a",
                  fontWeight: 950,
                  px: 3,
                  py: { xs: 1, md: 1.2 },
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#1e293b",
                    boxShadow: "none",
                  },
                }}
              >
                {aiLoading ? "Generating..." : "Generate AI Matches"}
              </Button>

              {error && <Alert severity="error">{error}</Alert>}

              {aiMatches && (
  <Box
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 4,
      bgcolor: "#f8fbff",
      border: "1px solid #bfdbfe",
    }}
  >
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="center"
      sx={{ mb: 2 }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          bgcolor: "#dbeafe",
          fontSize: 19,
        }}
      >
        ✨
      </Box>

      <Box>
        <Typography
          fontWeight={950}
          color="#1e3a8a"
          fontSize={17}
        >
          AI Sports Recommendations
        </Typography>

        <Typography
          color="#64748b"
          fontSize={12.5}
        >
          Personalized from your profile and answers
        </Typography>
      </Box>
    </Stack>

    {formatAiMatchResponse(aiMatches)}
  </Box>
)}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default function SportsListPage() {
  return (
    <Box sx={{ bgcolor: "#f8fafc" }}>
      <Seo
        title="Find Your Sport"
        description="Not sure which sport suits you? Answer 4 quick questions and get a personalised sport match powered by AI."
        path="/sports-list"
      />
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 2.5, md: 5 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Stack spacing={1.2} sx={{ mb: { xs: 2, md: 3 } }}>
          <Chip
            label="AI Sport Matching"
            sx={{
              width: "fit-content",
              bgcolor: "#e0f2fe",
              color: "#0369a1",
              fontWeight: 950,
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              letterSpacing: -0.9,
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            Find your best-fit sport.
          </Typography>

          <Typography color="#64748b" maxWidth={760} lineHeight={1.8}>
            SportLab uses AI to recommend sports based on your onboarding
            survey, goals, preferences, and slider answers.
          </Typography>
        </Stack>

        <SportsFinder />
      </Container>
    </Box>
  );
}