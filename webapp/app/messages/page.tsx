"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore, type ChatContact } from "@/lib/chatStore";
import { chatSocket, type ChatMessage } from "@/lib/chatSocket";
import { AuthStorage } from "@/lib/authStorage";
import { apiUploadFile } from "@/lib/api";
import { IoArrowBack, IoSend, IoHappyOutline, IoImageOutline, IoCloseCircle, IoShieldCheckmarkOutline, IoCheckmarkCircle, IoAlertCircleOutline, IoVideocamOutline, IoDocumentOutline, IoMicOutline, IoStopCircleOutline, IoPlayOutline, IoPauseOutline, IoCloseOutline, IoArrowUndoOutline, IoHappySharp } from "react-icons/io5";
import RankBadge from "@/components/RankBadge";
import { apiGet } from "@/lib/api";
import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const emojiDataRaw = require("@emoji-mart/data");
const emojiData = emojiDataRaw?.default ?? emojiDataRaw;
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface ReceiptMeta { orderId: string; productName: string; productImage?: string; amount: number; buyerName: string; sellerName: string; }
interface EscrowMeta { orderId: string; productName: string; amount: number; escrowEvent: string; reason?: string; }
interface ProductInquiryMeta { productId: string; productName: string; productPrice: number; productImage?: string; postImage?: string; sellerId?: string; }

function parseMeta<T>(msg: ChatMessage): T | null {
  if (!msg.metadata) return null;
  try { return JSON.parse(msg.metadata) as T; } catch { return null; }
}
function formatPrice(n: number): string { return "₦" + Number(n).toLocaleString(); }

const WAVEFORM_BARS = 25;
const BAR_HEIGHTS = Array.from({ length: WAVEFORM_BARS }, () => 4 + Math.random() * 16);

function VoiceWaveformPlayer({ src, duration, isMine, color }: { src: string; duration: number; isMine: boolean; color: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      const dur = el.duration || totalDuration;
      setCurrentTime(el.currentTime);
      setProgress(dur > 0 ? el.currentTime / dur : 0);
    };
    const onLoaded = () => { if (el.duration && isFinite(el.duration)) setTotalDuration(el.duration); };
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("ended", onEnded);
    return () => { el.removeEventListener("timeupdate", onTime); el.removeEventListener("loadedmetadata", onLoaded); el.removeEventListener("ended", onEnded); };
  }, [totalDuration]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    const bar = waveRef.current;
    if (!el || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur = el.duration || totalDuration;
    if (dur > 0) { el.currentTime = ratio * dur; setProgress(ratio); }
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const activeColor = isMine ? "#fff" : "#6B4EFF";
  const inactiveColor = isMine ? "rgba(255,255,255,0.35)" : "rgba(107,78,255,0.25)";

  return (
    <div className="flex items-center gap-2 min-w-[200px] w-[250px] py-1 px-1">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isMine ? "#fff" : "#6B4EFF" }}>
        {playing ? <IoPauseOutline size={14} style={{ color: isMine ? "#6B4EFF" : "#fff" }} /> : <IoPlayOutline size={14} style={{ color: isMine ? "#6B4EFF" : "#fff" }} />}
      </button>
      <div ref={waveRef} className="flex-1 h-9 flex flex-col justify-center cursor-pointer relative" onClick={seek}>
        <div className="flex items-center justify-between gap-[2px]">
          {BAR_HEIGHTS.map((h, i) => {
            const isActive = (i / WAVEFORM_BARS) <= progress;
            return <div key={i} className="rounded-sm" style={{ width: 2, height: h, backgroundColor: isActive ? activeColor : inactiveColor, transition: "background-color 0.15s" }} />;
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ backgroundColor: inactiveColor }}>
          <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: activeColor, transition: "width 0.1s linear" }} />
        </div>
      </div>
      <span className="text-[11px] min-w-[32px] text-right shrink-0" style={{ color: isMine ? "rgba(255,255,255,0.7)" : "#999", fontVariantNumeric: "tabular-nums" }}>
        {fmt(playing ? currentTime : totalDuration)}
      </span>
    </div>
  );
}

const HEADER_COLORS = [
  "#6B4EFF", "#E04E6A", "#2EA87E", "#E08C3A", "#3A8FE0",
  "#9B59B6", "#E06B4E", "#1ABC9C", "#F39C12", "#8E44AD",
];

function userColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return HEADER_COLORS[Math.abs(hash) % HEADER_COLORS.length];
}

