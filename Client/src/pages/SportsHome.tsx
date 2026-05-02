import AiChatHome from "../components/AiChatHome";

export default function SportsHome() {
  return (
    <AiChatHome
      title="Sports AI Assistant"
      logoSrc="/static/sport_log_2.png"
      emptyIcon="🏆"
      emptyTitle="Ask anything about sports"
      emptySubtitle="Rules • Coaching • Predictions • Analytics"
      inputPlaceholder="Message Sports Assistant"
      toolsTitle="Quick Sports Tools"
      quickActions={[
        {
          label: "Cricket Rules",
          prompt: "Tell me cricket rules",
        },
        {
          label: "Football Training",
          prompt: "Teach me football basics",
        },
        {
          label: "Batting Tips",
          prompt: "How to improve cricket batting",
        },
        {
          label: "Match Prediction",
          prompt: "Predict match outcome if team scores 300 runs",
        },
      ]}
      examplesTitle="Example Questions"
      examples={[
        "Who won the 2023 Cricket World Cup?",
        "How to improve football dribbling?",
        "What is LBW rule?",
        "How to train like a professional athlete?",
      ]}
    />
  );
}