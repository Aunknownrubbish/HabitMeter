"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Session } from "next-auth";
import { AddressInput } from "@/components/search/AddressInput";
import { POIToggles } from "@/components/search/POIToggles";
import { CommutePanel } from "@/components/commute/CommutePanel";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { SavedLocations } from "@/components/auth/SavedLocations";
import { Card } from "@/components/ui/Card";
import { POI_CATEGORIES, type POICategory, type POIItem, type CommuteResult } from "@/types";
import { Search, BarChart3, Bus, Bookmark, User } from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
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
  commuteError: string;
  onSelectLocation: (v: { lat: number; lng: number; name: string }) => void;
}

const SNAP_POINTS = [0.15, 0.5, 0.9]; // peek, half, full
const MIN_HEIGHT = 0.1;
const COLORS: Record<POICategory, string> = {
  convenience: "#3B82F6",
  subway: "#22C55E",
  bus: "#F59E0B",
  park: "#10B981",
  hospital: "#EF4444",
};

export function MobileDrawer({ open, onClose, ...props }: MobileDrawerProps) {
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
    commuteError,
    onSelectLocation,
  } = props;

  const [heightRatio, setHeightRatio] = useState(SNAP_POINTS[1]);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "stats" | "commute" | "saved">("search");
  const drawerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Reset to half when opened
  useEffect(() => {
    if (open) setHeightRatio(SNAP_POINTS[1]);
  }, [open]);

  const snapToNearest = useCallback((ratio: number) => {
    let closest = SNAP_POINTS[0];
    let minDiff = Math.abs(ratio - SNAP_POINTS[0]);
    for (const s of SNAP_POINTS) {
      const diff = Math.abs(ratio - s);
      if (diff < minDiff) { minDiff = diff; closest = s; }
    }
    setHeightRatio(closest);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true);
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = heightRatio;
  }, [heightRatio]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const dy = startYRef.current - e.touches[0].clientY;
    const viewportH = window.innerHeight;
    const dRatio = dy / viewportH;
    const next = Math.min(0.92, Math.max(MIN_HEIGHT, startHeightRef.current + dRatio));
    setHeightRatio(next);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    snapToNearest(heightRatio);
  }, [heightRatio, snapToNearest]);

  const handleClose = useCallback(() => {
    setHeightRatio(0);
    onClose();
  }, [onClose]);

  if (!open) return null;

  const tabs = [
    { key: "search", icon: Search, label: "搜索" },
    { key: "stats", icon: BarChart3, label: "配套", badge: addressA ? poiCount : null },
    { key: "commute", icon: Bus, label: "通勤" },
    { key: "saved", icon: Bookmark, label: session ? "收藏" : "登录" },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 md:hidden transition-opacity"
        style={{ opacity: Math.min(1, heightRatio * 2) }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-[var(--color-bg-page)] shadow-lg transition-[height] md:hidden"
        style={{
          height: `${heightRatio * 100}%`,
          transition: dragging ? "none" : "height 0.3s ease-out",
        }}
      >
        {/* Drag Handle */}
        <div
          className="shrink-0 cursor-grab touch-none py-3"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto h-1 w-9 rounded-full bg-slate-300" />
        </div>

        {/* Tab Bar */}
        {heightRatio > 0.3 && (
          <div className="flex shrink-0 justify-around border-b border-slate-200 bg-white px-2 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    activeTab === tab.key
                      ? "text-[var(--color-primary)]"
                      : "text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px]">{tab.label}</span>
                  {"badge" in tab && tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -top-0.5 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {/* Search Tab */}
          {activeTab === "search" && (
            <div className="space-y-4 pt-3">
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
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="space-y-4 pt-3">
              {addressA ? (
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
                              className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center"
                            >
                              <div className="text-xl font-bold text-slate-800">
                                {items.length}
                              </div>
                              <div className="text-xs text-slate-500">{cat.label}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-2">
                        {POI_CATEGORIES.map((cat) => {
                          const items = poiResults[cat.key] ?? [];
                          if (items.length === 0) return null;
                          return (
                            <details key={cat.key}>
                              <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-700">
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
              ) : (
                <Card>
                  <h2 className="mb-3 text-sm font-semibold text-slate-800">
                    周边配套
                  </h2>
                  <p className="text-sm text-slate-400">
                    输入地址 A 后自动统计分析
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Commute Tab */}
          {activeTab === "commute" && (
            <div className="space-y-4 pt-3">
              <CommutePanel
                transit={commuteResult.transit}
                driving={commuteResult.driving}
                walking={commuteResult.walking}
                riding={commuteResult.riding}
                loading={commuteLoading}
                error={commuteError}
                addressAName={addressA?.name}
                addressBName={addressB?.name}
              />
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === "saved" && (
            <div className="space-y-4 pt-3">
              <AuthPanel session={session} />
              <SavedLocations
                session={session}
                currentAddressA={addressA}
                onSelect={(loc) => {
                  onSelectLocation(loc);
                  setActiveTab("search");
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
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
