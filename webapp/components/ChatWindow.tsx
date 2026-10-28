"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/chatStore";
import { chatSocket } from "@/lib/chatSocket";
import { AuthStorage } from "@/lib/authStorage";
import { IoClose, IoChevronDown, IoSend } from "react-icons/io5";

const HEADER_COLORS = [
  "#6B4EFF", "#E04E6A", "#2EA87E", "#E08C3A", "#3A8FE0",
  "#9B59B6", "#E06B4E", "#1ABC9C", "#F39C12", "#8E44AD",
];

function userColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return HEADER_COLORS[Math.abs(hash) % HEADER_COLORS.length];
}

function formatTime(ts: string | number) {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" ? ts : ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatWindow({ userId }: { userId: string }) {
  const thread = useChatStore((s) => s.threads.get(userId));
  const closeChat = useChatStore((s) => s.closeChat);
  const minimizeChat = useChatStore((s) => s.minimizeChat);
  const markRead = useChatStore((s) => s.markRead);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const myUserId = AuthStorage.getProfile()?.id;
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const color = userColor(userId);

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
    if (thread?.contact) chatSocket.subscribePresence([userId]);
  }, [userId, thread?.contact]);

  const [wsConnected, setWsConnected] = useState(chatSocket.connected);
  useEffect(() => {
    const unsub = chatSocket.on("connectionChange", setWsConnected);
    return unsub;
  }, []);

  const handleSend = () => {
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
    chatSocket.sendTyping(userId, false);
    inputRef.current?.focus();
  };

  const handleTyping = (value: string) => {
    setText(value);
    chatSocket.sendTyping(userId, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => chatSocket.sendTyping(userId, false), 2000);
  };

  if (!thread) return null;
  const { contact, messages, isTyping, isOnline } = thread;

  return (
    <div className="flex flex-col w-[260px] h-[320px] bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#333] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0" style={{ background: color }}>
        <div className="relative">
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
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white truncate leading-tight">{contact.name}</p>
          <p className="text-[9px] text-white/70 leading-tight">
            {!wsConnected ? "Connecting..." : isTyping ? "typing..." : isOnline ? "Active now" : ""}
          </p>
        </div>
        <button onClick={() => minimizeChat(userId)} className="p-0.5 text-white/60 hover:text-white transition-colors">
          <IoChevronDown size={12} />
        </button>
        <button onClick={() => closeChat(userId)} className="p-0.5 text-white/60 hover:text-white transition-colors">
          <IoClose size={12} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/30 text-[11px]">
            Start a conversation
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === myUserId;
          return (
            <div key={msg.id ?? msg.clientMessageId} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-2 py-0.5 rounded-2xl text-[11px] leading-[1.4] break-words ${
                isMine
                  ? "text-white rounded-br-sm"
                  : "bg-[#2a2a2a] text-white/90 rounded-bl-sm"
              }`} style={isMine ? { background: color } : undefined}>
                {msg.messageType === "image" ? (
                  <img src={msg.content} alt="" className="max-w-full rounded-lg" />
                ) : (
                  <span>{msg.content}</span>
                )}
                <span className={`block text-[8px] mt-0.5 ${msg.status === "failed" ? "text-red-400" : isMine ? "text-white/50" : "text-white/30"}`}>
                  {msg.status === "failed" ? "Not connected" : formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
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

      {/* Input */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[#333] bg-[#111] shrink-0">
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
