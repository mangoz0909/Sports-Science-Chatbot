# SportLab AI — client

React + TypeScript front end, built with [Vite](https://vite.dev). Supabase
provides auth and the database; the OpenAI calls live in Supabase edge
functions under `supabase/functions`, never in the browser.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase project values
npm start
```

The app runs at http://localhost:3000.

Environment variables keep the **`REACT_APP_` prefix** from the project's
Create React App days. That is deliberate — `vite.config.ts` sets
`envPrefix` to match, so existing `.env` files and the production hosting
config did not have to change during the migration. `src/lib/supabaseClient.ts`
throws at import time when the Supabase variables are missing, and
`src/index.tsx` catches that to render a readable startup error rather than a
blank page.

## Scripts

| Script | What it does |
| --- | --- |
| `npm start` / `npm run dev` | Vite dev server on port 3000, with HMR. |
| `npm run build` | Typechecks, builds to `build/`, then prerenders the public routes. |
| `npm run build:spa` | Build only — skips the prerender step. |
| `npm run preview` | Serves the built `build/` folder locally. |
| `npm test` | Runs the Vitest suite once. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run lint` | ESLint over the project. |
| `npm run deploy` | Full build, then copies `build/` into `../docs`. |

The build output directory is `build/` rather than Vite's default `dist/`,
because both `scripts/prerender.js` and the deploy script address it by name.

## Prerendering

`scripts/prerender.js` runs after the build. The app is client-rendered, so
every URL would otherwise ship the same `index.html` — Google executes
JavaScript and eventually sees the per-route `<Seo>` tags, but social scrapers
(Facebook, X, LinkedIn, Slack, Discord) read the raw HTML and stop. Without
this step every shared link previews as the generic homepage card.

It serves `build/`, drives a real Chrome over each public route, dedupes the
`<head>`, and writes the rendered DOM back to `build/<route>/index.html`. It
waits for each route's own `<h1>` and canonical tag rather than a fixed timer,
which is what makes it safe with lazily-loaded routes.

The step is deliberately non-fatal: a prerender failure leaves the normal SPA
build in place and exits 0. Set `PRERENDER=false` to skip it.

## Tests

Vitest with jsdom, configured in the `test` block of `vite.config.ts`.
`describe`/`it`/`expect` are globals; `vi` is imported where mocking is needed.

```bash
npm test
```

## Supabase

SQL lives in `supabase/migrations` and is applied with `supabase db push`.
Edge functions are deployed individually:

```bash
supabase functions deploy ai-chat
```

`ai-chat` and `ai-complete` read `OPENAI_API_KEY`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY` and the comma-separated `ALLOWED_ORIGINS` from the function
environment. `delete-account` additionally needs `SUPABASE_SERVICE_ROLE_KEY`.
The client never holds an OpenAI key.
