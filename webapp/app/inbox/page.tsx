"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IoHeartOutline,
  IoChatbubbleEllipses,
  IoPersonOutline,
  IoTrophy,
  IoMegaphone,
  IoAt,
  IoEye,
  IoRocket,
  IoTrashOutline,
  IoNotificationsOutline,
  IoGridOutline,
  IoHeart,
  IoChatbubbleEllipsesOutline,
  IoEyeOutline,
  IoTrophyOutline,
} from "react-icons/io5";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useJobSocket } from "@/lib/jobSocket";

export type NotificationFeedType =
  | "status_liked"
  | "status_commented"
  | "status_reply"
  | "rank_upgrade"
  | "status_mentioned"
  | "comment_mentioned"
  | "room_mentioned"
  | "profile_viewed"
  | "system_announcement"
  | "boost_ended";

interface NotificationFeedItem {
  id: string;
  type: NotificationFeedType;
  actor_id: string | null;
  actor_name: string | null;
  actor_photo_url: string | null;
  title: string;
  body: string;
  status_id: string | null;
  comment_id: string | null;
  room_id: string | null;
  boost_id: string | null;
  status_caption: string | null;
  status_thumbnail_url: string | null;
  is_read: boolean;
  created_at: string;
}

type FilterKey = "all" | "likes" | "comments" | "mentions" | "views" | "rank";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All",
  likes: "Likes",
  comments: "Comments",
  mentions: "Mentions",
  views: "Views",
  rank: "Rank",
};

const FILTER_ICONS: Record<FilterKey, React.ReactNode> = {
  all:      <IoGridOutline size={13} />,
  likes:    <IoHeart size={13} />,
  comments: <IoChatbubbleEllipsesOutline size={13} />,
  mentions: <IoAt size={13} />,
  views:    <IoEyeOutline size={13} />,
  rank:     <IoTrophyOutline size={13} />,
};

const TYPE_LABEL: Record<NotificationFeedType, string> = {
  status_liked:        "Like",
  status_commented:    "Comment",
  status_reply:        "Reply",
  rank_upgrade:        "Rank up",
  status_mentioned:    "Mention",
  comment_mentioned:   "Mention",
  room_mentioned:      "Mention",
  profile_viewed:      "Profile view",
  system_announcement: "Twedot update",
  boost_ended:         "Boost ended",
};

const BADGE_ICON: Record<NotificationFeedType, React.ReactNode> = {
  status_liked:        <IoHeartOutline size={9} className="text-white" />,
  status_commented:    <IoChatbubbleEllipses size={9} className="text-white" />,
  status_reply:        <IoChatbubbleEllipses size={9} className="text-white" />,
  rank_upgrade:        <IoTrophy size={9} className="text-white" />,
  status_mentioned:    <IoAt size={9} className="text-white" />,
  comment_mentioned:   <IoAt size={9} className="text-white" />,
  room_mentioned:      <IoAt size={9} className="text-white" />,
  profile_viewed:      <IoEye size={9} className="text-white" />,
  system_announcement: <IoMegaphone size={9} className="text-white" />,
  boost_ended:         <IoRocket size={9} className="text-white" />,
};

const BADGE_COLOR: Record<NotificationFeedType, string> = {
  status_liked:        "#FE2C55",
  status_commented:    "#6B4EFF",
  status_reply:        "#6B4EFF",
  rank_upgrade:        "#FFD700",
  status_mentioned:    "#22C55E",
  comment_mentioned:   "#22C55E",
  room_mentioned:      "#22C55E",
  profile_viewed:      "#38BDF8",
  system_announcement: "#6B4EFF",
  boost_ended:         "#B8860B",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function Avatar({ url, name, type }: { url: string | null; name: string | null; type: NotificationFeedType }) {
  return (
    <div className="relative flex-shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? ""} className="h-[52px] w-[52px] rounded-full object-cover" />
      ) : (
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-feed-bg">
          <IoPersonOutline size={26} className="text-light-text" />
        </div>
      )}
      <div
        className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white"
        style={{ backgroundColor: BADGE_COLOR[type] }}
      >
        {BADGE_ICON[type]}
      </div>
    </div>
  );
}

