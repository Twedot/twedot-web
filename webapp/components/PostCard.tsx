"use client";

import { useRef, useState } from "react";
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
import LinkText from "./LinkText";
import VideoPlayer from "./VideoPlayer";
import RankBadge from "./RankBadge";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useBookmark } from "@/lib/bookmarks";
import type { StatusPost } from "@/lib/types";

// Narrow (portrait) videos/images don't fill the card width, leaving bare white space
// on either side — this fills that space with a blurred, darkened copy of the media
// itself (thumbnail for video, the image for image posts) instead of plain background,
// the same "blurred backdrop" pattern most apps use for letterboxed media.
function MediaBackdrop({ bgSrc, children }: { bgSrc?: string | null; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-md bg-zinc-900">
      {bgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
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

// `items` holds every StatusPost sharing the same groupId (one deliberate multi-select
// upload) — the mobile app's FullScreenStatusFeed treats these as a single swipeable
// post rather than N separate feed entries, so the web feed groups them the same way
// (see groupPosts in app/feed/page.tsx) and this renders them as one card with a
// horizontally-swipeable media strip instead of duplicating the header/footer per item.
export default function PostCard({ items, compact = false }: { items: StatusPost[]; compact?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const head = items[0];
  const active = items[activeIndex] ?? head;
  const { user } = useAuth();
  const { notify } = useUi();
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(active.id);
  const isOwnPost = user?.id === head.userId;

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

  return (
    <article className={`border-b border-border bg-white px-4 hover:bg-feed-bg ${compact ? "py-2.5" : "py-3.5"}`}>
      <header className="mb-2 flex items-start gap-2">
        {head.userPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={head.userPhoto} alt={head.userName} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-zinc-300" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-medium text-text">{head.userName}</span>
            {head.userOccupation && (
              <>
                <span className="text-[11px] text-light-text">·</span>
                <span className="truncate text-[11px] text-light-text">{head.userOccupation}</span>
              </>
            )}
            <span className="text-[11px] text-light-text">· {timeAgo(head.createdAt)}</span>
          </div>
          <RankBadge activityScore={head.userGlobalActivityScore ?? 0} rankVisible={head.userRankVisible} className="mt-1" />
        </div>
        {!isOwnPost && (
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 rounded-full border border-primary/40 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
          >
            Follow
          </button>
        )}
        <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-light-text hover:bg-feed-bg">
          <IoEllipsisHorizontal size={18} />
        </button>
      </header>

      {(active.caption || active.type === "text") && (
        <p className="mb-2.5 ml-9 whitespace-pre-wrap text-[13px] font-medium leading-[18px] text-text">
          <LinkText text={active.caption ?? active.content} />
        </p>
      )}

      {!compact && items.length === 1 && (active.type === "image" || active.type === "video") && (
        <div className="mb-2">
          <MediaBackdrop bgSrc={active.type === "image" ? active.content : active.thumbnailUrl}>
            {active.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.content} alt="" className="max-h-[520px] w-full rounded-md object-cover" />
            ) : (
              <VideoPlayer src={active.content} poster={active.thumbnailUrl ?? undefined} />
            )}
          </MediaBackdrop>
        </div>
      )}

      {!compact && items.length > 1 && (
        <div className="relative mb-2">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          >
            {items.filter((it) => it.type === "image" || it.type === "video").map((it) => (
              <div key={it.id} className="w-full flex-shrink-0 snap-center">
                <MediaBackdrop bgSrc={it.type === "image" ? it.content : it.thumbnailUrl}>
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
              onClick={() => scrollToIndex(activeIndex - 1)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <IoChevronBack size={18} />
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button
              onClick={() => scrollToIndex(activeIndex + 1)}
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

      <footer className="flex items-center gap-2 pt-0.5">
        <button
          className={`flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold hover:bg-border/50 ${
            active.isLiked ? "text-primary" : "text-text"
          }`}
        >
          {active.isLiked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
          {active.likeCount}
        </button>

        <button className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-text hover:bg-border/50">
          <IoChatbubbleEllipsesOutline size={18} />
          {active.commentCount}
        </button>

        <button
          onClick={toggleBookmark}
          className={`flex items-center justify-center rounded-full bg-feed-bg p-1.5 hover:bg-border/50 ${
            isBookmarked ? "text-[#D4A400]" : "text-text"
          }`}
        >
          {isBookmarked ? <IoBookmark size={18} /> : <IoBookmarkOutline size={18} />}
        </button>

        {!isOwnPost && (
          <button
            onClick={() => notify("Repost is coming soon")}
            className="flex items-center justify-center rounded-full bg-feed-bg p-1.5 text-text hover:bg-border/50"
          >
            <FaRetweet size={17} />
          </button>
        )}

        <button className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-sm font-bold text-text hover:bg-border/50">
          <IoShareOutline size={18} />
          Share
        </button>
      </footer>
    </article>
  );
}
