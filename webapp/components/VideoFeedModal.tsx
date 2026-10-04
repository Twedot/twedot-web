"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IoCloseOutline, IoHeartOutline, IoHeart,
  IoChatbubbleOutline, IoBookmarkOutline, IoBookmark,
  IoShareOutline, IoChevronUpOutline,
} from "react-icons/io5";
import { FaRetweet } from "react-icons/fa";
import { videoFeedStore } from "@/lib/videoFeedStore";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiPost, apiDelete } from "@/lib/api";
import { useBookmark } from "@/lib/bookmarks";
import { useRouter } from "next/navigation";
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
  const isOwn = user?.id === video.userId;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) { el.play().catch(() => {}); }
    else { el.pause(); el.currentTime = 0; }
  }, [active]);

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
        onClick={(e) => e.stopPropagation()}
      />

      {/* Top + bottom gradients */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/85 to-transparent" />

      {/* Right action rail */}
      <div className="absolute bottom-36 right-3 z-10 flex flex-col items-center gap-5">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ${liked ? "text-red-400" : "text-white"}`}
          >
            {liked ? <IoHeart size={24} /> : <IoHeartOutline size={24} />}
          </button>
          <span className="text-[12px] font-bold text-white drop-shadow">{likes}</span>
        </div>
        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => { videoFeedStore.close(); router.push(postUrl(video.id)); }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <IoChatbubbleOutline size={22} />
          </button>
          <span className="text-[12px] font-bold text-white drop-shadow">{video.commentCount ?? 0}</span>
        </div>
        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ${isBookmarked ? "text-yellow-300" : "text-white"}`}
        >
          {isBookmarked ? <IoBookmark size={22} /> : <IoBookmarkOutline size={22} />}
        </button>
        {/* Repost */}
        {!isOwn && (
          <button
            onClick={(e) => { e.stopPropagation(); notify("Repost coming soon"); }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <FaRetweet size={21} />
          </button>
        )}
        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); notify("Share coming soon"); }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"
        >
          <IoShareOutline size={22} />
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-8 left-0 z-10 pr-20 pl-4 w-full">
        {/* Profile row */}
        <div className="mb-3 flex items-center gap-3">
          {/* Avatar with + overlay */}
          <div className="relative flex-shrink-0">
            <button onClick={() => { videoFeedStore.close(); router.push(profileUrl(video.userName, video.userId)); }}>
              {video.userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.userPhoto} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/40" />
              ) : (
                <div className="h-11 w-11 rounded-full bg-white/20 ring-2 ring-white/40" />
              )}
            </button>
            {!isOwn && !following && (
              <button
                onClick={handleFollow}
                className="absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#6B4EFF] text-white"
              >
                <span className="text-[14px] font-black leading-none">+</span>
              </button>
            )}
          </div>

          {/* Name + rank + occupation */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[14px] font-bold text-white drop-shadow">{video.userName}</span>
              <RankBadge activityScore={video.userGlobalActivityScore ?? 0} rankVisible={video.userRankVisible} className="opacity-90" />
            </div>
            {video.userOccupation && (
              <p className="text-[11px] text-white/70">{video.userOccupation}</p>
            )}
          </div>

          {/* Follow button */}
          {!isOwn && (
            <button
              onClick={handleFollow}
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-[12px] font-bold transition-colors ${
                following
                  ? "border-white/40 text-white/60"
                  : "border-white text-white hover:bg-white/10"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Caption */}
        {video.caption && (
          <p className="text-[13px] leading-relaxed text-white/90 line-clamp-3">
            <LinkText text={video.caption} />
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (vids.length > 1) {
          setShowHint(true);
          if (hintTimer.current) clearTimeout(hintTimer.current);
          hintTimer.current = setTimeout(() => setShowHint(false), 3500);
        }
      }
    });
  }, []);

  // Jump to start video when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = startIdx * el.clientHeight;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const h = el.clientHeight;
    if (!h) return;
    const idx = Math.round(el.scrollTop / h);
    setCurrentIdx(idx);
  }, []);

  if (!isOpen || videos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black md:hidden">

      {/* Top bar — stays above the scroller */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="pointer-events-auto flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => videoFeedStore.close()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <IoCloseOutline size={22} />
          </button>
          <div className="flex items-center gap-6">
            <span className="border-b-2 border-white pb-0.5 text-[15px] font-bold text-white">Stories</span>
            <span className="text-[15px] text-white/50">Following</span>
          </div>
        </div>
      </div>

      {/* Scrollable video list with snap */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory"
      >
        {videos.map((video, i) => (
          <div key={video.id} className="relative snap-start" style={{ height: "100dvh" }}>
            <VideoSlide video={video} active={i === currentIdx} />
          </div>
        ))}
      </div>

      {/* Swipe up hint */}
      {showHint && videos.length > 1 && (
        <div
          className="pointer-events-none absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 transition-opacity duration-700"
          style={{ opacity: showHint ? 1 : 0 }}
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
