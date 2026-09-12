# SportLab AI — client

React + TypeScript front end, built with [Vite](https://vite.dev). Supabase
provides auth and the database; the OpenAI calls live in Supabase edge
functions under `supabase/functions`, never in the browser.

## Setup

**Prerequisites:** Node 20.19+ (or 22.12+) and npm. Vite 7 and Vitest 5 both
require it, and on an older Node the failure is a confusing build error rather
than a clear message — `package.json` declares `engines` so npm warns you first.
Check with `node -v`.

You also need a **Supabase project**. The app cannot start without one:
`src/lib/supabaseClient.ts` throws at import time when its two variables are
missing.

From a clean machine:

```bash
git clone https://github.com/mangoz0909/Sports-Science-Chatbot.git
```

The front end lives in the `Client/` subdirectory, not the repository root —
every command below is run from there:

```bash
cd Sports-Science-Chatbot/Client
npm install
cp .env.example .env
```

Then open `.env` and fill in the two values from your Supabase project
(Settings → API): the project URL and the **anon** public key. Never the
service-role key — this file is compiled into the browser bundle.

```bash
npm start
```

The app runs at http://localhost:3000. If that port is taken Vite moves to
another (`strictPort` is false), so read the port it prints rather than assuming
3000 — and add the one it chose to the edge functions' `ALLOWED_ORIGINS`, or
their CORS check will reject your requests.

Nothing else is required to run the front end. The Supabase CLI below is only
needed to change the database or the edge functions.

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
| `npm run check:functions` | Type-checks the Supabase edge functions with Deno. |
| `npm run check` | All four gates: typecheck, lint, tests, edge functions. |
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

`.env.test` holds placeholder Supabase values so the suite runs without a real
`.env` — `supabaseClient.ts` throws at import time otherwise, which would fail
every test that transitively imports a service. No network call is made.

Two page-local functions are tested by extracting them from source rather than
exporting them (`resetArrival.test.ts`, `redirectError.test.ts`). That is
deliberate: it keeps the test honest, exercising the shipped function instead of
a copy that can drift out of sync.

## Supabase

Only needed to change the database or the edge functions — running the front
end does not require the CLI.

Link the project once per machine. The project ref is in your Supabase
dashboard URL:

```bash
npx supabase link --project-ref <your-project-ref>
```

SQL lives in `supabase/migrations` and is applied with `supabase db push`.

**Edge functions do not ship with the front end.** Pushing to `main` deploys
the site; the functions stay on whatever version was last deployed until you
deploy them yourself:

```bash
npx supabase functions deploy ai-chat ai-complete delete-account
```

That is the usual cause of the app behaving as though a fix never landed. Two
symptoms are specific enough to name: the browser console warning that the
deployed `ai-chat` "did not report tool usage" means the assistant cannot read
the athlete's profile or check-ins, and "the server did not receive the attached
image" means it is running a build that predates image support. Both mean the
same thing — redeploy the function.

`ai-chat` and `ai-complete` read `OPENAI_API_KEY`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY` and the comma-separated `ALLOWED_ORIGINS` from the function
environment. `delete-account` additionally needs `SUPABASE_SERVICE_ROLE_KEY`.
The client never holds an OpenAI key.

`tsconfig.json` includes only `src`, so `tsc --noEmit` never sees these files.
They are type-checked separately, against each function's own `deno.json` —
which is how Supabase deploys them, one function to one config:

```bash
npm run check:functions
```

Run it before deploying. Functions are discovered from the directory rather
than listed in the script, so a new one is covered the day it is created.

Deno is deliberately not a dependency: the script uses a system `deno` when
there is one and falls back to `npx deno@2` otherwise, which downloads and
caches it on first use. Nothing to install on a clean machine.

There are still no *tests* for these three files — the typecheck catches a
typo or a wrong shape, not a wrong decision.
