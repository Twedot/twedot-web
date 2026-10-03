"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoWalletOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoTrendingUpOutline,
  IoImageOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

interface CreditBalance { balance: number; currency: string }
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
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function WalletPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
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
      setTransactions(Array.isArray(t) ? t.slice(0, 10) : []);
      setTopPosts(Array.isArray(p) ? p.slice(0, 5) : []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const txIcon = (type: string) =>
    type === "credit" || type === "earn" ? (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
        <IoArrowDownOutline size={14} className="text-green-500" />
      </div>
    ) : (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
        <IoArrowUpOutline size={14} className="text-red-400" />
      </div>
    );

  return (
    <div className="flex flex-col pb-16">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-[20px] font-bold text-text">Wallet</h1>
        <p className="mt-0.5 text-[13px] text-light-text">Your credits and earnings</p>
      </div>

      {/* Balance card */}
      <div className="mx-4 mt-4 rounded-2xl bg-primary p-6">
        <div className="flex items-center gap-2">
          <IoWalletOutline size={18} className="text-white/70" />
          <p className="text-[13px] font-medium text-white/70">Available Balance</p>
        </div>
        <p className="mt-2 text-[36px] font-bold text-white">
          {loading ? "—" : `${balance?.balance?.toFixed(0) ?? 0}`}
          <span className="ml-1.5 text-[16px] font-medium text-white/70">credits</span>
        </p>
        <div className="mt-4 flex gap-3">
          <button className="flex-1 rounded-xl bg-white/20 py-2.5 text-[13px] font-semibold text-white hover:bg-white/30">
            Add Credits
          </button>
          <button className="flex-1 rounded-xl bg-white/20 py-2.5 text-[13px] font-semibold text-white hover:bg-white/30">
            Withdraw
          </button>
        </div>
      </div>

      {/* Earnings stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-4">
        {[
          { label: "Total Earned", value: `$${fmt(earnings?.total_earned ?? 0)}` },
          { label: "This Month", value: `$${fmt(earnings?.this_month ?? 0)}` },
          { label: "Last Month", value: `$${fmt(earnings?.last_month ?? 0)}` },
          { label: "Pending", value: `$${fmt(earnings?.pending ?? 0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-feed-bg p-4">
            <p className="text-[11px] text-light-text uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-[18px] font-bold text-text">{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Top earning posts */}
      {topPosts.length > 0 && (
        <div className="mt-5 px-4">
          <p className="mb-3 text-[13px] font-semibold text-light-text uppercase tracking-wide">Top Earning Posts</p>
          <div className="flex flex-col gap-3">
            {topPosts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-feed-bg p-3">
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt="" className="h-11 w-11 flex-shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <IoImageOutline size={18} className="text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text">{p.caption ?? "Post"}</p>
                </div>
                <div className="flex items-center gap-1 text-[13px] font-bold text-green-500">
                  <IoTrendingUpOutline size={14} />
                  ${fmt(p.earned)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="mt-5 px-4">
        <p className="mb-3 text-[13px] font-semibold text-light-text uppercase tracking-wide">Recent Transactions</p>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-feed-bg" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <IoWalletOutline size={28} className="text-light-text" />
            <p className="text-[13px] text-light-text">No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-2xl bg-feed-bg px-4 py-3">
                {txIcon(tx.type)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text">{tx.description}</p>
                  <p className="text-[11px] text-light-text">{timeAgo(tx.created_at)}</p>
                </div>
                <span className={`text-[13px] font-bold ${tx.type === "credit" || tx.type === "earn" ? "text-green-500" : "text-red-400"}`}>
                  {tx.type === "credit" || tx.type === "earn" ? "+" : "-"}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
