"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronForward, IoDiamondOutline, IoRocketOutline, IoOpenOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

type Tab = "earnings" | "credits";

interface EarningsStats {
  isEligible: boolean;
  supremeSince: string | null;
  totalQualifiedViews: number;
  totalEarnings: number;
  periodQualifiedViews: number;
  periodEarnings: number;
  deltaPct: number;
}

export default function WalletPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("earnings");
  const [earnings, setEarnings] = useState<EarningsStats | null>(null);
  const [earningsLoaded, setEarningsLoaded] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<{ balance: number }>("/credits/balance").then(r => setCreditsBalance(r?.balance ?? 0)).catch(() => setCreditsBalance(0));
    apiGet<EarningsStats>("/wallet/earnings/stats")
      .then(r => setEarnings(r))
      .catch(() => {})
      .finally(() => setEarningsLoaded(true));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const isSupreme = earnings?.isEligible ?? false;
  const qualifiedViews = earnings?.totalQualifiedViews ?? 0;
  const lifetimeEarnings = earnings?.totalEarnings ?? 0;
  const userName = (user as any)?.name ?? "YOUR NAME";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Wallet</h1>
        </div>
        <div className="px-4 pt-4 flex flex-col gap-2">
          {(["earnings", "credits"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full rounded-lg py-2.5 text-[13.5px] font-bold transition-colors ${tab === t ? "bg-primary text-white" : "bg-feed-bg text-light-text"}`}
            >
              {t === "earnings" ? "Earnings" : "Twedot Credits"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">
            {tab === "earnings" ? "Earnings" : "Twedot Credits"}
          </h2>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-[18px]">

            {tab === "earnings" ? (
              <>
                {/* Dark balance card */}
                <div className="rounded-[18px] border border-white/[0.08] bg-[#12121A] p-[22px]">
                  <div className="flex items-center gap-2 mb-[18px]">
                    <IoDiamondOutline size={22} className="text-yellow-400" />
                    <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-white/70">TWEDOT EARNINGS</span>
                  </div>
                  <p className="text-[12px] font-semibold text-white/50">Balance</p>
                  {!earningsLoaded ? (
                    <div className="my-2 h-9 w-32 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="text-[34px] font-extrabold text-white mt-0.5 mb-6 leading-none">
                      ₦{lifetimeEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold tracking-[0.5px] text-white/85">{userName.toUpperCase()}</span>
                    <span className={`text-[11px] font-extrabold tracking-[0.5px] ${isSupreme ? "text-yellow-400" : "text-white/50"}`}>
                      {isSupreme ? "SUPREME" : "NOT ELIGIBLE YET"}
                    </span>
                  </div>
                </div>

                {/* Your activity (only if eligible) */}
                {isSupreme && (
                  <div className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                    <p className="text-[13px] font-bold uppercase tracking-[0.4px] text-text">Your activity</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] text-light-text flex-1">Qualified views ({qualifiedViews.toLocaleString()} so far)</span>
                      <span className="text-[13.5px] font-bold text-text">₦{lifetimeEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] text-light-text flex-1">Supreme welcome bonus</span>
                      <span className="text-[13.5px] font-bold text-text">₦0.00</span>
                    </div>
                  </div>
                )}

                {/* How earning works */}
                <div className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.4px] text-text">How earning works</p>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-lg flex-shrink-0 ${isSupreme ? "text-green-500" : "text-light-text"}`}>{isSupreme ? "✓" : "○"}</span>
                    <p className="text-[13.5px] leading-[19px] text-light-text">Reach Supreme, the top rank, to unlock a one-time welcome bonus</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg flex-shrink-0 text-light-text">○</span>
                    <p className="text-[13.5px] leading-[19px] text-light-text">
                      From then on, you keep earning more the more QUALIFIED views your videos rack up
                      {qualifiedViews > 0 ? ` (you have ${qualifiedViews.toLocaleString()} so far)` : ""}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Credits balance card */}
                <div className="rounded-[18px] border border-white/[0.08] bg-[#12121A] p-[22px]">
                  <div className="flex items-center gap-2 mb-[18px]">
                    <IoRocketOutline size={22} className="text-primary" />
                    <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-white/70">TWEDOT CREDITS</span>
                  </div>
                  <p className="text-[12px] font-semibold text-white/50">Balance</p>
                  {creditsBalance == null ? (
                    <div className="my-2 h-9 w-32 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="text-[34px] font-extrabold text-white mt-0.5 mb-6 leading-none">
                      {creditsBalance.toLocaleString()} <span className="text-[18px] font-semibold">Credits</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold tracking-[0.5px] text-white/85">{userName.toUpperCase()}</span>
                    <button
                      onClick={() => router.push("/wallet/buy-credits" as any)}
                      className="text-[11px] font-extrabold tracking-[0.5px] text-primary hover:text-primary/80"
                    >
                      BUY CREDITS
                    </button>
                  </div>
                </div>

                {/* What Credits are for */}
                <div className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.4px] text-text">What Credits are for</p>
                  <div className="flex items-center gap-2.5">
                    <IoRocketOutline size={20} className="flex-shrink-0 text-light-text" />
                    <p className="text-[13.5px] leading-[19px] text-light-text">Spend Credits to Boost your posts and reach more people</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex-shrink-0 text-[17px] text-light-text">🏷</span>
                    <p className="text-[13.5px] leading-[19px] text-light-text">1 Twedot Credit = ₦1.5</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Pinned footer links ── */}
          <div className="border-t border-border px-4 py-3 space-y-2">
            {tab === "earnings" ? (
              <>
                <button onClick={() => router.push("/analytics")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <IoDiamondOutline size={18} className="flex-shrink-0 text-primary" />
                  <span className="flex-1 text-[13.5px] font-semibold text-text">Content Monetization — earnings breakdown</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <button onClick={() => router.push("/analytics")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[17px]">📊</span>
                  <span className="flex-1 text-[13.5px] font-semibold text-text">Analytics — views, engagement &amp; jobs</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <a href="https://twedot.com/withdraw-earnings" target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[17px]">🌐</span>
                  <span className="flex-1 text-[13.5px] font-semibold text-text">Learn how Rank &amp; Wallet earnings work</span>
                  <IoOpenOutline size={16} className="flex-shrink-0 text-light-text" />
                </a>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/ads")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[17px]">📊</span>
                  <span className="flex-1 text-[13.5px] font-semibold text-text">Ads Analytics &amp; transaction history</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <a href="https://twedot.com/credits" target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[17px]">🌐</span>
                  <span className="flex-1 text-[13.5px] font-semibold text-text">Learn how Twedot Credits &amp; boosting work</span>
                  <IoOpenOutline size={16} className="flex-shrink-0 text-light-text" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
