"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  IoStorefrontOutline,
  IoAddOutline,
  IoSearchOutline,
  IoChevronForward,
  IoChevronBack,
  IoGlobeOutline,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoEllipseOutline,
  IoTrashOutline,
  IoCartOutline,
  IoOpenOutline,
  IoSwapHorizontalOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoLinkOutline,
  IoSettingsOutline,
  IoGridOutline,
  IoListOutline,
  IoWarningOutline,
  IoArrowBack,
} from "react-icons/io5";

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface ConnectedStore {
  id: string;
  storeName: string;
  storeUrl: string;
  platform: "custom_api" | "shopify" | "woocommerce";
  status: "active" | "pending" | "error" | "disconnected";
  productCount: number;
  connectedAt: string;
  lastSync: string;
  checkoutConfig: {
    twedotEnabled: boolean;
    externalEnabled: boolean;
    defaultCheckout: "twedot" | "external";
  };
}

interface MockProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  available: boolean;
  quantity: number;
  variants: { name: string; options: string[] }[];
}

const MOCK_STORES: ConnectedStore[] = [
  {
    id: "store_1",
    storeName: "Lagos Sneaker Hub",
    storeUrl: "https://lagossneakers.com",
    platform: "custom_api",
    status: "active",
    productCount: 42,
    connectedAt: "2026-11-20T10:30:00Z",
    lastSync: "2026-11-25T14:22:00Z",
    checkoutConfig: { twedotEnabled: true, externalEnabled: true, defaultCheckout: "twedot" },
  },
  {
    id: "store_2",
    storeName: "Amara Fabrics",
    storeUrl: "https://amarafabrics.ng",
    platform: "custom_api",
    status: "active",
    productCount: 18,
    connectedAt: "2026-11-18T08:15:00Z",
    lastSync: "2026-11-25T13:50:00Z",
    checkoutConfig: { twedotEnabled: true, externalEnabled: false, defaultCheckout: "twedot" },
  },
  {
    id: "store_3",
    storeName: "TechGadgets NG",
    storeUrl: "https://techgadgets.ng",
    platform: "shopify",
    status: "error",
    productCount: 0,
    connectedAt: "2026-11-22T16:00:00Z",
    lastSync: "2026-11-23T09:00:00Z",
    checkoutConfig: { twedotEnabled: false, externalEnabled: true, defaultCheckout: "external" },
  },
];

