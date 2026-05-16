import type { Session } from "next-auth";
import { AddressInput } from "@/components/search/AddressInput";
import { POIToggles } from "@/components/search/POIToggles";
import { CommutePanel } from "@/components/commute/CommutePanel";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { SavedLocations } from "@/components/auth/SavedLocations";
import { Card } from "@/components/ui/Card";
import { POI_CATEGORIES, type POICategory, type POIItem, type CommuteResult } from "@/types";

interface SidebarProps {
  className?: string;
  session: Session | null;
  addressA: { lat: number; lng: number; name: string } | null;
  setAddressA: (v: { lat: number; lng: number; name: string } | null) => void;
  addressB: { lat: number; lng: number; name: string } | null;
  setAddressB: (v: { lat: number; lng: number; name: string } | null) => void;
  enabledCategories: Set<POICategory>;
  setEnabledCategories: (s: Set<POICategory>) => void;
  poiResults: Record<POICategory, POIItem[]>;
  poiCount: number;
  commuteResult: CommuteResult;
  commuteLoading: boolean;
  onSelectLocation: (v: { lat: number; lng: number; name: string }) => void;
}

const COLORS: Record<POICategory, string> = {
  convenience: "#3B82F6",
  subway: "#22C55E",
  bus: "#F59E0B",
  park: "#10B981",
  hospital: "#EF4444",
};

export function Sidebar({ className = "", ...props }: SidebarProps) {
  const {
    session,
    addressA,
    setAddressA,
    addressB,
    setAddressB,
    enabledCategories,
    setEnabledCategories,
    poiResults,
    poiCount,
    commuteResult,
    commuteLoading,
    onSelectLocation,
  } = props;

  return (
    <aside
      className={`w-[400px] shrink-0 flex-col border-r border-slate-200 bg-[var(--color-bg-page)] ${className}`}
    >
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-[var(--color-primary)]">
          寻栖
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">居住环境决策工具</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Search Section */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            地址搜索
          </h2>
          <div className="space-y-3">
            <AddressInput
              label="📍 意向居住地（A）"
              placeholder="输入意向居住地址"
              value={addressA}
              onChange={setAddressA}
            />
            <AddressInput
              label="🏢 上班地址（B）"
              placeholder="输入上班地址"
              value={addressB}
              onChange={setAddressB}
            />
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-medium text-slate-500">
              周边设施筛选
            </p>
            <POIToggles
              enabled={enabledCategories}
              onChange={setEnabledCategories}
              disabled={!addressA}
            />
          </div>
        </Card>

        {/* Stats Panel */}
        {addressA && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              周边配套
            </h2>
            {poiCount > 0 ? (
              <div>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {POI_CATEGORIES.map((cat) => {
                    const items = poiResults[cat.key] ?? [];
                    return (
                      <div
                        key={cat.key}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center"
                      >
                        <div className="text-lg font-bold text-slate-800">
                          {items.length}
                        </div>
                        <div className="text-xs text-slate-500">{cat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Expandable POI Lists */}
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
        )}

        {/* Commute Panel */}
        <CommutePanel
          transit={commuteResult.transit}
          driving={commuteResult.driving}
          walking={commuteResult.walking}
          riding={commuteResult.riding}
          loading={commuteLoading}
          addressAName={addressA?.name}
          addressBName={addressB?.name}
        />

        {/* Auth */}
        <AuthPanel session={session} />

        {/* Saved Locations */}
        <SavedLocations
          session={session}
          currentAddressA={addressA}
          onSelect={onSelectLocation}
        />
      </div>
    </aside>
  );
}

function SkeletonLines({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-5 animate-pulse rounded bg-slate-100"
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
