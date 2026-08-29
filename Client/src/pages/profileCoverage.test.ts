/**
 * The profile page and the onboarding survey write the same profiles row.
 *
 * When they disagree about which columns exist, a column becomes writable only
 * by retaking the survey — which is how food allergies, dietary preference and
 * body metrics ended up uneditable after onboarding, while the nutrition plan
 * was being told never to ignore them. This reads both files and fails if they
 * drift apart again.
 */
import { readFileSync } from "fs";
import { join } from "path";

const read = (file: string) =>
  readFileSync(join(__dirname, "..", file), "utf8");

const profilePage = read("pages/ProfilePage.tsx");
const survey = read("pages/OnboardingSurvey.tsx");
const service = read("services/preferencesService.ts");

/** Columns declared on UserPreferences — the full set either form may write. */
function preferenceColumns(): string[] {
  const block = service.slice(
    service.indexOf("export type UserPreferences = {"),
    service.indexOf("};", service.indexOf("export type UserPreferences = {"))
  );

  return [...block.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]);
}

const COLUMNS = preferenceColumns();

describe("profile form column coverage", () => {
  it("finds the full column list to check against", () => {
    // Guards the parsing above: if the type is reformatted and this returns
    // nothing, every assertion below would pass vacuously.
    expect(COLUMNS.length).toBeGreaterThanOrEqual(20);
    expect(COLUMNS).toEqual(expect.arrayContaining(["food_allergies", "weight_kg"]));
  });

  it.each(COLUMNS)("the profile page has an input bound to %s", (column) => {
    expect(profilePage).toContain(`form.${column}`);
    expect(profilePage).toContain(`updateField("${column}"`);
  });

  it.each(COLUMNS)("the profile page saves %s", (column) => {
    expect(profilePage).toContain(`${column}: form.${column}.trim()`);
  });

  it.each(COLUMNS)("the survey and the profile page agree that %s exists", (column) => {
    expect(survey).toContain(`form.${column}`);
  });

  it("both forms build on the one shared type", () => {
    expect(service).toContain("export type ExtendedUserPreferences");
    for (const file of [profilePage, survey]) {
      expect(file).toContain("ExtendedUserPreferences");
    }
  });
});
