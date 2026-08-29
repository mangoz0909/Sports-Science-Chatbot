/**
 * Prerenders the public routes to static HTML after `react-scripts build`.
 *
 * Why: this is a client-rendered SPA, so every URL ships the same index.html.
 * Google executes JavaScript and eventually sees the per-route <Seo> tags, but
 * social scrapers (Facebook, X, LinkedIn, Slack, Discord) do not — they read
 * the raw HTML and stop. Without this step every shared link, whatever its
 * path, previews as the generic homepage card.
 *
 * How: serve build/, drive a real Chrome over each route, dedupe the head, and
 * write the rendered DOM to build/<route>/index.html.
 *
 * This step is deliberately non-fatal. A prerender failure leaves the normal
 * SPA build in place and exits 0 rather than breaking a production deploy.
 * Set PRERENDER=false to skip it.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const BUILD_DIR = path.join(__dirname, "..", "build");
const SITE_URL = "https://sportslabai.onrender.com";

// Keep in sync with public/sitemap.xml — these are the indexable routes.
const ROUTES = ["/", "/sports", "/sports-list", "/health/workout", "/health/nutrition"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/**
 * Static server mirroring the host's SPA fallback. The fallback deliberately
 * serves the pristine template held in memory: prerendered output is only
 * flushed to disk once every route has been captured, so one route's baked-in
 * tags can never leak into the next route's capture.
 */
function startServer(templateHtml) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(BUILD_DIR, urlPath);

    // Never let a crafted path escape the build directory.
    if (!filePath.startsWith(BUILD_DIR) || !path.extname(filePath) || !fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(templateHtml);
      return;
    }

    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/**
 * Sections lower down animate in on scroll, so at a fixed viewport they never
 * fire and stay at opacity:0. Walk the page to trigger them before capturing.
 */
async function scrollThroughPage() {
  const step = Math.round(window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
}

/**
 * Safety net for anything the scroll pass missed. Content left at opacity:0 in
 * the static HTML reads as hidden to a crawler, so reveal it — the live app is
 * unaffected, since React re-renders #root on mount and reapplies its own
 * animation state.
 */
function revealAnimatedContent() {
  let revealed = 0;
  document.querySelectorAll('[style*="opacity"]').forEach((el) => {
    const value = el.style.opacity;
    if (value !== "" && parseFloat(value) < 0.99) {
      el.style.opacity = "1";
      if (el.style.transform) el.style.transform = "none";
      revealed++;
    }
  });
  return revealed;
}

/**
 * The template ships static SEO defaults and Helmet adds the route's own on
 * mount, so a raw capture contains both. Collapse them so crawlers read exactly
 * one title, one canonical and one of each og/twitter tag.
 *
 * Only these SEO tags are collapsed. Icons, viewport, og:image dimensions and
 * the JSON-LD blocks are left alone, since multiples of those are legitimate.
 */
function dedupeHead(expectedCanonical) {
  // Title and canonical are pinned to authoritative values rather than to
  // document order: document.title is whatever Helmet actually set, and the
  // canonical must be this route's. Relying on "the last one wins" here was
  // wrong once already — Helmet can emit its tags before the template's.
  const titles = [...document.head.querySelectorAll("title")];
  const liveTitle = document.title;
  const keptTitle = titles.find((t) => t.textContent === liveTitle) || titles[titles.length - 1];
  titles.forEach((t) => t !== keptTitle && t.remove());

  const canonicals = [...document.head.querySelectorAll("link[rel=canonical]")];
  const keptCanonical =
    canonicals.find((l) => l.href === expectedCanonical || l.href === expectedCanonical + "/") ||
    canonicals[canonicals.length - 1];
  canonicals.forEach((l) => l !== keptCanonical && l.remove());

  // The rest are unambiguous: Helmet appends after the template's static tags.
  const keepLast = (selector, keyOf) => {
    const seen = new Map();
    document.head.querySelectorAll(selector).forEach((el) => {
      const key = keyOf(el);
      if (seen.has(key)) seen.get(key).remove();
      seen.set(key, el);
    });
  };
  keepLast('meta[name="description"], meta[name="robots"], meta[name^="twitter:"]', (el) =>
    el.getAttribute("name"),
  );
  keepLast('meta[property^="og:"]', (el) => el.getAttribute("property"));

  // Mark exactly the tags <Seo> re-emits on mount. Without this the runtime
  // adds a second copy of each on top of the baked ones, and a crawler that
  // executes JavaScript reads two canonicals — which Google may ignore
  // outright. <Seo> drops everything marked here once Helmet has taken over,
  // so raw HTML and rendered DOM each end up with exactly one set.
  const HELMET_OWNED = [
    "title",
    "link[rel=canonical]",
    'meta[name="description"]',
    'meta[name="robots"]',
    'meta[name="twitter:card"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:alt"]',
    'meta[property="og:type"]',
    'meta[property="og:site_name"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
    'meta[property="og:image"]',
    'meta[property="og:image:alt"]',
  ].join(", ");
  document.head.querySelectorAll(HELMET_OWNED).forEach((el) => el.setAttribute("data-prerendered", ""));

  // The template's Organization/WebSite graph is static and stays; the route's
  // BreadcrumbList is Helmet's and would otherwise double up.
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    if (el.textContent.includes("BreadcrumbList")) el.setAttribute("data-prerendered", "");
  });
}

