"use client";

import { create } from "zustand";
import type { ChatMessage } from "./chatSocket";

export interface ChatContact {
  userId: string;
  name: string;
  photo: string | null;
  occupation?: string | null;
  activityScore?: number;
}

export interface ChatThread {
  contact: ChatContact;
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isTyping: boolean;
  isOnline: boolean;
}

const CONTACTS_KEY = "twedot_chat_contacts";
const OPEN_IDS_KEY = "twedot_chat_open";

function loadSavedContacts(): Map<string, ChatThread> {
  const threads = new Map<string, ChatThread>();
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (raw) {
      const contacts: ChatContact[] = JSON.parse(raw);
      for (const c of contacts) {
        threads.set(c.userId, { contact: c, messages: [], lastMessage: null, unreadCount: 0, isTyping: false, isOnline: false });
      }
    }
  } catch {}
  return threads;
}

function loadOpenIds(): string[] {
  try {
    const raw = localStorage.getItem(OPEN_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveContacts(threads: Map<string, ChatThread>) {
  try {
    const contacts = Array.from(threads.values()).map((t) => t.contact);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {}
}

function saveOpenIds(ids: string[]) {
  try { localStorage.setItem(OPEN_IDS_KEY, JSON.stringify(ids)); } catch {}
}

interface ChatState {
  threads: Map<string, ChatThread>;
  openChatIds: string[];
  minimizedChatIds: string[];

  getThread: (userId: string) => ChatThread | undefined;
  addMessage: (chatUserId: string, msg: ChatMessage, isMine: boolean) => void;
  setContact: (contact: ChatContact) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
  markRead: (userId: string) => void;
  loadHistory: (userId: string, messages: ChatMessage[], hasMore: boolean) => void;
  openChat: (contact: ChatContact) => void;
  closeChat: (userId: string) => void;
  minimizeChat: (userId: string) => void;
  restoreChat: (userId: string) => void;
}

const initialThreads = typeof window !== "undefined" ? loadSavedContacts() : new Map<string, ChatThread>();
const initialOpenIds = typeof window !== "undefined" ? loadOpenIds() : [];

export const useChatStore = create<ChatState>((set, get) => ({
  threads: initialThreads,
  openChatIds: initialOpenIds,
  minimizedChatIds: [],

  getThread: (userId) => get().threads.get(userId),

  addMessage: (chatUserId, msg, isMine) => set((state) => {
    const threads = new Map(state.threads);
    const existing = threads.get(chatUserId);
    let messages = existing?.messages ?? [];
    if (messages.some((m) => m.id === msg.id)) return state;
    if (msg.clientMessageId) {
      messages = messages.filter((m) => m.clientMessageId !== msg.clientMessageId || m.id !== m.clientMessageId);
    }
    const updated = [...messages, msg].sort((a, b) => {
      const ta = typeof a.timestamp === "number" ? a.timestamp : new Date(a.timestamp).getTime();
      const tb = typeof b.timestamp === "number" ? b.timestamp : new Date(b.timestamp).getTime();
      return ta - tb;
    });
    const fallbackContact: ChatContact = isMine
      ? { userId: chatUserId, name: "Unknown", photo: null }
      : { userId: chatUserId, name: msg.senderName ?? "Unknown", photo: msg.senderPhoto ?? null };
    const thread: ChatThread = {
      contact: existing?.contact ?? fallbackContact,
      messages: updated,
      lastMessage: updated[updated.length - 1],
      unreadCount: isMine ? (existing?.unreadCount ?? 0) : (existing?.unreadCount ?? 0) + 1,
      isTyping: existing?.isTyping ?? false,
      isOnline: existing?.isOnline ?? false,
    };
    threads.set(chatUserId, thread);
    if (!existing) saveContacts(threads);
    return { threads };
  }),

  setContact: (contact) => set((state) => {
    const threads = new Map(state.threads);
    const existing = threads.get(contact.userId);
    threads.set(contact.userId, {
      contact,
      messages: existing?.messages ?? [],
      lastMessage: existing?.lastMessage ?? null,
      unreadCount: existing?.unreadCount ?? 0,
      isTyping: existing?.isTyping ?? false,
      isOnline: existing?.isOnline ?? false,
    });
    return { threads };
  }),

  setTyping: (userId, isTyping) => set((state) => {
    const threads = new Map(state.threads);
    const existing = threads.get(userId);
    if (!existing) return state;
    threads.set(userId, { ...existing, isTyping });
    return { threads };
  }),

  setOnline: (userId, online) => set((state) => {
    const threads = new Map(state.threads);
    const existing = threads.get(userId);
    if (!existing) return state;
    threads.set(userId, { ...existing, isOnline: online });
    return { threads };
  }),

  markRead: (userId) => set((state) => {
    const threads = new Map(state.threads);
    const existing = threads.get(userId);
    if (!existing || existing.unreadCount === 0) return state;
    threads.set(userId, { ...existing, unreadCount: 0 });
    return { threads };
  }),

  loadHistory: (userId, messages, _hasMore) => set((state) => {
    const threads = new Map(state.threads);
    const existing = threads.get(userId);
    const existingMsgs = existing?.messages ?? [];
    const existingIds = new Set(existingMsgs.map((m) => m.id));
    const newMsgs = messages.filter((m) => !existingIds.has(m.id));
    if (newMsgs.length === 0) return state;
    const merged = [...newMsgs, ...existingMsgs].sort((a, b) => {
      const ta = typeof a.timestamp === "number" ? a.timestamp : new Date(a.timestamp).getTime();
      const tb = typeof b.timestamp === "number" ? b.timestamp : new Date(b.timestamp).getTime();
      return ta - tb;
    });
    const thread: ChatThread = {
      contact: existing?.contact ?? { userId, name: "Unknown", photo: null },
      messages: merged,
      lastMessage: merged[merged.length - 1],
      unreadCount: existing?.unreadCount ?? 0,
      isTyping: existing?.isTyping ?? false,
      isOnline: existing?.isOnline ?? false,
    };
    threads.set(userId, thread);
    return { threads };
  }),

  openChat: (contact) => set((state) => {
    const threads = new Map(state.threads);
    if (!threads.has(contact.userId)) {
      threads.set(contact.userId, {
        contact,
        messages: [],
        lastMessage: null,
        unreadCount: 0,
        isTyping: false,
        isOnline: false,
      });
    } else {
      const t = threads.get(contact.userId)!;
      threads.set(contact.userId, { ...t, contact });
    }
    saveContacts(threads);
    const openChatIds = state.openChatIds.filter((id) => id !== contact.userId);
    openChatIds.push(contact.userId);
    if (openChatIds.length > 3) openChatIds.shift();
    const minimizedChatIds = state.minimizedChatIds.filter((id) => id !== contact.userId);
    saveOpenIds(openChatIds);
    return { threads, openChatIds, minimizedChatIds };
  }),

  closeChat: (userId) => set((state) => {
    const openChatIds = state.openChatIds.filter((id) => id !== userId);
    saveOpenIds(openChatIds);
    return { openChatIds, minimizedChatIds: state.minimizedChatIds.filter((id) => id !== userId) };
  }),

  minimizeChat: (userId) => set((state) => {
    const openChatIds = state.openChatIds.filter((id) => id !== userId);
    saveOpenIds(openChatIds);
    return { openChatIds, minimizedChatIds: [...state.minimizedChatIds.filter((id) => id !== userId), userId] };
  }),

  restoreChat: (userId) => set((state) => {
    const openChatIds = [...state.openChatIds.filter((id) => id !== userId), userId];
    if (openChatIds.length > 3) openChatIds.shift();
    saveOpenIds(openChatIds);
    return {
      openChatIds,
      minimizedChatIds: state.minimizedChatIds.filter((id) => id !== userId),
    };
  }),
}));
