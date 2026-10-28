"use client";

import { useChatStore } from "@/lib/chatStore";
import ChatWindow from "./ChatWindow";

export default function ChatTray() {
  const openChatIds = useChatStore((s) => s.openChatIds);

  return (
    <div className="fixed bottom-0 right-6 z-[9999] hidden sm:flex items-end gap-2 pointer-events-none">
      {openChatIds.map((id) => (
        <div key={id} className="pointer-events-auto">
          <ChatWindow userId={id} />
        </div>
      ))}
    </div>
  );
}
