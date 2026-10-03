"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowUpCircle, IoArrowDownCircle, IoWalletOutline, IoChevronForward } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

const DAY_OPTIONS = [7, 28, 60, 365];

interface Stats {
  postViews: number; profileViews: number; likes: number; comments: number;
  reposts: number; contentPublished: number; jobsCompleted: number;
  amountEarned: number; jobsRequested: number; amountSpent: number;
}
interface AnalyticsResult {
  current: Stats;
  deltaPct: Record<keyof Stats, number>;
}

const CONTENT_KEYS: { key: keyof Stats; label: string }[] = [
  { key: "postViews", label: "Post Views" },
  { key: "profileViews", label: "Profile Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "reposts", label: "Reposts" },
  { key: "contentPublished", label: "Content Published" },
];
const JOB_KEYS: { key: keyof Stats; label: string; money?: boolean }[] = [
  { key: "jobsCompleted", label: "Jobs Completed" },
  { key: "amountEarned", label: "Amount Earned", money: true },
  { key: "jobsRequested", label: "Jobs Requested" },
  { key: "amountSpent", label: "Amount Spent", money: true },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n ?? 0);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function MetricCard({ label, value, deltaPct, money }: { label: string; value: number; deltaPct: number; money?: boolean }) {
  const isUp = deltaPct >= 0;
  const color = isUp ? "#23a55a" : "#ef4444";
  return (
    <div className="w-[48%] mb-2.5 rounded-xl border border-border bg-feed-bg p-[14px]">
      <p className="text-[13.5px] font-semibold text-text">{label}</p>
      <p className="mt-1.5 text-[24px] font-extrabold text-text">{money ? `₦${fmt(value)}` : fmt(value)}</p>
      <div className="mt-1.5 flex items-center gap-1">
        {isUp
          ? <IoArrowUpCircle size={14} color={color} />
          : <IoArrowDownCircle size={14} color={color} />}
        <span className="text-[12.5px] font-bold" style={{ color }}>{isUp ? "+" : ""}{deltaPct}%</span>
      </div>
    </div>
  );
}

function LineChart({ data, color = "#6B4EFF" }: { data: { day: string; count: number }[]; color?: string }) {
  const counts = data.map(d => d.count);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts, 0);
  const range = max - min || 1;
  const W = 480; const H = 80;
  const pts = data.map((d, i) => {
    const x = data.length < 2 ? W / 2 : (i / (data.length - 1)) * W;
    const y = H - ((d.count - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  });
  const path = pts.length > 1 ? `M${pts.join(" L")}` : `M${W / 2},${H / 2}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px]" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState(28);
  const [stats, setStats] = useState<AnalyticsResult | null>(null);
  const [growth, setGrowth] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const load = (d: number) => {
    setLoading(true);
    Promise.all([
      apiGet<AnalyticsResult>(`/status/analytics/stats?days=${d}`).catch(() => null),
      apiGet<{ day: string; count: number }[]>(`/status/analytics/growth?days=${d}`).catch(() => []),
    ]).then(([s, g]) => {
      setStats(s);
      setGrowth(Array.isArray(g) ? g : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    load(days);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDays = (d: number) => {
    setDays(d);
    load(d);
  };

  const rangeLabel = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - days * 86400000);
    return `${fmtDate(from)} - ${fmtDate(now)}`;
  }, [days]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[280px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Analytics</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-light-text">Period</p>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDays(d)}
                className={`rounded-2xl px-3.5 py-[7px] text-[12.5px] font-bold transition-colors ${days === d ? "bg-feed-bg text-primary" : "text-light-text hover:bg-feed-bg/60"}`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-border p-4">
          <button
            onClick={() => router.push("/wallet")}
            className="flex w-full items-center gap-2.5 rounded-[14px] bg-feed-bg p-3.5 text-left hover:bg-feed-bg/70 transition-colors"
          >
            <IoWalletOutline size={18} className="flex-shrink-0 text-primary" />
            <span className="flex-1 text-[13px] font-semibold text-text">View Wallet balance</span>
            <IoChevronForward size={14} className="flex-shrink-0 text-light-text" />
          </button>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">Key metrics</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-wrap gap-[4%]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-2.5 h-[88px] w-[48%] animate-pulse rounded-xl bg-feed-bg" />
              ))}
            </div>
          ) : (
            <>
              <p className="mb-1 text-[12.5px] font-semibold text-light-text">{rangeLabel}</p>

              {/* Content metrics */}
              <div className="flex flex-wrap justify-between">
                {CONTENT_KEYS.map(({ key, label }) => (
                  <MetricCard
                    key={key}
                    label={key === "profileViews" ? `${label} (${days}d)` : label}
                    value={stats?.current[key] ?? 0}
                    deltaPct={stats?.deltaPct[key] ?? 0}
                  />
                ))}
              </div>

              {/* Post Views chart */}
              {growth.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-feed-bg p-[14px]">
                  <p className="mb-2.5 text-[15px] font-extrabold text-text">Post Views</p>
                  <LineChart data={growth} color="#6B4EFF" />
                </div>
              )}

              {/* Bookings section */}
              <p className="mt-6 text-[18px] font-extrabold text-text">Bookings</p>
              <p className="mb-3.5 mt-0.5 text-[12.5px] font-semibold text-light-text">Jobs done for others, and jobs you've requested</p>
              <div className="flex flex-wrap justify-between">
                {JOB_KEYS.map(({ key, label, money }) => (
                  <MetricCard
                    key={key}
                    label={label}
                    value={stats?.current[key] ?? 0}
                    deltaPct={stats?.deltaPct[key] ?? 0}
                    money={money}
                  />
                ))}
              </div>

              {/* Wallet link */}
              <button
                onClick={() => router.push("/wallet")}
                className="mt-4 flex w-full items-center gap-2.5 rounded-[14px] border border-border bg-feed-bg p-4 text-left hover:bg-feed-bg/70 transition-colors"
              >
                <IoWalletOutline size={18} className="flex-shrink-0 text-primary" />
                <span className="flex-1 text-[13.5px] font-semibold text-text">View Wallet balance &amp; history</span>
                <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
