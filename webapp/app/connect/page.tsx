"use client";

import { useState } from "react";
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
  IoTimeOutline,
  IoLinkOutline,
  IoGridOutline,
  IoListOutline,
  IoArrowBack,
  IoEllipsisVertical,
  IoCodeSlashOutline,
  IoSyncOutline,
  IoCheckmark,
  IoArrowForward,
  IoInformationCircleOutline,
  IoLayersOutline,
  IoRefreshOutline,
  IoRocketOutline,
  IoEyeOutline,
  IoBagHandleOutline,
  IoCubeOutline,
  IoFlashOutline,
  IoShieldCheckmarkOutline,
  IoSettingsOutline,
  IoTrendingUpOutline,
  IoSearchOutline,
} from "react-icons/io5";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Store {
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
  checkout: { mode: "both" | "twedot"; syncFreq: string };
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  qty: number;
  category: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const STORES: Store[] = [
  {
    id: "s1", name: "Creator's Fashion Store", url: "https://creatorsfashion.com",
    platform: "custom_api", status: "active", products: 1200, views: 24500, orders: 342,
    connectedAt: "2026-11-20T10:30:00Z", lastSync: "2026-11-26T08:22:00Z",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop",
    checkout: { mode: "both", syncFreq: "Every 15 minutes" },
  },
  {
    id: "s2", name: "BizMart Online", url: "https://bizmart.com",
    platform: "shopify", status: "active", products: 850, views: 18200, orders: 198,
    connectedAt: "2026-11-18T08:15:00Z", lastSync: "2026-11-26T07:50:00Z",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop",
    checkout: { mode: "twedot", syncFreq: "Every 30 minutes" },
  },
];

const PRODUCTS: Record<string, Product[]> = {
  s1: [
    { id: "p1", name: "Classic Leather Handbag", price: 85000, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop", available: true, qty: 15, category: "Bags" },
    { id: "p2", name: "Ankara Midi Dress", price: 32000, image: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=400&h=400&fit=crop", available: true, qty: 24, category: "Dresses" },
    { id: "p3", name: "Sneaker Collection Air", price: 95000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", available: true, qty: 22, category: "Shoes" },
    { id: "p4", name: "Gold Statement Necklace", price: 18000, image: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c6?w=400&h=400&fit=crop", available: true, qty: 40, category: "Jewelry" },
    { id: "p5", name: "Denim Jacket Classic", price: 45000, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", available: false, qty: 0, category: "Jackets" },
    { id: "p6", name: "Silk Head Wrap Set", price: 12000, image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop", available: true, qty: 60, category: "Accessories" },
  ],
  s2: [
    { id: "b1", name: "Wireless Speaker", price: 25000, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop", available: true, qty: 50, category: "Electronics" },
    { id: "b2", name: "Smart Watch Pro", price: 65000, image: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop", available: true, qty: 12, category: "Electronics" },
    { id: "b3", name: "Leather Messenger Bag", price: 42000, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop", available: true, qty: 8, category: "Bags" },
    { id: "b4", name: "Ceramic Mug Set", price: 8500, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop", available: true, qty: 100, category: "Home" },
  ],
};

const PLAT: Record<string, { label: string; tag: string }> = {
  custom_api: { label: "Custom API", tag: "bg-violet-100 text-violet-700" },
  shopify: { label: "Shopify", tag: "bg-green-100 text-green-700" },
  woocommerce: { label: "WooCommerce", tag: "bg-fuchsia-100 text-fuchsia-700" },
};

const fmt = (n: number) => `₦${n.toLocaleString()}`;
const short = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : `${n}`;

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ─── Shared Nav ──────────────────────────────────────────────────────────────

function Nav({ tab, onTab, onAdd }: { tab: string; onTab: (t: string) => void; onAdd: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-6">
          <Link href="/stories" className="flex items-center gap-1.5 text-light-text hover:text-text transition-colors">
            <IoArrowBack size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <IoStorefrontOutline size={12} className="text-white" />
            </div>
            <span className="text-[14px] font-bold text-text tracking-tight">Connect</span>
          </div>
          <nav className="ml-4 flex items-center">
            {["stores", "activity"].map(t => (
              <button key={t} onClick={() => onTab(t)}
                className={`px-3 py-1.5 text-[13px] font-medium capitalize transition-colors rounded-lg ${
                  tab === t ? "bg-feed-bg text-text" : "text-light-text hover:text-text"
                }`}>{t}</button>
            ))}
          </nav>
        </div>
        <button onClick={onAdd}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors">
          <IoAddOutline size={14} /> New Store
        </button>
      </div>
    </header>
  );
}

// ─── Platform Logos ──────────────────────────────────────────────────────────

function ShopifyLogo({ s = 24 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 109.5 124.5" fill="none">
      <path d="M95.6 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.8-.8-2.3-.5-2.9-.4-.1 0-1.5.5-4 1.2-2.4-6.8-6.5-13.1-13.9-13.1h-.6C53.3 3.8 50.6 2 48.4 2c-17.2 0-25.4 21.5-28 32.4-6.7 2.1-11.5 3.5-12 3.7-3.7 1.2-3.8 1.3-4.3 4.8C3.7 45.6 0 76.8 0 76.8l71.5 13.4L95.6 28.2z" fill="#95BF47"/>
      <path d="M94.5 27.2c-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.3-.3-.6-.4-1-.4l-4.3 86.7 23.9-5.9S95.6 28.2 95.6 28.2c-.1-.6-.6-1-1.1-1z" fill="#5E8E3E"/>
      <path d="M54.8 43.1l-4.8 14.3s-4.2-2.2-9.3-2.2c-7.5 0-7.9 4.7-7.9 5.9 0 6.5 16.9 9 16.9 24.2 0 12-7.6 19.7-17.8 19.7-12.3 0-18.6-7.6-18.6-7.6l3.3-10.9s6.5 5.6 12 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.5-13.9-8.9-13.9-22.8C20.4 51.2 30.1 38 44.4 38c5.5 0 10.4 2.1 10.4 5.1z" fill="#fff"/>
    </svg>
  );
}

// ─── Connect Wizard ──────────────────────────────────────────────────────────

function Wizard({ onClose, onDone }: { onClose: () => void; onDone: (url: string, plat: string) => void }) {
  const [si, setSi] = useState(0);
  const [plat, setPlat] = useState("");
  const [url, setUrl] = useState("");
  const [co, setCo] = useState<"both" | "twedot">("both");
  const [sync, setSync] = useState("15");
  const [busy, setBusy] = useState(false);

  function next() {
    if (si === 2) { setBusy(true); setTimeout(() => { setBusy(false); setSi(3); }, 2000); return; }
    setSi(si + 1);
  }

  const ok = si === 0 ? !!plat : si === 1 ? !!url.trim() : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            {si > 0 && si < 3 && <button onClick={() => setSi(si - 1)} className="text-light-text hover:text-text"><IoChevronBack size={16} /></button>}
            <span className="text-[14px] font-semibold text-text">{si < 3 ? "New connection" : ""}</span>
          </div>
          <button onClick={onClose} className="text-light-text hover:text-text"><IoCloseOutline size={18} /></button>
        </div>

        {/* Steps indicator */}
        {si < 3 && (
          <div className="flex gap-1 px-5 pt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= si ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        )}

        <div className="p-5">
          {si === 0 && (
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-semibold text-text">Platform</p>
                <p className="text-[12px] text-light-text">Where does your store live?</p>
              </div>
              {([
                { id: "custom_api", name: "Custom Website", sub: "Any site with API", icon: <IoCodeSlashOutline size={18} className="text-violet-500" /> },
                { id: "shopify", name: "Shopify", sub: "Shopify store", icon: <ShopifyLogo s={20} /> },
                { id: "woocommerce", name: "WooCommerce", sub: "WordPress plugin", icon: <span className="flex h-5 w-5 items-center justify-center rounded bg-[#96588A] text-[8px] font-black text-white">W</span> },
              ]).map(p => (
                <button key={p.id} onClick={() => setPlat(p.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    plat === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-feed-bg">{p.icon}</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-text">{p.name}</p>
                    <p className="text-[11px] text-light-text">{p.sub}</p>
                  </div>
                  {plat === p.id && <IoCheckmarkCircle size={18} className="text-primary" />}
                </button>
              ))}
              <button onClick={next} disabled={!ok}
                className="w-full rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-white disabled:opacity-30">Continue</button>
            </div>
          )}

          {si === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-semibold text-text">Store URL</p>
                <p className="text-[12px] text-light-text">We'll validate and connect to your store</p>
              </div>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} autoFocus placeholder="https://mystore.com"
                className="w-full rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-light-text focus:border-primary focus:ring-1 focus:ring-primary/20" />
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <IoInformationCircleOutline size={14} className="mt-0.5 text-blue-500 flex-shrink-0" />
                <p className="text-[11px] text-blue-600">Use HTTPS for a secure connection. An API key will be generated after setup.</p>
              </div>
              <button onClick={next} disabled={!ok}
                className="w-full rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-white disabled:opacity-30">Continue</button>
            </div>
          )}

          {si === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                <IoCheckmarkCircle size={16} className="text-green-500" />
                <span className="text-[12px] font-medium text-green-700">{url.replace(/^https?:\/\//, "")} verified</span>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-text">Checkout</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["both", "twedot"] as const).map(v => (
                    <button key={v} onClick={() => setCo(v)}
                      className={`rounded-lg border p-3 text-left transition-all ${co === v ? "border-primary bg-primary/5" : "border-border"}`}>
                      <p className="text-[12px] font-semibold text-text">{v === "both" ? "Both" : "Twedot only"}</p>
                      <p className="text-[10px] text-light-text">{v === "both" ? "Buyer picks" : "Secure via Twedot"}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-text">Sync</p>
                <div className="flex gap-1 rounded-lg bg-feed-bg p-1">
                  {["5", "15", "30", "60"].map(v => (
                    <button key={v} onClick={() => setSync(v)}
                      className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-all ${sync === v ? "bg-background text-text shadow-sm" : "text-light-text"}`}>
                      {v === "60" ? "1h" : `${v}m`}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={next} disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-white disabled:opacity-70">
                {busy ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Connecting...</> : "Connect store"}
              </button>
            </div>
          )}

          {si === 3 && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <IoCheckmark size={28} className="text-green-600" />
              </div>
              <p className="text-[16px] font-bold text-text">Connected</p>
              <p className="text-center text-[13px] text-light-text">Products from {url.replace(/^https?:\/\//, "")} are syncing to the feed.</p>
              <button onClick={() => { onDone(url, plat); onClose(); }}
                className="rounded-lg bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Store Detail ────────────────────────────────────────────────────────────

function Detail({ store, onBack }: { store: Store; onBack: () => void }) {
  const [tab, setTab] = useState<"overview" | "products" | "settings" | "activity">("overview");
  const [view, setView] = useState<"grid" | "list">("grid");
  const products = PRODUCTS[store.id] ?? [];
  const pi = PLAT[store.platform];

  return (
    <div className="min-h-screen bg-feed-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center gap-4 px-5">
          <button onClick={onBack} className="text-light-text hover:text-text"><IoChevronBack size={16} /></button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-text">{store.name}</p>
              <p className="truncate text-[10px] text-light-text">{store.url}</p>
            </div>
            <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${pi.tag}`}>{pi.label}</span>
            <span className={`flex-shrink-0 h-2 w-2 rounded-full ${store.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
          </div>
          <div className="flex gap-1">
            <button className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-text hover:bg-feed-bg">
              <IoRefreshOutline size={12} /> Sync
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-light-text hover:bg-feed-bg">
              <IoEllipsisVertical size={14} />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex gap-0.5 -mb-px">
            {(["overview", "products", "settings", "activity"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`border-b-2 px-3 py-2 text-[12px] font-semibold capitalize transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-light-text hover:text-text"
                }`}>{t}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-5">
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Products", value: store.products.toLocaleString(), change: "+24", icon: IoCubeOutline, accent: "text-violet-500" },
                { label: "Feed Views", value: short(store.views), change: "+12%", icon: IoEyeOutline, accent: "text-blue-500" },
                { label: "Orders", value: `${store.orders}`, change: "+8", icon: IoBagHandleOutline, accent: "text-green-500" },
                { label: "Last Sync", value: ago(store.lastSync), change: store.checkout.syncFreq, icon: IoSyncOutline, accent: "text-orange-500" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <s.icon size={16} className={s.accent} />
                    <span className="text-[10px] font-medium text-green-600">{s.change}</span>
                  </div>
                  <p className="mt-3 text-[22px] font-bold text-text leading-none">{s.value}</p>
                  <p className="mt-1 text-[11px] text-light-text">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              <div className="lg:col-span-3 rounded-xl border border-border bg-background">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-[13px] font-semibold text-text">Configuration</span>
                  <button onClick={() => setTab("settings")} className="text-[11px] font-medium text-primary hover:underline">Edit</button>
                </div>
                {[
                  { k: "Checkout", v: store.checkout.mode === "both" ? "Twedot & External" : "Twedot Only" },
                  { k: "Sync Frequency", v: store.checkout.syncFreq },
                  { k: "Platform", v: pi.label },
                  { k: "Connected", v: new Date(store.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                ].map(r => (
                  <div key={r.k} className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-b-0">
                    <span className="text-[12px] text-light-text">{r.k}</span>
                    <span className="text-[12px] font-medium text-text">{r.v}</span>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 rounded-xl border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                  <span className="text-[13px] font-semibold text-text">Activity</span>
                </div>
                {[
                  { text: "Products synced", time: ago(store.lastSync), dot: "bg-green-500" },
                  { text: "Health check OK", time: "1h ago", dot: "bg-blue-500" },
                  { text: "12 new products", time: "3h ago", dot: "bg-violet-500" },
                  { text: "Store connected", time: ago(store.connectedAt), dot: "bg-primary" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0">
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${a.dot}`} />
                    <span className="flex-1 text-[12px] text-text">{a.text}</span>
                    <span className="text-[10px] text-light-text">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button className="text-[12px] font-medium text-red-500 hover:underline">Disconnect store</button>
            </div>
          </div>
        )}

        {tab === "products" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-text">{products.length} products</p>
              <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
                {(["grid", "list"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={`rounded-md p-1.5 transition-colors ${view === v ? "bg-primary text-white" : "text-light-text"}`}>
                    {v === "grid" ? <IoGridOutline size={13} /> : <IoListOutline size={13} />}
                  </button>
                ))}
              </div>
            </div>
            {view === "grid" ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map(p => (
                  <div key={p.id} className="group overflow-hidden rounded-xl border border-border bg-background hover:shadow-md transition-all">
                    <div className="relative aspect-square overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {!p.available && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Sold Out</span></div>}
                      <span className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">{p.category}</span>
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[12px] font-semibold text-text">{p.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[13px] font-bold text-primary">{fmt(p.price)}</span>
                        <span className={`text-[10px] font-medium ${p.available ? "text-green-600" : "text-red-500"}`}>{p.available ? `${p.qty} left` : "Out"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-feed-bg">
                      <th className="px-4 py-2 text-[11px] font-semibold text-light-text">Product</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-light-text">Category</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-light-text text-right">Price</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-light-text text-right">Stock</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-light-text text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-feed-bg/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt="" className="h-full w-full object-cover" /></div>
                            <span className="text-[12px] font-medium text-text truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-light-text">{p.category}</td>
                        <td className="px-4 py-2.5 text-[12px] font-semibold text-text text-right">{fmt(p.price)}</td>
                        <td className="px-4 py-2.5 text-[11px] text-light-text text-right">{p.qty}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                            {p.available ? "Active" : "Sold Out"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "settings" && (
          <div className="mx-auto max-w-xl space-y-4">
            <div className="rounded-xl border border-border bg-background">
              <div className="border-b border-border px-4 py-3">
                <span className="text-[13px] font-semibold text-text">Checkout</span>
              </div>
              <div className="p-4 space-y-2">
                {(["both", "twedot"] as const).map(v => (
                  <label key={v} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    store.checkout.mode === v ? "border-primary bg-primary/5" : "border-border"
                  }`}>
                    <input type="radio" name="co" defaultChecked={store.checkout.mode === v} className="h-3.5 w-3.5 accent-[var(--color-primary)]" />
                    <div>
                      <p className="text-[12px] font-semibold text-text">{v === "both" ? "Twedot & External" : "Twedot Only"}</p>
                      <p className="text-[10px] text-light-text">{v === "both" ? "Buyer chooses checkout" : "Secure Twedot checkout"}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background">
              <div className="border-b border-border px-4 py-3">
                <span className="text-[13px] font-semibold text-text">Sync Frequency</span>
              </div>
              <div className="p-4">
                <div className="flex gap-1 rounded-lg bg-feed-bg p-1">
                  {[{ v: "Every 5 minutes", l: "5m" }, { v: "Every 15 minutes", l: "15m" }, { v: "Every 30 minutes", l: "30m" }, { v: "Every hour", l: "1h" }].map(o => (
                    <button key={o.v} className={`flex-1 rounded-md py-2 text-[11px] font-semibold transition-all ${
                      store.checkout.syncFreq === o.v ? "bg-background text-text shadow-sm" : "text-light-text"
                    }`}>{o.l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background">
              <div className="border-b border-border px-4 py-3">
                <span className="text-[13px] font-semibold text-text">Connection</span>
              </div>
              {[
                { k: "URL", v: store.url },
                { k: "Platform", v: pi.label },
                { k: "API", v: "Healthy", c: "text-green-600" },
                { k: "Connected", v: new Date(store.connectedAt).toLocaleDateString() },
              ].map(r => (
                <div key={r.k} className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-b-0">
                  <span className="text-[12px] text-light-text">{r.k}</span>
                  <span className={`text-[12px] font-medium ${(r as any).c || "text-text"}`}>{r.v}</span>
                </div>
              ))}
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <IoTrashOutline size={14} /> Disconnect Store
            </button>
          </div>
        )}

        {tab === "activity" && (
          <div className="mx-auto max-w-xl rounded-xl border border-border bg-background overflow-hidden">
            {[
              { icon: IoSyncOutline, text: "Products synced", sub: `${store.products} updated`, time: ago(store.lastSync), color: "bg-green-100 text-green-600" },
              { icon: IoShieldCheckmarkOutline, text: "Health check passed", sub: "All endpoints OK", time: "1h ago", color: "bg-blue-100 text-blue-600" },
              { icon: IoLayersOutline, text: "12 products imported", sub: "New items from sync", time: "3h ago", color: "bg-violet-100 text-violet-600" },
              { icon: IoSettingsOutline, text: "Config updated", sub: "Checkout set to both", time: "1d ago", color: "bg-orange-100 text-orange-600" },
              { icon: IoFlashOutline, text: "Store connected", sub: store.url, time: ago(store.connectedAt), color: "bg-primary/10 text-primary" },
            ].map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${a.color}`}>
                  <a.icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text">{a.text}</p>
                  <p className="text-[10px] text-light-text truncate">{a.sub}</p>
                </div>
                <span className="text-[10px] text-light-text whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [stores, setStores] = useState(STORES);
  const [selected, setSelected] = useState<Store | null>(null);
  const [wizard, setWizard] = useState(false);
  const [mainTab, setMainTab] = useState("stores");

  function handleDone(url: string, plat: string) {
    setStores(prev => [{
      id: `s${Date.now()}`, name: url.replace(/^https?:\/\//, "").split(".")[0], url: url.startsWith("http") ? url : `https://${url}`,
      platform: plat as Store["platform"], status: "active", products: 0, views: 0, orders: 0,
      connectedAt: new Date().toISOString(), lastSync: new Date().toISOString(),
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop",
      checkout: { mode: "both", syncFreq: "Every 15 minutes" },
    }, ...prev]);
  }

  if (selected) return <Detail store={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="min-h-screen bg-feed-bg">
      <Nav tab={mainTab} onTab={setMainTab} onAdd={() => setWizard(true)} />

      <div className="mx-auto max-w-6xl px-5 py-5">
        {mainTab === "stores" && (
          <>
            {/* Summary row */}
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Total Stores", value: `${stores.length}`, icon: IoStorefrontOutline, accent: "text-violet-500" },
                { label: "Total Products", value: short(stores.reduce((a, s) => a + s.products, 0)), icon: IoCubeOutline, accent: "text-blue-500" },
                { label: "Total Orders", value: `${stores.reduce((a, s) => a + s.orders, 0)}`, icon: IoBagHandleOutline, accent: "text-green-500" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <s.icon size={18} className={s.accent} />
                  <div>
                    <p className="text-[18px] font-bold text-text leading-none">{s.value}</p>
                    <p className="text-[11px] text-light-text">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Store table */}
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-[13px] font-semibold text-text">Connected Stores</span>
                <button onClick={() => setWizard(true)} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                  <IoAddOutline size={13} /> Add store
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-feed-bg/50">
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text">Store</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text">Platform</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text text-right">Products</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text text-right">Views</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text text-right">Orders</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text">Status</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-light-text">Last Sync</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {stores.map(s => {
                    const pi = PLAT[s.platform];
                    return (
                      <tr key={s.id} onClick={() => setSelected(s)}
                        className="border-b border-border last:border-b-0 cursor-pointer hover:bg-feed-bg/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg overflow-hidden border border-border flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={s.image} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold text-text">{s.name}</p>
                              <p className="truncate text-[10px] text-light-text">{s.url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${pi.tag}`}>{pi.label}</span></td>
                        <td className="px-4 py-3 text-[12px] font-medium text-text text-right">{s.products.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[12px] font-medium text-text text-right">{short(s.views)}</td>
                        <td className="px-4 py-3 text-[12px] font-medium text-text text-right">{s.orders}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${s.status === "active" ? "text-green-600" : "text-red-500"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                            {s.status === "active" ? "Active" : "Error"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-light-text">{ago(s.lastSync)}</td>
                        <td className="px-4 py-3"><IoChevronForward size={14} className="text-light-text" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {stores.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <IoStorefrontOutline size={32} className="text-light-text" />
                  <p className="text-[14px] font-semibold text-text">No stores yet</p>
                  <p className="text-[12px] text-light-text">Connect your first store to start selling on Twedot</p>
                  <button onClick={() => setWizard(true)} className="mt-2 rounded-lg bg-primary px-4 py-2 text-[12px] font-semibold text-white">Connect a Store</button>
                </div>
              )}
            </div>

            {/* Quick start guide */}
            <div className="mt-5 rounded-xl border border-border bg-background p-5">
              <p className="mb-3 text-[13px] font-semibold text-text">Getting started</p>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { n: "1", icon: IoLinkOutline, title: "Connect", desc: "Link your store URL" },
                  { n: "2", icon: IoSyncOutline, title: "Sync", desc: "Products import auto" },
                  { n: "3", icon: IoTrendingUpOutline, title: "Discover", desc: "Appear in the feed" },
                  { n: "4", icon: IoCartOutline, title: "Sell", desc: "Chat and sell" },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary flex-shrink-0">{s.n}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-text">{s.title}</p>
                      <p className="text-[10px] text-light-text">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {mainTab === "activity" && (
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background overflow-hidden">
            {stores.flatMap(s => [
              { icon: IoSyncOutline, text: `${s.name}: Products synced`, time: ago(s.lastSync), color: "bg-green-100 text-green-600" },
              { icon: IoFlashOutline, text: `${s.name}: Connected`, time: ago(s.connectedAt), color: "bg-primary/10 text-primary" },
            ]).map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${a.color}`}>
                  <a.icon size={14} />
                </div>
                <span className="flex-1 text-[12px] text-text">{a.text}</span>
                <span className="text-[10px] text-light-text">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {wizard && <Wizard onClose={() => setWizard(false)} onDone={handleDone} />}
    </div>
  );
}
