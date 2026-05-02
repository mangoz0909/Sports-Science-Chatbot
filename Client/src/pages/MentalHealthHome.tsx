import AiChatHome from "../components/AiChatHome";

export default function MentalHealthHome() {
  return (
    <AiChatHome
      title="MangoMind🥭 AI — Mental Health Chatbot"
      logoSrc="/static/mental_logo.png"
      emptyIcon="🧠"
      emptyTitle="Ask anything about mental health"
      emptySubtitle="General Health QA • Mental Health Suggestions • Emotional Support • Emergency Support"
      inputPlaceholder="Message Mental Health Assistant"
      toolsTitle="Quick Mental Health Tools"
      quickActions={[
        {
          label: "Calming Strategy",
          prompt: "How to calm myself down?",
        },
        {
          label: "Anxiety Solutions",
          prompt: "Teach me how to manage my anxiety",
        },
        {
          label: "Mental Health Tips",
          prompt: "How to improve my mental health",
        },
        {
          label: "Lifestyle Suggestions",
          prompt: "Give me some lifestyle suggestions that will improve my mental health",
        },
      ]}
      examplesTitle="Example Questions"
      examples={[
        "What are some common mental disorders?",
        "How do I know if I need mental support?",
        "What should I do if I have no one to talk to?",
        "How can I help others with mental health issues?",
      ]}
      footerNote={
        <>
          🔒 Your conversations are private
          <br />
          🚨 In case of emergency, call your local emergency hotline.
        </>
      }
    />
  );
}