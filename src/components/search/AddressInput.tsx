"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { loadAMap } from "@/lib/amap";
import { Search } from "lucide-react";

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: { lat: number; lng: number; name: string } | null;
  onChange: (value: { lat: number; lng: number; name: string } | null) => void;
}

export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value?.name ?? "");
  const [suggestions, setSuggestions] = useState<
    { name: string; district: string; lat: number; lng: number }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const autoCompleteRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync input value when external value changes
  useEffect(() => {
    if (value) {
      setInputValue(value.name);
    }
  }, [value]);

  // Init AutoComplete
  useEffect(() => {
    loadAMap().then((AMap) => {
      autoCompleteRef.current = new AMap.AutoComplete({
        city: "全国",
        citylimit: false,
      });
    });
  }, []);

  const handleInput = useCallback(
    (text: string) => {
      setInputValue(text);
      if (value) onChange(null); // clear previous selection

      if (!text.trim() || !autoCompleteRef.current) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      autoCompleteRef.current.search(text, (status: string, result: any) => {
        setLoading(false);
        if (status === "complete" && result.tips) {
          const tips = result.tips
            .filter(
              (tip: any) =>
                tip.location && tip.location.lat && tip.location.lng
            )
            .map((tip: any) => ({
              name: tip.name,
              district: tip.district || "",
              lat: tip.location.lat,
              lng: tip.location.lng,
            }));
          setSuggestions(tips);
          setShowSuggestions(tips.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    },
    [value, onChange]
  );

  const handleSelect = (s: {
    name: string;
    district: string;
    lat: number;
    lng: number;
  }) => {
    setInputValue(s.name);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ name: s.name, lat: s.lat, lng: s.lng });
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--color-primary)]" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="cursor-pointer px-4 py-2.5 text-sm text-slate-700 hover:bg-[var(--color-primary-light)]"
              onMouseDown={() => handleSelect(s)}
            >
              <div className="font-medium">{s.name}</div>
              {s.district && (
                <div className="text-xs text-slate-400">{s.district}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
