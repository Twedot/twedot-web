"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  IoHeart,
  IoHeartOutline,
  IoChatbubbleEllipsesOutline,
  IoShareOutline,
  IoEllipsisHorizontal,
  IoBookmark,
  IoBookmarkOutline,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { useRouter } from "next/navigation";
import LinkText from "./LinkText";
import VideoPlayer from "./VideoPlayer";
import RankBadge from "./RankBadge";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { apiPost, apiDelete } from "@/lib/api";
import { useBookmark } from "@/lib/bookmarks";
import { postDetailStore } from "@/lib/postDetailStore";
import type { StatusPost } from "@/lib/types";

function MediaBackdrop({ bgSrc, children, isVideo = false }: { bgSrc?: string | null; children: ReactNode; isVideo?: boolean }) {
  return (
    // For videos: no background on small/laptop screens (xl+: keep the blurred
    // thumbnail backdrop). Images always keep the backdrop.
    <div className={`relative overflow-hidden rounded-md ${isVideo ? "xl:bg-zinc-900" : "bg-zinc-900"}`}>
      {bgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgSrc}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl ${isVideo ? "hidden xl:block" : ""}`}
        />
      )}
      <div className="relative flex justify-center">{children}</div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function PostCard({ items, compact = false }: { items: StatusPost[]; compact?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const head = items[0];
  const active = items[activeIndex] ?? head;

  const { user } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const { socket } = useJobSocket();
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(active.id);
  const isOwnPost = user?.id === head.userId;

  // Follow state for the post's author — seeded from the feed response so it
  // survives a page refresh without showing "Follow" for accounts we already follow.
  const [isFollowing, setIsFollowing] = useState(head.isFollowingAuthor ?? false);
  const followLoadingRef = useRef(false);

  // Local like state so the button responds instantly without a feed refetch
  const [isLiked, setIsLiked] = useState(active.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(active.likeCount ?? 0);

  // Sync from prop when the active item changes (swiping multi-post groups)
  useEffect(() => {
    setIsLiked(active.isLiked ?? false);
    setLikeCount(active.likeCount ?? 0);
  }, [active.id, active.isLiked, active.likeCount]);

  // Live like updates from others viewing the same post
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (data: { statusId: string; likeCount: number }) => {
      if (data.statusId === active.id) setLikeCount(data.likeCount);
    };
    const onAck = (data: { statusId: string; liked: boolean; likeCount: number }) => {
      if (data.statusId === active.id) {
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    };
    socket.on("status_like_update", onUpdate);
    socket.on("like_status_ack", onAck);
    return () => {
      socket.off("status_like_update", onUpdate);
      socket.off("like_status_ack", onAck);
    };
  }, [socket, active.id]);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!socket) return;
    // Optimistic
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    socket.emit("like_status", { statusId: active.id, statusOwnerId: active.userId });
  }

  function openDetail(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (items.length > 1) postDetailStore.setGroup(items);
    postDetailStore.set(active);
    router.push(`/status/${items[0].id}`);
  }

  function openProfile(e: React.MouseEvent) {
    e.stopPropagation();
    if (user?.id === head.userId) {
      router.push("/profile");
    } else {
      router.push(`/profile/${head.userId}`);
    }
  }

  const handleToggleFollow = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoadingRef.current) return;
    followLoadingRef.current = true;

    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        await apiDelete(`/users/follow/${head.userId}`);
      } else {
        await apiPost(`/users/follow/${head.userId}`, {});
      }
    } catch {
      setIsFollowing(wasFollowing); // Revert
      notify("Something went wrong. Please try again.");
    } finally {
      followLoadingRef.current = false;
    }
  }, [isFollowing, head.userId, notify]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  }

  function scrollToIndex(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActiveIndex(idx);
  }

  // Tap vs swipe detection for carousel items
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  function onCarouselPointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }
  function onCarouselPointerUp(e: React.PointerEvent, it: StatusPost) {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    pointerStart.current = null;
    if (dx < 8 && dy < 8) {
      postDetailStore.setGroup(items);
      postDetailStore.set(it);
      router.push(`/status/${items[0].id}`);
    }
  }

  return (
    <article className={`border-b border-border bg-background px-4 hover:bg-feed-bg/50 ${compact ? "py-2.5" : "py-3.5"}`}>
      {/* ── Header: avatar + name → profile; rest is card actions ── */}
      <header className="mb-2 flex items-start gap-2">
        <button onClick={openProfile} className="flex-shrink-0">
          {head.userPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={head.userPhoto} alt={head.userName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-300" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={openProfile} className="text-left">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[12px] font-semibold text-text">{head.userName}</span>
              {head.userOccupation && (
                <>
                  <span className="text-[11px] text-light-text">·</span>
                  <span className="truncate text-[11px] text-light-text">{head.userOccupation}</span>
                </>
              )}
              <span className="text-[11px] text-light-text">· {timeAgo(head.createdAt)}</span>
            </div>
            <RankBadge activityScore={head.userGlobalActivityScore ?? 0} rankVisible={head.userRankVisible} className="mt-0.5" />
          </button>
        </div>
        {!isOwnPost && (
          <button
            onClick={handleToggleFollow}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
              isFollowing
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
        >
          <IoEllipsisHorizontal size={18} />
        </button>
      </header>

      {/* ── Caption / text body → clicking opens post detail ── */}
      {(active.caption || active.type === "text") && (
        <button
          onClick={() => openDetail()}
          className="mb-2.5 ml-10 block w-full text-left"
        >
          <p className="whitespace-pre-wrap text-[13px] font-medium leading-[18px] text-text">
            <LinkText text={active.caption ?? active.content} />
          </p>
        </button>
      )}

      {/* ── Single media item ── */}
      {!compact && items.length === 1 && (active.type === "image" || active.type === "video") && (
        <button onClick={() => openDetail()} className="mb-2 block w-full">
          <MediaBackdrop bgSrc={active.type === "image" ? active.content : active.thumbnailUrl} isVideo={active.type === "video"}>
            {active.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.content} alt="" className="max-h-[520px] w-full rounded-md object-cover" />
            ) : (
              <VideoPlayer src={active.content} poster={active.thumbnailUrl ?? undefined} />
            )}
          </MediaBackdrop>
        </button>
      )}

      {/* ── Multi-media carousel ── */}
      {!compact && items.length > 1 && (
        <div className="relative mb-2">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          >
            {items.filter((it) => it.type === "image" || it.type === "video").map((it) => (
              <div
                key={it.id}
                className="w-full flex-shrink-0 snap-center"
                onPointerDown={onCarouselPointerDown}
                onPointerUp={(e) => onCarouselPointerUp(e, it)}
              >
                <MediaBackdrop bgSrc={it.type === "image" ? it.content : it.thumbnailUrl} isVideo={it.type === "video"}>
                  {it.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.content} alt="" className="max-h-[520px] w-full rounded-md object-cover" />
                  ) : (
                    <VideoPlayer src={it.content} poster={it.thumbnailUrl ?? undefined} />
                  )}
                </MediaBackdrop>
              </div>
            ))}
          </div>

          {activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); scrollToIndex(activeIndex - 1); }}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <IoChevronBack size={18} />
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); scrollToIndex(activeIndex + 1); }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <IoChevronForward size={18} />
            </button>
          )}

          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            {items.map((it, i) => (
              <span
                key={it.id}
                className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Action row ── */}
      <footer className="flex items-center gap-2 pt-0.5">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold hover:bg-border/50 transition-colors ${
            isLiked ? "text-red-500" : "text-text"
          }`}
        >
          {isLiked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
          {likeCount}
        </button>

        {/* Comment → opens post detail */}
        <button
          onClick={() => openDetail()}
          className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-text hover:bg-border/50"
        >
          <IoChatbubbleEllipsesOutline size={18} />
          {active.commentCount}
        </button>

        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
          className={`flex items-center justify-center rounded-full bg-feed-bg p-1.5 hover:bg-border/50 ${
            isBookmarked ? "text-[#D4A400]" : "text-text"
          }`}
        >
          {isBookmarked ? <IoBookmark size={18} /> : <IoBookmarkOutline size={18} />}
        </button>

        {/* Repost */}
        {!isOwnPost && (
          <button
            onClick={(e) => { e.stopPropagation(); notify("Repost is coming soon"); }}
            className="flex items-center justify-center rounded-full bg-feed-bg p-1.5 text-text hover:bg-border/50"
          >
            <FaRetweet size={17} />
          </button>
        )}

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); notify("Share is coming soon"); }}
          className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-text hover:bg-border/50"
        >
          <IoShareOutline size={18} />
          Share
        </button>
      </footer>
    </article>
  );
}
