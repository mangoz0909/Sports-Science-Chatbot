import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/*
 * Flat config, replacing .eslintrc.json.
 *
 * The old config extended "react-app", which is published inside
 * eslint-config-react-app — a react-scripts dependency. Removing CRA takes that
 * preset with it, so the rules it provided are restated here on a maintained
 * toolchain. The project's own rule choices at the bottom are carried over
 * unchanged.
 */
export default tseslint.config(
  {
    ignores: ["build/**", "node_modules/**", "scripts/**", "supabase/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // What "react-app" gave us that actually mattered here: the exhaustive-deps
      // warning several effects in this codebase carry explicit disables for.
      ...reactHooks.configs.recommended.rules,

      // Project rules, carried over from .eslintrc.json verbatim.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      // Enabled rather than dropped: resetArrival.test.ts disables it
      // deliberately, and a disable for a rule nobody enforces is just a
      // comment that lints as dead.
      "no-new-func": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    // Vitest globals (describe/it/expect) plus `vi`, which the suites import.
    files: ["src/**/*.test.{ts,tsx}", "src/setupTests.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
  }
);
