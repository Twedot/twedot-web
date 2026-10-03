"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoStatsChartOutline,
  IoEyeOutline,
  IoTrendingUpOutline,
  IoMegaphoneOutline,
  IoPersonOutline,
  IoChevronForward,
  IoPulseOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

type Tab = "performance" | "growth";

interface BoostStats { total_boosts: number; active_boosts: number; total_impressions: number; total_clicks: number }
interface GrowthPoint { date: string; value: number }
interface BoostGrowth { impressions?: GrowthPoint[]; clicks?: GrowthPoint[] }
interface EarningsStats { total_earned: number; this_month: number }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

function BarChart({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data, 1);
  const dates = data.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (data.length - 1 - i));
    return d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
  });
  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">{label}</p>
      <div className="flex items-end gap-1 h-20">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm transition-all"
              style={{ height: `${Math.max(3, (v / max) * 64)}px`, backgroundColor: color }}
            />
            <span className="text-[9px] text-light-text">{dates[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "performance", label: "Performance", icon: IoStatsChartOutline },
  { id: "growth", label: "Growth", icon: IoPulseOutline },
];

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("performance");
  const [boostStats, setBoostStats] = useState<BoostStats | null>(null);
  const [growth, setGrowth] = useState<BoostGrowth | null>(null);
  const [earnings, setEarnings] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      apiGet<BoostStats>("/boost/my-stats").catch(() => null),
      apiGet<BoostGrowth>("/boost/my-growth").catch(() => null),
      apiGet<EarningsStats>("/wallet/earnings/stats").catch(() => null),
    ]).then(([bs, g, e]) => {
      setBoostStats(bs);
      setGrowth(g);
      setEarnings(e);
      setLoading(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const impressionData = growth?.impressions?.slice(-14).map((p) => p.value) ?? [];
  const clickData = growth?.clicks?.slice(-14).map((p) => p.value) ?? [];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Analytics</h1>
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

        {/* Profile summary */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2.5">
            {user?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <IoPersonOutline size={14} className="text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-text">{user?.name ?? "You"}</p>
              <p className="text-[10px] text-light-text">{fmt(user?.follower_count ?? 0)} followers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">{TABS.find(t => t.id === tab)?.label}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {tab === "performance" && (
            <>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Boost Stats</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Impressions", value: fmt(boostStats?.total_impressions ?? 0), icon: IoEyeOutline },
                  { label: "Clicks", value: fmt(boostStats?.total_clicks ?? 0), icon: IoTrendingUpOutline },
                  { label: "Active Boosts", value: fmt(boostStats?.active_boosts ?? 0), icon: IoMegaphoneOutline },
                  { label: "Earned (mo.)", value: `$${(earnings?.this_month ?? 0).toFixed(2)}`, icon: IoStatsChartOutline },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border p-4">
                    <Icon size={18} className="text-primary" />
                    <p className="mt-2 text-[22px] font-bold text-text">{loading ? "—" : value}</p>
                    <p className="text-[11px] text-light-text">{label}</p>
                  </div>
                ))}
              </div>
              {!loading && !boostStats?.total_boosts && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <IoStatsChartOutline size={28} className="text-light-text" />
                  <p className="text-[13px] font-semibold text-text">No data yet</p>
                  <p className="text-[12px] text-light-text">Boost posts to start seeing analytics</p>
                  <button onClick={() => router.push("/ads")} className="mt-1 rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-white">
                    Create a Boost
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "growth" && (
            <>
              {impressionData.length > 0 ? (
                <div className="flex flex-col gap-6">
                  <BarChart data={impressionData} label="Impressions (14 days)" color="#6b4eff" />
                  {clickData.length > 0 && (
                    <BarChart data={clickData} label="Clicks (14 days)" color="#22c55e" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <IoPulseOutline size={28} className="text-light-text" />
                  <p className="text-[13px] font-semibold text-text">No growth data yet</p>
                  <p className="text-[12px] text-light-text">Growth charts appear once you have active boosts</p>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
