"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoTimeOutline, IoPersonOutline, IoStatsChartOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

type Role = "requester" | "vendor";

interface Booking {
  id: string; serviceRequestId: string; bidId: string;
  requesterId: string; vendorId: string; category: string;
  price: number; mode: string; scheduledAt?: string | null;
  status: string; rating?: number | null; review?: string | null;
  locationLabel?: string | null; createdAt: string;
  requester?: { id: string; name: string | null; profile_photo_url: string | null } | null;
  vendor?: { id: string; name: string | null; profile_photo_url: string | null; occupation: string | null } | null;
}

const isHistoryStatus = (s: string) => s === "finished" || s === "cancelled";

export default function ServiceHistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>("requester");
  const [requesterHistory, setRequesterHistory] = useState<Booking[]>([]);
  const [vendorHistory, setVendorHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    const [mine, vendor] = await Promise.all([
      apiGet<Booking[]>("/bookings/my").catch(() => []),
      apiGet<Booking[]>("/bookings/vendor/my").catch(() => []),
    ]);
    setRequesterHistory((mine ?? []).filter(b => isHistoryStatus(b.status)));
    setVendorHistory((vendor ?? []).filter(b => isHistoryStatus(b.status)));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isAuthenticated, load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!isAuthenticated) return null;

  const data = role === "requester" ? requesterHistory : vendorHistory;
  const totalEarned = vendorHistory.filter(b => b.status === "finished").reduce((s, b) => s + b.price, 0);
  const totalSpent = requesterHistory.filter(b => b.status === "finished").reduce((s, b) => s + b.price, 0);
  const jobsDone = vendorHistory.filter(b => b.status === "finished").length;
  const requestsDone = requesterHistory.filter(b => b.status === "finished").length;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[280px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Service History</h1>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="px-4 pt-4 grid grid-cols-2 gap-2">
            {[
              { label: "Jobs Done", value: String(jobsDone) },
              { label: "Earned", value: `₦${totalEarned.toLocaleString()}` },
              { label: "Requests Done", value: String(requestsDone) },
              { label: "Spent", value: `₦${totalSpent.toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-feed-bg p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3px] text-light-text">{label}</p>
                <p className="mt-1 text-[15px] font-bold text-text">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Role toggle */}
        <div className="flex gap-2 px-4 pt-3 pb-2">
          {(["requester", "vendor"] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-[10px] py-2.5 text-[12px] font-semibold transition-colors ${role === r ? "bg-feed-bg text-primary" : "text-light-text hover:bg-feed-bg/60"}`}
            >
              {r === "requester" ? "Requests I Made" : "Jobs I Did"}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="border-t border-border p-4">
          <button
            onClick={() => router.push("/analytics")}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-feed-bg/60 rounded-lg"
          >
            <IoStatsChartOutline size={17} className="flex-shrink-0 text-light-text" />
            <span className="flex-1 text-[13px] font-medium text-text">Analytics</span>
          </button>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border flex items-center justify-between px-5 py-4">
          <h2 className="text-[15px] font-bold text-text">{role === "requester" ? "Requests I Made" : "Jobs I Did"}</h2>
          <button onClick={handleRefresh} disabled={refreshing} className="text-[12px] text-primary font-semibold disabled:opacity-50">
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[14px] bg-feed-bg p-[14px]">
                  <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-full bg-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-border" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-border" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <IoTimeOutline size={40} className="text-light-text" />
              <p className="text-[13px] text-light-text leading-5 max-w-[220px]">
                {role === "requester" ? "You haven't finished any service requests yet." : "You haven't finished any jobs yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.map(item => {
                const otherParty = role === "requester" ? item.vendor : item.requester;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-[14px] bg-feed-bg p-[14px]">
                    {otherParty?.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={otherParty.profile_photo_url} alt="" className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <IoPersonOutline size={20} className="text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-text">{otherParty?.name ?? "Unknown"}</p>
                      <p className="mt-0.5 text-[12px] text-light-text">{item.category}</p>
                      {role === "requester" && item.rating != null && (
                        <div className="mt-1 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} className={`text-[12px] ${n <= item.rating! ? "text-yellow-400" : "text-border"}`}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[13px] font-bold text-text">₦{item.price.toLocaleString()}</p>
                      <p className={`mt-0.5 text-[11px] font-semibold ${item.status === "cancelled" ? "text-red-400" : "text-light-text"}`}>
                        {item.status === "finished" ? "Finished" : "Cancelled"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
