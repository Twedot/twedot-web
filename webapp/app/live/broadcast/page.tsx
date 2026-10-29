"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoVideocamOutline,
  IoVideocamOffOutline,
  IoMicOutline,
  IoMicOffOutline,
  IoDesktopOutline,
  IoStopCircle,
  IoPersonOutline,
  IoEyeOutline,
  IoSend,
  IoRadioOutline,
  IoChevronDown,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { LiveStreamService, ChatMessage } from "@/lib/LiveStreamService";

const STREAM_WS_URL = "wss://prodapi.twedot.com/stream-api/ws";
const CATEGORIES = ["General", "Gaming", "Music", "Education", "Sports", "Entertainment", "Tech"];

type Phase = "setup" | "connecting" | "live" | "ended";

export default function BroadcastPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [price, setPrice] = useState(0);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [paid, setPaid] = useState(false);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const serviceRef = useRef<LiveStreamService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/30 border-t-primary" />
    </div>
  );

  // Only request camera AFTER auth is confirmed to avoid re-render logout
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 30 },
      audio: true,
    }).then((stream) => {
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      mediaStreamRef.current = stream;
      setCameraReady(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Attach stream to video element whenever it becomes available
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [cameraReady, phase]);

  useEffect(() => {
    return () => {
      serviceRef.current?.dispose();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const goLive = useCallback(async () => {
    if (!user?.id || !title.trim()) return;
    if (!mediaStreamRef.current) {
      setError("Camera not available. Allow permissions and reload.");
      return;
    }
    setPhase("connecting");
    setError(null);

    const svc = new LiveStreamService(STREAM_WS_URL);
    serviceRef.current = svc;

    svc.on({
      onLiveStarted: async (_streamId, token, livekitUrl) => {
        try {
          await svc.connectRoom(token, livekitUrl);
          const stream = mediaStreamRef.current!;
          const vt = stream.getVideoTracks()[0];
          const at = stream.getAudioTracks()[0];
          if (vt) await svc.publishCameraTrack(vt);
          if (at) await svc.publishMicTrack(at);
          setPhase("live");
          const start = Date.now();
          timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to connect");
          setPhase("setup");
        }
      },
      onResumed: async (_streamId, token, livekitUrl) => {
        try {
          await svc.connectRoom(token, livekitUrl);
          const stream = mediaStreamRef.current!;
          const vt = stream.getVideoTracks()[0];
          const at = stream.getAudioTracks()[0];
          if (vt) await svc.publishCameraTrack(vt);
          if (at) await svc.publishMicTrack(at);
          setPhase("live");
          const start = Date.now();
          timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
        } catch {
          setError("Failed to resume stream");
          setPhase("setup");
        }
      },
      onChat: (msg) => setChatMessages((prev) => [...prev.slice(-200), msg]),
      onViewerCount: (c) => setViewerCount(c),
      onViewerJoined: (_uid, name) => {
        setChatMessages((prev) => [...prev.slice(-200), { userId: "", user: "", color: "#888", text: `${name} joined` }]);
      },
      onStreamEnded: () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("ended");
      },
      onError: (msg) => setError(msg),
    });

    svc.connect(user.id);
    svc.goLive(title.trim(), category, paid ? price : 0);
  }, [user, title, category, price, paid]);

  const endStream = useCallback(() => {
    serviceRef.current?.endStream();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("ended");
  }, []);

  const toggleCamera = useCallback(async () => {
    const svc = serviceRef.current;
    if (!svc || !mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    if (cameraOn) {
      track.enabled = false;
      await svc.unpublishCamera();
      setCameraOn(false);
    } else {
      track.enabled = true;
      await svc.publishCameraTrack(track);
      setCameraOn(true);
    }
  }, [cameraOn]);

  const toggleMic = useCallback(async () => {
    const svc = serviceRef.current;
    if (!svc) return;
    await svc.setMicEnabled(!micOn);
    setMicOn(!micOn);
  }, [micOn]);

  const toggleScreen = useCallback(async () => {
    const svc = serviceRef.current;
    if (!svc) return;
    if (screenSharing) {
      await svc.unpublishScreen();
      setScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        await svc.publishScreenTrack(stream);
        setScreenSharing(true);
        stream.getVideoTracks()[0]?.addEventListener("ended", async () => {
          await svc.unpublishScreen();
          setScreenSharing(false);
        });
      } catch {}
    }
  }, [screenSharing]);

  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !serviceRef.current) return;
    serviceRef.current.sendChat(chatInput.trim());
    setChatMessages((prev) => [...prev.slice(-200), {
      userId: user?.id ?? "",
      user: user?.name ?? "You",
      color: "#6B4EFF",
      text: chatInput.trim(),
    }]);
    setChatInput("");
  }, [chatInput, user]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (isLoading || !isAuthenticated) return null;

  // ── Setup — inside AppShell, camera preview + form ──
  if (phase === "setup" || phase === "connecting") {
    return (
      <div className="px-4 py-4">
        {/* Camera preview */}
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16/9" }}>
          {cameraReady ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
            </div>
          )}

          {/* Mic/cam toggles on preview */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              onClick={() => {
                if (!mediaStreamRef.current) return;
                const t = mediaStreamRef.current.getAudioTracks()[0];
                if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); }
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${micOn ? "bg-black/40 text-white" : "bg-red-500 text-white"}`}
            >
              {micOn ? <IoMicOutline size={16} /> : <IoMicOffOutline size={16} />}
            </button>
            <button
              onClick={() => {
                if (!mediaStreamRef.current) return;
                const t = mediaStreamRef.current.getVideoTracks()[0];
                if (t) { t.enabled = !t.enabled; setCameraOn(t.enabled); }
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${cameraOn ? "bg-black/40 text-white" : "bg-red-500 text-white"}`}
            >
              {cameraOn ? <IoVideocamOutline size={16} /> : <IoVideocamOffOutline size={16} />}
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a title…"
          maxLength={80}
          autoFocus
          className="mb-3 w-full border-b border-border bg-transparent pb-2 text-[15px] font-semibold text-text outline-none placeholder-light-text focus:border-primary/40"
        />

        {/* Row: category + price */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowCatDrop(!showCatDrop)}
              className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1.5 text-[12px] font-semibold text-text"
            >
              {category}
              <IoChevronDown size={12} className={`text-light-text transition-transform ${showCatDrop ? "rotate-180" : ""}`} />
            </button>
            {showCatDrop && (
              <div className="absolute left-0 top-full z-20 mt-1 rounded-xl bg-background py-1 shadow-xl ring-1 ring-border">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setShowCatDrop(false); }}
                    className={`block w-full whitespace-nowrap px-4 py-2 text-left text-[12px] hover:bg-feed-bg ${
                      category === c ? "font-bold text-primary" : "text-text"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { setPaid(!paid); if (!paid) setPrice(0); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
              paid ? "bg-amber-500/10 text-amber-600" : "bg-feed-bg text-text"
            }`}
          >
            {paid ? "Paid" : "Free"}
          </button>
          {paid && (
            <div className="flex items-center rounded-full bg-feed-bg px-3 py-1.5">
              <span className="text-[12px] text-light-text">₦</span>
              <input
                type="number"
                value={price || ""}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                min={0}
                className="ml-1 w-16 bg-transparent text-[12px] font-semibold text-text outline-none"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">{error}</p>
        )}

        {/* Go Live button */}
        <button
          onClick={goLive}
          disabled={!title.trim() || phase === "connecting" || !cameraReady}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-[14px] font-bold text-white transition-opacity hover:bg-red-600 disabled:opacity-40"
        >
          {phase === "connecting" ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Connecting…
            </>
          ) : (
            <>
              <IoRadioOutline size={18} />
              Go Live
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Ended — fullscreen overlay ──
  if (phase === "ended") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <IoStopCircle size={32} className="text-white/50" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-white">Stream Ended</h1>
          <p className="mt-1 text-[13px] text-white/50">Duration: {fmtTime(elapsed)}</p>
        </div>
        <button
          onClick={() => router.push("/stories")}
          className="mt-2 rounded-full bg-primary px-8 py-2.5 text-[14px] font-bold text-white hover:opacity-90"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  // ── Live — fullscreen overlay on top of AppShell ──
  return (
    <div className="fixed inset-0 z-50 flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
          <span className="text-[12px] font-semibold tabular-nums text-white/60">{fmtTime(elapsed)}</span>
        </div>
        <h2 className="flex-1 truncate text-[14px] font-semibold text-white/80">{title}</h2>
        <div className="flex items-center gap-1.5 text-white/60">
          <IoEyeOutline size={14} />
          <span className="text-[12px] font-semibold">{viewerCount}</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Video */}
        <div className="relative flex-1 bg-zinc-950">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
            style={{ transform: cameraOn && !screenSharing ? "scaleX(-1)" : undefined }}
          />
          {!cameraOn && !screenSharing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                {user?.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profile_photo_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <IoPersonOutline size={36} className="text-white/30" />
                )}
              </div>
              <p className="text-[12px] text-white/40">Camera off</p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-8">
            <button
              onClick={toggleMic}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${micOn ? "bg-white/15 text-white" : "bg-red-500/80 text-white"}`}
            >
              {micOn ? <IoMicOutline size={20} /> : <IoMicOffOutline size={20} />}
            </button>
            <button
              onClick={toggleCamera}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${cameraOn ? "bg-white/15 text-white" : "bg-red-500/80 text-white"}`}
            >
              {cameraOn ? <IoVideocamOutline size={20} /> : <IoVideocamOffOutline size={20} />}
            </button>
            <button
              onClick={toggleScreen}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${screenSharing ? "bg-primary text-white" : "bg-white/15 text-white"}`}
            >
              <IoDesktopOutline size={20} />
            </button>
            <button
              onClick={endStream}
              className="flex h-11 items-center gap-2 rounded-full bg-red-500 px-5 text-[13px] font-bold text-white hover:bg-red-600"
            >
              <IoStopCircle size={18} />
              End
            </button>
          </div>
        </div>

        {/* Chat — right side panel */}
        <div className="hidden w-[320px] flex-shrink-0 flex-col border-l border-white/10 lg:flex">
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
