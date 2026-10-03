"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoPersonOutline } from "react-icons/io5";
import RankBadge from "./RankBadge";
import { apiPost, apiDelete } from "@/lib/api";
import { useUi } from "@/lib/UiContext";
import type { NearbyVendor } from "@/lib/vendors";
import { profileUrl } from "@/lib/url";

function VendorRow({
  vendor,
  onPress,
  isFollowing,
  onToggleFollow,
}: {
  vendor: NearbyVendor;
  onPress: () => void;
  isFollowing: boolean;
  onToggleFollow: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Avatar */}
      <button onClick={onPress} className="flex-shrink-0">
        {vendor.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.profile_photo_url}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-feed-bg">
            <IoPersonOutline size={20} className="text-light-text" />
          </div>
        )}
      </button>

      {/* Name + occupation + rank */}
      <button onClick={onPress} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-text">{vendor.name}</span>
          <RankBadge
            activityScore={vendor.global_activity_score ?? 0}
            rankVisible={vendor.rank_visible ?? true}
          />
        </div>
        {vendor.occupation && (
          <p className="truncate text-[11px] text-light-text">{vendor.occupation}</p>
        )}
      </button>

      {/* Follow button */}
      <button
        onClick={onToggleFollow}
        className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
          isFollowing
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-primary/15 text-primary hover:bg-primary/25"
        }`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export default function NearbyVendorsRow({ vendors }: { vendors: NearbyVendor[] }) {
  const router = useRouter();
  const { notify } = useUi();
  const [followingIds, setFollowingIds] = useState<Set<string>>(
    () => new Set(vendors.filter((v) => v.is_following).map((v) => v.id))
  );
  const loadingFollowRef = useRef<Set<string>>(new Set());

  async function toggleFollow(e: React.MouseEvent, vendorId: string) {
    e.stopPropagation();
    if (loadingFollowRef.current.has(vendorId)) return;
    loadingFollowRef.current.add(vendorId);
    const wasFollowing = followingIds.has(vendorId);

    // Optimistic update
    setFollowingIds((s) => {
      const n = new Set(s);
      wasFollowing ? n.delete(vendorId) : n.add(vendorId);
      return n;
    });

    try {
      if (wasFollowing) {
        await apiDelete(`/users/follow/${vendorId}`);
      } else {
        await apiPost(`/users/follow/${vendorId}`, {});
      }
    } catch {
      // Revert
      setFollowingIds((s) => {
        const n = new Set(s);
        wasFollowing ? n.add(vendorId) : n.delete(vendorId);
        return n;
      });
      notify("Something went wrong. Please try again.");
    } finally {
      loadingFollowRef.current.delete(vendorId);
    }
  }

  if (vendors.length === 0) return null;

  return (
    <div className="px-4 py-2">
      <h3 className="pb-1 pt-2 text-[17px] font-extrabold text-text">You May Know</h3>
      <div className="flex flex-col">
        {vendors.slice(0, 4).map((v) => (
          <VendorRow
            key={v.id}
            vendor={v}
            onPress={() => router.push(profileUrl(v.name, v.id))}
            isFollowing={followingIds.has(v.id)}
            onToggleFollow={(e) => toggleFollow(e, v.id)}
          />
        ))}
      </div>
    </div>
  );
}
