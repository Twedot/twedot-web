"use client";

import { useEffect, useRef, useState } from "react";
import { IoPlay, IoVolumeMute, IoVolumeHigh } from "react-icons/io5";

export default function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Pause when scrolled out of view
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }

  return (
    <div className="w-full">
      <div className="relative block w-full overflow-hidden" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted={isMuted}
          playsInline
          loop
          onEnded={() => setIsPlaying(false)}
          className="block w-full max-h-[560px] cursor-pointer object-contain"
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50">
              <IoPlay size={26} color="#fff" className="ml-0.5" />
            </div>
          </div>
        )}

        {isPlaying && (
          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
          >
            {isMuted ? <IoVolumeMute size={16} /> : <IoVolumeHigh size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
