"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { MapContainer } from "@/components/map/MapContainer";
import { calculateLivingScore } from "@/lib/living-score";
import type { POICategory, POIItem, CommuteResult } from "@/types";
import { POI_CATEGORIES } from "@/types";

interface Address {
  lat: number;
  lng: number;
  name: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [addressA, setAddressA] = useState<Address | null>(null);
  const [addressB, setAddressB] = useState<Address | null>(null);
  const [enabledCategories, setEnabledCategories] = useState<Set<POICategory>>(
    new Set(POI_CATEGORIES.map((c) => c.key))
  );
  const [poiResults, setPOIResults] = useState<
    Record<POICategory, POIItem[]>
  >({} as Record<POICategory, POIItem[]>);
  const [commuteResult, setCommuteResult] = useState<CommuteResult>({
    transit: null,
    driving: null,
    walking: null,
    riding: null,
  });
  const [commuteLoading, setCommuteLoading] = useState(false);
  const [commuteError, setCommuteError] = useState("");

  const handleCommuteResult = useCallback((result: Partial<CommuteResult>) => {
    setCommuteResult((prev) => ({
      transit: result.transit ?? prev.transit,
      driving: result.driving ?? prev.driving,
      walking: result.walking ?? prev.walking,
      riding: result.riding ?? prev.riding,
    }));
    if (result.transit || result.driving || result.walking || result.riding) {
      setCommuteLoading(false);
      setCommuteError("");
    }
  }, []);

  const handleCommuteError = useCallback((message: string) => {
    setCommuteLoading(false);
    setCommuteError(message);
  }, []);

  const handleAddressBChange = useCallback(
    (v: Address | null) => {
      setAddressB(v);
      setCommuteError("");
      if (v && addressA) {
        setCommuteLoading(true);
        setCommuteResult({ transit: null, driving: null, walking: null, riding: null });
      } else if (!v) {
        setCommuteResult({ transit: null, driving: null, walking: null, riding: null });
      }
    },
    [addressA]
  );

  const handleSelectLocation = useCallback((loc: Address) => {
    setAddressA(loc);
  }, []);

  const poiCount = Object.values(poiResults).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0
  );

  const livingScore = useMemo(
    () =>
      calculateLivingScore({
        poiResults,
        commuteResult,
        addressA,
        addressB,
      }),
    [poiResults, commuteResult, addressA, addressB]
  );

  const sidebarProps = {
    session,
    addressA,
    setAddressA,
    addressB,
    setAddressB: handleAddressBChange,
    enabledCategories,
    setEnabledCategories,
    poiResults,
    poiCount,
    commuteResult,
    commuteLoading,
    commuteError,
    livingScore,
    onSelectLocation: handleSelectLocation,
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar className="hidden md:flex" {...sidebarProps} />

      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-2 shadow-sm md:hidden">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--color-primary)]">
            寻栖
          </h1>
          {addressA && (
            <p className="truncate text-[11px] text-slate-400">
              {addressA.name}
              {livingScore.dataQuality.hasAddressA && (
                <span className="text-[var(--color-primary)] font-medium">
                  {" "}
                  {livingScore.level === "excellent" || livingScore.level === "good"
                    ? "推荐"
                    : ""}{" "}
                  {livingScore.total}分
                </span>
              )}
              {poiCount > 0 && ` · ${poiCount}个周边设施`}
            </p>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="ml-2 shrink-0 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white"
        >
          {mobileOpen ? "关闭" : "详情"}
        </button>
      </div>

      <main className="flex-1">
        <MapContainer
          addressA={addressA}
          addressB={addressB}
          enabledCategories={enabledCategories}
          onPOIResults={setPOIResults}
          onCommuteResult={handleCommuteResult}
          onCommuteError={handleCommuteError}
          onMapReady={setMapInstance}
        />
      </main>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        {...sidebarProps}
      />
    </div>
  );
}
