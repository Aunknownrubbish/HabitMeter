export interface POIItem {
  id: string;
  name: string;
  type: POICategory;
  distance: number; // meters
  lat: number;
  lng: number;
  address: string;
}

export type POICategory = "convenience" | "subway" | "bus" | "park" | "hospital";

export const POI_CATEGORIES: { key: POICategory; label: string; amapType: string }[] = [
  { key: "convenience", label: "便利店", amapType: "便利店" },
  { key: "subway", label: "地铁站", amapType: "地铁站" },
  { key: "bus", label: "公交站", amapType: "公交站" },
  { key: "park", label: "公园", amapType: "公园" },
  { key: "hospital", label: "医院", amapType: "医院" },
];

export interface CommuteInfo {
  duration: number; // seconds
  distance: number; // meters
  summary: string; // e.g. "约35分钟 | 12.5公里"
}

export interface TransitInfo extends CommuteInfo {
  mode: "transit";
  walkDistance: number; // meters
  segments: TransitSegment[];
  fare: string; // e.g. "¥5"
}

export interface TransitSegment {
  type: "walk" | "bus" | "subway" | "train";
  name: string; // line name or "步行"
  distance: number; // meters
  duration: number; // seconds
  instruction: string; // e.g. "乘坐 地铁4号线（安河桥北方向）"
  stations: number; // stops count (for bus/subway)
  startStation: string;
  endStation: string;
}

export interface DrivingInfo extends CommuteInfo {
  mode: "driving";
  traffic: string;
}

export interface WalkingInfo extends CommuteInfo {
  mode: "walking";
  steps: string[];
}

export interface RidingInfo extends CommuteInfo {
  mode: "riding";
}

export interface CommuteResult {
  transit: TransitInfo | null;
  driving: DrivingInfo | null;
  walking: WalkingInfo | null;
  riding: RidingInfo | null;
}
