import type { Session } from "next-auth";
import type { LivingScore } from "@/lib/living-score";
import { AddressInput } from "@/components/search/AddressInput";
import { POIToggles } from "@/components/search/POIToggles";
import { CommutePanel } from "@/components/commute/CommutePanel";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { SavedLocations } from "@/components/auth/SavedLocations";
import { LivingSummaryCard } from "@/components/insights/LivingSummaryCard";
import { POISummaryPanel } from "@/components/poi/POISummaryPanel";
import { Card } from "@/components/ui/Card";
import { type POICategory, type POIItem, type CommuteResult } from "@/types";

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
  commuteError: string;
  livingScore: LivingScore | null;
  onSelectLocation: (v: { lat: number; lng: number; name: string }) => void;
}

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
    commuteError,
    livingScore,
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

        {/* Living Score Summary */}
        <LivingSummaryCard
          score={livingScore}
          addressAName={addressA?.name}
          addressBName={addressB?.name}
        />

        {/* Commute Panel */}
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

        {/* Stats Panel */}
        {addressA && (
          <POISummaryPanel poiResults={poiResults} poiCount={poiCount} />
        )}

        {/* Auth */}
        <AuthPanel session={session} />

        {/* Saved Locations */}
        <SavedLocations
          session={session}
          currentAddressA={addressA}
          currentScore={livingScore}
          onSelect={onSelectLocation}
        />
      </div>
    </aside>
  );
}

