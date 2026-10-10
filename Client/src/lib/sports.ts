/** Shared list of sports for the "Main sport" selector (onboarding + profile). */
export const SPORT_OPTIONS: readonly string[] = [
  "Archery",
  "Badminton",
  "Baseball",
  "Basketball",
  "Boxing",
  "Climbing",
  "Cricket",
  "Cross-country running",
  "CrossFit",
  "Cycling",
  "Dance",
  "Diving",
  "Equestrian",
  "Fencing",
  "Field hockey",
  "Figure skating",
  "Golf",
  "Gymnastics",
  "Handball",
  "Ice hockey",
  "Judo",
  "Karate",
  "Lacrosse",
  "Martial arts (MMA)",
  "Netball",
  "Pickleball",
  "Powerlifting",
  "Rowing",
  "Rugby",
  "Running",
  "Sailing",
  "Skateboarding",
  "Skiing",
  "Snowboarding",
  "Soccer",
  "Softball",
  "Squash",
  "Surfing",
  "Swimming",
  "Table tennis",
  "Taekwondo",
  "Tennis",
  "Track and field",
  "Triathlon",
  "Ultimate frisbee",
  "American football",
  "Volleyball",
  "Water polo",
  "Weightlifting",
  "Wrestling",
  "Yoga",
].sort((a, b) => a.localeCompare(b));

/**
 * Returns the canonical list entry matching `value` case-insensitively,
 * or the trimmed original text when it is not in the list (legacy / custom
 * values are never discarded).
 */
export function normalizeSport(value: string): string {
  const trimmed = value.trim();
  const hit = SPORT_OPTIONS.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  return hit ?? trimmed;
}
