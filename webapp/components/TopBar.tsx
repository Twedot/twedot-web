"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoNotificationsOutline,
  IoChatbubbleOutline,
  IoSearchOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoBagOutline,
  IoConstructOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet } from "@/lib/api";
import type { StatusPost } from "@/lib/types";

interface UserResult {
  id: string;
  name: string;
  profile_photo_url: string | null;
  occupation: string | null;
  bio: string | null;
  global_activity_score: number;
  rank_visible: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  posts: "Posts",
  users: "Profiles",
  products: "Products",
  services: "Services",
};

const RECENT_KEY = "tw_recent_searches";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(term: string) {
  try {
    const prev = loadRecent().filter((s) => s !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}
function removeRecent(term: string) {
  try {
    const updated = loadRecent().filter((s) => s !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const { notify } = useUi();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // activeQuery / activeType are set by the SearchSync child (see bottom of this file)
  // which uses useSearchParams() — the only hook that re-fires on query-string changes.

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setPosts([]); setUsers([]); return; }
    debounceRef.current = setTimeout(async () => {
      const [postsRes, usersRes] = await Promise.allSettled([
        apiGet<StatusPost[]>(`/status/search?q=${encodeURIComponent(query)}&limit=3`),
        apiGet<UserResult[]>(`/users/find?q=${encodeURIComponent(query)}&limit=3`),
      ]);
      setPosts(postsRes.status === "fulfilled" && Array.isArray(postsRes.value) ? postsRes.value : []);
      setUsers(usersRes.status === "fulfilled" && Array.isArray(usersRes.value) ? usersRes.value : []);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function openSearch() {
    const params = new URLSearchParams(window.location.search);
    const existingQ = params.get("q") ?? "";
    const existingType = params.get("type") ?? "";
    if (existingQ) setQuery(existingQ);
    if (existingType && TYPE_LABELS[existingType]) {
      setFilterTag(TYPE_LABELS[existingType]);
      setFilterType(existingType);
    }
    setRecentSearches(loadRecent());
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function go(term: string, type?: string) {
    if (!term.trim()) return;
    const resolvedType = type ?? filterType ?? undefined;
    const url = resolvedType
      ? `/search?q=${encodeURIComponent(term.trim())}&type=${resolvedType}`
      : `/search?q=${encodeURIComponent(term.trim())}`;
    saveRecent(term.trim());
    router.push(url);
    setOpen(false);
    setQuery("");
    setPosts([]);
    setUsers([]);
    setFilterTag(null);
    setFilterType(null);
  }

  function selectFilter(tag: string, type: string) {
    setFilterTag(tag);
    setFilterType(type);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function clearFilter() {
    setFilterTag(null);
    setFilterType(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function clear() {
    setQuery("");
    setPosts([]);
    setUsers([]);
    setFilterTag(null);
    setFilterType(null);
    setOpen(false);
  }

  function deleteRecent(term: string) {
    removeRecent(term);
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  }

  return (
    <>
    {/* Listens to useSearchParams so the pill updates immediately on tab clicks */}
    <Suspense fallback={null}>
      <SearchSync
        onSync={(q, type) => {
          setActiveQuery(q);
          setActiveType(type ? (TYPE_LABELS[type] ?? null) : null);
        }}
      />
    </Suspense>
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-white px-6">
      {/* Logo */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          onClick={() => router.push("/feed")}
          className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-primary"
        >
          <span className="hidden sm:inline">Twedot</span>
        </button>
      </div>

      {/* Search */}
      <div ref={wrapperRef} className="absolute left-1/2 w-full max-w-xl -translate-x-1/2 px-4">

        {/* Trigger pill — always in DOM so wrapper keeps its height/position */}
        <button
          onClick={openSearch}
          className={`flex w-full items-center gap-2 rounded-full bg-feed-bg px-4 py-2.5 transition-colors hover:bg-border/30 ${open ? "invisible" : ""}`}
        >
          <IoSearchOutline size={17} className="flex-shrink-0 text-light-text" />
          {activeType && (
            <span className="flex-shrink-0 text-sm text-light-text">[{activeType}]</span>
          )}
          {activeQuery ? (
            <span className="flex-1 text-center text-sm text-text">{activeQuery}</span>
          ) : (
            <span className="flex-1 text-center text-sm text-light-text">Search Twedot</span>
          )}
        </button>

        {/* Unified card — anchored to the wrapper's top edge, extends downward */}
        {open && (
          <div className="absolute left-0 right-0 top-0 z-50 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13)]">

            {/* Input row — filter chip + centered input */}
            <div className="flex items-center gap-2 px-4 py-[11px]">
              <IoSearchOutline size={17} className="flex-shrink-0 text-light-text" />

              {/* Active filter tag */}
              {filterTag && (
                <span className="flex flex-shrink-0 items-center gap-0.5 text-sm text-light-text">
                  [{filterTag}]
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); clearFilter(); }}
                    className="ml-0.5 text-light-text hover:text-text"
                  >
                    <IoCloseOutline size={12} />
                  </button>
                </span>
              )}

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") go(query); if (e.key === "Escape") clear(); }}
                placeholder={filterTag ? `Search in ${filterTag}…` : "Search Twedot"}
                className={`flex-1 bg-transparent text-sm text-text outline-none placeholder:text-light-text ${!filterTag ? "text-center placeholder:text-center" : ""}`}
              />

              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); clear(); }}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-border/60 text-light-text hover:bg-border"
              >
                <IoCloseOutline size={14} />
              </button>
            </div>

            {/* Scrollable results area */}
            <div className="max-h-[72vh] overflow-y-auto">

              {/* Recent searches — shown only when input is empty */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="border-t border-border/50 py-1.5">
                  <div className="px-4 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-light-text">Recent</div>
                  {recentSearches.map((s) => (
                    <div key={s} className="flex items-center hover:bg-feed-bg">
                      <button
                        onMouseDown={(e) => { e.preventDefault(); go(s); }}
                        className="flex flex-1 items-center gap-3 px-4 py-2 text-left"
                      >
                        <IoSearchOutline size={13} className="flex-shrink-0 text-light-text" />
                        <span className="text-sm text-text">{s}</span>
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); deleteRecent(s); }}
                        className="pr-4 text-light-text hover:text-text"
                      >
                        <IoCloseOutline size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Live suggestions when typing */}
              {query.trim() && (
                <div className="border-t border-border/50 py-1.5">
                  {[query, `${query} trending`, `${query} nearby`].map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => { e.preventDefault(); go(s); }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-feed-bg"
                    >
                      <IoSearchOutline size={13} className="flex-shrink-0 text-light-text" />
                      <span className="text-sm text-text">
                        {s.startsWith(query)
                          ? <><strong>{query}</strong>{s.slice(query.length)}</>
                          : s}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Default suggestions when input is empty and no recent */}
              {!query.trim() && recentSearches.length === 0 && (
                <div className="border-t border-border/50 py-1.5">
                  {["trending posts", "people nearby", "local products", "top services"].map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => { e.preventDefault(); go(s); }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-feed-bg"
                    >
                      <IoSearchOutline size={13} className="flex-shrink-0 text-light-text" />
                      <span className="text-sm text-text">{s}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Users */}
              {users.length > 0 && (
                <>
                  <SectionHeader label="Profiles" />
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onMouseDown={(e) => { e.preventDefault(); router.push(`/profile?id=${u.id}`); setOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-feed-bg"
                    >
                      {u.profile_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.profile_photo_url} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                          <IoPersonOutline size={15} className="text-light-text" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-text">{u.name}</p>
                        {u.occupation && <p className="truncate text-[11px] text-light-text">{u.occupation}</p>}
                      </div>
                    </button>
                  ))}
                  <SeeMore label="profiles" onPress={() => go(query, "users")} />
                </>
              )}

              {/* Posts */}
              {posts.length > 0 && (
                <>
                  <SectionHeader label="Posts" />
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onMouseDown={(e) => { e.preventDefault(); go(query); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-feed-bg"
                    >
                      {post.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.thumbnailUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-feed-bg">
                          <IoDocumentTextOutline size={14} className="text-light-text" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] text-text">
                          {post.caption || (post.type === "video" ? "Video post" : "Photo post")}
                        </p>
                        <p className="text-[11px] text-light-text">by {post.userName}</p>
                      </div>
                    </button>
                  ))}
                  <SeeMore label="posts" onPress={() => go(query, "posts")} />
                </>
              )}

              {/* Category shortcuts */}
              <SectionHeader label="Search by category" />
              <button
                onMouseDown={(e) => { e.preventDefault(); selectFilter("Profiles", "users"); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-feed-bg ${filterType === "users" ? "bg-primary/5" : ""}`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                  <IoPersonOutline size={14} className="text-text" />
                </div>
                <p className="text-[13px] text-light-text">
                  {query ? `Search "${query}" in Profiles` : "Browse user profiles"}
                </p>
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); selectFilter("Products", "products"); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-feed-bg ${filterType === "products" ? "bg-primary/5" : ""}`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                  <IoBagOutline size={14} className="text-text" />
                </div>
                <p className="text-[13px] text-light-text">
                  {query ? `Search "${query}" in Products` : "Browse products on Twedot"}
                </p>
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); selectFilter("Services", "services"); }}
                className={`flex w-full items-center gap-3 px-4 pb-3 pt-2.5 text-left hover:bg-feed-bg ${filterType === "services" ? "bg-primary/5" : ""}`}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                  <IoConstructOutline size={14} className="text-text" />
                </div>
                <p className="text-[13px] text-light-text">
                  {query ? `Search "${query}" in Services` : "Find services near you"}
                </p>
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-2">
        <button
          onClick={() => notify("Messages are coming soon")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-feed-bg"
        >
          <IoChatbubbleOutline size={19} />
        </button>

        <button
          onClick={() => notify("Post composer is coming soon")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-text hover:text-primary"
        >
          <MdOutlineAddBox size={18} />
          Create
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-feed-bg">
          <IoNotificationsOutline size={20} />
        </button>

        {user?.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profile_photo_url}
            alt={user.name ?? ""}
            className="h-8 w-8 cursor-pointer rounded-full object-cover"
            onClick={() => router.push("/profile")}
          />
        ) : (
          <div
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-feed-bg"
            onClick={() => router.push("/profile")}
          >
            <IoPersonOutline size={17} className="text-light-text" />
          </div>
        )}
      </div>
    </header>
    </>
  );
}

function SearchSync({ onSync }: { onSync: (q: string, type: string | null) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    onSync(params.get("q") ?? "", params.get("type"));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-t border-border/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-light-text">
      {label}
    </div>
  );
}

function SeeMore({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      className="flex w-full items-center gap-1.5 px-4 py-2 text-left text-xs font-medium text-primary hover:underline"
    >
      See more {label}
      <IoChevronForwardOutline size={12} />
    </button>
  );
}
