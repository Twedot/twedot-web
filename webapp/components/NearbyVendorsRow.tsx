"use client";

import { useRouter } from "next/navigation";
import { IoPersonOutline } from "react-icons/io5";
import RankBadge from "./RankBadge";
import type { NearbyVendor } from "@/lib/vendors";

function VendorRow({ vendor, onPress }: { vendor: NearbyVendor; onPress: () => void }) {
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
        onClick={(e) => { e.stopPropagation(); }}
        className="flex-shrink-0 rounded-full bg-primary/60 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-primary/75"
      >
        Follow
      </button>
    </div>
  );
}

export default function NearbyVendorsRow({ vendors }: { vendors: NearbyVendor[] }) {
  const router = useRouter();

  if (vendors.length === 0) return null;

  return (
    <div className="border-b border-border px-4 py-2">
      <h3 className="pb-1 pt-2 text-[17px] font-extrabold text-text">Who to follow</h3>
      <div className="flex flex-col divide-y divide-border/40">
        {vendors.slice(0, 4).map((v) => (
          <VendorRow
            key={v.id}
            vendor={v}
            onPress={() => router.push(`/profile/${v.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
