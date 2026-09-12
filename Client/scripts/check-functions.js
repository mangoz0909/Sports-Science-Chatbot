/**
 * Type-checks the Supabase edge functions.
 *
 * Why this exists: tsconfig.json includes only `src`, so `tsc --noEmit` never
 * sees supabase/functions — and those three files handle authentication, the
 * OpenAI spend cap, and account deletion. They were the only code in the
 * repository with nothing at all checking them: no typecheck, no tests, and a
 * runtime (Deno) the rest of the toolchain does not know about. A typo in them
 * was found in production or not at all.
 *
 * Each function is checked against its own deno.json, because that is how
 * Supabase deploys them — one function, one config, one import map. Functions
 * are discovered from the directory rather than listed here, so a new one is
 * covered the day it is created instead of the day somebody remembers to add
 * it to this file.
 *
 * Deno is not a dependency of this project. A system `deno` is used when there
 * is one, and `npx deno@2` otherwise, which downloads and caches it on first
 * use. That keeps `npm install` from carrying a large binary that only matters
 * when editing four files, while still leaving the check runnable on a clean
 * machine with no setup.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const FUNCTIONS_DIR = path.join(__dirname, "..", "supabase", "functions");

/** Every deployable function: a directory with an index.ts, ignoring _shared. */
function findFunctions() {
  if (!fs.existsSync(FUNCTIONS_DIR)) return [];

  return fs
    .readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => ({
      name: entry.name,
      entry: path.join(FUNCTIONS_DIR, entry.name, "index.ts"),
      config: path.join(FUNCTIONS_DIR, entry.name, "deno.json"),
    }))
    .filter((fn) => fs.existsSync(fn.entry));
}

/**
 * How to invoke Deno. A system install is preferred because it is already
 * warm; npx is the fallback that makes this work with nothing installed.
 */
function resolveDeno() {
  const probe = spawnSync("deno", ["--version"], {
    stdio: "ignore",
    shell: true,
  });

  if (probe.status === 0) return { command: "deno", prefix: [] };

  console.log("  deno not on PATH — falling back to npx deno@2\n");

  return { command: "npx", prefix: ["--yes", "deno@2"] };
}

function main() {
  const functions = findFunctions();

  if (functions.length === 0) {
    console.warn("\n  No edge functions found — nothing to check.\n");
    return;
  }

  const deno = resolveDeno();
  const failed = [];

  console.log(`\n  Type-checking ${functions.length} edge function(s)\n`);

  for (const fn of functions) {
    // delete-account has no deno.json: its imports are absolute URLs, so it
    // needs no import map. Passing a config that does not exist is an error,
    // so only pass one when it is there.
    const args = [...deno.prefix, "check"];

    if (fs.existsSync(fn.config)) args.push("--config", fn.config);

    args.push(fn.entry);

    const result = spawnSync(deno.command, args, {
      stdio: "inherit",
      shell: true,
    });

    if (result.status !== 0) failed.push(fn.name);
  }

  if (failed.length > 0) {
    console.error(`\n  FAILED: ${failed.join(", ")}\n`);
    process.exit(1);
  }

  console.log(`\n  ${functions.length} edge function(s) type-check clean.\n`);
}

main();
