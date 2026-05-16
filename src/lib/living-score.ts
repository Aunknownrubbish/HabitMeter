import type { POICategory, POIItem, CommuteResult } from "@/types";

// ---- Types ----

export interface LivingScoreInsight {
  type: "strength" | "weakness";
  title: string;
  description: string;
}

export interface LivingScoreBreakdown {
  commute: number;
  transport: number;
  convenience: number;
  medical: number;
  leisure: number;
}

export interface LivingScore {
  total: number; // 0–100
  level: "excellent" | "good" | "average" | "weak";
  title: string;
  summary: string;
  breakdown: LivingScoreBreakdown;
  strengths: LivingScoreInsight[];
  weaknesses: LivingScoreInsight[];
  dataQuality: {
    hasAddressA: boolean;
    hasAddressB: boolean;
    hasPOI: boolean;
    hasCommute: boolean;
  };
}

export interface LivingScoreInput {
  poiResults: Record<POICategory, POIItem[]>;
  commuteResult: CommuteResult;
  addressA?: { lat: number; lng: number; name: string } | null;
  addressB?: { lat: number; lng: number; name: string } | null;
}

// ---- Constants ----

const WEIGHTS = {
  commute: 35,
  transport: 25,
  convenience: 15,
  medical: 15,
  leisure: 10,
} as const;

const LEVEL_LABELS: Record<LivingScore["level"], { min: number; label: string }> = {
  excellent: { min: 85, label: "优秀" },
  good: { min: 70, label: "良好" },
  average: { min: 50, label: "一般" },
  weak: { min: 0, label: "较弱" },
};

// ---- Helpers ----

function nearestDist(items: POIItem[]): number | null {
  if (items.length === 0) return null;
  return Math.min(...items.map((p) => p.distance));
}

function linearScore(
  dist: number | null,
  thresholds: [number, number][]
): number {
  // thresholds: pairs of [distance_m, score_if_at_or_below]
  // Returns score interpolated between thresholds, 0 beyond last
  if (dist === null) return 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (dist <= thresholds[i][0]) {
      if (i === 0) return thresholds[i][1];
      const prev = thresholds[i - 1];
      const ratio =
        (dist - prev[0]) / (thresholds[i][0] - prev[0]);
      return Math.round(prev[1] + ratio * (thresholds[i][1] - prev[1]));
    }
  }
  return 0;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ---- Commute scoring ----

function scoreCommute(
  commuteResult: CommuteResult,
  hasAddressB: boolean
): { score: number; bestMinutes: number | null; bestMode: string | null } {
  if (!hasAddressB) return { score: 0, bestMinutes: null, bestMode: null };

  const candidates: { mode: string; minutes: number }[] = [];
  if (commuteResult.transit)
    candidates.push({ mode: "公交", minutes: commuteResult.transit.duration / 60 });
  if (commuteResult.driving)
    candidates.push({ mode: "驾车", minutes: commuteResult.driving.duration / 60 });
  if (commuteResult.riding)
    candidates.push({ mode: "骑行", minutes: commuteResult.riding.duration / 60 });
  if (commuteResult.walking)
    candidates.push({ mode: "步行", minutes: commuteResult.walking.duration / 60 });

  if (candidates.length === 0) return { score: 0, bestMinutes: null, bestMode: null };

  // Pick best: transit preferred, then by time
  const byPriority = [...candidates].sort((a, b) => {
    const order: Record<string, number> = { 公交: 0, 驾车: 1, 骑行: 2, 步行: 3 };
    return (order[a.mode] ?? 9) - (order[b.mode] ?? 9);
  });
  const best = byPriority[0];

  const mins = best.minutes;
  let score: number;
  if (mins <= 30) score = WEIGHTS.commute;
  else if (mins <= 45) score = Math.round(WEIGHTS.commute * 0.8);
  else if (mins <= 60) score = Math.round(WEIGHTS.commute * 0.6);
  else if (mins <= 90) score = Math.round(WEIGHTS.commute * 0.3);
  else score = Math.round(WEIGHTS.commute * 0.1);

  return { score, bestMinutes: Math.round(mins), bestMode: `${best.mode}约${Math.round(mins)}分钟` };
}

// ---- POI scoring ----

