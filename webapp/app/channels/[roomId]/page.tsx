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
import { getGlobalRankTier, GLOBAL_RANK_COLORS } from "@/lib/globalRank";

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

function MessageContent({ content, messageType }: { content: string; messageType: string }) {
  if (messageType === "image") {
    try {
      const parsed = JSON.parse(content);
      const urls: string[] = parsed.uris ?? (parsed.url ? [parsed.url] : []);
      const caption: string | null = parsed.caption ?? null;
      if (urls.length > 0) {
        return (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              {urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={caption || "Photo"}
                  className="max-h-[220px] max-w-[220px] cursor-pointer rounded-xl object-cover"
                  onClick={() => window.open(url, "_blank")}
                />
              ))}
            </div>
            {caption && <p className="text-[13px] text-light-text">{caption}</p>}
          </div>
        );
      }
    } catch { /* fall through to text */ }
  }

  if (messageType === "video") {
    try {
      const parsed = JSON.parse(content);
      const url: string | undefined = parsed.url ?? parsed.uris?.[0];
      const caption: string | null = parsed.caption ?? null;
      if (url) {
        return (
          <div className="mt-1.5 flex flex-col gap-1.5">
            <video
              src={url}
              controls
              className="max-h-[220px] max-w-[280px] rounded-xl bg-black"
            />
            {caption && <p className="text-[13px] text-light-text">{caption}</p>}
          </div>
        );
      }
    } catch { /* fall through */ }
  }

  return (
    <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-[20px] text-text">
      {content}
    </p>
  );
}

