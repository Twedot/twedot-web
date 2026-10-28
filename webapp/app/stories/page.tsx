"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoHeart,
  IoHeartOutline,
  IoChatbubbleEllipsesOutline,
  IoShareOutline,
  IoBookmark,
  IoBookmarkOutline,
  IoEllipsisHorizontal,
  IoPersonOutline,
  IoPersonAddOutline,
  IoPersonRemoveOutline,
  IoRocketOutline,
  IoPinOutline,
  IoStatsChartOutline,
  IoTrashOutline,
  IoThumbsDownOutline,
  IoThumbsUpOutline,
  IoVolumeMuteOutline,
  IoBanOutline,
  IoFlagOutline,
  IoCodeSlashOutline,
  IoPlay,
  IoChevronBack,
  IoChevronForward,
  IoSearchOutline,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import type { StatusPost } from "@/lib/types";
import VideoPlayer from "@/components/VideoPlayer";
import RankBadge from "@/components/RankBadge";
import LinkText from "@/components/LinkText";
import { LoginBanner } from "@/components/LoginGate";
import { markFeedSeen } from "@/lib/unseenStories";
import { feedStateStore } from "@/lib/feedStateStore";
import { videoFeedStore } from "@/lib/videoFeedStore";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { useBookmark } from "@/lib/bookmarks";
import { postDetailStore } from "@/lib/postDetailStore";
import { profileUrl, postUrl } from "@/lib/url";
import { useChatStore } from "@/lib/chatStore";
import ErrorState from "@/components/ErrorState";

