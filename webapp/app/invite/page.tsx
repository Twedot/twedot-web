"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoPersonAddOutline,
  IoCopyOutline,
  IoShareSocialOutline,
  IoCheckmarkOutline,
  IoTrophyOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet } from "@/lib/api";

interface MyRank { rank: number; referral_count: number; points: number }
interface LeaderEntry { user_id: string; name: string; profile_photo_url: string | null; referral_count: number; rank: number }

export default function InvitePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      apiGet<{ token: string }>("/users/me/invite-token").catch(() => null),
      apiGet<MyRank>("/referrals/my-rank").catch(() => null),
      apiGet<LeaderEntry[]>("/referrals/leaderboard").catch(() => []),
    ]).then(([tok, rank, board]) => {
      setInviteToken(tok?.token ?? null);
      setMyRank(rank);
      setLeaderboard(Array.isArray(board) ? board.slice(0, 10) : []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  const inviteLink = inviteToken ? `https://twedot.com/invite/${inviteToken}` : "";

  const handleCopy = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify("Invite link copied!");
    } catch {
      notify(inviteLink);
    }
  }, [inviteLink, notify]);

  const handleShare = useCallback(async () => {
    if (!inviteLink) return;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as any).share({ title: "Join Twedot", text: "Join me on Twedot!", url: inviteLink }).catch(() => {});
    } else {
      handleCopy();
    }
  }, [inviteLink, handleCopy]);

  if (!isAuthenticated) return null;

  const rankLabel = (n: number) => n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : `#${n}`;

  return (
    <div className="flex flex-col pb-16">
      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <h1 className="text-[20px] font-bold text-text">Invite a Friend</h1>
        <p className="mt-0.5 text-[13px] text-light-text">Share Twedot and earn rewards</p>
      </div>

      {/* Invite card */}
      <div className="mx-4 rounded-2xl bg-primary/10 border border-primary/20 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <IoPersonAddOutline size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text">Your invite link</p>
            <p className="text-[12px] text-light-text">Share to earn referral points</p>
          </div>
        </div>

        {/* Link box */}
        <div className="flex items-center gap-2 rounded-xl bg-feed-bg px-3 py-2.5">
          <p className="min-w-0 flex-1 truncate text-[12px] text-light-text font-mono">
            {loading ? "Loading…" : (inviteLink || "No invite token yet")}
          </p>
          <button
            onClick={handleCopy}
            disabled={!inviteLink}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40"
          >
            {copied ? <IoCheckmarkOutline size={14} /> : <IoCopyOutline size={14} />}
          </button>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={!inviteLink}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <IoShareSocialOutline size={16} />
          Share Invite Link
        </button>
      </div>

      {/* My rank */}
      {myRank && (
        <div className="mx-4 mt-4 flex gap-3">
          {[
            { label: "Your Rank", value: `#${myRank.rank}` },
            { label: "Referrals", value: String(myRank.referral_count) },
            { label: "Points", value: String(myRank.points) },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 rounded-2xl bg-feed-bg p-3 text-center">
              <p className="text-[18px] font-bold text-primary">{value}</p>
              <p className="text-[11px] text-light-text">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mt-5 px-4">
          <div className="mb-3 flex items-center gap-2">
            <IoTrophyOutline size={15} className="text-yellow-400" />
            <p className="text-[13px] font-semibold text-light-text uppercase tracking-wide">Referral Leaderboard</p>
          </div>
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry) => (
              <div key={entry.user_id} className="flex items-center gap-3 rounded-2xl bg-feed-bg px-4 py-3">
                <span className="w-6 text-center text-[14px]">{rankLabel(entry.rank)}</span>
                {entry.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.profile_photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <IoPersonOutline size={14} className="text-primary" />
                  </div>
                )}
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{entry.name}</p>
                <span className="text-[12px] font-semibold text-primary">{entry.referral_count} invited</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
