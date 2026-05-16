import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { TransitInfo, DrivingInfo, WalkingInfo, RidingInfo } from "@/types";
import { getCommuteRecommendation } from "@/lib/commute-recommendation";
import { Bus, Car, Footprints, Bike, Clock, MapPin, ArrowRight, Star, AlertTriangle } from "lucide-react";

interface CommutePanelProps {
  transit: TransitInfo | null;
  driving: DrivingInfo | null;
  walking: WalkingInfo | null;
  riding: RidingInfo | null;
  loading: boolean;
  error?: string;
  addressAName?: string;
  addressBName?: string;
}

const MODE_ICONS: Record<string, React.ElementType> = {
  transit: Bus,
  driving: Car,
  riding: Bike,
  walking: Footprints,
};

const MODE_LABELS: Record<string, string> = {
  transit: "公共交通",
  driving: "驾车",
  riding: "骑行",
  walking: "步行",
};

export function CommutePanel({
  transit,
  driving,
  walking,
  riding,
  loading,
  error,
  addressAName,
  addressBName,
}: CommutePanelProps) {
  const hasAnyResult = transit || driving || walking || riding;

  const recommendation = useMemo(
    () =>
      getCommuteRecommendation({
        transit,
        driving,
        walking,
        riding,
      }),
    [transit, driving, walking, riding]
  );

  const isRecommended = (mode: string) => recommendation.mode === mode;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-800">通勤分析</h2>

      {!addressAName || !addressBName ? (
        <p className="text-sm text-slate-400">输入地址 B 后自动计算路线</p>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : !hasAnyResult ? (
        <p className="text-sm text-slate-400">正在计算路线...</p>
      ) : (
        <div className="space-y-3">
          {/* Address labels */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />
            <span className="truncate">{addressAName}</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <MapPin className="h-3 w-3 shrink-0 text-red-500" />
            <span className="truncate">{addressBName}</span>
          </div>

          {/* Recommendation Banner */}
          {recommendation.mode && (
            <div className="rounded-lg border border-[var(--color-primary-light)] bg-blue-50/60 p-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                <Star className="h-4 w-4" />
                {recommendation.title}
              </div>
              <p className="mt-1 text-xs text-slate-600">{recommendation.reason}</p>
              {recommendation.warnings.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {recommendation.warnings.map((w, i) => (
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
            </div>
          )}

          {/* Driving */}
          {driving && (
            <details className="group" open={isRecommended("driving")}>
              <summary className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Car className="h-4 w-4 text-blue-600" />
                驾车
                <span className="ml-auto text-xs text-slate-400">{driving.summary}</span>
                {isRecommended("driving") && (
                  <Star className="h-3 w-3 text-[var(--color-primary)]" />
                )}
              </summary>
              <div className="mt-1.5 px-3">
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(driving.duration)}
                  </span>
                  <span>{formatDistance(driving.distance)}</span>
                  <span className={`font-medium ${
                    driving.traffic === "畅通" ? "text-green-600" :
                    driving.traffic === "缓行" ? "text-amber-600" : "text-red-600"
                  }`}>
                    路况{driving.traffic}
                  </span>
                </div>
              </div>
            </details>
          )}

          {/* Transit */}
          {transit && transit.segments.length > 0 && (
            <details className="group" open={isRecommended("transit")}>
              <summary className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Bus className="h-4 w-4 text-green-600" />
                公共交通
                <span className="ml-auto text-xs text-slate-400">{transit.summary}</span>
                {isRecommended("transit") && (
                  <Star className="h-3 w-3 text-[var(--color-primary)]" />
                )}
              </summary>
              <div className="mt-1.5 space-y-0">
                {/* Segments timeline */}
                {transit.segments.map((seg, i) => (
                  <div key={i} className="flex gap-2">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center pt-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full border-2 ${
                        seg.type === "walk"
                          ? "border-slate-300 bg-white"
                          : seg.type === "subway"
                          ? "border-green-500 bg-green-500"
                          : seg.type === "bus"
                          ? "border-amber-500 bg-amber-500"
                          : "border-blue-500 bg-blue-500"
                      }`} />
                      {i < transit.segments.length - 1 && (
                        <div className="my-0.5 w-0.5 flex-1 bg-slate-200" />
                      )}
                    </div>
                    {/* Segment info */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          seg.type === "walk"
                            ? "bg-slate-100 text-slate-500"
                            : seg.type === "subway"
                            ? "bg-green-50 text-green-700"
                            : seg.type === "bus"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {seg.type === "walk" ? "步行" :
                           seg.type === "subway" ? "地铁" :
                           seg.type === "bus" ? "公交" : "火车"}
                        </span>
                        <span className="text-xs text-slate-700 font-medium truncate">
                          {seg.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {seg.startStation && seg.endStation ? (
                          <span>{seg.startStation} → {seg.endStation}</span>
                        ) : null}
                        {seg.stations > 0 && ` · ${seg.stations}站`}
                        <span className="ml-1">{formatDuration(seg.duration)}</span>
                        <span className="ml-1">{formatDistance(seg.distance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-3 px-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />{formatDuration(transit.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Footprints className="h-3 w-3" />步行 {formatDistance(transit.walkDistance)}
                </span>
                <span>{transit.fare}</span>
              </div>
            </details>
          )}

          {/* Riding */}
          {riding && (
            <details className="group" open={isRecommended("riding")}>
              <summary className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Bike className="h-4 w-4 text-orange-500" />
                骑行
                <span className="ml-auto text-xs text-slate-400">{riding.summary}</span>
                {isRecommended("riding") && (
                  <Star className="h-3 w-3 text-[var(--color-primary)]" />
                )}
              </summary>
              <div className="mt-1.5 px-3">
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(riding.duration)}
                  </span>
                  <span>{formatDistance(riding.distance)}</span>
                </div>
              </div>
            </details>
          )}

          {/* Walking */}
          {walking && (
            <details className="group" open={isRecommended("walking")}>
              <summary className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <Footprints className="h-4 w-4 text-slate-500" />
                步行
                <span className="ml-auto text-xs text-slate-400">{walking.summary}</span>
                {isRecommended("walking") && (
                  <Star className="h-3 w-3 text-[var(--color-primary)]" />
                )}
              </summary>
              <div className="mt-1.5 px-3">
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(walking.duration)}
                  </span>
                  <span>{formatDistance(walking.distance)}</span>
                </div>
                {walking.steps.length > 0 && (
                  <div className="mt-1.5 space-y-0.5 border-l-2 border-slate-100 pl-2">
                    {walking.steps.map((step, i) => (
                      <div key={i} className="text-[11px] text-slate-500">
                        {step}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}小时${m > 0 ? `${m}分钟` : ""}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
