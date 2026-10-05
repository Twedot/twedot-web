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
  IoRocketOutline,
  IoPersonRemoveOutline,
  IoPersonAddOutline,
  IoBanOutline,
  IoFlagOutline,
  IoTrashOutline,
  IoThumbsDownOutline,
  IoVolumeMuteOutline,
  IoStatsChartOutline,
  IoCodeSlashOutline,
  IoPinOutline,
  IoThumbsUpOutline,
  IoPlay,
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
import { videoFeedStore } from "@/lib/videoFeedStore";
import type { StatusPost } from "@/lib/types";
import { profileUrl, postUrl } from "@/lib/url";

function MediaBackdrop({ bgSrc, children, isVideo = false }: { bgSrc?: string | null; children: ReactNode; isVideo?: boolean }) {
  return (
    <div className={`relative overflow-hidden ${isVideo ? "" : "bg-zinc-900"}`}>
      {bgSrc && !isVideo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
        />
      )}
      <div className="relative">{children}</div>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const head = items[0];
  const active = items[activeIndex] ?? head;

  const { user } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const { socket } = useJobSocket();
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(active.id);
  const isOwnPost = user?.id === head.userId;
  const hasMedia = items.some((it) => it.type === "image" || it.type === "video");
  const isVideoPost = items.length === 1 && active.type === "video";

  const [isFollowing, setIsFollowing] = useState(head.isFollowingAuthor ?? false);
  const followLoadingRef = useRef(false);
  const [hidden, setHidden] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [isLiked, setIsLiked] = useState(active.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(active.likeCount ?? 0);

  useEffect(() => {
    setIsLiked(active.isLiked ?? false);
    setLikeCount(active.likeCount ?? 0);
  }, [active.id, active.isLiked, active.likeCount]);

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
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    socket.emit("like_status", { statusId: active.id, statusOwnerId: active.userId });
  }

  function openDetail(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (items.length > 1) postDetailStore.setGroup(items);
    postDetailStore.set(active);
    router.push(postUrl(items[0].id));
  }

  function openProfile(e: React.MouseEvent) {
    e.stopPropagation();
    if (user?.id === head.userId) {
      router.push("/profile");
    } else {
      router.push(profileUrl(head.userName, head.userId));
    }
  }

  function openVideo(e: React.MouseEvent) {
    e.stopPropagation();
    // Mobile: open TikTok-style full-screen player; desktop: open detail page
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      videoFeedStore.open(active.id);
    } else {
      openDetail(e);
    }
  }

  const handleToggleFollow = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoadingRef.current) return;
    followLoadingRef.current = true;
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      if (wasFollowing) await apiDelete(`/users/follow/${head.userId}`);
      else await apiPost(`/users/follow/${head.userId}`, {});
    } catch {
      setIsFollowing(wasFollowing);
      notify("Something went wrong. Please try again.");
    } finally {
      followLoadingRef.current = false;
    }
  }, [isFollowing, head.userId, notify]);

  async function handleNotInterested() {
    setMenuOpen(false);
    setHidden(true);
    try { await apiPost(`/status/${head.id}/hide`, {}); } catch { /* silent */ }
  }

  async function handleMoreLikeThis() {
    setMenuOpen(false);
    try {
      await apiPost(`/status/${head.id}/more-like-this`, {});
      notify("Got it — we'll show you more like this");
    } catch {
      notify("Got it — we'll show you more like this");
    }
  }

  async function handleBlock() {
    setMenuOpen(false);
    try {
      await apiPost(`/users/block/${head.userId}`, {});
      setHidden(true);
      notify(`@${head.userName} blocked`);
    } catch {
      notify("Could not block — try again");
    }
  }

  async function handleReport() {
    setMenuOpen(false);
    try {
      await apiPost(`/status/${head.id}/report`, { reason: "inappropriate" });
      notify("Post reported — thanks for the feedback");
    } catch {
      notify("Post reported");
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    try {
      await apiDelete(`/status/${head.id}`);
      setHidden(true);
      notify("Post deleted");
    } catch {
      notify("Could not delete — try again");
    }
  }

  async function handleMute() {
    setMenuOpen(false);
    try {
      await apiPost(`/users/mute/${head.userId}`, {});
      setHidden(true);
      notify(`@${head.userName} muted`);
    } catch {
      notify("Could not mute — try again");
    }
  }

  async function handlePin() {
    setMenuOpen(false);
    try {
      await apiPost(`/status/${head.id}/pin`, {});
      notify("Post pinned to your profile");
    } catch {
      notify("Could not pin — try again");
    }
  }

  function handleEmbedPost() {
    setMenuOpen(false);
    const embedCode = `<iframe src="${window.location.origin}${postUrl(head.id)}" width="550" height="400" frameborder="0" scrolling="no"></iframe>`;
    navigator.clipboard?.writeText(embedCode).catch(() => {});
    notify("Embed code copied");
  }

  function handleViewActivity() {
    setMenuOpen(false);
    router.push(postUrl(head.id));
  }

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
      router.push(postUrl(items[0].id));
    }
  }

  if (hidden) return null;

  return (
    <article
      id={`post-${head.id}`}
      className={`border-b border-border bg-background hover:bg-feed-bg/50 px-4 ${compact ? "py-2.5" : "py-3"}`}
    >
      {/* ── Header: avatar · name+info · Follow · ··· ── */}
      <header className="mb-2.5 flex items-start gap-2.5">
        {/* Avatar */}
        <button onClick={openProfile} className="mt-0.5 flex-shrink-0">
          {head.userPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={head.userPhoto} alt={head.userName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-zinc-300" />
          )}
        </button>

        {/* Name / rank / occupation · time */}
        <button onClick={openProfile} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-bold leading-tight text-text">{head.userName}</span>
            <RankBadge activityScore={head.userGlobalActivityScore ?? 0} rankVisible={head.userRankVisible} />
          </div>
          <p className="mt-0.5 text-[11px] text-light-text">
            {head.userOccupation ? `${head.userOccupation} · ` : ""}{timeAgo(head.createdAt)}
          </p>
        </button>

        {/* Follow */}
        {!isOwnPost && (
          <button
            onClick={handleToggleFollow}
            className={`mt-0.5 flex-shrink-0 rounded-full px-3.5 py-1 text-[12px] font-bold transition-colors ${
              isFollowing
                ? "border border-border bg-feed-bg text-text hover:bg-border/40"
                : "bg-primary text-white hover:opacity-90"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

        {/* Ellipsis */}
        <div className="relative mt-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
          >
            <IoEllipsisHorizontal size={18} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
              <div className="absolute right-0 top-8 z-20 w-[240px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                {isOwnPost && (
                  <>
                    <button onClick={() => { setMenuOpen(false); router.push(`/boost/${head.id}`); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoRocketOutline size={16} className="text-primary flex-shrink-0" />
                      <span className="truncate">Boost Post</span>
                    </button>
                    <button onClick={handlePin} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoPinOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Pin to your profile</span>
                    </button>
                    <button onClick={handleViewActivity} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoStatsChartOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">View post activity</span>
                    </button>
                    {!confirmDelete ? (
                      <button onClick={() => setConfirmDelete(true)} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-feed-bg transition-colors">
                        <IoTrashOutline size={16} className="flex-shrink-0" />
                        Delete post
                      </button>
                    ) : (
                      <div className="border-t border-border px-4 py-3">
                        <p className="mb-2.5 text-[12px] text-light-text">Delete this post?</p>
                        <div className="flex gap-2">
                          <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[12px] font-bold text-white hover:opacity-90">Delete</button>
                          <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg bg-feed-bg py-1.5 text-[12px] font-semibold text-text hover:bg-border/60">Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isOwnPost && (
                  <>
                    <button onClick={handleNotInterested} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoThumbsDownOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Not interested in this post</span>
                    </button>
                    <button onClick={handleMoreLikeThis} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoThumbsUpOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">More like this</span>
                    </button>
                    <button onClick={(e) => { handleToggleFollow(e); setMenuOpen(false); }} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      {isFollowing
                        ? <IoPersonRemoveOutline size={16} className="text-light-text flex-shrink-0" />
                        : <IoPersonAddOutline size={16} className="text-light-text flex-shrink-0" />}
                      <span className="truncate">{isFollowing ? `Unfollow @${head.userName}` : `Follow @${head.userName}`}</span>
                    </button>
                    <button onClick={handleMute} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoVolumeMuteOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Mute @{head.userName}</span>
                    </button>
                    <button onClick={handleBlock} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoBanOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Block @{head.userName}</span>
                    </button>
                    <button onClick={handleViewActivity} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoStatsChartOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">View post activity</span>
                    </button>
                    <button onClick={handleEmbedPost} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                      <IoCodeSlashOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Embed post</span>
                    </button>
                    <button onClick={handleReport} className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-feed-bg transition-colors">
                      <IoFlagOutline size={16} className="flex-shrink-0" />
                      <span className="truncate">Report post</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setMenuOpen(false); navigator.clipboard?.writeText(window.location.origin + postUrl(head.id)).catch(() => {}); notify("Link copied"); }}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                >
                  <IoShareOutline size={16} className="text-light-text flex-shrink-0" />
                  <span className="truncate">Copy link</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Caption — full width ── */}
      {(active.caption || active.type === "text") && (
        <button onClick={() => openDetail()} className="mb-2.5 block w-full text-left">
          <p className="whitespace-pre-wrap text-[14px] leading-[20px] text-text">
            <LinkText text={active.caption ?? active.content} />
          </p>
        </button>
      )}

      {/* ── Media — full width, natural height ── */}
      {!compact && hasMedia && (
        <div className="mb-2.5 overflow-hidden rounded-xl">
          {/* Single image */}
          {items.length === 1 && active.type === "image" && (
            <MediaBackdrop bgSrc={active.content}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.content}
                alt=""
                className="w-full cursor-pointer object-cover"
                style={{ maxHeight: 560 }}
                onClick={() => openDetail()}
              />
            </MediaBackdrop>
          )}

          {/* Single video — thumbnail + play button on mobile, inline player on desktop */}
          {items.length === 1 && active.type === "video" && (
            <>
              {/* Mobile: tap thumbnail → open full-screen modal */}
              <div className="relative cursor-pointer md:hidden" onClick={openVideo}>
                {active.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.thumbnailUrl}
                    alt=""
                    className="w-full object-cover"
                    style={{ maxHeight: 520 }}
                  />
                ) : (
                  <div className="h-64 w-full bg-zinc-900" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                    <IoPlay size={28} className="ml-1 text-white" />
                  </div>
                </div>
              </div>
              {/* Desktop: inline video player */}
              <div className="hidden md:block">
                <VideoPlayer src={active.content} poster={active.thumbnailUrl ?? undefined} />
              </div>
            </>
          )}

          {/* Carousel */}
          {items.length > 1 && (
            <div className="relative">
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
                        <img src={it.content} alt="" className="w-full object-cover" style={{ maxHeight: 520 }} />
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
                  <span key={it.id} className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action bar — horizontal below content, for all post types ── */}
      {!compact && (
        <footer className="flex items-center gap-1.5 pt-0.5">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-[13px] font-bold transition-colors hover:bg-border/50 ${isLiked ? "text-red-500" : "text-light-text"}`}
          >
            {isLiked ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
            <span>{likeCount}</span>
          </button>
          {/* Comment */}
          <button
            onClick={() => openDetail()}
            className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-[13px] font-bold text-light-text transition-colors hover:bg-border/50"
          >
            <IoChatbubbleEllipsesOutline size={16} />
            <span>{active.commentCount}</span>
          </button>
          {/* Bookmark */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
            className={`flex items-center justify-center rounded-full bg-feed-bg p-[9px] transition-colors hover:bg-border/50 ${isBookmarked ? "text-[#D4A400]" : "text-light-text"}`}
          >
            {isBookmarked ? <IoBookmark size={16} /> : <IoBookmarkOutline size={16} />}
          </button>
          {/* Repost */}
          {!isOwnPost && (
            <button
              onClick={(e) => { e.stopPropagation(); notify("Repost is coming soon"); }}
              className="flex items-center justify-center rounded-full bg-feed-bg p-[9px] text-light-text transition-colors hover:bg-border/50"
            >
              <FaRetweet size={15} />
            </button>
          )}
          {/* Share */}
          <button
            onClick={(e) => { e.stopPropagation(); notify("Share is coming soon"); }}
            className="flex items-center justify-center rounded-full bg-feed-bg p-[9px] text-light-text transition-colors hover:bg-border/50"
          >
            <IoShareOutline size={16} />
          </button>
        </footer>
      )}
    </article>
  );
}
