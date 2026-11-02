"use client";

import { useCallback, useEffect, useState } from "react";

export interface LiveStreamInfo {
  roomId: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  viewers: number;
}

let _liveUserIds = new Set<string>();
let _liveStreamMap = new Map<string, LiveStreamInfo>();
let _listeners = new Set<() => void>();
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _refCount = 0;

async function fetchLiveUsers() {
  try {
    const res = await fetch("/twedot-api/stream-api/streams/live");
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return;
    const rows = data as Record<string, unknown>[];
    _liveUserIds = new Set(
      rows.map((r) => (r.hostId as string) ?? "").filter(Boolean)
    );
    _liveStreamMap = new Map(
      rows.filter((r) => r.hostId).map((r) => [
        r.hostId as string,
        {
          roomId: (r.id as string) ?? "",
          hostId: (r.hostId as string) ?? "",
          hostName: (r.hostName as string) || "Live",
          hostPhoto: (r.hostPhoto as string) || "",
          title: (r.title as string) || "",
          viewers: (r.viewers as number) || 0,
        },
      ])
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
  const [streamMap, setStreamMap] = useState(_liveStreamMap);

  useEffect(() => {
    _refCount++;
    startPolling();

    const cb = () => {
      setLiveIds(new Set(_liveUserIds));
      setStreamMap(new Map(_liveStreamMap));
    };
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
  const getStream = useCallback((userId: string) => streamMap.get(userId) ?? null, [streamMap]);
  const allStreams = useCallback(() => Array.from(streamMap.values()), [streamMap]);

  return { liveIds, isLive, getStream, allStreams };
}
