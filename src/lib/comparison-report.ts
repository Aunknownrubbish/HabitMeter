import type { CandidateComparisonResult } from "@/lib/candidate-comparison";
import { PREFERENCE_PRESETS, type PreferenceMode } from "@/lib/preference-weights";

const STATUS_LABELS: Record<string, string> = {
  considering: "考虑中",
  visited: "已看过",
  shortlisted: "重点考虑",
  rejected: "暂不考虑",
};

const LEVEL_LABELS: Record<string, string> = {
  excellent: "很推荐",
  good: "推荐",
  average: "一般",
  weak: "谨慎",
};

export function buildComparisonReport(
  result: CandidateComparisonResult
): string {
  const now = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const modeLabel =
    PREFERENCE_PRESETS[result.preferenceMode as PreferenceMode]?.label ?? "均衡";

  const lines: string[] = [];

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("  寻栖候选居住地对比报告");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  lines.push(`生成时间：${now}`);
  lines.push(`候选数量：${result.candidates.length}`);
  lines.push(`偏好模式：${modeLabel}`);
  lines.push("");

  // Recommendation
  if (result.bestOverall) {
    lines.push(
      `综合推荐：${result.bestOverall.title}（${result.bestOverall.score.total}分 · ${LEVEL_LABELS[result.bestOverall.score.level] ?? ""}）`
    );
    lines.push("");
  }

  // Candidates
  lines.push("── 候选明细 ──");
  lines.push("");
  for (const c of result.sortedByTotal) {
    lines.push(`【${c.title}】`);
    lines.push(`  地址：${c.addressA.name}`);
    lines.push(`  状态：${STATUS_LABELS[c.status] ?? c.status}`);
    lines.push(`  综合分：${c.score.total}`);
    if (result.weightedScores[c.id] !== undefined && result.preferenceMode !== "balanced") {
      lines.push(`  偏好分：${result.weightedScores[c.id]}（按${modeLabel}）`);
    }
    lines.push(
      `  通勤：${c.score.breakdown.commute}/35 · 交通：${c.score.breakdown.transport}/25 · 生活：${c.score.breakdown.convenience}/15 · 医疗：${c.score.breakdown.medical}/15 · 休闲：${c.score.breakdown.leisure}/10`
    );
    lines.push(`  推荐通勤：${c.commute.recommendedTitle}`);
    if (c.note) lines.push(`  备注：${c.note}`);
    lines.push("");
  }

  // Winners
  const nonTotalWinners = result.winners.filter((w) => w.dimension !== "total");
  if (nonTotalWinners.length > 0) {
    lines.push("── 维度优胜 ──");
    lines.push("");
    for (const w of nonTotalWinners) {
      const winner = w.candidateId
        ? result.candidates.find((c) => c.id === w.candidateId)
        : null;
      lines.push(`  ${w.label}最佳：${winner?.title ?? "—"}（${w.value}）`);
    }
    lines.push("");
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push("── 风险提醒 ──");
    lines.push("");
    for (const w of result.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push("");
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("  由 寻栖 生成 · 仅供个人参考");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");

  return lines.join("\n");
}
