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
import { feedStateStore } from "@/lib/feedStateStore";

const PAGE_SIZE = 20;
const VENDOR_ROW_POSITION = 3;

type SortOption = "best" | "new" | "top" | "following";
const SORT_LABELS: Record<SortOption, string> = { best: "Best", new: "New", top: "Top", following: "Following" };

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

  const cached = feedStateStore.hasCache(query) ? feedStateStore.get() : null;

  const [posts, setPosts] = useState<StatusPost[]>(cached?.posts ?? []);
  const [page, setPage] = useState(cached?.page ?? 1);
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>(cached?.sort ?? "best");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [vendors, setVendors] = useState<NearbyVendor[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const restoredScroll = useRef(false);
  // Refs so the stable IntersectionObserver callback always reads fresh values
  // without needing to be recreated on every state change.
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetching);
  const pageRef = useRef(page);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isFetching; }, [isFetching]);
  useEffect(() => { pageRef.current = page; }, [page]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const HEADER_H = 112; // sticky nav + filter bar combined height

  // Restore scroll to the saved top post after cached posts render
  useEffect(() => {
    if (restoredScroll.current || !cached?.topPostId) return;
    restoredScroll.current = true;
    const id = cached.topPostId;
    const scrollTo = () => {
      const el = document.getElementById(`post-${id}`);
      if (el) window.scrollTo({ top: Math.max(0, el.offsetTop - HEADER_H), behavior: "instant" });
    };
    const t1 = setTimeout(scrollTo, 0);
    const t2 = setTimeout(scrollTo, 150);
    const t3 = setTimeout(scrollTo, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortRef = useRef(sort);
  useEffect(() => { sortRef.current = sort; }, [sort]);

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      setIsFetching(true);
      setError(null);
      try {
        const currentSort = sortRef.current;
        const path = query
          ? `/status/search?q=${encodeURIComponent(query)}&page=${pageToLoad}&limit=${PAGE_SIZE}`
          : currentSort === "following"
          ? `/status/following?page=${pageToLoad}&limit=${PAGE_SIZE}`
          : `/status/public?page=${pageToLoad}&limit=${PAGE_SIZE}`;
        const data = await apiGet<StatusPost[]>(path);
        setPosts((prev) => {
          const next = pageToLoad === 1 ? data : [...prev, ...data];
          feedStateStore.save({ posts: next, page: pageToLoad, hasMore: data.length === PAGE_SIZE, query });
          return next;
        });
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
    // Skip initial fetch if we have a valid cache for this query
    if (isAuthenticated && !feedStateStore.hasCache(query)) loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, query]);

  // Reload feed when switching to/from Following (different endpoint)
  const prevSortRef = useRef(sort);
  useEffect(() => {
    const prev = prevSortRef.current;
    prevSortRef.current = sort;
    if (!isAuthenticated) return;
    if ((sort === "following") !== (prev === "following")) {
      setPosts([]);
      setPage(1);
      setHasMore(true);
      loadPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  useEffect(() => {
    if (isAuthenticated) markFeedSeen();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<NearbyVendor[]>("/users/suggested")
      .then((result) => setVendors(result.filter((u: any) => !u.is_following).slice(0, 12)))
      .catch(() => {});
  }, [isAuthenticated]);

  // Save sort to store when it changes
  useEffect(() => {
    feedStateStore.save({ sort });
  }, [sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // Single stable observer — reads live values from refs so it never needs to
    // be recreated on state changes (which caused it to miss intersections that
    // were already in view when the new observer connected).
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isFetchingRef.current) {
          loadPage(pageRef.current + 1);
        }
      },
      { rootMargin: "300px" }, // fire 300 px before the sentinel actually enters view
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPage]); // only recreate when query changes (which recreates loadPage)

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

  // Track which post is at the top of the viewport so we can restore scroll by element
  useEffect(() => {
    const onScroll = () => {
      for (const group of groupedPosts) {
        const el = document.getElementById(`post-${group[0].id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().bottom > HEADER_H) {
          feedStateStore.saveTopPost(group[0].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [groupedPosts]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-full bg-background">
      {query && (
        <div className="border-b border-border bg-background px-4 py-3 text-sm text-light-text">
          Results for <span className="font-semibold text-text">{query}</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2">
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
              <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
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

      {isFetching && posts.length === 0 && <FeedSkeleton />}

      <div className="flex flex-col">
        {groupedPosts.map((group, i) => (
          <div key={group[0].id} id={`post-${group[0].id}`} style={{ scrollMarginTop: 60 }}>
            <PostCard items={group} compact={compact} />
            {vendors.length > 0 && i === VENDOR_ROW_POSITION - 1 && (
              <NearbyVendorsRow vendors={vendors} />
            )}
          </div>
        ))}
      </div>

      {isFetching && posts.length > 0 && <p className="py-6 text-center text-sm text-light-text">Loading…</p>}
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

function FeedSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-border px-4 py-3.5">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-feed-bg" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3 w-28 animate-pulse rounded bg-feed-bg" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-feed-bg" />
            </div>
          </div>
          <div className="mb-3 flex flex-col gap-2">
            <div className="h-3 w-full animate-pulse rounded bg-feed-bg" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-feed-bg" />
          </div>
          <div className="aspect-video w-full animate-pulse rounded-xl bg-feed-bg" />
        </div>
      ))}
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
