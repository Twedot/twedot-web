import Link from "next/link";
import { IoStar, IoDiamond, IoTrophy, IoChevronForward } from "react-icons/io5";
import {
  GLOBAL_RANK_COLORS,
  GLOBAL_RANK_ICON,
  GLOBAL_RANK_LABELS,
  getGlobalRankProgress,
  getGlobalRankTier,
} from "@/lib/globalRank";

function RankIcon({ type, size, color }: { type: "star" | "diamond" | "trophy"; size: number; color: string }) {
  if (type === "diamond") return <IoDiamond size={size} style={{ color }} />;
  if (type === "trophy") return <IoTrophy size={size} style={{ color }} />;
  return <IoStar size={size} style={{ color }} />;
}

export default function RankBadge({
  activityScore,
  rankVisible = true,
  isOwnProfile = false,
  plain = true,
  className = "",
}: {
  activityScore: number;
  rankVisible?: boolean;
  isOwnProfile?: boolean;
  plain?: boolean;
  className?: string;
}) {
  if (!isOwnProfile && !rankVisible) return null;

  if (isOwnProfile) {
    const progress = getGlobalRankProgress(activityScore);
    const color = GLOBAL_RANK_COLORS[progress.tier];
    const percent = Math.round(progress.progress * 100);
    const lapSuffix = progress.lap ? ` ×${progress.lap + 1}` : "";
    return (
      <Link
        href="/rank"
        className={`flex w-fit flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-opacity hover:opacity-80 ${className}`}
        style={{ backgroundColor: `${color}1F`, color }}
      >
        <RankIcon type={GLOBAL_RANK_ICON[progress.tier]} size={11} color={color} />
        <span>{GLOBAL_RANK_LABELS[progress.tier]}{lapSuffix} · {percent}%</span>
        <IoChevronForward size={10} style={{ color }} />
      </Link>
    );
  }

  const tier = getGlobalRankTier(activityScore);
  const color = GLOBAL_RANK_COLORS[tier];
  const iconType = GLOBAL_RANK_ICON[tier];

  if (plain) {
    return (
      <span
        className={`flex w-fit flex-shrink-0 items-center gap-0.5 text-[9px] font-semibold ${className}`}
        style={{ color }}
      >
        <RankIcon type={iconType} size={8} color={color} />
        {GLOBAL_RANK_LABELS[tier]}
      </span>
    );
  }

  return (
    <span
      className={`flex w-fit flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${className}`}
      style={{ backgroundColor: `${color}1F`, color }}
    >
      <RankIcon type={iconType} size={10} color={color} />
      {GLOBAL_RANK_LABELS[tier]}
    </span>
  );
}
