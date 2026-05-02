import { FormEvent, useEffect, useRef, useState } from "react";
import "./AiChatHome.css";

type QuickAction = {
  label: string;
  prompt: string;
};

type AiChatHomeProps = {
  title: string;
  logoSrc: string;
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
  inputPlaceholder: string;
  toolsTitle: string;
  quickActions: QuickAction[];
  examplesTitle: string;
  examples: string[];
  footerNote?: React.ReactNode;
  apiEndpoint?: string;
};

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: SpeechRecognitionResultLike;
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

function formatBotMessage(content: string) {
  return content
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <br key={index} />;
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={index} className="markdown-heading">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }

      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="markdown-heading">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }

      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={index} className="markdown-heading">
            {trimmed.replace("# ", "")}
          </h1>
        );
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={index} className="markdown-list-item">
            • {trimmed.slice(2)}
          </div>
        );
      }

      return (
        <p key={index} className="markdown-paragraph">
          {trimmed}
        </p>
      );
    });
}

export default function AiChatHome({
  title,
  logoSrc,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  inputPlaceholder,
  toolsTitle,
  quickActions,
  examplesTitle,
  examples,
  footerNote,
  apiEndpoint = "/ask",
}: AiChatHomeProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const canSend = message.trim().length > 0 && !isLoading;

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setError("");
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setMessage(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setError("Voice input failed. Please type your message instead.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const handleMicClick = () => {
    setError("");

    if (!recognitionRef.current) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    recognitionRef.current.start();
  };

  const submitMessage = async (text: string) => {
    const userMessage = text.trim();

    if (!userMessage || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `message=${encodeURIComponent(userMessage)}`,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data: { reply?: string } = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.reply || "No response received.",
        },
      ]);
    } catch {
      setError("Could not connect to the assistant. Please check your server.");

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, I could not process that request right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(message);
  };

  const handleQuickAsk = (prompt: string) => {
    submitMessage(prompt);
  };

  return (
    <main className="ai-page">
      <section className="ai-shell">
        <section className="chat-card">
          <header className="chat-header">
            <div className="brand-block">
              <img src={logoSrc} alt={`${title} logo`} className="brand-logo" />

              <div>
                <p className="eyebrow">AI Assistant</p>
                <h1>{title}</h1>
              </div>
            </div>
          </header>

          <div className="chat-box" ref={chatBoxRef}>
            {messages.length === 0 && !isLoading && (
              <div className="empty-state">
                <div className="empty-icon">{emptyIcon}</div>
                <h2>{emptyTitle}</h2>
                <p>{emptySubtitle}</p>
              </div>
            )}

            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`message ${
                  item.role === "user" ? "user-message" : "bot-message"
                }`}
              >
                {item.role === "bot" ? formatBotMessage(item.content) : item.content}
              </div>
            ))}

            {isLoading && (
              <div className="typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <form className="chat-input" onSubmit={handleSubmit}>
            <div className="input-container">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={isRecording ? "Listening..." : inputPlaceholder}
                disabled={isLoading}
              />

              <button
                type="button"
                className={`icon-btn ${isRecording ? "recording" : ""}`}
                onClick={handleMicClick}
                aria-label="Use voice input"
              >
                🎤
              </button>

              <button
                type="submit"
                className="send-btn"
                disabled={!canSend}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
          </form>
        </section>

        <aside className="side-panel">
          <section className="panel-section">
            <h3>{toolsTitle}</h3>

            <div className="quick-grid">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAsk(action.prompt)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h3>{examplesTitle}</h3>

            <ul>
              {examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>

            {footerNote && <div className="chat-footer-note">{footerNote}</div>}
          </section>
        </aside>
      </section>
    </main>
  );
}