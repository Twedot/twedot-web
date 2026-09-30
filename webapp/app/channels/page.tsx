"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoAddOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoGridOutline,
  IoLockClosedOutline,
  IoHelpCircleOutline,
} from "react-icons/io5";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface RoomListItem {
  id?: string;
  room_id?: string; // GET /rooms/mine uses room_id
  name: string;
  photo_url: string | null;
  join_type: "open" | "invite_request" | "additional_check";
  member_count: number;
  online_count?: number;
  last_message?: string | null;
  last_message_time?: string | null;
  unread_count?: number;
  is_member?: boolean;
  categories?: string[];
  my_role?: "admin" | "member" | null;
}

function roomId(r: RoomListItem): string {
  return (r.id ?? r.room_id ?? "") as string;
}

function previewText(rawContent: string, msgType: string | null): string {
  const t = msgType?.toLowerCase();
  if (t === "image") return "📷 Photo";
  if (t === "video") return "🎥 Video";
  if (t === "audio") return "🎵 Audio";
  if (rawContent.startsWith("{")) {
    try {
      const p = JSON.parse(rawContent);
      if (p.type === "image" || p.uris) return "📷 Photo";
      if (p.type === "video") return "🎥 Video";
    } catch { /* not JSON */ }
  }
  return rawContent;
}

function normalizeRoom(r: any): RoomListItem {
  const lm = r.last_message;
  let lastMsgText: string | null = null;
  const lastMsgTime: string | null =
    lm && typeof lm === "object" && lm.created_at ? String(lm.created_at) : (r.last_message_time ?? null);

  if (typeof lm === "string") {
    lastMsgText = lm;
  } else if (lm && typeof lm === "object") {
    const rawContent: string | null = lm.content ?? null;
    const msgType: string | null = lm.message_type ?? null;
    if (rawContent) lastMsgText = previewText(rawContent, msgType);
  }

  return {
    ...r,
    id: r.id ?? r.room_id,
    last_message: lastMsgText,
    last_message_time: lastMsgTime,
  };
}

