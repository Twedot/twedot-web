"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IoCloseOutline, IoHeartOutline, IoHeart,
  IoChatbubbleOutline, IoBookmarkOutline, IoBookmark,
  IoShareOutline, IoChevronUpOutline, IoPlay,
  IoPlayBack, IoPlayForward,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { videoFeedStore } from "@/lib/videoFeedStore";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiPost, apiDelete } from "@/lib/api";
import { useBookmark } from "@/lib/bookmarks";
import { usePathname, useRouter } from "next/navigation";
import { profileUrl, postUrl } from "@/lib/url";
import type { StatusPost } from "@/lib/types";
import LinkText from "./LinkText";
import RankBadge from "./RankBadge";

function VideoSlide({ video, active }: { video: StatusPost; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(video.id);
  const [following, setFollowing] = useState(video.isFollowingAuthor ?? false);
  const [liked, setLiked] = useState(video.isLiked ?? false);
  const [likes, setLikes] = useState(video.likeCount ?? 0);
  const [paused, setPaused] = useState(false);
  const [seekDir, setSeekDir] = useState<"forward" | "backward" | null>(null);
  const [seekSecs, setSeekSecs] = useState(0);
  const isOwn = user?.id === video.userId;

  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSeekRef = useRef(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) { el.play().catch(() => {}); setPaused(false); }
    else { el.pause(); el.currentTime = 0; setPaused(false); }
  }, [active]);

  function clearSeek() {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    if (seekIntervalRef.current) clearInterval(seekIntervalRef.current);
    seekTimerRef.current = null;
    seekIntervalRef.current = null;
    setSeekDir(null);
    setSeekSecs(0);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLVideoElement>) {
    e.stopPropagation();
    didSeekRef.current = false;
    const isRight = e.clientX > (e.currentTarget.clientWidth / 2);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };

    seekTimerRef.current = setTimeout(() => {
      const dir = isRight ? "forward" : "backward";
      setSeekDir(dir);
      didSeekRef.current = true;
      let total = 0;
      seekIntervalRef.current = setInterval(() => {
        const el = videoRef.current;
        if (!el) return;
        const step = isRight ? 5 : -5;
        el.currentTime = Math.max(0, Math.min(el.duration || 9999, el.currentTime + step));
        total += 5;
        setSeekSecs(total);
      }, 400);
    }, 280);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointerStartRef.current || didSeekRef.current) return;
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dy > 12) clearSeek(); // cancel if swiping vertically
  }

  function handlePointerUp(e: React.PointerEvent) {
    e.stopPropagation();
    const wasSeeking = didSeekRef.current;
    clearSeek();
    pointerStartRef.current = null;
    didSeekRef.current = false;

    if (!wasSeeking) {
      // Short tap → toggle play
      const el = videoRef.current;
      if (!el) return;
      if (el.paused) { el.play().catch(() => {}); setPaused(false); }
      else { el.pause(); setPaused(true); }
    }
  }

  async function handleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    const was = following;
    setFollowing(!was);
    try {
      if (was) await apiDelete(`/users/follow/${video.userId}`);
      else await apiPost(`/users/follow/${video.userId}`, {});
    } catch { setFollowing(was); }
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const now = !liked;
    setLiked(now);
    setLikes(c => c + (now ? 1 : -1));
  }

  return (
    <>
      {/* Video */}
      <video
        ref={videoRef}
        src={video.content}
        poster={video.thumbnailUrl ?? undefined}
        loop playsInline
        className="absolute inset-0 h-full w-full object-cover"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {/* Tap-to-pause indicator */}
      {paused && !seekDir && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <IoPlay size={30} className="ml-1 text-white" />
          </div>
        </div>
      )}
      {/* Hold-to-seek overlay */}
      {seekDir === "backward" && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 flex items-center justify-center bg-black/20">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center">
              <IoPlayBack size={38} className="text-white drop-shadow" />
              <IoPlayBack size={38} className="text-white drop-shadow" />
            </div>
            <span className="text-[13px] font-bold text-white drop-shadow">{seekSecs}s</span>
          </div>
        </div>
      )}
      {seekDir === "forward" && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 flex items-center justify-center bg-black/20">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center">
              <IoPlayForward size={38} className="text-white drop-shadow" />
              <IoPlayForward size={38} className="text-white drop-shadow" />
            </div>
            <span className="text-[13px] font-bold text-white drop-shadow">{seekSecs}s</span>
          </div>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/85 to-transparent" />

      {/* Right rail: avatar → like → comment → bookmark → repost → share */}
      <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-4">
        {/* Avatar with + follow button */}
        <div className="relative mb-1">
          <button onClick={() => router.push(profileUrl(video.userName, video.userId))}>
            {video.userPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.userPhoto} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/20 ring-2 ring-white/40" />
            )}
          </button>
          {!isOwn && !following && (
            <button
              onClick={handleFollow}
              className="absolute -bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#22C55E] text-white"
            >
              <span className="text-[13px] font-black leading-none">+</span>
            </button>
          )}
        </div>

        {/* Like */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={handleLike}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ${liked ? "text-red-400" : "text-white"}`}
          >
            {liked ? <IoHeart size={24} /> : <IoHeartOutline size={24} />}
          </button>
          <span className="text-[12px] font-bold text-white drop-shadow">{likes}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => router.push(postUrl(video.id))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <IoChatbubbleOutline size={22} />
          </button>
          <span className="text-[12px] font-bold text-white drop-shadow">{video.commentCount ?? 0}</span>
        </div>

        {/* Bookmark */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ${isBookmarked ? "text-yellow-300" : "text-white"}`}
          >
            {isBookmarked ? <IoBookmark size={22} /> : <IoBookmarkOutline size={22} />}
          </button>
        </div>

        {/* Repost */}
        {!isOwn && (
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); notify("Repost coming soon"); }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
            >
              <FaRetweet size={21} />
            </button>
          </div>
        )}

        {/* Share */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const url = window.location.origin + postUrl(video.id);
              try {
                if (navigator.share) {
                  await navigator.share({ url });
                } else {
                  await navigator.clipboard.writeText(url);
                  notify("Link copied");
                }
              } catch { /* user cancelled */ }
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <IoShareOutline size={22} />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow">Share</span>
        </div>
      </div>

      {/* Bottom-left info: @username · rank · follow pill · occupation · caption */}
      <div className="absolute bottom-8 left-4 right-20 z-10">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => router.push(profileUrl(video.userName, video.userId))}
            className="text-[14px] font-bold text-white drop-shadow"
          >
            @{video.userName}
          </button>
          <RankBadge activityScore={video.userGlobalActivityScore ?? 0} rankVisible={video.userRankVisible} className="opacity-90" />
          {!isOwn && (
            <button
              onClick={handleFollow}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                following ? "border-white/40 text-white/50" : "border-white text-white hover:bg-white/10"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        {video.userOccupation && (
          <p className="mb-1.5 text-[11px] text-white/70">{video.userOccupation}</p>
        )}
        {video.caption && (
          <p className="text-[13px] leading-relaxed text-white/90 line-clamp-3">
            <LinkText text={video.caption} onTagClick={() => videoFeedStore.close()} />
          </p>
        )}
      </div>
    </>
  );
}

