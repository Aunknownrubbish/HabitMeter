import type { POICategory, POIItem } from "@/types";
import { POI_CATEGORIES } from "@/types";

export interface POIAccessibilitySummary {
  category: POICategory;
  label: string;
  count: number;
  nearestDistance: number | null;
  rating: "good" | "average" | "weak" | "none";
  description: string;
}

function nearest(items: POIItem[]): number | null {
  if (items.length === 0) return null;
  return Math.min(...items.map((p) => p.distance));
}

const RATING_RULES: Record<
  POICategory,
  (count: number, dist: number | null) => POIAccessibilitySummary["rating"]
> = {
  convenience: (count, dist) => {
    if (count >= 10 && dist !== null && dist <= 500) return "good";
    if (count > 0) return "average";
    return "none";
  },
  subway: (count, dist) => {
    if (dist !== null && dist <= 1000) return "good";
    if (dist !== null && dist <= 2000) return "average";
    if (count > 0) return "weak";
    return "none";
  },
  bus: (count, dist) => {
    if (dist !== null && dist <= 500 && count >= 5) return "good";
    if (count > 0) return "average";
    return "none";
  },
  hospital: (count, dist) => {
    if (dist !== null && dist <= 1500) return "good";
    if (count > 0) return "average";
    return "none";
  },
  park: (count, dist) => {
    if (dist !== null && dist <= 1500) return "good";
    if (count > 0) return "average";
    return "none";
  },
};

export function summarizePOIAccessibility(
  poiResults: Record<POICategory, POIItem[]>
): POIAccessibilitySummary[] {
  return POI_CATEGORIES.map((cat) => {
    const items = poiResults[cat.key] ?? [];
    const count = items.length;
    const dist = nearest(items);
    const rater = RATING_RULES[cat.key];
    const rating = rater(count, dist);
    const description = describeRating(rating, count, dist);

    return {
      category: cat.key,
      label: cat.label,
      count,
      nearestDistance: dist,
      rating,
      description,
    };
  });
}

function describeRating(
  rating: POIAccessibilitySummary["rating"],
  count: number,
  dist: number | null
): string {
  const distText = dist !== null ? `最近 ${dist}m` : "3km 内暂无";

  switch (rating) {
    case "good":
      return `较方便，${distText}`;
    case "average":
      return count > 0 ? `一般，${distText}` : distText;
    case "weak":
      return `偏弱，${distText}`;
    case "none":
      return "3km 内暂无";
  }
}
