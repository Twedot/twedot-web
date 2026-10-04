"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoStar, IoDiamond, IoTrophy } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet, apiPatch } from "@/lib/api";
import {
  GLOBAL_RANK_COLORS,
  GLOBAL_RANK_ICON,
  GLOBAL_RANK_LABELS,
  GLOBAL_RANK_THRESHOLDS,
  getGlobalRankProgress,
} from "@/lib/globalRank";

const BOOST_TIPS = [
  "Chatting — every message you send in a 1:1 conversation counts",
  "Posting your own videos and statuses",
  "Commenting on statuses, and liking others' posts",
  "Making real connections — accepted chat requests with other users",
  "Being active in channels/rooms — messages, reactions, polls and upvotes there also count",
  "Completing service bookings as a vendor",
];

function ordinalSuffix(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  if (n % 10 === 1) return "st";
  if (n % 10 === 2) return "nd";
  if (n % 10 === 3) return "rd";
  return "th";
}

function RankIcon({ type, size, color, className = "" }: { type: "star" | "diamond" | "trophy"; size: number; color: string; className?: string }) {
  if (type === "diamond") return <IoDiamond size={size} style={{ color }} className={className} />;
  if (type === "trophy") return <IoTrophy size={size} style={{ color }} className={className} />;
  return <IoStar size={size} style={{ color }} className={className} />;
}

export default function RankPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { notify } = useUi();
  const [score, setScore] = useState<number>(0);
  const [rankVisible, setRankVisible] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setScore(user.global_activity_score ?? 0);
      setRankVisible(user.rank_visible !== false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<{ global_activity_score?: number; rank_visible?: boolean }>("/users/me")
      .then((data) => {
        if (typeof data?.global_activity_score === "number") setScore(data.global_activity_score);
        if (typeof data?.rank_visible === "boolean") setRankVisible(data.rank_visible);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const toggleVisibility = async (next: boolean) => {
    setRankVisible(next);
    setSaving(true);
    try {
      await apiPatch("/users/me", { rank_visible: next });
      refreshUser();
    } catch {
      setRankVisible(!next);
      notify("Could not update — try again");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  const progress = getGlobalRankProgress(score);
  const tierColor = GLOBAL_RANK_COLORS[progress.tier];
  const nextColor = progress.nextTier ? GLOBAL_RANK_COLORS[progress.nextTier] : tierColor;
  const percent = Math.round(progress.progress * 100);
  const lap = progress.lap ?? 0;

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-3 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text hover:bg-feed-bg"
        >
          <IoChevronBack size={20} />
        </button>
        <h1 className="text-[15px] font-bold text-text">Your rank</h1>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 pb-16">

        {/* Hero */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full"
            style={{ backgroundColor: `${tierColor}22` }}
          >
            <RankIcon type={GLOBAL_RANK_ICON[progress.tier]} size={56} color={tierColor} />
          </div>
          <p className="text-center text-[15px] text-light-text">
            Your current rank is{" "}
            <span className="font-bold" style={{ color: tierColor }}>
              {GLOBAL_RANK_LABELS[progress.tier]}{lap > 0 ? ` ×${lap + 1}` : ""}
            </span>
          </p>
        </div>

        {/* Visibility toggle */}
        <div className="rounded-2xl bg-feed-bg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[14px] font-bold text-text">Show my rank to others</p>
              <p className="mt-1 text-[12px] leading-[17px] text-light-text">
                {rankVisible
                  ? "Your rank badge is visible on your profile and in channels."
                  : "Hidden from everyone else — you still see it here, and it keeps growing."}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={rankVisible}
              disabled={saving}
              onClick={() => toggleVisibility(!rankVisible)}
              className={`relative h-[30px] w-[52px] flex-shrink-0 overflow-hidden rounded-full transition-colors duration-200 ${
                rankVisible ? "bg-primary" : "bg-border"
              } ${saving ? "opacity-50" : ""}`}
            >
              <span
                className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                  rankVisible ? "translate-x-[25px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-light-text">Your progress</p>
          <div className="space-y-3 rounded-2xl bg-feed-bg p-4">
            <p className="text-[14px] leading-[20px] text-light-text">
              {progress.nextTier ? (
                <>
                  You are{" "}
                  <span className="font-bold text-text">{percent}%</span>{" "}
                  of the way to reaching{" "}
                  <span className="font-bold" style={{ color: nextColor }}>
                    {GLOBAL_RANK_LABELS[progress.nextTier]}
                  </span>
                </>
              ) : (
                <>
                  You&apos;ve maxed out the ladder —{" "}
                  <span className="font-bold text-text">{percent}%</span>{" "}
                  through your {lap + 1}{ordinalSuffix(lap + 1)} lap of Supreme
                </>
              )}
            </p>
            <div className="flex items-center gap-2.5">
              <RankIcon type={GLOBAL_RANK_ICON[progress.tier]} size={18} color={tierColor} />
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ width: `${progress.progress * 100}%`, backgroundColor: tierColor }}
                />
              </div>
              <RankIcon
                type={GLOBAL_RANK_ICON[progress.nextTier ?? progress.tier]}
                size={18}
                color={nextColor}
              />
            </div>
          </div>
        </div>

        {/* How to boost */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-light-text">How to boost your rank</p>
          <div className="space-y-3 rounded-2xl bg-feed-bg p-4">
            {BOOST_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: tierColor }}
                />
                <p className="text-[13.5px] leading-[19px] text-light-text">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All ranks ladder */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-light-text">All ranks</p>
          <div className="overflow-hidden rounded-2xl bg-feed-bg">
            {GLOBAL_RANK_THRESHOLDS.map(({ tier }, i) => {
              const isCurrent = tier === progress.tier;
              const color = GLOBAL_RANK_COLORS[tier];
              return (
                <div
                  key={tier}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < GLOBAL_RANK_THRESHOLDS.length - 1 ? "border-b border-border" : ""
                  }`}
                  style={isCurrent ? { backgroundColor: `${color}14` } : undefined}
                >
                  <RankIcon type={GLOBAL_RANK_ICON[tier]} size={18} color={color} />
                  <span
                    className="flex-1 text-[14px] font-semibold"
                    style={{ color: isCurrent ? color : undefined }}
                  >
                    {GLOBAL_RANK_LABELS[tier]}
                  </span>
                  {isCurrent && (
                    <span
                      className="rounded-lg px-2 py-0.5 text-[9.5px] font-extrabold tracking-wide text-white"
                      style={{ backgroundColor: color }}
                    >
                      YOU
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
