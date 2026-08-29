/**
 * The reset form must only open for someone who arrived from a reset link.
 *
 * It used to open for any active session, so a signed-in athlete who typed the
 * URL — or anyone sitting at their unlocked browser — got a change-password
 * form with nothing proving they owned the account.
 *
 * readResetArrival is not exported (it is a detail of the page), so this reads
 * it out of the source and runs it. That keeps the test honest: it exercises
 * the shipped function rather than a copy that can drift.
 */
import { readFileSync } from "fs";
import { join } from "path";
import * as ts from "typescript";

const source = readFileSync(join(__dirname, "ResetPasswordPage.tsx"), "utf8");

function loadReadResetArrival(url: { hash: string; search: string }) {
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2019, jsx: ts.JsxEmit.None },
  }).outputText;

  const start = js.indexOf("function readResetArrival(");
  expect(start).toBeGreaterThan(-1);

  let depth = 0;
  let end = -1;
  for (let i = js.indexOf("{", start); i < js.length; i++) {
    if (js[i] === "{") depth++;
    else if (js[i] === "}") {
      depth--;
      if (!depth) {
        end = i + 1;
        break;
      }
    }
  }

  // eslint-disable-next-line no-new-func
  return new Function(
    "entryLocation",
    "URLSearchParams",
    `${js.slice(start, end)}\nreturn readResetArrival;`
  )(url, URLSearchParams) as () => { kind: string };
}

const arrivalFor = (hash: string, search = "") =>
  loadReadResetArrival({ hash, search })().kind;

describe("readResetArrival", () => {
  describe("opens the form", () => {
    it("for an implicit-flow recovery link", () => {
      expect(
        arrivalFor("#access_token=abc&refresh_token=def&type=recovery&expires_in=3600")
      ).toBe("recovery");
    });

    it("for a PKCE recovery link", () => {
      expect(arrivalFor("", "?code=8f3a-exchange-code")).toBe("recovery");
    });

    it("for a token-hash verification link", () => {
      expect(arrivalFor("", "?token_hash=pkce_abc&type=recovery")).toBe("recovery");
    });
  });

  describe("refuses the form", () => {
    it("for a bare visit with no link — the F12 case", () => {
      // A signed-in athlete typing /reset-password. Previously their existing
      // session was accepted and the form opened.
      expect(arrivalFor("", "")).toBe("not-a-link");
    });

    it("for an unrelated hash", () => {
      expect(arrivalFor("#section=two")).toBe("not-a-link");
    });

    it("for a sign-in link, which is not a reset link", () => {
      expect(arrivalFor("#access_token=abc&type=magiclink")).toBe("not-a-link");
    });
  });

  describe("reports an exhausted link immediately", () => {
    it("for an expired one-time code", () => {
      expect(
        arrivalFor("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired")
      ).toBe("link-error");
    });

    it("for an error delivered in the query instead of the hash", () => {
      expect(arrivalFor("", "?error=access_denied&error_code=otp_expired")).toBe("link-error");
    });

    it("prefers the error over a recovery marker sent alongside it", () => {
      expect(arrivalFor("#type=recovery&error_code=otp_expired")).toBe("link-error");
    });
  });
});

describe("the URL snapshot it depends on", () => {
  it("is taken before createClient can consume the link", () => {
    const client = readFileSync(join(__dirname, "..", "lib", "supabaseClient.ts"), "utf8");
    expect(client).toContain("export const entryLocation");
    // supabase-js rewrites the address bar once it has read the tokens, so the
    // snapshot is worthless if it is taken after the client is constructed.
    expect(client.indexOf("export const entryLocation")).toBeLessThan(
      client.indexOf("createClient(supabaseUrl")
    );
  });
});
