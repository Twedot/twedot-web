"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoGlobeOutline,
  IoChevronForward,
  IoAddOutline,
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoStorefrontOutline,
  IoTrendingUpOutline,
  IoCodeSlashOutline,
  IoWalletOutline,
  IoOpenOutline,
  IoLinkOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectedStore {
  id: string;
  platform: string;
  store_name: string | null;
  store_url: string;
  external_store_id: string | null;
  connection_status: "active" | "pending" | "error" | "expired" | "disconnected";
  checkout_configuration: {
    twedotEnabled: boolean;
    externalEnabled: boolean;
    defaultCheckout: "twedot" | "external";
  } | null;
  product_count?: number;
  last_synced_at?: string | null;
  store_image_url?: string | null;
  verified?: boolean;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function domainOf(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

// ─── Sparkle SVG (decorative) ────────────────────────────────────────────────

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
    </svg>
  );
}

// ─── Platform logos (inline SVG to match the screenshot) ─────────────────────

function ShopifyLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl ${className}`} style={{ background: "#95BF47" }}>
      <span className="text-[20px] font-black text-white">S</span>
    </div>
  );
}

function WooLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl ${className}`} style={{ background: "#7F54B3" }}>
      <span className="text-[13px] font-black text-white tracking-tight">Woo</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadStores = useCallback(async () => {
    try {
      const res = await apiGet<{ stores: ConnectedStore[] } | ConnectedStore[]>("/integrations");
      const list = Array.isArray(res) ? res : Array.isArray((res as any)?.stores) ? (res as any).stores : [];
      setStores(list);
    } catch {
      setStores([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadStores().finally(() => setLoading(false));
  }, [isAuthenticated, loadStores]);

  if (!isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-8">

        {/* ── Hero Banner ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 40%, #E8DEF8 100%)" }}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center">
            {/* Left text */}
            <div className="flex-1 px-8 py-10 md:px-12 md:py-14">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-primary">
                <IoLinkOutline size={13} />
                Twedot Connect
              </span>
              <h1 className="mt-5 text-[32px] font-extrabold leading-[1.15] text-[#1a1a2e] md:text-[40px]">
                Connect Your Store{" "}
                <br />
                to <span className="text-primary">Twedot</span>
              </h1>
              <p className="mt-4 max-w-sm text-[15px] leading-[1.6] text-[#4a4a68]">
                Bring your online store to Twedot and let more people discover your products.
              </p>
              <button
                onClick={() => router.push("/connect/new")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Get Started
                <IoChevronForward size={15} />
              </button>
            </div>

            {/* Right illustration area */}
            <div className="relative hidden flex-shrink-0 md:flex md:w-[460px] md:items-center md:justify-center md:py-8">
              {/* Storefront illustration */}
              <div className="relative">
                {/* Phone / store mockup */}
                <div className="relative z-10 h-[220px] w-[180px] rounded-2xl border-2 border-white/60 bg-white/80 p-3 shadow-2xl backdrop-blur-sm">
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-primary/5 to-primary/10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                      <IoStorefrontOutline size={28} className="text-primary" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-2 w-20 rounded-full bg-primary/20" />
                      <div className="h-2 w-14 rounded-full bg-primary/15" />
                    </div>
                    <div className="rounded-full bg-primary px-4 py-1.5">
                      <span className="text-[10px] font-bold text-white">Shop Now</span>
                    </div>
                  </div>
                </div>

                {/* Floating Shopify badge */}
                <div className="absolute -left-12 top-2 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#95BF47] shadow-lg">
                  <span className="text-[22px] font-black text-white">S</span>
                </div>
                <p className="absolute -left-14 top-[70px] text-[11px] font-semibold text-[#4a4a68]">Shopify</p>

                {/* Floating WooCommerce badge */}
                <div className="absolute -right-10 top-10 z-20 flex h-12 w-20 items-center justify-center rounded-2xl bg-[#7F54B3] shadow-lg">
                  <span className="text-[14px] font-black text-white tracking-tight">Woo</span>
                </div>
                <p className="absolute -right-16 top-[72px] text-[11px] font-semibold text-[#4a4a68]">WooCommerce</p>

                {/* Floating code badge */}
                <div className="absolute -right-6 bottom-6 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 shadow-lg backdrop-blur-sm">
                  <IoCodeSlashOutline size={22} className="text-primary" />
                </div>
                <p className="absolute -right-14 bottom-0 text-[10px] font-semibold text-[#4a4a68]">Other Platforms</p>

                {/* Shopping bags decorative */}
                <div className="absolute -left-6 bottom-4 z-0 flex h-10 w-10 items-center justify-center rounded-xl bg-green-400/20">
                  <span className="text-[18px]">🛍️</span>
                </div>
              </div>

              {/* Sparkles */}
              <Sparkle className="absolute right-8 top-6 h-6 w-6 text-primary/30" />
              <Sparkle className="absolute left-16 top-10 h-4 w-4 text-primary/20" />
              <Sparkle className="absolute right-24 bottom-10 h-5 w-5 text-primary/25" />
            </div>
          </div>

          {/* Background decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/[0.06]" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/[0.05]" />
        </section>

        {/* ── Supported Platforms ─────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-text">Supported Platforms</h2>
              <p className="mt-1 text-[13px] text-light-text">Choose a platform to connect your store</p>
            </div>
            <button className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
              View all platforms
              <IoChevronForward size={14} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Custom Website */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-5 py-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <IoGlobeOutline size={24} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-text">Custom Website</p>
                <p className="mt-0.5 text-[11px] text-light-text">Connect any website with our API</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>

            {/* Shopify */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-5 py-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
              <ShopifyLogo className="h-12 w-12 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-text">Shopify</p>
                <p className="mt-0.5 text-[11px] text-light-text">Link your Shopify store</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>

            {/* WooCommerce */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-5 py-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
              <WooLogo className="h-12 w-12 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-text">WooCommerce</p>
                <p className="mt-0.5 text-[11px] text-light-text">Connect your WooCommerce store</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>

            {/* Other Platforms */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-5 py-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <IoCodeSlashOutline size={24} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-text">Other Platforms</p>
                <p className="mt-0.5 text-[11px] text-light-text">Use our API for custom integrations</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>
          </div>
        </section>

        {/* ── Your Connected Stores ───────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <IoStorefrontOutline size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-text">Your Connected Stores</h2>
                <p className="mt-0.5 text-[13px] text-light-text">Manage your connected stores and update settings anytime.</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/connect/new")}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Connect a Store
              <IoAddOutline size={16} />
            </button>
          </div>

          {/* Store list */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            {loading ? (
              <div className="divide-y divide-border">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-5 px-6 py-5">
                    <div className="h-16 w-16 animate-pulse rounded-xl bg-feed-bg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-feed-bg" />
                      <div className="h-3 w-56 animate-pulse rounded bg-feed-bg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
                  <IoStorefrontOutline size={28} className="text-light-text" />
                </div>
                <p className="text-[15px] font-semibold text-text">No connected stores yet</p>
                <p className="max-w-xs text-[13px] text-light-text">
                  Connect your first store and start showing your products to the Twedot network.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stores.map((store) => (
                  <div key={store.id} className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-feed-bg/50">
                    {/* Store image */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-feed-bg">
                      {store.store_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.store_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <IoStorefrontOutline size={24} className="text-light-text" />
                      )}
                    </div>

                    {/* Name + URL */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-bold text-text">{store.store_name || domainOf(store.store_url)}</p>
                        {store.verified && (
                          <IoCheckmarkCircle size={16} className="flex-shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-light-text">
                        <IoOpenOutline size={12} />
                        <span className="truncate">{store.store_url.replace(/^https?:\/\//, "")}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-shrink-0 flex-col items-start gap-1 min-w-[140px]">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
                        store.connection_status === "active" ? "text-green-500" : store.connection_status === "pending" ? "text-yellow-500" : "text-red-500"
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          store.connection_status === "active" ? "bg-green-500" : store.connection_status === "pending" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                        {store.connection_status === "active" ? "Connected" : store.connection_status === "pending" ? "Pending" : "Error"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-light-text">
                        <IoTimeOutline size={11} />
                        Last synced: {timeAgo(store.last_synced_at)}
                      </span>
                    </div>

                    {/* Checkout Options */}
                    <div className="hidden flex-shrink-0 flex-col items-start gap-1 min-w-[120px] lg:flex">
                      <span className="text-[12px] font-semibold text-text">Checkout Options</span>
                      <div className="flex items-center gap-2">
                        {(store.checkout_configuration?.twedotEnabled !== false) && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border" title="Twedot Checkout">
                            <IoWalletOutline size={14} className="text-primary" />
                          </div>
                        )}
                        {store.checkout_configuration?.externalEnabled && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border" title="External Checkout">
                            <IoOpenOutline size={14} className="text-light-text" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manage */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={() => router.push(`/connect/${store.id}`)}
                        className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-text transition-colors hover:border-primary hover:text-primary"
                      >
                        Manage
                        <IoChevronForward size={13} />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-light-text transition-colors hover:bg-feed-bg hover:text-text">
                        <IoEllipsisHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Bottom CTA Banner ───────────────────────────────────────── */}
        <section className="mt-10 mb-8 overflow-hidden rounded-3xl" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #E8DEF8 50%, #DDD6FE 100%)" }}>
          <div className="flex items-center justify-between px-8 py-10 md:px-12">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <IoTrendingUpOutline size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-[22px] font-extrabold text-[#1a1a2e]">Grow Your Business with Twedot Connect</h3>
                <p className="mt-2 max-w-lg text-[14px] leading-[1.6] text-[#4a4a68]">
                  Reach more customers, showcase your products, and grow your brand across the Twedot network.
                </p>
              </div>
            </div>
            <button className="hidden flex-shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl md:flex">
              Learn More
              <IoChevronForward size={15} />
            </button>
          </div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3">
            <div className="absolute right-10 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-primary/[0.08]" />
            <div className="absolute right-32 bottom-4 h-10 w-10 rounded-full bg-primary/[0.06]" />
          </div>
        </section>

      </div>
    </div>
  );
}
