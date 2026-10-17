"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  roomId: string;
  hostPhoto?: string;
}

type Phase = "idle" | "loading" | "live" | "ended" | "error";

export default function LiveStreamPlayer({ roomId, hostPhoto }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let room: any = null;

    async function join() {
      if (cancelled) return;
      setPhase("loading");

      try {
        // Dynamic import avoids SSR crash (livekit-client uses browser APIs)
        const { Room, RoomEvent, Track } = await import("livekit-client");

        const res = await fetch(
          `/twedot-api/stream-api/streams/${encodeURIComponent(roomId)}/viewer-token`,
          { credentials: "include" }
        );

        if (!res.ok || cancelled) {
          if (!cancelled) setPhase("error");
          return;
        }

        const { token, livekitUrl } = (await res.json()) as {
          token: string;
          livekitUrl: string;
        };
        if (cancelled) return;

        room = new Room({ adaptiveStream: true, dynacast: true });

        room.on(RoomEvent.TrackSubscribed, (track: any) => {
          if (cancelled) return;
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          } else if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setPhase("ended");
        });

        await room.connect(livekitUrl, token);
        if (cancelled) { room.disconnect(); return; }

        // Attach any tracks already published before we connected
        for (const participant of room.remoteParticipants.values()) {
          for (const pub of participant.trackPublications.values()) {
            if (pub.isSubscribed && pub.track) {
              if (pub.track.kind === Track.Kind.Video && videoRef.current) {
                pub.track.attach(videoRef.current);
              } else if (pub.track.kind === Track.Kind.Audio && audioRef.current) {
                pub.track.attach(audioRef.current);
              }
            }
          }
        }

        if (!cancelled) setPhase("live");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }

    // Only join once the card enters the viewport
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !room && !cancelled) join(); },
      { rootMargin: "150px" }
    );
    observer.observe(wrap);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (room) {
        try { room.disconnect(); } catch {}
      }
    };
  }, [roomId]);

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
      {/* Blurred host photo while loading / as background */}
      {hostPhoto && (phase === "idle" || phase === "loading") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hostPhoto}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30"
          style={{ filter: "blur(14px)" }}
        />
      )}

      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-contain" />
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} autoPlay />

      {(phase === "idle" || phase === "loading") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
          <p className="text-[11px] text-white/60">Joining stream…</p>
        </div>
      )}

      {phase === "ended" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[12px] text-white/50">Stream ended</p>
        </div>
      )}

      {phase === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[12px] text-white/50">Stream unavailable</p>
        </div>
      )}
    </div>
  );
}
