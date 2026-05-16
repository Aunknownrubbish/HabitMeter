import type { CandidateLocation } from "@/lib/candidates";

// ---- Types ----

export type PreferenceMode =
  | "balanced"
  | "commute_first"
  | "life_first"
  | "transport_first"
  | "medical_first";

export interface PreferenceWeights {
  commute: number;
  transport: number;
  convenience: number;
  medical: number;
  leisure: number;
}

// ---- Presets (sum = 100) ----

export const PREFERENCE_PRESETS: Record<
  PreferenceMode,
  { label: string; weights: PreferenceWeights }
> = {
  balanced: {
    label: "均衡",
    weights: { commute: 35, transport: 25, convenience: 15, medical: 15, leisure: 10 },
  },
  commute_first: {
    label: "通勤优先",
    weights: { commute: 50, transport: 20, convenience: 10, medical: 10, leisure: 10 },
  },
  life_first: {
    label: "生活便利优先",
    weights: { commute: 25, transport: 20, convenience: 25, medical: 15, leisure: 15 },
  },
  transport_first: {
    label: "交通优先",
    weights: { commute: 30, transport: 40, convenience: 10, medical: 10, leisure: 10 },
  },
  medical_first: {
    label: "医疗优先",
    weights: { commute: 25, transport: 20, convenience: 10, medical: 35, leisure: 10 },
  },
};

// Original max scores from LivingScore v1
const ORIGINAL_MAX: PreferenceWeights = {
  commute: 35,
  transport: 25,
  convenience: 15,
  medical: 15,
  leisure: 10,
};

// ---- localStorage ----

const PREFERENCE_STORAGE_KEY = "habitmeter:preference-mode:v1";

export function loadPreferenceMode(): PreferenceMode {
  if (typeof window === "undefined") return "balanced";
  try {
    const raw = window.localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (
      raw === "balanced" ||
      raw === "commute_first" ||
      raw === "life_first" ||
      raw === "transport_first" ||
      raw === "medical_first"
    ) {
      return raw;
    }
  } catch {
    // ignore
  }
  return "balanced";
}

export function savePreferenceMode(mode: PreferenceMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFERENCE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

// ---- Weighted score ----

export function calculateWeightedCandidateScore(
  candidate: CandidateLocation,
  weights: PreferenceWeights
): number {
  const breakdown = candidate.score.breakdown;
  let score = 0;
  score += (breakdown.commute / ORIGINAL_MAX.commute) * weights.commute;
  score += (breakdown.transport / ORIGINAL_MAX.transport) * weights.transport;
  score += (breakdown.convenience / ORIGINAL_MAX.convenience) * weights.convenience;
  score += (breakdown.medical / ORIGINAL_MAX.medical) * weights.medical;
  score += (breakdown.leisure / ORIGINAL_MAX.leisure) * weights.leisure;
  return Math.round(score);
}
