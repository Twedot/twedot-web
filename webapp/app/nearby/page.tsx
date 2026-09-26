"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoSearchOutline,
  IoBriefcaseOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoChatbubble,
  IoLocationSharp,
  IoFunnelOutline,
  IoFunnel,
  IoCloseCircleOutline,
  IoCloseOutline,
  IoSchoolOutline,
  IoPersonOutline,
  IoStarSharp,
  IoTimeOutline,
} from "react-icons/io5";
import { apiGet } from "@/lib/api";
import type { NearbyVendor, VendorSearchResponse } from "@/lib/vendors";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { getGlobalRankTier, GLOBAL_RANK_LABELS, GLOBAL_RANK_COLORS } from "@/lib/globalRank";

interface Genre {
  id: string;
  name: string;
  image_url: string | null;
  description?: string;
  sort_order: number;
  products?: { id: string; name: string; image_url: string }[];
  autoColor?: string;
}

const AUTO_COLORS = [
  "#6B4EFF", "#FF6B6B", "#FF9F43", "#1DD1A1", "#54A0FF",
  "#5F27CD", "#EE5A24", "#009432", "#0652DD", "#833471",
];

const DEFAULT_LOC = { latitude: 6.5242, longitude: 3.3792 };
const LS_KEY = "nearby_recent_searches";

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s: unknown) => typeof s === "string") : [];
  } catch { return []; }
}

function saveRecent(q: string): string[] {
  const next = [q, ...loadRecents().filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 4);
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  return next;
}

function distLabel(u: NearbyVendor): string | null {
  if (!u.has_location) return null;
  return u.distance_km < 1 ? `${Math.round(u.distance_km * 1000)}m away` : `${u.distance_km.toFixed(1)}km away`;
}

// ─── User row (search results) ────────────────────────────────────────────────
function UserRow({ user, onPress, onMessage }: { user: NearbyVendor; onPress: () => void; onMessage: () => void }) {
  const initials = (user.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const rankTier = user.rank_visible !== false ? getGlobalRankTier(user.global_activity_score ?? 0) : null;
  const dist = distLabel(user);

  return (
    <button onClick={onPress} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-feed-bg">
      {user.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.profile_photo_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg text-sm font-bold text-text">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-text">{user.name}</span>
          <span className="text-light-text">·</span>
          <span className="truncate text-sm text-light-text">{user.occupation}</span>
        </div>

        {rankTier && rankTier !== "unknown" && (
          <div
            className="mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: GLOBAL_RANK_COLORS[rankTier] + "1F", color: GLOBAL_RANK_COLORS[rankTier] }}
          >
            <IoStarSharp size={10} />
            {GLOBAL_RANK_LABELS[rankTier]}
          </div>
        )}

        {!!user.completed_jobs && user.completed_jobs > 0 && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-light-text">
            {user.average_rating != null && (
              <>
                <IoStarSharp size={11} className="text-[#F5A623]" />
                <span className="font-semibold text-[#F5A623]">{Number(user.average_rating).toFixed(1)}</span>
                <span>·</span>
              </>
            )}
            <span>{user.completed_jobs} job{user.completed_jobs === 1 ? "" : "s"} completed</span>
          </div>
        )}

        <div className="mt-0.5 flex items-center gap-1 text-xs text-light-text">
          {user.has_location && <IoLocationSharp size={11} className="flex-shrink-0 text-primary" />}
          <span className="truncate">{user.has_location ? (dist ?? "Nearby") : "Available on Twedot"}</span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onMessage(); }}
        className="flex flex-shrink-0 flex-col items-center gap-1"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FF]">
          <IoChatbubble size={18} className="text-primary" />
        </div>
        <span className="text-[11px] font-medium text-light-text">Message</span>
      </button>
    </button>
  );
}

