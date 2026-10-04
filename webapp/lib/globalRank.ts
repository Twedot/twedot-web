// lib/globalRank.ts — ported from mobile utils/globalRank.ts. Keep in sync if ladder changes.
export type GlobalRankTier =
  | "unknown" | "known" | "noticed" | "recognized" | "influential"
  | "elite" | "warlord" | "titan" | "legend" | "supreme";

export type GlobalDisplayRank = GlobalRankTier | "host";

export const GLOBAL_RANK_THRESHOLDS: { tier: GlobalRankTier; min: number }[] = [
  { tier: "unknown", min: 0 },
  { tier: "known", min: 40 },
  { tier: "noticed", min: 100 },
  { tier: "recognized", min: 220 },
  { tier: "influential", min: 450 },
  { tier: "elite", min: 900 },
  { tier: "warlord", min: 1800 },
  { tier: "titan", min: 3600 },
  { tier: "legend", min: 7200 },
  { tier: "supreme", min: 15000 },
];

const SUPREME_LAP_SIZE = 5000;

export function getGlobalRankTier(activityScore: number): GlobalRankTier {
  let current: GlobalRankTier = "unknown";
  for (const { tier, min } of GLOBAL_RANK_THRESHOLDS) {
    if (activityScore >= min) current = tier;
  }
  return current;
}

export interface GlobalRankProgress {
  tier: GlobalRankTier;
  nextTier?: GlobalRankTier;
  activityScore: number;
  tierFloor: number;
  nextThreshold?: number;
  progress: number; // 0..1
  lap?: number;
}

export function getGlobalRankProgress(activityScore: number): GlobalRankProgress {
  const tier = getGlobalRankTier(activityScore);
  const idx = GLOBAL_RANK_THRESHOLDS.findIndex((t) => t.tier === tier);
  const tierFloor = GLOBAL_RANK_THRESHOLDS[idx].min;
  const next = GLOBAL_RANK_THRESHOLDS[idx + 1];

  if (next) {
    const progress = Math.max(0, Math.min(1, (activityScore - tierFloor) / (next.min - tierFloor)));
    return { tier, nextTier: next.tier, activityScore, tierFloor, nextThreshold: next.min, progress };
  }

  const pastTop = activityScore - tierFloor;
  const lap = Math.floor(pastTop / SUPREME_LAP_SIZE);
  const lapFloor = tierFloor + lap * SUPREME_LAP_SIZE;
  const lapNext = lapFloor + SUPREME_LAP_SIZE;
  const progress = Math.max(0, Math.min(1, (activityScore - lapFloor) / SUPREME_LAP_SIZE));
  return { tier, activityScore, tierFloor: lapFloor, nextThreshold: lapNext, progress, lap };
}

export const GLOBAL_RANK_LABELS: Record<GlobalDisplayRank, string> = {
  unknown: "Rookie",
  known: "Known",
  noticed: "Noticed",
  recognized: "Veteran",
  influential: "Influential",
  elite: "Elite",
  warlord: "Warlord",
  titan: "Titan",
  legend: "Legend",
  supreme: "Supreme",
  host: "Creator",
};

export const GLOBAL_RANK_ICON: Record<GlobalDisplayRank, "star" | "diamond" | "trophy"> = {
  unknown: "star",
  known: "star",
  noticed: "star",
  recognized: "star",
  influential: "star",
  elite: "star",
  warlord: "star",
  titan: "star",
  legend: "diamond",
  supreme: "diamond",
  host: "trophy",
};

export const GLOBAL_RANK_COLORS: Record<GlobalDisplayRank, string> = {
  unknown: "#9AA0A6",
  known: "#77C17E",
  noticed: "#4FC3F7",
  recognized: "#4C6FFF",
  influential: "#C79457",
  elite: "#9C84EF",
  warlord: "#F0B232",
  titan: "#EB459E",
  legend: "#E0313A",
  supreme: "#000000",
  host: "#FFD700",
};
