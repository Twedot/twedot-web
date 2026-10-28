"use client";

import { useEffect } from "react";
import { chatSocket } from "./chatSocket";
import { useChatStore } from "./chatStore";
import { AuthStorage } from "./authStorage";

export default function ChatProvider() {
  useEffect(() => {
    const token = AuthStorage.getToken();
    if (!token) return;

    const profile = AuthStorage.getProfile();
    const myUserId = profile?.id;
    if (!myUserId) return;

    chatSocket.connect();

    const unsubs: (() => void)[] = [];

    unsubs.push(chatSocket.on("message", (msg) => {
      const chatUserId = msg.senderId === myUserId ? msg.recipientId : msg.senderId;
      const isMine = msg.senderId === myUserId;
      useChatStore.getState().addMessage(chatUserId, msg, isMine);
      if (!isMine) {
        chatSocket.markDelivered(msg.id, msg.senderId);
      }
    }));

    unsubs.push(chatSocket.on("messageSent", (msg) => {
      const chatUserId = msg.recipientId;
      useChatStore.getState().addMessage(chatUserId, { ...msg, senderId: myUserId }, true);
    }));

    unsubs.push(chatSocket.on("typing", (data) => {
      useChatStore.getState().setTyping(data.userId, data.isTyping);
    }));

    unsubs.push(chatSocket.on("online", (data) => {
      useChatStore.getState().setOnline(data.userId, true);
    }));

    unsubs.push(chatSocket.on("offline", (data) => {
      useChatStore.getState().setOnline(data.userId, false);
    }));

    unsubs.push(chatSocket.on("presenceBatch", (statuses) => {
      const store = useChatStore.getState();
      for (const [userId, status] of Object.entries(statuses)) {
        store.setOnline(userId, status.online);
      }
    }));

    unsubs.push(chatSocket.on("history", (data) => {
      useChatStore.getState().loadHistory(data.peerId, data.messages as any, data.hasMore);
    }));

    return () => {
      unsubs.forEach((u) => u());
      chatSocket.disconnect();
    };
  }, []);

  return null;
}
