"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoEyeOutline,
  IoPersonOutline,
  IoSend,
  IoExpandOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { LiveStreamService, ChatMessage } from "@/lib/LiveStreamService";

const STREAM_WS_URL = "wss://prodapi.twedot.com/stream-api/ws";

export default function WatchPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [phase, setPhase] = useState<"loading" | "live" | "ended" | "error">("loading");
  const [hostName, setHostName] = useState("");
  const [hostPhoto, setHostPhoto] = useState("");
  const [title, setTitle] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [hasVideo, setHasVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<LiveStreamService | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!user?.id || !roomId) return;

    let cancelled = false;

    const svc = new LiveStreamService(STREAM_WS_URL);
    serviceRef.current = svc;

    svc.on({
      onJoined: async (info) => {
        if (cancelled) return;
        setHostName(info.hostName);
        setHostPhoto(info.hostPhoto);
        setTitle(info.title);
        setViewerCount(info.viewers);

        try {
          const { Room, RoomEvent, Track } = await import("livekit-client");
          const room = new Room({ adaptiveStream: true, dynacast: true });
          roomRef.current = room;

          let hasScreenShare = false;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          room.on(RoomEvent.TrackSubscribed, (track: any, pub: any) => {
            if (cancelled) return;
            if (track.kind === Track.Kind.Video) {
              setHasVideo(true);
              const isScreen = pub.source === Track.Source.ScreenShare;
              if (isScreen) {
                hasScreenShare = true;
                if (videoRef.current) track.attach(videoRef.current);
              } else if (!hasScreenShare && videoRef.current) {
                track.attach(videoRef.current);
              }
            } else if (track.kind === Track.Kind.Audio && audioRef.current) {
              track.attach(audioRef.current);
            }
          });

          const recheckVideo = () => {
            if (cancelled) return;
            let anyVideo = false;
            for (const p of room.remoteParticipants.values()) {
              for (const tp of p.trackPublications.values()) {
                if (tp.isSubscribed && tp.track?.kind === Track.Kind.Video && !tp.isMuted) { anyVideo = true; break; }
              }
              if (anyVideo) break;
            }
            setHasVideo(anyVideo);
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          room.on(RoomEvent.TrackUnsubscribed, (track: any, pub: any) => {
            if (cancelled) return;
            if (track.kind === Track.Kind.Video) {
              if (pub.source === Track.Source.ScreenShare) {
                hasScreenShare = false;
                track.detach(videoRef.current!);
                let foundCamera = false;
                for (const p of room.remoteParticipants.values()) {
                  for (const tp of p.trackPublications.values()) {
                    if (tp.track?.kind === Track.Kind.Video && tp.source === Track.Source.Camera && !tp.isMuted && videoRef.current) {
                      (tp.track as any).attach(videoRef.current);
                      foundCamera = true;
                    }
                  }
                }
                setHasVideo(foundCamera);
              } else {
                recheckVideo();
              }
            }
          });

          room.on(RoomEvent.TrackUnpublished, () => {
            if (cancelled) return;
            recheckVideo();
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          room.on(RoomEvent.TrackMuted, (pub: any) => {
            if (cancelled || pub.kind !== Track.Kind.Video) return;
            recheckVideo();
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          room.on(RoomEvent.TrackUnmuted, (pub: any) => {
            if (cancelled || pub.kind !== Track.Kind.Video) return;
            setHasVideo(true);
            const isScreen = pub.source === Track.Source.ScreenShare;
            if (isScreen) {
              hasScreenShare = true;
              if (videoRef.current && pub.track) (pub.track as any).attach(videoRef.current);
            } else if (!hasScreenShare && videoRef.current && pub.track) {
              (pub.track as any).attach(videoRef.current);
            }
          });

          room.on(RoomEvent.Disconnected, () => {
            if (!cancelled) setPhase("ended");
          });

          await room.connect(info.livekitUrl, info.token);
          if (cancelled) { room.disconnect(); return; }

          for (const participant of room.remoteParticipants.values()) {
            for (const pub of participant.trackPublications.values()) {
              if (pub.isSubscribed && pub.track) {
                const isScreen = pub.source === Track.Source.ScreenShare;
                if (pub.track.kind === Track.Kind.Video) {
                  if (isScreen) {
                    hasScreenShare = true;
                    if (videoRef.current) (pub.track as any).attach(videoRef.current);
                  } else if (!hasScreenShare && videoRef.current) {
                    (pub.track as any).attach(videoRef.current);
                  }
                } else if (pub.track.kind === Track.Kind.Audio && audioRef.current) {
                  (pub.track as any).attach(audioRef.current);
                }
              }
            }
          }

          if (!cancelled) setPhase("live");
        } catch {
          if (!cancelled) setPhase("error");
        }
      },
      onChat: (msg) => setChatMessages((prev) => [...prev.slice(-200), msg]),
      onViewerCount: (c) => setViewerCount(c),
      onViewerJoined: (_uid, name) => {
        setChatMessages((prev) => [...prev.slice(-200), { userId: "", user: "", color: "#888", text: `${name} joined` }]);
      },
      onStreamEnded: () => setPhase("ended"),
      onError: () => setPhase("error"),
    });

    svc.connect(user.id);
    svc.joinStream(roomId);

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      svc.dispose();
    };
  }, [user?.id, roomId]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !serviceRef.current) return;
    serviceRef.current.sendChat(chatInput.trim());
    setChatInput("");
  }, [chatInput]);

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }, []);

  if (!isAuthenticated) return null;

  if (phase === "ended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-center">
        <p className="text-[18px] font-bold text-white">Stream Ended</p>
        <p className="text-[13px] text-white/50">This live stream has ended.</p>
        <button
          onClick={() => router.push("/stories")}
          className="mt-2 rounded-full bg-primary px-8 py-2.5 text-[14px] font-bold text-white hover:opacity-90"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-center">
        <p className="text-[18px] font-bold text-white">Stream Unavailable</p>
        <p className="text-[13px] text-white/50">Could not connect to this stream.</p>
        <button
          onClick={() => router.push("/stories")}
          className="mt-2 rounded-full bg-primary px-8 py-2.5 text-[14px] font-bold text-white hover:opacity-90"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
        >
          <IoArrowBack size={20} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {hostPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hostPhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <IoPersonOutline size={16} className="text-white/50" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-white">{hostName || "Live Stream"}</p>
            {title && <p className="truncate text-[11px] text-white/50">{title}</p>}
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Live
        </span>
        <div className="flex items-center gap-1.5 text-white/60">
          <IoEyeOutline size={14} />
          <span className="text-[12px] font-semibold">{viewerCount}</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Video */}
        <div className="relative flex-1 bg-zinc-950">
          {/* Camera-off blur */}
          {phase === "live" && !hasVideo && hostPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hostPhoto} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ filter: "blur(20px)" }} />
          )}
          {phase === "live" && !hasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[1]">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
                {hostPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hostPhoto} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">🎙</span>
                )}
              </div>
              <p className="text-[12px] text-white/60">Camera is off</p>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline className={`h-full w-full object-contain ${phase === "live" && !hasVideo ? "hidden" : ""}`} />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio ref={audioRef} autoPlay />

          {phase === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
              <p className="text-[11px] text-white/60">Joining stream…</p>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <IoExpandOutline size={18} />
          </button>
        </div>

        {/* Chat */}
        <div className="flex w-[280px] flex-shrink-0 flex-col border-l border-white/10 sm:w-[320px]">
          <div className="border-b border-white/10 px-4 py-3">
            <h3 className="text-[13px] font-bold text-white/80">Chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {chatMessages.length === 0 && (
              <p className="py-4 text-center text-[12px] text-white/30">No messages yet</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className="py-1.5">
                {m.userId ? (
                  <p className="text-[12px] leading-[17px]">
                    <span className="font-bold" style={{ color: m.color }}>{m.user}</span>{" "}
                    <span className="text-white/80">{m.text}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-white/40">{m.text}</p>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
              placeholder="Say something…"
              className="flex-1 rounded-full bg-white/10 px-3.5 py-2 text-[12px] text-white placeholder-white/30 outline-none"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white disabled:opacity-30"
            >
              <IoSend size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
