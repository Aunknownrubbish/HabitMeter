"use client";

import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { loadCandidates } from "@/lib/candidates";
import {
  compareCandidates,
  type ComparisonDimension,
} from "@/lib/candidate-comparison";
import {
  PREFERENCE_PRESETS,
  loadPreferenceMode,
  savePreferenceMode,
  type PreferenceMode,
} from "@/lib/preference-weights";
import { buildComparisonReport } from "@/lib/comparison-report";
import { Trophy, AlertTriangle, ChevronRight, Copy } from "lucide-react";

interface CandidateComparisonPanelProps {
  refreshKey?: number;
}

const DIM_LABELS: { key: ComparisonDimension; label: string }[] = [
  { key: "total", label: "综合" },
  { key: "commute", label: "通勤" },
  { key: "transport", label: "交通" },
  { key: "convenience", label: "生活" },
  { key: "medical", label: "医疗" },
  { key: "leisure", label: "休闲" },
];

const STATUS_LABELS: Record<string, string> = {
  considering: "考虑中",
  visited: "已看过",
  shortlisted: "重点",
  rejected: "暂不考虑",
};

export function CandidateComparisonPanel({
  refreshKey,
}: CandidateComparisonPanelProps) {
  const [preferenceMode, setPreferenceMode] = useState<PreferenceMode>(
    () => loadPreferenceMode()
  );

  const handleModeChange = useCallback((mode: PreferenceMode) => {
    setPreferenceMode(mode);
    savePreferenceMode(mode);
  }, []);

  const candidates = useMemo(() => loadCandidates(), [refreshKey]);
  const result = useMemo(
    () => compareCandidates(candidates, preferenceMode),
    [candidates, preferenceMode]
  );

  const modeLabel = PREFERENCE_PRESETS[preferenceMode]?.label ?? "均衡";
  const isCustomMode = preferenceMode !== "balanced";

  const [copyMsg, setCopyMsg] = useState("");
  const handleCopy = useCallback(async () => {
    const text = buildComparisonReport(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("已复制");
    } catch {
      setCopyMsg("复制失败，请手动选择内容");
    }
    setTimeout(() => setCopyMsg(""), 3000);
  }, [result]);

  // 0 candidates
  if (candidates.length === 0) {
    return (
      <Card>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Trophy className="h-4 w-4 text-[var(--color-primary)]" />
          候选对比
        </h2>
        <p className="text-sm text-slate-400">
          加入候选后，可在此进行横向对比。
        </p>
      </Card>
    );
  }

  // 1 candidate
  if (candidates.length === 1) {
    return (
      <Card>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Trophy className="h-4 w-4 text-[var(--color-primary)]" />
          候选对比
        </h2>
        <p className="text-sm text-slate-400">
          至少添加 2 个候选后可比较。当前仅 {candidates[0].title}。
        </p>
      </Card>
    );
  }

  // 2+ candidates
  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Trophy className="h-4 w-4 text-[var(--color-primary)]" />
        候选对比
      </h2>

      {/* Preference mode selector */}
      <div className="mb-2 flex flex-wrap gap-1">
        {(
          Object.entries(PREFERENCE_PRESETS) as [PreferenceMode, { label: string }][]
        ).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => handleModeChange(key)}
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
              preferenceMode === key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[10px] text-slate-400">
        当前排序按：{modeLabel}
      </p>

      {/* Copy report */}
      <button
        onClick={handleCopy}
        className="mb-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Copy className="h-3.5 w-3.5" />
        复制报告
      </button>
      {copyMsg && (
        <span
          className={`ml-2 text-xs ${
            copyMsg === "已复制" ? "text-green-600" : "text-red-500"
          }`}
        >
          {copyMsg}
        </span>
      )}

      {/* Summary */}
      <p className="mb-2 text-xs text-slate-600">{result.summary}</p>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {result.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-1 text-xs text-amber-600"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Best overall highlight */}
      {result.bestOverall && (
        <div className="mb-3 rounded-lg border border-[var(--color-primary-light)] bg-blue-50/60 p-2.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
            <Trophy className="h-3.5 w-3.5" />
            综合最优：{result.bestOverall.title}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {result.bestOverall.score.total}分 ·{" "}
            {result.bestOverall.score.level === "excellent"
              ? "很推荐"
              : result.bestOverall.score.level === "good"
              ? "推荐"
              : result.bestOverall.score.level === "average"
              ? "一般"
              : "谨慎"}
            {" · "}
            {result.bestOverall.commute.recommendedTitle}
          </p>
        </div>
      )}

      {/* Dimension winners */}
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {result.winners
          .filter((w) => w.dimension !== "total")
          .map((w) => {
            const winner = w.candidateId
              ? result.candidates.find((c) => c.id === w.candidateId)
              : null;
            return (
              <div
                key={w.dimension}
                className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-center"
              >
                <div className="text-[10px] text-slate-400">{w.label}</div>
                <div className="text-xs font-medium text-slate-700 truncate">
                  {winner?.title ?? "—"}
                </div>
                <div className="text-[10px] text-slate-500">{w.value}</div>
              </div>
            );
          })}
      </div>

      {/* Comparison table — desktop only */}
      <div className="hidden md:block overflow-x-auto -mx-1">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="py-1.5 pr-2 text-left font-medium">名称</th>
              {DIM_LABELS.map((d) => (
                <th key={d.key} className="py-1.5 px-1 text-center font-medium w-10">
                  {d.label}
                </th>
              ))}
{isCustomMode && (
                <th className="py-1.5 px-1 text-center font-medium w-10">偏好分</th>
              )}
              <th className="py-1.5 pl-2 text-left font-medium">推荐通勤</th>
            </tr>
          </thead>
          <tbody>
            {result.sortedByTotal.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b border-slate-50 ${
                  i === 0 ? "bg-blue-50/40" : ""
                }`}
              >
                <td className="py-1.5 pr-2 truncate max-w-[100px]">
                  <span className="font-medium text-slate-700">{c.title}</span>
                </td>
                {DIM_LABELS.map((d) => {
                  const dimKey = d.key as Exclude<ComparisonDimension, "total">;
                  const val =
                    d.key === "total"
                      ? c.score.total
                      : c.score.breakdown[dimKey] ?? 0;
                  const isBest =
                    result.winners.find((w) => w.dimension === d.key)
                      ?.candidateId === c.id;
                  return (
                    <td
                      key={d.key}
                      className={`py-1.5 px-1 text-center tabular-nums ${
                        isBest ? "font-semibold text-[var(--color-primary)]" : "text-slate-600"
                      }`}
                    >
                      {val}
                    </td>
                  );
                })}
                {isCustomMode && (
                  <td className="py-1.5 px-1 text-center font-semibold text-[var(--color-primary)] tabular-nums">
                    {result.weightedScores[c.id] ?? 0}
                  </td>
                )}
                <td className="py-1.5 pl-2 text-slate-500 truncate max-w-[120px]">
                  {c.commute.recommendedTitle}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparison cards — mobile only */}
      <div className="md:hidden space-y-2">
        {result.sortedByTotal.map((c, i) => (
          <div
            key={c.id}
            className={`rounded-lg border p-2.5 ${
              i === 0
                ? "border-[var(--color-primary-light)] bg-blue-50/60"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700">
                {c.title}
                <span className="ml-1.5 text-[10px] text-slate-400">
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  i === 0
                    ? "text-[var(--color-primary)]"
                    : "text-slate-600"
                }`}
              >
                {c.score.total}分
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
              {DIM_LABELS.filter((d) => d.key !== "total").map((d) => {
                const dim = d.key as Exclude<ComparisonDimension, "total">;
                const val = c.score.breakdown[dim] ?? 0;
                return (
                  <div
                    key={d.key}
                    className="rounded bg-white/70 px-1 py-0.5"
                  >
                    <div className="text-slate-400">{d.label}</div>
                    <div className="font-medium text-slate-600 tabular-nums">
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
            {isCustomMode && (
              <div className="mt-1 text-[10px] text-slate-500">
                偏好分：<span className="font-semibold text-[var(--color-primary)]">{result.weightedScores[c.id] ?? 0}</span>
              </div>
            )}
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <ChevronRight className="h-3 w-3" />
              {c.commute.recommendedTitle}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
