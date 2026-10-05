/**
 * Landing page design tokens ("Lab Sheet").
 *
 * Scope: the public home page only (src/pages/Home.tsx and components/home/*).
 * The signed-in app keeps its own styling. Documented in
 * components/home/DESIGN_SYSTEM.md — change a value there and here together.
 *
 * Borrowed from open-source sites that don't look generated:
 * - PostHog (PostHog/posthog.com): soft paper neutrals, tiny radii, no shadows.
 * - Liftosaur (astashov/liftosaur): the real product UI and real data are the
 *   hero, not an illustration.
 * - Plausible (plausible/analytics): flat, plain-spoken, one accent colour.
 */

export const color = {
  // Same family as the rest of the site (header/footer navy #0f172a, sky
  // #0284c7 / #38bdf8), nudged: neutrals a touch softer than Tailwind slate,
  // the accent a deeper sky so it passes AA as a button and as text.
  paper: "#F4F6F8", // page background
  sheet: "#FFFFFF", // raised "paper sheet" surfaces (product previews)
  wash: "#E8ECF1", // row hover, empty meter segments
  rule: "#D5DCE5", // hairlines, table rules
  ruleStrong: "#0F172A", // 2px section rules (same as ink)
  ink: "#0F172A", // brand navy: headings, body, dark bands — 16.5:1 on paper
  ink2: "#3B4658", // secondary text — 8.8:1 on paper
  ink3: "#5A6577", // captions, meta — 5.4:1 on paper (not below 13px)
  accent: "#0A6A9E", // the one accent: deep sky — 5.4:1 on paper, 5.9:1 under white text
  accentHover: "#08557F",
  // On the ink band
  onInk: "#F4F6F8",
  onInk2: "#9AA6B8", // 7.2:1 on ink
  accentOnInk: "#38BDF8", // brand sky — 8.3:1 on ink, and ink text on it is 8.3:1
  ruleOnInk: "rgba(244,246,248,0.16)",
  // Readiness status — only for data, never decoration
  go: "#1F7A4D",
  caution: "#946013",
  stop: "#B42318",
} as const;

export const font = {
  display: '"Barlow Condensed", "Arial Narrow", sans-serif', // headings: scoreboard / kit-number feel
  body: '"Barlow", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, Consolas, monospace', // numbers, routes, indexes
} as const;

/** Type scale. Display sizes are fluid; everything else is fixed. */
export const type = {
  hero: { fontFamily: font.display, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.01em", fontSize: "clamp(3rem, 8.5vw, 6.5rem)", textTransform: "uppercase" as const },
  h2: { fontFamily: font.display, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.005em", fontSize: "clamp(2rem, 4.5vw, 3.25rem)", textTransform: "uppercase" as const },
  h3: { fontFamily: font.body, fontWeight: 600, lineHeight: 1.3, fontSize: "1.25rem" },
  lead: { fontFamily: font.body, fontWeight: 400, lineHeight: 1.55, fontSize: "clamp(1.0625rem, 1.6vw, 1.25rem)" },
  body: { fontFamily: font.body, fontWeight: 400, lineHeight: 1.6, fontSize: "1rem" },
  label: { fontFamily: font.mono, fontWeight: 500, lineHeight: 1.4, fontSize: "0.8125rem", letterSpacing: "0.02em" },
  data: { fontFamily: font.mono, fontWeight: 500, fontVariantNumeric: "tabular-nums" },
} as const;

/** 4px base. Use these, not ad-hoc numbers. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64, 9: 96, 10: 128 } as const;

/** Only three radii. Nothing is a pill except status dots. */
export const radius = { sm: 2, md: 4, lg: 8 } as const;

/** No elevation shadows. Depth comes from rules and the sheet/paper contrast. */
export const focusRing = `0 0 0 2px ${color.paper}, 0 0 0 4px ${color.accent}`;

export const layout = {
  maxWidth: 1200,
  gutter: { xs: 2, md: 4 }, // MUI spacing units (8px)
  sectionY: { xs: 8, md: 12 }, // MUI spacing units
} as const;

export const motion = {
  fast: 0.12, // hover / colour
  base: 0.22,
  slow: 0.36, // section entrance — the longest anything takes
  easeOut: [0.05, 0.7, 0.1, 1] as const,
  easeIn: [0.3, 0, 1, 1] as const,
  rise: 12, // px — entrance offset
} as const;
