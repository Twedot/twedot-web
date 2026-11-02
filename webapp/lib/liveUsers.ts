"use client";

import { useCallback, useEffect, useState } from "react";

let _liveUserIds = new Set<string>();
let _listeners = new Set<() => void>();
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _refCount = 0;

async function fetchLiveUsers() {
  try {
    const res = await fetch("/twedot-api/stream-api/streams/live");
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return;
    _liveUserIds = new Set(
      (data as Record<string, unknown>[])
        .map((r) => (r.hostId as string) ?? "")
        .filter(Boolean)
    );
    _listeners.forEach((fn) => fn());
  } catch {}
}

function startPolling() {
  if (_intervalId) return;
  fetchLiveUsers();
  _intervalId = setInterval(fetchLiveUsers, 15_000);
}

function stopPolling() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export function useLiveUsers() {
  const [liveIds, setLiveIds] = useState(_liveUserIds);

  useEffect(() => {
    _refCount++;
    startPolling();

    const cb = () => setLiveIds(new Set(_liveUserIds));
    _listeners.add(cb);
    cb();

    return () => {
      _listeners.delete(cb);
      _refCount--;
      if (_refCount <= 0) {
        _refCount = 0;
        stopPolling();
      }
    };
  }, []);

  const isLive = useCallback((userId: string) => liveIds.has(userId), [liveIds]);

  return { liveIds, isLive };
}