function scoreTransport(
  subwayItems: POIItem[],
  busItems: POIItem[]
): { score: number; insights: LivingScoreInsight[] } {
  const subwayDist = nearestDist(subwayItems);
  const busDist = nearestDist(busItems);
  const insights: LivingScoreInsight[] = [];

  // Subway: max ~15 of 25
  let subwayScore = 0;
  if (subwayDist !== null) {
    subwayScore = Math.round(
      linearScore(subwayDist, [
        [500, 15],
        [1000, 13],
        [2000, 8],
        [3000, 3],
      ])
    );
    if (subwayDist <= 1000) {
      insights.push({
        type: "strength",
        title: "地铁可达性较好",
        description: `最近地铁站约 ${subwayDist}m`,
      });
    } else if (subwayDist > 2000) {
      insights.push({
        type: "weakness",
        title: "地铁覆盖较远",
        description: `最近地铁站约 ${subwayDist}m`,
      });
    }
  }

  // Bus: max ~10 of 25
  let busScore = 0;
  if (busDist !== null) {
    busScore = Math.round(
      linearScore(busDist, [
        [300, 10],
        [500, 8],
        [1000, 5],
        [2000, 2],
      ])
    );
    if (busItems.length >= 10 && busDist <= 500) {
      insights.push({
        type: "strength",
        title: "公交线路丰富",
        description: `3km 内公交站 ${busItems.length} 个，最近约 ${busDist}m`,
      });
    }
  }

  if (subwayDist === null && busDist === null) {
    insights.push({
      type: "weakness",
      title: "公共交通薄弱",
      description: "3km 内未找到地铁站或公交站",
    });
  } else if (subwayDist === null && busDist !== null && busDist > 1000) {
    insights.push({
      type: "weakness",
      title: "缺少地铁覆盖",
      description: "3km 内无地铁站，依赖公交出行",
    });
  }

  return { score: clamp(subwayScore + busScore, 0, WEIGHTS.transport), insights };
}

function scoreConvenience(
  items: POIItem[]
): { score: number; insights: LivingScoreInsight[] } {
  const dist = nearestDist(items);
  const insights: LivingScoreInsight[] = [];

  let base = 0;
  if (dist !== null) {
    base = linearScore(dist, [
      [200, 15],
      [500, 12],
      [1000, 8],
      [2000, 4],
    ]);
  }
  // Bonus for quantity
  const qtyBonus = Math.min(3, Math.floor(items.length / 5));
  const score = clamp(base + qtyBonus, 0, WEIGHTS.convenience);

  if (dist !== null && dist <= 500 && items.length >= 5) {
    insights.push({
      type: "strength",
      title: "日常补给方便",
      description: `3km 内便利店 ${items.length} 个，最近约 ${dist}m`,
    });
  } else if (dist === null || dist > 1000) {
    insights.push({
      type: "weakness",
      title: "日常购物不便",
      description: dist === null ? "3km 内未找到便利店" : `最近便利店约 ${dist}m`,
    });
  }

  return { score, insights };
}

function scoreMedical(
  items: POIItem[]
): { score: number; insights: LivingScoreInsight[] } {
  const dist = nearestDist(items);
  const insights: LivingScoreInsight[] = [];

  let score = 0;
  if (dist !== null) {
    score = linearScore(dist, [
      [1000, 15],
      [1500, 13],
      [3000, 8],
      [5000, 3],
    ]);
  }

  if (dist !== null && dist <= 1500) {
    insights.push({
      type: "strength",
      title: "医疗资源可及",
      description: `最近医院约 ${dist}m`,
    });
  } else if (dist !== null && dist <= 3000) {
    // Acceptable, no strong insight needed
  } else if (dist === null) {
    insights.push({
      type: "weakness",
      title: "医疗资源缺失",
      description: "3km 内未找到医院",
    });
  } else {
    insights.push({
      type: "weakness",
      title: "医疗资源偏远",
      description: `最近医院约 ${dist}m`,
    });
  }

  return { score: clamp(score, 0, WEIGHTS.medical), insights };
}

function scoreLeisure(
  items: POIItem[]
): { score: number; insights: LivingScoreInsight[] } {
  const dist = nearestDist(items);
  const insights: LivingScoreInsight[] = [];

  let score = 0;
  if (dist !== null) {
    score = linearScore(dist, [
      [500, 10],
      [1500, 8],
      [3000, 4],
    ]);
  }

  if (dist !== null && dist <= 1500) {
    insights.push({
      type: "strength",
      title: "休闲空间便利",
      description: `最近公园约 ${dist}m`,
    });
  }

  return { score: clamp(score, 0, WEIGHTS.leisure), insights };
}

// ---- Title & Summary ----

