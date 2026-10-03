"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { IoPersonOutline, IoChevronBack } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import RankBadge from "@/components/RankBadge";
import { profileUrl } from "@/lib/url";

type Tab = "followers" | "following" | "suggested";

interface Person {
  id: string;
  name: string | null;
  profile_photo_url: string | null;
  occupation: string | null;
  is_following?: boolean;
  global_activity_score?: number;
  rank_visible?: boolean;
}

function PersonRow({
  person,
  isFollowing,
  isMe,
  onToggle,
}: {
  person: Person;
  isFollowing: boolean;
  isMe: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-feed-bg/50">
      <button
        onClick={() => isMe ? router.push("/profile") : router.push(profileUrl(person.name ?? "", person.id))}
        className="flex-shrink-0"
      >
        {person.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <IoPersonOutline size={18} className="text-primary" />
          </div>
        )}
      </button>
      <button
        onClick={() => isMe ? router.push("/profile") : router.push(profileUrl(person.name ?? "", person.id))}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-text">{person.name ?? "Unknown"}</span>
          <RankBadge activityScore={person.global_activity_score ?? 0} rankVisible={person.rank_visible ?? true} />
        </div>
        {person.occupation && (
          <p className="truncate text-[11px] text-light-text">{person.occupation}</p>
        )}
      </button>
      {!isMe && (
        <button
          onClick={onToggle}
          className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
            isFollowing
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-primary/15 text-primary hover:bg-primary/25"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

function ConnectionsContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const tabParam = (useSearchParams().get("tab") ?? "followers") as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam);

  const [followers, setFollowers] = useState<Person[]>([]);
  const [following, setFollowing] = useState<Person[]>([]);
  const [suggested, setSuggested] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const loadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [flrs, flng, sugg] = await Promise.all([
        apiGet<{ followers: Person[] }>("/users/me/followers"),
        apiGet<{ following: Person[] }>("/users/me/following"),
        apiGet<Person[]>("/users/suggested"),
      ]);
      const flrsData = Array.isArray((flrs as any)?.followers) ? (flrs as any).followers : Array.isArray(flrs) ? flrs : [];
      const flngData = Array.isArray((flng as any)?.following) ? (flng as any).following : Array.isArray(flng) ? flng : [];
      const suggData = Array.isArray(sugg) ? sugg : [];
      setFollowers(flrsData);
      setFollowing(flngData);
      setSuggested(suggData);
      const seed = new Set<string>();
      flngData.forEach((p: Person) => seed.add(p.id));
      suggData.filter((p: Person) => p.is_following).forEach((p: Person) => seed.add(p.id));
      setFollowingIds(seed);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  async function toggleFollow(personId: string) {
    if (loadingRef.current.has(personId)) return;
    loadingRef.current.add(personId);
    const wasFollowing = followingIds.has(personId);
    setFollowingIds((prev) => { const n = new Set(prev); wasFollowing ? n.delete(personId) : n.add(personId); return n; });
    try {
      if (wasFollowing) await apiDelete(`/users/follow/${personId}`);
      else await apiPost(`/users/follow/${personId}`, {});
    } catch {
      setFollowingIds((prev) => { const n = new Set(prev); wasFollowing ? n.add(personId) : n.delete(personId); return n; });
      notify("Something went wrong. Please try again.");
    } finally {
      loadingRef.current.delete(personId);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "followers", label: "Followers" },
    { key: "following", label: "Following" },
    { key: "suggested", label: "Suggested" },
  ];

  const activeData = activeTab === "followers" ? followers : activeTab === "following" ? following : suggested;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-3 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text hover:bg-feed-bg"
        >
          <IoChevronBack size={20} />
        </button>
        <h1 className="text-[15px] font-bold text-text">Connections</h1>
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-light-text hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-light-text">Loading…</div>
      ) : activeData.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-light-text">
          {activeTab === "followers" ? "No followers yet." : activeTab === "following" ? "Not following anyone yet." : "No suggestions right now."}
        </div>
      ) : (
        <div className="flex flex-col">
          {activeData.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              isFollowing={followingIds.has(person.id)}
              isMe={person.id === user?.id}
              onToggle={() => toggleFollow(person.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense>
      <ConnectionsContent />
    </Suspense>
  );
}
