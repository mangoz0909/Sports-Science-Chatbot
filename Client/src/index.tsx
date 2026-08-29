import React from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

/**
 * Shown when the app cannot start at all.
 *
 * Deliberately plain: no MUI, no router, no theme, nothing imported beyond
 * React. Whatever broke startup may well be one of those things, and a
 * fallback that can fail too is not a fallback.
 */
function StartupError({ detail }: { detail: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "560px", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 12px" }}>
          SportLab AI could not start
        </h1>
        <p style={{ margin: "0 0 20px", lineHeight: 1.7, color: "#475569" }}>
          The app is missing part of its configuration, so nothing can load.
          This is a setup problem rather than something you did.
        </p>
        <pre
          style={{
            margin: 0,
            padding: "14px 16px",
            textAlign: "left",
            overflowX: "auto",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            color: "#334155",
            fontSize: "13px",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {detail}
        </pre>
      </div>
    </div>
  );
}

/*
 * App is loaded dynamically so that a module which throws while initialising
 * can be caught and shown.
 *
 * lib/supabaseClient throws at module scope when its environment variables are
 * missing, and a static `import App from "./App"` is evaluated before any code
 * in this file runs — so the throw escaped before React existed, ErrorBoundary
 * included, and a misconfigured deploy rendered a blank white page with the
 * reason only in the console. Nobody checks the console of a page that looks
 * empty; they file a bug about a white screen.
 */
import("./App")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error: unknown) => {
    console.error("SportLab AI could not start:", error);

    root.render(
      <StartupError
        detail={
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading the application."
        }
      />
    );
  });
