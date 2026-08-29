import React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AiChatHome from "../components/AiChatHome";
import Seo, { breadcrumbs } from "../components/Seo";
import { getUserPreferences } from "../services/preferencesService";
import { getLatestCheckIn } from "../services/checkinService";

export default function UnifiedAIHome() {
  const [dataStatus, setDataStatus] = React.useState<"loading" | "full" | "profile-only" | "none">("loading");

  // The assistant now reads the profile and check-in history itself, through
  // the get_profile / get_checkins tools in the ai-chat function. These queries
  // only drive the status chip below — pasting a snapshot into the prompt meant
  // the model saw data frozen at page load, with no dates on the trend numbers.
  React.useEffect(() => {
    async function loadDataStatus() {
      try {
        const [prefs, latest] = await Promise.all([
          getUserPreferences(),
          getLatestCheckIn(),
        ]);

        setDataStatus(prefs && latest ? "full" : prefs ? "profile-only" : "none");
      } catch (err) {
        console.error("Failed to load athlete profile:", err);
        setDataStatus("none");
      }
    }

    loadDataStatus();
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
      <Seo
        title="Sports AI Coach"
        description="Ask your AI sports coach anything — training plans, recovery, nutrition, tactics, injury prevention, and sports science."
        path="/sports"
        jsonLd={breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Sports AI Coach", path: "/sports" },
        ])}
      />
      {statusChip && (
        <Stack alignItems="flex-end" sx={{ px: { xs: 2, md: 3 }, pt: 1.5 }}>
          {statusChip}
        </Stack>
      )}
    <AiChatHome
      chatType="sports"
      title="Sports Health AI"
      logoSrc="/logo-192.png"
      emptyIcon="🏆"
      emptyTitle="Ask about sports performance or mental wellbeing"
      emptySubtitle="Training · Recovery · Nutrition · Stress · Confidence · Focus"
      inputPlaceholder="Ask SportLab AI anything…"
      toolsTitle="Quick Actions"
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