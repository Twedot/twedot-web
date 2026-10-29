"use client";

import { AuthStorage } from "./authStorage";
import { getDeviceId } from "./deviceId";

const CHAT_WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "wss://upload.twedot.com/ws";

export interface ChatMessage {
  id: string;
  clientMessageId?: string;
  senderId: string;
  senderName?: string;
  senderPhone?: string;
  senderPhoto?: string;
  senderRole?: string;
  recipientId: string;
  content: string;
  messageType: string;
  timestamp: string | number;
  status?: string;
  replyToId?: string;
  replySnapshot?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

type MessageHandler = (msg: ChatMessage) => void;
type StatusHandler = (data: { messageId: string; clientMessageId?: string; readBy?: string; readAt?: string }) => void;
type TypingHandler = (data: { userId: string; isTyping: boolean }) => void;
type PresenceHandler = (data: { userId: string }) => void;
type PresenceBatchHandler = (statuses: Record<string, { online: boolean; lastSeen?: string }>) => void;
type HistoryHandler = (data: { peerId: string; messages: ChatMessage[]; hasMore: boolean }) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private intentionalClose = false;
  private visibilityBound = false;

  private onMessage: MessageHandler[] = [];
  private onMessageSent: MessageHandler[] = [];
  private onDelivered: StatusHandler[] = [];
  private onRead: StatusHandler[] = [];
  private onTyping: TypingHandler[] = [];
  private onOnline: PresenceHandler[] = [];
  private onOffline: PresenceHandler[] = [];
  private onPresenceBatch: PresenceBatchHandler[] = [];
  private onHistory: HistoryHandler[] = [];
  private onConnectionChange: ((connected: boolean) => void)[] = [];

  connect() {
    const token = AuthStorage.getToken();
    if (!token) {
      console.warn("[chat-ws] no token, skipping connect");
      return;
    }

    this.intentionalClose = false;
    const url = `${CHAT_WS_URL}?token=${encodeURIComponent(token)}&deviceId=${encodeURIComponent(getDeviceId())}`;

    if (!this.visibilityBound) {
      this.visibilityBound = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && !this.intentionalClose) {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
          }
        }
      });
    }

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.error("[chat-ws] WebSocket constructor failed:", e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log("[chat-ws] connected");
      this.reconnectDelay = 1000;
      this.emit("connectionChange", true);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleFrame(data);
      } catch {}
    };

    this.ws.onclose = (event) => {
      console.warn("[chat-ws] closed:", event.code, event.reason);
      this.emit("connectionChange", false);
      if (!this.intentionalClose) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      console.error("[chat-ws] error");
    };
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  private handleFrame(data: any) {
    switch (data.type) {
      case "receive_message":
        this.emit("message", data as ChatMessage);
        break;
      case "message_sent":
        this.emit("messageSent", data as ChatMessage);
        break;
      case "offline_messages":
        if (Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            this.emit("message", msg as ChatMessage);
          }
          this.ackOfflineMessages(data.messages.map((m: any) => m.id));
        }
        break;
      case "message_delivered":
        this.emit("delivered", data);
        break;
      case "message_read":
        this.emit("read", data);
        break;
      case "typing":
        this.emit("typing", { userId: data.userId, isTyping: !!data.isTyping });
        break;
      case "user:online":
        this.emit("online", { userId: data.userId });
        break;
      case "user:offline":
        this.emit("offline", { userId: data.userId });
        break;
      case "online_status_batch":
        if (data.statuses) this.emit("presenceBatch", data.statuses);
        break;
      case "chat_history":
        this.emit("history", { peerId: data.peerId, messages: data.messages ?? [], hasMore: !!data.hasMore });
        break;
    }
  }

  send(recipientId: string, content: string, messageType = "text", extra?: {
    replyToId?: string;
    replySnapshot?: string;
    caption?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    clientMessageId?: string;
  }) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return null;
    const clientMessageId = extra?.clientMessageId ?? crypto.randomUUID();
    this.ws.send(JSON.stringify({
      type: "send_message",
      recipientId,
      content,
      messageType,
      clientMessageId,
      ...extra,
    }));
    return clientMessageId;
  }

  sendTyping(recipientId: string, isTyping: boolean) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "typing", recipientId, isTyping }));
  }

  markRead(messageId: string, senderId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "message_read", id: messageId, recipientId: senderId }));
  }

  markDelivered(messageId: string, senderId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "message_delivered", id: messageId, recipientId: senderId }));
  }

  requestHistory(peerId: string, before?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "chat_history", recipientId: peerId, id: before ?? "" }));
  }

  subscribePresence(userIds: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !userIds.length) return;
    this.ws.send(JSON.stringify({ type: "subscribe_status", userIds }));
  }

  private ackOfflineMessages(ids: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !ids.length) return;
    this.ws.send(JSON.stringify({ type: "offline_messages_ack", messageIds: ids }));
  }

  // Event subscription
  on(event: "message", handler: MessageHandler): () => void;
  on(event: "messageSent", handler: MessageHandler): () => void;
  on(event: "delivered", handler: StatusHandler): () => void;
  on(event: "read", handler: StatusHandler): () => void;
  on(event: "typing", handler: TypingHandler): () => void;
  on(event: "online", handler: PresenceHandler): () => void;
  on(event: "offline", handler: PresenceHandler): () => void;
  on(event: "presenceBatch", handler: PresenceBatchHandler): () => void;
  on(event: "history", handler: HistoryHandler): () => void;
  on(event: "connectionChange", handler: (connected: boolean) => void): () => void;
  on(event: string, handler: any): () => void {
    const arr = this.listeners(event);
    arr.push(handler);
    return () => { const i = arr.indexOf(handler); if (i !== -1) arr.splice(i, 1); };
  }

  private listeners(event: string): any[] {
    switch (event) {
      case "message": return this.onMessage;
      case "messageSent": return this.onMessageSent;
      case "delivered": return this.onDelivered;
      case "read": return this.onRead;
      case "typing": return this.onTyping;
      case "online": return this.onOnline;
      case "offline": return this.onOffline;
      case "presenceBatch": return this.onPresenceBatch;
      case "history": return this.onHistory;
      case "connectionChange": return this.onConnectionChange;
      default: return [];
    }
  }

  private emit(event: string, data?: any) {
    for (const handler of this.listeners(event)) {
      try { handler(data); } catch {}
    }
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const chatSocket = new ChatSocket();
