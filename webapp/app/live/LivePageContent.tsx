"use client";

import { useRouter } from "next/navigation";
import { IoRadioOutline } from "react-icons/io5";
import LiveStreamCard, { useLiveStreams } from "@/components/LiveStreamCard";
import { useAuth } from "@/lib/AuthContext";

export default function LivePageContent() {
  const router = useRouter();
  const auth = useAuth();
  const allStreams = useLiveStreams();
  const myId = auth.user?.id;
  const streams = myId ? allStreams.filter((s) => s.hostId !== myId) : allStreams;

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <h1 className="text-[15px] font-bold text-text">Live Streams</h1>
        </div>
        <button
          onClick={() => router.push("/live/broadcast")}
          className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-red-600"
        >
          <IoRadioOutline size={14} />
          Go Live
        </button>
      </div>

      {streams.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <IoRadioOutline size={40} className="text-light-text/30" />
          <p className="text-[14px] font-semibold text-light-text">No one is live right now</p>
          <p className="text-[12px] text-light-text/60">Be the first to go live!</p>
          <button
            onClick={() => router.push("/live/broadcast")}
            className="mt-2 rounded-full bg-red-500 px-6 py-2.5 text-[13px] font-bold text-white hover:bg-red-600"
          >
            Start Streaming
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {streams.map((s) => (
            <LiveStreamCard key={s.roomId} stream={s} />
          ))}
        </div>
      )}
    </div>
  );
}
