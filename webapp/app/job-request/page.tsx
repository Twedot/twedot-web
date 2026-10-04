"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IoBriefcaseOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoPhonePortraitOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useJobSocket } from "@/lib/jobSocket";

type ServiceRequestStatus = "searching" | "matched" | "cancelled" | "expired";
type ServiceBidStatus = "pending" | "accepted" | "declined" | "withdrawn";
type BookingStatus = "processing" | "ongoing" | "completed" | "paid" | "finished" | "cancelled";
type BookingMode = "now" | "scheduled";

interface ServiceRequest {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterPhoto?: string | null;
  requesterCity?: string | null;
  requesterCountry?: string | null;
  category: string;
  description: string;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  status: ServiceRequestStatus;
  createdAt: string;
  expiresAt: string;
}

interface VendorBid {
  bidId: string;
  price: number;
  message?: string | null;
  bidStatus: ServiceBidStatus;
  bidCreatedAt: string;
  request: ServiceRequest | null;
}

interface Booking {
  id: string;
  serviceRequestId: string;
  bidId: string;
  requesterId: string;
  vendorId: string;
  category: string;
  price: number;
  mode: BookingMode;
  scheduledAt?: string | null;
  status: BookingStatus;
  locationLabel?: string | null;
  createdAt: string;
  requester?: { id: string; name: string | null; profile_photo_url: string | null } | null;
}

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  processing: "Accepted",
  ongoing: "Ongoing",
  completed: "Completed",
  paid: "Paid",
  finished: "Finished",
  cancelled: "Cancelled",
};

const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  processing: "bg-primary/10 text-primary",
  ongoing:    "bg-green-50 text-green-600",
  completed:  "bg-sky-50 text-sky-600",
  paid:       "bg-emerald-50 text-emerald-600",
  finished:   "bg-zinc-100 text-zinc-500",
  cancelled:  "bg-red-50 text-red-500",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function RequesterAvatar({ url, name }: { url?: string | null; name?: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name ?? ""} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
  ) : (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
      <IoPersonOutline size={18} className="text-light-text" />
    </div>
  );
}

function LocationLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <IoLocationOutline size={12} className="flex-shrink-0 text-light-text" />
      <span className="truncate text-[11px] text-light-text">{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-1 text-[10px] font-bold uppercase tracking-widest text-light-text">{children}</p>
  );
}

function ReadOnlyBanner() {
  return (
    <div className="mx-4 mb-4 flex items-start gap-2.5 rounded-xl bg-primary/10 px-4 py-3">
      <IoPhonePortraitOutline size={16} className="mt-0.5 flex-shrink-0 text-primary" />
      <p className="text-[12px] leading-[17px] text-primary">
        <span className="font-semibold">View only.</span> To place bids, accept requests, or manage jobs, open the{" "}
        <span className="font-semibold">Twedot app</span> on your phone.
      </p>
    </div>
  );
}

