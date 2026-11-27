"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoChevronForward,
  IoAddOutline,
  IoEllipsisHorizontal,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoStorefrontOutline,
  IoOpenOutline,
  IoLinkOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectedStore {
  id: string;
  platform: string;
  store_name: string | null;
  store_url: string;
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

// ─── Mock store data ─────────────────────────────────────────────────────────

const MOCK_STORES: ConnectedStore[] = [
  {
    id: "mock-1",
    platform: "custom_api",
    store_name: "Nike Store",
    store_url: "https://nikestore.com",
    connection_status: "active",
    checkout_configuration: { twedotEnabled: true, externalEnabled: true, defaultCheckout: "twedot" },
    product_count: 128,
    last_synced_at: new Date(Date.now() - 2 * 60000).toISOString(),
    store_image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&h=128&fit=crop&q=80",
    verified: true,
    created_at: "2026-10-15T10:00:00Z",
  },
  {
    id: "mock-2",
    platform: "custom_api",
    store_name: "Bella Styles",
    store_url: "https://bellastyles.com",
    connection_status: "active",
    checkout_configuration: { twedotEnabled: true, externalEnabled: true, defaultCheckout: "twedot" },
    product_count: 64,
    last_synced_at: new Date(Date.now() - 5 * 60000).toISOString(),
    store_image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=128&h=128&fit=crop&q=80",
    verified: true,
    created_at: "2026-11-02T14:30:00Z",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Inline SVG logos ────────────────────────────────────────────────────────

function ShopifyBagLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M37.2 10.8c-.1-.5-.5-.8-1-.8h-.1l-3.5-.3-2.4-2.4c-.3-.3-.7-.3-1-.2l-1.5.5C26.9 5.5 25.5 4 23.5 4c-.2 0-.4 0-.5.1C22.3 3.3 21.5 3 20.7 3c-3.2 0-6.3 4-7.8 9.6l-3.4 1.1c-1 .3-1.1.4-1.2 1.4L6 36.5 28.6 41l12.3-3L37.2 10.8z" fill="#95BF47"/>
      <path d="M32.6 9.7l-3.5-.3-2.4-2.4c-.1-.1-.3-.2-.4-.2v33.7L40.9 38l-3.7-27.2c-.1-.5-.5-.8-1-.8l-3.6-.3z" fill="#5E8E3E"/>
      <path d="M23.5 16.5l-1.7 5s-1.5-.8-3.3-.8c-2.7 0-2.8 1.7-2.8 2.1 0 2.3 6 3.2 6 8.6 0 4.3-2.7 7-6.3 7a8.6 8.6 0 01-4.6-1.3l.8-3.2s1.6 1.1 3 1.1c.9 0 1.6-.6 1.6-1.6 0-2.8-4.9-2.9-4.9-8.1 0-4.2 3-8.2 9-8.2 2.4 0 3.2.7 3.2.7z" fill="white"/>
    </svg>
  );
}

function WooCommerceLogo({ size = 48 }: { size?: number }) {
  const h = size * 0.7;
  return (
    <svg width={size} height={h} viewBox="0 0 120 70" fill="none">
      <rect width="120" height="70" rx="14" fill="#7F54B3"/>
      <text x="60" y="47" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="34" fill="white" letterSpacing="-1">Woo</text>
    </svg>
  );
}

function CustomWebsiteIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#EDE9FE"/>
      <circle cx="24" cy="24" r="12" stroke="#6B4EFF" strokeWidth="2.2" fill="none"/>
      <ellipse cx="24" cy="24" rx="6" ry="12" stroke="#6B4EFF" strokeWidth="2" fill="none"/>
      <line x1="12" y1="24" x2="36" y2="24" stroke="#6B4EFF" strokeWidth="2"/>
      <line x1="14" y1="18" x2="34" y2="18" stroke="#6B4EFF" strokeWidth="1.4"/>
      <line x1="14" y1="30" x2="34" y2="30" stroke="#6B4EFF" strokeWidth="1.4"/>
    </svg>
  );
}

function OtherPlatformsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#EDE9FE"/>
      <text x="24" y="31" textAnchor="middle" fontFamily="monospace" fontWeight="bold" fontSize="20" fill="#6B4EFF">&lt;/&gt;</text>
    </svg>
  );
}

// ─── Hero storefront illustration ────────────────────────────────────────────

