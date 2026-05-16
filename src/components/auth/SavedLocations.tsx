"use client";

import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import type { LivingScore } from "@/lib/living-score";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bookmark, Trash2, MapPin, Plus, X, Star } from "lucide-react";

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface SavedLocationsProps {
  session: Session | null;
  currentAddressA: { lat: number; lng: number; name: string } | null;
  currentScore?: LivingScore | null;
  onSelect: (location: { lat: number; lng: number; name: string }) => void;
}

const LEVEL_LABEL_C: Record<string, string> = {
  excellent: "很推荐",
  good: "推荐",
  average: "一般",
  weak: "谨慎",
};

export function SavedLocations({
  session,
  currentAddressA,
  currentScore,
  onSelect,
}: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
    try {
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
      } else {
        setError("保存失败，请稍后重试");
      }
    } catch {
      setError("保存失败，请稍后重试");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定删除这个收藏地址吗？")) return;
    setError("");
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      } else {
        setError("删除失败，请稍后重试");
      }
    } catch {
      setError("删除失败，请稍后重试");
    }
  };

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Bookmark className="h-4 w-4 text-[var(--color-primary)]" />
        我的收藏
      </h2>

      {error && (
        <p className="mb-2 text-xs text-red-500">{error}</p>
      )}

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
                  {currentScore && (
                    <div className="flex items-center gap-1.5 rounded bg-[var(--color-primary-light)] px-2 py-1 text-xs">
                      <Star className="h-3 w-3 text-[var(--color-primary)]" />
                      <span className="text-slate-600">
                        当前分析：{currentScore.total}分 ·{" "}
                        {LEVEL_LABEL_C[currentScore.level] ?? ""}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 truncate">
                    {currentAddressA.name}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="小区名 / 房源名 / 备选区域"
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
                  <p className="text-[10px] text-slate-400">
                    当前分析分数不会随收藏保存，后续版本将支持候选对比。
                  </p>
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
