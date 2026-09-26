"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./api";
import type { StatusPost } from "./types";

// Mobile tracks isViewed per-status (app/(tabs)/_layout.tsx's hasUnseenStatus) — the web
// feed has no per-post view-state sync, so this approximates the same user-visible
// behavior with a device-local "last visited /feed" timestamp instead: the dot shows
// when a post is newer than that, and clears once the feed page is opened.
const LAST_SEEN_KEY = "twedot_last_seen_feed";

export function markFeedSeen() {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch {
    // best-effort — private browsing / storage disabled
  }
}

export function useHasUnseenStories() {
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    let lastSeen = 0;
    try {
      lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
    } catch {
      // best-effort
    }

    apiGet<StatusPost[]>("/status/public?page=1&limit=1")
      .then((posts) => {
        const newest = posts[0];
        if (newest && new Date(newest.createdAt).getTime() > lastSeen) {
          setHasUnseen(true);
        }
      })
      .catch(() => {});
  }, []);

  return hasUnseen;
}
