import type { ChangeEvent, ClipboardEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./AiChatHome.css";
import { getChatHistory, clearChatHistory, saveChatExchange, type ChatType } from "../services/chatService";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import {
  ACCEPTED_IMAGE_ACCEPT_ATTR,
  ACCEPTED_IMAGE_TYPES,
  formatAttachmentSize,
  ImageAttachmentError,
  prepareImageAttachment,
  type ImageAttachment,
} from "../lib/imageAttachment";

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
  sideContent?: ReactNode;
  chatType?: ChatType;
};

type ChatMessage = {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  /*
   * Data URL of an image sent with this turn. Held only for the life of the
   * page: `chat_messages` stores text, so a reloaded conversation shows the
   * caption without the picture. That is deliberate — it also means the image
   * is never replayed into later requests, which is what keeps a single photo
   * from being billed again on every subsequent turn.
   */
  imageUrl?: string;
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

/**
 * The athlete's IANA timezone, sent with each turn so the assistant looks up
 * check-ins for the day they are actually having. Check-ins are stamped with
 * the local date; the edge function runs on UTC and cannot infer the zone.
 * Undefined on browsers without a resolved zone — the function then falls back
 * to UTC, as it did before.
 */
function resolvedTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

// Preceding messages sent with each request so the assistant can follow the
// thread. The edge function enforces its own (lower or equal) ceiling.
const HISTORY_MESSAGE_LIMIT = 20;

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
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);

  /*
   * Publishes how much vertical space actually sits above the chat so the card
   * can size itself to what's left. CSS alone can only subtract the header —
   * but the demo banner and the status chip also push the card down, and the
   * composer ended up below the fold on phones as a result.
   */
  const measureChrome = useCallback(() => {
    const element = pageRef.current;
    if (!element) return;

    const offsetFromDocumentTop =
      element.getBoundingClientRect().top + window.scrollY;

    element.style.setProperty(
      "--ai-chrome-offset",
      `${Math.max(0, Math.round(offsetFromDocumentTop))}px`
    );
  }, []);

  // Deliberately runs after every render: the banner and status chip above the
  // chat appear once their own async work resolves, which moves the chat down
  // without changing the size of any element a ResizeObserver is watching.
  useEffect(() => {
    measureChrome();
  });

  useEffect(() => {
    const observer = new ResizeObserver(measureChrome);
    observer.observe(document.body);
    window.addEventListener("resize", measureChrome);
    window.addEventListener("orientationchange", measureChrome);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureChrome);
      window.removeEventListener("orientationchange", measureChrome);
    };
  }, [measureChrome]);

  const isLoggedIn = Boolean(session);
  const overLimit = message.length > MAX_MESSAGE_LENGTH;
  // An image on its own is a valid message — the caption is optional.
  const canSend =
    (message.trim().length > 0 || !!attachment) &&
    !isLoading &&
    !attaching &&
    !overLimit;


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

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxUrl]);

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

  /**
   * Downscales and encodes the picked file, replacing any image already
   * staged — one image per message keeps the request small and the cost
   * predictable.
   */
  const attachFile = useCallback(async (file: File) => {
    setError("");
    setAttaching(true);

    try {
      setAttachment(await prepareImageAttachment(file));
    } catch (err) {
      setAttachment(null);
      setError(
        err instanceof ImageAttachmentError
          ? err.message
          : "That image could not be attached. Please try another one."
      );
    } finally {
      setAttaching(false);
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so picking the same file twice in a row still fires onChange.
    event.target.value = "";
    if (file) void attachFile(file);
  };

  // Screenshots are the most common thing people want to ask about, and they
  // arrive on the clipboard rather than as a file on disk.
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (isLoading || attaching) return;

    const item = Array.from(event.clipboardData?.items ?? []).find(
      (entry) => entry.kind === "file" && ACCEPTED_IMAGE_TYPES.includes(entry.type)
    );

    if (!item) return;

    const file = item.getAsFile();
    if (!file) return;

    event.preventDefault();
    void attachFile(file);
  };

  /**
   * Asks the AI to reply to `conversation`, whose last entry must be the user
   * message being answered. Kept separate from `submitMessage` so a retry can
   * re-run the request against the existing conversation instead of appending
   * the user's message a second time.
   */
  const requestReply = useCallback(async (conversation: ChatMessage[]) => {
    const pending = conversation[conversation.length - 1];
    if (!pending || pending.role !== "user") return;

    const userMessage = pending.content;

    setIsLoading(true);
    setError("");
    setLastFailedMessage(null);

    try {
      const history = conversation
        .slice(-(HISTORY_MESSAGE_LIMIT + 1), -1)
        .map((item) => ({
          role: item.role === "bot" ? "assistant" : "user",
          content: item.content,
        }));

      const { data, error: fnError } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: userMessage,
          history,
          chatType: chatType || "sports",
          // Read per turn rather than at mount, so a device that crosses a
          // zone — or rolls past midnight — is right on the next message.
          timeZone: resolvedTimeZone(),
          // Only the pending turn's image travels; `history` is text-only.
          ...(pending.imageUrl ? { image: pending.imageUrl } : {}),
        },
      });

      if (fnError) throw fnError;

      // Every tool-capable build of ai-chat reports which tools it ran, even
      // when that list is empty. Its absence means an older function is still
      // deployed, which the user only sees as the assistant claiming it has no
      // access to their data — worth saying out loud rather than leaving to guesswork.
      if (data && !Array.isArray(data.toolsUsed)) {
        console.warn(
          "[SportLab] The deployed ai-chat function is out of date: it did not " +
            "report tool usage, so the assistant cannot read your profile or " +
            "check-ins and will say it has no access to your data. " +
            "Redeploy it with: supabase functions deploy ai-chat"
        );
      }

      // An image only reaches the model if the DEPLOYED function understands
      // the `image` field. An older deployment parses the JSON, ignores it and
      // answers the caption alone, so the picture appears to upload fine and
      // the assistant simply says it cannot see anything. Say what is actually
      // wrong instead of leaving it to look like a model failure.
      if (pending.imageUrl && data && data.imageReceived !== true) {
        console.warn(
          "[SportLab] The deployed ai-chat function did not accept the attached " +
            "image, so the assistant never saw it. Redeploy it with: " +
            "supabase functions deploy ai-chat"
        );
        setError(
          "The server did not receive the attached image, so the assistant " +
            "answered without it. The ai-chat function needs to be redeployed."
        );
      }

      const reply = data?.reply;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((prev) => [...prev, { role: "bot", content: reply.trim(), timestamp: new Date() }]);

      // Persist the exchange only once it succeeded, and in order — a failed
      // turn used to leave an orphan user message with no reply in the history.
      if (chatType) {
        saveChatExchange(userMessage, reply.trim(), chatType).catch(() => {});
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed. Try again.";
      setError(msg);
      setLastFailedMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  }, [chatType]);

  const submitMessage = useCallback((text: string, image?: ImageAttachment | null) => {
    // A caption is optional when there is an image, so fall back to a prompt
    // that reads sensibly both to the model and in the saved transcript.
    const typed = text.trim();
    const userMessage = typed || (image ? "What can you tell me about this image?" : "");

    if (!userMessage || isLoading || typed.length > MAX_MESSAGE_LENGTH) return;

    if (!isLoggedIn) {
      setError("Sign in to start chatting with the AI.");
      return;
    }

    const next: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
        ...(image ? { imageUrl: image.dataUrl } : {}),
      },
    ];

    setMessages(next);
    setMessage("");
    setAttachment(null);
    void requestReply(next);
  }, [messages, isLoading, isLoggedIn, requestReply]);

  const retryLastMessage = useCallback(() => {
    if (isLoading) return;
    // `messages` still ends with the user message that failed, so replaying the
    // conversation as-is retries it without duplicating anything.
    void requestReply(messages);
  }, [messages, isLoading, requestReply]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) submitMessage(message, attachment);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) submitMessage(message, attachment);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    if (chatType) clearChatHistory(chatType).catch(() => {});
  };

  return (
    <main className="ai-page" ref={pageRef}>
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
              <div className="history-skeleton" aria-live="polite" aria-busy="true">
                <span className="sr-only">Loading conversation history</span>
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className={`skeleton-row ${row % 2 === 1 ? "skeleton-user" : ""}`}
                  >
                    <div className="skeleton-avatar" />
                    <div className="skeleton-bubble" />
                  </div>
                ))}
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
                className={`message-row ${item.role === "user" ? "user-row" : "bot-row"}`}
              >
                <div className={`avatar ${item.role === "bot" ? "bot-avatar" : "user-avatar"}`}>
                  {item.role === "bot" ? "AI" : "U"}
                </div>

                <div
                  className={`message-content ${
                    item.role === "user" ? "user-message-content" : "bot-message-content"
                  }`}
                >
                  <div className={`message ${item.role === "user" ? "user-message" : "bot-message"}`}>
                    {item.role === "bot" ? (
                      formatBotMessage(item.content)
                    ) : (
                      <>
                        {item.imageUrl && (
                          <button
                            type="button"
                            className="message-image-btn"
                            onClick={() => setLightboxUrl(item.imageUrl ?? null)}
                            aria-label="View attached image full size"
                          >
                            <img
                              src={item.imageUrl}
                              alt="Attached by you"
                              className="message-image"
                            />
                          </button>
                        )}
                        <span className="user-message-text">{item.content}</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`message-meta ${
                      item.role === "user" ? "user-message-meta" : "bot-message-meta"
                    }`}
                  >
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
            <div className="chat-error" role="alert">
              <span>{error}</span>
              {lastFailedMessage && (
                <button
                  type="button"
                  className="retry-btn"
                  onClick={retryLastMessage}
                  disabled={isLoading}
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
              {(attachment || attaching) && (
                <div className="attachment-strip" aria-live="polite">
                  {attaching ? (
                    <span className="attachment-pending">Preparing image…</span>
                  ) : attachment ? (
                    <div className="attachment-chip">
                      <img src={attachment.dataUrl} alt="" className="attachment-thumb" />
                      <span className="attachment-name" title={attachment.name}>
                        {attachment.name}
                      </span>
                      <span className="attachment-size">
                        {formatAttachmentSize(attachment.bytes)}
                      </span>
                      <button
                        type="button"
                        className="attachment-remove"
                        onClick={() => setAttachment(null)}
                        aria-label={`Remove attached image ${attachment.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="input-container">
                {/*
                  * display:none rather than .sr-only — the composer's
                  * `.input-container input` rule is more specific than
                  * .sr-only and would put padding and flex sizing back on it.
                  * Programmatic .click() still opens the picker either way,
                  * and the visible trigger below carries the label.
                  */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_ACCEPT_ATTR}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  onChange={handleFileChange}
                />
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={isRecording ? "Listening…" : inputPlaceholder}
                  disabled={isLoading}
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH + 100}
                  aria-label={inputPlaceholder}
                  aria-describedby="chat-input-hint"
                  aria-invalid={overLimit}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || attaching}
                  aria-label="Attach an image"
                >
                  <span aria-hidden="true">📎</span>
                </button>
                <button
                  type="button"
                  className={`icon-btn ${isRecording ? "recording" : ""}`}
                  onClick={handleMicClick}
                  aria-label="Use voice input"
                  aria-pressed={isRecording}
                >
                  <span aria-hidden="true">🎤</span>
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
              <div className="input-hint" id="chat-input-hint" aria-live="polite">
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
                <li
                  key={example}
                  role="button"
                  tabIndex={0}
                  onClick={() => submitMessage(example)}
                  // Announced as a button, so it has to behave like one: a real
                  // button fires on Space as well as Enter. Space alone used to
                  // scroll the page instead, which is its default on a focused
                  // non-button — hence the preventDefault.
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      submitMessage(example);
                    }
                  }}
                >
                  {example}
                </li>
              ))}
            </ul>
            {footerNote && <div className="chat-footer-note">{footerNote}</div>}
          </section>
        </aside>
      </section>

      {lightboxUrl && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Attached image"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Attached by you, full size" />
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close image"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}