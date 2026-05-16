import type { POICategory, POIItem, CommuteResult } from "@/types";
import type { LivingScore } from "@/lib/living-score";
import { getCommuteRecommendation } from "@/lib/commute-recommendation";
import { summarizePOIAccessibility } from "@/lib/poi-analysis";

// ---- Types ----

export type CandidateStatus = "considering" | "visited" | "shortlisted" | "rejected";

export interface CandidateAddress {
  name: string;
  lat: number;
  lng: number;
}

export interface CandidateCommuteSnapshot {
  recommendedMode: "transit" | "driving" | "walking" | "riding" | null;
  recommendedTitle: string;
  recommendedReason: string;
  durationMinutes: number | null;
  distanceMeters: number | null;
  warnings: string[];
}

export interface CandidatePOISnapshot {
  category: POICategory;
  label: string;
  count: number;
  nearestDistance: number | null;
  rating: "good" | "average" | "weak" | "none";
}

export interface CandidateScoreSnapshot {
  total: number;
  level: LivingScore["level"];
  title: string;
  summary: string;
  breakdown: LivingScore["breakdown"];
  strengths: LivingScore["strengths"];
  weaknesses: LivingScore["weaknesses"];
}

export interface CandidateLocation {
  id: string;
  title: string;
  addressA: CandidateAddress;
  addressB: CandidateAddress | null;
  status: CandidateStatus;
  note: string;
  score: CandidateScoreSnapshot;
  commute: CandidateCommuteSnapshot;
  poi: CandidatePOISnapshot[];
  createdAt: string;
  updatedAt: string;
}

// ---- Constants ----

const CANDIDATE_STORAGE_KEY = "habitmeter:candidates:v1";

// ---- ID generation ----

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---- Create from current analysis ----

export interface CreateCandidateInput {
  addressA: CandidateAddress;
  addressB?: CandidateAddress | null;
  livingScore: LivingScore;
  commuteResult: CommuteResult;
  poiResults: Record<POICategory, POIItem[]>;
  title?: string;
  note?: string;
  status?: CandidateStatus;
}

export function createCandidateFromCurrentAnalysis(
  input: CreateCandidateInput
): CandidateLocation {
  const { addressA, addressB, livingScore, commuteResult, poiResults } = input;

  const recommendation = getCommuteRecommendation(commuteResult);

  const commuteSnapshot: CandidateCommuteSnapshot = {
    recommendedMode: recommendation.mode,
    recommendedTitle: recommendation.title,
    recommendedReason: recommendation.reason,
    durationMinutes: commuteSnapshotMinutes(commuteResult, recommendation.mode),
    distanceMeters: commuteSnapshotDistance(commuteResult, recommendation.mode),
    warnings: recommendation.warnings,
  };

  const poiSnapshot: CandidatePOISnapshot[] = summarizePOIAccessibility(poiResults).map(
    (s) => ({
      category: s.category,
      label: s.label,
      count: s.count,
      nearestDistance: s.nearestDistance,
      rating: s.rating,
    })
  );

  const scoreSnapshot: CandidateScoreSnapshot = {
    total: livingScore.total,
    level: livingScore.level,
    title: livingScore.title,
    summary: livingScore.summary,
    breakdown: livingScore.breakdown,
    strengths: livingScore.strengths,
    weaknesses: livingScore.weaknesses,
  };

  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: input.title?.trim() || addressA.name,
    addressA,
    addressB: addressB ?? null,
    status: input.status ?? "considering",
    note: input.note ?? "",
    score: scoreSnapshot,
    commute: commuteSnapshot,
    poi: poiSnapshot,
    createdAt: now,
    updatedAt: now,
  };
}

function commuteSnapshotMinutes(
  cr: CommuteResult,
  mode: string | null
): number | null {
  if (!mode) return null;
  const map: Record<string, number | null> = {
    transit: cr.transit ? Math.round(cr.transit.duration / 60) : null,
    driving: cr.driving ? Math.round(cr.driving.duration / 60) : null,
    riding: cr.riding ? Math.round(cr.riding.duration / 60) : null,
    walking: cr.walking ? Math.round(cr.walking.duration / 60) : null,
  };
  return map[mode] ?? null;
}

function commuteSnapshotDistance(
  cr: CommuteResult,
  mode: string | null
): number | null {
  if (!mode) return null;
  const map: Record<string, number | null> = {
    transit: cr.transit?.distance ?? null,
    driving: cr.driving?.distance ?? null,
    riding: cr.riding?.distance ?? null,
    walking: cr.walking?.distance ?? null,
  };
  return map[mode] ?? null;
}

// ---- localStorage persistence ----

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadCandidates(): CandidateLocation[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CANDIDATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CandidateLocation[];
  } catch {
    return [];
  }
}

export function saveCandidates(candidates: CandidateLocation[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(candidates));
  } catch {
    console.warn("Failed to save candidates to localStorage");
  }
}

// ---- CRUD helpers ----

export function addCandidate(candidate: CandidateLocation): CandidateLocation[] {
  const list = loadCandidates();
  list.push(candidate);
  saveCandidates(list);
  return list;
}

export function updateCandidate(
  id: string,
  patch: Partial<Pick<CandidateLocation, "title" | "status" | "note">>
): CandidateLocation[] {
  const list = loadCandidates();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return list;
  list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  saveCandidates(list);
  return list;
}

export function deleteCandidate(id: string): CandidateLocation[] {
  const list = loadCandidates();
  const filtered = list.filter((c) => c.id !== id);
  saveCandidates(filtered);
  return filtered;
}

export function clearCandidates(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(CANDIDATE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
