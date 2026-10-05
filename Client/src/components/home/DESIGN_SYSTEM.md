# Landing design system — "Lab Sheet"

Scope: the public home page (`src/pages/Home.tsx`, `src/components/home/*`).
The header and footer share the **fonts** only (Barlow for text, Barlow Condensed
for the "SportLab AI" wordmark, IBM Plex Mono for the footer's small labels);
their colours are already the same navy/sky family. The signed-in pages keep
their own styling.

Code lives in two files:
- `landingTokens.ts` — colours, fonts, type scale, spacing, radii, motion
- `LandingPrimitives.tsx` — `Frame`, `SectionHead`, `PrimaryButton`, `TextLink`, `Meter`, `Reveal`

## Why it looks like this

The old page had most of the patterns that make a site read as generated: pill
labels over the H1, text-left / floating-app-card-right hero, a stat row with
animated counters, blurred gradient blobs, a shimmer line, every section as
"heading + grid of icon cards", bobbing icons, and the H1 starting at opacity 0
(blank for crawlers until JavaScript ran).

The replacement borrows from open-source sites that don't look generated:

| Source (GitHub) | What we took | What we didn't |
|---|---|---|
| [PostHog/posthog.com](https://github.com/PostHog/posthog.com) | Soft paper neutrals; radii of 2–4px; no shadows, depth from borders | Their mascot-heavy, playful tone |
| [astashov/liftosaur](https://github.com/astashov/liftosaur) | Show the real product UI and real field names as the hero; data in tables, numbers in monospace | App-store buttons, testimonials |
| [plausible/analytics](https://github.com/plausible/analytics) | Flat, plain-spoken copy; one accent colour; no invented numbers | Comparison-to-competitor framing |

The concept is a **training log sheet**: paper, ruled lines, a condensed
scoreboard face for headings, monospace for anything that is a number or a route.

## Tokens

### Colour

Same family as the rest of the site — header/footer navy `#0f172a`, sky
`#0284c7` / `#38bdf8` — nudged rather than replaced: the neutrals are a touch
softer than stock Tailwind slate, and the accent is a deeper sky so it passes AA
as a button and as text (`#0284c7` is only 4.1:1 on white).

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `paper` | `#F4F6F8` | Page background | — |
| `sheet` | `#FFFFFF` | Product previews (the check-in sheet) | — |
| `wash` | `#E8ECF1` | Row hover, empty meter segments | — |
| `rule` | `#D5DCE5` | Hairlines between rows | — |
| `ink` | `#0F172A` | Brand navy: headings, body, dark bands, 2px section rules | 16.5:1 on paper |
| `ink2` | `#3B4658` | Secondary text | 8.8:1 |
| `ink3` | `#5A6577` | Captions, routes, indexes (≥13px) | 5.4:1 |
| `accent` | `#0A6A9E` | **The only accent.** Primary button, index numbers, link hover | 5.4:1 on paper, 5.9:1 under white |
| `accentHover` | `#08557F` | Primary button hover | 8.0:1 under white |
| `onInk` / `onInk2` | `#F4F6F8` / `#9AA6B8` | Text on navy bands | 16.5:1 / 7.2:1 |
| `accentOnInk` | `#38BDF8` | Brand sky on navy bands (button with navy text) | 8.3:1 both ways |
| `go` / `caution` / `stop` | `#1F7A4D` / `#946013` / `#B42318` | Readiness data **only** — never decoration | ≥4.9:1 on paper |

No gradients anywhere, and no second accent.

### Type

| Role | Font | Weight | Size |
|---|---|---|---|
| `hero` | Barlow Condensed, uppercase | 700 | `clamp(3rem, 8.5vw, 6.5rem)`, line-height 0.95 |
| `h2` | Barlow Condensed, uppercase | 700 | `clamp(2rem, 4.5vw, 3.25rem)` |
| `h3` | Barlow | 600 | 1.25rem |
| `lead` | Barlow | 400 | `clamp(1.0625rem, 1.6vw, 1.25rem)` |
| `body` | Barlow | 400 | 1rem / 1.6 |
| `label` | IBM Plex Mono | 500 | 0.8125rem — indexes, routes, "example" tags |
| `data` | IBM Plex Mono, tabular nums | 500 | inherits — every number |

Condensed caps read like a scoreboard or kit number; that is the reason for the
choice. No weight above 700 (the old page used 950 everywhere).

### Space, radius, depth

- Spacing: 4px base — `4 8 12 16 24 32 48 64 96 128`. Sections: 64px mobile / 96px desktop vertical.
- Max width 1200px, 16px gutter on mobile, 32px desktop.
- Radius: `sm 2` (meter segments), `md 4` (buttons), `lg 8` (the sheet). Nothing else is rounded.
- Shadows: none. The only box-shadow is the focus ring: 2px paper + 2px accent.

### Motion (level 1 — restrained)

- One entrance: `Reveal` — fade + 12px rise, 360ms, `cubic-bezier(0.05,0.7,0.1,1)`, once.
- Hover: colour/background only, 120ms. No lift, no scale.
- Press: 1px down.
- Nothing loops. No counters, parallax, blobs, shimmer, or word-by-word reveals.
- The hero never animates — it must be readable before JavaScript (the page is prerendered).
- `prefers-reduced-motion`: `Reveal` renders in place with no animation.

## Components

### `SectionHead`
Mono index (`01`) + condensed uppercase H2 over a 2px ink rule, optional lead.
Replaces pill eyebrow labels. Props: `index`, `title`, `id` (for `aria-labelledby`), `onInk`, children (lead).

### `PrimaryButton`
Deep sky (`accent`), 48px tall, 4px radius, mono arrow. **One per section at most.**
States: hover darkens (`accentHover`); focus shows the ring; active moves 1px. On ink bands use `onInk` (brand sky with navy text, hover goes paper).

### `TextLink`
The secondary action. Underlined text, the underline turns `accent` on hover. Never a second outlined button.

### `Meter`
Ten segments for a 1–10 check-in value. `invert` for fields where high is bad
(fatigue, soreness, stress). Colour comes from the value: ≥7 good → `go`, 4–6 →
`caution`, ≤3 → `stop`. Has `role="img"` and an aria-label ("Fatigue: 4 out of 10").

### `Reveal`
See motion. Don't nest them, don't stagger them, don't use in the hero.

## Patterns used on the page

| Section | Pattern | Replaces |
|---|---|---|
| Hero | Full-width headline, then lead + actions beside a real **check-in sheet** (actual field names from `DailyCheckIn.tsx`, labelled "example") with a coach note | Pills, split hero with floating mock card, stat row, blobs |
| 01 What it helps with | Numbered, ruled two-column list | Four icon cards |
| Ink band | Three columns split by hairlines | Three icon cards + shimmer |
| 02 Everything in the app | Index table: name, description, route in mono, arrow — whole row is the link | Seven cards with coloured bars and bobbing icons |
| Closing | Ink band, left-aligned headline, one button + one text link | Rounded panel with circles and a bouncing ball |

Every section has a different shape on purpose.

## Rules

| Do | Don't |
|---|---|
| Show the product's real fields, routes and wording | Invent stats, testimonials, user counts |
| Label example data as "example" | Animate counters |
| Use mono for numbers and routes | Use icons as section decoration |
| Use `go/caution/stop` only for data | Add a second accent colour or any gradient |
| Vary section shapes by content | Default to a grid of cards |
| Keep copy plain and specific | "Empower", "seamless", "unlock", "AI-powered interface" |

## Extending

New landing section? Start from `Frame` + `SectionHead`, pick a shape the content
needs (list, table, quote, band, sheet), and take every value from
`landingTokens.ts`. If you need a value that isn't a token, add the token here
and in the file — don't hardcode it.
