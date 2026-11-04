"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/chatStore";
import { chatSocket, type ChatMessage, type ProductInquiryMeta } from "@/lib/chatSocket";
import { AuthStorage } from "@/lib/authStorage";
import { apiUploadFile, apiPost, apiGet } from "@/lib/api";
import { IoClose, IoChevronDown, IoSend, IoHappyOutline, IoImageOutline, IoCloseCircle, IoCartOutline, IoCheckmarkCircle, IoShieldCheckmarkOutline, IoAlertCircleOutline, IoPlayOutline, IoPauseOutline, IoMicOutline, IoCloseOutline } from "react-icons/io5";
import RankBadge from "@/components/RankBadge";
import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const emojiDataRaw = require("@emoji-mart/data");
const emojiData = emojiDataRaw?.default ?? emojiDataRaw;
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

const HEADER_COLORS = [
  "#6B4EFF", "#E04E6A", "#2EA87E", "#E08C3A", "#3A8FE0",
  "#9B59B6", "#E06B4E", "#1ABC9C", "#F39C12", "#8E44AD",
];

function userColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return HEADER_COLORS[Math.abs(hash) % HEADER_COLORS.length];
}

function parseMeta<T>(msg: ChatMessage): T | null {
  if (!msg.metadata) return null;
  try { return JSON.parse(msg.metadata) as T; } catch { return null; }
}

function formatPrice(n: number): string {
  return "₦" + Number(n).toLocaleString();
}

interface ReceiptMeta {
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  amount: number;
  buyerName: string;
  sellerName: string;
}