// ─── Vendor chip (expanded panel) ─────────────────────────────────────────────
function VendorChip({ user, onPress }: { user: NearbyVendor; onPress: () => void }) {
  const initials = (user.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const dist = distLabel(user);

  return (
    <button
      onClick={onPress}
      className="flex w-[110px] flex-shrink-0 flex-col items-center rounded-2xl bg-white p-2.5 shadow-sm hover:shadow"
    >
      {user.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.profile_photo_url} alt="" className="mb-1.5 h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE9FF] text-sm font-bold text-primary">
          {initials}
        </div>
      )}
      <span className="w-full truncate text-center text-[11px] font-semibold text-text">{user.name}</span>
      <span className="w-full truncate text-center text-[10px] text-light-text">{user.occupation}</span>
      {!!user.completed_jobs && user.average_rating != null && (
        <div className="mt-1 flex items-center gap-1">
          <IoStarSharp size={10} className="text-[#F5A623]" />
          <span className="text-[10px] font-semibold text-[#F5A623]">{Number(user.average_rating).toFixed(1)}</span>
        </div>
      )}
      {dist && (
        <div className="mt-1 flex items-center gap-1 rounded-lg bg-[#EDE9FF] px-2 py-0.5">
          <IoLocationSharp size={9} className="text-primary" />
          <span className="text-[10px] font-semibold text-primary">{dist}</span>
        </div>
      )}
    </button>
  );
}

// ─── Genre card ───────────────────────────────────────────────────────────────
function GenreCard({ genre, isExpanded, onPress }: { genre: Genre; isExpanded: boolean; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className={`relative h-40 w-full overflow-hidden rounded-2xl border-2 text-left transition-all ${
        isExpanded ? "border-primary" : "border-transparent"
      }`}
    >
      {genre.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={genre.image_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={{ backgroundColor: genre.autoColor ?? "#6B4EFF" }}>
          <IoBriefcaseOutline
            size={40}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-40"
          />
        </div>
      )}

      <div className={`absolute inset-0 ${isExpanded ? "bg-[#6B4EFF]/45" : "bg-black/38"}`} />

      <div className="absolute bottom-2.5 left-2.5 right-8">
        <p className="line-clamp-2 text-sm font-bold leading-tight text-white">{genre.name}</p>
        {genre.description && (
          <p className="mt-0.5 truncate text-[11px] text-white/75">{genre.description}</p>
        )}
      </div>

      <div
        className={`absolute bottom-2.5 right-2 flex h-[22px] w-[22px] items-center justify-center rounded-full ${
          isExpanded ? "bg-primary" : "bg-white/25"
        }`}
      >
        {isExpanded
          ? <IoChevronUpOutline size={13} className="text-white" />
          : <IoChevronDownOutline size={13} className="text-white" />
        }
      </div>
    </button>
  );
}

