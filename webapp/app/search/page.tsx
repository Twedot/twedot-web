"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import {
  IoPersonOutline,
  IoPlayCircle,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoEyeOutline,
  IoChevronForwardOutline,
  IoChevronDownOutline,
  IoSearchOutline,
  IoPricetagOutline,
  IoConstructOutline,
  IoStarOutline,
} from "react-icons/io5";
import { apiGet } from "@/lib/api";
import type { StatusPost } from "@/lib/types";
import RankBadge from "@/components/RankBadge";

interface UserResult {
  id: string;
  name: string;
  profile_photo_url: string | null;
  occupation: string | null;
  bio: string | null;
  global_activity_score: number;
  rank_visible: boolean;
}

interface InventoryImage { image_url: string }
interface InventoryItem {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  type: "product" | "service";
  is_available: boolean;
  images: InventoryImage[];
}

type TabKey = "all" | "posts" | "users" | "products" | "services";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "posts",    label: "Posts" },
  { key: "users",    label: "Profiles" },
  { key: "products", label: "Products" },
  { key: "services", label: "Services" },
];

function relatedQueries(q: string): { label: string; q: string; type?: string }[] {
  return [
    { label: `${q} near me`,       q,             type: undefined },
    { label: `${q} professionals`, q,             type: "users"    },
    { label: `${q} services`,      q,             type: "services" },
    { label: `${q} products`,      q,             type: "products" },
    { label: `best ${q}`,          q,             type: undefined  },
  ];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : `${Math.floor(days / 7)}w`;
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─── Main page ─── */
function SearchPage() {
  const params = useSearchParams();
  const router  = useRouter();
  const q       = params.get("q") ?? "";
  const typeParam = (params.get("type") ?? "all") as TabKey;

  const [tab,          setTab]          = useState<TabKey>(typeParam);
  const [posts,        setPosts]        = useState<StatusPost[]>([]);
  const [users,        setUsers]        = useState<UserResult[]>([]);
  const [products,     setProducts]     = useState<InventoryItem[]>([]);
  const [services,     setServices]     = useState<InventoryItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInv,   setLoadingInv]   = useState(false);
  const [postPage,     setPostPage]     = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [initialized,  setInitialized]  = useState(false);

  const fetchPosts = useCallback(async (page: number, reset = false) => {
    if (!q.trim()) return;
    setLoadingPosts(true);
    try {
      const data = await apiGet<StatusPost[]>(
        `/status/search?q=${encodeURIComponent(q)}&page=${page}&limit=12`
      );
      const rows = Array.isArray(data) ? data : [];
      setPosts((prev) => reset ? rows : [...prev, ...rows]);
      setHasMorePosts(rows.length === 12);
    } catch {
      // network / server error — leave posts empty, don't crash
    } finally { setLoadingPosts(false); }
  }, [q]);

  const fetchUsers = useCallback(async () => {
    if (!q.trim()) return;
    setLoadingUsers(true);
    try {
      const data = await apiGet<UserResult[]>(`/users/find?q=${encodeURIComponent(q)}&limit=20`);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally { setLoadingUsers(false); }
  }, [q]);

  const fetchInventory = useCallback(async () => {
    if (!q.trim()) return;
    setLoadingInv(true);
    try {
      const [prodData, svcData] = await Promise.allSettled([
        apiGet<InventoryItem[]>(`/inventory/public-search?q=${encodeURIComponent(q)}&type=product&limit=6`),
        apiGet<InventoryItem[]>(`/inventory/public-search?q=${encodeURIComponent(q)}&type=service&limit=6`),
      ]);
      setProducts(prodData.status === "fulfilled" && Array.isArray(prodData.value) ? prodData.value : []);
      setServices(svcData.status  === "fulfilled" && Array.isArray(svcData.value)  ? svcData.value  : []);
    } catch {
      // ignore
    } finally { setLoadingInv(false); }
  }, [q]);

  useEffect(() => {
    setPosts([]); setUsers([]); setProducts([]); setServices([]);
    setPostPage(1); setHasMorePosts(true);
    setInitialized(false);
    setTab(typeParam);
    const promises: Promise<unknown>[] = [];
    if (typeParam === "all" || typeParam === "posts")    promises.push(fetchPosts(1, true));
    if (typeParam === "all" || typeParam === "users")    promises.push(fetchUsers());
    if (typeParam === "all" || typeParam === "products" || typeParam === "services") promises.push(fetchInventory());
    Promise.allSettled(promises).then(() => setInitialized(true));
  }, [q, typeParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(key: TabKey) {
    setTab(key);
    router.push(`/search?q=${encodeURIComponent(q)}&type=${key}`);
  }

  const loading = loadingPosts || loadingUsers || loadingInv;
  const noResults = initialized && !loading && posts.length === 0 && users.length === 0 && products.length === 0 && services.length === 0;

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 pt-32 text-center">
        <IoSearchOutline size={36} className="text-light-text" />
        <p className="text-sm text-light-text">Type something to search</p>
      </div>
    );
  }

  return (
    <div className="pb-16 pt-4">

      {/* Tab bar + sort — sticky so they don't scroll away */}
      <div className="sticky top-14 z-10 bg-white pb-2 pt-1">
        <div className="no-scrollbar mb-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1 text-[11px] font-medium transition-colors ${
                tab === t.key ? "bg-neutral-200 text-text font-semibold" : "text-light-text hover:text-text hover:bg-feed-bg"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-0.5 text-[11px] font-medium text-text hover:text-primary">
            Relevance <IoChevronDownOutline size={11} />
          </button>
          <button className="flex items-center gap-0.5 text-[11px] font-medium text-text hover:text-primary">
            All time <IoChevronDownOutline size={11} />
          </button>
        </div>
      </div>

      {/* ══ ALL ══ */}
      {tab === "all" && (
        <>
          {loading && posts.length === 0 && <Skeleton />}

          {/* Posts — mobile-style story cards */}
          {posts.length > 0 && (
            <Section label="Posts" onMore={() => switchTab("posts")}>
              <div className="grid grid-cols-3 gap-1.5">
                {posts.slice(0, 6).map((p) => <StoryCard key={p.id} post={p} />)}
              </div>
            </Section>
          )}

          {/* Profiles */}
          {users.length > 0 && (
            <Section label="Profiles" onMore={() => switchTab("users")}>
              {users.slice(0, 4).map((u) => (
                <UserRow key={u.id} user={u} onClick={() => router.push(`/profile?id=${u.id}`)} />
              ))}
            </Section>
          )}

          {/* Products */}
          {products.length > 0 && (
            <Section label="Products" onMore={() => switchTab("products")}>
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 4).map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            </Section>
          )}

          {/* Services */}
          {services.length > 0 && (
            <Section label="Services" onMore={() => switchTab("services")}>
              {services.slice(0, 4).map((item) => <ServiceRow key={item.id} item={item} />)}
            </Section>
          )}

          {noResults && <EmptyState q={q} />}

          {/* People also search for — always last */}
          {!loading && (
            <div className="mt-4 mb-6">
              <h2 className="mb-2.5 text-[10px] font-semibold text-light-text uppercase tracking-widest">People also search for</h2>
              <div className="flex flex-wrap gap-2">
                {relatedQueries(q).map((rq) => {
                  const url = rq.type
                    ? `/search?q=${encodeURIComponent(rq.q)}&type=${rq.type}`
                    : `/search?q=${encodeURIComponent(rq.q)}`;
                  return (
                    <button key={rq.label} onClick={() => router.push(url)}
                      className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-text hover:bg-feed-bg hover:border-primary/40">
                      <IoSearchOutline size={10} className="text-light-text" />
                      {rq.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ POSTS ══ */}
      {tab === "posts" && (
        <>
          {loadingPosts && posts.length === 0 && <Skeleton />}
          {!loadingPosts && posts.length === 0 && <EmptyState q={q} />}
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map((p) => <StoryCard key={p.id} post={p} />)}
          </div>
          {hasMorePosts && posts.length > 0 && (
            <button onClick={() => { const next = postPage + 1; setPostPage(next); fetchPosts(next); }}
              disabled={loadingPosts}
              className="mt-6 w-full rounded-full border border-border py-2.5 text-sm font-medium text-text hover:bg-feed-bg disabled:opacity-50">
              {loadingPosts ? "Loading…" : "Load more"}
            </button>
          )}
          {!hasMorePosts && posts.length > 0 && !loadingPosts && <EndOfResults />}
        </>
      )}

      {/* ══ USERS ══ */}
      {tab === "users" && (
        <>
          {loadingUsers && users.length === 0 && <Skeleton />}
          {!loadingUsers && users.length === 0 && <EmptyState q={q} label="No users found" />}
          <div className="divide-y divide-border/40">
            {users.map((u) => <UserRow key={u.id} user={u} large onClick={() => router.push(`/profile?id=${u.id}`)} />)}
          </div>
          {!loadingUsers && users.length > 0 && <EndOfResults />}
        </>
      )}

      {/* ══ PRODUCTS ══ */}
      {tab === "products" && (
        <>
          {loadingInv && products.length === 0 && <Skeleton />}
          {!loadingInv && products.length === 0 && <EmptyState q={q} label="No products found" />}
          <div className="grid grid-cols-2 gap-3">
            {products.map((item) => <ItemCard key={item.id} item={item} large />)}
          </div>
          {!loadingInv && products.length > 0 && <EndOfResults />}
        </>
      )}

      {/* ══ SERVICES ══ */}
      {tab === "services" && (
        <>
          {loadingInv && services.length === 0 && <Skeleton />}
          {!loadingInv && services.length === 0 && <EmptyState q={q} label="No services found" />}
          <div className="divide-y divide-border/40">
            {services.map((item) => <ServiceRow key={item.id} item={item} large />)}
          </div>
          {!loadingInv && services.length > 0 && <EndOfResults />}
        </>
      )}
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ label, onMore, children }: { label: string; onMore: () => void; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[12px] font-bold text-text">{label}</h2>
        <button onClick={onMore} className="flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline">
          See more <IoChevronForwardOutline size={11} />
        </button>
      </div>
      {children}
    </section>
  );
}

/* ─── Story card (mobile-style) ─── */
function StoryCard({ post }: { post: StatusPost }) {
  const hasMedia = !!post.thumbnailUrl;
  return (
    <div className="flex flex-col">
      {/* Thumbnail / text card */}
      <div className="relative overflow-hidden rounded-xl bg-feed-bg" style={{ aspectRatio: "1/1" }}>
        {hasMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnailUrl!} alt={post.caption ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 p-3">
            <p className="line-clamp-6 text-center text-[12px] leading-[17px] text-text">{post.caption}</p>
          </div>
        )}
        {post.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <IoPlayCircle size={26} className="text-white/90 drop-shadow-lg" />
          </div>
        )}
        {/* User avatar pinned to top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {post.userPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.userPhoto} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/50" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/30 ring-1 ring-white/30">
              <IoPersonOutline size={11} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Caption + stats BELOW the card */}
      <div className="mt-1 px-0.5">
        <p className="truncate text-[10px] font-medium text-text">{post.userName}</p>
        {post.caption && (
          <p className="line-clamp-2 text-[9px] leading-[13px] text-light-text mt-0.5">{post.caption}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-light-text">
          <span className="flex items-center gap-0.5"><IoHeartOutline size={9} />{fmt(post.likeCount)}</span>
          <span className="flex items-center gap-0.5"><IoChatbubbleOutline size={9} />{fmt(post.commentCount)}</span>
          <span className="flex items-center gap-0.5"><IoEyeOutline size={9} />{fmt(post.viewCount)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── User row ─── */
function UserRow({ user, onClick, large }: { user: UserResult; onClick: () => void; large?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-2.5 py-2.5 text-left hover:bg-feed-bg px-1">
      {user.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.profile_photo_url} alt="" className={`flex-shrink-0 rounded-full object-cover ${large ? "h-8 w-8" : "h-6 w-6"}`} />
      ) : (
        <div className={`flex flex-shrink-0 items-center justify-center rounded-full bg-feed-bg ${large ? "h-8 w-8" : "h-6 w-6"}`}>
          <IoPersonOutline size={large ? 14 : 11} className="text-light-text" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate font-semibold text-text ${large ? "text-[11px]" : "text-[10px]"}`}>{user.name}</p>
          <RankBadge activityScore={user.global_activity_score ?? 0} rankVisible={user.rank_visible ?? true} plain />
        </div>
        {user.occupation && <p className="truncate text-[10px] text-light-text">{user.occupation}</p>}
        {user.bio && <p className="line-clamp-1 text-[10px] text-light-text/80 mt-0.5">{user.bio}</p>}
      </div>
      <IoChevronForwardOutline size={12} className="flex-shrink-0 text-light-text" />
    </button>
  );
}

/* ─── Product card (grid) ─── */
function ItemCard({ item, large }: { item: InventoryItem; large?: boolean }) {
  const img = item.images?.[0]?.image_url ?? null;
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
      <div className={`bg-feed-bg ${large ? "h-32" : "h-24"} relative overflow-hidden`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IoPricetagOutline size={22} className="text-light-text" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="line-clamp-2 text-[11px] font-medium leading-[15px] text-text">{item.title}</p>
        {item.price > 0 && (
          <p className="mt-0.5 text-[11px] font-semibold text-primary">₦{item.price.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Service row ─── */
function ServiceRow({ item, large }: { item: InventoryItem; large?: boolean }) {
  const img = item.images?.[0]?.image_url ?? null;
  return (
    <div className="flex items-center gap-2.5 py-2.5 px-1">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={item.title} className={`flex-shrink-0 rounded-lg object-cover ${large ? "h-11 w-11" : "h-9 w-9"}`} />
      ) : (
        <div className={`flex flex-shrink-0 items-center justify-center rounded-lg bg-feed-bg ${large ? "h-11 w-11" : "h-9 w-9"}`}>
          <IoConstructOutline size={large ? 18 : 14} className="text-light-text" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-text">{item.title}</p>
        {item.description && <p className="line-clamp-1 text-[10px] text-light-text">{item.description}</p>}
        {item.price > 0 && (
          <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-primary font-medium">
            <IoStarOutline size={9} />
            ₦{item.price.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function Skeleton() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-feed-bg" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-2.5 w-24 animate-pulse rounded bg-feed-bg" />
            <div className="h-3.5 w-full animate-pulse rounded bg-feed-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ q, label }: { q: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <IoSearchOutline size={32} className="text-light-text" />
      <p className="text-sm font-medium text-text">{label ?? `No results for "${q}"`}</p>
      <p className="px-8 text-xs text-light-text">Try different keywords or check your spelling</p>
    </div>
  );
}

function EndOfResults() {
  return (
    <div className="flex items-center gap-3 py-8">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[10px] font-medium text-light-text">End of results</span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

export default function SearchPageWrapper() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
