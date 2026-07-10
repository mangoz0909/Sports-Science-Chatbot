import React from "react";
import AiChatHome from "../components/AiChatHome";
import Seo from "../components/Seo";

export default function MentalHealthPage() {
  return (
    <>
      <Seo
        title="Mental Health Support"
        description="Talk to MangoMind AI — a supportive AI trained in student-athlete mental wellness, stress management, coping strategies, and emergency guidance."
        path="/mental-health"
      />
      <AiChatHome
        chatType="mental_health"
        title="MangoMind AI"
        logoSrc="/sportslab_logo.png"
        emptyIcon="🧠"
        emptyTitle="How are you feeling today?"
        emptySubtitle="Stress · Anxiety · Confidence · Motivation · Recovery mindset"
        inputPlaceholder="Tell MangoMind how you're feeling…"
        toolsTitle="Quick Topics"
        quickActions={[
          { icon: "😰", label: "Anxiety", prompt: "I'm feeling really anxious before a big competition. How can I calm down?" },
          { icon: "😔", label: "Motivation", prompt: "I've lost motivation to train lately. How do I get it back?" },
          { icon: "💤", label: "Sleep", prompt: "I can't sleep well before games. What strategies can help?" },
          { icon: "🧘", label: "Mindfulness", prompt: "Can you walk me through a quick mindfulness exercise for athletes?" },
          { icon: "😤", label: "Pressure", prompt: "I feel a lot of pressure from my coach and parents. How do I cope?" },
          { icon: "🔥", label: "Burnout", prompt: "I think I might be experiencing burnout. What should I do?" },
        ]}
        examplesTitle="What others ask"
        examples={[
          "How do I deal with performance anxiety?",
          "Tips for staying confident after a loss",
          "How do I manage stress during exam season and training?",
          "What's a quick breathing technique before competition?",
          "How do I talk to my coach about feeling overwhelmed?",
        ]}
      />
    </>
  );
}
