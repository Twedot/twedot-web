"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoMegaphoneOutline,
  IoEyeOutline,
  IoTrendingUpOutline,
  IoAddOutline,
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost } from "@/lib/api";

interface BoostStat { total_boosts: number; active_boosts: number; total_impressions: number; total_clicks: number }
interface Boost { id: string; status: string; impressions: number; clicks: number; budget: number; created_at: string; status_caption?: string; status_thumbnail_url?: string }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
}

export default function AdsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<BoostStat | null>(null);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      apiGet<BoostStat>("/boost/my-stats").catch(() => null),
      apiGet<Boost[]>("/boost/mine").catch(() => []),
    ]).then(([s, b]) => {
      setStats(s);
      setBoosts(Array.isArray(b) ? b : []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const statCards = [
    { label: "Total Boosts", value: fmt(stats?.total_boosts ?? 0), icon: IoMegaphoneOutline },
    { label: "Impressions", value: fmt(stats?.total_impressions ?? 0), icon: IoEyeOutline },
    { label: "Clicks", value: fmt(stats?.total_clicks ?? 0), icon: IoTrendingUpOutline },
    { label: "Active", value: fmt(stats?.active_boosts ?? 0), icon: IoCheckmarkCircleOutline },
  ];

  const statusColor: Record<string, string> = {
    active: "text-green-500",
    completed: "text-light-text",
    cancelled: "text-red-400",
    pending: "text-yellow-500",
  };

  const statusIcon: Record<string, React.ElementType> = {
    active: IoCheckmarkCircleOutline,
    completed: IoCheckmarkCircleOutline,
    cancelled: IoCloseCircleOutline,
    pending: IoTimeOutline,
  };

  return (
    <div className="flex flex-col pb-16">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-text">Ads & Boosts</h1>
          <p className="mt-0.5 text-[13px] text-light-text">Promote your posts to reach more people</p>
        </div>
        <button
          onClick={() => router.push("/stories")}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white"
        >
          <IoAddOutline size={16} />
          Boost Post
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-feed-bg p-4">
            <Icon size={20} className="text-primary" />
            <p className="mt-2 text-[22px] font-bold text-text">{loading ? "—" : value}</p>
            <p className="text-[12px] text-light-text">{label}</p>
          </div>
        ))}
      </div>

      {/* Boosts list */}
      <div className="px-4">
        <p className="mb-3 text-[13px] font-semibold text-light-text uppercase tracking-wide">My Boosts</p>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-feed-bg" />
            ))}
          </div>
        ) : boosts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-feed-bg">
              <IoMegaphoneOutline size={26} className="text-light-text" />
            </div>
            <p className="text-[14px] font-semibold text-text">No boosts yet</p>
            <p className="text-[12px] text-light-text">Boost a post to reach a wider audience</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {boosts.map((b) => {
              const Icon = statusIcon[b.status] ?? IoMegaphoneOutline;
              return (
                <div key={b.id} className="flex gap-3 rounded-2xl bg-feed-bg p-4">
                  {b.status_thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.status_thumbnail_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <IoMegaphoneOutline size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[13px] font-semibold text-text">
                        {b.status_caption ?? "Post boost"}
                      </p>
                      <span className={`flex items-center gap-1 text-[11px] font-medium ${statusColor[b.status] ?? "text-light-text"}`}>
                        <Icon size={12} />
                        {b.status}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-4 text-[11px] text-light-text">
                      <span>{fmt(b.impressions)} impressions</span>
                      <span>{fmt(b.clicks)} clicks</span>
                      <span>{timeAgo(b.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
