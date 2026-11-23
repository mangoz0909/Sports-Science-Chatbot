/**
 * The check-in's scores and advice, shared by the check-in page and by the
 * example on the landing page, so that example can never drift from what the
 * app really works out.
 */
export type CheckInData = {
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  soreness: number;
  fatigue: number;
  stress: number;
  mood: number;
  hydration: number;
  nutrition: number;
  trainingIntensity: number;
  painLevel: number;
  notes: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// Theoretical bounds of `positive - negative` below, given each slider's 1-10
// range (painLevel is 0-10). Used to normalize the weighted score to 0-100
// instead of clamping — clamping alone saturated at 100 for most real inputs.
const READINESS_RAW_MIN = 1 * 1.5 + 1 * 1.4 + 1 + 1 + 1 - (10 * 1.2 + 10 * 1.5 + 10 + 10 * 1.6);
const READINESS_RAW_MAX = 10 * 1.5 + 10 * 1.4 + 10 + 10 + 10 - (1 * 1.2 + 1 * 1.5 + 1 + 0 * 1.6);

export function calculateReadiness(data: CheckInData) {
  const positive =
    data.sleepQuality * 1.5 +
    data.energy * 1.4 +
    data.mood +
    data.hydration +
    data.nutrition;

  const negative =
    data.soreness * 1.2 +
    data.fatigue * 1.5 +
    data.stress +
    data.painLevel * 1.6;

  const raw = positive - negative;
  const normalized =
    ((raw - READINESS_RAW_MIN) / (READINESS_RAW_MAX - READINESS_RAW_MIN)) * 100;

  return clamp(Math.round(normalized));
}

export function calculateInjuryRisk(data: CheckInData) {
  return clamp(
    Math.round(
      data.painLevel * 8 +
        data.soreness * 4 +
        data.fatigue * 5 +
        data.trainingIntensity * 3 -
        data.sleepQuality * 3 -
        data.hydration * 2
    )
  );
}

export function calculateRecovery(data: CheckInData) {
  return clamp(
    Math.round(
      data.sleepQuality * 7 +
        data.energy * 5 +
        data.hydration * 3 -
        data.fatigue * 4 -
        data.soreness * 3
    )
  );
}

export function getAIAdvice(data: CheckInData) {
  const readiness = calculateReadiness(data);
  const injuryRisk = calculateInjuryRisk(data);

  if (data.painLevel >= 7) {
    return "High pain reported. Avoid intense training today and consider speaking with a qualified professional.";
  }

  if (injuryRisk >= 65) {
    return "Injury risk is elevated. Reduce sprinting, heavy lifting, and high-impact work today.";
  }

  if (data.sleepHours < 7 || data.sleepQuality <= 5) {
    return "Sleep is limiting your recovery. Keep training light and aim for better sleep tonight.";
  }

  if (data.fatigue >= 7 || data.soreness >= 7) {
    return "Your body is showing fatigue. Choose mobility, stretching, or low-intensity skill work.";
  }

  if (readiness >= 80) {
    return "You look ready for a strong training day. Keep hydration high and warm up properly.";
  }

  return "You are in a moderate training zone. A balanced practice with recovery work is recommended.";
}
