"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { POICategory, POIItem, CommuteResult } from "@/types";
import type { LivingScore } from "@/lib/living-score";
import {
  createCandidateFromCurrentAnalysis,
  addCandidate,
  loadCandidates,
  deleteCandidate,
  type CandidateLocation,
  type CandidateStatus,
} from "@/lib/candidates";
import {
  ListPlus,
  Trash2,
  MapPin,
  Eye,
  ChevronRight,
  Layers,
} from "lucide-react";

interface CandidatePanelProps {
  addressA: { lat: number; lng: number; name: string } | null;
  addressB: { lat: number; lng: number; name: string } | null;
  livingScore: LivingScore | null;
  commuteResult: CommuteResult;
  poiResults: Record<POICategory, POIItem[]>;
  onSelectCandidate?: (candidate: CandidateLocation) => void;
}

const STATUS_OPTIONS: { value: CandidateStatus; label: string }[] = [
  { value: "considering", label: "考虑中" },
  { value: "visited", label: "已看过" },
  { value: "shortlisted", label: "重点考虑" },
  { value: "rejected", label: "暂不考虑" },
];

const STATUS_STYLE: Record<CandidateStatus, string> = {
  considering: "bg-blue-50 text-blue-700",
  visited: "bg-amber-50 text-amber-700",
  shortlisted: "bg-green-50 text-green-700",
  rejected: "bg-slate-100 text-slate-500",
};

const LEVEL_ZH: Record<string, string> = {
  excellent: "很推荐",
  good: "推荐",
  average: "一般",
  weak: "谨慎",
};

export function CandidatePanel({
  addressA,
  addressB,
  livingScore,
  commuteResult,
  poiResults,
  onSelectCandidate,
}: CandidatePanelProps) {
  const [candidates, setCandidates] = useState<CandidateLocation[]>(() =>
    loadCandidates()
  );
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<CandidateStatus>("considering");
  const [addedMsg, setAddedMsg] = useState("");

  const refreshCandidates = useCallback(() => {
    setCandidates(loadCandidates());
  }, []);

  const handleAdd = () => {
    if (!addressA || !livingScore) return;
    const candidate = createCandidateFromCurrentAnalysis({
      addressA: { name: addressA.name, lat: addressA.lat, lng: addressA.lng },
      addressB: addressB
        ? { name: addressB.name, lat: addressB.lat, lng: addressB.lng }
        : null,
      livingScore,
      commuteResult,
      poiResults,
      title: title.trim() || undefined,
      note: note.trim() || undefined,
      status,
    });
    addCandidate(candidate);
    refreshCandidates();
    setTitle("");
    setNote("");
    setStatus("considering");
    setShowForm(false);
    setAddedMsg("已加入候选清单");
    setTimeout(() => setAddedMsg(""), 3000);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("确定删除这个候选地址吗？")) return;
    deleteCandidate(id);
    refreshCandidates();
  };

  const handleView = (c: CandidateLocation) => {
    onSelectCandidate?.(c);
  };

  // No address A — empty state
  if (!addressA) {
    return (
      <Card>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Layers className="h-4 w-4 text-[var(--color-primary)]" />
          候选清单
        </h2>
        <p className="text-sm text-slate-400">
          输入居住地后，可加入候选清单进行对比。
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          候选清单保存在当前浏览器。
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Layers className="h-4 w-4 text-[var(--color-primary)]" />
        候选清单
      </h2>

      <p className="mb-2 text-[11px] text-slate-400">
        候选清单保存在当前浏览器。
      </p>

      {addedMsg && (
        <p className="mb-2 text-xs font-medium text-green-600">{addedMsg}</p>
      )}

      {/* Add candidate form */}
      {!showForm ? (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mb-3"
          onClick={() => {
            setTitle(addressA.name);
            setStatus("considering");
            setNote("");
            setShowForm(true);
          }}
        >
          <ListPlus className="mr-1 h-3.5 w-3.5" />
          加入候选
        </Button>
      ) : (
        <div className="mb-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <Input
            placeholder="候选名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-[10px] text-slate-400 truncate">
            {addressA.name}
          </p>
          <Input
            placeholder="备注（选填）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  status === opt.value
                    ? STATUS_STYLE[opt.value] + " ring-1 ring-current"
                    : "bg-white text-slate-500 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!title.trim()}>
              保存
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-400">暂无候选</p>
      ) : (
        <ul className="space-y-2">
          {candidates
            .slice()
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {c.title}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[c.status]}`}
                      >
                        {STATUS_OPTIONS.find((o) => o.value === c.status)?.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{c.addressA.name}</span>
                    </div>
                    {c.score && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {c.score.total}分 ·{" "}
                        {LEVEL_ZH[c.score.level] ?? ""} ·{" "}
                        {c.commute.recommendedTitle}
                      </p>
                    )}
                    {c.note && (
                      <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                        {c.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => handleView(c)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-[var(--color-primary)]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}