function HeroIllustration() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 440, height: 300 }}>
      {/* Large background circle */}
      <div className="absolute" style={{ width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,78,255,0.08) 0%, rgba(107,78,255,0.03) 70%, transparent 100%)" }} />

      {/* Phone / storefront card */}
      <div className="relative z-10" style={{ width: 190, height: 240 }}>
        {/* Card frame */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ border: "2px solid rgba(107,78,255,0.12)" }}>
          {/* Purple awning */}
          <div className="flex" style={{ height: 32 }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} className="flex-1" style={{
                background: i % 2 === 0 ? "#7C5CFC" : "#9B7FFF",
                borderRadius: "0 0 50% 50%",
                marginTop: -4,
              }} />
            ))}
          </div>

          {/* Shopping bags */}
          <div className="flex items-end justify-center gap-1 px-3" style={{ height: 56, marginTop: -2 }}>
            {/* Green bag */}
            <div style={{ width: 28, height: 36, background: "linear-gradient(180deg, #7BC67E 0%, #4CAF50 100%)", borderRadius: "3px 3px 6px 6px", position: "relative" }}>
              <div style={{ position: "absolute", top: -4, left: 6, width: 16, height: 8, border: "2px solid #388E3C", borderBottom: "none", borderRadius: "8px 8px 0 0" }} />
            </div>
            {/* Orange/yellow bag */}
            <div style={{ width: 32, height: 42, background: "linear-gradient(180deg, #FFD54F 0%, #FFB300 100%)", borderRadius: "3px 3px 6px 6px", position: "relative" }}>
              <div style={{ position: "absolute", top: -4, left: 8, width: 16, height: 8, border: "2px solid #F57F17", borderBottom: "none", borderRadius: "8px 8px 0 0" }} />
            </div>
            {/* Purple bag */}
            <div style={{ width: 26, height: 34, background: "linear-gradient(180deg, #B39DDB 0%, #7E57C2 100%)", borderRadius: "3px 3px 6px 6px", position: "relative" }}>
              <div style={{ position: "absolute", top: -4, left: 5, width: 16, height: 8, border: "2px solid #5E35B1", borderBottom: "none", borderRadius: "8px 8px 0 0" }} />
            </div>
          </div>

          {/* Product card area */}
          <div className="mx-3 mt-2 overflow-hidden rounded-lg" style={{ background: "#F5F3FF", height: 80 }}>
            <div className="flex h-full items-center gap-2 px-2">
              {/* Sneaker placeholder */}
              <div className="flex-shrink-0 overflow-hidden rounded-md" style={{ width: 60, height: 60, background: "#EDE9FE" }}>
                <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
                  <rect width="60" height="60" fill="#EDE9FE"/>
                  <path d="M12 38c0-2 4-14 8-16s10-2 14 0 8 6 10 8 4 6 4 8-2 4-6 4H16c-3 0-4-2-4-4z" fill="#6B4EFF" opacity="0.7"/>
                  <path d="M14 36c2-8 6-12 10-12s10 2 14 6 4 6 4 8H14z" fill="#8B6FFF"/>
                  <circle cx="20" cy="38" r="3" fill="white" opacity="0.5"/>
                  <circle cx="34" cy="38" r="3" fill="white" opacity="0.5"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="h-2 w-16 rounded-full" style={{ background: "#C4B5FD" }} />
                <div className="mt-1.5 h-1.5 w-10 rounded-full" style={{ background: "#DDD6FE" }} />
                <div className="mt-1.5 h-1.5 w-12 rounded-full" style={{ background: "#DDD6FE" }} />
              </div>
            </div>
          </div>

          {/* Shop Now button */}
          <div className="flex justify-center py-3">
            <div className="rounded-full px-5 py-1.5" style={{ background: "#1a1a2e" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>Shop Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Shopify logo */}
      <div className="absolute z-20" style={{ left: 20, top: 30 }}>
        <div className="rounded-2xl shadow-lg" style={{ background: "#95BF47", padding: 8 }}>
          <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
            <path d="M28.8 7.5c-.1-.4-.4-.6-.8-.6h-.1l-2.8-.2-1.9-2c-.2-.2-.5-.2-.8-.1l-1.2.4C20.5 3.5 19.4 2.3 17.8 2.3c-.1 0-.3 0-.4 0C16.8 1.7 16.2 1.4 15.5 1.4c-2.5 0-5 3.2-6.2 7.7l-2.7.9c-.8.3-.9.3-1 1.1L4 29.6l18 3.5 9.8-2.4-3-23.2z" fill="white"/>
            <path d="M17.8 12.5l-1.4 4s-1.2-.6-2.6-.6c-2.1 0-2.2 1.3-2.2 1.7 0 1.8 4.8 2.5 4.8 6.8 0 3.4-2.1 5.5-5 5.5a7 7 0 01-3.6-1l.6-2.5s1.3.9 2.4.9c.7 0 1.3-.5 1.3-1.3 0-2.2-3.9-2.3-3.9-6.4 0-3.3 2.4-6.5 7.1-6.5 1.9 0 2.5.6 2.5.6z" fill="#95BF47"/>
          </svg>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#4a4a68", textAlign: "center", marginTop: 4 }}>Shopify</p>
      </div>

      {/* Floating WooCommerce logo */}
      <div className="absolute z-20" style={{ right: 30, top: 50 }}>
        <div className="flex items-center justify-center rounded-2xl shadow-lg" style={{ background: "#7F54B3", width: 72, height: 42, padding: "4px 8px" }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: -0.5 }}>Woo</span>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#4a4a68", textAlign: "center", marginTop: 4 }}>WooCommerce</p>
      </div>

      {/* Floating Other Platforms icon */}
      <div className="absolute z-20" style={{ right: 10, bottom: 50 }}>
        <div className="flex items-center justify-center rounded-2xl shadow-lg" style={{ background: "rgba(107,78,255,0.12)", width: 44, height: 44 }}>
          <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: "#6B4EFF" }}>&lt;/&gt;</span>
        </div>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#4a4a68", textAlign: "center", marginTop: 3 }}>Other Platforms</p>
      </div>

      {/* Small decorative dots */}
      <div className="absolute rounded-full" style={{ width: 6, height: 6, background: "#B39DDB", left: 50, bottom: 60 }} />
      <div className="absolute rounded-full" style={{ width: 4, height: 4, background: "#7C5CFC", right: 60, top: 40, opacity: 0.4 }} />
    </div>
  );
}

