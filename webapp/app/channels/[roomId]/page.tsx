"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoPersonOutline,
  IoSendOutline,
  IoEllipsisHorizontal,
  IoTrashOutline,
  IoThumbsUpOutline,
  IoThumbsDownOutline,
  IoLockClosedOutline,
  IoHelpCircleOutline,
  IoSettingsOutline,
  IoExitOutline,
  IoCloseOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { getGlobalRankTier, GLOBAL_RANK_COLORS, GLOBAL_RANK_LABELS } from "@/lib/globalRank";

interface RoomDetail {
  id: string;
  name: string;
  description?: string | null;
  photo_url?: string | null;
  join_type: "open" | "invite_request" | "additional_check";
  member_count: number;
  online_count?: number;
  creator_id: string;
  my_role: "admin" | "member" | null;
  is_member: boolean;
  categories?: string[];
  ranking_enabled?: boolean;
  invite_code?: string;
}

interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  senderPhotoUrl: string | null;
  content: string;
  messageType: string;
  createdAt: string;
  score?: number;
  userVote?: number;
  replyCount?: number;
  reactions?: Record<string, string[]>;
}

interface MemberInfo {
  userId: string;
  activityScore: number;
  rankVisible: boolean;
  occupation?: string | null;
}

interface ReplyPanel {
  msg: RoomMessage;
  replies: RoomMessage[];
  loading: boolean;
  replyText: string;
  sending: boolean;
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function detectMediaType(content: string, rawMsgType: string): "image" | "video" | "text" {
  const t = (rawMsgType || "").toLowerCase();
  if (t === "image" || t === "images" || t === "photo") return "image";
  if (t === "video" || t === "videos") return "video";

  if (content && content.startsWith("{")) {
    try {
      const p = JSON.parse(content);
      if (p.type === "image" || p.uris || (p.url && !p.message && !p.text)) return "image";
      if (p.type === "video") return "video";
    } catch { /* not JSON */ }
  }

  if (content && content.startsWith("http")) {
    const lc = content.toLowerCase();
    if (
      lc.includes("/video_") || lc.includes(".mp4") || lc.includes(".mov") ||
      lc.includes(".webm") || lc.includes(".video_")
    ) return "video";
    if (
      lc.includes("/image_") || lc.includes(".jpg") || lc.includes(".jpeg") ||
      lc.includes(".png") || lc.includes(".gif") || lc.includes(".webp")
    ) return "image";
  }

  return "text";
}

function MessageContent({
  content,
  messageType,
  onImageClick,
}: {
  content: string;
  messageType: string;
  onImageClick: (url: string) => void;
}) {
  const mediaType = detectMediaType(content, messageType);

  if (mediaType === "image") {
    let urls: string[] = [];
    let caption: string | null = null;

    if (content.startsWith("{")) {
      try {
        const p = JSON.parse(content);
        urls = p.uris ?? (p.url ? [p.url] : []);
        caption = p.caption ?? null;
      } catch { /* fall through */ }
    } else if (content.startsWith("http")) {
      urls = [content];
    }

    if (urls.length > 0) {
      const isGroup = urls.length > 1;
      return (
        <div className="mt-1.5 flex flex-col gap-1">
          <div
            className={`grid gap-1 ${isGroup ? "grid-cols-2" : "grid-cols-1"}`}
            style={{ maxWidth: isGroup ? 240 : 180 }}
          >
            {urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={caption || "Photo"}
                className="w-full cursor-pointer rounded-lg object-cover"
                style={{ maxHeight: isGroup ? 110 : 180 }}
                onClick={() => onImageClick(url)}
              />
            ))}
          </div>
          {caption && <p className="text-[11px] text-light-text">{caption}</p>}
        </div>
      );
    }
  }

  if (mediaType === "video") {
    let url: string | null = null;
    let caption: string | null = null;

    if (content.startsWith("{")) {
      try {
        const p = JSON.parse(content);
        url = p.url ?? p.uris?.[0] ?? null;
        caption = p.caption ?? null;
      } catch { /* fall through */ }
    } else if (content.startsWith("http")) {
      url = content;
    }

    if (url) {
      return (
        <div className="mt-1.5 flex flex-col gap-1">
          <video
            src={url}
            controls
            className="rounded-lg bg-black"
            style={{ maxHeight: 200, maxWidth: 260 }}
          />
          {caption && <p className="text-[11px] text-light-text">{caption}</p>}
        </div>
      );
    }
  }

  return (
    <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-[19px] text-text">
      {content}
    </p>
  );
}

