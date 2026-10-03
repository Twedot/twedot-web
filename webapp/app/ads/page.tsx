"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronDown, IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

type Tab = "overview" | "reports" | "insights";

const PERIOD_OPTIONS = [7, 14, 28, 30, 60, 90];
const STATUS_COLOR: Record<string, string> = { active: "#23a55a", completed: "#8a8a8a", cancelled: "#FF3B30" };

interface BoostStats {
  totalBoosts: number; activeBoosts: number; totalCreditsSpent: number;
  totalReachMin: number; totalReachMax: number;
}
interface Boost {
  id: string; statusId: string; durationDays: number; audienceType: string;
  costCredits: number; status: "active" | "completed" | "cancelled";
  createdAt: string; estimatedImpressionsMin: number; estimatedImpressionsMax: number;
}
type GrowthPoint = { day: string; count: number };

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n ?? 0);
}
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "today";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
function splitForDelta(series: GrowthPoint[], days: number) {
  const total = series.length;
  const current = series.slice(Math.max(0, total - days));
  const previous = series.slice(Math.max(0, total - days * 2), Math.max(0, total - days));
  const currentSum = current.reduce((s, p) => s + p.count, 0);
  const previousSum = previous.reduce((s, p) => s + p.count, 0);
  const deltaPct = previousSum === 0 ? (currentSum > 0 ? 100 : 0) : Math.round(((currentSum - previousSum) / previousSum) * 1000) / 10;
  return { current, currentSum, previousSum, deltaPct };
}

function LineChart({ data, color = "#6B4EFF" }: { data: GrowthPoint[]; color?: string }) {
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
  const path = pts.join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px]" preserveAspectRatio="none">
      <polyline points={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HighlightCard({ label, value, deltaPct }: { label: string; value: string; deltaPct?: number }) {
  const hasDelta = deltaPct != null;
  const isUp = (deltaPct ?? 0) >= 0;
  return (
    <div className="w-[48%] mb-2.5 rounded-[10px] border border-border bg-feed-bg p-[14px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3px] text-light-text">{label}</p>
      <p className="mt-1 text-[19px] font-extrabold text-text">{value}</p>
      {hasDelta && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="text-[10px]">{isUp ? "▲" : "▼"}</span>
          <span className="text-[11.5px] font-bold" style={{ color: isUp ? "#23a55a" : "#ef4444" }}>{Math.abs(deltaPct!)}%</span>
        </div>
      )}
    </div>
  );
}

