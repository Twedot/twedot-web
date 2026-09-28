"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IoLocationOutline,
  IoLinkOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoGridOutline,
  IoHeartOutline,
  IoHeartOutline as IoHeartO,
  IoChatbubbleOutline,
  IoEyeOutline,
  IoShareSocialOutline,
  IoPersonAddOutline,
  IoPlayCircle,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import RankBadge from "@/components/RankBadge";
import type { UserProfile, StatusPost } from "@/lib/types";
import { postDetailStore } from "@/lib/postDetailStore";

const WEEK_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHour(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return value;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatBusinessHours(workingDays: string | null | undefined, openingTime: string, closingTime: string): string {
  const openLabel = formatHour(openingTime);
  const closeLabel = formatHour(closingTime);
  const days = (workingDays ?? "").split(",").filter(Boolean);
  const indices = days.map((d) => WEEK_ORDER.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b);
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

export default function OtherUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    apiGet<UserProfile>(`/users/getby_id/${userId}`)
      .then((p) => { setProfile(p); setIsFollowing(p.is_following ?? false); })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this profile."));
    apiGet<StatusPost[]>(`/status/public?authorId=${userId}`)
      .then((res) => { if (Array.isArray(res)) setPosts(res); })
      .catch(() => {});
  }, [isAuthenticated, userId]);

  const handleToggleFollow = useCallback(async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiDelete(`/users/follow/${userId}`);
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, follower_count: Math.max(0, (p.follower_count ?? 1) - 1) } : p);
      } else {
        await apiPost(`/users/follow/${userId}`, {});
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, follower_count: (p.follower_count ?? 0) + 1 } : p);
      }
    } catch {
      notify("Something went wrong. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  }, [followLoading, isFollowing, userId, notify]);

  const handleShareProfile = useCallback(async () => {
    const url = `https://twedot.com/u/${userId}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as any).share({ title: profile?.name ?? "Twedot", url }).catch(() => {});
    } else {
      try { await (navigator as Navigator).clipboard.writeText(url); notify("Link copied!"); } catch { notify("Profile: " + url); }
    }
  }, [userId, profile?.name, notify]);

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div className="flex-1 bg-feed-bg">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const opening = profile.opening_time as string | null | undefined;
  const closing = profile.closing_time as string | null | undefined;
  const hasBusinessHours = !!(opening && closing);
  const dedupedPosts = deduplicateByGroup(posts);
  const likesCount = posts.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);

  return (
    <div className="flex flex-col pb-12">

      {/* ── Profile header ── */}
      <div className="flex gap-5 px-6 pb-5 pt-7">
        <div className="relative flex-shrink-0">
          {profile.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_photo_url}
              alt={profile.name ?? ""}
              className="h-[68px] w-[68px] rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
              <IoPersonOutline size={30} className="text-primary" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold leading-tight text-text">
              {profile.name ?? "Unnamed"}
            </h2>
          </div>

          {profile.occupation && (
            <p className="text-[12px] text-light-text">{profile.occupation}</p>
          )}

          <RankBadge
            activityScore={profile.global_activity_score ?? 0}
            rankVisible={profile.rank_visible !== false}
            plain={false}
            className="mt-0.5"
          />

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {(profile.city || profile.country) && (
              <span className="flex items-center gap-1 text-[12px] text-light-text">
                <IoLocationOutline size={13} className="flex-shrink-0 text-primary" />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-primary hover:underline"
              >
                <IoLinkOutline size={13} className="flex-shrink-0" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {hasBusinessHours && (
              <span className="flex items-center gap-1 text-[12px] text-light-text">
                <IoTimeOutline size={13} className="flex-shrink-0 text-primary" />
                {formatBusinessHours(profile.working_days as string | null, opening!, closing!)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="mx-6 flex">
        <StatCell value={fmt(profile.follower_count ?? 0)} label="Followers" />
        <StatCell value={fmt(profile.following_count ?? 0)} label="Following" />
        <StatCell value={fmt(likesCount)} label="Likes" />
      </div>

      {/* ── Bio ── */}
      {profile.bio && (
        <p className="mx-6 mt-4 text-[14px] leading-[21px] text-text">{profile.bio}</p>
      )}

      {/* ── Action buttons ── */}
      <div className="mx-6 mt-4 flex gap-2">
        <button
          onClick={handleToggleFollow}
          disabled={followLoading}
          className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-60 ${
            isFollowing
              ? "border border-border text-text hover:bg-feed-bg"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          <IoPersonAddOutline size={13} />
          {isFollowing ? "Following" : "Follow"}
        </button>
        <button
          onClick={() => router.push(`/inbox?userId=${userId}`)}
          className="flex items-center gap-1 rounded-full border border-border px-3.5 py-1.5 text-[12px] font-semibold text-text hover:bg-feed-bg"
        >
          Message
        </button>
        <button
          onClick={handleShareProfile}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border text-text hover:bg-feed-bg"
        >
          <IoShareSocialOutline size={14} />
        </button>
      </div>

      {/* ── Posts tab header ── */}
      <div className="mt-6 flex border-b border-t border-border">
        <div className="relative flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-semibold text-text">
          <IoGridOutline size={20} />
          <span>Posts{dedupedPosts.length > 0 ? ` ${dedupedPosts.length}` : ""}</span>
          <span className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-text" />
        </div>
      </div>

      {/* ── Post grid ── */}
      {dedupedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <IoGridOutline size={36} className="text-light-text" />
          <p className="text-[15px] font-semibold text-text">No posts yet</p>
          <p className="text-[13px] leading-[19px] text-light-text">This user hasn't shared any posts</p>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-1.5 px-4">
          {dedupedPosts.map((post) => (
            <ProfilePostCard
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
      <span className="text-[16px] font-bold leading-tight text-text">{value}</span>
      <span className="text-[10px] text-light-text">{label}</span>
    </div>
  );
}

function ProfilePostCard({ post, onClick }: { post: StatusPost; onClick: () => void }) {
  const hasMedia = !!post.thumbnailUrl;
  return (
    <button className="flex flex-col text-left" onClick={onClick}>
      <div className="relative overflow-hidden rounded-xl bg-feed-bg" style={{ aspectRatio: "1/1" }}>
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
