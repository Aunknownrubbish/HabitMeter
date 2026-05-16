import { getClientAmapConfig } from "@/lib/env";

let AMapNamespace: any = null;
let loadPromise: Promise<any> | null = null;

export async function loadAMap(): Promise<any> {
  if (AMapNamespace) return AMapNamespace;
  if (loadPromise) return loadPromise;

  const config = getClientAmapConfig();
  if (!config) {
    throw new Error("高德地图配置缺失：请设置 NEXT_PUBLIC_AMAP_KEY 和 NEXT_PUBLIC_AMAP_SECRET 环境变量");
  }

  // AMap JS API 2.0 requires security config set on window BEFORE script loads
  if (typeof window !== "undefined") {
    (window as any)._AMapSecurityConfig = {
      securityJsCode: config.secret,
    };
  }

  loadPromise = import("@amap/amap-jsapi-loader")
    .then((mod) =>
      mod.default.load({
        key: config.key,
        version: "2.0",
        plugins: [
          "AMap.PlaceSearch",
          "AMap.AutoComplete",
          "AMap.Geocoder",
          "AMap.DragRoute",
          "AMap.TransferRoute",
          "AMap.WalkingRoute",
          "AMap.RidingRoute",
        ],
      })
    )
    .then((AMap: any) => {
      AMapNamespace = AMap;
      return AMap;
    })
    .catch((err: Error) => {
      loadPromise = null;
      throw err;
    });

  return loadPromise;
}

export function getAMap(): any {
  return AMapNamespace;
}