function buildTitleSummary(
  bestMode: string | null,
  transportScore: number,
  convenienceScore: number,
  level: LivingScore["level"]
): { title: string; summary: string } {
  const parts: string[] = [];

  if (transportScore >= 20) parts.push("公共交通便利");
  if (convenienceScore >= 12) parts.push("生活配套齐全");
  if (bestMode && !bestMode.startsWith("公交约0")) {
    parts.push("适合日常通勤");
  }

  const prefix = parts.length > 0 ? parts.slice(0, 2).join("、") : "基本居住";
  const suffix: Record<string, string> = {
    excellent: "型居住",
    good: "型居住",
    average: "型居住，部分配套待改善",
    weak: "型居住，配套需重点考察",
  };

  const title = `${prefix}${suffix[level]}`;

  const summaryMap: Record<LivingScore["level"], string> = {
    excellent: "周边配套完善，通勤便捷，日常生活便利度高。",
    good: "整体居住条件较好，多数日常需求可满足。",
    average: "基本居住需求可满足，但有部分短板值得关注。",
    weak: "周边配套和通勤条件存在明显不足，建议实地考察后决策。",
  };

  return { title, summary: summaryMap[level] };
}

// ---- Main ----

export function calculateLivingScore(input: LivingScoreInput): LivingScore {
  const { poiResults, commuteResult, addressA, addressB } = input;

  const hasAddressA = !!(addressA?.name);
  const hasAddressB = !!(addressB?.name);
  const hasPOI = Object.values(poiResults).some((arr) => arr.length > 0);
  const hasCommute = !!(
    commuteResult.transit ||
    commuteResult.driving ||
    commuteResult.walking ||
    commuteResult.riding
  );

  // Commute
  const commute = scoreCommute(commuteResult, hasAddressB);

  // Transport
  const subwayItems = poiResults.subway ?? [];
  const busItems = poiResults.bus ?? [];
  const transport = scoreTransport(subwayItems, busItems);

  // Convenience
  const convenienceItems = poiResults.convenience ?? [];
  const convenience = scoreConvenience(convenienceItems);

  // Medical
  const hospitalItems = poiResults.hospital ?? [];
  const medical = scoreMedical(hospitalItems);

  // Leisure
  const parkItems = poiResults.park ?? [];
  const leisure = scoreLeisure(parkItems);

  // Aggregate
  const breakdown: LivingScoreBreakdown = {
    commute: commute.score,
    transport: transport.score,
    convenience: convenience.score,
    medical: medical.score,
    leisure: leisure.score,
  };

  const total = clamp(
    breakdown.commute +
      breakdown.transport +
      breakdown.convenience +
      breakdown.medical +
      breakdown.leisure,
    0,
    100
  );

  let level: LivingScore["level"] = "weak";
  if (total >= 85) level = "excellent";
  else if (total >= 70) level = "good";
  else if (total >= 50) level = "average";

  // Collect insights
  const allInsights: LivingScoreInsight[] = [
    ...transport.insights,
    ...convenience.insights,
    ...medical.insights,
    ...leisure.insights,
  ];

  // Commute insight
  if (commute.bestMinutes !== null && commute.bestMode) {
    if (commute.bestMinutes <= 30) {
      allInsights.push({
        type: "strength",
        title: "通勤时间较短",
        description: `${commute.bestMode}`,
      });
    } else if (commute.bestMinutes > 90) {
      allInsights.push({
        type: "weakness",
        title: "通勤压力较高",
        description: `${commute.bestMode}`,
      });
    } else if (commute.bestMinutes > 60) {
      allInsights.push({
        type: "weakness",
        title: "通勤时间偏长",
        description: `${commute.bestMode}`,
      });
    }
  } else if (hasAddressB && !hasCommute) {
    allInsights.push({
      type: "weakness",
      title: "通勤数据不足",
      description: "B 地址已设置但未能获取路线，请检查网络后重试",
    });
  }

  const strengths = allInsights.filter((i) => i.type === "strength").slice(0, 4);
  const weaknesses = allInsights.filter((i) => i.type === "weakness").slice(0, 3);

  const { title, summary } = buildTitleSummary(
    commute.bestMode,
    transport.score,
    convenience.score,
    level
  );

  return {
    total,
    level,
    title,
    summary,
    breakdown,
    strengths,
    weaknesses,
    dataQuality: {
      hasAddressA,
      hasAddressB,
      hasPOI,
      hasCommute,
    },
  };
}