function RequestCard({ request }: { request: ServiceRequest }) {
  const location = request.locationLabel
    ?? [request.requesterCity, request.requesterCountry].filter(Boolean).join(", ")
    ?? null;

  return (
    <div className="rounded-2xl bg-feed-bg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-3">
        <RequesterAvatar url={request.requesterPhoto} name={request.requesterName} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text">{request.requesterName ?? "Someone"}</p>
          <p className="text-[11px] text-light-text">Looking for · {request.category}</p>
        </div>
        <span className="text-[10px] text-light-text">{timeAgo(request.createdAt)}</span>
      </div>

      {location && <div className="mt-2"><LocationLine label={location} /></div>}

      <p className="mt-2 line-clamp-2 text-[12px] leading-[17px] text-text/80">{request.description}</p>

      {request.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={request.photoUrl}
          alt=""
          className="mt-3 h-32 w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-feed-bg px-3 py-2">
        <IoInformationCircleOutline size={13} className="flex-shrink-0 text-light-text" />
        <p className="text-[11px] text-light-text">Open the Twedot app to place a bid</p>
      </div>
    </div>
  );
}

function BidCard({ bid }: { bid: VendorBid }) {
  const req = bid.request;
  const location = req?.locationLabel
    ?? [req?.requesterCity, req?.requesterCountry].filter(Boolean).join(", ")
    ?? null;

  return (
    <div className="rounded-2xl bg-feed-bg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-3">
        <RequesterAvatar url={req?.requesterPhoto} name={req?.requesterName} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text">{req?.requesterName ?? "Someone"}</p>
          <p className="text-[11px] text-light-text">Looking for · {req?.category}</p>
          <p className="mt-0.5 text-[12px] font-bold text-text">Your bid: ₦{bid.price.toLocaleString()}</p>
        </div>
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">Pending</span>
      </div>

      {location && <div className="mt-2"><LocationLine label={location} /></div>}

      {req?.description && (
        <p className="mt-2 line-clamp-2 text-[12px] leading-[17px] text-text/80">{req.description}</p>
      )}

      {bid.message && (
        <div className="mt-2 rounded-lg border border-border/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-light-text">Your message</p>
          <p className="mt-0.5 text-[12px] text-text">{bid.message}</p>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-2xl bg-feed-bg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-3">
        <RequesterAvatar url={booking.requester?.profile_photo_url} name={booking.requester?.name} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-text">{booking.requester?.name ?? "Someone"}</p>
          <p className="text-[11px] text-light-text">{booking.category}</p>
          <p className="mt-0.5 text-[12px] font-bold text-text">₦{booking.price.toLocaleString()}</p>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${BOOKING_STATUS_COLOR[booking.status]}`}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </span>
      </div>

      {booking.locationLabel && (
        <div className="mt-2"><LocationLine label={booking.locationLabel} /></div>
      )}

      {booking.scheduledAt && (
        <div className="mt-2 flex items-center gap-1.5">
          <IoTimeOutline size={12} className="flex-shrink-0 text-light-text" />
          <span className="text-[11px] text-light-text">
            Scheduled: {new Date(booking.scheduledAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-feed-bg px-3 py-2">
        <IoInformationCircleOutline size={13} className="flex-shrink-0 text-light-text" />
        <p className="text-[11px] text-light-text">Manage this job in the Twedot app</p>
      </div>
    </div>
  );
}

const DEMO_REQUESTS: ServiceRequest[] = [
  {
    id: "demo-1",
    requesterId: "d1",
    requesterName: "Sarah Adeyemi",
    requesterPhoto: null,
    requesterCity: "Lekki Phase 1",
    requesterCountry: "Nigeria",
    category: "Electrician",
    description: "Power tripping in master bedroom. Might need a new circuit breaker. Urgent — we have a baby and the AC is off.",
    photoUrl: null,
    locationLabel: "Lekki Phase 1, Lagos",
    latitude: null,
    longitude: null,
    status: "searching",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expiresAt: "",
  },
  {
    id: "demo-2",
    requesterId: "d2",
    requesterName: "Emeka Okafor",
    requesterPhoto: null,
    requesterCity: "Victoria Island",
    requesterCountry: "Nigeria",
    category: "Electrician",
    description: "Generator won't start after the rain. Think it's the starter motor or control panel. Need someone experienced with Firman generators.",
    photoUrl: null,
    locationLabel: "Victoria Island, Lagos",
    latitude: null,
    longitude: null,
    status: "searching",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    expiresAt: "",
  },
  {
    id: "demo-3",
    requesterId: "d3",
    requesterName: "Chidinma Eze",
    requesterPhoto: null,
    requesterCity: "Ajah",
    requesterCountry: "Nigeria",
    category: "Electrician",
    description: "Installing 6 ceiling fans in a newly built house. Need someone with experience doing fresh installs in a new build.",
    photoUrl: null,
    locationLabel: "Ajah, Lagos · 6.3km away",
    latitude: null,
    longitude: null,
    status: "searching",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    expiresAt: "",
  },
  {
    id: "demo-4",
    requesterId: "d4",
    requesterName: "Biodun Falola",
    requesterPhoto: null,
    requesterCity: "Yaba",
    requesterCountry: "Nigeria",
    category: "Electrician",
    description: "Office needs complete rewiring. 5 rooms, existing trunking in place. Looking for someone available this week.",
    photoUrl: null,
    locationLabel: "Yaba, Lagos · 8.1km away",
    latitude: null,
    longitude: null,
    status: "searching",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    expiresAt: "",
  },
  {
    id: "demo-5",
    requesterId: "d5",
    requesterName: "Ngozi Nwosu",
    requesterPhoto: null,
    requesterCity: "Surulere",
    requesterCountry: "Nigeria",
    category: "Electrician",
    description: "Inverter installation for a 3-bedroom flat. I have the inverter already, just need someone to connect and configure it.",
    photoUrl: null,
    locationLabel: "Surulere, Lagos",
    latitude: null,
    longitude: null,
    status: "searching",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    expiresAt: "",
  },
  {
    id: "demo-6",
    requesterId: "d6",
    requesterName: "Kelechi Obi",
    requesterPhoto: null,
    requesterCity: "Magodo",
    requesterCountry: "Nigeria",
    category: "Electrician",
    description: "Outdoor security lights and CCTV wiring for a compound. About 8 points. Need someone who knows outdoor conduit work.",
    photoUrl: null,
    locationLabel: "Magodo, Lagos · 11.4km away",
    latitude: null,
    longitude: null,
    status: "searching",
    createdAt: new Date(Date.now() - 7 * 3600000).toISOString(),
    expiresAt: "",
  },
];


function EmptySection({ label, count, message }: { label: string; count: number; message: string }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-light-text">{label}</p>
        <span className="rounded-md bg-feed-bg px-1.5 py-0.5 text-[10px] font-bold text-light-text">{count}</span>
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl bg-feed-bg px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
        <IoBriefcaseOutline size={15} className="flex-shrink-0 text-light-text" />
        <p className="text-[12px] text-light-text">{message}</p>
      </div>
    </div>
  );
}

function DemoSection({ occupation }: { occupation: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0 px-4 pb-4">
      <div className="mb-2 mt-1 text-[10px] font-bold uppercase tracking-widest text-light-text">New Requests</div>
      <div className="mb-4 flex flex-col gap-3">
        {DEMO_REQUESTS.map((r) => <RequestCard key={r.id} request={r} />)}
      </div>

      <EmptySection
        label="Your Bids"
        count={0}
        message="No active bids — go to the app to bid on a request above"
      />

      <EmptySection
        label="Active Jobs"
        count={0}
        message="No active jobs yet — accept a bid in the app to get started"
      />
    </div>
  );
}

export default function JobRequestPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { liveRequests, clearBadge, removeLiveRequest } = useJobSocket();
  const [openRequests, setOpenRequests] = useState<ServiceRequest[]>([]);
  const [pendingBids, setPendingBids] = useState<VendorBid[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feed, bids, bookings] = await Promise.allSettled([
        apiGet<ServiceRequest[]>("/bookings/requests/vendor/feed"),
        apiGet<VendorBid[]>("/bookings/vendor/bids"),
        apiGet<Booking[]>("/bookings/vendor/my"),
      ]);
      setOpenRequests(feed.status === "fulfilled" && Array.isArray(feed.value) ? feed.value : []);
      setPendingBids(bids.status === "fulfilled" && Array.isArray(bids.value) ? bids.value : []);
      const allBookings = bookings.status === "fulfilled" && Array.isArray(bookings.value) ? bookings.value : [];
      setActiveBookings(allBookings.filter((b) => b.status !== "finished" && b.status !== "cancelled"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  // Clear badge and absorb any socket-delivered requests when the user opens this page
  useEffect(() => {
    clearBadge();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge live socket requests into the top of the open requests list (dedup by id)
  useEffect(() => {
    if (liveRequests.length === 0) return;
    setOpenRequests((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const incoming = liveRequests.filter((r) => !existingIds.has(r.id)) as ServiceRequest[];
      return incoming.length > 0 ? [...incoming, ...prev] : prev;
    });
  }, [liveRequests]);

  // Remove a cancelled request from local list and from socket buffer
  const handleCancelledRequest = useCallback((id: string) => {
    setOpenRequests((prev) => prev.filter((r) => r.id !== id));
    removeLiveRequest(id);
  }, [removeLiveRequest]);

  const occupation = (user as any)?.occupation as string | null | undefined;
  const hasAnything = openRequests.length > 0 || pendingBids.length > 0 || activeBookings.length > 0;

  return (
    <div className="flex flex-col pb-10">
      {/* Header */}
      <div className="px-4 pb-1 pt-6">
        <h1 className="text-xl font-bold text-text">Job Request</h1>
        {occupation && (
          <p className="mt-0.5 text-[12px] text-light-text">{occupation}</p>
        )}
      </div>

      <div className="mt-3">
        <ReadOnlyBanner />
      </div>

      {/* Body */}
      {!isAuthenticated && !authLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-feed-bg">
            <IoBriefcaseOutline size={28} className="text-light-text" />
          </div>
          <p className="text-sm font-medium text-text">Sign in to see job requests</p>
          <p className="px-8 text-xs text-light-text">
            Log in to view open service requests matched to your occupation
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-3 px-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-feed-bg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-feed-bg" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-feed-bg" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-2.5 w-full animate-pulse rounded bg-feed-bg" />
                <div className="h-2.5 w-3/4 animate-pulse rounded bg-feed-bg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <IoBriefcaseOutline size={28} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-text">Couldn't load job requests</p>
          <p className="px-8 text-xs text-red-400">{error}</p>
          <button onClick={load} className="mt-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white">
            Retry
          </button>
        </div>
      ) : !occupation ? (
        <div className="flex flex-col items-center justify-center gap-3 px-8 pt-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-feed-bg">
            <IoBriefcaseOutline size={28} className="text-light-text" />
          </div>
          <p className="text-sm font-semibold text-text">Set your service to see job requests</p>
          <p className="text-xs leading-[17px] text-light-text">
            Add what you do on your profile in the Twedot app so we can match you with people who need it.
          </p>
          <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
            <IoCheckmarkCircle size={13} className="text-primary" />
            <span className="text-[11px] font-semibold text-primary">Update your profile in the app</span>
          </div>
        </div>
      ) : !hasAnything ? (
        <DemoSection occupation={occupation} />
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {openRequests.length > 0 && (
            <div>
              <SectionTitle>New Requests</SectionTitle>
              <div className="flex flex-col gap-3">
                {openRequests.map((r) => <RequestCard key={r.id} request={r} />)}
              </div>
            </div>
          )}

          {pendingBids.length > 0 && (
            <div>
              <SectionTitle>Your Bids</SectionTitle>
              <div className="flex flex-col gap-3">
                {pendingBids.map((b) => <BidCard key={b.bidId} bid={b} />)}
              </div>
            </div>
          )}

          {activeBookings.length > 0 && (
            <div>
              <SectionTitle>Active Jobs</SectionTitle>
              <div className="flex flex-col gap-3">
                {activeBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
