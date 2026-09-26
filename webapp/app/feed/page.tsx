"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoChevronDown, IoGridOutline, IoAlbumsOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, ApiError } from "@/lib/api";
import type { StatusPost } from "@/lib/types";
import type { NearbyVendor } from "@/lib/vendors";
import PostCard from "@/components/PostCard";
import NearbyVendorsRow from "@/components/NearbyVendorsRow";
import { markFeedSeen } from "@/lib/unseenStories";

const PAGE_SIZE = 20;
// Shown once per feed load, not repeated every N posts — "hardly seen," matching how
// sparingly Reddit's own in-feed suggestion card appears.
const VENDOR_ROW_POSITION = 3;

type SortOption = "best" | "new" | "top";
const SORT_LABELS: Record<SortOption, string> = { best: "Best", new: "New", top: "Top" };

// Mirrors the mobile app's groupIntoPosts (FullScreenStatusFeed.tsx): items sharing a
// groupId (one deliberate multi-select upload) collapse into a single swipeable post
// instead of showing as separate feed entries. Grouping works regardless of the items'
// positions in the list, so it stays correct even after client-side sorting.
function groupPosts(items: StatusPost[]): StatusPost[][] {
  const groups = new Map<string, StatusPost[]>();
  for (const item of items) {
    const key = item.groupId ? `${item.userId}:${item.groupId}` : `solo:${item.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.values()).map((group) =>
    [...group].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
}

function FeedContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const query = useSearchParams().get("q") ?? "";

  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("best");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [vendors, setVendors] = useState<NearbyVendor[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      setIsFetching(true);
      setError(null);
      try {
        const path = query
          ? `/status/search?q=${encodeURIComponent(query)}&page=${pageToLoad}&limit=${PAGE_SIZE}`
          : `/status/public?page=${pageToLoad}&limit=${PAGE_SIZE}`;
        const data = await apiGet<StatusPost[]>(path);
        setPosts((prev) => (pageToLoad === 1 ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageToLoad);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't load the feed.");
      } finally {
        setIsFetching(false);
      }
    },
    [query]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthenticated) loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, query]);

  useEffect(() => {
    if (isAuthenticated) markFeedSeen();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<NearbyVendor[]>("/users/suggested")
      .then((result) => setVendors(result.slice(0, 12)))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        loadPage(page + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching, page, loadPage]);

  const sortedPosts = useMemo(() => {
    if (sort === "new") {
      return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sort === "top") {
      return [...posts].sort((a, b) => b.likeCount - a.likeCount);
    }
    return posts;
  }, [posts, sort]);

  const groupedPosts = useMemo(() => groupPosts(sortedPosts), [sortedPosts]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-full bg-white">
      {query && (
        <div className="border-b border-border bg-white px-4 py-3 text-sm text-light-text">
          Results for <span className="font-semibold text-text">{query}</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-border bg-white px-4 py-2">
        <div className="relative">
          <button
            onClick={() => setSortMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-text hover:bg-feed-bg"
          >
            {SORT_LABELS[sort]}
            <IoChevronDown size={14} />
          </button>
          {sortMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSort(opt);
                      setSortMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-feed-bg ${
                      opt === sort ? "font-semibold text-primary" : "text-text"
                    }`}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setCompact((v) => !v)}
          title={compact ? "Card view" : "Compact view"}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
        >
          {compact ? <IoGridOutline size={18} /> : <IoAlbumsOutline size={18} />}
        </button>
      </div>

      {error && (
        <p className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-col">
        {groupedPosts.map((group, i) => (
          <div key={group[0].id}>
            <PostCard items={group} compact={compact} />
            {vendors.length > 0 && i === VENDOR_ROW_POSITION - 1 && (
              <NearbyVendorsRow vendors={vendors} />
            )}
          </div>
        ))}
      </div>

      {isFetching && <p className="py-6 text-center text-sm text-light-text">Loading…</p>}
      {!hasMore && posts.length > 0 && (
        <p className="py-6 text-center text-sm text-light-text">You&apos;re all caught up.</p>
      )}
      {!isFetching && posts.length === 0 && !error && (
        <p className="py-6 text-center text-sm text-light-text">Nothing here yet.</p>
      )}

      <div ref={sentinelRef} />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
