"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IoChatbubbleOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, ApiError } from "@/lib/api";
import { useUi } from "@/lib/UiContext";
import RankBadge from "@/components/RankBadge";
import type { UserProfile } from "@/lib/types";

// Mirrors the layout of app/profile/page.tsx (the viewer's own profile) — same stat
// row/photo/bio structure — but fetches another user's public profile via the same
// endpoint mobile's profile/[userId].tsx uses (useAuth's getUserById -> GET
// /users/getby_id/:userId), plus a rank badge like every other user-facing surface.
export default function OtherUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    apiGet<UserProfile>(`/users/getby_id/${userId}`)
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this profile."));
  }, [isAuthenticated, userId]);

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div className="flex-1 bg-feed-bg">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex-1 bg-feed-bg">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          {profile.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_photo_url}
              alt={profile.name ?? ""}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F0EFFF] text-3xl">
              🙂
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text">{profile.name ?? "Unnamed"}</h1>
            {profile.occupation && <p className="text-light-text">{profile.occupation}</p>}
            <RankBadge
              activityScore={profile.global_activity_score ?? 0}
              rankVisible={profile.rank_visible}
              className="mt-1.5"
            />
          </div>

          <button
            onClick={() => notify("Messaging is coming soon")}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-text hover:bg-white"
          >
            <IoChatbubbleOutline size={16} />
            Message
          </button>
        </div>

        {profile.bio && <p className="mb-4 text-sm text-text">{profile.bio}</p>}

        <div className="mb-6 flex gap-6 text-sm text-light-text">
          {(profile.city || profile.country) && (
            <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
          )}
        </div>

        <div className="flex gap-8 rounded-lg border border-border bg-white p-4">
          <Stat label="Jobs done" value={profile.completed_jobs} />
          <Stat label="Rating" value={profile.average_rating} />
          <Stat label="Connections" value={profile.connections_count} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-lg font-semibold text-text">{value != null ? String(value) : "—"}</div>
      <div className="text-xs text-light-text">{label}</div>
    </div>
  );
}
