import React from "react";
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
import { Sport, sports } from "../data/sportsData";

type SportsFinderProps = {
  compact?: boolean;
};

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
        chat?: (prompt: string, options?: { model?: string }) => Promise<PuterChatResponse>;
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

    const existingScript = document.getElementById(PUTER_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Puter.js.")), {
        once: true,
      });
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
    return content.map((item) => item.text).filter(Boolean).join("\n");
  }

  return "No response received.";
}

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
    description: "Do you enjoy hand-eye coordination and technical skill?",
  },
] as const;

type SurveyKey = (typeof questions)[number]["key"];
type SurveyAnswers = Record<SurveyKey, number>;

const defaultAnswers: SurveyAnswers = {
  teamwork: 5,
  intensity: 5,
  contact: 3,
  coordination: 7,
};

function getSportProfile(sport: Sport): SurveyAnswers {
  const name = sport.name.toLowerCase();
  const category = sport.category.toLowerCase();
  const tags = sport.similarityTags.join(" ").toLowerCase();
  const text = `${name} ${category} ${tags}`;

  return {
    teamwork:
      text.includes("team") ||
      text.includes("football") ||
      text.includes("basketball") ||
      text.includes("soccer")
        ? 9
        : 3,

    intensity:
      text.includes("running") ||
      text.includes("football") ||
      text.includes("basketball") ||
      text.includes("soccer") ||
      text.includes("swimming")
        ? 9
        : 6,

    contact:
      text.includes("football") || text.includes("rugby") || text.includes("wrestling")
        ? 9
        : text.includes("basketball") || text.includes("soccer")
        ? 5
        : 2,

    coordination:
      text.includes("tennis") ||
      text.includes("baseball") ||
      text.includes("golf") ||
      text.includes("badminton") ||
      text.includes("table tennis")
        ? 9
        : 6,
  };
}

function surveyMatchScore(answers: SurveyAnswers, profile: SurveyAnswers) {
  const keys = Object.keys(answers) as SurveyKey[];

  const totalDifference = keys.reduce((sum, key) => {
    return sum + Math.abs(answers[key] - profile[key]);
  }, 0);

  const maxDifference = keys.length * 9;

  return Math.round((1 - totalDifference / maxDifference) * 100);
}

