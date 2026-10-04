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
import { profileUrl, postUrl } from "@/lib/url";

function MediaBackdrop({ bgSrc, children, isVideo = false }: { bgSrc?: string | null; children: ReactNode; isVideo?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-md ${isVideo ? "" : "bg-zinc-900"}`}>
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

  // Follow state for the post's author — seeded from the feed response so it
  // survives a page refresh without showing "Follow" for accounts we already follow.
  const [isFollowing, setIsFollowing] = useState(head.isFollowingAuthor ?? false);
  const followLoadingRef = useRef(false);
  const [hidden, setHidden] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      router.push(postUrl(items[0].id));
    }
  }

  if (hidden) return null;

  return (
    <article className={`border-b border-border bg-background px-4 hover:bg-feed-bg/50 ${compact ? "py-2.5" : "py-3.5"} flex flex-col`}>

      {/* ── Header row: avatar + name + follow + ellipsis ── */}
      <header className="mb-2 flex items-center gap-2">
        <button onClick={openProfile} className="flex-shrink-0">
          {head.userPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={head.userPhoto} alt={head.userName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-300" />
          )}
        </button>
        <button onClick={openProfile} className="min-w-0 flex-1 text-left">
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
        {!isOwnPost && (
          <button
            onClick={handleToggleFollow}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
              isFollowing
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
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

                {/* Own post actions */}
                {isOwnPost && (
                  <>
                    <button
                      onClick={() => { setMenuOpen(false); router.push(`/boost/${head.id}`); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoRocketOutline size={16} className="text-primary flex-shrink-0" />
                      <span className="truncate">Boost Post</span>
                    </button>
                    <button
                      onClick={handlePin}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoPinOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Pin to your profile</span>
                    </button>
                    <button
                      onClick={handleViewActivity}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoStatsChartOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">View post activity</span>
                    </button>
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-feed-bg transition-colors"
                      >
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

                {/* Other user's post actions */}
                {!isOwnPost && (
                  <>
                    <button
                      onClick={handleNotInterested}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoThumbsDownOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Not interested in this post</span>
                    </button>
                    <button
                      onClick={handleMoreLikeThis}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoThumbsUpOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">More like this</span>
                    </button>
                    <button
                      onClick={(e) => { handleToggleFollow(e); setMenuOpen(false); }}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      {isFollowing
                        ? <IoPersonRemoveOutline size={16} className="text-light-text flex-shrink-0" />
                        : <IoPersonAddOutline size={16} className="text-light-text flex-shrink-0" />}
                      <span className="truncate">{isFollowing ? `Unfollow @${head.userName}` : `Follow @${head.userName}`}</span>
                    </button>
                    <button
                      onClick={handleMute}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoVolumeMuteOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Mute @{head.userName}</span>
                    </button>
                    <button
                      onClick={handleBlock}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoBanOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Block @{head.userName}</span>
                    </button>
                    <button
                      onClick={handleViewActivity}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoStatsChartOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">View post activity</span>
                    </button>
                    <button
                      onClick={handleEmbedPost}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                    >
                      <IoCodeSlashOutline size={16} className="text-light-text flex-shrink-0" />
                      <span className="truncate">Embed post</span>
                    </button>
                    <button
                      onClick={handleReport}
                      className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-feed-bg transition-colors"
                    >
                      <IoFlagOutline size={16} className="flex-shrink-0" />
                      <span className="truncate">Report post</span>
                    </button>
                  </>
                )}

                {/* Always: copy link */}
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

      {/* ── Content indented to align with name ── */}
      <div className="ml-10">

        {/* Caption — always full width */}
        {(active.caption || active.type === "text") && (
          <button onClick={() => openDetail()} className="mb-2 block w-full text-left">
            <p className="whitespace-pre-wrap text-[13px] font-medium leading-[18px] text-text">
              <LinkText text={active.caption ?? active.content} />
            </p>
          </button>
        )}

        {/* Media + action buttons side by side, buttons hug the media */}
        {!compact && hasMedia && (
          <div className="flex gap-6">
            {/* Media column — shrinks to content so buttons stay close */}
            <div className="min-w-0 shrink">
              {items.length === 1 && active.type === "image" && (
                <div className="mb-2">
                  <MediaBackdrop bgSrc={active.content}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={active.content} alt="" className="max-h-[520px] max-w-full cursor-pointer rounded-md object-cover" onClick={() => openDetail()} />
                  </MediaBackdrop>
                </div>
              )}
              {items.length === 1 && active.type === "video" && (
                <VideoPlayer src={active.content} poster={active.thumbnailUrl ?? undefined} />
              )}
              {items.length > 1 && (
                <div className="relative mb-2">
                  <div ref={scrollRef} onScroll={handleScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
                    {items.filter((it) => it.type === "image" || it.type === "video").map((it) => (
                      <div key={it.id} className="w-full flex-shrink-0 snap-center" onPointerDown={onCarouselPointerDown} onPointerUp={(e) => onCarouselPointerUp(e, it)}>
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
                    <button onClick={(e) => { e.stopPropagation(); scrollToIndex(activeIndex - 1); }} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                      <IoChevronBack size={18} />
                    </button>
                  )}
                  {activeIndex < items.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); scrollToIndex(activeIndex + 1); }} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
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

            {/* Vertical action buttons — right next to media */}
            <div className="flex flex-shrink-0 flex-col items-center justify-center self-stretch gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <button onClick={handleLike} className={`flex items-center justify-center rounded-2xl bg-feed-bg/60 p-2.5 transition-colors ${isLiked ? "text-red-500" : "text-light-text"}`}>
                  {isLiked ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
                </button>
                <span className="text-[11px] font-bold tabular-nums text-light-text">{likeCount}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <button onClick={() => openDetail()} className="flex items-center justify-center rounded-2xl bg-feed-bg/60 p-2.5 text-light-text transition-colors">
                  <IoChatbubbleEllipsesOutline size={20} />
                </button>
                <span className="text-[11px] font-bold tabular-nums text-light-text">{active.commentCount}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(); }} className={`flex items-center justify-center rounded-2xl bg-feed-bg/60 p-2.5 transition-colors ${isBookmarked ? "text-[#D4A400]" : "text-light-text"}`}>
                {isBookmarked ? <IoBookmark size={20} /> : <IoBookmarkOutline size={20} />}
              </button>
              {!isOwnPost && (
                <button onClick={(e) => { e.stopPropagation(); notify("Repost is coming soon"); }} className="flex items-center justify-center rounded-2xl bg-feed-bg/60 p-2.5 text-light-text transition-colors">
                  <FaRetweet size={19} />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); notify("Share is coming soon"); }} className="flex items-center justify-center rounded-2xl bg-feed-bg/60 p-2.5 text-light-text transition-colors">
                <IoShareOutline size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Horizontal actions for text-only posts */}
        {!compact && !hasMedia && (
          <footer className="flex items-center gap-2 pt-0.5">
            <button onClick={handleLike} className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold hover:bg-border/50 transition-colors ${isLiked ? "text-red-500" : "text-light-text"}`}>
              {isLiked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
              {likeCount}
            </button>
            <button onClick={() => openDetail()} className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-light-text hover:bg-border/50">
              <IoChatbubbleEllipsesOutline size={18} />
              {active.commentCount}
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark(); }} className={`flex items-center justify-center rounded-full bg-feed-bg p-1.5 hover:bg-border/50 ${isBookmarked ? "text-[#D4A400]" : "text-light-text"}`}>
              {isBookmarked ? <IoBookmark size={18} /> : <IoBookmarkOutline size={18} />}
            </button>
            {!isOwnPost && (
              <button onClick={(e) => { e.stopPropagation(); notify("Repost is coming soon"); }} className="flex items-center justify-center rounded-full bg-feed-bg p-1.5 text-light-text hover:bg-border/50">
                <FaRetweet size={17} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); notify("Share is coming soon"); }} className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-light-text hover:bg-border/50">
              <IoShareOutline size={18} />
              Share
            </button>
          </footer>
        )}
      </div>

    </article>
  );
}