interface CategoryCount {
  category: string;
  count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  gist: "Gist", lifestyle: "Lifestyle", entertainment: "Entertainment",
  education: "Education", business: "Business", technology: "Technology",
  sports: "Sports", fashion_beauty: "Fashion & Beauty", food_cooking: "Food & Cooking",
  music: "Music", movies_tv: "Movies & TV", gaming: "Gaming",
  relationships: "Relationships", health_fitness: "Health & Fitness",
  career_jobs: "Career & Jobs", money_finance: "Money & Finance",
  entrepreneurship: "Entrepreneurship", travel: "Travel",
  religion_spirituality: "Religion & Spirituality", politics_society: "Politics & Society",
  news_trends: "News & Trends", comedy_memes: "Comedy & Memes",
  cars_transport: "Cars & Transport", home_living: "Home & Living",
  arts_creativity: "Arts & Creativity", books_writing: "Books & Writing",
  science: "Science", photography: "Photography", local_communities: "Local Communities",
  buy_sell: "Buy & Sell", services: "Services", events: "Events",
  hobbies_interests: "Hobbies & Interests", pets_animals: "Pets & Animals",
  parenting_family: "Parenting & Family", opinions_debates: "Opinions & Debates",
  advice: "Advice", random: "Random",
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function JoinTypeIcon({ type }: { type: string }) {
  if (type === "invite_request") return <IoLockClosedOutline size={11} className="text-light-text" />;
  if (type === "additional_check") return <IoHelpCircleOutline size={11} className="text-light-text" />;
  return null;
}

function RoomRow({ room, onClick }: { room: RoomListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-feed-bg transition-colors"
    >
      {room.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={room.photo_url} alt={room.name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
          <span className="text-[18px] font-bold text-primary">#</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold text-text">{room.name}</span>
          <JoinTypeIcon type={room.join_type} />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-light-text">
          <span>{room.member_count} members</span>
          {room.online_count != null && room.online_count > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {room.online_count} online
              </span>
            </>
          )}
        </div>
        {room.last_message && (
          <p className="mt-0.5 truncate text-[12px] text-light-text">{room.last_message as string}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {room.last_message_time && (
          <span className="text-[11px] text-light-text">{timeAgo(room.last_message_time)}</span>
        )}
        {(room.unread_count ?? 0) > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
            {(room.unread_count ?? 0) > 99 ? "99+" : room.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}

export default function ChannelsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"mine" | "discover">(isAuthenticated ? "mine" : "discover");

  // My channels
  const [myRooms, setMyRooms] = useState<RoomListItem[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // Discover
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [discoverRooms, setDiscoverRooms] = useState<RoomListItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  // Search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<RoomListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadMine = useCallback(async () => {
    if (!isAuthenticated) return;
    setMyLoading(true);
    try {
      const data = await apiGet<any[]>("/rooms/mine");
      setMyRooms((Array.isArray(data) ? data : []).map(normalizeRoom));
    } catch {
      setMyRooms([]);
    } finally {
      setMyLoading(false);
    }
  }, [isAuthenticated]);

  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const data = await apiGet<CategoryCount[]>("/rooms/categories/counts");
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const loadByCategory = useCallback(async (cat: string) => {
    setSelectedCat(cat);
    setDiscoverLoading(true);
    try {
      const rawData = await apiGet<any>(`/rooms/search?category=${encodeURIComponent(cat)}&limit=30`);
      const arr = Array.isArray(rawData) ? rawData
        : Array.isArray(rawData?.rooms) ? rawData.rooms
        : Array.isArray(rawData?.data) ? rawData.data
        : [];
      setDiscoverRooms(arr.map(normalizeRoom));
    } catch {
      setDiscoverRooms([]);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === "mine") loadMine(); }, [tab, loadMine]);
  useEffect(() => { if (tab === "discover") loadCategories(); }, [tab, loadCategories]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    const q = search.trim();
    if (!q) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiGet<any[]>(`/rooms/search?q=${encodeURIComponent(q)}&limit=20`);
        setSearchResults((Array.isArray(data) ? data : []).map(normalizeRoom));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [search]);

  const showSearch = search.trim().length > 0;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold text-text">Channels</h1>
        {isAuthenticated && (
          <button
            onClick={() => router.push("/channels/create")}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <IoAddOutline size={15} />
            Create
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-feed-bg px-3 py-2">
          <IoSearchOutline size={16} className="flex-shrink-0 text-light-text" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-light-text"
          />
        </div>
      </div>

      {/* Tab bar */}
      {!showSearch && (
        <div className="flex border-b border-border px-4">
          {(isAuthenticated ? ["mine", "discover"] : ["discover"]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as "mine" | "discover")}
              className={`mr-4 pb-2.5 text-[14px] font-semibold capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-light-text hover:text-text"
              }`}
            >
              {t === "mine" ? "My Channels" : "Discover"}
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {showSearch && (
        <div className="flex flex-col">
          {searchLoading ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <IoSearchOutline size={32} className="text-light-text" />
              <p className="text-[14px] text-light-text">No channels found for "{search}"</p>
            </div>
          ) : searchResults.map((r) => (
            <RoomRow key={roomId(r)} room={r} onClick={() => router.push(`/channels/${roomId(r)}`)} />
          ))}
        </div>
      )}

      {/* My Channels tab */}
      {!showSearch && tab === "mine" && (
        <div className="flex flex-col">
          {myLoading ? (
            <div className="flex flex-col px-4 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-feed-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 animate-pulse rounded bg-feed-bg" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-feed-bg" />
                  </div>
                </div>
              ))}
            </div>
          ) : myRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-feed-bg">
                <span className="text-2xl font-bold text-light-text">#</span>
              </div>
              <div>
                <p className="text-[16px] font-semibold text-text">No channels yet</p>
                <p className="mt-1 text-[13px] text-light-text">Create or discover channels to join</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/channels/create")}
                  className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  Create Channel
                </button>
                <button
                  onClick={() => setTab("discover")}
                  className="rounded-full bg-feed-bg px-4 py-2 text-[13px] font-semibold text-text hover:bg-border/50 transition-colors"
                >
                  Discover
                </button>
              </div>
            </div>
          ) : (
            myRooms.map((r) => (
              <RoomRow key={roomId(r)} room={r} onClick={() => router.push(`/channels/${roomId(r)}`)} />
            ))
          )}
        </div>
      )}

      {/* Discover tab */}
      {!showSearch && tab === "discover" && (
        <div className="flex flex-col">
          {selectedCat ? (
            <>
              {/* Category header */}
              <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                <button
                  onClick={() => { setSelectedCat(null); setDiscoverRooms([]); }}
                  className="text-[13px] font-medium text-primary hover:underline"
                >
                  ← All categories
                </button>
                <span className="text-[14px] font-semibold text-text">
                  {CATEGORY_LABELS[selectedCat] ?? selectedCat}
                </span>
              </div>
              {discoverLoading ? (
                <div className="flex justify-center py-10">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : discoverRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
                  <IoGridOutline size={32} className="text-light-text" />
                  <p className="text-[14px] text-light-text">No channels in this category yet</p>
                  {isAuthenticated && (
                    <button
                      onClick={() => router.push("/channels/create")}
                      className="mt-2 rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-white"
                    >
                      Create one
                    </button>
                  )}
                </div>
              ) : (
                discoverRooms.map((r) => (
                  <RoomRow key={roomId(r)} room={r} onClick={() => router.push(`/channels/${roomId(r)}`)} />
                ))
              )}
            </>
          ) : catLoading ? (
            <div className="grid grid-cols-2 gap-3 px-4 pt-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-feed-bg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-4 pt-3 pb-6">
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => loadByCategory(c.category)}
                  className="flex items-center justify-between rounded-xl bg-feed-bg px-4 py-3 text-left hover:bg-border/40 transition-colors"
                >
                  <span className="truncate text-[13px] font-semibold text-text">
                    {CATEGORY_LABELS[c.category] ?? c.category}
                  </span>
                  <span className="ml-2 flex-shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
