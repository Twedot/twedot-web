import type { Metadata } from "next";
import PostPageClient from "./PostPageClient";

const API_ORIGIN = "https://prodapi.twedot.com";

interface PostPreview {
  id: string;
  type: string;
  caption: string | null;
  thumbnailUrl: string | null;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string | null;
}

async function fetchPreview(postId: string): Promise<PostPreview | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/status/by-short/${postId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

export async function generateMetadata(
  { params }: { params: Promise<{ postId: string }> }
): Promise<Metadata> {
  const { postId } = await params;
  const post = await fetchPreview(postId);

  const siteName = "Twedot";
  const baseUrl = "https://twedot.com";

  if (!post) {
    return {
      title: siteName,
      description: "Connect with people, showcase your work, and grow your network.",
    };
  }

  const caption = post.caption ?? "";
  const title = post.ownerName
    ? `${post.ownerName} on ${siteName}${caption ? ` — "${truncate(caption, 60)}"` : ""}`
    : siteName;
  const description = caption
    ? truncate(caption, 160)
    : `See this post by ${post.ownerName} on ${siteName}.`;

  const imageUrl = post.thumbnailUrl ?? post.ownerPhoto ?? undefined;
  const postUrl = `${baseUrl}/p/${postId}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      url: postUrl,
      title,
      description,
      siteName,
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default function PostPage() {
  return <PostPageClient />;
}
