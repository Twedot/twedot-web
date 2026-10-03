"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoStatsChartOutline,
  IoEyeOutline,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoTrendingUpOutline,
  IoMegaphoneOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

interface BoostStats {
  total_boosts: number;
  active_boosts: number;
  total_impressions: number;
  total_clicks: number;
  total_reach?: number;
}
interface GrowthPoint { date: string; value: number }
interface BoostGrowth { impressions?: GrowthPoint[]; clicks?: GrowthPoint[] }
interface EarningsStats { total_earned: number; this_month: number }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

function MiniBar({ data, color = "#6b4eff" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-12 items-end gap-0.5">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: `${Math.max(4, (v / max) * 48)}px`, backgroundColor: color, opacity: 0.7 + 0.3 * (i / data.length) }}
        />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
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

  const statCards = [
    { label: "Impressions", value: fmt(boostStats?.total_impressions ?? 0), icon: IoEyeOutline, color: "text-blue-400" },
    { label: "Clicks", value: fmt(boostStats?.total_clicks ?? 0), icon: IoTrendingUpOutline, color: "text-green-400" },
    { label: "Active Boosts", value: fmt(boostStats?.active_boosts ?? 0), icon: IoMegaphoneOutline, color: "text-primary" },
    { label: "Earned", value: `$${(earnings?.total_earned ?? 0).toFixed(2)}`, icon: IoStatsChartOutline, color: "text-yellow-400" },
  ];

  return (
    <div className="flex flex-col pb-16">
      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <h1 className="text-[20px] font-bold text-text">Analytics</h1>
        <p className="mt-0.5 text-[13px] text-light-text">Your reach and performance</p>
      </div>

      {/* Profile summary */}
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-feed-bg px-4 py-3">
        {user?.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <IoPersonOutline size={18} className="text-primary" />
          </div>
        )}
        <div>
          <p className="text-[14px] font-semibold text-text">{user?.name ?? "You"}</p>
          <p className="text-[12px] text-light-text">{user?.occupation ?? "Creator"}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[16px] font-bold text-text">{fmt(user?.follower_count ?? 0)}</p>
          <p className="text-[11px] text-light-text">Followers</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-feed-bg p-4">
            <Icon size={20} className={color} />
            <p className="mt-2 text-[22px] font-bold text-text">{loading ? "—" : value}</p>
            <p className="text-[12px] text-light-text">{label}</p>
          </div>
        ))}
      </div>

      {/* Impressions chart */}
      {impressionData.length > 0 && (
        <div className="mx-4 mt-4 rounded-2xl bg-feed-bg p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text">Impressions (14d)</p>
            <span className="text-[12px] text-light-text">{fmt(boostStats?.total_impressions ?? 0)} total</span>
          </div>
          <MiniBar data={impressionData} color="#6b4eff" />
        </div>
      )}

      {/* Clicks chart */}
      {clickData.length > 0 && (
        <div className="mx-4 mt-3 rounded-2xl bg-feed-bg p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text">Clicks (14d)</p>
            <span className="text-[12px] text-light-text">{fmt(boostStats?.total_clicks ?? 0)} total</span>
          </div>
          <MiniBar data={clickData} color="#22c55e" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !boostStats?.total_boosts && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-feed-bg">
            <IoStatsChartOutline size={26} className="text-light-text" />
          </div>
          <p className="text-[14px] font-semibold text-text">No data yet</p>
          <p className="text-[12px] text-light-text">Boost your posts to start seeing analytics</p>
          <button onClick={() => router.push("/ads")} className="mt-1 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white">
            Create a Boost
          </button>
        </div>
      )}
    </div>
  );
}
