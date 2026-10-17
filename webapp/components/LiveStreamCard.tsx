"use client";

import { useEffect, useCallback, useRef, useState } from "react";

export interface LiveStream {
  roomId: string;
  hostId: string;
  hostName: string;
  hostPhoto: string;
  title: string;
  viewers: number;
  price: number;
  startedAt: number;
}

/* ── hook: polls /streams/live every 10s ── */
export function useLiveStreams(): LiveStream[] {
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
          startedAt: (r.startedAt as number) || 0,
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

function fmtPrice(kobo: number) {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

function elapsedStr(startedAt: number) {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

/* ── Inline live video (iframe to embed viewer) ── */
function LiveVideoEmbed({ roomId }: { roomId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
      {visible && (
        <iframe
          src={`https://world.twedot.com/?stream=${encodeURIComponent(roomId)}&embed=1`}
          className="absolute inset-0 h-full w-full border-none"
          allow="autoplay; fullscreen; camera; microphone"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
          title="Live stream"
        />
      )}
      {!visible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
        </div>
      )}
    </div>
  );
}

/* ── Full-screen iframe viewer modal (for paid streams or "open full") ── */
function LiveViewer({ stream, onClose }: { stream: LiveStream; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center gap-3 bg-black px-4 py-3">
        <span className="flex items-center gap-1.5 rounded bg-red-500 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
        <span className="flex-1 truncate text-[15px] font-bold text-white">{stream.hostName}</span>
        <a
          href={`https://world.twedot.com/?stream=${stream.roomId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-2 text-[12px] font-semibold text-purple-300 hover:text-purple-200"
        >
          Open in World ↗
        </a>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      <iframe
        src={`https://world.twedot.com/?stream=${stream.roomId}`}
        className="flex-1 border-none bg-black"
        allow="camera; microphone; autoplay; fullscreen"
        title={`${stream.hostName} — Live`}
      />
    </div>
  );
}

/* ── The feed card itself ── */
export default function LiveStreamCard({ stream }: { stream: LiveStream }) {
  const [fullOpen, setFullOpen] = useState(false);
  const isPaid = stream.price > 0;

  return (
    <>
      <article className="border-b border-border bg-background px-4 py-3">
        {/* ── Header: avatar ring · name · LIVE · price ── */}
        <header className="mb-2.5 flex items-center gap-2.5">
          <div className="relative mt-0.5 flex-shrink-0">
            <div
              className="rounded-full p-[2.5px]"
              style={{ background: "#FF0040", animation: "lsc-ring 2s ease-in-out infinite" }}
            >
              {stream.hostPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stream.hostPhoto}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                  style={{ border: "2px solid var(--color-background, #fff)" }}
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-black text-white"
                  style={{ border: "2px solid var(--color-background, #fff)" }}
                >
                  {stream.hostName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-bold leading-tight text-text">{stream.hostName}</span>
              <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                LIVE
              </span>
              {isPaid && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  {fmtPrice(stream.price)} to watch
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-light-text">
              <span className="animate-pulse text-red-400">●</span>{" "}
              {stream.viewers.toLocaleString()} watching
              {stream.startedAt > 0 ? ` · ${elapsedStr(stream.startedAt)}` : ""}
              {stream.title ? ` · #${stream.title}` : ""}
            </p>
          </div>

          {/* Full-screen button */}
          <button
            onClick={() => setFullOpen(true)}
            className="flex-shrink-0 rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-500/20"
          >
            Full ↗
          </button>
        </header>

        {/* ── Live video (inline embed) or paid gate ── */}
        {isPaid ? (
          /* Paid: show blurred preview with pay CTA */
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
            {stream.hostPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stream.hostPhoto} alt="" className="h-full w-full object-cover blur-sm scale-110" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                <span className="text-5xl font-black text-white/20">{stream.hostName[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
              <span className="text-3xl">🔒</span>
              <p className="text-[13px] font-bold text-white">Paid Stream</p>
              <p className="text-[11px] text-white/70">{fmtPrice(stream.price)} to watch</p>
              <button
                onClick={() => setFullOpen(true)}
                className="mt-1 rounded-lg bg-red-500 px-5 py-2 text-[13px] font-bold text-white hover:bg-red-600"
              >
                Pay {fmtPrice(stream.price)} & Watch
              </button>
            </div>
          </div>
        ) : (
          /* Free: inline live video */
          <LiveVideoEmbed roomId={stream.roomId} />
        )}
      </article>

      {fullOpen && <LiveViewer stream={stream} onClose={() => setFullOpen(false)} />}

      <style>{`
        @keyframes lsc-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,0,64,0.6); }
          50%       { box-shadow: 0 0 0 5px rgba(255,0,64,0); }
        }
      `}</style>
    </>
  );
}
