import { IoStar, IoDiamond } from "react-icons/io5";
import { GLOBAL_RANK_COLORS, GLOBAL_RANK_ICON, GLOBAL_RANK_LABELS, getGlobalRankTier } from "@/lib/globalRank";

// Compact version of the mobile app's rank pill (components/profile/RankBadge.tsx /
// nearbyUserItem.tsx's inline rankPill) — same colored-star/diamond + tier label,
// sized down to sit inline in a post header instead of its own row on a profile.
export default function RankBadge({
  activityScore,
  rankVisible = true,
  plain = true,
  className = "",
}: {
  activityScore: number;
  rankVisible?: boolean;
  plain?: boolean;
  className?: string;
}) {
  if (!rankVisible) return null;
  const tier = getGlobalRankTier(activityScore);
  const color = GLOBAL_RANK_COLORS[tier];
  const Icon = GLOBAL_RANK_ICON[tier] === "diamond" ? IoDiamond : IoStar;

  if (plain) {
    return (
      <span
        className={`flex w-fit flex-shrink-0 items-center gap-0.5 text-[9px] font-semibold ${className}`}
        style={{ color }}
      >
        <Icon size={8} />
        {GLOBAL_RANK_LABELS[tier]}
      </span>
    );
  }

  return (
    <span
      className={`flex w-fit flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${className}`}
      style={{ backgroundColor: `${color}1F`, color }}
    >
      <Icon size={10} />
      {GLOBAL_RANK_LABELS[tier]}
    </span>
  );
}
