"use client";

import { useEffect, useRef, useState } from "react";
import { IoPlay, IoPause, IoVolumeMute, IoVolumeHigh, IoExpand } from "react-icons/io5";

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
}: {
  src: string;
  poster?: string;
  autoPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause when scrolled out of view
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) { el.pause(); setIsPlaying(false); } },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-play for desktop inline player — pause all others first
  useEffect(() => {
    if (!autoPlay) return;
    document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
      if (v !== videoRef.current && !v.paused) v.pause();
    });
    videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [autoPlay]);

  function revealControls() {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }

  function triggerFlash(icon: "play" | "pause") {
    setFlash(icon);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 700);
  }

  function handleVideoClick() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      // Pause every other video on the page before playing this one
      document.querySelectorAll<HTMLVideoElement>("video").forEach((v) => {
        if (v !== el && !v.paused) v.pause();
      });
      el.play(); setIsPlaying(true); triggerFlash("play");
    } else { el.pause(); setIsPlaying(false); triggerFlash("pause"); }
    revealControls();
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - rect.left) / rect.width) * el.duration;
  }

  function handleFullscreen(e: React.MouseEvent) {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  }

  function fmtTime(s: number) {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  const controlsVisible = showControls || !isPlaying;

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:w-fit"
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onMouseLeave={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        playsInline
        loop
        onClick={handleVideoClick}
        onTimeUpdate={() => {
          const el = videoRef.current;
          if (!el || !el.duration) return;
          setCurrentTime(el.currentTime);
          setProgress((el.currentTime / el.duration) * 100);
        }}
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="block w-full cursor-pointer max-h-[480px] object-contain sm:w-auto sm:max-h-[460px]"
      />

      {/* Initial play overlay */}
      {!isPlaying && !flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50">
            <IoPlay size={26} className="ml-0.5 text-white" />
          </div>
        </div>
      )}

      {/* Tap flash */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            {flash === "play"
              ? <IoPlay size={28} className="ml-1 text-white" />
              : <IoPause size={28} className="text-white" />}
          </div>
        </div>
      )}

      {/* Desktop TikTok-style controls */}
      <div
        className={`hidden sm:block absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pt-10 pb-2.5">
          {/* Progress bar */}
          <div
            className="mb-2.5 h-[3px] cursor-pointer rounded-full bg-white/30 hover:h-1.5 transition-all duration-150"
            onClick={handleSeek}
          >
            <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          {/* Controls row */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleVideoClick(); }}
              className="text-white hover:opacity-70 transition-opacity"
            >
              {isPlaying ? <IoPause size={16} /> : <IoPlay size={16} className="ml-0.5" />}
            </button>
            <span className="select-none text-[11px] font-medium tabular-nums text-white/80">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
            <div className="flex-1" />
            <button onClick={toggleMute} className="text-white hover:opacity-70 transition-opacity">
              {isMuted ? <IoVolumeMute size={16} /> : <IoVolumeHigh size={16} />}
            </button>
            <button onClick={handleFullscreen} className="text-white hover:opacity-70 transition-opacity">
              <IoExpand size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: mute button when playing */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="sm:hidden absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
        >
          {isMuted ? <IoVolumeMute size={16} /> : <IoVolumeHigh size={16} />}
        </button>
      )}
    </div>
  );
}
