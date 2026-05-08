import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import { Sport, sports } from "../data/sportsData";

type SportsFinderProps = {
  compact?: boolean;
};

const categories = ["All", ...Array.from(new Set(sports.map((sport) => sport.category)))];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);

  for (let j = 1; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function textSimilarity(query: string, sport: Sport) {
  const q = normalize(query);
  if (!q) return 0.72;

  const name = normalize(sport.name);
  const haystack = normalize([sport.name, sport.category, sport.description, ...sport.similarityTags].join(" "));

  let score = 0;

  if (name === q) score += 1.2;
  if (name.includes(q)) score += 0.75;
  if (haystack.includes(q)) score += 0.5;

  const words = q.split(" ").filter(Boolean);
  const matchedWords = words.filter((word) => haystack.includes(word)).length;
  score += matchedWords * 0.22;

  const minDistance = Math.min(
    ...[name, ...sport.similarityTags.map(normalize)].map((candidate) =>
      levenshtein(q, candidate.slice(0, Math.max(q.length, 1)))
    )
  );

  score += Math.max(0, 0.36 - minDistance * 0.06);

  return Math.min(1, score);
}

function getRelatedBoost(query: string, sport: Sport) {
  const q = normalize(query);
  const exactSport = sports.find((item) => normalize(item.name).includes(q) || item.id === q);

  if (!q || !exactSport || exactSport.id === sport.id) return 0;

  const sharedTags = sport.similarityTags.filter((tag) => exactSport.similarityTags.includes(tag)).length;
  const sameCategory = sport.category === exactSport.category ? 0.24 : 0;

  return Math.min(0.55, sharedTags * 0.075 + sameCategory);
}

export function SportsFinder({ compact = false }: SportsFinderProps) {
  const [query, setQuery] = React.useState("tennis");
  const [category, setCategory] = React.useState("All");

  const rankedSports = React.useMemo(() => {
    return sports
      .filter((sport) => category === "All" || sport.category === category)
      .map((sport) => {
        const score = Math.round((textSimilarity(query, sport) + getRelatedBoost(query, sport)) * 100);
        return { ...sport, matchScore: Math.min(100, score) };
      })
      .filter((sport) => !query.trim() || sport.matchScore >= 18)
      .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));
  }, [category, query]);

  const maxItems = compact ? 5 : rankedSports.length;
  const visibleSports = rankedSports.slice(0, maxItems);

  return (
    <Box className={compact ? "sports-finder-compact" : undefined}>
      <Stack spacing={compact ? 1.5 : 2.5}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
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
                Sports Finder
              </Typography>
              <Typography color="#64748b" fontSize={compact ? 13 : 15}>
                Search one sport and get close alternatives.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction={compact ? "column" : { xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tennis, football, cricket..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            sx={{ minWidth: compact ? "100%" : 190 }}
          >
            {categories.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

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

                  <LinearProgress
                    variant="determinate"
                    value={sport.matchScore}
                    sx={{
                      my: 1.5,
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#22c55e" },
                    }}
                  />

                  <Typography color="#475569" fontSize={compact ? 13 : 14} lineHeight={1.65}>
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
            Find the closest sports to your search.
          </Typography>
          <Typography color="#64748b" maxWidth={760} lineHeight={1.8}>
            The search ranks direct matches first, then related sports using category overlap, movement pattern,
            equipment, training demand, and sport-science similarity tags.
          </Typography>
        </Stack>

        <SportsFinder />
      </Container>
    </Box>
  );
}