function PeriodDropdown({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative mb-5 self-start">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-feed-bg px-3 py-2 text-[12px] font-bold tracking-[0.3px] text-text"
      >
        LAST {days} DAYS <IoChevronDown size={14} className="text-light-text" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-[var(--card,#fff)] shadow-lg">
          {PERIOD_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => { onChange(d); setOpen(false); }}
              className={`flex w-full items-center justify-between px-4 py-3 text-[14px] font-semibold text-text hover:bg-feed-bg ${d === days ? "text-primary" : ""}`}
            >
              Last {d} days
              {d === days && <IoCheckmark size={18} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<BoostStats | null>(null);
  const [recentBoosts, setRecentBoosts] = useState<Boost[]>([]);
  const [overviewDays, setOverviewDays] = useState(28);
  const [reportsDays, setReportsDays] = useState(90);
  const [adsSeries, setAdsSeries] = useState<GrowthPoint[]>([]);
  const [txnSeries, setTxnSeries] = useState<GrowthPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const activeDays = tab === "reports" ? reportsDays : overviewDays;

  const loadSeries = (days: number) => {
    const fd = Math.min(90, days * 2);
    Promise.all([
      apiGet<GrowthPoint[]>(`/boost/my-growth?days=${fd}`).catch(() => []),
      apiGet<GrowthPoint[]>(`/credits/growth?days=${fd}`).catch(() => []),
    ]).then(([ag, tg]) => {
      setAdsSeries(Array.isArray(ag) ? ag : []);
      setTxnSeries(Array.isArray(tg) ? tg : []);
    });
  };

  const loadStats = () =>
    Promise.all([
      apiGet<BoostStats>("/boost/my-stats").catch(() => null),
      apiGet<{ items: Boost[] }>("/boost/mine?page=1&limit=10").catch(() => null),
    ]).then(([s, mine]) => {
      setStats(s);
      setRecentBoosts(mine?.items ?? []);
    });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadStats().finally(() => setLoading(false));
    loadSeries(overviewDays);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSeries(activeDays);
  }, [activeDays]); // eslint-disable-line react-hooks/exhaustive-deps

  const adsDelta = useMemo(() => splitForDelta(adsSeries, activeDays), [adsSeries, activeDays]);
  const txnDelta = useMemo(() => splitForDelta(txnSeries, activeDays), [txnSeries, activeDays]);

  const handleCancelBoost = async (boost: Boost) => {
    if (!confirm("Cancel this boost? The unused portion will be refunded to your Twedot Credits balance.")) return;
    setCancellingId(boost.id);
    try {
      const result = await apiPost<{ refundCredits?: number }>(`/boost/${boost.id}/cancel`, {});
      notify(result?.refundCredits ? `Boost cancelled — ${result.refundCredits} Credits refunded` : "Boost cancelled");
      loadStats();
    } catch { notify("Could not cancel this boost"); }
    finally { setCancellingId(null); }
  };

  const insights = useMemo(() => {
    const rows: { title: string; sub: string; tag?: { text: string; color: string } }[] = [];
    if (!stats) return rows;
    if (stats.activeBoosts > 0) rows.push({ title: `You have ${stats.activeBoosts} active boost${stats.activeBoosts === 1 ? "" : "s"} running right now`, sub: "Reaching people while it stays active" });
    if (adsDelta.previousSum > 0 || adsDelta.currentSum > 0) {
      const up = adsDelta.deltaPct >= 0;
      rows.push({ title: `Your ad spend is ${up ? "higher" : "lower"} than the previous ${activeDays} days`, sub: `${adsDelta.currentSum.toLocaleString()} Credits this period vs ${adsDelta.previousSum.toLocaleString()} before`, tag: { text: `${up ? "+" : ""}${adsDelta.deltaPct}%`, color: up ? "#23a55a" : "#ef4444" } });
    }
    const peak = adsDelta.current.reduce((max, p) => (p.count > (max?.count ?? -1) ? p : max), null as GrowthPoint | null);
    if (peak && peak.count > 0) rows.push({ title: `Your highest ad spend day was ${new Date(peak.day).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`, sub: `${peak.count.toLocaleString()} Credits spent that day`, tag: { text: "PEAK", color: "#f97316" } });
    if (stats.totalBoosts > 0) rows.push({ title: `Your boosts cost an average of ${Math.round(stats.totalCreditsSpent / stats.totalBoosts).toLocaleString()} Credits each`, sub: `Across ${stats.totalBoosts} boost${stats.totalBoosts === 1 ? "" : "s"} all-time` });
    if (rows.length === 0) rows.push({ title: "No insights yet", sub: "Boost a post to start seeing performance insights here" });
    return rows;
  }, [stats, adsDelta, activeDays]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[280px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Ads Analytics</h1>
        </div>
        <div className="border-b border-border flex">
          {(["overview", "reports", "insights"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.3px] transition-colors ${tab === t ? "text-primary" : "text-light-text"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-primary" />}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-[12px] text-light-text">
          {tab !== "insights" && (
            <p className="font-semibold">Period: <span className="text-text font-bold">{tab === "reports" ? reportsDays : overviewDays} days</span></p>
          )}
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text capitalize">{tab}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-wrap gap-[4%]">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="mb-2.5 h-[80px] w-[48%] animate-pulse rounded-xl bg-feed-bg" />)}
            </div>
          ) : tab === "overview" ? (
            <>
              <PeriodDropdown days={overviewDays} onChange={setOverviewDays} />
              <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.4px] text-light-text">Highlights</p>
              <div className="flex flex-wrap justify-between">
                <HighlightCard label="Credits Spent" value={fmt(adsDelta.currentSum)} deltaPct={adsDelta.deltaPct} />
                <HighlightCard label="Credits Moved" value={fmt(txnDelta.currentSum)} deltaPct={txnDelta.deltaPct} />
                <HighlightCard label="Total Boosts" value={String(stats?.totalBoosts ?? 0)} />
                <HighlightCard label="Active Now" value={String(stats?.activeBoosts ?? 0)} />
                <HighlightCard label="Reach Delivered" value={`${fmt(stats?.totalReachMin ?? 0)}–${fmt(stats?.totalReachMax ?? 0)}`} />
                <HighlightCard label="Avg Cost / Boost" value={stats?.totalBoosts ? fmt(Math.round((stats.totalCreditsSpent ?? 0) / stats.totalBoosts)) : "0"} />
              </div>
              <p className="mt-6 mb-2.5 text-[12px] font-bold uppercase tracking-[0.4px] text-light-text">Growth Metrics</p>
              {adsDelta.current.length > 0 && (
                <div className="rounded-xl border border-border bg-feed-bg p-[14px]">
                  <p className="text-[24px] font-extrabold text-text">{adsDelta.currentSum.toLocaleString()} <span className="text-[13px] font-semibold">Credits</span></p>
                  <p className="mt-0.5 mb-2.5 text-[12px] font-semibold text-light-text">Ad spend — last {overviewDays} days</p>
                  <LineChart data={adsDelta.current} color="#6B4EFF" />
                </div>
              )}
            </>
          ) : tab === "reports" ? (
            <>
              <PeriodDropdown days={reportsDays} onChange={setReportsDays} />
              <div className="flex flex-wrap justify-between mb-4">
                <HighlightCard label="Credits Spent" value={fmt(adsDelta.currentSum)} deltaPct={adsDelta.deltaPct} />
                <HighlightCard label="Credits Moved" value={fmt(txnDelta.currentSum)} deltaPct={txnDelta.deltaPct} />
                <HighlightCard label="Total Boosts" value={String(stats?.totalBoosts ?? 0)} />
              </div>
              {adsDelta.current.length > 0 && (
                <div className="rounded-xl border border-border bg-feed-bg p-[14px] mb-4">
                  <p className="mb-1.5 text-[13px] font-bold uppercase tracking-[0.3px] text-light-text">Ad Spend</p>
                  <p className="text-[24px] font-extrabold text-text">{adsDelta.currentSum.toLocaleString()} <span className="text-[13px] font-semibold">Total Credits</span></p>
                  <LineChart data={adsDelta.current} color="#6B4EFF" />
                </div>
              )}
              {txnDelta.current.length > 0 && (
                <div className="rounded-xl border border-border bg-feed-bg p-[14px] mb-4">
                  <p className="mb-1.5 text-[13px] font-bold uppercase tracking-[0.3px] text-light-text">Transaction Volume</p>
                  <p className="text-[24px] font-extrabold text-text">{txnDelta.currentSum.toLocaleString()} <span className="text-[13px] font-semibold">Credits Moved</span></p>
                  <LineChart data={txnDelta.current} color="#3b82f6" />
                </div>
              )}
              {recentBoosts.length > 0 && (
                <>
                  <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.4px] text-light-text">Recent Boosts</p>
                  <div className="rounded-[10px] border border-border overflow-hidden">
                    {recentBoosts.map((b, i) => (
                      <div key={b.id} className={`flex items-center justify-between px-[14px] py-3 ${i < recentBoosts.length - 1 ? "border-b border-border" : ""}`}>
                        <div>
                          <p className="text-[13.5px] font-semibold text-text">{b.costCredits.toLocaleString()} Credits · {b.durationDays}d · {b.audienceType}</p>
                          <p className="mt-0.5 text-[11.5px] text-light-text">{timeAgo(b.createdAt)}</p>
                        </div>
                        {b.status === "active" ? (
                          <button
                            onClick={() => handleCancelBoost(b)}
                            disabled={cancellingId === b.id}
                            className="rounded-md border border-red-400 px-2.5 py-1.5 text-[11.5px] font-bold text-red-400 hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancellingId === b.id ? "…" : "Cancel"}
                          </button>
                        ) : (
                          <span className="rounded-md px-2 py-1 text-[11px] font-bold capitalize" style={{ color: STATUS_COLOR[b.status] ?? "#8a8a8a", backgroundColor: (STATUS_COLOR[b.status] ?? "#8a8a8a") + "22" }}>{b.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {insights.map((row, i) => (
                <div key={i} className="border-b border-border py-4">
                  <p className="text-[14.5px] font-bold leading-5 text-text">{row.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="flex-1 text-[12.5px] text-light-text">{row.sub}</p>
                    {row.tag && (
                      <span className="rounded-md px-2 py-1 text-[11px] font-extrabold" style={{ color: row.tag.color, backgroundColor: row.tag.color + "22" }}>{row.tag.text}</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
