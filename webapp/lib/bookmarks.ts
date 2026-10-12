"use client";

import { useCallback, useEffect, useState } from "react";

// Mirrors the mobile app's own bookmark behavior (FullScreenStatusFeed.tsx's
// isStatusBookmarked) — bookmarks are device-local there too, not server-backed, so
// localStorage here is genuine parity, not a shortcut.
const STORAGE_KEY = "twedot_bookmarks";

// Module-level listener map so all useBookmark instances for the same postId
// update together when any one component toggles it.
const listeners = new Map<string, Set<(v: boolean) => void>>();

function notify(postId: string, value: boolean) {
  listeners.get(postId)?.forEach((fn) => fn(value));
}

function readBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeBookmarks(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // best-effort — private browsing / storage disabled
  }
}

export function useBookmark(postId: string) {
  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (typeof window === "undefined") return false;
    return readBookmarks().has(postId);
  });

  useEffect(() => {
    if (!listeners.has(postId)) listeners.set(postId, new Set());
    listeners.get(postId)!.add(setIsBookmarked);
    return () => {
      listeners.get(postId)?.delete(setIsBookmarked);
    };
  }, [postId]);

  const toggle = useCallback(() => {
    const ids = readBookmarks();
    if (ids.has(postId)) {
      ids.delete(postId);
    } else {
      ids.add(postId);
    }
    writeBookmarks(ids);
    const next = ids.has(postId);
    notify(postId, next);
  }, [postId]);

  return { isBookmarked, toggle };
}
