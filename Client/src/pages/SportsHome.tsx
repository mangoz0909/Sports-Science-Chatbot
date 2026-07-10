import React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AiChatHome from "../components/AiChatHome";
import { getUserPreferences } from "../services/preferencesService";
import { getLatestCheckIn, getLast7CheckIns } from "../services/checkinService";

export default function UnifiedAIHome() {
  const [profileContext, setProfileContext] = React.useState("");
  const [dataStatus, setDataStatus] = React.useState<"loading" | "full" | "profile-only" | "none">("loading");

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const [prefs, latest, last7] = await Promise.all([
          getUserPreferences(),
          getLatestCheckIn(),
          getLast7CheckIns(),
        ]);

        const athleteSection = prefs ? `
ATHLETE PROFILE
Primary Sport: ${prefs.primary_sport || "Not provided"}
Experience Level: ${prefs.experience_level || "Not provided"}
Main Goal: ${prefs.main_goal || "Not provided"}
Training Days Per Week: ${prefs.training_days || "Not provided"}
Competition Level: ${prefs.competition_level || "Not provided"}
Injuries / Concerns: ${prefs.injury_areas || "Not provided"}
Training Priorities: ${prefs.priorities || "Not provided"}
Average Sleep: ${prefs.sleep_range || "Not provided"}
Athlete Type: ${prefs.athlete_type || "Not provided"}
` : "";

        const readiness = latest?.readiness_score ?? null;
        const readinessZone = readiness === null ? null
          : readiness >= 75 ? "HIGH — athlete is in a strong readiness zone. Encourage full training and performance work."
          : readiness >= 45 ? "MEDIUM — athlete has moderate readiness. Recommend moderate-intensity training with recovery focus."
          : "LOW — athlete is in a low readiness zone. Strongly recommend light/recovery session only. Proactively address sleep, hydration, and fatigue.";

        const checkInSection = latest ? `
TODAY'S CHECK-IN DATA
Readiness: ${latest.readiness_score ?? "N/A"}%
Recovery: ${latest.recovery_score ?? "N/A"}%
Fatigue: ${latest.fatigue != null ? latest.fatigue * 10 : "N/A"}%
Sleep Last Night: ${latest.sleep_hours ?? "N/A"}h (Quality: ${latest.sleep_quality ?? "N/A"}/10)
Hydration: ${latest.hydration ?? "N/A"}L
Injury Risk: ${latest.injury_risk ?? "N/A"}%
Training Intensity: ${latest.training_intensity ?? "N/A"}/10
${readinessZone ? `\nCURRENT READINESS STATE: ${readinessZone}` : ""}
` : "";

        const trendSection = last7.length > 0 ? `
7-DAY READINESS TREND (oldest → newest)
Readiness: ${last7.map((d: any) => d.readiness_score ?? 0).join(", ")}
Recovery: ${last7.map((d: any) => d.recovery_score ?? 0).join(", ")}
Sleep (hrs): ${last7.map((d: any) => d.sleep_hours ?? 0).join(", ")}
Fatigue: ${last7.map((d: any) => (d.fatigue != null ? d.fatigue * 10 : 0)).join(", ")}
` : "";

        setProfileContext([athleteSection, checkInSection, trendSection].filter(Boolean).join("\n"));
        setDataStatus(prefs && latest ? "full" : prefs ? "profile-only" : "none");
      } catch (err) {
        console.error("Failed to load athlete profile:", err);
        setDataStatus("none");
      }
    }

    loadProfile();
  }, []);

  const statusChip = dataStatus === "loading" ? null : dataStatus === "full" ? (
    <Chip
      size="small"
      label="🟢 Using your profile + today's check-in"
      sx={{ bgcolor: "#ecfdf5", color: "#15803d", fontWeight: 700, fontSize: 12, border: "1px solid #bbf7d0" }}
    />
  ) : dataStatus === "profile-only" ? (
    <Chip
      size="small"
      label="🟡 Using your profile — no check-in today"
      sx={{ bgcolor: "#fffbeb", color: "#92400e", fontWeight: 700, fontSize: 12, border: "1px solid #fde68a" }}
    />
  ) : dataStatus === "none" ? (
    <Chip
      size="small"
      component={RouterLink}
      to="/profile"
      clickable
      label="⚪ Complete your profile for personalized advice →"
      sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 12, border: "1px solid #e2e8f0", textDecoration: "none" }}
    />
  ) : null;

  return (
    <Box>
      {statusChip && (
        <Stack alignItems="flex-end" sx={{ px: { xs: 2, md: 3 }, pt: 1.5 }}>
          {statusChip}
        </Stack>
      )}
    <AiChatHome
      chatType="sports"
      title="Sports Health AI"
      logoSrc="/sportslab_logo.png"
      emptyIcon="🏆"
      emptyTitle="Ask about sports performance or mental wellbeing"
      emptySubtitle="Training · Recovery · Nutrition · Stress · Confidence · Focus"
      inputPlaceholder="Ask SportLab AI anything…"
      toolsTitle="Quick Actions"
      systemPrompt={`
You are SportLab AI and MangoMind AI combined.

${profileContext}

IMPORTANT:
Use the athlete profile above to personalize every recommendation.

Examples:
- If the user plays tennis, relate advice to tennis.
- If the user trains 5 days/week, account for training load.
- If the user reports injuries, modify recommendations accordingly.
- If the user has a stated goal, align all advice with that goal.
- If profile information conflicts with the user's current message, trust the user's current message.

You help with:
- Sports performance
- Training plans
- Recovery
- Nutrition
- Injury prevention
- Mental wellbeing
- Stress management
- Confidence building
- Focus and performance psychology

Sports guidance:
- Use evidence-based sports science.
- Explain reasoning clearly.
- Adapt advice to the athlete profile.

Mental wellbeing guidance:
- Provide supportive emotional guidance.
- Offer practical coping strategies.
- Help with performance anxiety, confidence, stress, and motivation.

Safety:
- Do NOT diagnose medical conditions.
- Do NOT diagnose mental health disorders.

If the user mentions:
- self-harm
- suicide
- immediate danger
- abuse
- emergency situations

Tell them to contact emergency services, a trusted adult, parent, coach, counselor, or crisis hotline immediately.

Always be supportive, practical, personalized, and student-friendly.
`}
      quickActions={[
        {
          icon: "📅",
          label: "Training Plan",
          prompt:
            "Create a weekly training plan based on my athlete profile.",
        },
        {
          icon: "💪",
          label: "Recovery",
          prompt:
            "Give me personalized recovery recommendations based on my athlete profile.",
        },
        {
          icon: "🧠",
          label: "Confidence",
          prompt:
            "Give me a confidence routine tailored to my sport and goals.",
        },
        {
          icon: "🌿",
          label: "Stress Support",
          prompt:
            "Help me balance academics, stress, and sports based on my profile.",
        },
      ]}
      examplesTitle="Example Questions"
      examples={[
        "Based on my profile, what should I improve most?",
        "Create a training plan for my sport and goals.",
        "How can I recover better with my current training schedule?",
        "What nutrition changes would help my performance?",
        "How can I deal with competition anxiety?",
        "What weaknesses might athletes like me commonly have?",
      ]}
      footerNote={
        <>
          🔒 Conversations are powered by OpenAI and saved to your account.
          <br />
          🏆 Responses are personalized using your athlete profile.
          <br />
          🚨 For emergencies, contact local services or a trusted adult immediately.
        </>
      }
    />
    </Box>
  );
}