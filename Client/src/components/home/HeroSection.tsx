import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { fadeUp, stagger, wordStagger, wordReveal } from "./homeAnimations";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const metrics = [
  { label: "Recovery", value: 78, color: "#22c55e" },
  { label: "Training Load", value: 69, color: "#0284c7" },
  { label: "Focus", value: 88, color: "#8b5cf6" },
];

const heroTitle = "Make athlete decisions easier to understand.";
const heroWords = heroTitle.split(" ");

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [started, setStarted] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion) { setCount(target); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reduceMotion, target]);

  React.useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 900;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function HeroSection() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const heroRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  const wordTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  const hoverLift = reduceMotion ? undefined : { y: -8, transition: { duration: 0.2 } };

  return (
    <Box
      ref={heroRef}
      component="section"
      sx={{
        position: "relative",
        py: { xs: 7, md: 10, lg: 12 },
        borderBottom: "1px solid #e2e8f0",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 10% 10%, rgba(14,165,233,0.11), transparent 30%), radial-gradient(circle at 90% 20%, rgba(34,197,94,0.08), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      {!reduceMotion && (
        <>
          <motion.div
            style={{ y: heroY, position: "absolute", top: "8%", right: "12%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%)", pointerEvents: "none" }}
          />
          <motion.div
            style={{ y: heroY, position: "absolute", bottom: "10%", left: "5%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", pointerEvents: "none" }}
          />
        </>
      )}
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 2, md: 7 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <MotionBox variants={stagger} initial="hidden" animate="visible">
              <Stack spacing={3}>
                <MotionBox variants={fadeUp} transition={transition}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="Sports Science AI Platform" sx={{ width: "fit-content", bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 900, borderRadius: 999 }} />
                    <Chip label="Training • Recovery • Readiness" sx={{ width: "fit-content", bgcolor: "#ecfdf5", color: "#047857", fontWeight: 900, borderRadius: 999 }} />
                  </Stack>
                </MotionBox>

                <MotionBox variants={wordStagger} initial="hidden" animate="visible">
                  <Typography
                    component="h1"
                    sx={{
                      fontWeight: 950,
                      letterSpacing: { xs: -1.1, md: -1.8 },
                      lineHeight: 1.02,
                      color: "#0f172a",
                      fontSize: { xs: "2.55rem", sm: "3.45rem", md: "4.7rem", lg: "5.25rem" },
                    }}
                  >
                    {heroWords.map((word, i) => (
                      <motion.span
                        key={i}
                        variants={wordReveal}
                        transition={wordTransition}
                        style={{ display: "inline-block", marginRight: "0.28em" }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </Typography>
                </MotionBox>

                <MotionBox variants={fadeUp} transition={transition}>
                  <Typography sx={{ color: "#475569", lineHeight: 1.85, maxWidth: 660, fontSize: { xs: "1rem", md: "1.1rem" } }}>
                    SportLab AI helps athletes, coaches, and students explore training load, recovery, readiness, sport matching, sports rules, and mental performance through a clean AI-powered interface.
                  </Typography>
                </MotionBox>

                <MotionBox variants={fadeUp} transition={transition}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
                    <Button
                      component={RouterLink}
                      to="/sports"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: 3, bgcolor: "#0f172a", fontWeight: 900, px: 3, py: 1.35,
                        boxShadow: "0 12px 30px rgba(15,23,42,0.16)",
                        transition: "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
                        "&:hover": { bgcolor: "#1e293b", transform: "translateY(-2px)", boxShadow: "0 18px 40px rgba(15,23,42,0.22)" },
                      }}
                    >
                      Open Sports AI
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/dashboard"
                      variant="outlined"
                      size="large"
                      sx={{
                        borderRadius: 3, borderColor: "#cbd5e1", color: "#0f172a", fontWeight: 900, px: 3, py: 1.35,
                        transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
                        "&:hover": { transform: "translateY(-2px)", borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
                      }}
                    >
                      View Dashboard
                    </Button>
                  </Stack>
                </MotionBox>

                <MotionBox variants={fadeUp} transition={transition}>
                  <Grid container spacing={1.5} sx={{ pt: 2 }}>
                    {[
                      { label: "Readiness Score", counter: 84, suffix: "%" },
                      { label: "Sports Covered", counter: 50, suffix: "+" },
                      { label: "AI Guidance", text: "24/7" },
                    ].map((item) => (
                      <Grid item xs={12} sm={4} key={item.label}>
                        <MotionBox
                          whileHover={hoverLift}
                          sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "#fff", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 10px 28px rgba(15,23,42,0.04)" }}
                        >
                          <Typography sx={{ fontWeight: 950, color: "#0f172a", fontSize: { xs: "1.1rem", sm: "1.4rem" } }}>
                            {item.counter !== undefined
                              ? <AnimatedCounter target={item.counter} suffix={item.suffix} />
                              : item.text}
                          </Typography>
                          <Typography sx={{ color: "#64748b", fontSize: { xs: 12, sm: 13 }, fontWeight: 800 }}>
                            {item.label}
                          </Typography>
                        </MotionBox>
                      </Grid>
                    ))}
                  </Grid>
                </MotionBox>
              </Stack>
            </MotionBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <MotionBox
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={transition}
              sx={{ position: "relative" }}
            >
              <MotionPaper
                elevation={0}
                whileHover={reduceMotion || isMobile ? undefined : { y: -5 }}
                transition={{ duration: 0.22 }}
                sx={{
                  position: "relative",
                  borderRadius: { xs: 4, md: 5 },
                  p: { xs: 2.25, sm: 2.75, md: 3 },
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
                  overflow: "hidden",
                }}
              >
                <MotionBox
                  aria-hidden
                  animate={reduceMotion ? undefined : { x: ["-100%", "100%"] }}
                  transition={{ duration: 4.4, repeat: Infinity, ease: "linear" }}
                  sx={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: 3,
                    background: "linear-gradient(90deg, transparent, #38bdf8, #22c55e, transparent)",
                  }}
                />
                <Stack spacing={2.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                    <Box>
                      <Typography variant="h5" fontWeight={950}>Athlete Snapshot</Typography>
                      <Typography color="#64748b">Today's performance readiness</Typography>
                    </Box>
                    <MotionBox
                      animate={reduceMotion ? undefined : { boxShadow: ["0 0 0 0 rgba(56,189,248,0.32)", "0 0 0 18px rgba(56,189,248,0)", "0 0 0 0 rgba(56,189,248,0)"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                      sx={{ width: 56, height: 56, borderRadius: "14px", display: "grid", placeItems: "center", bgcolor: "#e0f2fe", overflow: "hidden" }}
                    >
                      <Box component="img" src="/sportslab_logo.png" alt="SportLab AI" sx={{ width: 44, height: 44, objectFit: "contain" }} />
                    </MotionBox>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <Box
                        sx={{
                          height: { xs: 210, sm: 230 }, borderRadius: 4, bgcolor: "#0f172a", color: "#fff",
                          display: "grid", placeItems: "center", position: "relative", overflow: "hidden",
                          background: "radial-gradient(circle at 30% 20%, rgba(56,189,248,0.20), transparent 34%), #0f172a",
                        }}
                      >
                        <MotionBox
                          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                          transition={{ duration: 0.25 }}
                          sx={{
                            position: "relative", zIndex: 1, width: 154, height: 154, borderRadius: "50%",
                            background: "conic-gradient(#22c55e 0deg 302deg, #334155 302deg 360deg)",
                            display: "grid", placeItems: "center",
                          }}
                        >
                          <Box sx={{ width: 118, height: 118, borderRadius: "50%", bgcolor: "#0f172a", display: "grid", placeItems: "center", textAlign: "center" }}>
                            <Box>
                              <Typography variant="h3" fontWeight={950}>84</Typography>
                              <Typography fontSize={12} color="#94a3b8" fontWeight={900}>READY</Typography>
                            </Box>
                          </Box>
                        </MotionBox>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={7}>
                      <Stack spacing={2}>
                        {metrics.map((metric, index) => (
                          <MotionBox
                            key={metric.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...transition, delay: reduceMotion ? 0 : 0.45 + index * 0.1 }}
                          >
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                              <Typography fontWeight={900}>{metric.label}</Typography>
                              <Typography color="#64748b" fontWeight={800}>{metric.value}%</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={metric.value}
                              sx={{
                                height: 10, borderRadius: 999, bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": { bgcolor: metric.color, borderRadius: 999, transition: "transform 900ms ease" },
                              }}
                            />
                          </MotionBox>
                        ))}
                        <MotionBox
                          whileHover={hoverLift}
                          sx={{ p: 2, borderRadius: 3, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                        >
                          <Typography color="#166534" fontWeight={950}>AI Coach Note</Typography>
                          <Typography color="#475569" fontSize={14} lineHeight={1.7} sx={{ mt: 0.5 }}>
                            Maintain normal load. Add mobility and hydration before high-intensity sprint work.
                          </Typography>
                        </MotionBox>
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              </MotionPaper>
            </MotionBox>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
