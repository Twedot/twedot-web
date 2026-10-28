"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/chatStore";
import { chatSocket, type ChatMessage } from "@/lib/chatSocket";
import { AuthStorage } from "@/lib/authStorage";
import { apiUploadFile } from "@/lib/api";
import { IoClose, IoChevronDown, IoSend, IoHappyOutline, IoImageOutline, IoCloseCircle } from "react-icons/io5";
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
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
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
      if (thread.messages.length === 0) chatSocket.requestHistory(userId);
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
    if (!mediaPreview || !myUserId || uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", mediaPreview.file);
      form.append("type", "chat");
      const result = await apiUploadFile<{ url: string }>("/upload/direct", form);
      const url = result.url;
      const clientMessageId = chatSocket.send(userId, url, "image", { fileName: mediaPreview.file.name, fileSize: mediaPreview.file.size });
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
    } catch {}
    URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
    setUploading(false);
  }, [mediaPreview, myUserId, userId, uploading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview({ file, url: URL.createObjectURL(file) });
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
                    {cluster.messages.map((msg) => (
                      <div key={msg.id ?? msg.clientMessageId} className={`flex mb-[3px] ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-2 py-0.5 rounded-2xl text-[11px] leading-[1.4] break-words ${
                          isMine
                            ? "text-white rounded-br-sm"
                            : "bg-[#2a2a2a] text-white/90 rounded-bl-sm"
                        }`} style={isMine ? { background: color } : undefined}>
                          {msg.messageType === "image" ? (
                            <img src={msg.content} alt="" className="max-w-full rounded-lg max-h-[140px] object-cover" />
                          ) : (
                            <span>{msg.content}</span>
                          )}
                          {msg.status === "failed" && (
                            <span className="block text-[8px] text-red-400">Not connected</span>
                          )}
                        </div>
                      </div>
                    ))}
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
      {mediaPreview && (
        <div className="relative px-2 py-1.5 border-t border-[#333] bg-[#111]">
          <img src={mediaPreview.url} alt="Preview" className="h-20 rounded-lg object-cover" />
          <button onClick={() => { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); }} className="absolute top-2 right-3 text-white/80 hover:text-white">
            <IoCloseCircle size={18} />
          </button>
          <button
            onClick={handleSendMedia}
            disabled={uploading}
            className="absolute bottom-2 right-3 p-1.5 rounded-full transition-colors"
            style={{ background: color, opacity: uploading ? 0.5 : 1 }}
          >
            <IoSend size={12} className="text-white" />
          </button>
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
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
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
          disabled={!text.trim()}
          className="p-1 rounded-full hover:bg-white/5 disabled:text-white/20 transition-colors"
          style={{ color: text.trim() ? color : undefined }}
        >
          <IoSend size={12} />
        </button>
      </div>
    </div>
  );
}
