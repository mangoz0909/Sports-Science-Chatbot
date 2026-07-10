const PUTER_SCRIPT_ID = "puter-js-v2";

export function loadPuterScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (window.puter?.ai?.chat) { resolve(); return; }
    const existing = document.getElementById(PUTER_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Puter.js.")), { once: true });
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
