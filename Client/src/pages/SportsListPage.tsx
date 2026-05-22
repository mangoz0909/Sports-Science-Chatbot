import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import { Sport, sports } from "../data/sportsData";

type SportsFinderProps = {
  compact?: boolean;
};

const questions = [
  { key: "teamwork", label: "Teamwork", description: "Do you enjoy team-based sports?" },
  { key: "intensity", label: "Intensity", description: "How physically intense do you want the sport to be?" },
  { key: "contact", label: "Contact", description: "Are you comfortable with contact or collision?" },
  { key: "strategy", label: "Strategy", description: "Do you enjoy tactics and decision-making?" },
  { key: "endurance", label: "Endurance", description: "Do you like long-lasting physical effort?" },
  { key: "speed", label: "Speed", description: "Do you like fast reactions and quick movement?" },
  { key: "coordination", label: "Coordination", description: "Do you like hand-eye coordination skills?" },
  { key: "equipment", label: "Equipment", description: "Are you okay using gear or equipment?" },
] as const;

type SurveyKey = (typeof questions)[number]["key"];
type SurveyAnswers = Record<SurveyKey, number>;

const defaultAnswers: SurveyAnswers = {
  teamwork: 5,
  intensity: 5,
  contact: 5,
  strategy: 5,
  endurance: 5,
  speed: 5,
  coordination: 5,
  equipment: 5,
};

function getSportProfile(sport: Sport): SurveyAnswers {
  const name = sport.name.toLowerCase();
  const category = sport.category.toLowerCase();
  const tags = sport.similarityTags.join(" ").toLowerCase();
  const text = `${name} ${category} ${tags}`;

  return {
    teamwork:
      text.includes("team") || text.includes("football") || text.includes("basketball") || text.includes("soccer")
        ? 9
        : 3,

    intensity:
      text.includes("running") || text.includes("football") || text.includes("basketball") || text.includes("soccer")
        ? 9
        : 6,

    contact:
      text.includes("football") || text.includes("rugby") || text.includes("wrestling")
        ? 9
        : text.includes("basketball") || text.includes("soccer")
        ? 5
        : 2,

    strategy:
      text.includes("tennis") || text.includes("baseball") || text.includes("basketball") || text.includes("soccer")
        ? 8
        : 6,

    endurance:
      text.includes("running") || text.includes("soccer") || text.includes("swimming") || text.includes("cycling")
        ? 9
        : 5,

    speed:
      text.includes("tennis") || text.includes("basketball") || text.includes("soccer") || text.includes("badminton")
        ? 9
        : 6,

    coordination:
      text.includes("tennis") || text.includes("baseball") || text.includes("golf") || text.includes("badminton")
        ? 9
        : 6,

    equipment:
      text.includes("tennis") || text.includes("baseball") || text.includes("golf") || text.includes("hockey")
        ? 8
        : 3,
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

  const rankedSports = React.useMemo(() => {
    return sports
      .map((sport) => {
        const profile = getSportProfile(sport);
        const matchScore = surveyMatchScore(answers, profile);
        return { ...sport, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));
  }, [answers]);

  const visibleSports = rankedSports.slice(0, compact ? 5 : 9);

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
              Rate yourself from 1–10 and get matched sports.
            </Typography>
          </Box>
        </Stack>

        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: compact ? 2 : 3 }}>
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
                      onChange={(_, value) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.key]: value as number,
                        }))
                      }
                    />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

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
            Answer a short preference and sport-science survey. The system compares your answers to each sport’s
            profile and ranks the closest matches.
          </Typography>
        </Stack>

        <SportsFinder />
      </Container>
    </Box>
  );
}