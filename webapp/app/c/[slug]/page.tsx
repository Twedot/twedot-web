"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { extractShortId } from "@/lib/url";
import ChannelDetailPage from "@/app/channels/[roomId]/page";

export default function ChannelBySlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const shortId = extractShortId(decodeURIComponent(slug));
    apiGet<{ id: string }>(`/rooms/by-short/${shortId}`)
      .then((room) => setRoomId(room.id))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="flex h-64 items-center justify-center px-4">
        <p className="text-[14px] text-light-text">Channel not found.</p>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
      </div>
    );
  }

  return <ChannelDetailPage roomId={roomId} />;
}
