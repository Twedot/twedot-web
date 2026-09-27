"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { postDetailStore } from "@/lib/postDetailStore";
import {
  IoLocationOutline,
  IoLinkOutline,
  IoTimeOutline,
  IoCopyOutline,
  IoCheckmarkCircleOutline,
  IoWalletOutline,
  IoPersonAddOutline,
  IoGridOutline,
  IoBookmarkOutline,
  IoHeartOutline,
  IoHeartOutline as IoHeartO,
  IoChatbubbleOutline,
  IoEyeOutline,
  IoPencilOutline,
  IoPersonOutline,
  IoTrophyOutline,
  IoShareSocialOutline,
  IoCreateOutline,
  IoPlayCircle,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet } from "@/lib/api";
import RankBadge from "@/components/RankBadge";
import type { StatusPost } from "@/lib/types";

interface MyRoom {
  id: string;
  name: string;
  photo_url: string | null;
  my_role: "admin" | "member";
  creator_id: string;
}

const WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHour(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return value;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatBusinessHours(
  workingDays: string | null | undefined,
  openingTime: string,
  closingTime: string
): string {
  const openLabel = formatHour(openingTime);
  const closeLabel = formatHour(closingTime);
  const days = (workingDays ?? "").split(",").filter(Boolean);
  const indices = days
    .map((d) => WEEK_ORDER.indexOf(d))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (indices.length === 0) return `${openLabel} – ${closeLabel}`;
  const startDay = WEEK_ORDER[indices[0]];
  const endDay = WEEK_ORDER[indices[indices.length - 1]];
  return indices.length === 1
    ? `${startDay} ${openLabel} – ${closeLabel}`
    : `${startDay} ${openLabel} – ${endDay} ${closeLabel}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

type ProfileTab = "posts" | "bookmarks" | "liked";

function deduplicateByGroup(items: StatusPost[]): StatusPost[] {
  const seen = new Set<string>();
  const out: StatusPost[] = [];
  for (const p of items) {
    if (p.groupId) {
      if (seen.has(p.groupId)) continue;
      seen.add(p.groupId);
    }
    out.push(p);
  }
  return out;
}

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<StatusPost[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUser().catch(() => {});
    apiGet<any>("/users/me/invite-token")
      .then((res) => {
        const token = res?.data?.token ?? res?.token ?? (typeof res === "string" ? res : null);
        if (token) setInviteToken(token);
      })
      .catch(() => {});
    apiGet<any>("/rooms/mine")
      .then((res) => {
        const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setRooms(arr);
      })
      .catch(() => {});
    // correct endpoint: /status/me returns the caller's own posts
    apiGet<StatusPost[]>("/status/me")
      .then((res) => { if (Array.isArray(res)) setPosts(res); })
      .catch(() => {});
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "liked" || !isAuthenticated) return;
    apiGet<StatusPost[]>("/status/liked")
      .then((res) => { if (Array.isArray(res)) setLikedPosts(res); })
      .catch(() => {});
  }, [activeTab, isAuthenticated]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteToken) { notify("Still generating your link — try again in a moment."); return; }
    const url = `https://twedot.com/u/${encodeURIComponent(inviteToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Link: " + url);
    }
  }, [inviteToken, notify]);

  const handleShareProfile = useCallback(async () => {
    if (!inviteToken) { notify("Still generating your link — try again in a moment."); return; }
    const url = `https://twedot.com/u/${encodeURIComponent(inviteToken)}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as any).share({ title: user?.name ?? "Twedot", url }).catch(() => {});
    } else {
      await handleCopyLink();
    }
  }, [inviteToken, user?.name, handleCopyLink]);

  if (isLoading || !user) return null;

  const opening = user.opening_time as string | null | undefined;
  const closing = user.closing_time as string | null | undefined;
  const hasBusinessHours = !!(opening && closing);
  const likesCount = posts.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);
  const dedupedPosts = deduplicateByGroup(posts);
  const dedupedLiked = deduplicateByGroup(likedPosts);
  const displayedPosts = activeTab === "posts" ? dedupedPosts : activeTab === "liked" ? dedupedLiked : [];

  return (
    <div className="flex flex-col pb-12">

      {/* ── Profile header — left avatar / right info ── */}
      <div className="flex gap-5 px-6 pb-5 pt-7">
        {/* Avatar column */}
        <div className="relative flex-shrink-0">
          {user.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_photo_url}
              alt={user.name ?? ""}
              className="h-[100px] w-[100px] rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
              <IoPersonOutline size={44} className="text-primary" />
            </div>
          )}
          <button
            onClick={() => notify("Update your profile in the Twedot app")}
            className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary shadow"
          >
            <IoPencilOutline size={12} className="text-white" />
          </button>
        </div>

        {/* Info column */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold leading-tight text-text">
              {user.name ?? "No name set"}
            </h2>
            {/* eye + views */}
            <span className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-light-text">
              <IoEyeOutline size={14} />
              {fmt(user.profile_view_count ?? 0)}
            </span>
          </div>

          {user.occupation && (
            <p className="text-[14px] text-light-text">{user.occupation}</p>
          )}

          <RankBadge
            activityScore={user.global_activity_score ?? 0}
            rankVisible={user.rank_visible !== false}
            plain={false}
            className="mt-0.5"
          />

          {/* Inline info chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {(user.city || user.country) && (
              <span className="flex items-center gap-1 text-[12px] text-light-text">
                <IoLocationOutline size={13} className="flex-shrink-0 text-primary" />
                {[user.city, user.country].filter(Boolean).join(", ")}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-primary hover:underline"
              >
                <IoLinkOutline size={13} className="flex-shrink-0" />
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {hasBusinessHours && (
              <span className="flex items-center gap-1 text-[12px] text-light-text">
                <IoTimeOutline size={13} className="flex-shrink-0 text-primary" />
                {formatBusinessHours(user.working_days as string | null, opening!, closing!)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="mx-6 flex">
        <StatCell value="0" label="Followers" />
        <StatCell value="0" label="Following" />
        <StatCell value={fmt(likesCount)} label="Likes" />
      </div>

      {/* ── Bio ── */}
      {user.bio && (
        <p className="mx-6 mt-4 text-[14px] leading-[21px] text-text">{user.bio}</p>
      )}

      {/* ── Action buttons ── */}
      <div className="mx-6 mt-4 flex gap-2">
        <button
          onClick={() => router.push("/settings/profile")}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary/90"
        >
          <IoCreateOutline size={15} />
          Edit profile
        </button>
        <button
          onClick={handleShareProfile}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-text hover:bg-feed-bg"
        >
          <IoShareSocialOutline size={15} />
          Share
        </button>
        <button
          onClick={() => notify("Invite a friend is coming soon")}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border text-text hover:bg-feed-bg"
        >
          <IoPersonAddOutline size={17} />
        </button>
      </div>

      {/* ── Profile link + Balance ── */}
      <div className="mx-6 mt-4 flex items-center gap-2">
        <IoLinkOutline size={13} className="flex-shrink-0 text-primary" />
        <span className="flex-1 truncate text-[12px] text-light-text">
          twedot.com/u/{inviteToken ?? "…"}
        </span>
        <button
          onClick={handleCopyLink}
          title={copied ? "Copied!" : "Copy link"}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors"
        >
          {copied
            ? <IoCheckmarkCircleOutline size={15} />
            : <IoCopyOutline size={13} />}
        </button>
        <button
          onClick={() => notify("Wallet is coming soon on web")}
          className="flex items-center gap-1.5 rounded-full bg-feed-bg px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-border/50"
        >
          <IoWalletOutline size={13} />
          Balance
        </button>
      </div>

      {/* ── My Channels ── */}
      {rooms.length > 0 && (
        <div className="mx-6 mt-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">
            My Channels
          </p>
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => notify("Rooms are coming soon on web")}
                className="flex flex-shrink-0 flex-col items-center gap-1.5"
              >
                <div className="relative">
                  {room.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.photo_url}
                      alt={room.name}
                      className="h-[64px] w-[64px] rounded-full border-2 border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-2 border-border bg-feed-bg text-[22px] font-bold text-light-text">
                      {room.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {room.creator_id === user.id && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-white bg-black">
                      <IoTrophyOutline size={10} className="text-yellow-400" />
                    </div>
                  )}
                </div>
                <span className="w-[68px] truncate text-center text-[11px] font-semibold text-text">
                  {room.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Posts / Bookmarks / Liked tabs ── */}
      <div className="mt-6 flex border-b border-t border-border">
        <TabBtn
          active={activeTab === "posts"}
          label={`Posts${dedupedPosts.length > 0 ? ` ${dedupedPosts.length}` : ""}`}
          icon={<IoGridOutline size={20} />}
          onClick={() => setActiveTab("posts")}
        />
        <TabBtn
          active={activeTab === "bookmarks"}
          label="Bookmarks"
          icon={<IoBookmarkOutline size={20} />}
          onClick={() => setActiveTab("bookmarks")}
        />
        <TabBtn
          active={activeTab === "liked"}
          label="Liked"
          icon={<IoHeartOutline size={20} />}
          onClick={() => setActiveTab("liked")}
        />
      </div>

      {/* ── Tab content ── */}
      {activeTab === "bookmarks" ? (
        <EmptyTabState
          icon={<IoBookmarkOutline size={36} className="text-light-text" />}
          title="Saved posts"
          body="Open the Twedot app to see your bookmarked posts"
        />
      ) : displayedPosts.length === 0 ? (
        activeTab === "liked" ? (
          <EmptyTabState
            icon={<IoHeartOutline size={36} className="text-light-text" />}
            title="No liked posts yet"
            body="Posts you like will show up here"
          />
        ) : (
          <EmptyTabState
            icon={<IoGridOutline size={36} className="text-light-text" />}
            title="Nothing here yet"
            body="Share your first post in the Twedot app to see it here"
          />
        )
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-1.5 px-4">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => {
                postDetailStore.set(post);
                router.push(`/status/${post.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 py-1">
      <span className="text-[22px] font-bold leading-tight text-text">{value}</span>
      <span className="text-[11px] text-light-text">{label}</span>
    </div>
  );
}

function PostCard({ post, onClick }: { post: StatusPost; onClick?: () => void }) {
  const hasMedia = !!post.thumbnailUrl;
  return (
    <button className="flex flex-col text-left" onClick={onClick}>
      <div className="relative overflow-hidden rounded-xl bg-feed-bg w-full" style={{ aspectRatio: "1/1" }}>
        {hasMedia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnailUrl!} alt={post.caption ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black p-3">
            <p className="line-clamp-6 text-center text-[12px] leading-[17px] text-white">
              {post.caption ?? post.content}
            </p>
          </div>
        )}
        {post.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <IoPlayCircle size={26} className="text-white/90 drop-shadow-lg" />
          </div>
        )}
      </div>
      {/* Caption + stats below */}
      <div className="mt-1 px-0.5">
        {post.caption && (
          <p className="line-clamp-2 text-[9px] leading-[13px] text-light-text">{post.caption}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-[9px] text-light-text">
          <span className="flex items-center gap-0.5"><IoHeartO size={9} />{fmt(post.likeCount)}</span>
          <span className="flex items-center gap-0.5"><IoChatbubbleOutline size={9} />{fmt(post.commentCount)}</span>
          <span className="flex items-center gap-0.5"><IoEyeOutline size={9} />{fmt(post.viewCount)}</span>
        </div>
      </div>
    </button>
  );
}

function TabBtn({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors ${
        active ? "text-text" : "text-light-text hover:text-text"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-text" />
      )}
    </button>
  );
}

function EmptyTabState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon}
      <p className="text-[15px] font-semibold text-text">{title}</p>
      <p className="text-[13px] leading-[19px] text-light-text">{body}</p>
    </div>
  );
}
