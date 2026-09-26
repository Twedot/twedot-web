"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!user) return null;

  return (
    <div className="flex-1 bg-feed-bg">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          {user.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_photo_url}
              alt={user.name ?? ""}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F0EFFF] text-3xl">
              🙂
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text">{user.name ?? "Unnamed"}</h1>
            {user.occupation && <p className="text-light-text">{user.occupation}</p>}
          </div>
        </div>

        {user.bio && <p className="mb-4 text-sm text-text">{user.bio}</p>}

        <div className="mb-6 flex gap-6 text-sm text-light-text">
          {(user.city || user.country) && (
            <span>{[user.city, user.country].filter(Boolean).join(", ")}</span>
          )}
          {user.website && (
            <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {user.website}
            </a>
          )}
        </div>

        <div className="flex gap-8 rounded-lg border border-border bg-white p-4">
          <Stat label="Connections" value={user.connections_count} />
          <Stat label="Jobs done" value={user.completed_jobs} />
          <Stat label="Rating" value={user.average_rating} />
          <Stat label="Activity score" value={user.global_activity_score} />
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