async function prerenderRoute(browser, origin, route) {
  const expected = `${SITE_URL}${route}`;
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });

    // DemoRoute renders null while AuthContext resolves, so "#root has children"
    // is not enough. Wait for the route's own <h1> and for <Seo> to have added
    // this route's canonical — together those prove the page really rendered.
    await page.waitForFunction(
      (want) => {
        const h1 = document.querySelector("h1");
        const hasCanonical = [...document.querySelectorAll("link[rel=canonical]")].some(
          (l) => l.href === want || l.href === want + "/",
        );
        return !!h1 && h1.textContent.trim().length > 0 && hasCanonical;
      },
      { timeout: 45000 },
      expected,
    );

    // framer-motion animates via inline styles, so a capture taken mid-flight
    // bakes opacity:0 into the HTML a crawler reads.
    await page
      .waitForFunction(
        () => {
          const h1 = document.querySelector("h1");
          return h1 && parseFloat(getComputedStyle(h1).opacity) > 0.99;
        },
        { timeout: 15000 },
      )
      .catch(() => console.warn(`    !   ${route}: h1 never reached full opacity, capturing anyway`));

    await page.evaluate(scrollThroughPage);

    // Wait for the animations themselves to finish rather than guessing at a
    // delay — framer-motion drives these through the Web Animations API.
    await page
      .waitForFunction(() => !document.getAnimations().some((a) => a.playState === "running"), {
        timeout: 15000,
      })
      .catch(() => console.warn(`    !   ${route}: animations still running, capturing anyway`));

    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(dedupeHead, expected);

    // Reveal last, immediately before the capture: an element that re-applied
    // opacity:0 while settling would otherwise slip through.
    const revealed = await page.evaluate(revealAnimatedContent);
    if (revealed) console.log(`    ~   ${route}: revealed ${revealed} still-animating element(s)`);

    const html = await page.content();
    const meta = await page.evaluate(() => ({
      title: document.title,
      headTitle: document.querySelector("title")?.textContent,
      canonical: document.querySelector("link[rel=canonical]")?.href,
      canonicals: document.querySelectorAll("link[rel=canonical]").length,
      titles: document.querySelectorAll("title").length,
      text: document.body.innerText.replace(/\s+/g, " ").trim().length,
    }));

    if (meta.canonical !== expected && meta.canonical !== expected + "/") {
      throw new Error(`canonical is ${meta.canonical}, expected ${expected}`);
    }
    if (meta.headTitle !== meta.title) {
      throw new Error(`head <title> is "${meta.headTitle}" but document.title is "${meta.title}"`);
    }
    if (meta.canonicals !== 1 || meta.titles !== 1) {
      throw new Error(`head not deduped (${meta.titles} titles, ${meta.canonicals} canonicals)`);
    }

    return { route, html, meta };
  } finally {
    await page.close();
  }
}

async function main() {
  if (process.env.PRERENDER === "false") {
    console.log("\n  Prerender skipped (PRERENDER=false).\n");
    return;
  }

  const templatePath = path.join(BUILD_DIR, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.warn("\n  Prerender skipped: build/index.html not found.\n");
    return;
  }
  const templateHtml = fs.readFileSync(templatePath, "utf8");

  const puppeteer = require("puppeteer");
  const { server, port } = await startServer(templateHtml);
  const origin = `http://127.0.0.1:${port}`;
  console.log(`\n  Prerendering ${ROUTES.length} routes`);

  const captured = [];
  let browser;
  try {
    browser = await puppeteer.launch({
      // Required in most CI/container build environments.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    for (const route of ROUTES) {
      try {
        captured.push(await prerenderRoute(browser, origin, route));
      } catch (err) {
        console.warn(`    !!  ${route}: ${err.message.split("\n")[0]}`);
      }
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  // Flush only after every capture, so nothing written here influenced a capture.
  for (const { route, html, meta } of captured) {
    const outDir = route === "/" ? BUILD_DIR : path.join(BUILD_DIR, route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
    const kb = (Buffer.byteLength(html) / 1024).toFixed(1).padStart(7);
    console.log(`    ok  ${route.padEnd(19)} ${kb} KB  ${String(meta.text).padStart(5)} chars  "${meta.title}"`);
  }

  console.log(`\n  Prerendered ${captured.length}/${ROUTES.length} routes.\n`);
  if (captured.length === 0) console.warn("  No routes prerendered — the SPA build is still intact.\n");
}

main().catch((err) => {
  // Never fail the production build over prerendering.
  console.warn(`\n  Prerender failed, shipping the plain SPA build instead:\n  ${err.message}\n`);
  process.exit(0);
});
