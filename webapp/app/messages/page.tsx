"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore, type ChatContact } from "@/lib/chatStore";
import { chatSocket, type ChatMessage } from "@/lib/chatSocket";
import { AuthStorage } from "@/lib/authStorage";
import { apiUploadFile } from "@/lib/api";
import { IoArrowBack, IoSend, IoHappyOutline, IoImageOutline, IoCloseCircle } from "react-icons/io5";
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
            const { contact, lastMessage, unreadCount, isOnline } = thread;
            const borderColor = userColor(contact.userId);
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
                    <p className={`text-[13px] truncate ${unreadCount > 0 ? "font-bold text-text" : "font-medium text-text"}`}>{contact.name}</p>
                    <span className="text-[10px] text-light-text flex-shrink-0 ml-2">{lastMsgTime(lastMessage)}</span>
                  </div>
                  <p className={`text-[12px] truncate ${unreadCount > 0 ? "font-semibold text-text" : "text-light-text"}`}>
                    {lastMsgPreview(lastMessage)}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="flex-shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
          {messages.length === 0 && (
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
                    {cluster.messages.map((msg) => (
                      <div key={msg.id ?? msg.clientMessageId} className={`flex mb-[3px] ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-1 rounded-2xl text-[13px] leading-[1.4] break-words ${
                          isMine
                            ? "text-white rounded-br-sm"
                            : "bg-feed-bg text-text rounded-bl-sm"
                        }`} style={isMine ? { background: color } : undefined}>
                          {msg.messageType === "image" ? (
                            <img src={msg.content} alt="" className="max-w-full rounded-lg max-h-[200px] object-cover" />
                          ) : (
                            <span>{msg.content}</span>
                          )}
                          {msg.status === "failed" && (
                            <span className="block text-[10px] text-red-400">Not connected</span>
                          )}
                        </div>
                      </div>
                    ))}
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

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative px-3 py-2 border-t border-border bg-background">
          <img src={mediaPreview.url} alt="Preview" className="h-28 rounded-lg object-cover" />
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
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-background shrink-0">
        <button onClick={() => setShowEmoji((p) => !p)} className="p-1 text-light-text hover:text-text transition-colors">
          <IoHappyOutline size={22} />
        </button>
        <button onClick={() => fileRef.current?.click()} className="p-1 text-light-text hover:text-text transition-colors">
          <IoImageOutline size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Write a message..."
          className="flex-1 bg-feed-bg text-text text-[13px] px-4 py-2 rounded-full outline-none placeholder:text-light-text border border-transparent focus:border-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-full disabled:text-light-text transition-colors"
          style={{ color: text.trim() ? color : undefined }}
        >
          <IoSend size={18} />
        </button>
      </div>
    </div>
  );
}
