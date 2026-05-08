import AiChatHome from "../components/AiChatHome";
import { SportsFinder } from "./SportsListPage";

export default function SportsHome() {
  return (
    <AiChatHome
      title="Sports Science AI Assistant"
      logoSrc="/static/sport_log_2.png"
      emptyIcon="🏆"
      emptyTitle="Ask anything about sports science"
      emptySubtitle="Rules • Coaching • Training Load • Recovery • Sport Matching"
      inputPlaceholder="Ask about training, recovery, sport rules, or tactics..."
      toolsTitle="Quick Sports Tools"
      model="claude-sonnet-4-6"
      systemPrompt="You are a sports science assistant for SportLab AI. Give practical, concise help about sport rules, athlete performance, training load, recovery, tactics, mental performance, and beginner drills. For injuries or medical concerns, do not diagnose; recommend a qualified clinician."
      sideContent={<SportsFinder compact />}
      quickActions={[
        { label: "Find sports like tennis", prompt: "What sports are most similar to tennis and why?" },
        { label: "Build a beginner plan", prompt: "Create a beginner sports training plan for 4 weeks." },
        { label: "Recovery checklist", prompt: "Give me a recovery checklist after a high intensity session." },
        { label: "Analyze readiness", prompt: "Explain how to evaluate athlete readiness before training." },
      ]}
      examplesTitle="Example Questions"
      examples={[
        "What sport is closest to tennis?",
        "How do I improve acceleration for football?",
        "How should training load be managed for young athletes?",
        "What are the key performance metrics in cricket?",
      ]}
    />
  );
}
