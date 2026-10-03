"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoWalletOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoTrendingUpOutline,
  IoImageOutline,
  IoChevronForward,
  IoReceiptOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

type Tab = "credits" | "earnings" | "transactions";

interface CreditBalance { balance: number }
interface Transaction { id: string; type: string; amount: number; description: string; created_at: string }
interface EarningsStats { total_earned: number; this_month: number; last_month: number; pending: number }
interface TopPost { id: string; caption?: string; thumbnail_url?: string; earned: number }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return (n ?? 0).toFixed(2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "credits", label: "Twedot Credits", icon: IoWalletOutline },
  { id: "earnings", label: "Earnings", icon: IoTrendingUpOutline },
  { id: "transactions", label: "Transactions", icon: IoReceiptOutline },
];

export default function WalletPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("credits");
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [earnings, setEarnings] = useState<EarningsStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      apiGet<CreditBalance>("/credits/balance").catch(() => null),
      apiGet<EarningsStats>("/wallet/earnings/stats").catch(() => null),
      apiGet<Transaction[]>("/credits/transactions").catch(() => []),
      apiGet<TopPost[]>("/wallet/earnings/top-posts").catch(() => []),
    ]).then(([b, e, t, p]) => {
      setBalance(b);
      setEarnings(e);
      setTransactions(Array.isArray(t) ? t : []);
      setTopPosts(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left: tab list ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Wallet</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  active ? "bg-feed-bg" : "hover:bg-feed-bg/60"
                }`}
              >
                <Icon size={17} className={`flex-shrink-0 ${active ? "text-primary" : "text-light-text"}`} />
                <span className={`flex-1 text-[13px] font-medium ${active ? "text-primary" : "text-text"}`}>{label}</span>
                <IoChevronForward size={13} className={`flex-shrink-0 ${active ? "text-primary" : "text-light-text"}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">

          {/* ── Credits tab ── */}
          {tab === "credits" && (
            <div className="px-5 py-5">
              {/* Credit card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6b4eff] to-[#3d2a99] p-6 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-10 -left-4 h-40 w-40 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IoWalletOutline size={18} className="text-white/70" />
                      <p className="text-[12px] font-medium text-white/70 uppercase tracking-widest">Twedot Credits</p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                      <span className="text-[13px] font-extrabold">T</span>
                    </div>
                  </div>
                  <p className="mt-4 text-[38px] font-extrabold leading-none">
                    {loading ? "—" : Math.floor(balance?.balance ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-[13px] text-white/60">Available balance</p>
                  <div className="mt-5 flex gap-3">
                    <button className="flex-1 rounded-xl bg-white/20 py-2.5 text-[13px] font-semibold text-white hover:bg-white/30 transition-colors">
                      Add Credits
                    </button>
                    <button className="flex-1 rounded-xl bg-white/20 py-2.5 text-[13px] font-semibold text-white hover:bg-white/30 transition-colors">
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <p className="mt-6 mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Recent Activity</p>
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-feed-bg" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <IoWalletOutline size={28} className="text-light-text" />
                  <p className="text-[13px] text-light-text">No transactions yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {transactions.slice(0, 5).map((tx) => {
                    const isIn = tx.type === "credit" || tx.type === "earn" || tx.type === "purchase";
                    return (
                      <div key={tx.id} className="flex items-center gap-3 px-1 py-3 border-b border-border last:border-0">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isIn ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          {isIn ? <IoArrowDownOutline size={15} className="text-green-500" /> : <IoArrowUpOutline size={15} className="text-red-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-text">{tx.description}</p>
                          <p className="text-[11px] text-light-text">{timeAgo(tx.created_at)}</p>
                        </div>
                        <span className={`text-[13px] font-bold ${isIn ? "text-green-500" : "text-red-400"}`}>
                          {isIn ? "+" : "-"}{tx.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Earnings tab ── */}
          {tab === "earnings" && (
            <div className="px-5 py-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Overview</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Total Earned", value: `$${fmt(earnings?.total_earned ?? 0)}` },
                  { label: "This Month", value: `$${fmt(earnings?.this_month ?? 0)}` },
                  { label: "Last Month", value: `$${fmt(earnings?.last_month ?? 0)}` },
                  { label: "Pending", value: `$${fmt(earnings?.pending ?? 0)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border p-4">
                    <p className="text-[11px] text-light-text">{label}</p>
                    <p className="mt-1 text-[20px] font-bold text-text">{loading ? "—" : value}</p>
                  </div>
                ))}
              </div>

              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Top Earning Posts</p>
              {loading ? (
                <div className="flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="h-14 animate-pulse rounded-xl bg-feed-bg"/>)}</div>
              ) : topPosts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <IoStatsChartOutline size={26} className="text-light-text" />
                  <p className="text-[13px] text-light-text">No earnings data yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {topPosts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <span className="w-5 text-center text-[12px] font-bold text-light-text">{i + 1}</span>
                      {p.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-feed-bg">
                          <IoImageOutline size={16} className="text-light-text" />
                        </div>
                      )}
                      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{p.caption ?? "Post"}</p>
                      <span className="text-[13px] font-bold text-green-500">${fmt(p.earned)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Transactions tab ── */}
          {tab === "transactions" && (
            <div className="px-5 py-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">All Transactions</p>
              {loading ? (
                <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i=><div key={i} className="h-14 animate-pulse rounded-xl bg-feed-bg"/>)}</div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <IoReceiptOutline size={28} className="text-light-text" />
                  <p className="text-[13px] font-semibold text-text">No transactions yet</p>
                  <p className="text-[12px] text-light-text">Your credit history will appear here</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {transactions.map((tx) => {
                    const isIn = tx.type === "credit" || tx.type === "earn" || tx.type === "purchase";
                    return (
                      <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isIn ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          {isIn ? <IoArrowDownOutline size={15} className="text-green-500" /> : <IoArrowUpOutline size={15} className="text-red-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-text">{tx.description}</p>
                          <p className="text-[11px] text-light-text">{timeAgo(tx.created_at)}</p>
                        </div>
                        <span className={`text-[13px] font-bold ${isIn ? "text-green-500" : "text-red-400"}`}>
                          {isIn ? "+" : "-"}{tx.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
