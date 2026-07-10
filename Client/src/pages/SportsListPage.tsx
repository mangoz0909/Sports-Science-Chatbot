import React from "react";
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

type SportsFinderProps = {
  compact?: boolean;
};

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

type PuterChatResponse =
  | string
  | {
      text?: string;
      message?: {
        content?: Array<{ text?: string }> | string;
      };
    };

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat?: (
          prompt: string,
          options?: { model?: string }
        ) => Promise<PuterChatResponse>;
      };
    };
  }
}

const PUTER_SCRIPT_ID = "puter-js-v2";

function loadPuterScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.puter?.ai?.chat) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      PUTER_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Puter.js.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = PUTER_SCRIPT_ID;
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter.js."));
    document.body.appendChild(script);
  });
}

function extractPuterText(response: PuterChatResponse) {
  if (typeof response === "string") return response;
  if (response?.text) return response.text;

  const content = response?.message?.content;

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text)
      .filter(Boolean)
      .join("\n");
  }

  return "No response received.";
}

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
      await loadPuterScript();

      if (!window.puter?.ai?.chat) {
        throw new Error("Puter AI is unavailable.");
      }

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

      const response = await window.puter.ai.chat(prompt, {
        model: "claude-haiku-4-5",
      });

      setAiMatches(extractPuterText(response));
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
                    borderRadius: 3,
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    whiteSpace: "pre-line",
                  }}
                >
                  <Typography fontWeight={950} color="#1d4ed8" sx={{ mb: 1 }}>
                    AI Sport Recommendations
                  </Typography>

                  <Typography color="#475569" lineHeight={1.75}>
                    {aiMatches}
                  </Typography>
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
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