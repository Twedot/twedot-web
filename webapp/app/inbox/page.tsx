"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoHeartOutline,
  IoChatbubbleOutline,
  IoPersonOutline,
  IoTrophyOutline,
  IoMegaphoneOutline,
  IoAtOutline,
  IoEyeOutline,
  IoRocketOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoNotificationsOutline,
} from "react-icons/io5";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function NotifIcon({ type }: { type: NotificationFeedType }) {
  const cls = "text-white";
  const size = 15;

  const map: Record<NotificationFeedType, { icon: React.ReactNode; bg: string }> = {
    status_liked:        { icon: <IoHeartOutline size={size} className={cls} />,       bg: "bg-red-500" },
    status_commented:    { icon: <IoChatbubbleOutline size={size} className={cls} />,  bg: "bg-primary" },
    status_reply:        { icon: <IoChatbubbleOutline size={size} className={cls} />,  bg: "bg-primary" },
    rank_upgrade:        { icon: <IoTrophyOutline size={size} className={cls} />,      bg: "bg-[#F5A623]" },
    status_mentioned:    { icon: <IoAtOutline size={size} className={cls} />,          bg: "bg-primary" },
    comment_mentioned:   { icon: <IoAtOutline size={size} className={cls} />,          bg: "bg-primary" },
    room_mentioned:      { icon: <IoAtOutline size={size} className={cls} />,          bg: "bg-primary" },
    profile_viewed:      { icon: <IoEyeOutline size={size} className={cls} />,         bg: "bg-zinc-500" },
    system_announcement: { icon: <IoMegaphoneOutline size={size} className={cls} />,   bg: "bg-zinc-700" },
    boost_ended:         { icon: <IoRocketOutline size={size} className={cls} />,      bg: "bg-orange-500" },
  };

  const { icon, bg } = map[type] ?? { icon: <IoNotificationsOutline size={size} className={cls} />, bg: "bg-zinc-400" };

  return (
    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
      {icon}
    </div>
  );
}

function Avatar({ url, name, type }: { url: string | null; name: string | null; type: NotificationFeedType }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? ""} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-feed-bg text-xs font-bold text-text">
          {name ? initials : <IoPersonOutline size={18} className="text-light-text" />}
        </div>
      )}
      <div className="absolute -bottom-1 -right-1">
        <NotifIcon type={type} />
      </div>
    </div>
  );
}

function NotifRow({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationFeedItem;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-start gap-3 border-b border-border px-4 py-3.5 ${
        !item.is_read ? "bg-[#EDE9FF]/30" : "hover:bg-feed-bg"
      }`}
    >
      <Avatar url={item.actor_photo_url} name={item.actor_name} type={item.type} />

      <div className="min-w-0 flex-1">
        <p className={`text-[13px] leading-snug text-text ${!item.is_read ? "font-semibold" : "font-normal"}`}>
          {item.title}
        </p>
        {item.body ? (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-light-text">{item.body}</p>
        ) : null}
        <p className="mt-1 text-[11px] text-light-text">{timeAgo(item.created_at)}</p>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!item.is_read && (
          <button
            onClick={() => onRead(item.id)}
            title="Mark as read"
            className="flex h-7 w-7 items-center justify-center rounded-full text-light-text hover:bg-border/50 hover:text-primary"
          >
            <IoCheckmarkDoneOutline size={15} />
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-full text-light-text hover:bg-border/50 hover:text-red-500"
        >
          <IoTrashOutline size={14} />
        </button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiGet<{ items: NotificationFeedItem[]; total: number }>("/notifications?page=1&limit=50")
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiPost("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
    setMarkingAll(false);
  };

  const handleRead = async (id: string) => {
    try {
      await apiPost(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiDelete(`/notifications/${id}`);
    } catch {}
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-12 z-10 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-text">Notifications</h1>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs font-medium text-light-text hover:text-text disabled:opacity-50"
            >
              <IoCheckmarkDoneOutline size={15} />
              {markingAll ? "Marking…" : "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-border px-4 py-3.5">
              <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-feed-bg" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-feed-bg" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-feed-bg" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-feed-bg" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-feed-bg">
            <IoNotificationsOutline size={28} className="text-light-text" />
          </div>
          <p className="text-sm font-medium text-text">No notifications yet</p>
          <p className="text-xs text-light-text">Likes, comments, and mentions will show up here</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <NotifRow
              key={item.id}
              item={item}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
