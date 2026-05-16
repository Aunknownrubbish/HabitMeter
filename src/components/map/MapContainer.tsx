"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { loadAMap } from "@/lib/amap";
import type {
  POICategory,
  POIItem,
  CommuteResult,
  TransitSegment,
} from "@/types";
import { POI_CATEGORIES } from "@/types";

interface MapContainerProps {
  addressA: { lat: number; lng: number; name: string } | null;
  addressB: { lat: number; lng: number; name: string } | null;
  enabledCategories: Set<POICategory>;
  onPOIResults: (results: Record<POICategory, POIItem[]>) => void;
  onCommuteResult: (result: Partial<CommuteResult>) => void;
  onCommuteError?: (message: string) => void;
  onMapReady: (map: any) => void;
}

export function MapContainer({
  addressA,
  addressB,
  enabledCategories,
  onPOIResults,
  onCommuteResult,
  onCommuteError,
  onMapReady,
}: MapContainerProps) {
  const [mapError, setMapError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerARef = useRef<any>(null);
  const markerBRef = useRef<any>(null);
  const poiMarkersRef = useRef<any[]>([]);
  const drivingRouteRef = useRef<any>(null);
  const transferRouteRef = useRef<any>(null);
  const walkingRouteRef = useRef<any>(null);
  const ridingRouteRef = useRef<any>(null);

  const clearPOIMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    poiMarkersRef.current.forEach((m) => map.remove(m));
    poiMarkersRef.current = [];
  }, []);

  const clearRoutes = useCallback(() => {
    [drivingRouteRef, transferRouteRef, walkingRouteRef, ridingRouteRef].forEach(
      (ref) => {
        if (ref.current) {
          ref.current.clear();
          ref.current = null;
        }
      }
    );
  }, []);

  const searchPOIs = useCallback(
    (AMap: any, map: any, lat: number, lng: number) => {
      const results: Record<string, POIItem[]> = {};
      const categories = POI_CATEGORIES.filter((c) =>
        enabledCategories.has(c.key)
      );

      if (categories.length === 0) {
        onPOIResults({} as Record<POICategory, POIItem[]>);
        return;
      }

      let completed = 0;
      clearPOIMarkers();

      categories.forEach((cat) => {
        const placeSearch = new AMap.PlaceSearch({
          type: cat.amapType,
          pageSize: 30,
          pageIndex: 1,
        });

        const sw = new AMap.LngLat(lng - 0.027, lat - 0.027);
        const ne = new AMap.LngLat(lng + 0.027, lat + 0.027);
        const bounds = new AMap.Bounds(sw, ne);

        placeSearch.searchInBounds("", bounds, (status: string, result: any) => {
            const items: POIItem[] = [];
            if (status === "complete" && result.poiList) {
              const center = new AMap.LngLat(lng, lat);
              result.poiList.pois.forEach((poi: any) => {
                const poiLngLat = new AMap.LngLat(
                  poi.location.lng,
                  poi.location.lat
                );
                const dist = Math.round(center.distance(poiLngLat));
                if (dist > 3000) return;

                items.push({
                  id: poi.id,
                  name: poi.name,
                  type: cat.key,
                  distance: dist,
                  lat: poi.location.lat,
                  lng: poi.location.lng,
                  address: poi.address || "",
                });

                const color = getCategoryColor(cat.key);
                const marker = new AMap.Marker({
                  position: poi.location,
                  content: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
                  offset: new AMap.Pixel(-6, -6),
                  zIndex: 10,
                });
                marker.setMap(map);
                poiMarkersRef.current.push(marker);
              });
            }
            results[cat.key] = items;
            completed++;
            if (completed === categories.length) {
              onPOIResults(results as Record<POICategory, POIItem[]>);
            }
          }
        );
      });
    },
    [enabledCategories, onPOIResults, clearPOIMarkers]
  );

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    loadAMap()
      .then((AMap) => {
        if (cancelled || !containerRef.current) return;

        const map = new AMap.Map(containerRef.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
          mapStyle: "amap://styles/light",
          resizeEnable: true,
        });

        mapRef.current = map;
        onMapReady(map);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle address A changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerARef.current) map.remove(markerARef.current);
    if (circleRef.current) map.remove(circleRef.current);

    if (!addressA) return;

    loadAMap().then((AMap) => {
      const { lng, lat } = addressA;

      map.setCenter([lng, lat]);
      map.setZoom(14);

      markerARef.current = new AMap.Marker({
        position: [lng, lat],
        title: addressA.name,
        content: `<div style="width:28px;height:28px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;font-family:sans-serif;">A</div>`,
        offset: new AMap.Pixel(-14, -14),
        zIndex: 100,
      });
      markerARef.current.setMap(map);

      circleRef.current = new AMap.Circle({
        center: [lng, lat],
        radius: 3000,
        fillColor: "rgba(59, 130, 246, 0.1)",
        strokeColor: "#3B82F6",
        strokeWeight: 2,
        strokeOpacity: 0.8,
      });
      circleRef.current.setMap(map);

      searchPOIs(AMap, map, lat, lng);
    });
  }, [addressA, searchPOIs]);

  // Handle address B changes + route search
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerBRef.current) map.remove(markerBRef.current);
    clearRoutes();

    if (!addressB) return;

    loadAMap().then((AMap) => {
      markerBRef.current = new AMap.Marker({
        position: [addressB.lng, addressB.lat],
        title: addressB.name,
        label: {
          content: "B",
          offset: [0, 8],
          style: { color: "#fff" },
        },
        content: `<div style="width:28px;height:28px;background:#EF4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;font-family:sans-serif;">B</div>`,
        offset: new AMap.Pixel(-14, -14),
        zIndex: 100,
      });
      markerBRef.current.setMap(map);

      map.setFitView([markerARef.current, markerBRef.current].filter(Boolean));

      // Route search via local API proxy (AMap key stays server-side)
      if (!addressA) return;

      const origin = `${addressA.lng},${addressA.lat}`;
      const dest = `${addressB.lng},${addressB.lat}`;

      let routeCompleted = 0;
      let anyRouteSuccess = false;

      function trackRouteDone(hadResult: boolean) {
        if (hadResult) anyRouteSuccess = true;
        routeCompleted++;
        if (routeCompleted === 4 && !anyRouteSuccess) {
          onCommuteError?.("路线获取失败，请稍后重试");
        }
      }

      // --- Driving ---
      fetch(
        `/api/route/driving?origin=${origin}&destination=${dest}`
      )
        .then((r) => r.json())
        .then((data: any) => {
          if (data.status === "1" && data.route?.paths?.length > 0) {
            const p = data.route.paths[0];
            onCommuteResult({
              driving: {
                mode: "driving" as const,
                duration: parseInt(p.duration),
                distance: parseInt(p.distance),
                traffic: "",
                summary: `约${formatDuration(parseInt(p.duration))} | ${formatDist(parseInt(p.distance))}`,
              },
            });
            trackRouteDone(true);
          } else {
            trackRouteDone(false);
          }
        })
        .catch(() => { trackRouteDone(false); });

      // --- Transit ---
      fetch(
        `/api/route/transit?origin=${origin}&destination=${dest}&city=${encodeURIComponent(addressB.name)}`
      )
        .then((r) => r.json())
        .then((data: any) => {
          if (data.status === "1" && data.route?.transits?.length > 0) {
            const t = data.route.transits[0];
            const segments: TransitSegment[] = [];
            let walkDist = 0;
            (t.segments || []).forEach((seg: any) => {
              if (seg.walking) {
                const d = parseInt(seg.walking.distance || 0);
                walkDist += d;
                segments.push({
                  type: "walk" as const, name: "步行",
                  distance: d, duration: parseInt(seg.walking.duration || 0),
                  instruction: seg.walking.instruction || `步行 ${formatDist(d)}`,
                  stations: 0, startStation: "", endStation: "",
                });
              } else if (seg.bus?.buslines?.length > 0) {
                const bus = seg.bus.buslines[0];
                const isSub = (bus.type || "").includes("地铁") || (bus.type || "").toUpperCase().includes("SUBWAY");
                segments.push({
                  type: isSub ? "subway" as const : "bus" as const,
                  name: bus.name || "",
                  distance: parseInt(seg.bus.distance || 0),
                  duration: parseInt(seg.bus.duration || 0),
                  instruction: `乘坐 ${bus.name}`,
                  stations: bus.via_num || bus.station_count || 0,
                  startStation: bus.departure_stop?.name || "",
                  endStation: bus.arrival_stop?.name || "",
                });
              }
            });
            onCommuteResult({
              transit: {
                mode: "transit" as const,
                duration: parseInt(t.duration || 0),
                distance: parseInt(t.distance || 0),
                walkDistance: walkDist,
                fare: t.fare != null ? `¥${t.fare}` : "未知",
                segments,
                summary: `约${formatDuration(parseInt(t.duration || 0))} | ${formatDist(parseInt(t.distance || 0))}`,
              },
            });
            trackRouteDone(true);
          } else {
            trackRouteDone(false);
          }
        })
        .catch(() => { trackRouteDone(false); });

      // --- Walking ---
      fetch(
        `/api/route/walking?origin=${origin}&destination=${dest}`
      )
        .then((r) => r.json())
        .then((data: any) => {
          if (data.status === "1" && data.route?.paths?.length > 0) {
            const p = data.route.paths[0];
            const steps = (p.steps || []).map((s: any) => s.instruction || "").filter(Boolean);
            onCommuteResult({
              walking: {
                mode: "walking" as const,
                duration: parseInt(p.duration),
                distance: parseInt(p.distance),
                steps: steps.slice(0, 8),
                summary: `约${formatDuration(parseInt(p.duration))} | ${formatDist(parseInt(p.distance))}`,
              },
            });
            trackRouteDone(true);
          } else {
            trackRouteDone(false);
          }
        })
        .catch(() => { trackRouteDone(false); });

      // --- Riding ---
      fetch(
        `/api/route/riding?origin=${origin}&destination=${dest}`
      )
        .then((r) => r.json())
        .then((data: any) => {
          if (data.status === "1" && data.route?.paths?.length > 0) {
            const p = data.route.paths[0];
            onCommuteResult({
              riding: {
                mode: "riding" as const,
                duration: parseInt(p.duration),
                distance: parseInt(p.distance),
                summary: `约${formatDuration(parseInt(p.duration))} | ${formatDist(parseInt(p.distance))}`,
              },
            });
            trackRouteDone(true);
          } else {
            trackRouteDone(false);
          }
        })
        .catch(() => { trackRouteDone(false); });
    });
  }, [addressB, addressA, clearRoutes, onCommuteResult]);

  if (mapError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sm text-slate-400">
        地图加载失败，请检查网络后刷新重试
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}

function getCategoryColor(cat: POICategory): string {
  switch (cat) {
    case "convenience":
      return "#3B82F6";
    case "subway":
      return "#22C55E";
    case "bus":
      return "#F59E0B";
    case "park":
      return "#10B981";
    case "hospital":
      return "#EF4444";
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}分钟`;
  return `${Math.floor(mins / 60)}小时${mins % 60}分钟`;
}

function formatDist(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
