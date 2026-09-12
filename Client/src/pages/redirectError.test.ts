/**
 * A failed sign-in arrives as a redirect, not as a rejected promise.
 *
 * AuthCallback bounces to `/auth?mode=login&error=session_missing` and nothing
 * on AuthPage read the parameter, so the user landed on an empty login form
 * with no explanation — and no reason not to press the same button again.
 *
 * readRedirectError is not exported (it is a detail of the page), so this reads
 * it out of the source and runs it, the same way resetArrival.test.ts does.
 * That keeps the test honest: it exercises the shipped function rather than a
 * copy that can drift.
 */
import { readFileSync } from "fs";
import { join } from "path";
import * as ts from "typescript";

const source = readFileSync(join(__dirname, "AuthPage.tsx"), "utf8");

function loadReadRedirectError(): (qs: URLSearchParams) => string | null {
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2019, jsx: ts.JsxEmit.None },
  }).outputText;

  // The lookup table and the function that reads it are contiguous, so one
  // slice carries both.
  const start = js.indexOf("const REDIRECT_ERRORS");
  expect(start).toBeGreaterThan(-1);

  const fnStart = js.indexOf("function readRedirectError(", start);
  expect(fnStart).toBeGreaterThan(-1);

  let depth = 0;
  let end = -1;
  for (let i = js.indexOf("{", fnStart); i < js.length; i++) {
    if (js[i] === "{") depth++;
    else if (js[i] === "}") {
      depth--;
      if (!depth) {
        end = i + 1;
        break;
      }
    }
  }

  expect(end).toBeGreaterThan(-1);

  // eslint-disable-next-line no-new-func
  return new Function(
    `${js.slice(start, end)}\nreturn readRedirectError;`
  )() as (qs: URLSearchParams) => string | null;
}

const readRedirectError = loadReadRedirectError();

const from = (search: string) => readRedirectError(new URLSearchParams(search));

describe("readRedirectError", () => {
  it("explains the bounce AuthCallback actually sends", () => {
    expect(from("?mode=login&error=session_missing")).toMatch(
      /could not finish your Google sign-in/i
    );
  });

  it("names a cancelled sign-in as cancelled", () => {
    expect(from("?error=access_denied")).toBe("Google sign-in was cancelled.");
  });

  it("falls back to Supabase's own description for unmapped codes", () => {
    expect(
      from("?error=server_error&error_description=Database%20timeout")
    ).toBe("Database timeout");
  });

  it("still says something for a code it has never seen", () => {
    expect(from("?error=totally_unknown")).toBe(
      "Sign-in did not complete. Please try again."
    );
  });

  it("stays quiet on an ordinary visit", () => {
    expect(from("?mode=login")).toBeNull();
    expect(from("")).toBeNull();
  });
});
