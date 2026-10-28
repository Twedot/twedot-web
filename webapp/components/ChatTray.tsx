"use client";

import { useChatStore, type ChatContact } from "@/lib/chatStore";
import ChatWindow from "./ChatWindow";
import { IoChevronUp, IoChatbubbleEllipses } from "react-icons/io5";

function MinimizedBubble({ userId }: { userId: string }) {
  const thread = useChatStore((s) => s.threads.get(userId));
  const restoreChat = useChatStore((s) => s.restoreChat);
  const closeChat = useChatStore((s) => s.closeChat);

  if (!thread) return null;
  const { contact, unreadCount, isOnline } = thread;

  return (
    <button
      onClick={() => restoreChat(userId)}
      onContextMenu={(e) => { e.preventDefault(); closeChat(userId); }}
      className="relative group"
      title={`${contact.name} — right-click to close`}
    >
      {contact.photo ? (
        <img src={contact.photo} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#333] group-hover:border-[#6B4EFF] transition-colors" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-[#6B4EFF] flex items-center justify-center text-white text-sm font-bold border-2 border-[#333] group-hover:border-[#6B4EFF] transition-colors">
          {contact.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1a1a]" />
      )}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </button>
  );
}

export default function ChatTray() {
  const openChatIds = useChatStore((s) => s.openChatIds);
  const minimizedChatIds = useChatStore((s) => s.minimizedChatIds);
  const threads = useChatStore((s) => s.threads);

  const totalUnread = Array.from(threads.values()).reduce((sum, t) => sum + t.unreadCount, 0);

  return (
    <div className="fixed bottom-0 right-6 z-[9999] hidden sm:flex items-end gap-2 pointer-events-none">
      {/* Open chat windows */}
      {openChatIds.map((id) => (
        <div key={id} className="pointer-events-auto">
          <ChatWindow userId={id} />
        </div>
      ))}

      {/* Minimized bubbles column */}
      {minimizedChatIds.length > 0 && (
        <div className="flex flex-col-reverse gap-2 pb-4 pointer-events-auto">
          {minimizedChatIds.map((id) => (
            <MinimizedBubble key={id} userId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