const PAGE_SIZE = 20;

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

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/* ── Single Shorts-style card ── */
function ShortsCard({ items }: { items: StatusPost[] }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { notify } = useUi();
  const { socket } = useJobSocket();
  const head = items[0];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? head;
  const hasMedia = active.type === "image" || active.type === "video";

  const [likeCount, setLikeCount] = useState(head.likeCount ?? 0);
  const [isLiked, setIsLiked] = useState(head.isLiked ?? false);
  const [isFollowing, setIsFollowing] = useState(head.isFollowingAuthor ?? false);
  const followLoadingRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(head.id);

  const isOwnPost = user?.id === head.userId;

  const requireLogin = () => {
    if (!isAuthenticated) { router.push("/login"); return false; }
    return true;
  };

  // Socket events for likes
  useEffect(() => {
    if (!socket) return;
    const onLikeAck = (data: { statusId: string; liked: boolean; likeCount: number }) => {
      if (data.statusId !== head.id) return;
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);
      feedStateStore.updatePost(data.statusId, { likeCount: data.likeCount, isLiked: data.liked });
    };
    const onLikeUpdate = (data: { statusId: string; likeCount: number }) => {
      if (data.statusId !== head.id) return;
      setLikeCount(data.likeCount);
    };
    socket.on("like_status_ack", onLikeAck);
    socket.on("status_like_update", onLikeUpdate);
    return () => { socket.off("like_status_ack", onLikeAck); socket.off("status_like_update", onLikeUpdate); };
  }, [socket, head.id]);

  const handleLike = () => {
    if (!requireLogin() || !socket) return;
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    socket.emit("like_status", { statusId: head.id, statusOwnerId: head.userId });
  };

  const handleToggleFollow = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!requireLogin() || followLoadingRef.current) return;
    followLoadingRef.current = true;
    const was = isFollowing;
    setIsFollowing(!was);
    try {
      if (was) await apiDelete(`/users/follow/${head.userId}`);
      else await apiPost(`/users/follow/${head.userId}`, {});
    } catch { setIsFollowing(was); notify("Something went wrong"); }
    finally { followLoadingRef.current = false; }
  };

  const openDetail = () => {
    if (head.groupId) {
      const group = items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (group.length > 1) postDetailStore.setGroup(group);
    }
    postDetailStore.set(head);
    router.push(postUrl(head.id));
  };

  // Menu handlers
  async function handleNotInterested() { setMenuOpen(false); try { await apiPost(`/status/${head.id}/hide`, {}); } catch {} }
  async function handleMoreLikeThis() { setMenuOpen(false); try { await apiPost(`/status/${head.id}/more-like-this`, {}); } catch {} notify("Got it — we'll show you more like this"); }
  async function handleMute() { setMenuOpen(false); try { await apiPost(`/users/mute/${head.userId}`, {}); notify(`@${head.userName} muted`); } catch { notify("Could not mute"); } }
  async function handleBlock() { setMenuOpen(false); try { await apiPost(`/users/block/${head.userId}`, {}); notify(`@${head.userName} blocked`); } catch { notify("Could not block"); } }
  async function handleReport() { setMenuOpen(false); try { await apiPost(`/status/${head.id}/report`, { reason: "inappropriate" }); notify("Post reported"); } catch { notify("Post reported"); } }
  async function handleDelete() { setMenuOpen(false); try { await apiDelete(`/status/${head.id}`); notify("Post deleted"); } catch { notify("Could not delete"); } }
  async function handlePin() { setMenuOpen(false); try { await apiPost(`/status/${head.id}/pin`, {}); notify("Post pinned"); } catch { notify("Could not pin"); } }
  function handleCopyLink() { setMenuOpen(false); navigator.clipboard?.writeText(window.location.origin + postUrl(head.id)).catch(() => {}); notify("Link copied"); }
  function handleEmbedPost() { setMenuOpen(false); const code = `<iframe src="${window.location.origin}${postUrl(head.id)}" width="550" height="400" frameborder="0" scrolling="no"></iframe>`; navigator.clipboard?.writeText(code).catch(() => {}); notify("Embed code copied"); }
  function handleViewActivity() { setMenuOpen(false); router.push(postUrl(head.id)); }

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full snap-start snap-always flex-col bg-black">
      {/* ── Media area ── */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {active.type === "video" && active.content ? (
          <div className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-contain [&_video]:max-h-none [&>div]:h-full [&>div]:w-full">
            <VideoPlayer src={active.content} poster={active.thumbnailUrl ?? undefined} autoPlay />
          </div>
        ) : active.type === "image" && (active.content || active.thumbnailUrl) ? (
          <div className="relative h-full w-full cursor-pointer" onClick={openDetail}>
            {/* Blurred backdrop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.content || active.thumbnailUrl!} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.content || active.thumbnailUrl!} alt="" className="relative h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-8" onClick={openDetail}>
            <p className="max-w-lg text-center text-[18px] leading-[28px] text-white whitespace-pre-wrap">
              <LinkText text={active.caption ?? active.content ?? ""} />
            </p>
          </div>
        )}

        {/* Carousel arrows for multi-image posts */}
        {items.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button onClick={() => setActiveIndex(i => i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                <IoChevronBack size={18} />
              </button>
            )}
            {activeIndex < items.length - 1 && (
              <button onClick={() => setActiveIndex(i => i + 1)} className="absolute right-14 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                <IoChevronForward size={18} />
              </button>
            )}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {items.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}

        {/* ── Overlaid bottom content ── */}
        <div className="absolute bottom-0 left-0 right-12 z-10 pointer-events-none">
          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-16">
            {/* Author info + follow */}
            <div className="flex items-center gap-2.5 mb-2.5 pointer-events-auto">
              <button onClick={() => router.push(profileUrl(head.userName, head.userId))} className="flex-shrink-0">
                {head.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={head.userPhoto} alt={head.userName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                    <IoPersonOutline size={20} className="text-white" />
                  </div>
                )}
              </button>
              <button onClick={() => router.push(profileUrl(head.userName, head.userId))} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold text-white truncate">{head.userName}</span>
                  <RankBadge activityScore={head.userGlobalActivityScore ?? 0} rankVisible={head.userRankVisible !== false} plain className="" />
                </div>
                <p className="text-[11px] text-white/60 truncate">
                  {head.userOccupation ? `${head.userOccupation} · ` : ""}{timeAgo(head.createdAt)}
                </p>
              </button>
              {!isOwnPost && (
                <button
                  onClick={handleToggleFollow}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${
                    isFollowing
                      ? "border border-white/30 text-white hover:bg-white/10"
                      : "bg-primary text-white hover:opacity-90"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            {/* Caption */}
            {active.caption && active.type !== "text" && (
              <p className="text-[13px] leading-[19px] text-white/90 line-clamp-3 pointer-events-auto cursor-pointer" onClick={openDetail}>
                <LinkText text={active.caption} />
              </p>
            )}

            {/* Search suggestion */}
            {head.caption && (
              <button
                onClick={() => router.push(`/search?q=${encodeURIComponent(head.caption!.split(/\s+/).slice(0, 3).join(" "))}`)}
                className="mt-2.5 flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 pointer-events-auto hover:bg-white/20 transition-colors"
              >
                <IoSearchOutline size={14} className="text-white/70 flex-shrink-0" />
                <span className="text-[11px] text-white/70 truncate">
                  Search: {head.caption.split(/\s+/).slice(0, 4).join(" ")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Right action rail ── */}
        <div className="absolute right-2 bottom-20 z-10 flex flex-col items-center gap-4">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={handleLike} className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60 ${isLiked ? "text-red-500" : "text-white"}`}>
              {isLiked ? <IoHeart size={22} /> : <IoHeartOutline size={22} />}
            </button>
            <span className="text-[11px] font-bold text-white">{fmt(likeCount)}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={openDetail} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white transition-colors hover:bg-black/60">
              <IoChatbubbleEllipsesOutline size={22} />
            </button>
            <span className="text-[11px] font-bold text-white">{fmt(active.commentCount ?? 0)}</span>
          </div>

          {/* Bookmark */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => { if (requireLogin()) toggleBookmark(); }} className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60 ${isBookmarked ? "text-[#D4A400]" : "text-white"}`}>
              {isBookmarked ? <IoBookmark size={22} /> : <IoBookmarkOutline size={22} />}
            </button>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={async () => {
                const url = window.location.origin + postUrl(head.id);
                try { if (navigator.share) await navigator.share({ url }); else { await navigator.clipboard.writeText(url); notify("Link copied"); } } catch {}
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white transition-colors hover:bg-black/60"
            >
              <IoShareOutline size={22} />
            </button>
            <span className="text-[11px] font-bold text-white">Share</span>
          </div>

          {/* 3-dot menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white transition-colors hover:bg-black/60">
              <IoEllipsisHorizontal size={22} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
                <div className="absolute right-0 bottom-12 z-20 w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
                  {isOwnPost ? (
                    <>
                      <button onClick={() => { setMenuOpen(false); router.push(`/boost/${head.id}`); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoRocketOutline size={16} className="text-primary flex-shrink-0" /><span className="truncate">Boost Post</span>
                      </button>
                      <button onClick={handlePin} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoPinOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Pin to your profile</span>
                      </button>
                      <button onClick={handleViewActivity} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoStatsChartOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">View post activity</span>
                      </button>
                      {!confirmDelete ? (
                        <button onClick={() => setConfirmDelete(true)} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-red-400 hover:bg-white/10">
                          <IoTrashOutline size={16} className="flex-shrink-0" />Delete post
                        </button>
                      ) : (
                        <div className="border-t border-white/10 px-4 py-3">
                          <p className="mb-2.5 text-[12px] text-white/60">Delete this post?</p>
                          <div className="flex gap-2">
                            <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[12px] font-bold text-white hover:opacity-90">Delete</button>
                            <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg bg-white/10 py-1.5 text-[12px] font-semibold text-white hover:bg-white/20">Cancel</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={handleNotInterested} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoThumbsDownOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Not interested</span>
                      </button>
                      <button onClick={handleMoreLikeThis} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoThumbsUpOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">More like this</span>
                      </button>
                      <button onClick={(e) => { handleToggleFollow(e); setMenuOpen(false); }} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        {isFollowing ? <IoPersonRemoveOutline size={16} className="text-white/60 flex-shrink-0" /> : <IoPersonAddOutline size={16} className="text-white/60 flex-shrink-0" />}
                        <span className="truncate">{isFollowing ? `Unfollow @${head.userName}` : `Follow @${head.userName}`}</span>
                      </button>
                      <button onClick={() => { setMenuOpen(false); useChatStore.getState().openChat({ userId: head.userId, name: head.userName, photo: head.userPhoto ?? null, occupation: head.userOccupation ?? null }); }} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoChatbubbleEllipsesOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Message @{head.userName}</span>
                      </button>
                      <button onClick={handleMute} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoVolumeMuteOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Mute @{head.userName}</span>
                      </button>
                      <button onClick={handleBlock} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoBanOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Block @{head.userName}</span>
                      </button>
                      <button onClick={handleEmbedPost} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                        <IoCodeSlashOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Embed post</span>
                      </button>
                      <button onClick={handleReport} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-red-400 hover:bg-white/10">
                        <IoFlagOutline size={16} className="flex-shrink-0" /><span className="truncate">Report post</span>
                      </button>
                    </>
                  )}
                  <button onClick={handleCopyLink} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-[13px] font-semibold text-white hover:bg-white/10">
                    <IoShareOutline size={16} className="text-white/60 flex-shrink-0" /><span className="truncate">Copy link</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feed ── */
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetching);
  const pageRef = useRef(page);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isFetching; }, [isFetching]);
  useEffect(() => { pageRef.current = page; }, [page]);

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      setIsFetching(true);
      setError(null);
      try {
        const path = query
          ? `/status/search?q=${encodeURIComponent(query)}&page=${pageToLoad}&limit=${PAGE_SIZE}`
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
    if (isLoading) return;
    if (!feedStateStore.hasCache(query)) loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, query]);

  useEffect(() => {
    if (isAuthenticated) markFeedSeen();
  }, [isAuthenticated]);

  useEffect(() => {
    return feedStateStore.subscribe(() => setPosts(feedStateStore.get().posts));
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isFetchingRef.current) {
          loadPage(pageRef.current + 1);
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPage]);

  const groupedPosts = useMemo(() => groupPosts(posts), [posts]);

  useEffect(() => {
    videoFeedStore.setFeedVideos(posts);
  }, [posts]);

  return (
    <div className="h-[calc(100vh-56px)] snap-y snap-mandatory overflow-y-auto bg-black">
      {!isAuthenticated && <LoginBanner />}
      {query && (
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3 text-sm text-white/60">
          Results for <span className="font-semibold text-white">{query}</span>
        </div>
      )}

      {isFetching && posts.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-primary" />
        </div>
      )}
      {!isFetching && posts.length === 0 && error && (
        <div className="flex h-full items-center justify-center px-4">
          <ErrorState
            isOffline={error.toLowerCase().includes("no internet") || error.toLowerCase().includes("network")}
            onRetry={() => loadPage(1)}
          />
        </div>
      )}
      {!isFetching && posts.length === 0 && !error && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-white/40">Nothing here yet.</p>
        </div>
      )}

      {groupedPosts.map((group) => (
        <ShortsCard key={group[0].id} items={group} />
      ))}

      {isFetching && posts.length > 0 && (
        <div className="flex h-20 items-center justify-center snap-start">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-primary" />
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <div className="flex h-20 items-center justify-center snap-start">
          <p className="text-sm text-white/40">You&apos;re all caught up.</p>
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
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
