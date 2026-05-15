"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bookmark, Trash2, MapPin, Plus, X } from "lucide-react";

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface SavedLocationsProps {
  session: { user?: { email?: string } } | null;
  currentAddressA: { lat: number; lng: number; name: string } | null;
  onSelect: (location: { lat: number; lng: number; name: string }) => void;
}

export function SavedLocations({
  session,
  currentAddressA,
  onSelect,
}: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch {
      // silently ignore - user not logged in or network error
    }
  }, [session]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSave = async () => {
    if (!currentAddressA || !saveName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saveName.trim(),
        address: currentAddressA.name,
        lat: currentAddressA.lat,
        lng: currentAddressA.lng,
      }),
    });
    if (res.ok) {
      setSaveName("");
      setShowSave(false);
      fetchLocations();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
    }
  };

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Bookmark className="h-4 w-4 text-[var(--color-primary)]" />
        我的收藏
      </h2>

      {!session?.user ? (
        <p className="text-sm text-slate-400">登录后可收藏地址</p>
      ) : (
        <div className="space-y-3">
          {/* Save current address */}
          {currentAddressA && (
            <div>
              {!showSave ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowSave(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  收藏当前位置
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      收藏地址
                    </span>
                    <button
                      onClick={() => setShowSave(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {currentAddressA.name}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="给这个地址起个名字"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!saveName.trim() || saving}
                    >
                      {saving ? "..." : "保存"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved list */}
          {locations.length === 0 ? (
            <p className="text-sm text-slate-400">暂无收藏</p>
          ) : (
            <ul className="space-y-2">
              {locations.map((loc) => (
                <li
                  key={loc.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() =>
                      onSelect({
                        lat: loc.lat,
                        lng: loc.lng,
                        name: loc.address,
                      })
                    }
                  >
                    <div className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-[var(--color-primary)]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{loc.name}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {loc.address}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="shrink-0 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
