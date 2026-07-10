import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./AiChatHome.css";
import { getChatHistory, clearChatHistory, type ChatType } from "../services/chatService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

type QuickAction = {
  label: string;
  prompt: string;
  icon?: string;
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
  systemPrompt?: string;
  sideContent?: ReactNode;
  chatType?: ChatType;
};

type ChatMessage = {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionEventLike = {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
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

const MAX_MESSAGE_LENGTH = 2000;

/** Full markdown-to-JSX renderer with bold, inline code, fenced code blocks, lists, headings, hr */
function formatBotMessage(content: string): ReactNode {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let listBuffer: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  function flushList(key: string) {
    if (!listBuffer.length) return;
    elements.push(
      <ul key={key} className="markdown-list">
        {listBuffer.map((item, i) => {
          const text = item.replace(/^[-*+]\s+/, "");
          return (
            <li key={i} className="markdown-list-item">
              <span className="markdown-list-bullet" />
              <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
            </li>
          );
        })}
      </ul>
    );
    listBuffer = [];
  }

  function escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderInline(text: string): string {
    const safe = escapeHtml(text);
    return safe
      .replace(/\*\*(.+?)\*\*/g, '<strong class="markdown-bold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="markdown-code-inline">$1</code>');
  }

  lines.forEach((raw, i) => {
    const trimmed = raw.trim();

    if (trimmed.startsWith("```")) {
      if (!inCodeBlock) {
        flushList(`list-${i}`);
        inCodeBlock = true;
        codeLines = [];
      } else {
        elements.push(
          <pre key={`code-${i}`} className="markdown-code-block">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        inCodeBlock = false;
        codeLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(raw);
      return;
    }

    if (!trimmed) {
      flushList(`list-${i}`);
      elements.push(<br key={`br-${i}`} />);
      return;
    }

    if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
      flushList(`list-${i}`);
      elements.push(<hr key={`hr-${i}`} className="markdown-hr" />);
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`list-${i}`);
      elements.push(
        <h1 key={i} className="markdown-heading-h1"
            dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(2)) }} />
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`list-${i}`);
      elements.push(
        <h2 key={i} className="markdown-heading-h2"
            dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(3)) }} />
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList(`list-${i}`);
      elements.push(
        <h3 key={i} className="markdown-heading-h3"
            dangerouslySetInnerHTML={{ __html: renderInline(trimmed.slice(4)) }} />
      );
      return;
    }

    if (/^[-*+]\s/.test(trimmed)) {
      listBuffer.push(trimmed);
      return;
    }

    flushList(`list-${i}`);
    elements.push(
      <p key={i} className="markdown-paragraph"
         dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />
    );
  });

  // flush unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key="code-end" className="markdown-code-block">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  flushList("list-end");
  return <>{elements}</>;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  sideContent,
  chatType,
}: AiChatHomeProps) {
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(!!chatType);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const isLoggedIn = Boolean(session);
  const overLimit = message.length > MAX_MESSAGE_LENGTH;
  const canSend = message.trim().length > 0 && !isLoading && !overLimit;


  useEffect(() => {
    if (!chatType) return;
    let mounted = true;
    getChatHistory(chatType)
      .then((history) => {
        if (!mounted || !history?.length) return;
        setMessages(
          history.map((row: any) => ({
            role: row.role as "user" | "bot",
            content: row.content,
            timestamp: new Date(row.created_at),
          }))
        );
      })
      .catch(() => {})
      .finally(() => { if (mounted) setHistoryLoading(false); });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [message]);

  useEffect(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;
    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setIsRecording(true); setError(""); };
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setMessage(transcript);
    };
    recognition.onerror = () => { setIsRecording(false); setError("Voice input failed. Please type instead."); };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const handleMicClick = () => {
    setError("");
    if (!recognitionRef.current) { setError("Voice input is not supported in this browser."); return; }
    recognitionRef.current.start();
  };

  const submitMessage = useCallback(async (text: string) => {
    const userMessage = text.trim();
    if (!userMessage || isLoading || userMessage.length > MAX_MESSAGE_LENGTH) return;

    if (!isLoggedIn) {
      setError("Sign in to start chatting with the AI.");
      return;
    }

    const now = new Date();
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: now }]);
    setMessage("");
    setIsLoading(true);
    setError("");
    setLastFailedMessage(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-chat", {
        body: { message: userMessage, chatType: chatType || "sports" },
      });

      if (fnError) throw fnError;

      const reply = data?.reply;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((prev) => [...prev, { role: "bot", content: reply.trim(), timestamp: new Date() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed. Try again.";
      setError(msg);
      setLastFailedMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLoggedIn, chatType]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) submitMessage(message);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    if (chatType) clearChatHistory(chatType).catch(() => {});
  };

  return (
    <main className="ai-page">
      <section className="ai-shell">
        {/* ── Main Chat Card ── */}
        <section className="chat-card">
          <header className="chat-header">
            <div className="brand-block">
              <img src={logoSrc} alt={`${title} logo`} className="brand-logo" />
              <div>
                <p className="eyebrow">
                  <span className={`status-dot ${isLoggedIn ? "" : "offline"}`} />
                  AI Assistant &nbsp;·&nbsp; {isLoggedIn ? "Ready" : "Sign in to chat"}
                </p>
                <h1>{title}</h1>
              </div>
            </div>
            {messages.length > 0 && (
              <div className="header-actions">
                <button className="clear-btn" type="button" onClick={clearConversation}>
                  ✕ Clear chat
                </button>
              </div>
            )}
          </header>

          <div className="chat-box" ref={chatBoxRef}>
            {historyLoading && (
              <div className="empty-state">
                <p>Loading conversation history…</p>
              </div>
            )}

            {!historyLoading && messages.length === 0 && !isLoading && (
              <div className="empty-state">
                <div className="empty-icon">{emptyIcon}</div>
                <h2>{emptyTitle}</h2>
                <p>{emptySubtitle}</p>
              </div>
            )}

            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`message-row ${item.role === "user" ? "user-row" : ""}`}
              >
                <div className={`avatar ${item.role === "bot" ? "bot-avatar" : "user-avatar"}`}>
                  {item.role === "bot" ? "AI" : "U"}
                </div>
                <div>
                  <div className={`message ${item.role === "user" ? "user-message" : "bot-message"}`}>
                    {item.role === "bot" ? formatBotMessage(item.content) : item.content}
                  </div>
                  <div className={`message-meta ${item.role === "bot" ? "bot-message" : ""}`}>
                    {formatTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="typing-row">
                <div className="avatar bot-avatar">AI</div>
                <div className="typing" aria-label="Assistant is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="chat-error">
              <span>{error}</span>
              {lastFailedMessage && (
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => {
                    setError("");
                    submitMessage(lastFailedMessage);
                  }}
                >
                  ↻ Retry
                </button>
              )}
            </div>
          )}

          <form className="chat-input" onSubmit={handleSubmit}>
            <div className="mobile-quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="mobile-action-btn"
                  onClick={() => submitMessage(action.prompt)}
                  disabled={isLoading}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <div className="input-wrapper">
              <div className="input-container">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "Listening…" : inputPlaceholder}
                  disabled={isLoading}
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH + 100}
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
              <div className="input-hint">
                {overLimit
                  ? `Message too long (${message.length}/${MAX_MESSAGE_LENGTH})`
                  : "Enter to send · Shift+Enter for new line"}
              </div>
            </div>
          </form>
        </section>

        {/* ── Side Panel ── */}
        <aside className="side-panel">
          {sideContent && <section className="panel-section side-custom">{sideContent}</section>}

          <section className="panel-section">
            <h3>{toolsTitle}</h3>
            <div className="quick-grid">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => submitMessage(action.prompt)}
                  disabled={isLoading}
                >
                  {action.icon && <span className="qa-icon">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h3>{examplesTitle}</h3>
            <ul>
              {examples.map((example) => (
                <li key={example} onClick={() => submitMessage(example)} role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && submitMessage(example)}>
                  {example}
                </li>
              ))}
            </ul>
            {footerNote && <div className="chat-footer-note">{footerNote}</div>}
          </section>
        </aside>
      </section>
    </main>
  );
}