// ─── Bottom CTA illustration ─────────────────────────────────────────────────

function CtaIllustration() {
  return (
    <div className="relative hidden md:flex" style={{ width: 260, height: "100%" }}>
      {/* Purple shopping bag */}
      <div className="absolute" style={{ right: 60, bottom: 20 }}>
        <div style={{ width: 48, height: 56, background: "linear-gradient(180deg, #B39DDB 0%, #7E57C2 100%)", borderRadius: "4px 4px 10px 10px", position: "relative" }}>
          <div style={{ position: "absolute", top: -6, left: 10, width: 28, height: 12, border: "3px solid #5E35B1", borderBottom: "none", borderRadius: "14px 14px 0 0" }} />
        </div>
      </div>
      {/* Smaller bag */}
      <div className="absolute" style={{ right: 30, bottom: 15 }}>
        <div style={{ width: 36, height: 44, background: "linear-gradient(180deg, #CE93D8 0%, #AB47BC 100%)", borderRadius: "3px 3px 8px 8px", position: "relative" }}>
          <div style={{ position: "absolute", top: -5, left: 7, width: 22, height: 10, border: "2.5px solid #8E24AA", borderBottom: "none", borderRadius: "11px 11px 0 0" }} />
        </div>
      </div>
      {/* Decorative circles */}
      <div className="absolute rounded-full" style={{ width: 80, height: 80, background: "rgba(107,78,255,0.1)", right: 10, top: 10 }} />
      <div className="absolute rounded-full" style={{ width: 40, height: 40, background: "rgba(107,78,255,0.08)", right: 100, bottom: 10 }} />
      <div className="absolute rounded-full" style={{ width: 16, height: 16, background: "rgba(139,111,255,0.3)", right: 80, top: 30 }} />
      <div className="absolute rounded-full" style={{ width: 10, height: 10, background: "rgba(139,111,255,0.25)", right: 20, bottom: 50 }} />
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
      setStores(list.length > 0 ? list : MOCK_STORES);
    } catch {
      setStores(MOCK_STORES);
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
      <div className="mx-auto max-w-[1240px] px-5 py-6 md:px-8">

        {/* ══════════════════════════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden rounded-3xl"
          style={{ background: "linear-gradient(135deg, #F0ECFF 0%, #EDE9FE 30%, #E8E0FD 60%, #F3EDFF 100%)" }}
        >
          <div className="relative z-10 flex items-center">
            {/* Left content */}
            <div className="flex-1 px-8 py-10 md:px-12 md:py-14">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5"
                style={{ background: "rgba(107,78,255,0.12)", color: "#6B4EFF", fontSize: 12, fontWeight: 600 }}
              >
                <IoLinkOutline size={13} />
                Twedot Connect
              </span>

              <h1 className="mt-5" style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, color: "#1a1a2e" }}>
                Connect Your Store
                <br />
                to <span style={{ color: "#6B4EFF" }}>Twedot</span>
              </h1>

              <p className="mt-4" style={{ maxWidth: 360, fontSize: 15, lineHeight: 1.65, color: "#4a4a68" }}>
                Bring your online store to Twedot and let more people discover your products.
              </p>

              <button
                className="mt-6 inline-flex items-center gap-2 rounded-full"
                style={{ background: "#1a1a2e", color: "#ffffff", padding: "12px 28px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
              >
                Get Started
                <IoChevronForward size={15} />
              </button>
            </div>

            {/* Right illustration */}
            <div className="hidden flex-shrink-0 md:block">
              <HeroIllustration />
            </div>
          </div>

          {/* Background decorative shapes */}
          <div className="pointer-events-none absolute rounded-full" style={{ width: 300, height: 300, right: -60, top: -80, background: "rgba(107,78,255,0.04)" }} />
          <div className="pointer-events-none absolute rounded-full" style={{ width: 200, height: 200, left: -40, bottom: -60, background: "rgba(107,78,255,0.03)" }} />
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SUPPORTED PLATFORMS
            ══════════════════════════════════════════════════════════ */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Supported Platforms</h2>
              <p style={{ marginTop: 4, fontSize: 13, color: "var(--light-text)" }}>Choose a platform to connect your store</p>
            </div>
            <button className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600, color: "#6B4EFF" }}>
              View all platforms
              <IoChevronForward size={14} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* API Connect */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-4 py-5 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <CustomWebsiteIcon />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>API Connect</p>
                <p style={{ marginTop: 3, fontSize: 11, color: "var(--light-text)" }}>Connect any website with our API</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>

            {/* Shopify */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-4 py-5 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <ShopifyBagLogo size={48} />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Shopify</p>
                <p style={{ marginTop: 3, fontSize: 11, color: "var(--light-text)" }}>Link your Shopify store</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>

            {/* WooCommerce */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-4 py-5 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <WooCommerceLogo size={48} />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>WooCommerce</p>
                <p style={{ marginTop: 3, fontSize: 11, color: "var(--light-text)" }}>Connect your WooCommerce store</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>

            {/* Other Platforms */}
            <button className="group flex items-center gap-4 rounded-2xl border border-border bg-background px-4 py-5 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <OtherPlatformsIcon />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Other Platforms</p>
                <p style={{ marginTop: 3, fontSize: 11, color: "var(--light-text)" }}>Use our API for custom integrations</p>
              </div>
              <IoChevronForward size={16} className="flex-shrink-0 text-light-text transition-colors group-hover:text-primary" />
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            YOUR CONNECTED STORES
            ══════════════════════════════════════════════════════════ */}
        <section className="mt-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 42, height: 42, background: "rgba(107,78,255,0.1)" }}>
                <IoStorefrontOutline size={22} style={{ color: "#6B4EFF" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Your Connected Stores</h2>
                <p style={{ marginTop: 3, fontSize: 13, color: "var(--light-text)" }}>Manage your connected stores and update settings anytime.</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 rounded-full"
              style={{ background: "#1a1a2e", color: "#ffffff", padding: "10px 22px", fontSize: 13, fontWeight: 600 }}
            >
              Connect a Store
              <IoAddOutline size={16} />
            </button>
          </div>

          {/* Store list table */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
            {loading ? (
              <div className="divide-y divide-border">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-5 px-6 py-5">
                    <div className="h-16 w-16 animate-pulse rounded-xl bg-feed-bg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-feed-bg" />
                      <div className="h-3 w-56 animate-pulse rounded bg-feed-bg" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-feed-bg" />
                      <div className="h-3 w-28 animate-pulse rounded bg-feed-bg" />
                    </div>
                    <div className="h-8 w-20 animate-pulse rounded-full bg-feed-bg" />
                  </div>
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                <div className="flex items-center justify-center rounded-2xl" style={{ width: 64, height: 64, background: "var(--feed-bg)" }}>
                  <IoStorefrontOutline size={28} className="text-light-text" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>No connected stores yet</p>
                <p style={{ maxWidth: 300, fontSize: 13, color: "var(--light-text)" }}>
                  Connect your first store and start showing your products to the Twedot network.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stores.map((store) => {
                  const domain = store.store_url.replace(/^https?:\/\//, "");
                  return (
                    <div key={store.id} className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-feed-bg/40">
                      {/* Store image */}
                      <div className="flex-shrink-0 overflow-hidden rounded-xl border border-border" style={{ width: 64, height: 64, background: "var(--feed-bg)" }}>
                        {store.store_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={store.store_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <IoStorefrontOutline size={24} className="text-light-text" />
                          </div>
                        )}
                      </div>

                      {/* Name + URL */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{store.store_name || domain}</span>
                          {(store.verified || store.connection_status === "active") && (
                            <IoCheckmarkCircle size={16} style={{ color: "#6B4EFF", flexShrink: 0 }} />
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--light-text)" }}>
                          <IoOpenOutline size={12} />
                          <span className="truncate">{domain}</span>
                        </div>
                      </div>

                      {/* Status + Last synced */}
                      <div className="hidden flex-shrink-0 flex-col items-start gap-1 sm:flex" style={{ minWidth: 150 }}>
                        <span className="inline-flex items-center gap-1.5" style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: store.connection_status === "active" ? "#22C55E" : store.connection_status === "pending" ? "#EAB308" : "#EF4444",
                        }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                            background: store.connection_status === "active" ? "#22C55E" : store.connection_status === "pending" ? "#EAB308" : "#EF4444",
                          }} />
                          {store.connection_status === "active" ? "Connected" : store.connection_status === "pending" ? "Pending" : "Error"}
                        </span>
                        <span className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--light-text)" }}>
                          <IoTimeOutline size={11} />
                          Last synced: {timeAgo(store.last_synced_at)}
                        </span>
                      </div>

                      {/* Checkout Options */}
                      <div className="hidden flex-shrink-0 flex-col items-start gap-1 lg:flex" style={{ minWidth: 120 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Checkout Options</span>
                        <div className="flex items-center gap-2">
                          {(store.checkout_configuration?.twedotEnabled !== false) && (
                            <div className="flex items-center justify-center rounded-full border border-border" style={{ width: 30, height: 30 }} title="Twedot Checkout">
                              <IoWalletOutline size={15} style={{ color: "#6B4EFF" }} />
                            </div>
                          )}
                          {store.checkout_configuration?.externalEnabled && (
                            <div className="flex items-center justify-center rounded-full border border-border" style={{ width: 30, height: 30 }} title="External Checkout">
                              <IoOpenOutline size={15} style={{ color: "var(--light-text)" }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Manage + Menu */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          onClick={() => router.push(`/connect/${store.id}`)}
                          className="flex items-center gap-1.5 rounded-full border px-4 py-2 transition-colors hover:opacity-80"
                          style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", borderColor: "var(--border)" }}
                        >
                          Manage
                          <IoChevronForward size={13} />
                        </button>
                        <button className="flex items-center justify-center rounded-full transition-colors hover:bg-feed-bg" style={{ width: 32, height: 32, color: "var(--light-text)" }}>
                          <IoEllipsisHorizontal size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            BOTTOM CTA BANNER
            ══════════════════════════════════════════════════════════ */}
        <section
          className="relative mt-10 mb-8 overflow-hidden rounded-3xl"
          style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #E0D4FC 40%, #D8CCFA 70%, #DDD6FE 100%)" }}
        >
          <div className="relative z-10 flex items-center justify-between px-8 py-10 md:px-12">
            <div className="flex items-start gap-4">
              {/* Trending icon */}
              <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 48, height: 48, background: "rgba(107,78,255,0.15)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 17l6-6 4 4 8-8" stroke="#6B4EFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 7h7v7" stroke="#6B4EFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>
                  Grow Your Business with Twedot Connect
                </h3>
                <p className="mt-2" style={{ maxWidth: 500, fontSize: 14, lineHeight: 1.6, color: "#4a4a68" }}>
                  Reach more customers, showcase your products, and grow your brand across the Twedot network.
                </p>
              </div>
            </div>

            <button
              className="hidden flex-shrink-0 items-center gap-2 rounded-full md:flex"
              style={{ background: "#1a1a2e", color: "#ffffff", padding: "12px 28px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            >
              Learn More
              <IoChevronForward size={15} />
            </button>
          </div>

          {/* Right-side decorative illustration */}
          <div className="pointer-events-none absolute right-0 top-0 h-full" style={{ width: 260 }}>
            <CtaIllustration />
          </div>
        </section>

      </div>
    </div>
  );
}