// ─── Expanded vendor panel ────────────────────────────────────────────────────
function ExpandedPanel({ genre, vendors, loading, onBook, onVendorPress }: {
  genre: Genre;
  vendors: NearbyVendor[];
  loading: boolean;
  onBook: () => void;
  onVendorPress: (u: NearbyVendor) => void;
}) {
  const products = genre.products ?? [];

  return (
    <div className="mb-3 rounded-2xl border border-border bg-white py-3.5">
      <div className="mb-3 px-4">
        <p className="text-base font-bold text-text">{genre.name}</p>
        <p className="text-xs text-light-text">Vendors for {genre.name}</p>
      </div>

      {products.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-wide text-text">Products</p>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4">
            {products.map((p) => (
              <div key={p.id} className="flex w-[110px] flex-shrink-0 flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt="" className="mb-1 h-[110px] w-[110px] rounded-2xl object-cover bg-feed-bg" />
                <span className="line-clamp-2 text-center text-[11px] font-medium text-light-text">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : vendors.length > 0 ? (
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4">
            {vendors.map((u) => (
              <VendorChip key={u.id} user={u} onPress={() => onVendorPress(u)} />
            ))}
          </div>
        ) : (
          <p className="px-4 text-xs text-light-text">No vendors found nearby</p>
        )}
      </div>

      <div className="px-4">
        <button
          onClick={onBook}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          <IoBriefcaseOutline size={15} />
          <span className="truncate">Book &ldquo;{genre.name}&rdquo;</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NearbyPage() {
  const router = useRouter();
  const { notify } = useUi();

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchFields, setSearchFields] = useState<string[]>([]);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [expandedGenreId, setExpandedGenreId] = useState<string | null>(null);
  const [expandedVendors, setExpandedVendors] = useState<NearbyVendor[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);

  const [nearbyUsers, setNearbyUsers] = useState<NearbyVendor[]>([]);
  const [widerUsers, setWiderUsers] = useState<NearbyVendor[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [userLocation, setUserLocation] = useState(DEFAULT_LOC);

  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecentSearches(loadRecents());

    apiGet<Genre[]>("/genres")
      .then((data) => {
        let autoIdx = 0;
        const colored = data.map((g) =>
          !g.image_url ? { ...g, autoColor: AUTO_COLORS[autoIdx++ % AUTO_COLORS.length] } : g
        );
        const shuffled = [...colored].sort(() => Math.random() - 0.5);
        setGenres(shuffled);
        const first = shuffled.find((g) => !g.products?.length) ?? shuffled[0];
        if (first) setExpandedGenreId(first.id);
      })
      .catch(() => {})
      .finally(() => setGenresLoading(false));

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  // Load vendors for expanded genre
  useEffect(() => {
    if (!expandedGenreId) { setExpandedVendors([]); return; }
    const genre = genres.find((g) => g.id === expandedGenreId);
    if (!genre) return;
    setExpandedLoading(true);
    setExpandedVendors([]);
    apiGet<VendorSearchResponse>(
      `/users/search?occupation=${encodeURIComponent(genre.name)}&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`
    )
      .then((r) => setExpandedVendors([...r.nearby, ...r.wider].slice(0, 20)))
      .catch(() => {})
      .finally(() => setExpandedLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedGenreId]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!search.trim()) {
      setNearbyUsers([]);
      setWiderUsers([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const fieldsParam = searchFields.length > 0 ? `&fields=${searchFields.join(",")}` : "";
      try {
        const r = await apiGet<VendorSearchResponse>(
          `/users/search?occupation=${encodeURIComponent(search.trim())}&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}${fieldsParam}`
        );
        setNearbyUsers(r.nearby);
        setWiderUsers(r.wider);
        setRecentSearches(saveRecent(search.trim()));
      } catch {
        setNearbyUsers([]);
        setWiderUsers([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, searchFields, userLocation.latitude, userLocation.longitude]);

  const showDiscovery = search.trim().length === 0;

  const expandedGenre = genres.find((g) => g.id === expandedGenreId);

  // Pair genres into rows; note which row should show the expanded panel below it
  const gridRows = useMemo(() => {
    const rows: Array<{ g1: Genre; g2: Genre | null; hasPanel: boolean }> = [];
    for (let i = 0; i < genres.length; i += 2) {
      const g1 = genres[i];
      const g2 = genres[i + 1] ?? null;
      const hasPanel = expandedGenreId === g1.id || (g2 !== null && expandedGenreId === g2.id);
      rows.push({ g1, g2, hasPanel });
    }
    return rows;
  }, [genres, expandedGenreId]);

  const toggleGenre = useCallback((id: string) => {
    setExpandedGenreId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <div>
          <h1 className="text-xl font-extrabold text-text">Nearby</h1>
          <p className="text-xs text-light-text">Search users, vendors, and services near you</p>
        </div>
        <button
          onClick={() => notify("Book a service is coming soon")}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-[#EDE9FF]"
        >
          <IoBriefcaseOutline size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="relative z-10 px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-lg bg-feed-bg px-3">
          <IoSearchOutline size={18} className="flex-shrink-0 text-light-text" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSuggestionsVisible(true);
              if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
              suggestTimerRef.current = setTimeout(() => setSuggestionsVisible(false), 4000);
            }}
            onFocus={() => { setSearchFocused(true); setFilterOpen(false); }}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search users, vendors, services…"
            className="flex-1 bg-transparent py-2.5 text-sm text-text outline-none placeholder:text-light-text"
          />
          {searchLoading && (
            <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          {search.length > 0 && !searchLoading && (
            <button onClick={() => setSearch("")} className="flex-shrink-0 text-light-text hover:text-text">
              <IoCloseCircleOutline size={18} />
            </button>
          )}
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex-shrink-0 pl-1 text-light-text"
          >
            {searchFields.length > 0
              ? <IoFunnel size={18} className="text-primary" />
              : <IoFunnelOutline size={18} />
            }
          </button>
        </div>

        {/* Filter dropdown */}
        {filterOpen && (
          <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            <p className="px-3.5 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wide text-light-text">Match by</p>
            {([
              { key: "name", label: "Name", Icon: IoPersonOutline },
              { key: "service", label: "Service or item", Icon: IoBriefcaseOutline },
              { key: "school", label: "School", Icon: IoSchoolOutline },
              { key: "location", label: "Location", Icon: IoLocationSharp },
            ] as const).map(({ key, label, Icon }) => {
              const ticked = searchFields.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => setSearchFields((prev) => ticked ? prev.filter((k) => k !== key) : [...prev, key])}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 hover:bg-feed-bg"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-feed-bg">
                    <Icon size={16} className={ticked ? "text-primary" : "text-light-text"} />
                  </div>
                  <span className="flex-1 text-left text-sm text-text">{label}</span>
                  <div className={`flex h-4 w-4 items-center justify-center rounded border-2 ${ticked ? "border-primary bg-primary" : "border-border"}`}>
                    {ticked && <span className="text-[9px] font-bold text-white">✓</span>}
                  </div>
                </button>
              );
            })}
            <p className="px-3.5 py-2 text-[10px] text-light-text">
              {searchFields.length === 0 ? "Nothing ticked — matching everything" : `Only matching: ${searchFields.join(", ")}`}
            </p>
          </div>
        )}

        {/* Recent searches */}
        {searchFocused && suggestionsVisible && search.trim().length > 0 && (() => {
          const q = search.trim().toLowerCase();
          const matches = recentSearches.filter((r) => r.toLowerCase().includes(q) && r.toLowerCase() !== q).slice(0, 4);
          if (!matches.length) return null;
          return (
            <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              <div className="flex items-center justify-between px-3.5 pb-1 pt-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-light-text">Recent</p>
                <button onClick={() => setSuggestionsVisible(false)} className="text-light-text hover:text-text">
                  <IoCloseOutline size={16} />
                </button>
              </div>
              {matches.map((item) => (
                <button
                  key={item}
                  onClick={() => { setSearch(item); setSuggestionsVisible(false); }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 hover:bg-feed-bg"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-feed-bg">
                    <IoTimeOutline size={16} className="text-light-text" />
                  </div>
                  <span className="text-sm text-text">{item}</span>
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Content */}
      {showDiscovery ? (
        genresLoading ? (
          <div className="grid grid-cols-2 gap-3 px-4 pt-1 pb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-feed-bg" />
            ))}
          </div>
        ) : genres.length === 0 ? (
          <div className="flex flex-1 items-center justify-center pt-20 text-center">
            <p className="px-8 text-sm text-light-text">Search for services or items near you</p>
          </div>
        ) : (
          <div className="px-4 pb-8">
            {gridRows.map((row, i) => (
              <div key={i}>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <GenreCard
                    genre={row.g1}
                    isExpanded={expandedGenreId === row.g1.id}
                    onPress={() => toggleGenre(row.g1.id)}
                  />
                  {row.g2 ? (
                    <GenreCard
                      genre={row.g2}
                      isExpanded={expandedGenreId === row.g2.id}
                      onPress={() => toggleGenre(row.g2!.id)}
                    />
                  ) : (
                    <div />
                  )}
                </div>
                {row.hasPanel && expandedGenre && (
                  <ExpandedPanel
                    genre={expandedGenre}
                    vendors={expandedVendors}
                    loading={expandedLoading}
                    onBook={() => notify(`Booking "${expandedGenre.name}" is coming soon`)}
                    onVendorPress={(u) => router.push(`/profile/${u.id}`)}
                  />
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="pb-8">
          {searchLoading && nearbyUsers.length === 0 && widerUsers.length === 0 ? (
            <div className="flex justify-center pt-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : nearbyUsers.length === 0 && widerUsers.length === 0 ? (
            <div className="pt-20 text-center">
              <p className="px-8 text-sm text-light-text">No results found</p>
            </div>
          ) : (
            <>
              {nearbyUsers.length > 0 && (
                <>
                  <p className="border-b border-border px-4 py-3 text-sm font-semibold text-text">Nearby services</p>
                  {nearbyUsers.map((u) => (
                    <div key={u.id} className="border-b border-border">
                      <UserRow user={u} onPress={() => router.push(`/profile/${u.id}`)} onMessage={() => notify("Messages are coming soon")} />
                    </div>
                  ))}
                </>
              )}
              {widerUsers.length > 0 && (
                <>
                  <p className="border-b border-border px-4 py-3 text-sm font-semibold text-text">Available on Twedot</p>
                  {widerUsers.map((u) => (
                    <div key={u.id} className="border-b border-border">
                      <UserRow user={u} onPress={() => router.push(`/profile/${u.id}`)} onMessage={() => notify("Messages are coming soon")} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
