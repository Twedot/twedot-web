"use client";

import { useRouter } from "next/navigation";
import { IoPersonOutline } from "react-icons/io5";
import RankBadge from "./RankBadge";
import type { NearbyVendor } from "@/lib/vendors";

function VendorCard({ vendor, onPress }: { vendor: NearbyVendor; onPress: () => void }) {
  return (
    <div className="flex w-[150px] flex-shrink-0 flex-col items-center rounded-xl border border-border p-3 text-center min-h-[160px]">
      {vendor.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={vendor.profile_photo_url}
          alt=""
          className="mb-2 h-10 w-10 rounded-full bg-feed-bg object-cover"
        />
      ) : (
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-feed-bg">
          <IoPersonOutline size={20} className="text-light-text" />
        </div>
      )}

      <div className="w-full truncate text-[11px] font-semibold text-text">{vendor.name}</div>
      <div className="mt-0.5 line-clamp-1 w-full text-[10px] font-normal text-light-text">{vendor.occupation}</div>
      <RankBadge
        activityScore={vendor.global_activity_score ?? 0}
        rankVisible={vendor.rank_visible}
        className="mt-1"
      />

      <button
        onClick={onPress}
        className="mt-auto w-full rounded-full bg-[#333333] py-1.5 text-xs font-medium text-white hover:opacity-90"
      >
        View Profile
      </button>
    </div>
  );
}

export default function NearbyVendorsRow({ vendors }: { vendors: NearbyVendor[] }) {
  const router = useRouter();

  if (vendors.length === 0) return null;

  return (
    <div className="border-b border-border px-4 py-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-light-text">Suggested Vendors &amp; Services</h3>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {vendors.map((v) => (
          <VendorCard key={v.id} vendor={v} onPress={() => router.push(`/profile/${v.id}`)} />
        ))}
      </div>
    </div>
  );
}