function MessageBubble({
  msg,
  canDeleteMsg,
  canChat,
  senderColor,
  rankTier,
  rankColor,
  occupation,
  menuMsgId,
  onMenuToggle,
  onDelete,
  onVote,
  onOpenReplies,
  onImageClick,
}: {
  msg: RoomMessage;
  canDeleteMsg: boolean;
  canChat: boolean;
  senderColor: string;
  rankTier: string | null;
  rankColor: string;
  occupation?: string | null;
  menuMsgId: string | null;
  onMenuToggle: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onVote: (id: string, v: 1 | -1) => void;
  onOpenReplies: (msg: RoomMessage) => void;
  onImageClick: (url: string) => void;
}) {
  return (
    <div className="group relative px-4 py-2.5 hover:bg-feed-bg/50">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        {msg.senderPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={msg.senderPhotoUrl}
            alt={msg.senderName ?? ""}
            className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
            <IoPersonOutline size={14} className="text-light-text" />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name · Occupation  time */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[12px] font-semibold leading-none"
              style={{ color: senderColor || undefined }}
            >
              {msg.senderName ?? "Unknown"}
            </span>
            {occupation && (
              <>
                <span className="text-[10px] text-light-text leading-none">·</span>
                <span className="text-[10px] text-light-text leading-none">{occupation}</span>
              </>
            )}
            <span className="text-[10px] text-light-text leading-none">{timeAgo(msg.createdAt)}</span>
          </div>

          {/* Rank badge — below name */}
          {rankTier && (
            <span
              className="mt-0.5 inline-block rounded-full px-1.5 py-[2px] text-[9px] font-bold leading-none"
              style={{ backgroundColor: rankColor + "25", color: rankColor }}
            >
              {GLOBAL_RANK_LABELS[rankTier as keyof typeof GLOBAL_RANK_LABELS] ?? rankTier}
            </span>
          )}

          {/* Message content */}
          <MessageContent
            content={msg.content}
            messageType={msg.messageType}
            onImageClick={onImageClick}
          />

          {/* Vote + Reply row */}
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={() => canChat && onVote(msg.id, 1)}
              disabled={!canChat}
              className={`flex items-center gap-1 text-[11px] transition-colors ${
                msg.userVote === 1 ? "text-primary" : "text-light-text hover:text-text"
              } disabled:opacity-40`}
            >
              <IoThumbsUpOutline size={12} />
              <span>{msg.score ?? 0}</span>
            </button>
            <button
              onClick={() => canChat && onVote(msg.id, -1)}
              disabled={!canChat}
              className={`flex items-center gap-1 text-[11px] transition-colors ${
                msg.userVote === -1 ? "text-red-500" : "text-light-text hover:text-text"
              } disabled:opacity-40`}
            >
              <IoThumbsDownOutline size={12} />
            </button>
            <button
              onClick={() => onOpenReplies(msg)}
              className="flex items-center gap-1 text-[11px] text-light-text hover:text-text transition-colors"
            >
              <IoChatbubbleOutline size={11} />
              <span>
                Reply{(msg.replyCount ?? 0) > 0 ? ` (${msg.replyCount})` : ""}
              </span>
            </button>
          </div>
        </div>

        {/* 3-dot delete menu */}
        {canDeleteMsg && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => onMenuToggle(msg.id, e)}
              className={`flex h-7 w-7 items-center justify-center rounded-full hover:bg-feed-bg text-light-text transition-opacity ${
                menuMsgId === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <IoEllipsisHorizontal size={14} />
            </button>
            {menuMsgId === msg.id && (
              <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                <button
                  onClick={() => onDelete(msg.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px] font-medium text-red-500 hover:bg-feed-bg"
                >
                  <IoTrashOutline size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChannelDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberMap, setMemberMap] = useState<Record<string, MemberInfo>>({});
  const [replyPanel, setReplyPanel] = useState<ReplyPanel | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);

  const loadRoom = useCallback(async () => {
    try {
      const data = await apiGet<RoomDetail>(`/rooms/${roomId}`);
      setRoom(data as RoomDetail);
    } catch {
      setError("Channel not found");
    }
  }, [roomId]);

  const loadMessages = useCallback(async (before?: string) => {
    if (!roomId) return;
    setMsgLoading(true);
    try {
      const qs = before ? `?limit=30&before=${before}` : "?limit=30";
      const res = await apiGet<{ messages: RoomMessage[]; hasMore: boolean }>(`/rooms/${roomId}/messages${qs}`);
      const msgs = Array.isArray((res as any)?.messages) ? (res as any).messages : Array.isArray(res) ? (res as any) : [];
      const more = (res as any)?.hasMore ?? false;
      if (before) {
        setMessages((prev) => [...msgs.reverse(), ...prev]);
      } else {
        setMessages(msgs.slice().reverse());
      }
      setHasMore(more);
    } catch { /* ignore */ } finally {
      setMsgLoading(false);
    }
  }, [roomId]);

  const loadMembers = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await apiGet<any[]>(`/rooms/${roomId}/members`);
      if (Array.isArray(data)) {
        const map: Record<string, MemberInfo> = {};
        data.forEach((m: any) => {
          const uid = m.user_id ?? m.id ?? m.userId;
          if (uid) {
            map[uid] = {
              userId: uid,
              activityScore: m.global_activity_score ?? m.activityScore ?? 0,
              rankVisible: m.rank_visible ?? m.rankVisible ?? true,
              occupation: m.occupation ?? null,
            };
          }
        });
        setMemberMap(map);
      }
    } catch { /* rank info is cosmetic */ }
  }, [roomId]);

  useEffect(() => {
    setLoading(true);
    firstLoad.current = true;
    Promise.all([loadRoom(), loadMessages()]).finally(() => setLoading(false));
  }, [loadRoom, loadMessages]);

  useEffect(() => {
    if (room?.is_member) loadMembers();
  }, [room?.is_member, loadMembers]);

  useEffect(() => {
    if (firstLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      firstLoad.current = false;
    }
  }, [messages]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!menuMsgId) return;
    const handler = () => setMenuMsgId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [menuMsgId]);

  async function join() {
    if (!isAuthenticated) { router.push("/login"); return; }
    setJoining(true);
    try {
      await apiPost(`/rooms/${roomId}/join`, {});
      await loadRoom();
    } catch (e: any) {
      setError(e?.message ?? "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  async function leave() {
    setLeaving(true);
    try {
      await apiPost(`/rooms/${roomId}/leave`, {});
      router.push("/channels");
    } catch (e: any) {
      setError(e?.message ?? "Failed to leave");
      setLeaving(false);
    }
  }

  async function sendMessage() {
    const content = text.trim();
    if (!content || sending || !room?.is_member) return;
    setSending(true);
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: RoomMessage = {
      id: optimisticId,
      senderId: (user as any)?.id ?? "",
      senderName: (user as any)?.name ?? "You",
      senderPhotoUrl: (user as any)?.profile_photo_url ?? null,
      content,
      messageType: "text",
      createdAt: new Date().toISOString(),
      score: 0,
      userVote: 0,
      replyCount: 0,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await apiPost<{ id: string }>(`/rooms/${roomId}/messages`, { content, messageType: "text" });
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticId ? { ...m, id: (res as any).id ?? optimisticId } : m)
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setText(content);
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(msgId: string) {
    setMenuMsgId(null);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await apiDelete(`/rooms/${roomId}/messages/${msgId}`);
    } catch {
      await loadMessages();
    }
  }

  async function vote(msgId: string, value: 1 | -1) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const prevVote = m.userVote ?? 0;
        const delta = value === prevVote ? -prevVote : value - prevVote;
        return { ...m, score: (m.score ?? 0) + delta, userVote: value === prevVote ? 0 : value };
      })
    );
    try {
      await apiPost(`/rooms/${roomId}/messages/${msgId}/vote`, { value });
    } catch {
      await loadMessages();
    }
  }

  async function openReplies(msg: RoomMessage) {
    setReplyPanel({ msg, replies: [], loading: true, replyText: "", sending: false });
    try {
      const res = await apiGet<any>(`/rooms/${roomId}/messages/${msg.id}/replies`);
      const replies = Array.isArray(res) ? res
        : Array.isArray(res?.replies) ? res.replies
        : Array.isArray(res?.messages) ? res.messages
        : [];
      setReplyPanel((prev) => prev ? { ...prev, replies: replies.slice().reverse(), loading: false } : null);
    } catch {
      setReplyPanel((prev) => prev ? { ...prev, loading: false } : null);
    }
  }

  async function sendReply() {
    if (!replyPanel || !replyPanel.replyText.trim() || replyPanel.sending) return;
    const content = replyPanel.replyText.trim();
    setReplyPanel((prev) => prev ? { ...prev, sending: true } : null);
    try {
      await apiPost(`/rooms/${roomId}/messages`, { content, messageType: "text", replyToId: replyPanel.msg.id });
      const newReply: RoomMessage = {
        id: `reply-${Date.now()}`,
        senderId: (user as any)?.id ?? "",
        senderName: (user as any)?.name ?? "You",
        senderPhotoUrl: (user as any)?.profile_photo_url ?? null,
        content,
        messageType: "text",
        createdAt: new Date().toISOString(),
        score: 0,
        userVote: 0,
        replyCount: 0,
      };
      setReplyPanel((prev) =>
        prev ? { ...prev, replies: [...prev.replies, newReply], replyText: "", sending: false } : null
      );
      setMessages((prev) =>
        prev.map((m) => m.id === replyPanel.msg.id ? { ...m, replyCount: (m.replyCount ?? 0) + 1 } : m)
      );
    } catch {
      setReplyPanel((prev) => prev ? { ...prev, sending: false } : null);
    }
  }

  function canDeleteMsg(msg: RoomMessage) {
    if (!isAuthenticated) return false;
    if (msg.senderId === (user as any)?.id) return true;
    return room?.my_role === "admin";
  }

  function getMemberRank(senderId: string) {
    const info = memberMap[senderId];
    if (!info || info.rankVisible === false || info.activityScore <= 0) {
      return { tier: null, color: "", senderColor: "" };
    }
    const tier = getGlobalRankTier(info.activityScore);
    const color = GLOBAL_RANK_COLORS[tier] ?? "";
    return { tier, color, senderColor: color };
  }

  function handleMenuToggle(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMenuMsgId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!room || error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-6">
        <p className="text-[16px] font-semibold text-text">{error ?? "Channel not found"}</p>
        <button onClick={() => router.back()} className="text-[13px] font-medium text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const canChat = room.is_member;
  const isAdmin = room.my_role === "admin";
  const joinTypeLabel = room.join_type === "open" ? null : room.join_type === "invite_request" ? "Request to Join" : "Answer to Join";

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg transition-colors"
          >
            <IoArrowBack size={20} className="text-text" />
          </button>

          <button
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            onClick={() => setShowInfo((v) => !v)}
          >
            {room.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={room.photo_url} alt={room.name} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <span className="text-[14px] font-bold text-primary">#</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-[14px] font-bold text-text">{room.name}</span>
                {room.join_type !== "open" && (
                  room.join_type === "invite_request"
                    ? <IoLockClosedOutline size={11} className="flex-shrink-0 text-light-text" />
                    : <IoHelpCircleOutline size={11} className="flex-shrink-0 text-light-text" />
                )}
              </div>
              <p className="text-[11px] text-light-text">
                {fmt(room.member_count)} members
                {(room.online_count ?? 0) > 0 && ` · ${room.online_count} online`}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {isAuthenticated && !room.is_member && (
              <button
                onClick={join}
                disabled={joining}
                className="rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-primary/90"
              >
                {joining ? "…" : joinTypeLabel ?? "Join"}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => router.push(`/channels/${roomId}/settings`)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg text-light-text"
              >
                <IoSettingsOutline size={18} />
              </button>
            )}
            {room.is_member && !isAdmin && (
              <button
                onClick={leave}
                disabled={leaving}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg text-light-text disabled:opacity-50"
              >
                <IoExitOutline size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Info panel */}
        {showInfo && room.description && (
          <div className="flex-shrink-0 border-b border-border bg-feed-bg px-4 py-3">
            <p className="text-[13px] text-text">{room.description}</p>
            {room.categories && room.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {room.categories.map((c) => (
                  <span key={c} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary capitalize">
                    {c.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="no-scrollbar flex-1 overflow-y-auto">
          {hasMore && (
            <div className="flex justify-center pt-3 pb-1">
              <button
                onClick={() => { const oldest = messages[0]; if (oldest) loadMessages(oldest.createdAt); }}
                disabled={msgLoading}
                className="rounded-full bg-feed-bg px-4 py-1.5 text-[12px] font-medium text-light-text hover:bg-border/50 disabled:opacity-50"
              >
                {msgLoading ? "Loading…" : "Load older messages"}
              </button>
            </div>
          )}

          {messages.length === 0 && !msgLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-feed-bg">
                <span className="text-xl font-bold text-light-text">#</span>
              </div>
              <p className="text-[15px] font-semibold text-text">No messages yet</p>
              <p className="text-[13px] text-light-text">
                {room.is_member ? "Be the first to say something!" : "Join to start chatting"}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const { tier, color, senderColor } = getMemberRank(msg.senderId);
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                canDeleteMsg={canDeleteMsg(msg)}
                canChat={canChat}
                senderColor={senderColor}
                rankTier={tier}
                rankColor={color}
                occupation={memberMap[msg.senderId]?.occupation}
                menuMsgId={menuMsgId}
                onMenuToggle={handleMenuToggle}
                onDelete={deleteMessage}
                onVote={vote}
                onOpenReplies={openReplies}
                onImageClick={setLightboxUrl}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        {canChat ? (
          <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="Message…"
                className="no-scrollbar max-h-[120px] min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary"
                style={{ height: Math.min(120, Math.max(44, text.split("\n").length * 24)) }}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary/90"
              >
                <IoSendOutline size={18} />
              </button>
            </div>
          </div>
        ) : isAuthenticated && room.join_type !== "open" ? (
          <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 text-center">
            <p className="mb-2 text-[13px] text-light-text">
              {room.join_type === "invite_request"
                ? "Request to join to participate in this channel"
                : "Answer the question to join this channel"}
            </p>
            <button onClick={join} disabled={joining} className="rounded-full bg-primary px-6 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-primary/90">
              {joining ? "…" : joinTypeLabel}
            </button>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 text-center">
            <button onClick={() => router.push("/login")} className="rounded-full bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary/90">
              Sign in to join and chat
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 text-center">
            <button onClick={join} disabled={joining} className="rounded-full bg-primary px-6 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-primary/90">
              {joining ? "Joining…" : "Join Channel to Chat"}
            </button>
          </div>
        )}
      </div>

      {/* Reply panel — fixed right column, does NOT overlay the chat */}
      {replyPanel && (
        <div className="fixed right-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] w-[360px] flex-col border-l border-border bg-background shadow-xl">
          {/* Panel header */}
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <button
              onClick={() => setReplyPanel(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg text-light-text"
            >
              <IoCloseOutline size={20} />
            </button>
            <span className="text-[14px] font-bold text-text">Thread</span>
          </div>

          {/* Original message */}
          <div className="flex-shrink-0 border-b border-border bg-feed-bg/50 px-4 py-3">
            <div className="flex items-start gap-2.5">
              {replyPanel.msg.senderPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={replyPanel.msg.senderPhotoUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                  <IoPersonOutline size={13} className="text-light-text" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: getMemberRank(replyPanel.msg.senderId).senderColor || undefined }}
                  >
                    {replyPanel.msg.senderName ?? "Unknown"}
                  </span>
                  <span className="text-[10px] text-light-text">{timeAgo(replyPanel.msg.createdAt)}</span>
                </div>
                <MessageContent
                  content={replyPanel.msg.content}
                  messageType={replyPanel.msg.messageType}
                  onImageClick={setLightboxUrl}
                />
              </div>
            </div>
          </div>

          {/* Replies list */}
          <div className="no-scrollbar flex-1 overflow-y-auto">
            {replyPanel.loading ? (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : replyPanel.replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <IoChatbubbleOutline size={28} className="text-light-text" />
                <p className="text-[13px] text-light-text">No replies yet</p>
              </div>
            ) : (
              replyPanel.replies.map((r) => {
                const info = memberMap[r.senderId];
                const { senderColor: rc } = getMemberRank(r.senderId);
                return (
                  <div key={r.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-feed-bg/50">
                    {r.senderPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.senderPhotoUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                        <IoPersonOutline size={13} className="text-light-text" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-semibold" style={{ color: rc || undefined }}>
                          {r.senderName ?? "Unknown"}
                        </span>
                        {info?.occupation && (
                          <>
                            <span className="text-[10px] text-light-text">·</span>
                            <span className="text-[10px] text-light-text">{info.occupation}</span>
                          </>
                        )}
                        <span className="text-[10px] text-light-text">{timeAgo(r.createdAt)}</span>
                      </div>
                      <MessageContent content={r.content} messageType={r.messageType} onImageClick={setLightboxUrl} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply composer */}
          {canChat && (
            <div className="flex-shrink-0 border-t border-border px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={replyPanel.replyText}
                  onChange={(e) =>
                    setReplyPanel((prev) => prev ? { ...prev, replyText: e.target.value } : null)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  rows={1}
                  placeholder="Reply…"
                  className="no-scrollbar max-h-[100px] min-h-[40px] flex-1 resize-none rounded-2xl border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-light-text focus:border-primary"
                  style={{ height: Math.min(100, Math.max(40, replyPanel.replyText.split("\n").length * 22)) }}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyPanel.replyText.trim() || replyPanel.sending}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary/90"
                >
                  <IoSendOutline size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <IoCloseOutline size={20} />
          </button>
        </div>
      )}
    </>
  );
}