interface EscrowMeta {
  orderId: string;
  productId: string;
  productName: string;
  amount: number;
  escrowEvent: string;
  reason: string;
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

const WAVEFORM_BARS = 20;
const BAR_HEIGHTS = Array.from({ length: WAVEFORM_BARS }, () => 3 + Math.random() * 12);

function MiniVoicePlayer({ src, duration, isMine, color }: { src: string; duration: number; isMine: boolean; color: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => { const dur = el.duration || totalDuration; setCurrentTime(el.currentTime); setProgress(dur > 0 ? el.currentTime / dur : 0); };
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
    if (playing) { el.pause(); setPlaying(false); } else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current; const bar = waveRef.current;
    if (!el || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur = el.duration || totalDuration;
    if (dur > 0) { el.currentTime = ratio * dur; setProgress(ratio); }
  };

  const fmt = (s: number) => { if (!s || isNaN(s)) return "0:00"; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`; };
  const activeColor = isMine ? "#fff" : "#6B4EFF";
  const inactiveColor = isMine ? "rgba(255,255,255,0.35)" : "rgba(107,78,255,0.25)";

  return (
    <div className="flex items-center gap-1.5 min-w-[160px] w-[190px] py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isMine ? "#fff" : "#6B4EFF" }}>
        {playing ? <IoPauseOutline size={10} style={{ color: isMine ? "#6B4EFF" : "#fff" }} /> : <IoPlayOutline size={10} style={{ color: isMine ? "#6B4EFF" : "#fff" }} />}
      </button>
      <div ref={waveRef} className="flex-1 h-6 flex flex-col justify-center cursor-pointer relative" onClick={seek}>
        <div className="flex items-center justify-between gap-[1.5px]">
          {BAR_HEIGHTS.map((h, i) => <div key={i} className="rounded-sm" style={{ width: 1.5, height: h, backgroundColor: (i / WAVEFORM_BARS) <= progress ? activeColor : inactiveColor, transition: "background-color 0.15s" }} />)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full" style={{ backgroundColor: inactiveColor }}>
          <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: activeColor, transition: "width 0.1s linear" }} />
        </div>
      </div>
      <span className="text-[9px] min-w-[24px] text-right shrink-0" style={{ color: isMine ? "rgba(255,255,255,0.7)" : "#999", fontVariantNumeric: "tabular-nums" }}>
        {fmt(playing ? currentTime : totalDuration)}
      </span>
    </div>
  );
}

export default function ChatWindow({ userId }: { userId: string }) {
  const router = useRouter();
  const thread = useChatStore((s) => s.threads.get(userId));
  const closeChat = useChatStore((s) => s.closeChat);
  const minimizeChat = useChatStore((s) => s.minimizeChat);
  const markRead = useChatStore((s) => s.markRead);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const myUserId = AuthStorage.getProfile()?.id;
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const color = userColor(userId);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<{ file: File; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const pendingPaymentRef = useRef<string | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

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
      chatSocket.requestHistory(userId);
    }
  }, [userId, thread?.contact]);

  const [wsConnected, setWsConnected] = useState(chatSocket.connected);
  useEffect(() => {
    const unsub = chatSocket.on("connectionChange", setWsConnected);
    return unsub;
  }, []);

  // Close emoji on outside click
  useEffect(() => {
    if (!showEmoji) return;
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmoji]);

  useEffect(() => {
    const onFocus = async () => {
      const ref = pendingPaymentRef.current;
      if (!ref) return;
      pendingPaymentRef.current = null;
      try {
        await apiGet<{ status: string; orderId: string }>(`/commerce/orders/verify/${ref}`);
      } catch {}
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !myUserId) return;
    const clientMessageId = chatSocket.send(userId, trimmed);
    useChatStore.getState().addMessage(userId, {
      id: clientMessageId ?? crypto.randomUUID(),
      clientMessageId: clientMessageId ?? undefined,
      senderId: myUserId,
      recipientId: userId,
      content: trimmed,
      messageType: "text",
      timestamp: Date.now(),
      status: clientMessageId ? "sending" : "failed",
    }, true);
    setText("");
    setShowEmoji(false);
    chatSocket.sendTyping(userId, false);
    inputRef.current?.focus();
  }, [text, myUserId, userId]);

  const handleSendMedia = useCallback(async () => {
    if (!mediaPreviews.length || !myUserId || uploading) return;
    setUploading(true);
    try {
      for (const preview of mediaPreviews) {
        const form = new FormData();
        form.append("file", preview.file);
        form.append("type", "chat");
        const result = await apiUploadFile<{ url: string }>("/upload/direct", form);
        const url = result.url;
        const clientMessageId = chatSocket.send(userId, url, "image", { fileName: preview.file.name, fileSize: preview.file.size });
        useChatStore.getState().addMessage(userId, {
          id: clientMessageId ?? crypto.randomUUID(),
          clientMessageId: clientMessageId ?? undefined,
          senderId: myUserId,
          recipientId: userId,
          content: url,
          messageType: "image",
          timestamp: Date.now(),
          status: clientMessageId ? "sending" : "failed",
        }, true);
        URL.revokeObjectURL(preview.url);
      }
    } catch {}
    setMediaPreviews([]);
    setUploading(false);
  }, [mediaPreviews, myUserId, userId, uploading]);

  const handleBuyProduct = useCallback(async () => {
    if (!myUserId || !thread?.productContext || buyingProduct) return;
    setBuyingProduct(true);
    try {
      const pc = thread.productContext;
      const res = await apiPost<{ authorizationUrl: string; reference: string }>("/commerce/orders/initiate", {
        productId: pc.productId,
        sellerId: pc.sellerId,
      });
      pendingPaymentRef.current = res.reference;
      window.open(res.authorizationUrl, "_blank");
    } catch {
    } finally {
      setBuyingProduct(false);
    }
  }, [myUserId, thread?.productContext, buyingProduct]);

  const handleConfirmDelivery = useCallback(async (orderId: string) => {
    try {
      await apiPost(`/commerce/orders/${orderId}/confirm-delivery`, {});
    } catch {}
  }, []);

  const handleDispute = useCallback(async (orderId: string) => {
    const reason = window.prompt("Reason for dispute:");
    if (!reason) return;
    try {
      await apiPost(`/commerce/orders/${orderId}/dispute`, { reason });
    } catch {}
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setMediaPreviews((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ]);
    e.target.value = "";
  };

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
    <div className="flex flex-col w-[280px] h-[360px] bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#333] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0" style={{ background: color }}>
        <button
          onClick={() => { closeChat(userId); router.push(`/profile/${userId}`); }}
          className="relative flex-shrink-0"
        >
          {contact.photo ? (
            <img src={contact.photo} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
              {contact.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border-[1.5px]" style={{ borderColor: color }} />
          )}
        </button>
        <button
          onClick={() => { closeChat(userId); router.push(`/profile/${userId}`); }}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-1">
            <p className="text-[11px] font-semibold text-white truncate leading-tight">{contact.name}</p>
            {contact.activityScore != null && contact.activityScore > 0 && (
              <RankBadge activityScore={contact.activityScore} rankVisible plain className="scale-75 origin-left" />
            )}
          </div>
          <p className="text-[9px] text-white/70 leading-tight truncate">
            {!wsConnected ? "Connecting..." : isTyping ? "typing..." : contact.occupation ? contact.occupation : isOnline ? "Active now" : ""}
          </p>
        </button>
        <button onClick={() => minimizeChat(userId)} className="p-0.5 text-white/60 hover:text-white transition-colors">
          <IoChevronDown size={12} />
        </button>
        <button onClick={() => closeChat(userId)} className="p-0.5 text-white/60 hover:text-white transition-colors">
          <IoClose size={12} />
        </button>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 flex flex-col-reverse">
        <div className="flex flex-col gap-0.5">
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-16 text-white/30 text-[11px]">
              Start a conversation
            </div>
          )}
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] text-white/30 font-medium">{group.date}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              {group.clusters.map((cluster, ci) => {
                const isMine = cluster.senderId === myUserId;
                return (
                  <div key={ci} className="mb-1">
                    {cluster.messages.map((msg, mi) => {
                      const isMedia = msg.messageType === "image" || msg.messageType === "video";
                      const isProductInquiry = msg.messageType === "product_inquiry" || !!parseMeta<ProductInquiryMeta>(msg)?.productId;
                      const isLastInCluster = mi === cluster.messages.length - 1;
                      return (
                      <div key={msg.id ?? msg.clientMessageId} className={`flex mb-[3px] ${isMine ? "justify-end" : "justify-start"} ${!isMine ? "pl-8" : ""}`}>
                        {!isMine && (
                          <div className="absolute left-0 bottom-0 w-5 h-5" style={{ position: "relative", marginLeft: -24, alignSelf: "flex-end", marginRight: 3 }}>
                            {isLastInCluster && (
                              contact.photo
                                ? <img src={contact.photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                                : <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[8px] font-bold">{contact.name?.[0]?.toUpperCase() ?? "?"}</div>
                            )}
                          </div>
                        )}
                        {isMedia ? (
                          <div
                            className="rounded-xl overflow-hidden p-[1px] cursor-pointer relative"
                            style={{ backgroundColor: isMine ? color : "#2a2a2a", borderTopRightRadius: isMine ? 3 : 12, borderTopLeftRadius: !isMine ? 3 : 12 }}
                            onClick={() => msg.messageType === "image" && setViewingImage(msg.content)}
                          >
                            {msg.messageType === "image" ? (
                              <img src={msg.content} alt="" className="w-[170px] h-[210px] rounded-[11px] object-cover block" />
                            ) : (
                              <video src={msg.content} controls className="w-[170px] max-h-[210px] rounded-[11px] object-cover block" />
                            )}
                            <div className="absolute bottom-1 right-1.5 bg-black/50 rounded-full px-1 py-0.5">
                              <span className="text-[8px] text-white/90">{timeLabel(toDate(msg.timestamp))}</span>
                            </div>
                          </div>
                        ) : isProductInquiry ? (
                          (() => {
                            const meta = parseMeta<ProductInquiryMeta>(msg);
                            const displayImage = (meta as any)?.postImage ?? meta?.productImage;
                            const isBuyer = thread?.productContext
                              ? myUserId !== thread.productContext.sellerId
                              : meta?.sellerId ? myUserId !== meta.sellerId : false;
                            return (
                              <div className={`w-[180px] rounded-xl overflow-hidden ${isMine ? "text-white" : "text-white/90"}`}
                                style={{ backgroundColor: isMine ? color : "#2a2a2a", borderTopRightRadius: isMine ? 3 : 12, borderTopLeftRadius: !isMine ? 3 : 12 }}>
                                {displayImage && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={displayImage} alt="" className="w-full h-[110px] object-cover" />
                                )}
                                {meta && (
                                  <div className="flex items-center justify-between gap-1 px-1.5 pt-1 pb-0.5">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold truncate">{meta.productName}</p>
                                      <p className="text-[10px] text-green-300 font-bold">{formatPrice(meta.productPrice)}</p>
                                    </div>
                                    {isBuyer && (
                                      <button
                                        onClick={handleBuyProduct}
                                        disabled={buyingProduct}
                                        className="flex-shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-500 hover:bg-red-400 text-white text-[9px] font-semibold transition-colors disabled:opacity-50"
                                      >
                                        <IoCartOutline size={9} />
                                        {buyingProduct ? "..." : "Buy"}
                                      </button>
                                    )}
                                  </div>
                                )}
                                <p className="text-[11px] leading-[1.4] px-1.5 pb-1">{msg.content}</p>
                                <div className="text-right px-1.5 pb-0.5">
                                  <span className="text-[8px] text-white/50">{timeLabel(toDate(msg.timestamp))}</span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                        <div className={`max-w-[80%] px-2 py-0.5 rounded-2xl text-[11px] leading-[1.4] break-words ${
                          isMine
                            ? "text-white rounded-br-sm"
                            : "bg-[#2a2a2a] text-white/90 rounded-bl-sm"
                        }`} style={isMine ? { background: color } : undefined}>
                          {msg.messageType === "voice" ? (
                            <MiniVoicePlayer src={msg.content} duration={msg.duration || 0} isMine={isMine} color={color} />
                          ) : msg.messageType === "payment_receipt" ? (
                            (() => {
                              const meta = parseMeta<ReceiptMeta>(msg);
                              if (!meta) return <span>{msg.content}</span>;
                              const isBuyer = thread?.productContext ? myUserId !== thread.productContext.sellerId : true;
                              return (
                                <div className="p-1.5 rounded bg-black/20 border border-green-600/30">
                                  <div className="flex items-center gap-1 mb-1">
                                    <IoShieldCheckmarkOutline size={12} className="text-green-400" />
                                    <span className="text-[9px] font-semibold text-green-400">Payment Held in Escrow</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {meta.productImage && (
                                      <img src={meta.productImage} alt="" className="w-6 h-6 rounded object-cover" />
                                    )}
                                    <span className="text-[9px] font-semibold truncate">{meta.productName}</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-green-300">{formatPrice(meta.amount)}</p>
                                  <p className="text-[8px] text-white/40 mt-0.5">Order #{meta.orderId.slice(0, 8)}</p>
                                  <p className="text-[8px] text-white/50 mt-0.5">Funds held safely — released when delivery is confirmed</p>
                                  {isBuyer && (
                                    <div className="flex gap-1 mt-1.5">
                                      <button onClick={() => handleConfirmDelivery(meta.orderId)} className="flex-1 text-[8px] px-1.5 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white font-semibold">
                                        Confirm Delivery
                                      </button>
                                      <button onClick={() => handleDispute(meta.orderId)} className="flex-1 text-[8px] px-1.5 py-0.5 rounded bg-red-600/70 hover:bg-red-500 text-white font-semibold">
                                        Dispute
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : msg.messageType === "escrow_update" ? (
                            (() => {
                              const meta = parseMeta<EscrowMeta>(msg);
                              if (!meta) return <span>{msg.content}</span>;
                              const isReleased = meta.escrowEvent === "released";
                              const isDisputed = meta.escrowEvent === "disputed";
                              const isRefunded = meta.escrowEvent === "refunded";
                              const borderColor = isReleased ? "border-green-600/30" : isDisputed ? "border-yellow-600/30" : isRefunded ? "border-red-600/30" : "border-white/10";
                              const textColor = isReleased ? "text-green-400" : isDisputed ? "text-yellow-400" : isRefunded ? "text-red-400" : "text-white/60";
                              const label = isReleased ? "Funds Released" : isDisputed ? "Dispute Opened" : isRefunded ? "Order Refunded" : "Escrow Update";
                              return (
                                <div className={`p-1.5 rounded bg-black/20 border ${borderColor}`}>
                                  <div className="flex items-center gap-1 mb-1">
                                    {isReleased ? <IoCheckmarkCircle size={12} className={textColor} /> : <IoAlertCircleOutline size={12} className={textColor} />}
                                    <span className={`text-[9px] font-semibold ${textColor}`}>{label}</span>
                                  </div>
                                  <span className="text-[9px] font-semibold truncate">{meta.productName}</span>
                                  <p className={`text-[11px] font-bold ${textColor}`}>{formatPrice(meta.amount)}</p>
                                  <p className="text-[8px] text-white/40 mt-0.5">Order #{meta.orderId.slice(0, 8)}</p>
                                </div>
                              );
                            })()
                          ) : (
                            <span>{msg.content}</span>
                          )}
                          {msg.status === "failed" && (
                            <span className="block text-[8px] text-red-400">Not connected</span>
                          )}
                        </div>
                        )}
                      </div>
                      );
                    })}
                    <p className={`text-[8px] text-white/25 mt-0.5 ${isMine ? "text-right pr-1" : "pl-1"}`}>
                      {cluster.time}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-2 py-1 rounded-2xl bg-[#2a2a2a] rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Media preview */}
      {mediaPreviews.length > 0 && (
        <div className="px-2 py-1.5 border-t border-[#333] bg-[#111]">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {mediaPreviews.map((p, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={p.url} alt="Preview" className="h-12 w-12 rounded-md object-cover" />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(p.url);
                    setMediaPreviews((prev) => prev.filter((_, j) => j !== i));
                  }}
                  className="absolute -top-1 -right-1 text-white/80 hover:text-white"
                >
                  <IoCloseCircle size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSendMedia}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[11px] font-semibold transition-opacity disabled:opacity-50"
              style={{ background: color }}
            >
              <IoSend size={11} />
              {uploading ? "Sending…" : `Send ${mediaPreviews.length > 1 ? `(${mediaPreviews.length})` : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-12 left-0 z-50">
          <EmojiPicker
            data={emojiData}
            onEmojiSelect={onEmojiSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            perLine={7}
            emojiSize={18}
            emojiButtonSize={28}
            maxFrequentRows={2}
          />
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[#333] bg-[#111] shrink-0">
        <button onClick={() => setShowEmoji((p) => !p)} className="p-1 text-white/40 hover:text-white/70 transition-colors">
          <IoHappyOutline size={16} />
        </button>
        <button onClick={() => fileRef.current?.click()} className="p-1 text-white/40 hover:text-white/70 transition-colors">
          <IoImageOutline size={16} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Write a message..."
          className="flex-1 bg-[#2a2a2a] text-white text-[11px] px-2.5 py-1 rounded-full outline-none placeholder:text-white/30 border border-transparent focus:border-[#6B4EFF]/50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          className="p-1 rounded-full hover:bg-white/5 disabled:text-white/20 transition-colors"
          style={{ color: text.trim() ? color : undefined }}
        >
          <IoSend size={12} />
        </button>
      </div>
      {viewingImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer" onClick={() => setViewingImage(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setViewingImage(null)}>
            <IoCloseOutline size={32} />
          </button>
          <img src={viewingImage} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-default" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
