import AiChatHome from "../components/AiChatHome";

export default function MentalHealthHome() {
  return (
    <AiChatHome
      title="MangoMind AI — Mental Health Support"
      logoSrc="/static/mental_logo.png"
      emptyIcon="🧠"
      emptyTitle="Ask for general mental wellbeing support"
      emptySubtitle="Stress • Confidence • Focus • Emotional Support • Emergency Direction"
      inputPlaceholder="Message Mental Health Assistant"
      toolsTitle="Quick Mental Health Tools"
      model="claude-haiku-4-5"
      systemPrompt="You are MangoMind, a supportive wellbeing assistant. Give general mental health information, stress-management strategies, emotional support, and practical coping steps. Do not diagnose. For emergencies, self-harm risk, or immediate danger, tell the user to call local emergency services or a trusted person now."
      quickActions={[
        { label: "Calming Strategy", prompt: "How can I calm myself down right now?" },
        { label: "Anxiety Support", prompt: "Teach me how to manage anxiety before a match." },
        { label: "Confidence Routine", prompt: "Give me a pre-game confidence routine." },
        { label: "Lifestyle Suggestions", prompt: "Give me lifestyle suggestions to support mental wellbeing." },
      ]}
      examplesTitle="Example Questions"
      examples={[
        "How do I handle performance anxiety?",
        "What should I do if I feel overwhelmed?",
        "How can an athlete improve focus?",
        "How can I support a teammate who is stressed?",
      ]}
      footerNote={
        <>
          🔒 Your conversations run client-side through Puter.js.
          <br />
          🚨 In an emergency, call your local emergency hotline immediately.
        </>
      }
    />
  );
}
