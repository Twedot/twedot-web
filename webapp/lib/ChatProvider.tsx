"use client";

import { useEffect } from "react";
import { chatSocket } from "./chatSocket";
import { useChatStore } from "./chatStore";
import { AuthStorage } from "./authStorage";
import { getDeviceId } from "./deviceId";

export default function ChatProvider() {
  useEffect(() => {
    const token = AuthStorage.getToken();
    if (!token) return;

    const profile = AuthStorage.getProfile();
    const myUserId = profile?.id;
    if (!myUserId) return;

    chatSocket.connect();

    const unsubs: (() => void)[] = [];

    unsubs.push(chatSocket.on("connectionChange", (connected) => {
      if (connected) {
        const threads = useChatStore.getState().threads;
        for (const [peerId] of threads) {
          chatSocket.requestHistory(peerId);
        }
        chatSocket.listConversations();
      }
    }));

    unsubs.push(chatSocket.on("conversationsList", (peers) => {
      const store = useChatStore.getState();
      for (const peerId of peers) {
        if (!store.threads.has(peerId)) {
          store.setContact({ userId: peerId, name: "Unknown", photo: null });
        }
        chatSocket.requestHistory(peerId);
      }
    }));

    // Fetch pending message requests so they show on web even if mobile acked the
    // offline queue first.
    const reqHeaders: Record<string, string> = {
      "x-device-id": getDeviceId(),
      "x-platform": "web",
    };
    if (token) reqHeaders.Authorization = `Bearer ${token}`;
    fetch("/twedot-api/api/v1/messages/requests", { credentials: "include", headers: reqHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        const items = json?.data;
        if (!Array.isArray(items)) return;
        const store = useChatStore.getState();
        for (const req of items) {
          if (!store.threads.has(req.userId)) {
            store.setRequestThread({
              userId: req.userId,
              name: req.name || "Unknown",
              photo: req.photo || null,
              occupation: req.occupation || null,
            });
          }
        }
      })
      .catch(() => {});

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
      const state = useChatStore.getState();
      const original = msg.clientMessageId
        ? state.getThread(chatUserId)?.messages.find((m) => m.clientMessageId === msg.clientMessageId)
        : undefined;
      state.addMessage(chatUserId, {
        ...msg,
        senderId: myUserId,
        messageType: msg.messageType || original?.messageType || "text",
        metadata: msg.metadata ?? original?.metadata,
      }, true);
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
