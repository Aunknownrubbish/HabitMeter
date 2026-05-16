import type { CandidateLocation } from "@/lib/candidates";
import type { PreferenceMode, PreferenceWeights } from "@/lib/preference-weights";
import { PREFERENCE_PRESETS, calculateWeightedCandidateScore } from "@/lib/preference-weights";

// ---- Types ----

export type ComparisonDimension =
  | "total"
  | "commute"
  | "transport"
  | "convenience"
  | "medical"
  | "leisure";

export interface ComparisonWinner {
  dimension: ComparisonDimension;
  candidateId: string | null;
  label: string;
  value: string;
  reason: string;
}

export interface CandidateComparisonResult {
  candidates: CandidateLocation[];
  sortedByTotal: CandidateLocation[];
  bestOverall: CandidateLocation | null;
  winners: ComparisonWinner[];
  summary: string;
  warnings: string[];
  preferenceMode: PreferenceMode;
  weightedScores: Record<string, number>;
}

// ---- Dimension config ----

const DIMENSIONS: { key: ComparisonDimension; label: string }[] = [
  { key: "total", label: "综合评分" },
  { key: "commute", label: "通勤" },
  { key: "transport", label: "公共交通" },
  { key: "convenience", label: "生活便利" },
  { key: "medical", label: "医疗" },
  { key: "leisure", label: "休闲" },
];

// ---- Helpers ----

function getDimensionScore(
  candidate: CandidateLocation,
  dim: ComparisonDimension
): number {
  if (dim === "total") return candidate.score.total;
  return candidate.score.breakdown[dim as Exclude<ComparisonDimension, "total">] ?? 0;
}

function pickBest(
  candidates: CandidateLocation[],
  dim: ComparisonDimension
): CandidateLocation | null {
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestScore = getDimensionScore(best, dim);

  for (let i = 1; i < candidates.length; i++) {
    const score = getDimensionScore(candidates[i], dim);
    if (score > bestScore) {
      best = candidates[i];
      bestScore = score;
    } else if (score === bestScore) {
      // Tie-break: higher total score wins
      const prevTotal = best.score.total;
      const currTotal = candidates[i].score.total;
      if (currTotal > prevTotal) {
        best = candidates[i];
        bestScore = score;
      } else if (currTotal === prevTotal) {
        // Second tie-break: earlier createdAt wins
        if (candidates[i].createdAt < best.createdAt) {
          best = candidates[i];
          bestScore = score;
        }
      }
    }
  }

  return best;
}

function buildWinner(
  dim: ComparisonDimension,
  label: string,
  best: CandidateLocation | null,
  allCandidates: CandidateLocation[]
): ComparisonWinner {
  if (!best) {
    return {
      dimension: dim,
      candidateId: null,
      label,
      value: "—",
      reason: "无候选数据",
    };
  }

  const dimLabel = DIMENSIONS.find((d) => d.key === dim)?.label ?? dim;
  const value =
    dim === "total"
      ? `${best.score.total}分`
      : `${getDimensionScore(best, dim)}分`;

  const others = allCandidates.filter((c) => c.id !== best.id);
  const deficit =
    others.length > 0
      ? getDimensionScore(best, dim) -
        Math.max(...others.map((o) => getDimensionScore(o, dim)))
      : 0;

  let reason: string;
  if (others.length === 0) {
    reason = "当前唯一候选";
  } else if (deficit > 0) {
    reason = `${best.title}在${dimLabel}方面领先${deficit}分`;
  } else {
    reason = `${best.title}与其他候选并列${dimLabel}最高`;
  }

  return {
    dimension: dim,
    candidateId: best.id,
    label,
    value,
    reason,
  };
}

// ---- Main ----

export function compareCandidates(
  candidates: CandidateLocation[],
  preference?: PreferenceMode | { weights: PreferenceWeights }
): CandidateComparisonResult {
  // Resolve preference
  let mode: PreferenceMode = "balanced";
  let weights: PreferenceWeights;
  if (preference && typeof preference === "object" && "weights" in preference) {
    weights = preference.weights;
    mode = "balanced"; // custom weights treated as balanced-derived
  } else if (typeof preference === "string") {
    mode = preference;
    weights = PREFERENCE_PRESETS[mode]?.weights ?? PREFERENCE_PRESETS.balanced.weights;
  } else {
    mode = "balanced";
    weights = PREFERENCE_PRESETS.balanced.weights;
  }

  if (candidates.length === 0) {
    return {
      candidates: [],
      sortedByTotal: [],
      bestOverall: null,
      winners: DIMENSIONS.map((d) => ({
        dimension: d.key,
        candidateId: null,
        label: d.label,
        value: "—",
        reason: "无候选数据",
      })),
      summary: "暂无候选",
      warnings: [],
      preferenceMode: mode,
      weightedScores: {},
    };
  }

  // Compute weighted scores
  const weightedScores: Record<string, number> = {};
  for (const c of candidates) {
    weightedScores[c.id] = calculateWeightedCandidateScore(c, weights);
  }

  // Sort by weighted score, then by original total as tie-break
  const sortedByTotal = [...candidates].sort((a, b) => {
    const diff = weightedScores[b.id] - weightedScores[a.id];
    if (diff !== 0) return diff;
    return b.score.total - a.score.total;
  });
  const bestOverall = sortedByTotal[0];

  // Winners per dimension
  const winners: ComparisonWinner[] = DIMENSIONS.map((d) => {
    const best = pickBest(candidates, d.key);
    return buildWinner(d.key, d.label, best, candidates);
  });

  // Summary
  const modeLabel = PREFERENCE_PRESETS[mode]?.label ?? "均衡";
  let summary: string;
  if (candidates.length === 1) {
    summary = `已加入 1 个候选，继续添加后可进行横向比较。`;
  } else if (candidates.length === 2) {
    const a = sortedByTotal[0];
    const b = sortedByTotal[1];
    const gap = weightedScores[a.id] - weightedScores[b.id];
    summary =
      mode === "balanced"
        ? `${a.title}综合更优（${a.score.total}分 vs ${b.score.total}分）${
            gap < 5 ? "，差距较小" : ""
          }。`
        : `按${modeLabel}排序，${a.title}更优（偏好分 ${weightedScores[a.id]} vs ${weightedScores[b.id]}）${
            gap < 5 ? "，差距较小" : ""
          }。`;
  } else {
    const top = sortedByTotal.slice(0, 3);
    const names = top.map((c) => c.title).join("、");
    summary =
      mode === "balanced"
        ? `综合来看，${names}排名靠前。${bestOverall.title}在当前候选中最均衡。`
        : `按${modeLabel}排序，${names}排名靠前。${bestOverall.title}在当前偏好下最优。`;
  }

  // Warnings
  const warnings: string[] = [];

  const allLow = candidates.every((c) => c.score.total < 50);
  if (allLow) {
    warnings.push("当前候选整体评分偏低，建议继续寻找其他地址");
  }

  if (candidates.length >= 2) {
    const top2 = sortedByTotal.slice(0, 2);
    const gap = weightedScores[top2[0].id] - weightedScores[top2[1].id];
    if (gap < 5) {
      warnings.push("前两名差距较小，建议结合价格和实地体验判断");
    }
  }

  if (candidates.length > 6) {
    warnings.push("候选较多，建议先淘汰低分项再比较");
  }

  return {
    candidates,
    sortedByTotal,
    bestOverall,
    winners,
    summary,
    warnings,
    preferenceMode: mode,
    weightedScores,
  };
}
