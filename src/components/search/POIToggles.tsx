import { Toggle } from "@/components/ui/Toggle";
import { POI_CATEGORIES, type POICategory } from "@/types";

// Color dots for each category
const COLORS: Record<POICategory, string> = {
  convenience: "#3B82F6",
  subway: "#22C55E",
  bus: "#F59E0B",
  park: "#10B981",
  hospital: "#EF4444",
};

interface POITogglesProps {
  enabled: Set<POICategory>;
  onChange: (enabled: Set<POICategory>) => void;
  disabled?: boolean;
}

export function POIToggles({ enabled, onChange, disabled }: POITogglesProps) {
  const handleToggle = (key: POICategory) => {
    const next = new Set(enabled);
    if (next.has(key)) {
      if (next.size <= 1) return; // keep at least 1 enabled
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {POI_CATEGORIES.map((cat) => (
        <Toggle
          key={cat.key}
          label={
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[cat.key] }}
              />
              {cat.label}
            </span>
          }
          checked={enabled.has(cat.key)}
          onChange={() => handleToggle(cat.key)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
