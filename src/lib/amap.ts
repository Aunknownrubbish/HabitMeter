let AMapNamespace: any = null;
let loadPromise: Promise<any> | null = null;

export async function loadAMap(): Promise<any> {
  if (AMapNamespace) return AMapNamespace;
  if (loadPromise) return loadPromise;

  // AMap JS API 2.0 requires security config set on window BEFORE script loads
  if (typeof window !== "undefined") {
    (window as any)._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECRET!,
    };
  }

  loadPromise = import("@amap/amap-jsapi-loader")
    .then((mod) =>
      mod.default.load({
        key: process.env.NEXT_PUBLIC_AMAP_KEY!,
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
