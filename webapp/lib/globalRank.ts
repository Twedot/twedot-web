// lib/globalRank.ts — ported directly from the mobile app's utils/globalRank.ts so the
// web feed shows the exact same tier ladder, thresholds, labels, and colors instead of
// inventing a parallel one. Keep this in sync with that file if the ladder ever changes.
export type GlobalRankTier =
  | "unknown"
  | "known"
  | "noticed"
  | "recognized"
  | "influential"
  | "elite"
  | "warlord"
  | "titan"
  | "legend"
  | "supreme";

const GLOBAL_RANK_THRESHOLDS: { tier: GlobalRankTier; min: number }[] = [
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

export function getGlobalRankTier(activityScore: number): GlobalRankTier {
  let current: GlobalRankTier = "unknown";
  for (const { tier, min } of GLOBAL_RANK_THRESHOLDS) {
    if (activityScore >= min) current = tier;
  }
  return current;
}

export const GLOBAL_RANK_LABELS: Record<GlobalRankTier, string> = {
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
};

// Same visual language as mobile: a colored star, diamond for the top two tiers.
export const GLOBAL_RANK_ICON: Record<GlobalRankTier, "star" | "diamond"> = {
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
};

export const GLOBAL_RANK_COLORS: Record<GlobalRankTier, string> = {
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
};
