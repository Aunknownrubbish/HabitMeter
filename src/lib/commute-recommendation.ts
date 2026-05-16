import type { CommuteResult } from "@/types";

export interface CommuteRecommendation {
  mode: "transit" | "driving" | "walking" | "riding" | null;
  title: string;
  reason: string;
  warnings: string[];
  alternatives: string[];
}

export function getCommuteRecommendation(
  commuteResult: CommuteResult
): CommuteRecommendation {
  const { transit, driving, riding, walking } = commuteResult;

  const transitMin = transit ? Math.round(transit.duration / 60) : null;
  const drivingMin = driving ? Math.round(driving.duration / 60) : null;
  const ridingMin = riding ? Math.round(riding.duration / 60) : null;
  const walkingMin = walking ? Math.round(walking.duration / 60) : null;

  const warnings: string[] = [];
  const alternatives: string[] = [];

  // No data at all
  if (!transit && !driving && !riding && !walking) {
    return {
      mode: null,
      title: "暂无通勤数据",
      reason: "未获取到任何通勤路线结果",
      warnings: [],
      alternatives: [],
    };
  }

  // Build alternatives list (exclude the recommended mode)
  function buildAlternatives(exclude: string | null) {
    const alt: string[] = [];
    if (driving && exclude !== "driving") alt.push("驾车");
    if (transit && exclude !== "transit") alt.push("公共交通");
    if (riding && exclude !== "riding") alt.push("骑行");
    if (walking && exclude !== "walking") alt.push("步行");
    return alt;
  }

  function getShortest(): {
    mode: CommuteRecommendation["mode"];
    minutes: number;
  } {
    const candidates: { mode: CommuteRecommendation["mode"]; m: number }[] = [];
    if (transitMin !== null) candidates.push({ mode: "transit", m: transitMin });
    if (drivingMin !== null) candidates.push({ mode: "driving", m: drivingMin });
    if (ridingMin !== null) candidates.push({ mode: "riding", m: ridingMin });
    if (walkingMin !== null) candidates.push({ mode: "walking", m: walkingMin });
    candidates.sort((a, b) => a.m - b.m);
    return { mode: candidates[0]?.mode ?? null, minutes: candidates[0]?.m ?? 0 };
  }

  // Rule 1: Transit exists and ≤ 75 min → recommend transit
  if (transit && transitMin !== null && transitMin <= 75) {
    if (transitMin > 60) {
      warnings.push("通勤时间偏长");
    }
    if (transit.walkDistance > 1200) {
      warnings.push("步行接驳较多");
    }
    return {
      mode: "transit",
      title: "推荐公共交通",
      reason: `公交约 ${transitMin} 分钟，适合日常通勤${
        transitMin <= 45 ? "，耗时可控" : ""
      }`,
      warnings,
      alternatives: buildAlternatives("transit"),
    };
  }

  // Rule 2: Driving ≥ 20 min faster than transit
  if (
    drivingMin !== null &&
    transitMin !== null &&
    drivingMin <= transitMin - 20
  ) {
    warnings.push("实际耗时可能受高峰路况影响");
    if (drivingMin > 60) warnings.push("通勤时间偏长");
    return {
      mode: "driving",
      title: "推荐驾车",
      reason: `驾车约 ${drivingMin} 分钟，比公共交通快约 ${transitMin - drivingMin} 分钟`,
      warnings,
      alternatives: buildAlternatives("driving"),
    };
  }

  // Rule 3: Riding ≤ 45 min
  if (ridingMin !== null && ridingMin <= 45) {
    if (ridingMin > 30) {
      warnings.push("不适合作为稳定日常通勤");
    }
    return {
      mode: "riding",
      title: "可考虑骑行",
      reason: `骑行约 ${ridingMin} 分钟，短途出行较灵活`,
      warnings,
      alternatives: buildAlternatives("riding"),
    };
  }

  // Rule 4: Walking ≤ 30 min
  if (walkingMin !== null && walkingMin <= 30) {
    if (walkingMin > 20) {
      warnings.push("步行距离偏长");
    }
    return {
      mode: "walking",
      title: "可步行通勤",
      reason: `步行约 ${walkingMin} 分钟，通勤距离较短`,
      warnings,
      alternatives: buildAlternatives("walking"),
    };
  }

  // Fallback: shortest
  const shortest = getShortest();
  const modeLabel: Record<string, string> = {
    transit: "公共交通",
    driving: "驾车",
    riding: "骑行",
    walking: "步行",
  };

  if (shortest.mode && shortest.minutes > 0) {
    warnings.push("通勤压力较高");
    return {
      mode: shortest.mode,
      title: `建议${modeLabel[shortest.mode] ?? ""}`,
      reason: `${modeLabel[shortest.mode] ?? ""}约 ${shortest.minutes} 分钟，是当前耗时最短的方式`,
      warnings,
      alternatives: buildAlternatives(shortest.mode),
    };
  }

  return {
    mode: null,
    title: "暂无通勤数据",
    reason: "未获取到有效通勤路线",
    warnings: [],
    alternatives: [],
  };
}
