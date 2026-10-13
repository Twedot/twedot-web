"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoAddOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  cover_image_url?: string | null;
  is_active: boolean;
}

const CATEGORIES: Record<string, string> = {
  food: "Food & Restaurant",
  services: "Services",
  retail: "Retail & Shop",
  entertainment: "Entertainment",
  health: "Health & Wellness",
  education: "Education",
  other: "Other",
};

function BusinessCard({ biz, onClick }: { biz: Business; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="overflow-hidden rounded-[14px] border border-border text-left transition-colors hover:border-primary/40"
    >
      <div className="aspect-[2/1] w-full overflow-hidden bg-feed-bg">
        {biz.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={biz.cover_image_url} alt={biz.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IoStorefrontOutline size={28} className="text-light-text" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[12px] font-semibold text-text">{biz.name}</p>
        <p className="mt-0.5 text-[11px] text-light-text">{CATEGORIES[biz.category] ?? biz.category}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          biz.is_active
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : "bg-feed-bg text-light-text"
        }`}>
          {biz.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    </button>
  );
}

export default function BusinessPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    const data = await apiGet<{ businesses: Business[] }>("/business/mine").catch(() => null);
    setBusinesses(data?.businesses ?? []);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isAuthenticated, load]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text">My Businesses</h1>
        <button
          onClick={() => router.push("/business/create")}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <IoAddOutline size={16} /> New Business
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-light-text">Loading…</div>
      ) : businesses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <IoStorefrontOutline size={40} className="mx-auto mb-3 text-light-text" />
          <p className="text-sm font-semibold text-text">No businesses yet</p>
          <p className="mt-1 text-xs text-light-text">Create your first business page and start selling</p>
          <button
            onClick={() => router.push("/business/create")}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Create Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              biz={biz}
              onClick={() => router.push(`/business/${biz.slug}/manage`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
