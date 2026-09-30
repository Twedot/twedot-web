"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoPersonOutline } from "react-icons/io5";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { StatusPost } from "@/lib/types";
import { useUi } from "@/lib/UiContext";
import { postDetailStore } from "@/lib/postDetailStore";
import RankBadge from "./RankBadge";

const FOOTER_LINKS = [
  { label: "About", href: null },
  { label: "Help", href: null },
  { label: "Blog", href: null },
  { label: "Careers", href: null },
  { label: "Press", href: null },
  { label: "Advertise", href: null },
  { label: "Content Policy", href: null },
  { label: "Privacy Policy & Terms of Service", href: "https://twedot.com/privacy" },
];

interface SuggestedUser {
  id: string;
  name: string;
  profile_photo_url: string | null;
  occupation: string | null;
  global_activity_score: number;
  rank_visible: boolean;
  is_following?: boolean;
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

function deduplicateByGroup(items: StatusPost[]): StatusPost[] {
  const seen = new Set<string>();
  return items.filter((p) => {
    if (p.groupId) {
      if (seen.has(p.groupId)) return false;
      seen.add(p.groupId);
    }
    return true;
  });
}

export default function TrendingPanel() {
  const router = useRouter();
  const { notify } = useUi();
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const loadingFollowRef = useRef<Set<string>>(new Set());

  const load = useCallback(() => {
    apiGet<StatusPost[]>("/status/public?page=1&limit=15")
      .then((data) => setPosts(deduplicateByGroup(data).slice(0, 5)))
      .catch(() => {});
    apiGet<SuggestedUser[]>("/users/suggested")
      .then((data) => {
        if (Array.isArray(data)) {
          const slice = data.slice(4, 8);
          setUsers(slice);
          setFollowingIds(new Set(slice.filter((u) => u.is_following).map((u) => u.id)));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFollow(userId: string) {
    if (loadingFollowRef.current.has(userId)) return;
    loadingFollowRef.current.add(userId);
    const wasFollowing = followingIds.has(userId);

    // Optimistic update
    setFollowingIds((s) => {
      const n = new Set(s);
      wasFollowing ? n.delete(userId) : n.add(userId);
      return n;
    });

    try {
      if (wasFollowing) {
        await apiDelete(`/users/follow/${userId}`);
      } else {
        await apiPost(`/users/follow/${userId}`, {});
      }
    } catch {
      // Revert
      setFollowingIds((s) => {
        const n = new Set(s);
        wasFollowing ? n.add(userId) : n.delete(userId);
        return n;
      });
      notify("Something went wrong. Please try again.");
    } finally {
      loadingFollowRef.current.delete(userId);
    }
  }

  if (posts.length === 0 && users.length === 0) return null;

  return (
    <aside className="no-scrollbar sticky top-14 hidden max-h-[calc(100vh-3.5rem)] w-[340px] flex-shrink-0 self-start overflow-y-auto py-4 pl-4 pr-3 lg:block xl:w-[360px] 2xl:w-[360px] 2xl:pl-8">

      {/* Recent Posts */}
      {posts.length > 0 && (
        <div className="rounded-2xl bg-feed-bg">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-light-text">Recent Posts</h2>
            <button onClick={load} className="text-xs font-medium text-primary hover:underline">
              Refresh
            </button>
          </div>

          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <button
                  onClick={() => { postDetailStore.set(post); router.push(`/status/${post.id}`); }}
                  className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-background/60"
                >
                  {post.userPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.userPhoto} alt={post.userName} className="h-6 w-6 flex-shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 flex-shrink-0 rounded-full bg-border/40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 truncate text-xs font-normal leading-4 text-light-text">
                      {post.userName} · {timeAgo(post.createdAt)}
                    </div>
                    <div className="line-clamp-2 text-xs font-medium leading-4 text-text">
                      {post.caption || post.content || (post.type === "video" ? "Video post" : post.type === "image" ? "Photo post" : "")}
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal leading-4 text-light-text">
                      {post.likeCount} likes · {post.commentCount} comments
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* You May Know */}
      {users.length > 0 && (
        <div className="mt-3 rounded-2xl bg-feed-bg">
          <div className="px-4 pb-1 pt-3">
            <h2 className="text-sm font-bold text-text">You May Know</h2>
          </div>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                <div className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-background/60">
                  <div
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                    onClick={() => router.push(`/profile/${u.id}`)}
                  >
                    {u.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.profile_photo_url} alt={u.name} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-border/40">
                        <IoPersonOutline size={16} className="text-light-text" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-text">{u.name}</span>
                        <RankBadge activityScore={u.global_activity_score ?? 0} rankVisible={u.rank_visible ?? true} />
                      </div>
                      {u.occupation && <p className="truncate text-[11px] text-light-text">{u.occupation}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFollow(u.id)}
                    className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                      followingIds.has(u.id)
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-primary/15 text-primary hover:bg-primary/25"
                    }`}
                  >
                    {followingIds.has(u.id) ? "Following" : "Follow"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 pb-3 pt-1">
            <button onClick={() => router.push("/connections?tab=suggested")} className="text-[13px] font-medium text-primary hover:underline">
              Show more
            </button>
          </div>
        </div>
      )}

      <nav className="flex flex-wrap gap-x-3 gap-y-2 px-2 pt-4 text-[9px] text-light-text">
        {FOOTER_LINKS.map((link) =>
          link.href ? (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {link.label}
            </a>
          ) : (
            <button key={link.label} onClick={() => notify(`${link.label} is coming soon`)} className="hover:underline">
              {link.label}
            </button>
          )
        )}
      </nav>
    </aside>
  );
}
