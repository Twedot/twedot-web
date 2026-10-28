"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/chatStore";
import { chatSocket } from "@/lib/chatSocket";
import { AuthStorage } from "@/lib/authStorage";
import { IoClose, IoChevronDown, IoSend } from "react-icons/io5";

function formatTime(ts: string | number) {
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
    }
  }, [userId, thread?.contact]);


  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    chatSocket.send(userId, trimmed);
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
    <div className="flex flex-col w-[328px] h-[420px] bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#333] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#111] border-b border-[#333] shrink-0">
        <div className="relative">
          {contact.photo ? (
            <img src={contact.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#6B4EFF] flex items-center justify-center text-white text-xs font-bold">
              {contact.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#111]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">{contact.name}</p>
          <p className="text-[11px] text-white/50 leading-tight">
            {isTyping ? "typing..." : isOnline ? "Active now" : ""}
          </p>
        </div>
        <button onClick={() => minimizeChat(userId)} className="p-1 text-white/50 hover:text-white transition-colors">
          <IoChevronDown size={16} />
        </button>
        <button onClick={() => closeChat(userId)} className="p-1 text-white/50 hover:text-white transition-colors">
          <IoClose size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/30 text-[13px]">
            Start a conversation
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === myUserId;
          return (
            <div key={msg.id ?? msg.clientMessageId} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-[13px] leading-[1.4] break-words ${
                isMine
                  ? "bg-[#6B4EFF] text-white rounded-br-sm"
                  : "bg-[#2a2a2a] text-white/90 rounded-bl-sm"
              }`}>
                {msg.messageType === "image" ? (
                  <img src={msg.content} alt="" className="max-w-full rounded-lg" />
                ) : (
                  <span>{msg.content}</span>
                )}
                <span className={`block text-[10px] mt-0.5 ${isMine ? "text-white/50" : "text-white/30"}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl bg-[#2a2a2a] rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#333] bg-[#111] shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Write a message..."
          className="flex-1 bg-[#2a2a2a] text-white text-[13px] px-3 py-2 rounded-full outline-none placeholder:text-white/30 border border-transparent focus:border-[#6B4EFF]/50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-full text-[#6B4EFF] hover:bg-[#6B4EFF]/10 disabled:text-white/20 disabled:hover:bg-transparent transition-colors"
        >
          <IoSend size={16} />
        </button>
      </div>
    </div>
  );
}
