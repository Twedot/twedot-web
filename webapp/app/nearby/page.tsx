"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronDownOutline, IoChevronUpOutline, IoBriefcaseOutline } from "react-icons/io5";
import { apiGet } from "@/lib/api";
import type { NearbyVendor, VendorSearchResponse } from "@/lib/vendors";
import RankBadge from "@/components/RankBadge";

interface Genre {
  id: string;
  name: string;
  image_url: string | null;
  description?: string;
  sort_order: number;
}

const AUTO_COLORS = [
  "#6B4EFF", "#FF6B6B", "#FF9F43", "#1DD1A1", "#54A0FF",
  "#5F27CD", "#EE5A24", "#009432", "#0652DD", "#833471",
];

const DEFAULT_LOC = { latitude: 6.5242, longitude: 3.3792 };

// ─── Vendor card — same style as Suggested Vendors on the feed ────────────────
function VendorCard({ vendor, onPress }: { vendor: NearbyVendor; onPress: () => void }) {
  const initials = (vendor.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-[160px] w-[150px] flex-shrink-0 flex-col items-center rounded-xl border border-border p-3 text-center">
      {vendor.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vendor.profile_photo_url}
          alt=""
          className="mb-2 h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-feed-bg">
          <span className="text-xs font-bold text-text">{initials}</span>
        </div>
      )}

      <div className="w-full truncate text-xs font-medium text-text">{vendor.name}</div>
      <div className="mt-0.5 line-clamp-1 w-full text-[11px] font-normal text-light-text">
        {vendor.occupation}
      </div>

      <RankBadge
        activityScore={vendor.global_activity_score ?? 0}
        rankVisible={vendor.rank_visible}
        className="mt-1"
      />

      <button
        onClick={onPress}
        className="mt-auto w-full rounded-full bg-[#333333] py-1.5 text-xs font-medium text-white hover:opacity-90"
      >
        View Profile
      </button>
    </div>
  );
}

// ─── Genre accordion row ──────────────────────────────────────────────────────
function GenreRow({
  genre,
  accentColor,
  userLocation,
  router,
}: {
  genre: Genre;
  accentColor: string;
  userLocation: { latitude: number; longitude: number };
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<NearbyVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  function toggle() {
    if (!open && !loaded.current) {
      loaded.current = true;
      setLoading(true);
      apiGet<VendorSearchResponse>(
        `/users/search?occupation=${encodeURIComponent(genre.name)}&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`
      )
        .then((r) => setVendors([...r.nearby, ...r.wider].slice(0, 20)))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    setOpen((o) => !o);
  }

  return (
    <div className="border-b border-border">
      {/* Row header */}
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-feed-bg"
      >
        {genre.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={genre.image_url}
            alt=""
            className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-feed-bg">
            <IoBriefcaseOutline size={18} className="text-light-text" />
            <span
              className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-white"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-text">{genre.name}</p>
          {genre.description && (
            <p className="truncate text-[11px] text-light-text">{genre.description}</p>
          )}
        </div>

        {open
          ? <IoChevronUpOutline size={16} className="flex-shrink-0 text-light-text" />
          : <IoChevronDownOutline size={16} className="flex-shrink-0 text-light-text" />
        }
      </button>

      {/* Expanded vendor cards */}
      {open && (
        <div className="px-4 pb-4 pt-1">
          {loading ? (
            <div className="flex h-[160px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : vendors.length === 0 ? (
            <p className="py-6 text-center text-xs text-light-text">No vendors found for this category</p>
          ) : (
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {vendors.map((v) => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  onPress={() => router.push(`/profile/${v.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NearbyPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOC);

  useEffect(() => {
    apiGet<Genre[]>("/genres")
      .then((data) => setGenres([...data].sort((a, b) => a.sort_order - b.sort_order)))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-feed-bg" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-feed-bg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (genres.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center pt-24 text-center">
        <p className="px-8 text-sm text-light-text">No categories available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {genres.map((genre, i) => (
        <GenreRow
          key={genre.id}
          genre={genre}
          accentColor={AUTO_COLORS[i % AUTO_COLORS.length]}
          userLocation={userLocation}
          router={router}
        />
      ))}
    </div>
  );
}
