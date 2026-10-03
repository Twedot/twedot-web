"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  IoArrowBack,
  IoChevronBack,
  IoChevronForward,
  IoPersonOutline,
  IoSendOutline,
  IoEllipsisHorizontal,
  IoTrashOutline,
  IoLockClosedOutline,
  IoHelpCircleOutline,
  IoSettingsOutline,
  IoExitOutline,
  IoCloseOutline,
  IoChatbubbleOutline,
  IoPlay,
  IoVolumeMute,
  IoVolumeHigh,
  IoArrowUpCircle,
  IoArrowUpCircleOutline,
  IoArrowDownCircle,
  IoArrowDownCircleOutline,
  IoHappyOutline,
  IoImageOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoShieldOutline,
  IoNotificationsOutline,
  IoNotificationsOffOutline,
  IoPencilOutline,
  IoAddOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { apiGet, apiPost, apiPatch, apiDelete, apiUploadFile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useJobSocket } from "@/lib/jobSocket";
import { getGlobalRankTier, GLOBAL_RANK_COLORS, GLOBAL_RANK_LABELS } from "@/lib/globalRank";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const emojiDataRaw = require("@emoji-mart/data");
const emojiData = emojiDataRaw?.default ?? emojiDataRaw;
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

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

function normalizeRoomMsg(r: any): RoomMessage {
  return {
    id: r.id,
    senderId: r.senderId ?? r.sender_id ?? r.userId ?? r.user_id ?? "",
    senderName: r.senderName ?? r.sender_name ?? r.name ?? r.userName ?? r.user_name ?? null,
    senderPhotoUrl: r.senderPhotoUrl ?? r.sender_photo_url ?? r.photoUrl ?? r.photo_url ?? r.profile_photo_url ?? null,
    content: r.content ?? r.text ?? r.message ?? "",
    messageType: r.messageType ?? r.message_type ?? "text",
    createdAt: r.createdAt ?? r.created_at ?? new Date().toISOString(),
    score: r.score ?? 0,
    userVote: r.userVote ?? r.user_vote ?? 0,
    replyCount: r.replyCount ?? r.reply_count ?? 0,
    reactions: r.reactions,
  };
}

function detectMediaType(content: string, rawMsgType: string): "image" | "video" | "text" {
  const t = (rawMsgType || "").toLowerCase();
  if (t === "image" || t === "images" || t === "photo") return "image";
  if (t === "video" || t === "videos") return "video";

  if (content && content.startsWith("{")) {
    try {
      const p = JSON.parse(content);
      if (p.type === "image" || p.uris) return "image";
      if (p.type === "video") return "video";
      // Bare {url:...} — detect by extension before assuming image
      if (p.url && !p.message && !p.text) {
        const u = (p.url as string).toLowerCase();
        if (u.match(/\.(mp4|mov|avi|mkv|webm)/) || u.includes("/video_")) return "video";
        if (u.match(/\.(mp3|m4a|aac|ogg|opus|wav)/) || u.includes("/audio_") || u.includes("voice")) return "text"; // will be caught as audio before this
        return "image";
      }
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

function ChannelVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  }
  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }
  return (
    <div
      className="relative overflow-hidden rounded-md bg-black cursor-pointer"
      style={{ width: 220, minHeight: 124 }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        playsInline
        loop
        preload="none"
        onEnded={() => setIsPlaying(false)}
        className="block w-full"
        style={{ maxHeight: 300 }}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50">
            <IoPlay size={22} color="#fff" className="ml-0.5" />
          </div>
        </div>
      )}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
        >
          {isMuted ? <IoVolumeMute size={14} /> : <IoVolumeHigh size={14} />}
        </button>
      )}
    </div>
  );
}

