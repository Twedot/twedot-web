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
  IoChevronUp,
  IoChevronDown,
  IoSearchOutline,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import type { StatusPost } from "@/lib/types";
import VideoPlayer from "@/components/VideoPlayer";
import RankBadge from "@/components/RankBadge";
import LinkText from "@/components/LinkText";
import CommentsDrawer from "@/components/CommentsDrawer";
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
function ShortsCard({ items, onComment, onPrev, onNext, hasPrev, hasNext }: {
  items: StatusPost[];
  onComment: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
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
  const [captionExpanded, setCaptionExpanded] = useState(false);
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

  const maxH = "calc(100vh - 56px - 40px)";

  return (
    <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center gap-5 pb-5 pt-5">
      {/* ── Left column: caption / author / follow (bottom-aligned) ── */}
      <div className="flex-shrink-0 w-[300px] flex flex-col gap-2 self-end pb-2">
        {/* Search suggestion */}
        {head.caption && (
          <button
            onClick={() => router.push(`/search?q=${encodeURIComponent(head.caption!.split(/\s+/).slice(0, 3).join(" "))}`)}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 w-fit hover:bg-white/15 transition-colors"
          >
            <IoSearchOutline size={12} className="text-white/60 flex-shrink-0" />
            <span className="text-[11px] text-white/60 truncate">
              Search &quot;{head.caption.split(/\s+/).slice(0, 4).join(" ")}&quot;
            </span>
          </button>
        )}

        {/* Author row */}
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(profileUrl(head.userName, head.userId))} className="flex-shrink-0">
            {head.userPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={head.userPhoto} alt={head.userName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <IoPersonOutline size={16} className="text-white" />
              </div>
            )}
          </button>
          <button onClick={() => router.push(profileUrl(head.userName, head.userId))} className="min-w-0 text-left">
            <span className="text-[13px] font-bold text-white">{head.userName}</span>
            <RankBadge activityScore={head.userGlobalActivityScore ?? 0} rankVisible={head.userRankVisible !== false} plain className="" />
          </button>
          {!isOwnPost && (
            <button
              onClick={handleToggleFollow}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${
                isFollowing
                  ? "border border-white/20 text-white hover:bg-white/10"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Caption — click to expand */}
        {active.caption && active.type !== "text" && (
          <p
            onClick={() => setCaptionExpanded(e => !e)}
            className={`text-[14px] leading-[20px] text-white font-semibold cursor-pointer ${captionExpanded ? "" : "line-clamp-2"}`}
          >
            {active.caption}
          </p>
        )}
      </div>

      {/* ── Media card — natural size, capped to viewport ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-2xl"
        style={{ maxHeight: maxH, maxWidth: 480 }}
      >
        {active.type === "video" && active.content ? (
          <div className="[&_video]:max-w-[480px] [&_video]:w-auto [&_video]:rounded-2xl [&>div]:flex [&>div]:items-center" style={{ maxHeight: maxH }}>
            <VideoPlayer src={active.content} poster={active.thumbnailUrl ?? undefined} autoPlay />
          </div>
        ) : active.type === "image" && (active.content || active.thumbnailUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.content || active.thumbnailUrl!} alt="" className="w-auto max-w-[480px] rounded-2xl" style={{ maxHeight: maxH }} />
        ) : (
          <div className="flex items-center justify-center bg-zinc-900 w-[360px]" style={{ height: maxH }}>
            <p className="max-w-sm text-center text-[16px] leading-[24px] text-white whitespace-pre-wrap px-6">
              <LinkText text={active.caption ?? active.content ?? ""} />
            </p>
          </div>
        )}

        {/* Carousel dots + arrows */}
        {items.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button onClick={() => setActiveIndex(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
                <IoChevronBack size={18} />
              </button>
            )}
            {activeIndex < items.length - 1 && (
              <button onClick={() => setActiveIndex(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
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
      </div>

      {/* ── Action rail + nav arrows (z-50 to stay above comment drawer backdrop) ── */}
      <div className="relative z-50 flex flex-col items-center gap-3 flex-shrink-0 self-end pb-2">
        <div className="flex flex-col items-center gap-1">
          <button onClick={handleLike} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 ${isLiked ? "text-red-500" : "text-white/80"}`}>
            {isLiked ? <IoHeart size={24} /> : <IoHeartOutline size={24} />}
          </button>
          <span className="text-[11px] font-bold text-white/70">{fmt(likeCount)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button onClick={onComment} className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10">
            <IoChatbubbleEllipsesOutline size={24} />
          </button>
          <span className="text-[11px] font-bold text-white/70">{fmt(active.commentCount ?? 0)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => { if (requireLogin()) toggleBookmark(); }} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 ${isBookmarked ? "text-[#D4A400]" : "text-white/80"}`}>
            {isBookmarked ? <IoBookmark size={24} /> : <IoBookmarkOutline size={24} />}
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={async () => {
              const url = window.location.origin + postUrl(head.id);
              try { if (navigator.share) await navigator.share({ url }); else { await navigator.clipboard.writeText(url); notify("Link copied"); } } catch {}
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          >
            <IoShareOutline size={24} />
          </button>
          <span className="text-[11px] font-bold text-white/70">Share</span>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10">
            <IoEllipsisHorizontal size={24} />
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
        {/* Nav arrows */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <button onClick={onPrev} disabled={!hasPrev} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">
            <IoChevronUp size={20} />
          </button>
          <button onClick={onNext} disabled={!hasNext} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">
            <IoChevronDown size={20} />
          </button>
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
  const [currentIdx, setCurrentIdx] = useState(() => {
    try { return parseInt(sessionStorage.getItem("stories_idx") ?? "0") || 0; } catch { return 0; }
  });
  const [commentPanelPostId, setCommentPanelPostId] = useState<string | null>(() => {
    try { return sessionStorage.getItem("stories_comment_post") || null; } catch { return null; }
  });
  const [commentPanelCount, setCommentPanelCount] = useState(() => {
    try { return parseInt(sessionStorage.getItem("stories_comment_count") ?? "0") || 0; } catch { return 0; }
  });
  const drawerOpen = commentPanelPostId !== null;
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

  const groupedPosts = useMemo(() => groupPosts(posts), [posts]);

  useEffect(() => {
    videoFeedStore.setFeedVideos(posts);
  }, [posts]);

  // Prefetch next page when near end
  useEffect(() => {
    if (groupedPosts.length > 0 && currentIdx >= groupedPosts.length - 3 && hasMoreRef.current && !isFetchingRef.current) {
      loadPage(pageRef.current + 1);
    }
  }, [currentIdx, groupedPosts.length, loadPage]);

  const goNext = useCallback(() => {
    setCurrentIdx((i) => {
      const next = Math.min(i + 1, groupedPosts.length - 1);
      try { sessionStorage.setItem("stories_idx", String(next)); } catch {}
      return next;
    });
  }, [groupedPosts.length]);

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => {
      const prev = Math.max(i - 1, 0);
      try { sessionStorage.setItem("stories_idx", String(prev)); } catch {}
      return prev;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const currentGroup = groupedPosts[currentIdx];

  return (
    <div className={`relative h-[calc(100vh-56px)] overflow-hidden transition-[padding] duration-300 ${drawerOpen ? "pr-[400px]" : ""}`}>
      {!isAuthenticated && <LoginBanner />}
      {query && (
        <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3 text-sm text-white/60">
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

      {currentGroup && (
        <ShortsCard
          key={currentGroup[0].id}
          items={currentGroup}
          onComment={() => {
            const id = currentGroup[0].id;
            const count = currentGroup[0].commentCount ?? 0;
            setCommentPanelPostId(id);
            setCommentPanelCount(count);
            try { sessionStorage.setItem("stories_comment_post", id); sessionStorage.setItem("stories_comment_count", String(count)); } catch {}
          }}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={currentIdx > 0}
          hasNext={currentIdx < groupedPosts.length - 1 || hasMore}
        />
      )}

      <CommentsDrawer
        postId={commentPanelPostId}
        commentCount={commentPanelCount}
        onClose={() => { setCommentPanelPostId(null); try { sessionStorage.removeItem("stories_comment_post"); sessionStorage.removeItem("stories_comment_count"); } catch {} }}
      />

      {isFetching && posts.length > 0 && currentIdx === groupedPosts.length - 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-primary" />
        </div>
      )}
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
