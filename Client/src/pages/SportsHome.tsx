import AiChatHome from "../components/AiChatHome";

export default function UnifiedAIHome() {
  return (
    <AiChatHome
      title="Sports Health AI"
      logoSrc="/static/mental_logo.png"
      emptyIcon="🏆"
      emptyTitle="Ask about sports performance or mental wellbeing"
      emptySubtitle="Training • Recovery • Nutrition • Stress • Confidence • Focus"
      inputPlaceholder="Ask SportLab AI anything..."
      toolsTitle="Quick Actions"
      model="claude-haiku-4-5"
      systemPrompt={`
You are SportLab AI and MangoMind AI combined.

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

If a question is sports-related:
Provide evidence-based sports science advice.

If a question is mental-health related:
Provide supportive emotional guidance and practical coping strategies.

Do NOT diagnose medical or mental health conditions.

If the user mentions:
- self-harm
- suicide
- immediate danger
- abuse
- emergency situations

Tell them to contact emergency services, a trusted adult, parent, coach, counselor, or crisis hotline immediately.

Always be supportive, practical, and student-friendly.
`}
      quickActions={[
        {
          label: "Training Plan",
          prompt: "Create a weekly training plan for tennis."
        },
        {
          label: "Recovery",
          prompt: "How can I recover faster after a hard workout?"
        },
        {
          label: "Confidence",
          prompt: "Give me a pre-match confidence routine."
        },
        {
          label: "Stress Support",
          prompt: "How can I manage stress during exams and sports?"
        },
      ]}
      examplesTitle="Example Questions"
      examples={[
        "How can I improve my tennis footwork?",
        "What should I eat before competition?",
        "How do I deal with performance anxiety?",
        "How can I stay motivated during training?",
        "What are signs of overtraining?",
        "How can I support a stressed teammate?",
      ]}
      footerNote={
        <>
          🔒 Conversations run client-side through Puter.js.
          <br />
          🚨 For emergencies or self-harm concerns, contact local emergency services or a trusted adult immediately.
        </>
      }
    />
  );
}