export function SportsFinder({ compact = false }: SportsFinderProps) {
  const [answers, setAnswers] = React.useState<SurveyAnswers>(defaultAnswers);
  const [pastSports, setPastSports] = React.useState("");
  const [aiMatches, setAiMatches] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);

  const rankedSports = React.useMemo(() => {
    return sports
      .map((sport) => {
        const profile = getSportProfile(sport);
        const matchScore = surveyMatchScore(answers, profile);

        const pastSportsBonus = pastSports
          .toLowerCase()
          .split(",")
          .some((pastSport) => {
            const trimmed = pastSport.trim();
            if (!trimmed) return false;

            return (
              sport.name.toLowerCase().includes(trimmed) ||
              sport.similarityTags.join(" ").toLowerCase().includes(trimmed) ||
              sport.category.toLowerCase().includes(trimmed)
            );
          })
          ? 8
          : 0;

        return {
          ...sport,
          matchScore: Math.min(100, matchScore + pastSportsBonus),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));
  }, [answers, pastSports]);

  const visibleSports = rankedSports.slice(0, compact ? 5 : 9);

  const generateAiMatches = async () => {
    setAiLoading(true);
    setError("");
    setAiMatches("");
    setShowResults(false);

    try {
      await loadPuterScript();

      if (!window.puter?.ai?.chat) {
        throw new Error("Puter AI is unavailable.");
      }

      const topSports = visibleSports
        .slice(0, 6)
        .map((sport) => `${sport.name} (${sport.matchScore}%)`)
        .join(", ");

      const prompt = `
You are a sports matching assistant.

The user has played these sports before:
${pastSports || "No past sports listed"}

Survey answers from 1-10:
Teamwork: ${answers.teamwork}
Intensity: ${answers.intensity}
Contact comfort: ${answers.contact}
Coordination/technical skill: ${answers.coordination}

Current algorithmic top matches:
${topSports}

Give the user:
1. Top 3 recommended sports
2. A short reason for each
3. One sport they might surprisingly enjoy
4. A beginner next step

Keep it concise and student-friendly.
`;

      const response = await window.puter.ai.chat(prompt, {
        model: "claude-haiku-4-5",
      });

      setAiMatches(extractPuterText(response));
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI matches.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box className={compact ? "sports-finder-compact" : undefined}>
      <Stack spacing={compact ? 2 : 3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "#e0f2fe",
              color: "#0284c7",
            }}
          >
            <SportsTennisIcon />
          </Box>

          <Box>
            <Typography variant={compact ? "h6" : "h4"} fontWeight={950}>
              Sports Match Survey
            </Typography>
            <Typography color="#64748b" fontSize={compact ? 13 : 15}>
              Answer a short survey, add past sports, and generate personalized matches.
            </Typography>
          </Box>
        </Stack>

        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <CardContent sx={{ p: compact ? 2 : 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Sports you have played before"
                placeholder="Example: tennis, badminton, soccer"
                value={pastSports}
                onChange={(event) => {
                  setShowResults(false);
                  setAiMatches("");
                  setPastSports(event.target.value);
                }}
                fullWidth
              />

              <Grid container spacing={compact ? 1.5 : 2.5}>
                {questions.map((question) => (
                  <Grid item xs={12} md={compact ? 12 : 6} key={question.key}>
                    <Stack spacing={0.7}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography fontWeight={900}>{question.label}</Typography>
                          <Typography color="#64748b" fontSize={13}>
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
                          setShowResults(false);
                          setAiMatches("");

                          setAnswers((prev) => ({
                            ...prev,
                            [question.key]: value as number,
                          }));
                        }}
                      />
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <Button
                variant="contained"
                startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                onClick={generateAiMatches}
                disabled={aiLoading}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 3,
                  bgcolor: "#0f172a",
                  fontWeight: 950,
                  px: 3,
                  py: 1.2,
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
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    whiteSpace: "pre-line",
                  }}
                >
                  <Typography fontWeight={950} color="#1d4ed8" sx={{ mb: 1 }}>
                    AI Match Explanation
                  </Typography>
                  <Typography color="#475569" lineHeight={1.75}>
                    {aiMatches}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {showResults && (
          <Grid container spacing={compact ? 1.2 : 2}>
            {visibleSports.map((sport) => (
              <Grid item xs={12} sm={compact ? 12 : 6} lg={compact ? 12 : 4} key={sport.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                    bgcolor: "#fff",
                  }}
                >
                  <CardContent sx={{ p: compact ? 2 : 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Typography fontSize={compact ? 24 : 32}>{sport.emoji}</Typography>
                        <Box>
                          <Typography fontWeight={950}>{sport.name}</Typography>
                          <Typography color="#64748b" fontSize={13}>
                            {sport.category} • {sport.intensity}
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        size="small"
                        label={`${sport.matchScore}%`}
                        sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 950 }}
                      />
                    </Stack>

                    <Typography sx={{ mt: 1.5 }} color="#475569" fontSize={compact ? 13 : 14} lineHeight={1.65}>
                      {sport.description}
                    </Typography>

                    {!compact && (
                      <>
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                          {sport.scienceFocus.map((item) => (
                            <Chip key={item} size="small" label={item} sx={{ bgcolor: "#f1f5f9", fontWeight: 800 }} />
                          ))}
                        </Stack>

                        <Typography sx={{ mt: 1.5 }} color="#0f172a" fontSize={14} fontWeight={850}>
                          Starter drill: {sport.beginnerDrill}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Box>
  );
}

export default function SportsListPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Chip
            label="Sport Matching Engine"
            sx={{ width: "fit-content", bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 950 }}
          />

          <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -0.9 }}>
            Find your best-fit sport.
          </Typography>

          <Typography color="#64748b" maxWidth={760} lineHeight={1.8}>
            Add sports you have played before, answer a short preference survey, and let AI explain which sports may fit you best.
          </Typography>
        </Stack>

        <SportsFinder />
      </Container>
    </Box>
  );
}