function NotifRow({
  item,
  isNew,
  onDelete,
}: {
  item: NotificationFeedItem;
  isNew: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3.5 ${
        isNew ? "bg-[#6B4EFF1A]" : "hover:bg-feed-bg"
      }`}
    >
      <Avatar url={item.actor_photo_url} name={item.actor_name} type={item.type} />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.3px] text-light-text">
          {TYPE_LABEL[item.type]}
          <span className="ml-1.5 normal-case">· {timeAgo(item.created_at)}</span>
        </p>
        <p className={`mt-1 line-clamp-2 text-[13px] leading-[18px] text-text ${isNew ? "font-medium" : "font-normal"}`}>
          {item.body}
        </p>
      </div>

      {item.status_thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.status_thumbnail_url}
          alt=""
          className="h-11 w-11 flex-shrink-0 rounded-md object-cover"
        />
      )}

      {/* delete on hover */}
      <button
        onClick={() => onDelete(item.id)}
        title="Delete"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-light-text opacity-0 transition-opacity group-hover:opacity-100 hover:bg-border/50 hover:text-red-500"
      >
        <IoTrashOutline size={14} />
      </button>

      {isNew && (
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );
}

export default function InboxPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { clearNotifBadge } = useJobSocket();
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  // Capture which IDs were unread at load time — don't change tint as markAllRead fires
  const [unreadAtLoad, setUnreadAtLoad] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiGet<{ items: NotificationFeedItem[]; total: number }>(
        "/notifications?page=1&limit=50"
      );
      const fetched: NotificationFeedItem[] = Array.isArray(r?.items) ? r.items : [];
      const unreadIds = new Set(fetched.filter((i) => !i.is_read).map((i) => i.id));
      setUnreadAtLoad(unreadIds);
      if (unreadIds.size > 0) {
        apiPost("/notifications/read-all").catch(() => {});
        setItems(fetched.map((i) => ({ ...i, is_read: true })));
      } else {
        setItems(fetched);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  // Clear the header bell badge the moment the user opens this page
  useEffect(() => { clearNotifBadge(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnreadAtLoad((prev) => { const s = new Set(prev); s.delete(id); return s; });
    apiDelete(`/notifications/${id}`).catch(() => {});
  };

  const filtered = useMemo(() => {
    switch (filter) {
      case "likes":    return items.filter((i) => i.type === "status_liked");
      case "comments": return items.filter((i) => i.type === "status_commented" || i.type === "status_reply");
      case "mentions": return items.filter((i) => i.type === "status_mentioned" || i.type === "comment_mentioned" || i.type === "room_mentioned");
      case "views":    return items.filter((i) => i.type === "profile_viewed");
      case "rank":     return items.filter((i) => i.type === "rank_upgrade");
      default:         return items;
    }
  }, [items, filter]);

  const newRows    = filtered.filter((i) => unreadAtLoad.has(i.id));
  const earlierRows = filtered.filter((i) => !unreadAtLoad.has(i.id));

  return (
    <div className="flex flex-col">
      {/* Header — no border */}
      <div className="px-4 pt-6 pb-0">
        <h1 className="text-xl font-bold text-text">Inbox</h1>

        {/* Filter pills — box style, same as mobile */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-3">
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                filter === key
                  ? "bg-primary text-white"
                  : "bg-feed-bg text-light-text hover:text-text"
              }`}
            >
              {FILTER_ICONS[key]}
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {error ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <IoNotificationsOutline size={28} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-text">Couldn't load notifications</p>
          <p className="px-8 text-xs text-red-400">{error}</p>
          <button onClick={load} className="mt-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col px-4 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="h-[52px] w-[52px] flex-shrink-0 animate-pulse rounded-full bg-feed-bg" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-16 animate-pulse rounded bg-feed-bg" />
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-feed-bg" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-feed-bg">
            <IoNotificationsOutline size={28} className="text-light-text" />
          </div>
          <p className="text-sm font-medium text-text">
            {filter === "all" ? "No notifications yet" : `No ${FILTER_LABELS[filter].toLowerCase()} yet`}
          </p>
          <p className="px-8 text-xs text-light-text">
            Likes, comments, replies, mentions, profile views, and rank upgrades will show up here
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {newRows.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1.5 text-[15px] font-bold text-text">New</p>
              {newRows.map((item) => (
                <NotifRow key={item.id} item={item} isNew={true} onDelete={handleDelete} />
              ))}
            </>
          )}
          {earlierRows.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1.5 text-[15px] font-bold text-text">Earlier</p>
              {earlierRows.map((item) => (
                <NotifRow key={item.id} item={item} isNew={false} onDelete={handleDelete} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
