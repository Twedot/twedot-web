"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface LiveStream {
  roomId: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  viewers: number;
  price: number;
}

function useLiveStreams() {
  const [streams, setStreams] = useState<LiveStream[]>([]);

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch("/twedot-api/stream-api/streams/live");
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (!Array.isArray(data)) return;
      setStreams(
        (data as Record<string, unknown>[]).map((r) => ({
          roomId: (r.id as string) ?? "",
          hostId: (r.hostId as string) ?? "",
          hostName: (r.hostName as string) || "Live",
          hostPhoto: (r.hostPhoto as string) || "",
          title: (r.title as string) || "",
          viewers: (r.viewers as number) || 0,
          price: (r.price as number) || 0,
        }))
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetchStreams();
    const id = setInterval(fetchStreams, 10_000);
    return () => clearInterval(id);
  }, [fetchStreams]);

  return streams;
}

export default function LiveStoriesStrip() {
  const streams = useLiveStreams();
  const [active, setActive] = useState<LiveStream | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  if (streams.length === 0) return null;

  return (
    <>
      {/* ── Horizontal live stories strip ── */}
      <div className="border-b border-border bg-background px-4 py-3">
        <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-light-text">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Live Now
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {streams.map((s) => (
            <button
              key={s.roomId}
              onClick={() => setActive(s)}
              className="group relative flex-shrink-0 overflow-hidden rounded-xl focus:outline-none"
              style={{ width: 82, height: 132 }}
            >
              {/* Host photo background */}
              {s.hostPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.hostPhoto}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 text-2xl font-black text-white/80">
                  {s.hostName[0]?.toUpperCase()}
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />

              {/* Animated red ring border */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  border: "2.5px solid #FF0040",
                  animation: "live-ring-pulse 2s ease-in-out infinite",
                }}
              />

              {/* LIVE badge */}
              <span className="absolute left-1.5 top-1.5 rounded bg-red-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
                LIVE
              </span>

              {/* Viewer count */}
              <span className="absolute right-1.5 top-1.5 text-[8px] font-semibold text-white/80">
                👁 {s.viewers}
              </span>

              {/* Title above name */}
              {s.title && (
                <span className="absolute bottom-5 left-0 right-0 truncate px-1 text-center text-[7.5px] text-white/60">
                  #{s.title}
                </span>
              )}

              {/* Host name */}
              <span className="absolute bottom-1.5 left-0 right-0 truncate px-1 text-center text-[9px] font-bold text-white drop-shadow">
                {s.hostName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Full-screen viewer modal ── */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          onClick={(e) => { if (e.target === e.currentTarget) setActive(null); }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-black px-4 py-3">
            <span className="flex items-center gap-1.5 rounded bg-red-500 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              LIVE
            </span>
            <span className="flex-1 truncate text-[15px] font-bold text-white">{active.hostName}</span>
            <a
              href={`https://world.twedot.com/?stream=${active.roomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 text-[12px] font-semibold text-purple-300 hover:text-purple-200"
            >
              Open in World ↗
            </a>
            <button
              onClick={() => setActive(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          {/* iframe player */}
          <iframe
            ref={iframeRef}
            src={`https://world.twedot.com/?stream=${active.roomId}`}
            className="flex-1 border-none bg-black"
            allow="camera; microphone; autoplay; fullscreen"
            title={`${active.hostName} — Live`}
          />
        </div>
      )}

      {/* Keyframe for the ring pulse animation */}
      <style>{`
        @keyframes live-ring-pulse {
          0%, 100% { border-color: #FF0040; box-shadow: 0 0 0 0 rgba(255,0,64,0.5); }
          50%       { border-color: #FF4D6A; box-shadow: 0 0 0 5px rgba(255,0,64,0); }
        }
      `}</style>
    </>
  );
}
