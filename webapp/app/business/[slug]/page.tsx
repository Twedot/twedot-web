"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  IoStorefrontOutline,
  IoLocationOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoTimeOutline,
  IoImageOutline,
  IoListOutline,
  IoCartOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";

const MapPicker = dynamic(() => import("../MapPicker"), { ssr: false });

interface BusinessItem {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  is_available: boolean;
}

interface BusinessFeature {
  id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  sort_order: number;
}

interface BusinessOwner {
  id: string;
  name: string;
  profile_photo_url?: string | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  working_days?: string[] | null;
  is_active: boolean;
  items?: BusinessItem[];
  owner?: BusinessOwner;
}

const CATEGORIES: Record<string, string> = {
  food: "Food & Restaurant",
  services: "Services",
  retail: "Retail & Shop",
  sales: "Sales",
  stores: "Stores",
  entertainment: "Entertainment",
  health: "Health & Wellness",
  education: "Education",
  other: "Other",
};

const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const ITEM_CATEGORIES = ["food", "retail", "sales", "stores"];
const isItemBusiness = (cat: string) => ITEM_CATEGORIES.includes(cat);

export default function PublicBusinessPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { notify } = useUi();

  const [biz, setBiz] = useState<Business | null>(null);
  const [features, setFeatures] = useState<BusinessFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<BusinessFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Order state
  const [orderItem, setOrderItem] = useState<BusinessItem | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<{ business: Business }>(`/business/slug/${slug}`, { auth: false })
      .then(async (data) => {
        setBiz(data.business);
        if (!isItemBusiness(data.business.category)) {
          const feat = await apiGet<{ features: BusinessFeature[] }>(
            `/business/public/${data.business.id}/features`,
            { auth: false }
          ).catch(() => null);
          setFeatures(feat?.features ?? []);
        }
      })
      .catch((e) => setError(e.message || "Business not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  function openOrder(item: BusinessItem) {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setOrderItem(item);
    setOrderNote("");
    setOrderDone(false);
  }

  async function placeOrder() {
    if (!biz || !orderItem) return;
    setPlacingOrder(true);
    try {
      await apiPost(`/business/public/${biz.id}/orders`, {
        item_id: orderItem.id,
        note: orderNote.trim() || undefined,
      });
      setOrderDone(true);
    } catch (e: any) {
      notify(e.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-light-text">Loading...</div>;
  }

  if (error || !biz) {
    return (
      <div className="py-20 text-center">
        <IoStorefrontOutline size={40} className="mx-auto mb-3 text-light-text" />
        <p className="text-sm text-text">{error || "Business not found"}</p>
        <Link href="/business" className="mt-3 inline-block text-sm font-semibold text-primary">
          Browse businesses
        </Link>
      </div>
    );
  }

  const items = biz.items ?? [];
  const useItems = isItemBusiness(biz.category);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Cover */}
      {biz.cover_image_url && (
        <div className="mb-4 h-48 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={biz.cover_image_url} alt={biz.name} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        {biz.logo_url ? (
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={biz.logo_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-feed-bg">
            <IoStorefrontOutline size={24} className="text-light-text" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-text">{biz.name}</h1>
          <p className="text-sm text-light-text">{CATEGORIES[biz.category] ?? biz.category}</p>
        </div>
      </div>

      {/* Owner */}
      {biz.owner && (
        <Link
          href={`/profile/${biz.owner.id}`}
          className="mt-3 flex items-center gap-2 text-xs text-light-text hover:text-primary"
        >
          {biz.owner.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={biz.owner.profile_photo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-feed-bg" />
          )}
          by {biz.owner.name}
        </Link>
      )}

      {biz.description && (
        <p className="mt-4 text-sm leading-relaxed text-text">{biz.description}</p>
      )}

      {/* Info chips */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-light-text">
        {biz.address && (
          <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1.5">
            <IoLocationOutline size={13} /> {biz.address}
          </span>
        )}
        {biz.phone && (
          <a href={`tel:${biz.phone}`} className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1.5 hover:text-primary">
            <IoCallOutline size={13} /> {biz.phone}
          </a>
        )}
        {biz.website && (
          <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1.5 hover:text-primary">
            <IoGlobeOutline size={13} /> Visit Website
          </a>
        )}
        {biz.opening_time && biz.closing_time && (
          <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1.5">
            <IoTimeOutline size={13} /> {biz.opening_time} - {biz.closing_time}
          </span>
        )}
      </div>

      {/* Working days */}
      {biz.working_days && biz.working_days.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {DAYS.map((d) => (
            <span
              key={d.value}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                biz.working_days!.includes(d.value)
                  ? "bg-primary/10 text-primary"
                  : "bg-feed-bg text-light-text/50"
              }`}
            >
              {d.label}
            </span>
          ))}
        </div>
      )}

      {/* Map */}
      {biz.latitude && biz.longitude && (
        <div className="mt-5 h-[240px] overflow-hidden rounded-xl border border-border">
          <MapPicker lat={biz.latitude} lng={biz.longitude} readOnly />
        </div>
      )}

      {/* Items — food, retail, sales, stores */}
      {useItems && items.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-text">Items ({items.length})</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => {
              const price = Number(item.price);
              return (
                <div key={item.id} className="overflow-hidden rounded-xl border border-border">
                  <div className="aspect-square w-full overflow-hidden bg-feed-bg">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <IoImageOutline size={24} className="text-light-text" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-semibold text-text">{item.name}</p>
                    {price > 0 && (
                      <p className="mt-0.5 text-xs font-semibold text-primary">₦{price.toLocaleString()}</p>
                    )}
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-light-text">{item.description}</p>
                    )}
                    <button
                      onClick={() => openOrder(item)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
                    >
                      <IoCartOutline size={13} /> Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Features — all other categories */}
      {!useItems && features.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-text">Features / Services ({features.length})</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFeature(f)}
                className="flex flex-col items-start gap-2 overflow-hidden rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-feed-bg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <IoListOutline size={18} className="text-primary" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-semibold text-text">{f.title}</p>
                  {f.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-light-text">{f.description}</p>
                  )}
                  {f.link && (
                    <p className="mt-1.5 text-[11px] font-semibold text-primary">Learn more →</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature bottom sheet */}
      {selectedFeature && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedFeature(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background">
            <div className="px-6 pb-8 pt-4">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <IoListOutline size={22} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text">{selectedFeature.title}</h3>
              {selectedFeature.description && (
                <p className="mt-4 text-sm leading-relaxed text-text">{selectedFeature.description}</p>
              )}
              {selectedFeature.link && (
                <a
                  href={selectedFeature.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  <IoGlobeOutline size={16} /> Visit Link
                </a>
              )}
              <button
                onClick={() => setSelectedFeature(null)}
                className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-semibold text-text hover:bg-feed-bg"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Order bottom sheet */}
      {orderItem && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => { if (!placingOrder) setOrderItem(null); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background">
            <div className="px-6 pb-8 pt-4">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

              {orderDone ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <IoCheckmarkCircle size={56} className="text-green-500" />
                  <h3 className="mt-4 text-lg font-bold text-text">Order placed!</h3>
                  <p className="mt-2 text-sm text-light-text">
                    Your order for <span className="font-semibold text-text">{orderItem.name}</span> has been sent to the business. They&apos;ll accept or decline it shortly.
                  </p>
                  <button
                    onClick={() => setOrderItem(null)}
                    className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Item summary */}
                  <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-feed-bg">
                      {orderItem.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={orderItem.image_url} alt={orderItem.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <IoImageOutline size={20} className="text-light-text" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-text">{orderItem.name}</p>
                      {Number(orderItem.price) > 0 && (
                        <p className="text-sm font-semibold text-primary">₦{Number(orderItem.price).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-light-text">Note to business (optional)</label>
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Any special instructions or requests…"
                      rows={3}
                      className="w-full rounded-xl border border-border bg-feed-bg px-3.5 py-2.5 text-sm text-text placeholder:text-light-text outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <IoCartOutline size={16} />
                    {placingOrder ? "Placing order…" : "Place Order"}
                  </button>
                  <button
                    disabled={placingOrder}
                    onClick={() => setOrderItem(null)}
                    className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-semibold text-text hover:bg-feed-bg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
