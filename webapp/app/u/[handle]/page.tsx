import type { Metadata } from "next";
import UserPageClient from "./UserPageClient";
import { extractShortId } from "@/lib/url";

const API_ORIGIN = "https://prodapi.twedot.com";

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

async function fetchUser(shortId: string) {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/users/by-short/${shortId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> }
): Promise<Metadata> {
  const { handle } = await params;
  const shortId = extractShortId(decodeURIComponent(handle));
  const user = await fetchUser(shortId);

  const siteName = "Twedot";
  const baseUrl = "https://twedot.com";

  if (!user?.name) {
    return { title: siteName, description: "Connect with people on Twedot." };
  }

  const parts: string[] = [];
  if (user.occupation) parts.push(user.occupation);
  if (user.city || user.country) parts.push([user.city, user.country].filter(Boolean).join(", "));

  const subtitle = parts.join(" · ");
  const bio = user.bio ? truncate(user.bio, 155) : null;
  const description = bio ?? (subtitle ? `${user.name} — ${subtitle} on ${siteName}` : `${user.name}'s profile on ${siteName}.`);
  const title = `${user.name}${subtitle ? ` (${subtitle})` : ""} — ${siteName}`;
  const url = `${baseUrl}/u/${handle}`;
  const image = user.profile_photo_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
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

export default function UserPage() {
  return <UserPageClient />;
}