function MessageContent({
  content,
  messageType,
  onImageClick,
}: {
  content: string;
  messageType: string;
  onImageClick: (urls: string[], idx: number) => void;
}) {
  // Audio/voice must be checked first — before detectMediaType which may
  // misclassify an audio URL as an image if the path doesn't have an extension.
  const rawType = (messageType || "").toLowerCase();
  if (rawType === "audio" || rawType === "voice") {
    return (
      <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-feed-bg px-3 py-2.5" style={{ maxWidth: 220 }}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
          <span className="text-[14px]">🎵</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-text">Audio message</p>
          <p className="text-[10px] text-light-text">Open Twedot app to listen</p>
        </div>
      </div>
    );
  }

  // Catch audio/file by URL extension — bare URL or JSON {url:...}
  function resolveUrl(): string | null {
    if (!content) return null;
    if (content.startsWith("http")) return content;
    if (content.startsWith("{")) {
      try { return (JSON.parse(content) as any).url ?? null; } catch { return null; }
    }
    return null;
  }
  const resolvedUrl = resolveUrl();
  if (resolvedUrl) {
    const lc = resolvedUrl.toLowerCase();
    const isAudioUrl = lc.match(/\.(m4a|mp3|aac|ogg|opus|wav)/) || lc.includes("/audio_") || lc.includes("voice");
    if (isAudioUrl) {
      return (
        <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-feed-bg px-3 py-2.5" style={{ maxWidth: 220 }}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="text-[14px]">🎵</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-text">Audio message</p>
            <p className="text-[10px] text-light-text">Open Twedot app to listen</p>
          </div>
        </div>
      );
    }
  }

  // File message
  if (rawType === "file") {
    const fileName = resolvedUrl ? resolvedUrl.split("/").pop() ?? "File" : "File";
    return (
      <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-feed-bg px-3 py-2.5" style={{ maxWidth: 260 }}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
          <span className="text-[14px]">📎</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-text">{fileName}</p>
          <p className="text-[10px] text-light-text">Open Twedot app to view</p>
        </div>
      </div>
    );
  }

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
            className={`grid overflow-hidden rounded-lg ${isGroup ? "grid-cols-2" : "grid-cols-1"}`}
            style={{ maxWidth: isGroup ? 200 : 160 }}
          >
            {urls.map((url, i) => (
              <div key={i} className="relative overflow-hidden" style={{ height: isGroup ? 90 : 150 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={caption || "Photo"}
                  className="absolute inset-0 h-full w-full cursor-pointer object-cover"
                  onClick={() => onImageClick(urls, i)}
                />
              </div>
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
          <ChannelVideoPlayer src={url} />
          {caption && <p className="text-[11px] text-light-text">{caption}</p>}
        </div>
      );
    }
  }

  return (
    <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-[17px] text-text">
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
    <div className="group relative px-3 py-1 hover:bg-feed-bg/50">
      <div className="flex items-start gap-2">
        {/* Avatar */}
        {msg.senderPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={msg.senderPhotoUrl}
            alt={msg.senderName ?? ""}
            className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
            <IoPersonOutline size={12} className="text-light-text" />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Line 1: Name · time */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[11px] font-semibold leading-tight"
              style={{ color: senderColor || undefined }}
            >
              {msg.senderName ?? "Unknown"}
            </span>
            <span className="text-[9px] text-light-text leading-none">{timeAgo(msg.createdAt)}</span>
          </div>
          {/* Line 2: Rank · Occupation */}
          {(rankTier || occupation) && (
            <div className="flex items-center gap-1 flex-wrap mt-[3px]">
              {rankTier && (
                <span
                  className="inline-block rounded-full px-1.5 py-[1px] text-[9px] font-bold leading-none"
                  style={{ backgroundColor: rankColor + "25", color: rankColor }}
                >
                  {GLOBAL_RANK_LABELS[rankTier as keyof typeof GLOBAL_RANK_LABELS] ?? rankTier}
                </span>
              )}
              {occupation && (
                <>
                  {rankTier && <span className="text-[9px] text-light-text leading-none">·</span>}
                  <span className="text-[10px] text-light-text leading-none">{occupation}</span>
                </>
              )}
            </div>
          )}

          {/* Message content */}
          <MessageContent
            content={msg.content}
            messageType={msg.messageType}
            onImageClick={onImageClick}
          />

          {/* Vote + Reply row */}
          <div className="mt-0.5 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-light-text mr-0.5">Vote</span>
              <button
                onClick={() => canChat && onVote(msg.id, 1)}
                disabled={!canChat}
                className="flex items-center gap-0.5 transition-colors disabled:opacity-40"
              >
                {msg.userVote === 1
                  ? <IoArrowUpCircle size={14} className="text-primary" />
                  : <IoArrowUpCircleOutline size={14} className="text-light-text hover:text-text" />}
              </button>
              <span className={`text-[11px] font-bold tabular-nums px-0.5 ${
                (msg.score ?? 0) > 0 ? "text-primary" : (msg.score ?? 0) < 0 ? "text-red-500" : "text-light-text"
              }`}>
                {msg.score ?? 0}
              </span>
              <button
                onClick={() => canChat && onVote(msg.id, -1)}
                disabled={!canChat}
                className="flex items-center gap-0.5 transition-colors disabled:opacity-40"
              >
                {msg.userVote === -1
                  ? <IoArrowDownCircle size={14} className="text-red-500" />
                  : <IoArrowDownCircleOutline size={14} className="text-light-text hover:text-text" />}
              </button>
            </div>
            <button
              onClick={() => onOpenReplies(msg)}
              className="flex items-center gap-1 text-[11px] text-light-text hover:text-text transition-colors"
            >
              <IoChatbubbleOutline size={10} />
              <span>
                {(msg.replyCount ?? 0) > 0
                  ? `${msg.replyCount} ${msg.replyCount === 1 ? "reply" : "replies"}`
                  : "Reply"}
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

export default function ChannelDetailPage({ roomId: propRoomId }: { roomId?: string } = {}) {
  const { roomId: paramRoomId } = useParams<{ roomId: string }>();
  const roomId = propRoomId ?? paramRoomId;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useJobSocket();

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
  const [error, setError] = useState<string | null>(null);
  const [memberMap, setMemberMap] = useState<Record<string, MemberInfo>>({});
  const [replyPanel, setReplyPanel] = useState<ReplyPanel | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const replyCursorRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string; type: "image" | "video" }[]>([]);
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);
  const openLightbox = useCallback((urls: string[], idx: number) => setLightbox({ urls, idx }), []);
  const lightboxOpen = lightbox !== null;
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setLightbox((lb) => lb && lb.idx < lb.urls.length - 1 ? { ...lb, idx: lb.idx + 1 } : lb);
      if (e.key === "ArrowLeft") setLightbox((lb) => lb && lb.idx > 0 ? { ...lb, idx: lb.idx - 1 } : lb);
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);
  // Edit room state
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editJoinType, setEditJoinType] = useState<"open" | "invite_request" | "additional_check">("open");
  const [editSaving, setEditSaving] = useState(false);
  // Room action state
  const [notifMuted, setNotifMuted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [kickingMember, setKickingMember] = useState<string | null>(null);
  const [promotingMember, setPromotingMember] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);
  const restoredReplyRef = useRef(false);


  // Auto-grow main textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [text]);

  // Auto-grow reply textarea
  useEffect(() => {
    const el = replyTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  }, [replyPanel?.replyText]);

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
              occupation: m.occupation ?? m.user_occupation ?? m.profile_occupation ?? m.member_occupation ?? null,
              name: m.name ?? null,
              role: m.role ?? "member",
              photoUrl: m.profile_photo_url ?? m.photoUrl ?? null,
            } as any;
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

  // Restore reply panel after refresh
  useEffect(() => {
    if (restoredReplyRef.current || messages.length === 0 || replyPanel) return;
    try {
      const savedId = sessionStorage.getItem(`twedot_reply_${roomId}`);
      if (!savedId) return;
      const msg = messages.find((m) => m.id === savedId);
      if (msg) {
        restoredReplyRef.current = true;
        openReplies(msg);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!menuMsgId) return;
    const handler = () => setMenuMsgId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [menuMsgId]);


  function closeEmojiPickers() {
    setShowEmojiPicker(false);
    setShowReplyEmojiPicker(false);
  }

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

  async function saveEditRoom() {
    if (!editName.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const updated = await apiPatch<any>(`/rooms/${roomId}`, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        join_type: editJoinType,
      });
      setRoom((prev) => prev ? { ...prev, name: editName.trim(), description: editDesc.trim() || null, join_type: editJoinType } : prev);
      setShowEditRoom(false);
    } catch (e: any) {
      alert(e?.message ?? "Failed to save");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteRoom() {
    if (!confirm("Delete this channel? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiDelete(`/rooms/${roomId}`);
      router.push("/channels");
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete");
      setDeleting(false);
    }
  }

  async function kickMember(uid: string) {
    setKickingMember(uid);
    try {
      await apiDelete(`/rooms/${roomId}/members/${uid}`);
      setMemberMap((prev) => { const m = { ...prev }; delete m[uid]; return m; });
      setRoom((prev) => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : prev);
    } catch (e: any) {
      alert(e?.message ?? "Failed to remove member");
    } finally {
      setKickingMember(null);
    }
  }

  async function promoteMember(uid: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "member" : "admin";
    setPromotingMember(uid);
    try {
      await apiPatch(`/rooms/${roomId}/members/${uid}/role`, { role: newRole });
      await loadMembers();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update role");
    } finally {
      setPromotingMember(null);
    }
  }

  async function toggleMuteNotif() {
    const next = !notifMuted;
    setNotifMuted(next);
    try {
      await apiPatch(`/rooms/${roomId}/notifications`, { muted: next });
    } catch {
      setNotifMuted(!next);
    }
  }

  function copyInviteCode() {
    if (!room?.invite_code) return;
    navigator.clipboard.writeText(`https://twedot.com/r/${room.invite_code}`).catch(() => {});
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
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

  function pickFiles(files: FileList) {
    const items = Array.from(files).map((file) => {
      const isVideo = file.type.startsWith("video/");
      return { file, preview: URL.createObjectURL(file), type: (isVideo ? "video" : "image") as "image" | "video" };
    });
    setPendingFiles((prev) => [...prev, ...items]);
  }

  function removePendingFile(idx: number) {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadOne(item: { file: File; type: "image" | "video" }): Promise<void> {
    if (!socket) return;
    const { file, type: fileType } = item;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("fileName", file.name);
    fd.append("mimeType", file.type);
    fd.append("folder", "room");
    const res = await apiUploadFile<{ jobId: string }>("/media/upload/direct", fd);
    if (!res?.jobId) return;
    const jobId = res.jobId;
    await new Promise<void>((resolve) => {
      const cleanup = () => {
        socket.off("media_job_complete", onComplete);
        socket.off("media_job_failed", onFailed);
        clearTimeout(timeout);
      };
      const onComplete = (data: { jobId: string; url: string }) => {
        if (data.jobId !== jobId) return;
        cleanup();
        apiPost(`/rooms/${roomId}/messages`, { content: data.url, messageType: fileType })
          .then(() => loadMessages())
          .catch(() => {});
        resolve();
      };
      const onFailed = (data: { jobId: string }) => {
        if (data.jobId !== jobId) return;
        cleanup();
        resolve();
      };
      const timeout = setTimeout(() => { cleanup(); resolve(); }, 60000);
      socket.on("media_job_complete", onComplete);
      socket.on("media_job_failed", onFailed);
    });
  }

  async function sendFiles() {
    if (!pendingFiles.length || !room?.is_member || uploadingMedia) return;
    setUploadingMedia(true);
    const toSend = [...pendingFiles];
    setPendingFiles([]);
    try {
      for (const item of toSend) {
        await uploadOne(item);
      }
    } finally {
      setUploadingMedia(false);
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

  const openReplies = useCallback(async (msg: RoomMessage) => {
    try { sessionStorage.setItem(`twedot_reply_${roomId}`, msg.id); } catch {}
    setReplyPanel({ msg, replies: [], loading: true, replyText: "", sending: false });
    try {
      // Endpoint: GET /rooms/:roomId/messages/:messageId/thread → { parent, replies }
      const res = await apiGet<any>(`/rooms/${roomId}/messages/${msg.id}/thread`);
      const raw = Array.isArray(res?.replies) ? res.replies
        : Array.isArray(res) ? res
        : Array.isArray(res?.messages) ? res.messages
        : Array.isArray(res?.data) ? res.data
        : [];
      const replies: RoomMessage[] = raw.map(normalizeRoomMsg);
      setReplyPanel((prev) => prev ? { ...prev, replies, loading: false } : null);
    } catch {
      setReplyPanel((prev) => prev ? { ...prev, loading: false } : null);
    }
  }, [roomId]);

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
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* ── LEFT: Chat column ── */}
        <div className="flex min-w-0 flex-1 flex-col" style={{ maxWidth: 620 }}>
        {/* Header */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg transition-colors"
          >
            <IoArrowBack size={20} className="text-text" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {room.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={room.photo_url} alt={room.name} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <span className="text-[12px] font-bold text-primary">#</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-[12px] font-semibold text-text">{room.name}</span>
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
          </div>

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
          </div>
        </div>

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
                onImageClick={openLightbox}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Backdrop — closes any open emoji picker on outside click (sits below picker z-40) */}
        {(showEmojiPicker || showReplyEmojiPicker) && (
          <div className="fixed inset-0 z-30" onClick={closeEmojiPickers} />
        )}

        {/* Composer */}
        {canChat ? (
          <div className="flex-shrink-0 border-t border-border bg-background px-3 py-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) pickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {/* File previews before upload */}
            {pendingFiles.length > 0 && (
              <div className="mb-2 rounded-xl bg-feed-bg p-2">
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((pf, idx) => (
                    <div key={idx} className="relative flex-shrink-0 overflow-hidden rounded-lg" style={{ width: 72, height: 72 }}>
                      {pf.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pf.preview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <video src={pf.preview} className="h-full w-full object-cover" muted playsInline />
                      )}
                      <button
                        onClick={() => removePendingFile(idx)}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <IoCloseOutline size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Add more button */}
                  {!uploadingMedia && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-light-text hover:border-primary hover:text-primary transition-colors"
                      style={{ width: 72, height: 72 }}
                      title="Add more"
                    >
                      <IoImageOutline size={22} />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={sendFiles}
                    disabled={uploadingMedia}
                    className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                  >
                    {uploadingMedia ? "Uploading…" : `Send ${pendingFiles.length > 1 ? `(${pendingFiles.length})` : ""}`}
                  </button>
                  <button
                    onClick={() => { pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview)); setPendingFiles([]); }}
                    disabled={uploadingMedia}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold text-light-text hover:text-text disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="relative flex items-end gap-2">
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 z-40 mb-1" onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    data={emojiData}
                    onEmojiSelect={(emoji: any) => {
                      const char = emoji.native ?? emoji.shortcodes ?? "";
                      if (!char) return;
                      const el = textareaRef.current;
                      if (el) {
                        const start = cursorRef.current.start;
                        const end = cursorRef.current.end;
                        const next = el.value.slice(0, start) + char + el.value.slice(end);
                        setText(next);
                        cursorRef.current = { start: start + char.length, end: start + char.length };
                        requestAnimationFrame(() => {
                          el.focus();
                          el.selectionStart = start + char.length;
                          el.selectionEnd = start + char.length;
                        });
                      } else {
                        setText((prev) => prev + char);
                      }
                    }}
                    theme="auto"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              )}
              <button
                data-emoji-trigger
                onClick={() => { setShowEmojiPicker((v) => !v); setShowReplyEmojiPicker(false); }}
                className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-light-text hover:text-text transition-colors"
              >
                <IoHappyOutline size={19} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-light-text hover:text-text transition-colors disabled:opacity-50"
                title="Attach image/video"
              >
                <IoImageOutline size={19} />
              </button>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onSelect={(e) => { const el = e.currentTarget; cursorRef.current = { start: el.selectionStart, end: el.selectionEnd }; }}
                onBlur={(e) => { const el = e.currentTarget; cursorRef.current = { start: el.selectionStart, end: el.selectionEnd }; }}
                rows={1}
                placeholder="Message…"
                className="no-scrollbar min-h-[34px] flex-1 resize-none rounded-2xl bg-feed-bg px-3 py-1.5 text-[13px] text-text outline-none placeholder:text-light-text"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary/90"
              >
                <IoSendOutline size={15} />
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
        </div>{/* end chat column */}

        {/* ── RIGHT: Info / Thread panel ── */}
        <div className="flex w-[360px] flex-shrink-0 flex-col border-l border-border bg-background">
        {replyPanel ? (
          <>
          {/* Panel header */}
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <button
              onClick={() => {
                try { sessionStorage.removeItem(`twedot_reply_${roomId}`); } catch {}
                setReplyPanel(null);
              }}
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
                {(() => {
                  const { tier: pTier, color: pColor, senderColor: pSenderColor } = getMemberRank(replyPanel.msg.senderId);
                  const pOccupation = memberMap[replyPanel.msg.senderId]?.occupation;
                  return (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: pSenderColor || undefined }}
                        >
                          {replyPanel.msg.senderName ?? "Unknown"}
                        </span>
                        <span className="text-[10px] text-light-text">{timeAgo(replyPanel.msg.createdAt)}</span>
                      </div>
                      {(pTier || pOccupation) && (
                        <div className="flex items-center gap-1 flex-wrap mt-[3px]">
                          {pTier && (
                            <span
                              className="inline-block rounded-full px-1.5 py-[1px] text-[9px] font-bold leading-none"
                              style={{ backgroundColor: pColor + "25", color: pColor }}
                            >
                              {GLOBAL_RANK_LABELS[pTier as keyof typeof GLOBAL_RANK_LABELS] ?? pTier}
                            </span>
                          )}
                          {pOccupation && (
                            <>
                              {pTier && <span className="text-[9px] text-light-text leading-none">·</span>}
                              <span className="text-[10px] text-light-text leading-none">{pOccupation}</span>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
                <MessageContent
                  content={replyPanel.msg.content}
                  messageType={replyPanel.msg.messageType}
                  onImageClick={openLightbox}
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
                  <div key={r.id} className="flex items-start gap-2 px-3 py-1.5 hover:bg-feed-bg/50">
                    {r.senderPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.senderPhotoUrl} alt="" className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg">
                        <IoPersonOutline size={12} className="text-light-text" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {/* Name · time */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold leading-none" style={{ color: rc || undefined }}>
                          {r.senderName ?? "Unknown"}
                        </span>
                        <span className="text-[9px] text-light-text leading-none">{timeAgo(r.createdAt)}</span>
                      </div>
                      {/* Rank · Occupation */}
                      {(() => {
                        const { tier: rTier, color: rColor } = getMemberRank(r.senderId);
                        const rOcc = info?.occupation;
                        if (!rTier && !rOcc) return null;
                        return (
                          <div className="flex items-center gap-1 flex-wrap mt-[3px]">
                            {rTier && (
                              <span
                                className="inline-block rounded-full px-1.5 py-[1px] text-[9px] font-bold leading-none"
                                style={{ backgroundColor: rColor + "25", color: rColor }}
                              >
                                {GLOBAL_RANK_LABELS[rTier as keyof typeof GLOBAL_RANK_LABELS] ?? rTier}
                              </span>
                            )}
                            {rOcc && (
                              <>
                                {rTier && <span className="text-[9px] text-light-text leading-none">·</span>}
                                <span className="text-[10px] text-light-text leading-none">{rOcc}</span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                      <MessageContent content={r.content} messageType={r.messageType} onImageClick={openLightbox} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply composer */}
          {canChat && (
            <div className="flex-shrink-0 border-t border-border px-3 py-2">
              <div className="relative flex items-end gap-2">
                {showReplyEmojiPicker && (
                  <div className="absolute bottom-full left-0 z-40 mb-1" onClick={(e) => e.stopPropagation()}>
                    <EmojiPicker
                      data={emojiData}
                      onEmojiSelect={(emoji: any) => {
                        const char = emoji.native ?? emoji.shortcodes ?? "";
                        if (!char) return;
                        const el = replyTextareaRef.current;
                        if (el) {
                          const start = replyCursorRef.current.start;
                          const end = replyCursorRef.current.end;
                          const next = el.value.slice(0, start) + char + el.value.slice(end);
                          setReplyPanel((prev) => prev ? { ...prev, replyText: next } : null);
                          replyCursorRef.current = { start: start + char.length, end: start + char.length };
                          requestAnimationFrame(() => {
                            el.focus();
                            el.selectionStart = start + char.length;
                            el.selectionEnd = start + char.length;
                          });
                        } else {
                          setReplyPanel((prev) => prev ? { ...prev, replyText: prev.replyText + char } : null);
                        }
                      }}
                      theme="auto"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </div>
                )}
                <button
                  data-emoji-trigger
                  onClick={() => { setShowReplyEmojiPicker((v) => !v); setShowEmojiPicker(false); }}
                  className="mb-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-light-text hover:text-text transition-colors"
                >
                  <IoHappyOutline size={17} />
                </button>
                <textarea
                  ref={replyTextareaRef}
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
                  onSelect={(e) => { const el = e.currentTarget; replyCursorRef.current = { start: el.selectionStart, end: el.selectionEnd }; }}
                  onBlur={(e) => { const el = e.currentTarget; replyCursorRef.current = { start: el.selectionStart, end: el.selectionEnd }; }}
                  rows={1}
                  placeholder="Reply…"
                  className="no-scrollbar min-h-[32px] flex-1 resize-none rounded-2xl bg-feed-bg px-3 py-1.5 text-[12px] text-text outline-none placeholder:text-light-text"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyPanel.replyText.trim() || replyPanel.sending}
                  className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40 hover:bg-primary/90"
                >
                  <IoSendOutline size={13} />
                </button>
              </div>
            </div>
          )}
        </>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Channel avatar + name */}
            <div className="flex flex-col items-center gap-3 border-b border-border px-5 py-6">
              {room.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.photo_url} alt={room.name} className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15">
                  <span className="text-[28px] font-bold text-primary">#</span>
                </div>
              )}
              <div className="text-center">
                <h2 className="text-[16px] font-bold text-text">{room.name}</h2>
                <p className="mt-0.5 text-[12px] text-light-text">
                  {fmt(room.member_count)} members
                  {(room.online_count ?? 0) > 0 && ` · ${room.online_count} online`}
                  {room.join_type !== "open" && ` · ${room.join_type === "invite_request" ? "Invite only" : "Application"}`}
                </p>
              </div>
              {room.categories && room.categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {room.categories.map((c) => (
                    <span key={c} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary capitalize">
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              {room.description && (
                <p className="mt-1 text-center text-[12px] leading-[18px] text-text">{room.description}</p>
              )}
            </div>

            {/* Invite code (members only) */}
            {room.is_member && room.invite_code && (
              <div className="border-b border-border px-5 py-4">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-light-text">Invite Link</p>
                <div className="flex items-center gap-2 rounded-xl bg-feed-bg px-3 py-2">
                  <p className="min-w-0 flex-1 truncate text-[12px] text-text">twedot.com/r/{room.invite_code}</p>
                  <button onClick={copyInviteCode} className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors">
                    {copiedInvite ? <IoCheckmarkOutline size={16} /> : <IoCopyOutline size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && !showEditRoom && (
              <div className="border-b border-border px-5 py-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-light-text">Admin</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setEditName(room.name); setEditDesc(room.description ?? ""); setEditJoinType(room.join_type); setShowEditRoom(true); }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text hover:bg-feed-bg transition-colors"
                  >
                    <IoPencilOutline size={16} className="text-primary" />
                    Edit Channel
                  </button>
                  <button
                    onClick={deleteRoom}
                    disabled={deleting}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-red-500 hover:bg-feed-bg transition-colors disabled:opacity-50"
                  >
                    <IoTrashOutline size={16} />
                    {deleting ? "Deleting…" : "Delete Channel"}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Channel form */}
            {isAdmin && showEditRoom && (
              <div className="border-b border-border px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <button onClick={() => setShowEditRoom(false)} className="text-light-text hover:text-text">
                    <IoArrowBack size={16} />
                  </button>
                  <p className="text-[13px] font-semibold text-text">Edit Channel</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-light-text">Name</p>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl bg-feed-bg px-3 py-2 text-[13px] text-text outline-none placeholder:text-light-text"
                      placeholder="Channel name"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-light-text">Description</p>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="no-scrollbar w-full resize-none rounded-xl bg-feed-bg px-3 py-2 text-[13px] text-text outline-none placeholder:text-light-text"
                      placeholder="What's this channel about?"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-light-text">Join Type</p>
                    <div className="flex flex-col gap-1">
                      {(["open", "invite_request", "additional_check"] as const).map((jt) => (
                        <button
                          key={jt}
                          onClick={() => setEditJoinType(jt)}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] transition-colors ${editJoinType === jt ? "bg-primary/10 text-primary font-medium" : "text-text hover:bg-feed-bg"}`}
                        >
                          {jt === "open" && <IoAddOutline size={14} />}
                          {jt === "invite_request" && <IoLockClosedOutline size={14} />}
                          {jt === "additional_check" && <IoHelpCircleOutline size={14} />}
                          {jt === "open" ? "Open (anyone can join)" : jt === "invite_request" ? "Request to Join" : "Answer to Join"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={saveEditRoom}
                    disabled={!editName.trim() || editSaving}
                    className="rounded-xl bg-primary py-2 text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {editSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* Member actions */}
            {room.is_member && (
              <div className="border-b border-border px-5 py-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-light-text">Settings</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={toggleMuteNotif}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-text hover:bg-feed-bg transition-colors"
                  >
                    {notifMuted
                      ? <IoNotificationsOffOutline size={16} className="text-light-text" />
                      : <IoNotificationsOutline size={16} className="text-primary" />}
                    {notifMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </button>
                  {!isAdmin && (
                    <button
                      onClick={leave}
                      disabled={leaving}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-red-500 hover:bg-feed-bg transition-colors disabled:opacity-50"
                    >
                      <IoExitOutline size={16} />
                      {leaving ? "Leaving…" : "Leave Channel"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="flex-1 px-5 py-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-light-text">
                Members · {fmt(room.member_count)}
              </p>
              <div className="flex flex-col gap-1">
                {Object.values(memberMap).map((m) => {
                  const { tier, color } = getMemberRank(m.userId);
                  const memberRole = (m as any).role;
                  return (
                    <div key={m.userId} className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-feed-bg group">
                      {(m as any).photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(m as any).photoUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <IoPersonOutline size={14} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-medium text-text">
                            {(m as any).name ?? "Member"}
                          </span>
                          {memberRole === "admin" && (
                            <IoShieldOutline size={11} className="flex-shrink-0 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-[2px]">
                          {tier && (
                            <span className="inline-block rounded-full px-1.5 py-[1px] text-[9px] font-bold leading-none"
                              style={{ backgroundColor: color + "25", color }}>
                              {GLOBAL_RANK_LABELS[tier as keyof typeof GLOBAL_RANK_LABELS] ?? tier}
                            </span>
                          )}
                          {m.occupation && (
                            <span className="text-[10px] text-light-text truncate">{m.occupation}</span>
                          )}
                        </div>
                      </div>
                      {isAdmin && m.userId !== (user as any)?.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => promoteMember(m.userId, memberRole ?? "member")}
                            disabled={promotingMember === m.userId}
                            title={memberRole === "admin" ? "Demote to member" : "Promote to admin"}
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-border text-light-text disabled:opacity-50"
                          >
                            <IoSwapVerticalOutline size={12} />
                          </button>
                          <button
                            onClick={() => kickMember(m.userId)}
                            disabled={kickingMember === m.userId}
                            title="Remove from channel"
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-border text-red-400 disabled:opacity-50"
                          >
                            <IoCloseOutline size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>{/* end right panel */}
      </div>{/* end outer flex row */}

      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.urls[lightbox.idx]}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <IoCloseOutline size={20} />
          </button>
          {/* Prev */}
          {lightbox.idx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, idx: lb.idx - 1 } : lb); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <IoChevronBack size={22} />
            </button>
          )}
          {/* Next */}
          {lightbox.idx < lightbox.urls.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, idx: lb.idx + 1 } : lb); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <IoChevronForward size={22} />
            </button>
          )}
          {/* Counter */}
          {lightbox.urls.length > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[12px] font-medium text-white">
              {lightbox.idx + 1} / {lightbox.urls.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
