import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Build config, replacing react-scripts.
 *
 * CRA was abandoned upstream in 2022 and its dependency tree carried 64 npm
 * advisories, 32 high and 3 critical. All of them were build-time — none
 * shipped to a browser — but staying on an unmaintained toolchain meant they
 * could never be resolved, only re-reported.
 *
 * Two settings here exist to keep the surrounding project working unchanged
 * rather than because they are Vite's defaults; both are load-bearing.
 */
export default defineConfig({
  plugins: [react()],

  server: {
    // .claude/launch.json and the CRA muscle memory both expect 3000.
    port: 3000,
    strictPort: false,
  },

  preview: {
    port: 4173,
  },

  /*
   * `REACT_APP_` is kept as the env prefix on purpose.
   *
   * Vite exposes only VITE_-prefixed variables by default. Renaming would mean
   * rewriting .env, .env.example and .env.test AND every deploy environment
   * that already sets REACT_APP_SUPABASE_URL — including production, where the
   * app throws at import time if those variables are missing. Keeping the
   * prefix makes this migration invisible to the hosting config.
   */
  envPrefix: ["REACT_APP_", "VITE_"],

  build: {
    /*
     * CRA wrote to build/; Vite defaults to dist/. Two things downstream read
     * build/ by name — scripts/prerender.js, and the deploy script that copies
     * `build/**` into ../docs — so the directory name stays.
     */
    outDir: "build",
    // Matches what CRA produced, so the prerenderer's static server keeps
     // finding assets at the same kind of path.
    assetsDir: "static",
    sourcemap: false,
    // Vite warns at 500 KB. The vendor chunk is legitimately larger than that
    // and is already split away from the route chunks.
    chunkSizeWarningLimit: 800,
  },

  test: {
    // describe/it/expect without importing them, as the existing suites expect.
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    css: false,
    // Vitest picks up e2e/build directories otherwise.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