export default function VideoFeedModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [videos, setVideos] = useState<StatusPost[]>([]);
  const [startIdx, setStartIdx] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [tab, setTab] = useState<"stories" | "following">("stories");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Auto-hide when navigating away (e.g. to post detail or profile).
  // We do NOT call store.close() so that when the user presses Back,
  // the modal re-appears on the feed page at the same video.
  const isFeedPage = pathname === "/stories" || pathname === "/";

  const displayVideos = tab === "following"
    ? videos.filter(v => v.isFollowingAuthor)
    : videos;

  useEffect(() => {
    return videoFeedStore.subscribe(() => {
      const open = videoFeedStore.isOpen;
      const idx = videoFeedStore.currentIndex;
      const vids = [...videoFeedStore.videos];
      setIsOpen(open);
      setVideos(vids);
      if (open) {
        setStartIdx(idx);
        setCurrentIdx(idx);
        setTab("stories");
        if (vids.length > 1) {
          setShowHint(true);
          if (hintTimer.current) clearTimeout(hintTimer.current);
          hintTimer.current = setTimeout(() => setShowHint(false), 3500);
        }
      }
    });
  }, []);

  // Jump to starting video when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = startIdx * el.clientHeight;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // When tab switches, reset scroll to top
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    setCurrentIdx(0);
  }, [tab]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const h = el.clientHeight;
    if (!h) return;
    const idx = Math.round(el.scrollTop / h);
    if (idx !== currentIdx) setCurrentIdx(idx);
  }, [currentIdx]);

  if (!isOpen || videos.length === 0 || !isFeedPage) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black md:hidden">

      {/* Top bar: close + Stories/Following tabs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="pointer-events-auto flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => videoFeedStore.close()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <IoCloseOutline size={22} />
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setTab("stories")}
              className={tab === "stories"
                ? "border-b-2 border-white pb-0.5 text-[15px] font-bold text-white"
                : "text-[15px] text-white/50"}
            >
              Stories
            </button>
            <button
              onClick={() => setTab("following")}
              className={tab === "following"
                ? "border-b-2 border-white pb-0.5 text-[15px] font-bold text-white"
                : "text-[15px] text-white/50"}
            >
              Following
            </button>
          </div>
        </div>
      </div>

      {/* Snap-scrollable video list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0"
        style={{
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        } as React.CSSProperties}
      >
        {displayVideos.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: "100svh" }}>
            <p className="text-sm text-white/50">No videos from people you follow yet</p>
          </div>
        ) : (
          displayVideos.map((video, i) => (
            <div
              key={video.id}
              className="relative"
              style={{
                height: "100svh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              <VideoSlide video={video} active={i === currentIdx} />
            </div>
          ))
        )}
      </div>

      {/* Swipe-up hint */}
      {showHint && displayVideos.length > 1 && (
        <div
          className="pointer-events-none absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1"
          style={{ opacity: 1, transition: "opacity 0.7s ease" }}
        >
          <div className="animate-bounce">
            <IoChevronUpOutline size={26} className="text-white/80" />
          </div>
          <span className="rounded-full bg-black/30 px-3 py-1 text-[12px] font-medium text-white/80 backdrop-blur-sm">
            Swipe up for next
          </span>
        </div>
      )}
    </div>
  );
}
