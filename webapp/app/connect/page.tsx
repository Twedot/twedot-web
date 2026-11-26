"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  IoStorefrontOutline,
  IoAddOutline,
  IoChevronForward,
  IoChevronBack,
  IoGlobeOutline,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoTrashOutline,
  IoCartOutline,
  IoOpenOutline,
  IoSwapHorizontalOutline,
  IoTimeOutline,
  IoLinkOutline,
  IoGridOutline,
  IoListOutline,
  IoArrowBack,
  IoEllipsisVertical,
  IoCodeSlashOutline,
  IoSyncOutline,
  IoTrendingUpOutline,
  IoCheckmark,
  IoArrowForward,
  IoInformationCircleOutline,
  IoLayersOutline,
  IoRefreshOutline,
  IoFlashOutline,
  IoPulseOutline,
  IoSparklesOutline,
  IoRocketOutline,
  IoShieldCheckmarkOutline,
  IoCubeOutline,
  IoStatsChartOutline,
  IoEyeOutline,
  IoBagHandleOutline,
  IoPersonOutline,
} from "react-icons/io5";

// ─── Types & Mock Data ───────────────────────────────────────────────────────

interface ConnectedStore {
  id: string;
  name: string;
  url: string;
  platform: "custom_api" | "shopify" | "woocommerce";
  status: "active" | "error";
  products: number;
  views: number;
  orders: number;
  connectedAt: string;
  lastSync: string;
  image: string;
  avatar: string;
  checkoutConfig: { bothEnabled: boolean; syncFrequency: string };
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  quantity: number;
  category: string;
}

const STORES: ConnectedStore[] = [
  {
    id: "s1", name: "Creator's Fashion Store", url: "https://creatorsfashion.com",
    platform: "custom_api", status: "active", products: 1200, views: 24500, orders: 342,
    connectedAt: "2026-11-20T10:30:00Z", lastSync: "2026-11-26T08:22:00Z",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
    checkoutConfig: { bothEnabled: true, syncFrequency: "Every 15 minutes" },
  },
  {
    id: "s2", name: "BizMart Online", url: "https://bizmart.com",
    platform: "shopify", status: "active", products: 850, views: 18200, orders: 198,
    connectedAt: "2026-11-18T08:15:00Z", lastSync: "2026-11-26T07:50:00Z",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face",
    checkoutConfig: { bothEnabled: false, syncFrequency: "Every 30 minutes" },
  },
];