function MessageBubble({
  msg,
  canDelete,
  canChat,
  senderColor,
  occupation,
  activityScore,
  rankVisible,
  menuMsgId,
  onMenuToggle,
  onDelete,
  onVote,
  onOpenReplies,
}: {
  msg: RoomMessage;
  canDelete: boolean;
  canChat: boolean;
  senderColor: string;
  occupation?: string | null;
  activityScore?: number;
  rankVisible?: boolean;
  menuMsgId: string | null;
  onMenuToggle: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onVote: (id: string, v: 1 | -1) => void;
  onOpenReplies: (msg: RoomMessage) => void;
}) {
  const showRank = rankVisible !== false && activityScore != null && activityScore > 0;
  const rankTier = showRank ? getGlobalRankTier(activityScore!) : null;
  const rankColor = rankTier ? GLOBAL_RANK_COLORS[rankTier] : "";

  return (
    <div className="group relative px-4 py-3 hover:bg-feed-bg/50">
      <div className="flex items-start gap-3">
        {msg.senderPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={msg.senderPhotoUrl}
            alt={msg.senderName ?? ""}
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
            <IoPersonOutline size={16} className="text-light-text" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[13px] font-semibold"
              style={{ color: senderColor || undefined }}
            >
              {msg.senderName ?? "Unknown"}
            </span>
            {occupation && (
              <span className="text-[11px] text-light-text">{occupation}</span>
            )}
            {rankTier && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: rankColor + "22", color: rankColor }}
              >
                {rankTier.charAt(0).toUpperCase() + rankTier.slice(1)}
              </span>
            )}
            <span className="text-[11px] text-light-text">{timeAgo(msg.createdAt)}</span>
          </div>

          <MessageContent content={msg.content} messageType={msg.messageType} />

          {/* Vote + replies row */}
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={() => canChat && onVote(msg.id, 1)}
              disabled={!canChat}
              className={`flex items-center gap-1 text-[12px] transition-colors ${
                msg.userVote === 1 ? "text-primary" : "text-light-text hover:text-text"
              } disabled:opacity-40`}
            >
              <IoThumbsUpOutline size={13} />
              <span>{msg.score ?? 0}</span>
            </button>
            <button
              onClick={() => canChat && onVote(msg.id, -1)}
              disabled={!canChat}
              className={`flex items-center gap-1 text-[12px] transition-colors ${
                msg.userVote === -1 ? "text-red-500" : "text-light-text hover:text-text"
              } disabled:opacity-40`}
            >
              <IoThumbsDownOutline size={13} />
            </button>
            <button
              onClick={() => onOpenReplies(msg)}
              className="flex items-center gap-1 text-[12px] text-light-text hover:text-text transition-colors"
            >
              <IoChatbubbleOutline size={12} />
              {(msg.replyCount ?? 0) > 0 && (
                <span>{msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"}</span>
              )}
            </button>
          </div>
        </div>

        {/* 3-dot menu */}
        {canDelete && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => onMenuToggle(msg.id, e)}
              className={`flex h-7 w-7 items-center justify-center rounded-full hover:bg-feed-bg text-light-text transition-opacity ${
                menuMsgId === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <IoEllipsisHorizontal size={15} />
            </button>
            {menuMsgId === msg.id && (
              <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                <button
                  onClick={() => onDelete(msg.id)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-feed-bg"
                >
                  <IoTrashOutline size={14} />
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
    } catch {
      // ignore
    } finally {
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
        prev.map((m) =>
          m.id === replyPanel.msg.id ? { ...m, replyCount: (m.replyCount ?? 0) + 1 } : m
        )
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

  function getSenderColor(senderId: string): string {
    const info = memberMap[senderId];
    if (!info || info.rankVisible === false) return "";
    const tier = getGlobalRankTier(info.activityScore);
    return GLOBAL_RANK_COLORS[tier] ?? "";
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
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
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

      {/* Info panel (collapsible) */}
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
              onClick={() => {
                const oldest = messages[0];
                if (oldest) loadMessages(oldest.createdAt);
              }}
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
          const info = memberMap[msg.senderId];
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              canDelete={canDeleteMsg(msg)}
              canChat={canChat}
              senderColor={getSenderColor(msg.senderId)}
              occupation={info?.occupation}
              activityScore={info?.activityScore}
              rankVisible={info?.rankVisible}
              menuMsgId={menuMsgId}
              onMenuToggle={handleMenuToggle}
              onDelete={deleteMessage}
              onVote={vote}
              onOpenReplies={openReplies}
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
          <button
            onClick={join}
            disabled={joining}
            className="rounded-full bg-primary px-6 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-primary/90"
          >
            {joining ? "…" : joinTypeLabel}
          </button>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 text-center">
          <button
            onClick={() => router.push("/login")}
            className="rounded-full bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
          >
            Sign in to join and chat
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 text-center">
          <button
            onClick={join}
            disabled={joining}
            className="rounded-full bg-primary px-6 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50 hover:bg-primary/90"
          >
            {joining ? "Joining…" : "Join Channel to Chat"}
          </button>
        </div>
      )}

      {/* Reply panel (slide-in from right) */}
      {replyPanel && (
        <>
          {/* backdrop — click to close but don't block scroll on the left */}
          <div
            className="absolute inset-0 z-30 bg-black/20"
            onClick={() => setReplyPanel(null)}
          />
          <div className="absolute right-0 top-0 z-40 flex h-full w-[min(380px,100%)] flex-col border-l border-border bg-background shadow-2xl">
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
                  <img src={replyPanel.msg.senderPhotoUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                    <IoPersonOutline size={14} className="text-light-text" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-semibold text-text" style={{ color: getSenderColor(replyPanel.msg.senderId) || undefined }}>
                      {replyPanel.msg.senderName ?? "Unknown"}
                    </span>
                    <span className="text-[11px] text-light-text">{timeAgo(replyPanel.msg.createdAt)}</span>
                  </div>
                  <MessageContent content={replyPanel.msg.content} messageType={replyPanel.msg.messageType} />
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
                  return (
                    <div key={r.id} className="flex items-start gap-2.5 px-4 py-3 hover:bg-feed-bg/50">
                      {r.senderPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.senderPhotoUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                          <IoPersonOutline size={14} className="text-light-text" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[12px] font-semibold"
                            style={{ color: getSenderColor(r.senderId) || undefined }}
                          >
                            {r.senderName ?? "Unknown"}
                          </span>
                          {info?.occupation && (
                            <span className="text-[10px] text-light-text">{info.occupation}</span>
                          )}
                          <span className="text-[10px] text-light-text">{timeAgo(r.createdAt)}</span>
                        </div>
                        <MessageContent content={r.content} messageType={r.messageType} />
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
        </>
      )}
    </div>
  );
}
