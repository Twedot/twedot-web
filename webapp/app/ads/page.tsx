"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoMegaphoneOutline,
  IoEyeOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoChevronForward,
  IoStatsChartOutline,
  IoAddOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

type Tab = "overview" | "boosts";

interface BoostStats { total_boosts: number; active_boosts: number; total_impressions: number; total_clicks: number }
interface Boost { id: string; status: string; impressions: number; clicks: number; budget: number; created_at: string; status_caption?: string; status_thumbnail_url?: string }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: IoStatsChartOutline },
  { id: "boosts", label: "My Boosts", icon: IoMegaphoneOutline },
];

const STATUS_COLOR: Record<string, string> = {
  active: "text-green-500", completed: "text-light-text",
  cancelled: "text-red-400", pending: "text-yellow-500",
};
const STATUS_ICON: Record<string, React.ElementType> = {
  active: IoCheckmarkCircleOutline, completed: IoCheckmarkCircleOutline,
  cancelled: IoCloseCircleOutline, pending: IoTimeOutline,
};

export default function AdsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<BoostStats | null>(null);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      apiGet<BoostStats>("/boost/my-stats").catch(() => null),
      apiGet<Boost[]>("/boost/mine").catch(() => []),
    ]).then(([s, b]) => {
      setStats(s);
      setBoosts(Array.isArray(b) ? b : []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Ads & Boosts</h1>
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
        <div className="border-t border-border p-3">
          <button
            onClick={() => router.push("/stories")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90"
          >
            <IoAddOutline size={16} /> Boost a Post
          </button>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">{TABS.find(t => t.id === tab)?.label}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {tab === "overview" && (
            <>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Performance</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Total Boosts", value: fmt(stats?.total_boosts ?? 0), icon: IoMegaphoneOutline },
                  { label: "Active", value: fmt(stats?.active_boosts ?? 0), icon: IoCheckmarkCircleOutline },
                  { label: "Impressions", value: fmt(stats?.total_impressions ?? 0), icon: IoEyeOutline },
                  { label: "Clicks", value: fmt(stats?.total_clicks ?? 0), icon: IoTrendingUpOutline },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border p-4">
                    <Icon size={18} className="text-primary" />
                    <p className="mt-2 text-[22px] font-bold text-text">{loading ? "—" : value}</p>
                    <p className="text-[11px] text-light-text">{label}</p>
                  </div>
                ))}
              </div>
              {!loading && !stats?.total_boosts && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <IoMegaphoneOutline size={28} className="text-light-text" />
                  <p className="text-[13px] font-semibold text-text">No boosts yet</p>
                  <p className="text-[12px] text-light-text">Boost a post from your feed to get started</p>
                </div>
              )}
            </>
          )}

          {tab === "boosts" && (
            <>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">All Boosts</p>
              {loading ? (
                <div className="flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="h-16 animate-pulse rounded-xl bg-feed-bg"/>)}</div>
              ) : boosts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <IoMegaphoneOutline size={28} className="text-light-text" />
                  <p className="text-[13px] font-semibold text-text">No boosts yet</p>
                  <p className="text-[12px] text-light-text">Your active and past boosts will appear here</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {boosts.map((b) => {
                    const Icon = STATUS_ICON[b.status] ?? IoMegaphoneOutline;
                    return (
                      <div key={b.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                        {b.status_thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.status_thumbnail_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <IoMegaphoneOutline size={18} className="text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-text">{b.status_caption ?? "Post boost"}</p>
                          <p className="text-[11px] text-light-text">{fmt(b.impressions)} imp · {fmt(b.clicks)} clicks · {daysAgo(b.created_at)}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[11px] font-semibold ${STATUS_COLOR[b.status] ?? "text-light-text"}`}>
                          <Icon size={12} />{b.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
