import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import {
  summarizePOIAccessibility,
  type POIAccessibilitySummary,
} from "@/lib/poi-analysis";
import type { POICategory, POIItem } from "@/types";
import { POI_CATEGORIES } from "@/types";

interface POISummaryPanelProps {
  poiResults: Record<POICategory, POIItem[]>;
  poiCount: number;
}

const COLORS: Record<POICategory, string> = {
  convenience: "#3B82F6",
  subway: "#22C55E",
  bus: "#F59E0B",
  park: "#10B981",
  hospital: "#EF4444",
};

const RATING_STYLE: Record<POIAccessibilitySummary["rating"], { text: string; className: string }> = {
  good: { text: "较方便", className: "bg-green-50 text-green-700" },
  average: { text: "一般", className: "bg-amber-50 text-amber-700" },
  weak: { text: "偏弱", className: "bg-red-50 text-red-600" },
  none: { text: "暂无", className: "bg-slate-100 text-slate-400" },
};

const SKELETON_WIDTHS = ["86%", "68%", "92%", "74%", "58%"];

export function POISummaryPanel({ poiResults, poiCount }: POISummaryPanelProps) {
  const summaries = useMemo(() => summarizePOIAccessibility(poiResults), [poiResults]);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-800">周边配套</h2>

      {poiCount > 0 ? (
        <div>
          {/* Summary grid */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {summaries.map((s) => {
              const distText =
                s.nearestDistance !== null
                  ? `最近 ${formatDistance(s.nearestDistance)}`
                  : "暂无";
              const ratingStyle = RATING_STYLE[s.rating];

              return (
                <div
                  key={s.category}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center"
                >
                  <div className="text-lg font-bold text-slate-800">
                    {s.count > 0 ? s.count : "—"}
                  </div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400 leading-tight">
                    {distText}
                  </div>
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${ratingStyle.className}`}
                  >
                    {ratingStyle.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Expandable POI detail lists */}
          <div className="space-y-2">
            {POI_CATEGORIES.map((cat) => {
              const items = poiResults[cat.key] ?? [];
              if (items.length === 0) return null;
              return (
                <details key={cat.key} className="group">
                  <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[cat.key] }}
                    />
                    {cat.label}（{items.length}）
                  </summary>
                  <ul className="ml-4 mt-1.5 space-y-1 border-l-2 border-slate-100 pl-3">
                    {items
                      .sort((a, b) => a.distance - b.distance)
                      .slice(0, 10)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-xs text-slate-600"
                        >
                          <span className="truncate">{item.name}</span>
                          <span className="ml-2 shrink-0 tabular-nums text-slate-400">
                            {formatDistance(item.distance)}
                          </span>
                        </li>
                      ))}
                    {items.length > 10 && (
                      <li className="text-xs text-slate-400">
                        ...还有 {items.length - 10} 个
                      </li>
                    )}
                  </ul>
                </details>
              );
            })}
          </div>
        </div>
      ) : (
        <SkeletonLines count={5} />
      )}
    </Card>
  );
}

function SkeletonLines({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-5 animate-pulse rounded bg-slate-100"
          style={{ width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] }}
        />
      ))}
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