const PRODUCTS: Record<string, Product[]> = {
  s1: [
    { id: "p1", name: "Classic Leather Handbag", price: 85000, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop", available: true, quantity: 15, category: "Bags" },
    { id: "p2", name: "Ankara Midi Dress", price: 32000, image: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=400&h=400&fit=crop", available: true, quantity: 24, category: "Dresses" },
    { id: "p3", name: "Sneaker Collection Air", price: 95000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", available: true, quantity: 22, category: "Shoes" },
    { id: "p4", name: "Gold Statement Necklace", price: 18000, image: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c6?w=400&h=400&fit=crop", available: true, quantity: 40, category: "Jewelry" },
    { id: "p5", name: "Denim Jacket Classic", price: 45000, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", available: false, quantity: 0, category: "Jackets" },
    { id: "p6", name: "Silk Head Wrap Set", price: 12000, image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop", available: true, quantity: 60, category: "Accessories" },
  ],
  s2: [
    { id: "b1", name: "Wireless Speaker", price: 25000, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop", available: true, quantity: 50, category: "Electronics" },
    { id: "b2", name: "Smart Watch Pro", price: 65000, image: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop", available: true, quantity: 12, category: "Electronics" },
    { id: "b3", name: "Leather Messenger Bag", price: 42000, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop", available: true, quantity: 8, category: "Bags" },
    { id: "b4", name: "Ceramic Mug Set", price: 8500, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop", available: true, quantity: 100, category: "Home" },
  ],
};

const PLATFORM_INFO: Record<string, { label: string; color: string; gradient: string }> = {
  custom_api: { label: "Custom API", color: "#6B4EFF", gradient: "from-violet-500 to-purple-600" },
  shopify: { label: "Shopify", color: "#95BF47", gradient: "from-green-400 to-emerald-600" },
  woocommerce: { label: "WooCommerce", color: "#96588A", gradient: "from-purple-400 to-fuchsia-600" },
};

function formatPrice(n: number) { return `₦${n.toLocaleString()}`; }

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shortNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}

// ─── Animated Mesh Background ────────────────────────────────────────────────

function MeshGradient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-[20%] -top-[40%] h-[600px] w-[600px] animate-pulse rounded-full bg-purple-500/20 blur-[120px]" />
      <div className="absolute -right-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/15 blur-[100px]" style={{ animation: "pulse 4s ease-in-out infinite alternate" }} />
      <div className="absolute bottom-0 left-[30%] h-[300px] w-[500px] rounded-full bg-violet-500/10 blur-[80px]" style={{ animation: "pulse 6s ease-in-out infinite alternate-reverse" }} />
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-[16px] font-bold text-text">{value}</p>
        <p className="text-[11px] text-light-text">{label}</p>
      </div>
    </div>
  );
}

// ─── Platform Logos ──────────────────────────────────────────────────────────

function ShopifyLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 109.5 124.5" fill="none">
      <path d="M95.6 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.8-.8-2.3-.5-2.9-.4-.1 0-1.5.5-4 1.2-2.4-6.8-6.5-13.1-13.9-13.1h-.6C53.3 3.8 50.6 2 48.4 2c-17.2 0-25.4 21.5-28 32.4-6.7 2.1-11.5 3.5-12 3.7-3.7 1.2-3.8 1.3-4.3 4.8C3.7 45.6 0 76.8 0 76.8l71.5 13.4L95.6 28.2z" fill="#95BF47"/>
      <path d="M94.5 27.2c-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.3-.3-.6-.4-1-.4l-4.3 86.7 23.9-5.9S95.6 28.2 95.6 28.2c-.1-.6-.6-1-1.1-1z" fill="#5E8E3E"/>
      <path d="M54.8 43.1l-4.8 14.3s-4.2-2.2-9.3-2.2c-7.5 0-7.9 4.7-7.9 5.9 0 6.5 16.9 9 16.9 24.2 0 12-7.6 19.7-17.8 19.7-12.3 0-18.6-7.6-18.6-7.6l3.3-10.9s6.5 5.6 12 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.5-13.9-8.9-13.9-22.8C20.4 51.2 30.1 38 44.4 38c5.5 0 10.4 2.1 10.4 5.1z" fill="#fff"/>
    </svg>
  );
}

function WooLogo({ size = 28 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-lg bg-[#96588A]">
      <span className="text-[10px] font-black text-white">W</span>
    </div>
  );
}

// ─── Connect Wizard ──────────────────────────────────────────────────────────

const STEPS = ["Platform", "Details", "Configure", "Done"] as const;

function ConnectWizard({ onClose, onConnect }: { onClose: () => void; onConnect: (url: string, platform: string) => void }) {
  const [si, setSi] = useState(0);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [checkout, setCheckout] = useState<"both" | "twedot">("both");
  const [sync, setSync] = useState("15");
  const [connecting, setConnecting] = useState(false);

  function next() {
    if (si === 2) {
      setConnecting(true);
      setTimeout(() => { setConnecting(false); setSi(3); }, 2200);
      return;
    }
    setSi(si + 1);
  }

  const canNext = si === 0 ? !!platform : si === 1 ? !!url.trim() : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-3xl bg-background shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Decorative top gradient */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {si > 0 && si < 3 && (
              <button onClick={() => setSi(si - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-feed-bg transition-colors">
                <IoChevronBack size={16} className="text-light-text" />
              </button>
            )}
            <h2 className="text-[18px] font-bold text-text">{si < 3 ? "Connect a Store" : ""}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg transition-colors">
            <IoCloseOutline size={20} className="text-light-text" />
          </button>
        </div>

        {/* Step dots */}
        {si < 3 && (
          <div className="flex items-center gap-2 px-7 py-3">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  i < si ? "bg-green-500 text-white" : i === si ? "bg-primary text-white" : "bg-feed-bg text-light-text"
                }`}>
                  {i < si ? <IoCheckmark size={12} /> : i + 1}
                </div>
                <span className={`text-[12px] font-medium ${i === si ? "text-text" : "text-light-text"}`}>{s}</span>
                {i < 2 && <div className={`h-px w-8 ${i < si ? "bg-green-500" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="px-7 pb-7">
          {/* Step 1: Platform */}
          {si === 0 && (
            <div className="flex flex-col gap-5 pt-2">
              <p className="text-[14px] text-light-text">Choose where your store lives</p>
              <div className="flex flex-col gap-2.5">
                {([
                  { id: "custom_api", label: "Custom Website", desc: "Any site with an API", icon: <IoCodeSlashOutline size={24} className="text-violet-500" />, gradient: "from-violet-500/10 to-purple-500/10" },
                  { id: "shopify", label: "Shopify", desc: "Connect your Shopify store", icon: <ShopifyLogo size={26} />, gradient: "from-green-500/10 to-emerald-500/10" },
                  { id: "woocommerce", label: "WooCommerce", desc: "WordPress WooCommerce", icon: <WooLogo size={26} />, gradient: "from-purple-500/10 to-fuchsia-500/10" },
                ] as const).map(p => {
                  const active = platform === p.id;
                  return (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                        active ? "border-primary bg-gradient-to-r " + p.gradient : "border-transparent bg-feed-bg hover:border-border"
                      }`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
                        {p.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-text">{p.label}</p>
                        <p className="text-[12px] text-light-text">{p.desc}</p>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        active ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {active && <IoCheckmark size={10} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={next} disabled={!canNext}
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-30">
                Continue <IoArrowForward size={15} />
              </button>
            </div>
          )}

          {/* Step 2: URL */}
          {si === 1 && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10">
                  <IoGlobeOutline size={30} className="text-primary" />
                </div>
                <h3 className="text-[16px] font-bold text-text">Enter your store URL</h3>
                <p className="text-center text-[13px] text-light-text">We'll connect to your website and import your products</p>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-0 top-0 flex h-full w-12 items-center justify-center rounded-l-2xl bg-feed-bg">
                  <IoLinkOutline size={16} className="text-light-text" />
                </div>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} autoFocus
                  placeholder="https://mystore.com"
                  className="w-full rounded-2xl border border-border bg-background py-3.5 pl-14 pr-4 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" />
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 px-4 py-3">
                <IoInformationCircleOutline size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <p className="text-[12px] leading-relaxed text-blue-600">Use a secure HTTPS URL for best results. Your API key will be generated after connection.</p>
              </div>
              <button onClick={next} disabled={!canNext}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-30">
                Continue <IoArrowForward size={15} />
              </button>
            </div>
          )}

          {/* Step 3: Configure */}
          {si === 2 && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex items-center gap-3 rounded-2xl bg-green-500/5 border border-green-500/10 p-4">
                <IoCheckmarkCircle size={22} className="text-green-500" />
                <div>
                  <p className="text-[13px] font-semibold text-text">{url.replace(/^https?:\/\//, "")}</p>
                  <p className="text-[11px] text-green-600">Verified & ready</p>
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-bold text-text">Checkout method</p>
                <div className="flex flex-col gap-2">
                  {([
                    { v: "both" as const, label: "Both Twedot & Website", desc: "Buyers pick their preferred checkout" },
                    { v: "twedot" as const, label: "Twedot Only", desc: "Secure checkout powered by Twedot" },
                  ]).map(o => (
                    <label key={o.v} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                      checkout === o.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
                    }`}>
                      <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
                        checkout === o.v ? "border-primary" : "border-border"
                      }`}>
                        {checkout === o.v && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-text">{o.label}</p>
                        <p className="text-[11px] text-light-text">{o.desc}</p>
                      </div>
                      <input type="radio" name="co" checked={checkout === o.v} onChange={() => setCheckout(o.v)} className="sr-only" />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[13px] font-bold text-text">Sync frequency</p>
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-feed-bg p-1.5">
                  {["5", "15", "30", "60"].map(v => (
                    <button key={v} onClick={() => setSync(v)}
                      className={`rounded-xl py-2 text-[12px] font-semibold transition-all ${
                        sync === v ? "bg-background text-text shadow-sm" : "text-light-text hover:text-text"
                      }`}>
                      {v === "60" ? "1hr" : `${v}m`}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={next} disabled={connecting}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-70">
                {connecting ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Connecting...</>
                ) : (
                  <>Connect Store <IoRocketOutline size={15} /></>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Done */}
          {si === 3 && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                  <IoCheckmark size={36} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-[20px] font-bold text-text">You're all set!</h3>
                <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-light-text">
                  Your store is connected. Products are being synced to the Twedot feed.
                </p>
              </div>
              <button onClick={() => { onConnect(url, platform); onClose(); }}
                className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-primary/90">
                View Your Store <IoArrowForward size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Store Detail View ───────────────────────────────────────────────────────

function StoreDetail({ store, onBack }: { store: ConnectedStore; onBack: () => void }) {
  const [tab, setTab] = useState<"overview" | "products" | "settings" | "activity">("overview");
  const [view, setView] = useState<"grid" | "list">("grid");
  const products = PRODUCTS[store.id] ?? [];
  const pi = PLATFORM_INFO[store.platform];

  return (
    <div className="min-h-screen bg-feed-bg">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
            <IoChevronBack size={15} /> All stores
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.avatar} alt="" className="h-full w-full object-cover" />
                <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${store.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-text">{store.name}</h1>
                <div className="mt-1 flex items-center gap-3">
                  <a href={store.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-light-text hover:text-primary hover:underline">{store.url}</a>
                  <span className={`rounded-full bg-gradient-to-r ${pi.gradient} px-2.5 py-0.5 text-[10px] font-bold text-white`}>{pi.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-[12px] font-semibold text-text hover:bg-feed-bg transition-colors">
                <IoRefreshOutline size={14} /> Sync Now
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-feed-bg transition-colors">
                <IoEllipsisVertical size={16} className="text-light-text" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1">
            {(["overview", "products", "settings", "activity"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-[13px] font-semibold capitalize transition-all ${
                  tab === t ? "bg-primary text-white" : "text-light-text hover:bg-feed-bg hover:text-text"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Products", value: store.products.toLocaleString(), icon: IoCubeOutline, change: "+24 this week", color: "from-violet-500 to-purple-600" },
                { label: "Feed Views", value: shortNum(store.views), icon: IoEyeOutline, change: "+12% this month", color: "from-blue-500 to-cyan-500" },
                { label: "Orders", value: store.orders.toString(), icon: IoBagHandleOutline, change: "+8 today", color: "from-green-500 to-emerald-500" },
                { label: "Last Synced", value: timeAgo(store.lastSync), icon: IoSyncOutline, change: store.checkoutConfig.syncFrequency, color: "from-orange-500 to-amber-500" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}>
                      <s.icon size={18} className="text-white" />
                    </div>
                  </div>
                  <p className="mt-4 text-[24px] font-bold text-text">{s.value}</p>
                  <p className="text-[12px] text-light-text">{s.label}</p>
                  <p className="mt-1 text-[11px] text-green-600">{s.change}</p>
                </div>
              ))}
            </div>

            {/* Config summary */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[16px] font-bold text-text">Configuration</h3>
                  <button onClick={() => setTab("settings")} className="text-[12px] font-semibold text-primary hover:underline">Edit</button>
                </div>
                {[
                  { k: "Checkout", v: store.checkoutConfig.bothEnabled ? "Both Twedot & External" : "Twedot Only" },
                  { k: "Sync Frequency", v: store.checkoutConfig.syncFrequency },
                  { k: "Platform", v: pi.label },
                  { k: "Connected", v: new Date(store.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                ].map((r, i) => (
                  <div key={r.k} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                    <span className="text-[13px] text-light-text">{r.k}</span>
                    <span className="text-[13px] font-semibold text-text">{r.v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <h3 className="mb-5 text-[16px] font-bold text-text">Recent Activity</h3>
                {[
                  { text: "Products synced", sub: `${store.products} products updated`, time: timeAgo(store.lastSync), dot: "bg-green-500" },
                  { text: "API health check passed", sub: "All endpoints healthy", time: "1h ago", dot: "bg-blue-500" },
                  { text: "12 new products imported", sub: "From latest sync", time: "3h ago", dot: "bg-violet-500" },
                  { text: "Store connected", sub: store.url, time: timeAgo(store.connectedAt), dot: "bg-primary" },
                ].map((a, i) => (
                  <div key={i} className={`flex gap-3 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className="mt-1.5 flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${a.dot}`} />
                      {i < 3 && <div className="mt-1 h-full w-px bg-border" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-text">{a.text}</p>
                      <p className="text-[11px] text-light-text">{a.sub}</p>
                    </div>
                    <span className="text-[11px] text-light-text whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="flex justify-center pt-2">
              <button className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <IoTrashOutline size={15} /> Disconnect Store
              </button>
            </div>
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-text">{products.length} Products</h3>
                <p className="text-[12px] text-light-text">Synced from {store.name}</p>
              </div>
              <div className="flex gap-1 rounded-xl border border-border p-0.5">
                <button onClick={() => setView("grid")} className={`rounded-lg p-2 transition-colors ${view === "grid" ? "bg-primary text-white" : "text-light-text hover:text-text"}`}><IoGridOutline size={14} /></button>
                <button onClick={() => setView("list")} className={`rounded-lg p-2 transition-colors ${view === "list" ? "bg-primary text-white" : "text-light-text hover:text-text"}`}><IoListOutline size={14} /></button>
              </div>
            </div>
            {view === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map(p => (
                  <div key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="relative aspect-square overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {!p.available && <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"><span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white">Sold Out</span></div>}
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">{p.category}</span>
                    </div>
                    <div className="p-4">
                      <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[15px] font-bold text-primary">{formatPrice(p.price)}</span>
                        <span className={`text-[11px] font-medium ${p.available ? "text-green-600" : "text-red-500"}`}>
                          {p.available ? `${p.quantity} left` : "Sold out"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-background overflow-hidden">
                {products.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-feed-bg/50 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt="" className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                      <p className="text-[11px] text-light-text">{p.category}</p>
                    </div>
                    <span className="text-[14px] font-bold text-primary">{formatPrice(p.price)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {p.available ? "In Stock" : "Sold Out"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="mb-4 text-[16px] font-bold text-text">Checkout Preferences</h3>
              <div className="space-y-2.5">
                <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${store.checkoutConfig.bothEnabled ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" name="checkout" defaultChecked={store.checkoutConfig.bothEnabled} className="h-4 w-4 accent-[var(--color-primary)]" />
                  <div>
                    <p className="text-[14px] font-semibold text-text">Both Twedot & External</p>
                    <p className="text-[12px] text-light-text">Buyers choose their preferred checkout</p>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${!store.checkoutConfig.bothEnabled ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" name="checkout" defaultChecked={!store.checkoutConfig.bothEnabled} className="h-4 w-4 accent-[var(--color-primary)]" />
                  <div>
                    <p className="text-[14px] font-semibold text-text">Twedot Only</p>
                    <p className="text-[12px] text-light-text">Secure checkout via Twedot</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="mb-4 text-[16px] font-bold text-text">Sync Frequency</h3>
              <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-feed-bg p-1.5">
                {[{ v: "Every 5 minutes", l: "5m" }, { v: "Every 15 minutes", l: "15m" }, { v: "Every 30 minutes", l: "30m" }, { v: "Every hour", l: "1hr" }].map(o => (
                  <button key={o.v} className={`rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                    store.checkoutConfig.syncFrequency === o.v ? "bg-background text-text shadow-sm" : "text-light-text hover:text-text"
                  }`}>{o.l}</button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <h3 className="mb-4 text-[16px] font-bold text-text">Connection</h3>
              {[
                { k: "Platform", v: pi.label },
                { k: "URL", v: store.url },
                { k: "API Status", v: "Healthy", c: "text-green-600" },
                { k: "Connected", v: new Date(store.connectedAt).toLocaleDateString() },
                { k: "Last Sync", v: new Date(store.lastSync).toLocaleString() },
              ].map((r, i) => (
                <div key={r.k} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                  <span className="text-[13px] text-light-text">{r.k}</span>
                  <span className={`text-[13px] font-semibold ${(r as any).c || "text-text"}`}>{r.v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-background py-3 text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors">
                <IoRefreshOutline size={15} /> Sync Now
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-background py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <IoTrashOutline size={15} /> Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Activity */}
        {tab === "activity" && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-border bg-background overflow-hidden">
              {[
                { icon: IoSyncOutline, text: "Products synced", sub: `${store.products} updated`, time: timeAgo(store.lastSync), color: "bg-green-500" },
                { icon: IoShieldCheckmarkOutline, text: "Health check passed", sub: "All endpoints OK", time: "1h ago", color: "bg-blue-500" },
                { icon: IoLayersOutline, text: "12 products imported", sub: "New items from sync", time: "3h ago", color: "bg-violet-500" },
                { icon: IoSettingsOutline, text: "Config updated", sub: "Checkout set to both", time: "1d ago", color: "bg-orange-500" },
                { icon: IoFlashOutline, text: "Store connected", sub: store.url, time: timeAgo(store.connectedAt), color: "bg-primary" },
              ].map((a, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${a.color}`}>
                    <a.icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-text">{a.text}</p>
                    <p className="text-[11px] text-light-text">{a.sub}</p>
                  </div>
                  <span className="text-[11px] text-light-text whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [stores, setStores] = useState(STORES);
  const [selected, setSelected] = useState<ConnectedStore | null>(null);
  const [wizard, setWizard] = useState(false);

  function handleConnect(url: string, platform: string) {
    setStores(prev => [{
      id: `s${Date.now()}`, name: url.replace(/^https?:\/\//, "").split(".")[0], url: url.startsWith("http") ? url : `https://${url}`,
      platform: platform as ConnectedStore["platform"], status: "active", products: 0, views: 0, orders: 0,
      connectedAt: new Date().toISOString(), lastSync: new Date().toISOString(),
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      checkoutConfig: { bothEnabled: true, syncFrequency: "Every 15 minutes" },
    }, ...prev]);
  }

  if (selected) return <StoreDetail store={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="min-h-screen bg-feed-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/stories" className="flex items-center gap-2 text-[13px] font-medium text-light-text hover:text-text transition-colors">
              <IoArrowBack size={17} />
              <span className="hidden sm:inline">Twedot</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <IoStorefrontOutline size={14} className="text-white" />
              </div>
              <span className="text-[15px] font-bold text-text tracking-tight">Connect</span>
            </div>
          </div>
          <button onClick={() => setWizard(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25">
            <IoAddOutline size={16} /> Add Store
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0a3e] via-[#2d1b69] to-[#1a0a3e]">
        <MeshGradient />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
              <IoSparklesOutline size={12} className="text-violet-300" />
              <span className="text-[11px] font-semibold text-violet-200">Twedot Connect</span>
            </div>
            <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-tight text-white lg:text-[44px]">
              Your store,<br />
              <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                everywhere.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/50">
              Connect your online store to Twedot. Your products show up in the feed, people discover them, chat, and buy — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setWizard(true)}
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[14px] font-bold text-[#2d1b69] transition-all hover:shadow-xl hover:shadow-white/10">
                <IoLinkOutline size={16} /> Connect a Store <IoArrowForward size={14} />
              </button>
              <a href="#how" className="flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3 text-[14px] font-semibold text-white/70 backdrop-blur-sm transition-all hover:border-white/30 hover:text-white">
                Learn more
              </a>
            </div>
          </div>

          {/* Floating stats */}
          <div className="mt-10 flex flex-wrap gap-3">
            <StatPill icon={IoStorefrontOutline} value={`${stores.length}`} label="Connected stores" color="bg-violet-500" />
            <StatPill icon={IoCubeOutline} value={shortNum(stores.reduce((a, s) => a + s.products, 0))} label="Total products" color="bg-blue-500" />
            <StatPill icon={IoEyeOutline} value={shortNum(stores.reduce((a, s) => a + s.views, 0))} label="Feed views" color="bg-emerald-500" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Stores */}
        {stores.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-[22px] font-bold text-text">Your Stores</h2>
                <p className="mt-0.5 text-[13px] text-light-text">Manage connected websites and platforms</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map(store => {
                const pi = PLATFORM_INFO[store.platform];
                return (
                  <button key={store.id} onClick={() => setSelected(store)}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-background text-left transition-all hover:shadow-xl hover:-translate-y-1">
                    {/* Cover */}
                    <div className="relative h-44 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={store.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={store.avatar} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[14px] font-bold text-white">{store.name}</p>
                            <p className="truncate text-[11px] text-white/60">{store.url}</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-3 top-3 flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                          store.status === "active" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${store.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
                          {store.status === "active" ? "Live" : "Error"}
                        </span>
                        <span className={`rounded-full bg-gradient-to-r ${pi.gradient} px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md`}>
                          {pi.label}
                        </span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                      {[
                        { v: shortNum(store.products), l: "Products" },
                        { v: shortNum(store.views), l: "Views" },
                        { v: store.orders.toString(), l: "Orders" },
                      ].map(s => (
                        <div key={s.l} className="px-4 py-3 text-center">
                          <p className="text-[15px] font-bold text-text">{s.v}</p>
                          <p className="text-[10px] text-light-text">{s.l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[11px] text-light-text">
                        <IoSyncOutline size={12} /> Synced {timeAgo(store.lastSync)}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-primary group-hover:gap-2 transition-all">
                        Manage <IoChevronForward size={13} />
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Add card */}
              <button onClick={() => setWizard(true)}
                className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border py-16 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                  <IoAddOutline size={28} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-bold text-text">Add Another Store</p>
                  <p className="mt-1 text-[12px] text-light-text">Expand your reach on Twedot</p>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* How it works */}
        <section id="how" className="mb-12">
          <h2 className="mb-6 text-[22px] font-bold text-text">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", icon: IoLinkOutline, title: "Connect", desc: "Link your store URL with one click", gradient: "from-violet-500 to-purple-600" },
              { n: "02", icon: IoSyncOutline, title: "Sync", desc: "We import your products automatically", gradient: "from-blue-500 to-cyan-500" },
              { n: "03", icon: IoTrendingUpOutline, title: "Discover", desc: "Products appear in the Twedot feed", gradient: "from-green-500 to-emerald-500" },
              { n: "04", icon: IoCartOutline, title: "Sell", desc: "People chat, buy, and you grow", gradient: "from-orange-500 to-amber-500" },
            ].map((s, i) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-md">
                <span className="text-[40px] font-black text-feed-bg leading-none">{s.n}</span>
                <div className={`mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient}`}>
                  <s.icon size={20} className="text-white" />
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-text">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-light-text">{s.desc}</p>
                {i < 3 && <IoChevronForward size={16} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-border lg:block" />}
              </div>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className="mb-12">
          <h2 className="mb-6 text-[22px] font-bold text-text">Supported platforms</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { id: "custom_api", label: "Custom Website", desc: "Any website with API support", icon: <IoCodeSlashOutline size={24} className="text-violet-500" />, bg: "from-violet-500/10 to-purple-500/10" },
              { id: "shopify", label: "Shopify", desc: "Direct Shopify integration", icon: <ShopifyLogo size={28} />, bg: "from-green-500/10 to-emerald-500/10" },
              { id: "woocommerce", label: "WooCommerce", desc: "WordPress WooCommerce plugin", icon: <WooLogo size={28} />, bg: "from-purple-500/10 to-fuchsia-500/10" },
            ].map(p => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-md">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.bg}`}>
                  {p.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-text">{p.label}</p>
                  <p className="text-[12px] text-light-text">{p.desc}</p>
                </div>
                <IoCheckmarkCircle size={20} className="text-green-500" />
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a3e] via-[#2d1b69] to-[#1a0a3e] p-10 relative">
          <MeshGradient />
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-[24px] font-bold text-white">Ready to grow?</h3>
              <p className="mt-2 max-w-md text-[14px] text-white/50">Connect your store now and start reaching thousands of people on Twedot.</p>
            </div>
            <button onClick={() => setWizard(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[14px] font-bold text-[#2d1b69] transition-all hover:shadow-xl">
              Get Started <IoArrowForward size={14} />
            </button>
          </div>
        </section>
      </div>

      {wizard && <ConnectWizard onClose={() => setWizard(false)} onConnect={handleConnect} />}
    </div>
  );
}