function toDate(ts: string | number): Date {
  return new Date(typeof ts === "number" ? ts : ts);
}

function dateLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Today";
  if (diff === 86400_000) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function lastMsgPreview(msg: ChatMessage | null): string {
  if (!msg) return "No messages yet";
  if (msg.messageType === "image") return "📷 Photo";
  return msg.content.length > 40 ? msg.content.slice(0, 40) + "…" : msg.content;
}

function lastMsgTime(msg: ChatMessage | null): string {
  if (!msg) return "";
  const d = toDate(msg.timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return timeLabel(d);
  if (diff === 86400_000) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface MessageGroup {
  date: string;
  clusters: { senderId: string; time: string; messages: ChatMessage[] }[];
}

function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentDate = "";
  let currentCluster: { senderId: string; time: string; messages: ChatMessage[] } | null = null;

  for (const msg of messages) {
    const d = toDate(msg.timestamp);
    const dl = dateLabel(d);
    const tl = timeLabel(d);

    if (dl !== currentDate) {
      currentDate = dl;
      currentCluster = { senderId: msg.senderId, time: tl, messages: [msg] };
      groups.push({ date: dl, clusters: [currentCluster] });
      continue;
    }

    const lastGroup = groups[groups.length - 1];
    if (currentCluster && currentCluster.senderId === msg.senderId && currentCluster.time === tl) {
      currentCluster.messages.push(msg);
    } else {
      currentCluster = { senderId: msg.senderId, time: tl, messages: [msg] };
      lastGroup.clusters.push(currentCluster);
    }
  }
  return groups;
}

export default function MessagesPage() {
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const threads = useChatStore((s) => s.threads);

  const chatList = Array.from(threads.values())
    .sort((a, b) => {
      const aTime = a.lastMessage?.timestamp ?? 0;
      const bTime = b.lastMessage?.timestamp ?? 0;
      return (typeof bTime === "number" ? bTime : new Date(bTime).getTime()) - (typeof aTime === "number" ? aTime : new Date(aTime).getTime());
    });

  if (activeChat) {
    return <MobileChatView userId={activeChat} onBack={() => setActiveChat(null)} />;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => router.back()} className="text-text">
          <IoArrowBack size={20} />
        </button>
        <h1 className="text-[15px] font-bold text-text">Messages</h1>
      </div>

      <div className="flex-1">
        {chatList.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-light-text text-[13px]">
            No conversations yet
          </div>
        ) : (
          chatList.map((thread) => {
            const { contact, lastMessage, unreadCount, isOnline, requestStatus } = thread;
            const borderColor = userColor(contact.userId);
            const isPending = requestStatus === "pending";
            return (
              <button
                key={contact.userId}
                onClick={() => setActiveChat(contact.userId)}
                className="flex w-full items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-feed-bg transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  {contact.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={contact.photo} alt="" className="w-11 h-11 rounded-full object-cover" style={{ border: `2.5px solid ${borderColor}` }} />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: borderColor }}>
                      {contact.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] truncate ${unreadCount > 0 || isPending ? "font-bold text-text" : "font-medium text-text"}`}>{contact.name}</p>
                    <span className="text-[10px] text-light-text flex-shrink-0 ml-2">{lastMsgTime(lastMessage)}</span>
                  </div>
                  <p className={`text-[12px] truncate ${isPending ? "font-semibold text-text" : unreadCount > 0 ? "font-semibold text-text" : "text-light-text"}`}>
                    {isPending ? "New message request" : lastMsgPreview(lastMessage)}
                  </p>
                </div>
                {isPending ? (
                  <span className="flex-shrink-0 rounded-full bg-red-500/20 border border-red-500 px-2 py-0.5 text-[10px] font-bold text-red-500">
                    Request
                  </span>
                ) : unreadCount > 0 ? (
                  <span className="flex-shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function MobileChatView({ userId, onBack }: { userId: string; onBack: () => void }) {
  const router = useRouter();
  const thread = useChatStore((s) => s.threads.get(userId));
  const markRead = useChatStore((s) => s.markRead);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const myUserId = AuthStorage.getProfile()?.id;
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const color = userColor(userId);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string; kind: "image" | "video" | "file" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<import("@/lib/chatSocket").ChatMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const reactPickerRef = useRef<HTMLDivElement>(null);
  const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","🙏"];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  useEffect(() => {
    if (thread && thread.unreadCount > 0) {
      markRead(userId);
      const lastMsg = thread.messages[thread.messages.length - 1];
      if (lastMsg && lastMsg.senderId !== myUserId) {
        chatSocket.markRead(lastMsg.id, lastMsg.senderId);
      }
    }
  }, [userId, thread?.messages.length, thread?.unreadCount, markRead, myUserId]);

  useEffect(() => {
    if (thread?.contact) {
      chatSocket.subscribePresence([userId]);
      if (thread.messages.length === 0) chatSocket.requestHistory(userId);
    }
  }, [userId, thread?.contact]);

  useEffect(() => {
    apiGet<{ id: string; name: string; profile_photo_url: string | null; occupation?: string; activity_score?: number }>(`/users/by-short/${userId}`)
      .then((p) => {
        if (p?.name) {
          useChatStore.getState().setContact({
            userId,
            name: p.name,
            photo: p.profile_photo_url ?? null,
            occupation: p.occupation ?? null,
            activityScore: p.activity_score ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [userId]);

  const [wsConnected, setWsConnected] = useState(chatSocket.connected);
  useEffect(() => {
    const unsub = chatSocket.on("connectionChange", setWsConnected);
    return unsub;
  }, []);

  useEffect(() => {
    if (!showEmoji) return;
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmoji]);

  useEffect(() => {
    if (!reactingMsgId) return;
    function handleClick(e: MouseEvent) {
      if (reactPickerRef.current && !reactPickerRef.current.contains(e.target as Node)) setReactingMsgId(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [reactingMsgId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !myUserId) return;
    const replyToId = replyTo?.id;
    const replySnapshot = replyTo ? JSON.stringify({ content: replyTo.content, messageType: replyTo.messageType, senderId: replyTo.senderId }) : undefined;
    const clientMessageId = chatSocket.send(userId, trimmed, "text", { replyToId, replySnapshot });
    useChatStore.getState().addMessage(userId, {
      id: clientMessageId,
      clientMessageId,
      senderId: myUserId,
      recipientId: userId,
      content: trimmed,
      messageType: "text",
      timestamp: Date.now(),
      status: "sending",
      replyToId,
      replySnapshot,
    }, true);
    setText("");
    setShowEmoji(false);
    setReplyTo(null);
    chatSocket.sendTyping(userId, false);
    inputRef.current?.focus();
  }, [text, myUserId, userId, replyTo]);

  const handleReact = useCallback((msgId: string, emoji: string) => {
    setReactingMsgId(null);
    chatSocket.send(userId, emoji, "reaction", { clientMessageId: crypto.randomUUID(), metadata: JSON.stringify({ targetMessageId: msgId, emoji }) });
  }, [userId]);

  const handleSendMedia = useCallback(async () => {
    if (!mediaPreview || !myUserId || uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", mediaPreview.file);
      form.append("type", "chat");
      const result = await apiUploadFile<{ url: string }>("/upload/direct", form);
      const url = result.url;
      const msgType = mediaPreview.kind === "video" ? "video" : mediaPreview.kind === "file" ? "file" : "image";
      const replyToId = replyTo?.id;
      const replySnapshot = replyTo ? JSON.stringify({ content: replyTo.content, messageType: replyTo.messageType, senderId: replyTo.senderId }) : undefined;
      const clientMessageId = chatSocket.send(userId, url, msgType, { fileName: mediaPreview.file.name, fileSize: mediaPreview.file.size, replyToId, replySnapshot });
      useChatStore.getState().addMessage(userId, {
        id: clientMessageId,
        clientMessageId,
        senderId: myUserId,
        recipientId: userId,
        content: url,
        messageType: msgType,
        fileName: mediaPreview.file.name,
        fileSize: mediaPreview.file.size,
        timestamp: Date.now(),
        status: "sending",
        replyToId,
        replySnapshot,
      }, true);
      setReplyTo(null);
    } catch {}
    URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
    setUploading(false);
  }, [mediaPreview, myUserId, userId, uploading, replyTo]);

  const handleFileSelect = (kind: "image" | "video" | "file") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview({ file, url: URL.createObjectURL(file), kind });
    setShowAttach(false);
    e.target.value = "";
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {}
  };

  const handleStopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    setIsRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    await new Promise<void>((res) => { mr.onstop = () => res(); mr.stop(); });
    mr.stream.getTracks().forEach((t) => t.stop());
    if (!audioChunksRef.current.length || !myUserId) return;
    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const duration = recordingSeconds;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", blob, "voice.webm");
      form.append("type", "chat");
      const result = await apiUploadFile<{ url: string }>("/upload/direct", form);
      const replyToId = replyTo?.id;
      const replySnapshot = replyTo ? JSON.stringify({ content: replyTo.content, messageType: replyTo.messageType, senderId: replyTo.senderId }) : undefined;
      const clientMessageId = chatSocket.send(userId, result.url, "voice", { duration, replyToId, replySnapshot });
      useChatStore.getState().addMessage(userId, {
        id: clientMessageId,
        clientMessageId,
        senderId: myUserId,
        recipientId: userId,
        content: result.url,
        messageType: "voice",
        duration,
        timestamp: Date.now(),
        status: "sending",
        replyToId,
        replySnapshot,
      }, true);
      setReplyTo(null);
    } catch {}
    setUploading(false);
  }, [myUserId, userId, recordingSeconds, replyTo]);

  const handleTyping = (value: string) => {
    setText(value);
    chatSocket.sendTyping(userId, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => chatSocket.sendTyping(userId, false), 2000);
  };

  const onEmojiSelect = (emoji: any) => {
    setText((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  if (!thread) return null;
  const { contact, messages, isTyping, isOnline } = thread;
  const grouped = groupMessages(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0" style={{ background: color }}>
        <button onClick={onBack} className="text-white p-1">
          <IoArrowBack size={18} />
        </button>
        <button
          onClick={() => router.push(`/profile/${userId}`)}
          className="relative flex-shrink-0"
        >
          {contact.photo ? (
            <img src={contact.photo} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {contact.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-[1.5px]" style={{ borderColor: color }} />
          )}
        </button>
        <button
          onClick={() => router.push(`/profile/${userId}`)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-semibold text-white truncate">{contact.name}</p>
            {contact.activityScore != null && contact.activityScore > 0 && (
              <RankBadge activityScore={contact.activityScore} rankVisible plain className="scale-75 origin-left" />
            )}
          </div>
          <p className="text-[10px] text-white/70 truncate">
            {!wsConnected ? "Connecting..." : isTyping ? "typing..." : contact.occupation ? contact.occupation : isOnline ? "Active now" : ""}
          </p>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col-reverse">
        <div className="flex flex-col gap-0.5">
          {messages.length === 0 && !thread.requestStatus && (
            <div className="flex items-center justify-center py-24 text-light-text text-[13px]">
              Start a conversation
            </div>
          )}
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-light-text font-medium">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {group.clusters.map((cluster, ci) => {
                const isMine = cluster.senderId === myUserId;
                return (
                  <div key={ci} className="mb-1.5">
                    {cluster.messages.map((msg, mi) => {
                      let replySnap: { content: string; messageType: string; senderId: string } | null = null;
                      try { if (msg.replySnapshot) replySnap = JSON.parse(msg.replySnapshot); } catch {}
                      const isMedia = msg.messageType === "image" || msg.messageType === "video";
                      const isCard = msg.messageType === "payment_receipt" || msg.messageType === "escrow_update";
                      const isLastInCluster = mi === cluster.messages.length - 1;
                      return (
                      <div key={msg.id ?? msg.clientMessageId} className={`group relative flex mb-[3px] ${isMine ? "justify-end" : "justify-start"} ${!isMine ? "pl-10" : ""}`}>
                        {!isMine && (
                          <div className="absolute left-0 bottom-0 w-7 h-7">
                            {isLastInCluster && (
                              contact.photo
                                ? <img src={contact.photo} alt="" className="w-7 h-7 rounded-full object-cover" />
                                : <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">{contact.name?.[0]?.toUpperCase() ?? "?"}</div>
                            )}
                          </div>
                        )}
                        {/* Reply button on hover */}
                        <button
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-light-text hover:text-text ${isMine ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"}`}
                          onClick={() => setReplyTo(msg)}
                        >
                          <IoArrowUndoOutline size={14} />
                        </button>
                        {/* React button on hover */}
                        <div className={`absolute -top-3 ${isMine ? "left-0" : "right-0"} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                          <button className="text-light-text hover:text-text" onClick={() => setReactingMsgId(msg.id)}>
                            <IoHappySharp size={13} />
                          </button>
                          {reactingMsgId === msg.id && (
                            <div ref={reactPickerRef} className={`absolute ${isMine ? "left-0" : "right-0"} -top-8 flex gap-1 bg-background border border-border rounded-full px-2 py-1 shadow-lg z-20`}>
                              {QUICK_REACTIONS.map((e) => (
                                <button key={e} className="text-[16px] hover:scale-125 transition-transform" onClick={() => handleReact(msg.id, e)}>{e}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        {isMedia ? (
                          <div
                            className="rounded-xl overflow-hidden p-[1px] cursor-pointer relative"
                            style={{ backgroundColor: isMine ? color : undefined, borderTopRightRadius: isMine ? 4 : 12, borderTopLeftRadius: !isMine ? 4 : 12 }}
                            onClick={() => msg.messageType === "image" && setViewingImage(msg.content)}
                          >
                            {msg.messageType === "image" ? (
                              <img src={msg.content} alt="" className="w-[220px] h-[270px] rounded-[11px] object-cover block" />
                            ) : (
                              <video src={msg.content} controls className="w-[220px] max-h-[270px] rounded-[11px] object-cover block" />
                            )}
                            <div className="absolute bottom-1.5 right-2 bg-black/50 rounded-full px-1.5 py-0.5">
                              <span className="text-[10px] text-white/90">{timeLabel(toDate(msg.timestamp))}</span>
                            </div>
                          </div>
                        ) : (
                        <div className={`max-w-[75%] rounded-2xl text-[13px] leading-[1.4] break-words ${isCard ? "p-0" : "px-3 py-1"} ${
                          isMine ? "text-white rounded-br-sm" : "bg-feed-bg text-text rounded-bl-sm"
                        }`} style={isMine && !isCard ? { background: color } : undefined}>
                          {replySnap && (
                            <div className={`text-[11px] px-2 py-1 mb-1 rounded-lg border-l-2 opacity-80 ${isMine ? "bg-white/10 border-white/60" : "bg-black/10 border-primary"}`}>
                              <span className="font-semibold block truncate">{replySnap.senderId === myUserId ? "You" : contact.name}</span>
                              <span className="truncate block">{replySnap.messageType === "image" ? "📷 Photo" : replySnap.messageType === "video" ? "🎥 Video" : replySnap.messageType === "voice" ? "🎤 Voice" : replySnap.messageType === "file" ? "📎 File" : replySnap.content?.slice(0, 60)}</span>
                            </div>
                          )}
                          {msg.messageType === "voice" ? (
                            <VoiceWaveformPlayer src={msg.content} duration={msg.duration || 0} isMine={isMine} color={color} />
                          ) : msg.messageType === "file" ? (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 py-1 ${isMine ? "text-white" : "text-primary"}`}>
                              <IoDocumentOutline size={16} className="shrink-0" />
                              <span className="text-[12px] underline truncate max-w-[160px]">{msg.fileName ?? "File"}</span>
                              {msg.fileSize ? <span className="text-[10px] opacity-60 shrink-0">{(msg.fileSize / 1024).toFixed(0)}KB</span> : null}
                            </a>
                          ) : msg.messageType === "payment_receipt" ? (() => {
                            const meta = parseMeta<ReceiptMeta>(msg);
                            if (!meta) return <span className="px-3 py-1 block">{msg.content}</span>;
                            return (
                              <div className="p-2 rounded-2xl bg-black/20 border border-green-600/30 min-w-[200px]">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <IoShieldCheckmarkOutline size={13} className="text-green-400" />
                                  <span className="text-[10px] font-semibold text-green-400">Payment Held in Escrow</span>
                                </div>
                                {meta.productImage && <img src={meta.productImage} alt="" className="w-full h-24 rounded-lg object-cover mb-1.5" />}
                                <p className="text-[12px] font-semibold truncate">{meta.productName}</p>
                                <p className="text-[13px] font-bold text-green-300">{formatPrice(meta.amount)}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">Order #{meta.orderId.slice(0, 8)}</p>
                                <p className="text-[10px] text-white/50 mt-0.5">Funds held safely — released when delivery is confirmed</p>
                                {isMine && (
                                  <div className="flex gap-1.5 mt-2">
                                    <a href="/orders" className="flex-1 text-center text-[10px] px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white font-semibold">Confirm Delivery</a>
                                    <a href="/orders" className="flex-1 text-center text-[10px] px-2 py-1 rounded bg-red-600/70 hover:bg-red-500 text-white font-semibold">Dispute</a>
                                  </div>
                                )}
                              </div>
                            );
                          })() : msg.messageType === "escrow_update" ? (() => {
                            const meta = parseMeta<EscrowMeta>(msg);
                            if (!meta) return <span className="px-3 py-1 block">{msg.content}</span>;
                            const isReleased = meta.escrowEvent === "released";
                            const isDisputed = meta.escrowEvent === "disputed";
                            const isRefunded = meta.escrowEvent === "refunded";
                            const borderColor = isReleased ? "border-green-600/30" : isDisputed ? "border-yellow-600/30" : isRefunded ? "border-red-600/30" : "border-white/10";
                            const textColor = isReleased ? "text-green-400" : isDisputed ? "text-yellow-400" : isRefunded ? "text-red-400" : "text-white/60";
                            const label = isReleased ? "Funds Released" : isDisputed ? "Dispute Opened" : isRefunded ? "Order Refunded" : "Escrow Update";
                            return (
                              <div className={`p-2 rounded-2xl bg-black/20 border ${borderColor} min-w-[180px]`}>
                                <div className="flex items-center gap-1 mb-1">
                                  {isReleased ? <IoCheckmarkCircle size={13} className={textColor} /> : <IoAlertCircleOutline size={13} className={textColor} />}
                                  <span className={`text-[10px] font-semibold ${textColor}`}>{label}</span>
                                </div>
                                <p className="text-[12px] font-semibold truncate">{meta.productName}</p>
                                <p className={`text-[13px] font-bold ${textColor}`}>{formatPrice(meta.amount)}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">Order #{meta.orderId.slice(0, 8)}</p>
                                {meta.reason && <p className="text-[10px] text-white/50 mt-0.5">{meta.reason}</p>}
                              </div>
                            );
                          })() : (msg.messageType === "product_inquiry" || !!parseMeta<ProductInquiryMeta>(msg)?.productId) ? (() => {
                            const meta = parseMeta<ProductInquiryMeta>(msg);
                            const displayImage = meta?.postImage ?? meta?.productImage;
                            return (
                              <div className="p-1.5 rounded-xl bg-black/20 border border-white/10 min-w-[180px]">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {displayImage && <img src={displayImage} alt="" className="w-8 h-8 rounded object-cover" />}
                                  <div className="min-w-0">
                                    {meta && <p className="text-[11px] font-bold truncate">{meta.productName}</p>}
                                    {meta && <p className="text-[11px] text-green-300 font-bold">{formatPrice(meta.productPrice)}</p>}
                                  </div>
                                </div>
                                <p className="text-[12px]">{msg.content}</p>
                              </div>
                            );
                          })() : (
                            <span>{msg.content}</span>
                          )}
                          {msg.status === "failed" && (
                            <span className="block text-[10px] text-red-400 px-1">Not connected</span>
                          )}
                        </div>
                        )}
                      </div>
                      );
                    })}
                    <p className={`text-[9px] text-light-text mt-0.5 ${isMine ? "text-right pr-1" : "pl-1"}`}>
                      {cluster.time}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-3 py-1.5 rounded-2xl bg-feed-bg rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-light-text animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-light-text animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-light-text animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border bg-background">
          <div className="flex-1 border-l-2 border-primary pl-2">
            <p className="text-[10px] font-semibold text-primary">{replyTo.senderId === myUserId ? "You" : contact.name}</p>
            <p className="text-[11px] text-light-text truncate">{replyTo.messageType === "image" ? "📷 Photo" : replyTo.messageType === "video" ? "🎥 Video" : replyTo.messageType === "voice" ? "🎤 Voice" : replyTo.messageType === "file" ? "📎 File" : replyTo.content?.slice(0, 80)}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-light-text hover:text-text shrink-0">
            <IoCloseOutline size={18} />
          </button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative px-3 py-2 border-t border-border bg-background">
          {mediaPreview.kind === "image" ? (
            <img src={mediaPreview.url} alt="Preview" className="h-28 rounded-lg object-cover" />
          ) : mediaPreview.kind === "video" ? (
            <video src={mediaPreview.url} className="h-28 rounded-lg object-cover" />
          ) : (
            <div className="flex items-center gap-2 h-12 px-2">
              <IoDocumentOutline size={24} className="text-light-text" />
              <span className="text-[13px] text-text truncate">{mediaPreview.file.name}</span>
              <span className="text-[11px] text-light-text shrink-0">{(mediaPreview.file.size / 1024).toFixed(0)}KB</span>
            </div>
          )}
          <button onClick={() => { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); }} className="absolute top-3 right-4 text-text/80 hover:text-text">
            <IoCloseCircle size={22} />
          </button>
          <button
            onClick={handleSendMedia}
            disabled={uploading}
            className="absolute bottom-3 right-4 p-2 rounded-full transition-colors"
            style={{ background: color, opacity: uploading ? 0.5 : 1 }}
          >
            <IoSend size={16} className="text-white" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div ref={emojiRef} className="border-t border-border bg-background">
          <EmojiPicker
            data={emojiData}
            onEmojiSelect={onEmojiSelect}
            theme="auto"
            previewPosition="none"
            skinTonePosition="none"
            perLine={8}
            emojiSize={22}
            emojiButtonSize={34}
            maxFrequentRows={2}
          />
        </div>
      )}

      {/* Input */}
      {thread.requestStatus === "pending" ? (
        <div className="border-t border-border bg-background shrink-0 px-4 py-3">
          <p className="text-[12px] text-light-text text-center mb-2">
            <span className="font-semibold text-text">{contact.name}</span> wants to send you a message
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                const state = useChatStore.getState();
                const threads = new Map(state.threads);
                threads.delete(userId);
                useChatStore.setState({ threads });
                onBack();
              }}
              className="px-5 py-1.5 rounded-full border border-border text-[12px] font-medium text-light-text hover:bg-feed-bg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => {
                useChatStore.getState().acceptRequest(userId);
              }}
              className="px-5 py-1.5 rounded-full text-[12px] font-medium text-white transition-colors"
              style={{ background: color }}
            >
              Accept
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border bg-background shrink-0">
          <button onClick={() => setShowEmoji((p) => !p)} className="p-1 text-light-text hover:text-text transition-colors shrink-0">
            <IoHappyOutline size={20} />
          </button>
          {/* Attach picker */}
          <div className="relative shrink-0">
            <button onClick={() => setShowAttach((p) => !p)} className="p-1 text-light-text hover:text-text transition-colors">
              <IoImageOutline size={20} />
            </button>
            {showAttach && (
              <div className="absolute bottom-10 left-0 bg-background border border-border rounded-xl shadow-lg flex flex-col py-1 min-w-[130px] z-20">
                <button onClick={() => { imageRef.current?.click(); setShowAttach(false); }} className="flex items-center gap-2 px-3 py-2 text-[12px] text-text hover:bg-feed-bg">
                  <IoImageOutline size={15} /> Photo
                </button>
                <button onClick={() => { videoRef.current?.click(); setShowAttach(false); }} className="flex items-center gap-2 px-3 py-2 text-[12px] text-text hover:bg-feed-bg">
                  <IoVideocamOutline size={15} /> Video
                </button>
                <button onClick={() => { docRef.current?.click(); setShowAttach(false); }} className="flex items-center gap-2 px-3 py-2 text-[12px] text-text hover:bg-feed-bg">
                  <IoDocumentOutline size={15} /> File
                </button>
              </div>
            )}
          </div>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("image")} />
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect("video")} />
          <input ref={docRef} type="file" accept="*/*" className="hidden" onChange={handleFileSelect("file")} />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Write a message..."
            className="flex-1 bg-feed-bg text-text text-[13px] px-4 py-2 rounded-full outline-none placeholder:text-light-text border border-transparent focus:border-primary/50 min-w-0"
          />
          {/* Voice record / Send */}
          {text.trim() ? (
            <button onClick={handleSend} className="p-2 rounded-full shrink-0 transition-colors" style={{ color: color }}>
              <IoSend size={18} />
            </button>
          ) : isRecording ? (
            <button onClick={handleStopRecording} disabled={uploading} className="p-2 rounded-full shrink-0 text-red-500 animate-pulse">
              <IoStopCircleOutline size={22} />
            </button>
          ) : (
            <button onClick={handleStartRecording} disabled={uploading} className="p-2 rounded-full shrink-0 text-light-text hover:text-text transition-colors">
              <IoMicOutline size={20} />
            </button>
          )}
          {isRecording && <span className="text-[11px] text-red-500 shrink-0">{recordingSeconds}s</span>}
        </div>
      )}
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer" onClick={() => setViewingImage(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setViewingImage(null)}>
            <IoCloseOutline size={32} />
          </button>
          <img src={viewingImage} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
