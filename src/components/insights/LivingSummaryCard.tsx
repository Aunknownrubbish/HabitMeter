import { Card } from "@/components/ui/Card";
import type { LivingScore } from "@/lib/living-score";
import { TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";

interface LivingSummaryCardProps {
  score: LivingScore | null;
  addressAName?: string;
  addressBName?: string;
  loading?: boolean;
}

const LEVEL_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  excellent: { text: "很推荐", color: "text-green-700", bg: "bg-green-50" },
  good: { text: "推荐", color: "text-blue-700", bg: "bg-blue-50" },
  average: { text: "一般", color: "text-amber-700", bg: "bg-amber-50" },
  weak: { text: "谨慎考虑", color: "text-red-700", bg: "bg-red-50" },
};

const BREAKDOWN_BARS: { key: keyof LivingScore["breakdown"]; label: string; max: number }[] = [
  { key: "commute", label: "通勤", max: 35 },
  { key: "transport", label: "交通", max: 25 },
  { key: "convenience", label: "生活", max: 15 },
  { key: "medical", label: "医疗", max: 15 },
  { key: "leisure", label: "休闲", max: 10 },
];

export function LivingSummaryCard({
  score,
  addressAName,
  addressBName,
  loading,
}: LivingSummaryCardProps) {
  // Loading state
  if (loading) {
    return (
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">居住结论</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded bg-slate-100"
              style={{ width: `${50 + Math.random() * 50}%` }}
            />
          ))}
        </div>
      </Card>
    );
  }

  // No address A
  if (!score || !score.dataQuality.hasAddressA) {
    return (
      <Card>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">居住结论</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          输入一个候选居住地，查看 3km 生活圈和通勤压力。
        </p>
      </Card>
    );
  }

  // Has address A but no address B
  const showBHint = !score.dataQuality.hasAddressB;

  const levelInfo = LEVEL_LABEL[score.level] ?? LEVEL_LABEL.weak;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-800">居住结论</h2>

      {/* Total Score + Level */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
          <span className="text-xl font-bold text-[var(--color-primary)]">
            {score.total}
          </span>
        </div>
        <div className="min-w-0">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${levelInfo.color} ${levelInfo.bg}`}
          >
            {levelInfo.text}
          </span>
          <p className="mt-0.5 text-sm font-medium text-slate-800 truncate">
            {score.title}
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="mb-3 text-xs text-slate-500 leading-relaxed">
        {score.summary}
        {showBHint && (
          <span className="ml-1 text-slate-400">
            补充上班地址后可评估通勤压力。
          </span>
        )}
      </p>

      {/* Breakdown bars */}
      <div className="mb-3 space-y-1.5">
        {BREAKDOWN_BARS.map((dim) => {
          const pct = Math.round((score.breakdown[dim.key] / dim.max) * 100);
          const barColor =
            pct >= 80
              ? "bg-green-400"
              : pct >= 50
              ? "bg-blue-400"
              : pct >= 25
              ? "bg-amber-400"
              : "bg-slate-300";
          return (
            <div key={dim.key} className="flex items-center gap-2">
              <span className="w-8 text-right text-[11px] text-slate-500 tabular-nums">
                {score.breakdown[dim.key]}
              </span>
              <span className="w-8 text-[11px] text-slate-400">{dim.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths */}
      {score.strengths.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 text-xs font-medium text-green-700 mb-1.5">
            <TrendingUp className="h-3 w-3" />
            优势
          </div>
          <ul className="space-y-1">
            {score.strengths.slice(0, 2).map((s, i) => (
              <li key={i} className="flex items-start gap-1 text-xs text-slate-600">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-green-400" />
                <span>
                  <span className="font-medium">{s.title}</span>
                  <span className="text-slate-400"> — {s.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {score.weaknesses.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-1.5">
            <AlertTriangle className="h-3 w-3" />
            关注
          </div>
          <ul className="space-y-1">
            {score.weaknesses.slice(0, 2).map((w, i) => (
              <li key={i} className="flex items-start gap-1 text-xs text-slate-600">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-red-300" />
                <span>
                  <span className="font-medium">{w.title}</span>
                  <span className="text-slate-400"> — {w.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
