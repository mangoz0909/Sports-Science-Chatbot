import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  footerNote?: ReactNode;
  model?: string;
  systemPrompt?: string;
  sideContent?: ReactNode;
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

type PuterChatResponse =
  | string
  | {
      text?: string;
      message?: {
        content?: Array<{ text?: string }> | string;
      };
    };

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
    puter?: {
      ai?: {
        chat?: (prompt: string, options?: { model?: string }) => Promise<PuterChatResponse>;
      };
    };
  }
}

const PUTER_SCRIPT_ID = "puter-js-v2";
const DEFAULT_MODEL = "claude-sonnet-4-6";

function loadPuterScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.puter?.ai?.chat) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(PUTER_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Puter.js.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = PUTER_SCRIPT_ID;
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter.js."));
    document.body.appendChild(script);
  });
}

function extractPuterText(response: PuterChatResponse) {
  if (typeof response === "string") return response;
  if (response?.text) return response.text;

  const content = response?.message?.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => item.text).filter(Boolean).join("\n");
  }

  return "No response received.";
}

function formatBotMessage(content: string) {
  return content.split("\n").map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) return <br key={index} />;

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
  model = DEFAULT_MODEL,
  systemPrompt,
  sideContent,
}: AiChatHomeProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const [puterReady, setPuterReady] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const canSend = message.trim().length > 0 && !isLoading;

  const defaultSystemPrompt = useMemo(
    () =>
      "You are SportLab AI, a concise sports science assistant. Explain sports rules, training, recovery, injury-risk concepts, athlete readiness, tactics, nutrition basics, and mental performance clearly. Avoid medical diagnosis. Tell users to seek qualified professional help for injuries, emergencies, or severe mental health concerns.",
    []
  );

  useEffect(() => {
    let mounted = true;

    loadPuterScript()
      .then(() => {
        if (mounted) setPuterReady(true);
      })
      .catch(() => {
        if (mounted) setError("Puter.js failed to load. Check your connection and script permissions.");
      });

    return () => {
      mounted = false;
    };
  }, []);

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

    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const handleMicClick = () => {
    setError("");

    if (!recognitionRef.current) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    recognitionRef.current.start();
  };

  const buildPrompt = (userMessage: string) => {
    const recentHistory = messages
      .slice(-8)
      .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
      .join("\n");

    return [
      `System: ${systemPrompt || defaultSystemPrompt}`,
      recentHistory ? `Recent conversation:\n${recentHistory}` : "",
      `User: ${userMessage}`,
      "Assistant:",
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const submitMessage = async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setIsLoading(true);
    setError("");

    try {
      await loadPuterScript();

      if (!window.puter?.ai?.chat) {
        throw new Error("Puter AI is unavailable.");
      }

      const response = await window.puter.ai.chat(buildPrompt(userMessage), { model });
      const reply = extractPuterText(response);

      setPuterReady(true);
      setMessages((prev) => [...prev, { role: "bot", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed. Try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "I could not connect to Puter.js right now. Check that https://js.puter.com/v2/ is allowed and retry.",
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

  return (
    <main className="ai-page">
      <section className="ai-shell">
        <section className="chat-card">
          <header className="chat-header">
            <div className="brand-block">
              <img src={logoSrc} alt={`${title} logo`} className="brand-logo" />
              <div>
                <p className="eyebrow">AI Assistant • {puterReady ? "Puter Ready" : "Loading Puter"}</p>
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
                className={`message ${item.role === "user" ? "user-message" : "bot-message"}`}
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

              <button type="submit" className="send-btn" disabled={!canSend} aria-label="Send message">
                ↑
              </button>
            </div>
          </form>
        </section>

        <aside className="side-panel">
          {sideContent && <section className="panel-section side-custom">{sideContent}</section>}

          <section className="panel-section">
            <h3>{toolsTitle}</h3>
            <div className="quick-grid">
              {quickActions.map((action) => (
                <button key={action.label} type="button" onClick={() => submitMessage(action.prompt)}>
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
