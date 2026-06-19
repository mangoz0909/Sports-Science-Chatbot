import React from "react";
import AiChatHome from "../components/AiChatHome";
import { getUserPreferences } from "../services/preferencesService";

export default function UnifiedAIHome() {
  const [profileContext, setProfileContext] = React.useState("");

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const prefs = await getUserPreferences();

        if (!prefs) return;

        setProfileContext(`
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
`);
      } catch (err) {
        console.error("Failed to load athlete profile:", err);
      }
    }

    loadProfile();
  }, []);

  return (
    <AiChatHome
      title="Sports Health AI"
      logoSrc="/sportslab_logo.png"
      emptyIcon="🏆"
      emptyTitle="Ask about sports performance or mental wellbeing"
      emptySubtitle="Training · Recovery · Nutrition · Stress · Confidence · Focus"
      inputPlaceholder="Ask SportLab AI anything…"
      toolsTitle="Quick Actions"
      model="claude-haiku-4-5"
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
          🔒 Conversations run client-side through Puter.js.
          <br />
          🏆 Responses are personalized using your athlete profile.
          <br />
          🚨 For emergencies, contact local services or a trusted adult immediately.
        </>
      }
    />
  );
}