const MOCK_PRODUCTS: Record<string, MockProduct[]> = {
  store_1: [
    { id: "p1", name: "Nike Air Max 90", price: 85000, currency: "NGN", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", available: true, quantity: 15, variants: [{ name: "Size", options: ["40", "41", "42", "43", "44"] }, { name: "Color", options: ["Black", "White", "Red"] }] },
    { id: "p2", name: "Adidas Ultraboost", price: 120000, currency: "NGN", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop", available: true, quantity: 8, variants: [{ name: "Size", options: ["41", "42", "43"] }] },
    { id: "p3", name: "New Balance 550", price: 95000, currency: "NGN", image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=400&fit=crop", available: true, quantity: 22, variants: [{ name: "Size", options: ["39", "40", "41", "42", "43", "44"] }] },
    { id: "p4", name: "Jordan 1 Retro High", price: 150000, currency: "NGN", image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop", available: false, quantity: 0, variants: [{ name: "Size", options: ["42", "43"] }] },
    { id: "p5", name: "Puma RS-X", price: 65000, currency: "NGN", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop", available: true, quantity: 5, variants: [{ name: "Size", options: ["40", "41", "42"] }, { name: "Color", options: ["White/Blue", "Black/Red"] }] },
    { id: "p6", name: "Converse Chuck 70", price: 45000, currency: "NGN", image: "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=400&h=400&fit=crop", available: true, quantity: 30, variants: [{ name: "Size", options: ["38", "39", "40", "41", "42", "43"] }] },
  ],
  store_2: [
    { id: "f1", name: "Ankara Print Bundle (5 yards)", price: 15000, currency: "NGN", image: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=400&h=400&fit=crop", available: true, quantity: 50, variants: [{ name: "Pattern", options: ["Floral", "Geometric", "Abstract"] }] },
    { id: "f2", name: "Lace Fabric (French)", price: 35000, currency: "NGN", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop", available: true, quantity: 12, variants: [{ name: "Color", options: ["White", "Gold", "Royal Blue", "Wine"] }] },
    { id: "f3", name: "Aso-Oke Set", price: 25000, currency: "NGN", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop", available: true, quantity: 8, variants: [] },
    { id: "f4", name: "Cotton Voile (10 yards)", price: 8000, currency: "NGN", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop", available: true, quantity: 100, variants: [{ name: "Color", options: ["White", "Cream", "Sky Blue"] }] },
  ],
};

const PLATFORM_LABELS: Record<string, string> = {
  custom_api: "Custom Website",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Connected", color: "text-green-600", bg: "bg-green-50" },
  pending: { label: "Pending", color: "text-yellow-600", bg: "bg-yellow-50" },
  error: { label: "Connection Error", color: "text-red-500", bg: "bg-red-50" },
  disconnected: { label: "Disconnected", color: "text-light-text", bg: "bg-feed-bg" },
};

function formatPrice(amount: number, currency: string) {
  if (currency === "NGN") return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Connect Store Modal ─────────────────────────────────────────────────────

function ConnectModal({ onClose, onConnect }: { onClose: () => void; onConnect: (url: string, platform: string) => void }) {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("custom_api");
  const [step, setStep] = useState<"url" | "type" | "connecting" | "done">("url");

  const platforms = [
    { id: "custom_api", label: "Custom Website", desc: "Any website with Twedot API support", icon: IoGlobeOutline, logo: null, logoBg: "bg-primary/10" },
    { id: "shopify", label: "Shopify", desc: "Connect your Shopify store", icon: IoCartOutline, logo: "https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713c48f63a82d8a039c9b89441f0.svg", logoBg: "bg-[#95BF47]/10" },
    { id: "woocommerce", label: "WooCommerce", desc: "Connect your WooCommerce store", icon: IoCartOutline, logo: "https://woo.com/wp-content/themes/flavor/flavor/assets/images/woo-logo.svg", logoBg: "bg-[#96588A]/10" },
  ];

  function handleNext() {
    if (step === "url" && url.trim()) setStep("type");
    else if (step === "type") {
      setStep("connecting");
      setTimeout(() => setStep("done"), 2000);
    }
  }

  function handleDone() {
    onConnect(url.trim(), platform);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background p-0 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-bold text-text">Connect a Store</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg">
            <IoCloseOutline size={20} className="text-light-text" />
          </button>
        </div>

        <div className="px-5 py-5">
          {step === "url" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-light-text">Store URL</p>
                <p className="mb-3 text-[13px] text-light-text">Enter the URL of the website you want to connect.</p>
              </div>
              <div className="relative">
                <IoGlobeOutline size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://mystore.com"
                  className="w-full rounded-xl border border-border bg-feed-bg py-3 pl-10 pr-4 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary focus:ring-1 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <button
                onClick={handleNext}
                disabled={!url.trim()}
                className="rounded-xl bg-primary py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          )}

          {step === "type" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-light-text">Platform Type</p>
                <p className="mb-3 text-[13px] text-light-text">Select the type of platform for <span className="font-medium text-text">{url}</span></p>
              </div>
              <div className="flex flex-col gap-2">
                {platforms.map(p => {
                  const active = platform === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-feed-bg"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.logoBg || (active ? "bg-primary/10" : "bg-feed-bg")}`}>
                        {p.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo} alt={p.label} className="h-6 w-6 object-contain" />
                        ) : (
                          <Icon size={20} className={active ? "text-primary" : "text-light-text"} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-text">{p.label}</p>
                        <p className="text-[12px] text-light-text">{p.desc}</p>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        active ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {active && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("url")}
                  className="flex-1 rounded-xl border border-border py-3 text-[14px] font-semibold text-text transition-all hover:bg-feed-bg"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 rounded-xl bg-primary py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90"
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {step === "connecting" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-feed-bg border-t-primary" />
              <p className="text-[15px] font-semibold text-text">Connecting to store...</p>
              <p className="text-[13px] text-light-text">Validating API and retrieving products</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <IoCheckmarkCircle size={36} className="text-green-500" />
              </div>
              <p className="text-[16px] font-bold text-text">Store Connected!</p>
              <p className="text-center text-[13px] text-light-text">
                Products from <span className="font-medium text-text">{url}</span> will now appear in the Twedot feed.
              </p>
              <button
                onClick={handleDone}
                className="mt-2 rounded-xl bg-primary px-8 py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90"
              >
                Done
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
  const [tab, setTab] = useState<"products" | "settings">("products");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const products = MOCK_PRODUCTS[store.id] ?? [];
  const statusCfg = STATUS_CONFIG[store.status];

  return (
    <div className="flex h-full flex-col">
      {/* Back + header */}
      <div className="border-b border-border px-5 py-3.5">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-light-text hover:text-text">
          <IoChevronBack size={16} /> Connected Stores
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-text">{store.storeName}</h2>
            <div className="mt-1 flex items-center gap-3">
              <a href={store.storeUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-primary hover:underline">
                <IoGlobeOutline size={12} /> {store.storeUrl.replace(/^https?:\/\//, "")}
              </a>
              <span className="text-[11px] text-light-text">{PLATFORM_LABELS[store.platform]}</span>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusCfg.color} ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex border-b border-border">
        {[
          { label: "Products", value: store.productCount.toString(), icon: IoCartOutline },
          { label: "Last Sync", value: timeAgo(store.lastSync), icon: IoTimeOutline },
          { label: "Connected", value: timeAgo(store.connectedAt), icon: IoLinkOutline },
        ].map(s => (
          <div key={s.label} className="flex flex-1 items-center gap-2.5 border-r border-border px-4 py-3 last:border-r-0">
            <s.icon size={16} className="flex-shrink-0 text-light-text" />
            <div>
              <p className="text-[14px] font-bold text-text">{s.value}</p>
              <p className="text-[11px] text-light-text">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-5">
        {(["products", "settings"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-3 text-[13px] font-semibold capitalize transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-light-text hover:text-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "products" && (
          <div className="p-5">
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <IoCartOutline size={36} className="text-light-text" />
                <p className="text-[14px] font-semibold text-text">No products found</p>
                <p className="text-[13px] text-light-text">This store has no products or the connection needs to be refreshed.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[13px] text-light-text">{products.length} products from this store</p>
                  <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                    <button onClick={() => setViewMode("grid")}
                      className={`rounded-md p-1.5 ${viewMode === "grid" ? "bg-feed-bg text-text" : "text-light-text"}`}>
                      <IoGridOutline size={14} />
                    </button>
                    <button onClick={() => setViewMode("list")}
                      className={`rounded-md p-1.5 ${viewMode === "list" ? "bg-feed-bg text-text" : "text-light-text"}`}>
                      <IoListOutline size={14} />
                    </button>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {products.map(p => (
                      <div key={p.id} className="group overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
                        <div className="relative aspect-square overflow-hidden bg-feed-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          {!p.available && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white">Sold Out</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                          <p className="mt-0.5 text-[14px] font-bold text-primary">{formatPrice(p.price, p.currency)}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[11px] text-light-text">{p.quantity} in stock</span>
                            {p.variants.length > 0 && (
                              <span className="text-[11px] text-light-text">{p.variants.length} variant{p.variants.length > 1 ? "s" : ""}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-shadow hover:shadow-sm">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-feed-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          {!p.available && <div className="absolute inset-0 bg-black/40" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                          <div className="mt-0.5 flex items-center gap-3">
                            <span className="text-[14px] font-bold text-primary">{formatPrice(p.price, p.currency)}</span>
                            <span className="text-[11px] text-light-text">{p.quantity} in stock</span>
                            {!p.available && <span className="text-[11px] font-semibold text-red-500">Sold Out</span>}
                          </div>
                        </div>
                        <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="p-5">
            <div className="flex flex-col gap-6">
              {/* Checkout Configuration */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Checkout</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <IoCartOutline size={18} className="text-light-text" />
                      <div>
                        <p className="text-[13px] font-semibold text-text">Twedot Checkout</p>
                        <p className="text-[11px] text-light-text">Use Twedot escrow and payment</p>
                      </div>
                    </div>
                    <div className={`h-5 w-9 rounded-full transition-colors ${store.checkoutConfig.twedotEnabled ? "bg-primary" : "bg-border"}`}>
                      <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${store.checkoutConfig.twedotEnabled ? "translate-x-4.5 ml-[18px]" : "ml-0.5"}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <IoOpenOutline size={18} className="text-light-text" />
                      <div>
                        <p className="text-[13px] font-semibold text-text">External Checkout</p>
                        <p className="text-[11px] text-light-text">Redirect to store's checkout page</p>
                      </div>
                    </div>
                    <div className={`h-5 w-9 rounded-full transition-colors ${store.checkoutConfig.externalEnabled ? "bg-primary" : "bg-border"}`}>
                      <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${store.checkoutConfig.externalEnabled ? "ml-[18px]" : "ml-0.5"}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Default checkout */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Default Checkout Method</p>
                <div className="flex gap-2">
                  {(["twedot", "external"] as const).map(opt => {
                    const active = store.checkoutConfig.defaultCheckout === opt;
                    return (
                      <button
                        key={opt}
                        className={`flex-1 rounded-xl border px-4 py-3 text-center text-[13px] font-semibold capitalize transition-all ${
                          active ? "border-primary bg-primary/5 text-primary" : "border-border text-light-text hover:border-primary/30"
                        }`}
                      >
                        {opt === "twedot" ? "Twedot Pay" : "External"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connection info */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Connection</p>
                <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
                  {[
                    { label: "Platform", value: PLATFORM_LABELS[store.platform] },
                    { label: "Store URL", value: store.storeUrl },
                    { label: "Connected", value: new Date(store.connectedAt).toLocaleDateString() },
                    { label: "Last Sync", value: new Date(store.lastSync).toLocaleString() },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] text-light-text">{r.label}</span>
                      <span className="text-[13px] font-medium text-text">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-[13px] font-semibold text-text transition-colors hover:bg-feed-bg">
                  <IoSwapHorizontalOutline size={16} /> Sync Products Now
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50">
                  <IoTrashOutline size={16} /> Disconnect Store
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5">
        <IoStorefrontOutline size={36} className="text-primary" />
      </div>
      <h2 className="text-[18px] font-bold text-text">Connect Your Store</h2>
      <p className="max-w-sm text-[14px] leading-[22px] text-light-text">
        Link your external online store to Twedot. Your products will appear in the feed for people to discover, chat about, and buy.
      </p>
      <button
        onClick={onConnect}
        className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90"
      >
        <IoAddOutline size={18} />
        Connect a Store
      </button>
      <div className="mt-6 flex flex-col gap-3">
        {[
          { icon: IoGlobeOutline, text: "Custom websites with API support" },
          { icon: IoCartOutline, text: "Shopify and WooCommerce (coming soon)" },
          { icon: IoSwapHorizontalOutline, text: "Products sync automatically" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <item.icon size={16} className="flex-shrink-0 text-primary" />
            <span className="text-[13px] text-light-text">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [stores, setStores] = useState<ConnectedStore[]>(MOCK_STORES);
  const [selectedStore, setSelectedStore] = useState<ConnectedStore | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(s =>
      s.storeName.toLowerCase().includes(q) || s.storeUrl.toLowerCase().includes(q)
    );
  }, [stores, search]);

  function handleConnect(url: string, platform: string) {
    const newStore: ConnectedStore = {
      id: `store_${Date.now()}`,
      storeName: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      storeUrl: url.startsWith("http") ? url : `https://${url}`,
      platform: platform as ConnectedStore["platform"],
      status: "active",
      productCount: 0,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      checkoutConfig: { twedotEnabled: true, externalEnabled: false, defaultCheckout: "twedot" },
    };
    setStores(prev => [newStore, ...prev]);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Standalone top bar */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-4">
          <Link href="/stories" className="flex items-center gap-2 text-light-text hover:text-text transition-colors">
            <IoArrowBack size={18} />
            <span className="text-[13px] font-medium">Back to Twedot</span>
          </Link>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <IoStorefrontOutline size={20} className="text-primary" />
            <span className="text-[16px] font-bold text-text">Twedot Connect</span>
          </div>
        </div>
        {!selectedStore && stores.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-primary/90"
          >
            <IoAddOutline size={16} />
            Connect Store
          </button>
        )}
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {selectedStore ? (
          <div className="flex-1 overflow-hidden">
            <StoreDetail store={selectedStore} onBack={() => setSelectedStore(null)} />
          </div>
        ) : stores.length === 0 ? (
          <div className="flex-1 overflow-y-auto">
            <EmptyState onConnect={() => setShowModal(true)} />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden">
            {/* Search */}
            <div className="border-b border-border px-6 py-3">
              <div className="flex items-center gap-2 rounded-xl bg-feed-bg px-3.5 py-2.5">
                <IoSearchOutline size={16} className="flex-shrink-0 text-light-text" />
                <input
                  type="text"
                  placeholder="Search connected stores"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-light-text"
                />
              </div>
            </div>

            {/* Store list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-light-text">
                  {filtered.length} Connected Store{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>
              {filtered.length === 0 ? (
                <p className="px-6 py-8 text-center text-[13px] text-light-text">No stores match your search.</p>
              ) : (
                <div className="flex flex-col px-6 pb-6">
                  {filtered.map(store => {
                    const statusCfg = STATUS_CONFIG[store.status];
                    return (
                      <button
                        key={store.id}
                        onClick={() => setSelectedStore(store)}
                        className="flex items-center gap-4 rounded-xl border-b border-border px-4 py-4 text-left transition-colors hover:bg-feed-bg/60"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/5">
                          <IoStorefrontOutline size={22} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-semibold text-text">{store.storeName}</p>
                            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCfg.color} ${statusCfg.bg}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[12px] text-light-text">
                            {store.storeUrl.replace(/^https?:\/\//, "")} · {PLATFORM_LABELS[store.platform]}
                          </p>
                          <div className="mt-1 flex items-center gap-4 text-[11px] text-light-text">
                            <span>{store.productCount} products</span>
                            <span>Synced {timeAgo(store.lastSync)}</span>
                          </div>
                        </div>
                        <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && <ConnectModal onClose={() => setShowModal(false)} onConnect={handleConnect} />}
    </div>
  );
}
