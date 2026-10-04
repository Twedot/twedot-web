import type { Metadata } from "next";
import ChannelPageClient from "./ChannelPageClient";
import { extractShortId } from "@/lib/url";

const API_ORIGIN = "https://prodapi.twedot.com";

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

async function fetchRoom(shortId: string) {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/rooms/by-short/${shortId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.room ?? json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const shortId = extractShortId(decodeURIComponent(slug));
  const room = await fetchRoom(shortId);

  const siteName = "Twedot";
  const baseUrl = "https://twedot.com";

  if (!room?.name) {
    return { title: siteName, description: "Explore channels on Twedot." };
  }

  const title = `${room.name} — ${siteName}`;
  const description = room.description
    ? truncate(room.description, 160)
    : `${room.name} channel on ${siteName}.`;
  const url = `${baseUrl}/c/${slug}`;
  const image = room.photo_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName,
      ...(image ? { images: [{ url: image, width: 400, height: 400 }] } : {}),
    },
    twitter: {
      card: image ? "summary" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  };
}

export default function ChannelPage() {
  return <ChannelPageClient />;
}
