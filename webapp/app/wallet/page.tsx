"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronForward, IoDiamondOutline, IoRocketOutline, IoOpenOutline, IoStorefrontOutline, IoTimeOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

type Tab = "earnings" | "sales" | "credits";

interface EarningsStats {
  isEligible: boolean;
  supremeSince: string | null;
  totalQualifiedViews: number;
  totalEarnings: number;
  periodQualifiedViews: number;
  periodEarnings: number;
  deltaPct: number;
}

interface SalesSummary {
  salesEarnings: number;
  pendingSales: number;
  totalOrders: number;
  recentSales: {
    orderId: string;
    productName: string;
    amount: number;
    status: "pending" | "released";
    createdAt: string;
  }[];
}

export default function WalletPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("earnings");
  const [earnings, setEarnings] = useState<EarningsStats | null>(null);
  const [earningsLoaded, setEarningsLoaded] = useState(false);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [salesLoaded, setSalesLoaded] = useState(false);
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
    apiGet<SalesSummary>("/wallet/sales/summary")
      .then(r => setSales(r))
      .catch(() => {})
      .finally(() => setSalesLoaded(true));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const isSupreme = earnings?.isEligible ?? false;
  const qualifiedViews = earnings?.totalQualifiedViews ?? 0;
  const lifetimeEarnings = earnings?.totalEarnings ?? 0;
  const salesEarnings = sales?.salesEarnings ?? 0;
  const pendingSales = sales?.pendingSales ?? 0;
  const userName = (user as any)?.name ?? "YOUR NAME";

  return (
    <div className="flex flex-col sm:flex-row sm:h-[calc(100vh-3.5rem)] sm:overflow-hidden">

      {/* ── Mobile tab row (hidden on sm+) ── */}
      <div className="sm:hidden flex items-center gap-1 border-b border-border px-4 py-2.5">
        <h1 className="mr-3 text-[15px] font-bold text-text">Wallet</h1>
        {(["earnings", "sales", "credits"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${tab === t ? "bg-primary/15 text-primary" : "text-light-text hover:bg-feed-bg"}`}
          >
            {t === "earnings" ? "Content" : t === "sales" ? "Sales" : "Credits"}
          </button>
        ))}
      </div>

      {/* ── Desktop left sidebar (hidden on mobile) ── */}
      <div className="hidden sm:flex w-[330px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Wallet</h1>
        </div>
        <div className="px-4 pt-3 flex flex-col gap-0.5">
          {(["earnings", "sales", "credits"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition-colors ${tab === t ? "bg-feed-bg text-primary" : "text-light-text hover:bg-feed-bg/60"}`}
            >
              {t === "earnings" ? "Content Earnings" : t === "sales" ? "Sales Earnings" : "Twedot Credits"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content panel ── */}
      <div className="flex flex-1 flex-col sm:overflow-hidden">
        <div className="hidden sm:block border-b border-border px-5 py-4">
          <h2 className="text-[13px] font-bold text-text">
            {tab === "earnings" ? "Content Earnings" : tab === "sales" ? "Sales Earnings" : "Twedot Credits"}
          </h2>
        </div>
        <div className="flex flex-1 flex-col sm:overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-[18px]">

            {tab === "sales" ? (
              <>
                {/* Sales balance card */}
                <div className="rounded-[18px] border border-white/[0.08] bg-[#12121A] p-[22px]">
                  <div className="flex items-center gap-2 mb-[18px]">
                    <IoStorefrontOutline size={22} className="text-green-400" />
                    <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-white/70">SALES EARNINGS</span>
                  </div>
                  <p className="text-[12px] font-semibold text-white/50">Available balance</p>
                  {!salesLoaded ? (
                    <div className="my-2 h-9 w-32 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="text-[34px] font-extrabold text-white mt-0.5 mb-4 leading-none">
                      ₦{salesEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                  {/* Pending row */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <IoTimeOutline size={14} className="text-yellow-400/80" />
                      <span className="text-[12px] text-white/50">Pending (in escrow)</span>
                    </div>
                    {!salesLoaded ? (
                      <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                    ) : (
                      <span className="text-[12px] font-bold text-yellow-400">
                        ₦{pendingSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/30 leading-[15px]">
                    Pending funds are held in escrow and released automatically after 7 days or when the buyer confirms delivery.
                  </p>
                </div>

                {/* Recent sales list */}
                {sales && sales.recentSales.length > 0 && (
                  <div className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                    <p className="text-[12px] font-bold uppercase tracking-[0.4px] text-text">Recent sales</p>
                    {sales.recentSales.map((s) => (
                      <div key={s.orderId} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-text truncate">{s.productName}</p>
                          <p className="text-[10px] text-light-text">{new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[12px] font-bold text-text">
                            ₦{s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <span className={`text-[10px] font-semibold ${s.status === "released" ? "text-green-500" : "text-yellow-500"}`}>
                            {s.status === "released" ? "Released" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* How sales earnings work */}
                <div className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                  <p className="text-[12px] font-bold uppercase tracking-[0.4px] text-text">How sales earnings work</p>
                  <div className="flex items-start gap-2.5">
                    <span className="text-[15px] flex-shrink-0 mt-0.5">🛒</span>
                    <p className="text-[12px] leading-[18px] text-light-text">When a buyer pays for your item, the funds are held in escrow</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-[15px] flex-shrink-0 mt-0.5">⏱</span>
                    <p className="text-[12px] leading-[18px] text-light-text">Funds are released to you after 7 days, or when the buyer confirms delivery — whichever comes first</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-[15px] flex-shrink-0 mt-0.5">💰</span>
                    <p className="text-[12px] leading-[18px] text-light-text">Released funds appear in your available balance and can be withdrawn</p>
                  </div>
                </div>
              </>
            ) : tab === "earnings" ? (
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
                    <p className="text-[12px] font-bold uppercase tracking-[0.4px] text-text">Your activity</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-light-text flex-1">Qualified views ({qualifiedViews.toLocaleString()} so far)</span>
                      <span className="text-[12px] font-bold text-text">₦{lifetimeEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-light-text flex-1">Supreme welcome bonus</span>
                      <span className="text-[12px] font-bold text-text">₦0.00</span>
                    </div>
                  </div>
                )}

                {/* How earning works */}
                <div className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                  <p className="text-[12px] font-bold uppercase tracking-[0.4px] text-text">How earning works</p>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-lg flex-shrink-0 ${isSupreme ? "text-green-500" : "text-light-text"}`}>{isSupreme ? "✓" : "○"}</span>
                    <p className="text-[12px] leading-[18px] text-light-text">Reach Supreme, the top rank, to unlock a one-time welcome bonus</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg flex-shrink-0 text-light-text">○</span>
                    <p className="text-[12px] leading-[18px] text-light-text">
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
                  <p className="text-[12px] font-bold uppercase tracking-[0.4px] text-text">What Credits are for</p>
                  <div className="flex items-center gap-2.5">
                    <IoRocketOutline size={18} className="flex-shrink-0 text-light-text" />
                    <p className="text-[12px] leading-[18px] text-light-text">Spend Credits to Boost your posts and reach more people</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex-shrink-0 text-[13px] text-light-text">🏷</span>
                    <p className="text-[12px] leading-[18px] text-light-text">1 Twedot Credit = ₦1.5</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Pinned footer links ── */}
          <div className="border-t border-border px-4 py-3 space-y-2">
            {tab === "sales" ? (
              <>
                <button onClick={() => router.push("/inventory")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <IoStorefrontOutline size={18} className="flex-shrink-0 text-primary" />
                  <span className="flex-1 text-[12px] font-semibold text-text">My Inventory — manage your listings</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <a href="https://about.twedot.com/withdraw-earnings" target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[15px]">🌐</span>
                  <span className="flex-1 text-[12px] font-semibold text-text">Learn how Sales &amp; Escrow work</span>
                  <IoOpenOutline size={16} className="flex-shrink-0 text-light-text" />
                </a>
              </>
            ) : tab === "earnings" ? (
              <>
                <button onClick={() => router.push("/analytics")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <IoDiamondOutline size={18} className="flex-shrink-0 text-primary" />
                  <span className="flex-1 text-[12px] font-semibold text-text">Content Monetization — earnings breakdown</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <button onClick={() => router.push("/analytics")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[15px]">📊</span>
                  <span className="flex-1 text-[12px] font-semibold text-text">Analytics — views, engagement &amp; jobs</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <a href="https://about.twedot.com/withdraw-earnings" target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[15px]">🌐</span>
                  <span className="flex-1 text-[12px] font-semibold text-text">Learn how Rank &amp; Wallet earnings work</span>
                  <IoOpenOutline size={16} className="flex-shrink-0 text-light-text" />
                </a>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/ads")} className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[15px]">📊</span>
                  <span className="flex-1 text-[12px] font-semibold text-text">Ads Analytics &amp; transaction history</span>
                  <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                </button>
                <a href="https://about.twedot.com/credits" target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors">
                  <span className="flex-shrink-0 text-[15px]">🌐</span>
                  <span className="flex-1 text-[12px] font-semibold text-text">Learn how Twedot Credits &amp; boosting work</span>
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
