"use client";

import { useRef, useState } from "react";
import { IoPlay, IoVolumeMute, IoVolumeHigh } from "react-icons/io5";

export default function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  // The outer element only centers — it stays full width so the video can sit in the
  // middle of the post, but it has no background of its own. The inner element wraps
  // tightly around the <video> (a block element sizes to its content by default), so
  // the rounded/black chrome exactly matches the video's own rendered box instead of
  // stretching full-card-width and letterboxing a portrait clip with dead black bars.
  return (
    <div className="mb-2 flex justify-center">
      <div className="relative overflow-hidden rounded-md bg-black" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted={isMuted}
          playsInline
          loop
          onEnded={() => setIsPlaying(false)}
          className="block max-h-[520px] max-w-full cursor-pointer"
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
