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
  IoChevronForward,
  IoGiftOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet } from "@/lib/api";

type Tab = "invite" | "leaderboard";

interface MyRank { rank: number; referral_count: number; points: number }
interface LeaderEntry { user_id: string; name: string; profile_photo_url: string | null; referral_count: number; rank: number }

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "invite", label: "Your Invite Link", icon: IoPersonAddOutline },
  { id: "leaderboard", label: "Leaderboard", icon: IoTrophyOutline },
];

export default function InvitePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("invite");
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
      setLeaderboard(Array.isArray(board) ? board : []);
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
    } catch { notify(inviteLink); }
  }, [inviteLink, notify]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as any).share({ title: "Join Twedot", text: "Join me on Twedot!", url: inviteLink }).catch(() => {});
    } else { handleCopy(); }
  }, [inviteLink, handleCopy]);

  if (!isAuthenticated) return null;

  const rankLabel = (n: number) => n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : `#${n}`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Invite a Friend</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? "bg-feed-bg" : "hover:bg-feed-bg/60"}`}
              >
                <Icon size={17} className={`flex-shrink-0 ${active ? "text-primary" : "text-light-text"}`} />
                <span className={`flex-1 text-[13px] font-medium ${active ? "text-primary" : "text-text"}`}>{label}</span>
                <IoChevronForward size={13} className={`flex-shrink-0 ${active ? "text-primary" : "text-light-text"}`} />
              </button>
            );
          })}
        </div>

        {/* My stats */}
        {myRank && (
          <div className="border-t border-border p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-light-text">Your Stats</p>
            <div className="flex justify-between">
              <div className="text-center">
                <p className="text-[15px] font-bold text-primary">#{myRank.rank}</p>
                <p className="text-[10px] text-light-text">Rank</p>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-text">{myRank.referral_count}</p>
                <p className="text-[10px] text-light-text">Invited</p>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-text">{myRank.points}</p>
                <p className="text-[10px] text-light-text">Points</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">{TABS.find(t => t.id === tab)?.label}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {tab === "invite" && (
            <>
              {/* Hero */}
              <div className="mb-6 flex items-start gap-4 rounded-2xl bg-feed-bg p-5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                  <IoGiftOutline size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">Invite friends, earn rewards</p>
                  <p className="mt-1 text-[12px] leading-[18px] text-light-text">
                    Share your link and earn referral points for every friend who joins Twedot.
                  </p>
                </div>
              </div>

              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Your Invite Link</p>

              {/* Link row */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-feed-bg px-3 py-2.5 mb-3">
                <p className="min-w-0 flex-1 truncate text-[12px] font-mono text-light-text">
                  {loading ? "Loading…" : (inviteLink || "No token available")}
                </p>
                <button
                  onClick={handleCopy}
                  disabled={!inviteLink}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-40"
                >
                  {copied ? <IoCheckmarkOutline size={14} /> : <IoCopyOutline size={14} />}
                </button>
              </div>

              <button
                onClick={handleShare}
                disabled={!inviteLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <IoShareSocialOutline size={15} />
                Share Invite Link
              </button>
            </>
          )}

          {tab === "leaderboard" && (
            <>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Top Inviters</p>
              {loading ? (
                <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i=><div key={i} className="h-12 animate-pulse rounded-xl bg-feed-bg"/>)}</div>
              ) : leaderboard.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <IoTrophyOutline size={28} className="text-light-text" />
                  <p className="text-[13px] font-semibold text-text">No entries yet</p>
                  <p className="text-[12px] text-light-text">Be the first to invite friends!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {leaderboard.map((entry) => (
                    <div key={entry.user_id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <span className="w-7 text-center text-[14px]">{rankLabel(entry.rank)}</span>
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
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
