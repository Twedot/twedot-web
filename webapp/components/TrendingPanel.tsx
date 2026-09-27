"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { StatusPost } from "@/lib/types";
import { useUi } from "@/lib/UiContext";

// Only "Privacy Policy & Terms of Service" links to a real page (the same URL the
// login screen already links to) — Twedot doesn't have standalone pages for the rest
// of these yet, so they use the same "coming soon" toast as every other placeholder
// nav item instead of pointing at a URL that doesn't exist.
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

  const load = useCallback(() => {
    // Fetch more than 5 so dedup still gives us 5 visible entries
    apiGet<StatusPost[]>("/status/public?page=1&limit=15")
      .then((data) => setPosts(deduplicateByGroup(data).slice(0, 5)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (posts.length === 0) return null;

  return (
    <aside className="sticky top-14 hidden h-fit w-[360px] flex-shrink-0 self-start py-4 pr-4 2xl:block">
      <div className="rounded-2xl bg-feed-bg">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-light-text">Recent Posts</h2>
          <button onClick={load} className="text-xs font-medium text-primary hover:underline">
            Refresh
          </button>
        </div>

        <ul className="divide-y divide-border/40">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                onClick={() => router.push("/feed")}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-white"
              >
                {post.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.userPhoto} alt={post.userName} className="h-6 w-6 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="h-6 w-6 flex-shrink-0 rounded-full bg-zinc-300" />
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

      <nav className="flex flex-wrap gap-x-3 gap-y-2 px-2 pt-4 text-[9px] text-light-text">
        {FOOTER_LINKS.map((link) =>
          link.href ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {link.label}
            </a>
          ) : (
            <button
              key={link.label}
              onClick={() => notify(`${link.label} is coming soon`)}
              className="hover:underline"
            >
              {link.label}
            </button>
          )
        )}
      </nav>
    </aside>
  );
}
