"use client";

import { useState, useMemo, useEffect } from "react";
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
  IoArrowBack,
  IoEllipsisVertical,
  IoNotificationsOutline,
  IoPersonCircleOutline,
  IoCodeSlashOutline,
  IoSyncOutline,
  IoTrendingUpOutline,
  IoCheckmark,
  IoArrowForward,
  IoInformationCircleOutline,
  IoShieldCheckmarkOutline,
  IoChatbubblesOutline,
  IoStatsChartOutline,
  IoLayersOutline,
  IoRefreshOutline,
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
  image: string;
  checkoutConfig: {
    bothEnabled: boolean;
    twedotOnly: boolean;
    syncFrequency: string;
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
  category: string;
}

const MOCK_STORES: ConnectedStore[] = [
  {
    id: "store_1",
    storeName: "Creator's Fashion Store",
    storeUrl: "https://creatorsfashion.com",
    platform: "custom_api",
    status: "active",
    productCount: 1200,
    connectedAt: "2026-11-20T10:30:00Z",
    lastSync: "2026-11-26T08:22:00Z",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
    checkoutConfig: { bothEnabled: true, twedotOnly: false, syncFrequency: "Every 15 minutes" },
  },
  {
    id: "store_2",
    storeName: "BizMart Online",
    storeUrl: "https://bizmart.com",
    platform: "shopify",
    status: "active",
    productCount: 850,
    connectedAt: "2026-11-18T08:15:00Z",
    lastSync: "2026-11-26T07:50:00Z",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop",
    checkoutConfig: { bothEnabled: false, twedotOnly: true, syncFrequency: "Every 30 minutes" },
  },
];

const MOCK_PRODUCTS: Record<string, MockProduct[]> = {
  store_1: [
    { id: "p1", name: "Classic Leather Handbag", price: 85000, currency: "NGN", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop", available: true, quantity: 15, variants: [{ name: "Color", options: ["Black", "Brown", "Tan"] }], category: "Bags" },
    { id: "p2", name: "Ankara Midi Dress", price: 32000, currency: "NGN", image: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=400&h=400&fit=crop", available: true, quantity: 24, variants: [{ name: "Size", options: ["S", "M", "L", "XL"] }], category: "Dresses" },
    { id: "p3", name: "Sneaker Collection Air", price: 95000, currency: "NGN", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", available: true, quantity: 22, variants: [{ name: "Size", options: ["39", "40", "41", "42", "43", "44"] }], category: "Shoes" },
    { id: "p4", name: "Gold Statement Necklace", price: 18000, currency: "NGN", image: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c6?w=400&h=400&fit=crop", available: true, quantity: 40, variants: [], category: "Jewelry" },
    { id: "p5", name: "Denim Jacket Classic", price: 45000, currency: "NGN", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", available: false, quantity: 0, variants: [{ name: "Size", options: ["M", "L"] }], category: "Jackets" },
    { id: "p6", name: "Silk Head Wrap Set", price: 12000, currency: "NGN", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop", available: true, quantity: 60, variants: [{ name: "Color", options: ["Red", "Blue", "Gold", "Green"] }], category: "Accessories" },
  ],
  store_2: [
    { id: "b1", name: "Wireless Bluetooth Speaker", price: 25000, currency: "NGN", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop", available: true, quantity: 50, variants: [{ name: "Color", options: ["Black", "White", "Blue"] }], category: "Electronics" },
    { id: "b2", name: "Smart Watch Pro", price: 65000, currency: "NGN", image: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop", available: true, quantity: 12, variants: [], category: "Electronics" },
    { id: "b3", name: "Leather Messenger Bag", price: 42000, currency: "NGN", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop", available: true, quantity: 8, variants: [{ name: "Color", options: ["Brown", "Black"] }], category: "Bags" },
    { id: "b4", name: "Ceramic Coffee Mug Set", price: 8500, currency: "NGN", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop", available: true, quantity: 100, variants: [], category: "Home" },
  ],
};

const PLATFORM_LABELS: Record<string, string> = {
  custom_api: "Custom Website",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

function formatPrice(amount: number, currency: string) {
  if (currency === "NGN") return `₦${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Platform SVG Logos ──────────────────────────────────────────────────────

function ShopifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 109.5 124.5" className={className} fill="none">
      <path d="M95.6 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.8-.8-2.3-.5-2.9-.4-.1 0-1.5.5-4 1.2-2.4-6.8-6.5-13.1-13.9-13.1h-.6C53.3 3.8 50.6 2 48.4 2c-17.2 0-25.4 21.5-28 32.4-6.7 2.1-11.5 3.5-12 3.7-3.7 1.2-3.8 1.3-4.3 4.8C3.7 45.6 0 76.8 0 76.8l71.5 13.4L95.6 28.2zM69.4 22.2l-6.6 2c0-2-.3-5-1.2-7.5 3 .6 5 4 5.5 5.3l2.3.2zM59.4 25.1l-13.4 4.1c1.3-5 3.8-10 8.5-13.2 1.8-1.2 4.4-2.6 6.7-2.7.8 2.3 1.2 5.6 1.2 8.5-.9.1-2 .5-3 1.3zM48.6 6.6c1 0 2.4.5 3.4 1 5.5 2.6 8.2 8.6 9.5 13.4l-11.3 3.5c2.6-10 7.4-15.2 7.4-15.2s-3.6-.9-9-2.7z" fill="#95BF47"/>
      <path d="M94.5 27.2c-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.3-.3-.6-.4-1-.4l-4.3 86.7 23.9-5.9S95.6 28.2 95.6 28.2c-.1-.6-.6-1-1.1-1z" fill="#5E8E3E"/>
      <path d="M54.8 43.1l-4.8 14.3s-4.2-2.2-9.3-2.2c-7.5 0-7.9 4.7-7.9 5.9 0 6.5 16.9 9 16.9 24.2 0 12-7.6 19.7-17.8 19.7-12.3 0-18.6-7.6-18.6-7.6l3.3-10.9s6.5 5.6 12 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.5-13.9-8.9-13.9-22.8C20.4 51.2 30.1 38 44.4 38c5.5 0 10.4 2.1 10.4 5.1z" fill="#fff"/>
    </svg>
  );
}

function WooCommerceLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <rect width="100" height="100" rx="20" fill="#96588A"/>
      <text x="50" y="62" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="sans-serif">Woo</text>
    </svg>
  );
}

function CustomWebIcon({ className }: { className?: string }) {
  return (
    <div className={className}>
      <IoCodeSlashOutline size={32} />
    </div>
  );
}

// ─── Connect Store Modal (Multi-Step Wizard) ─────────────────────────────────

const WIZARD_STEPS = [
  { key: "platform", label: "Choose Platform" },
  { key: "details", label: "Enter Details" },
  { key: "configure", label: "Store Configuration" },
  { key: "confirm", label: "Confirm" },
] as const;

type WizardStep = typeof WIZARD_STEPS[number]["key"];

function ConnectModal({ onClose, onConnect }: { onClose: () => void; onConnect: (url: string, platform: string) => void }) {
  const [step, setStep] = useState<WizardStep>("platform");
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [checkoutType, setCheckoutType] = useState<"both" | "twedot">("both");
  const [syncFreq, setSyncFreq] = useState("15");
  const [connecting, setConnecting] = useState(false);
  const [done, setDone] = useState(false);

  const stepIndex = WIZARD_STEPS.findIndex(s => s.key === step);

  const platforms = [
    { id: "custom_api", label: "Custom Website", desc: "Connect your custom-built store or business website", logo: "custom" },
    { id: "shopify", label: "Shopify", desc: "Connect your Shopify store", logo: "shopify" },
    { id: "woocommerce", label: "WooCommerce", desc: "Connect your WooCommerce store", logo: "woo" },
  ];

  function handleConnect() {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setDone(true);
    }, 2500);
  }

  function handleDone() {
    onConnect(url.trim(), platform);
    onClose();
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col items-center gap-5 px-8 py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <IoCheckmarkCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-[22px] font-bold text-text">Store Connected!</h2>
            <p className="text-center text-[14px] leading-relaxed text-light-text">
              Products from <span className="font-semibold text-text">{url}</span> will now appear in the Twedot feed for people to discover.
            </p>
            <button onClick={handleDone}
              className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-primary/90">
              Go to Store <IoArrowForward size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {step !== "platform" && (
              <button onClick={() => {
                const prev = WIZARD_STEPS[stepIndex - 1];
                if (prev) setStep(prev.key);
              }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg">
                <IoChevronBack size={18} className="text-light-text" />
              </button>
            )}
            <h2 className="text-[17px] font-bold text-text">Connect a Store</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg">
            <IoCloseOutline size={20} className="text-light-text" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-6 py-4">
          {WIZARD_STEPS.map((s, i) => {
            const isCurrent = i === stepIndex;
            const isComplete = i < stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                  isComplete ? "bg-primary text-white" : isCurrent ? "bg-primary text-white" : "bg-feed-bg text-light-text"
                }`}>
                  {isComplete ? <IoCheckmark size={14} /> : i + 1}
                </div>
                <span className={`hidden text-[12px] font-medium sm:block ${isCurrent ? "text-text" : "text-light-text"}`}>
                  {s.label}
                </span>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`mx-1 h-px w-6 sm:w-10 ${isComplete ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Step 1: Choose Platform */}
          {step === "platform" && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-light-text">Select the type of store you want to connect</p>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map(p => {
                  const active = platform === p.id;
                  return (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 px-3 py-5 transition-all ${
                        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}>
                      {active && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <IoCheckmark size={12} className="text-white" />
                        </div>
                      )}
                      <div className="flex h-14 w-14 items-center justify-center">
                        {p.logo === "shopify" && <ShopifyLogo className="h-12 w-12" />}
                        {p.logo === "woo" && <WooCommerceLogo className="h-12 w-12 rounded-xl" />}
                        {p.logo === "custom" && <CustomWebIcon className="text-primary" />}
                      </div>
                      <span className="text-[13px] font-semibold text-text">{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => platform && setStep("details")} disabled={!platform}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-40">
                  Continue <IoArrowForward size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Enter Details */}
          {step === "details" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                  <IoStorefrontOutline size={36} className="text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-[16px] font-bold text-text">Enter Your Store URL</h3>
                  <p className="mt-1 text-[13px] text-light-text">Provide the URL of your store or website to connect it with Twedot.</p>
                </div>
              </div>
              <div className="relative">
                <IoGlobeOutline size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-light-text" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://creatorsstore.com"
                  className="w-full rounded-xl border border-border bg-feed-bg py-3.5 pl-11 pr-4 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3">
                <IoInformationCircleOutline size={18} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <p className="text-[12px] leading-relaxed text-blue-700">
                  Make sure your website supports Twedot integration (for best results, use a secure HTTPS URL).
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 rounded-xl border border-border py-3 text-[14px] font-semibold text-text transition-all hover:bg-feed-bg">
                  Cancel
                </button>
                <button onClick={() => url.trim() && setStep("configure")} disabled={!url.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-40">
                  Continue <IoArrowForward size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Store Configuration */}
          {step === "configure" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <IoCheckmarkCircle size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">{url.replace(/^https?:\/\//, "")}</p>
                  <p className="text-[12px] text-green-600">Connected</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-[14px] font-bold text-text">Checkout Preferences</h4>
                <p className="mb-3 text-[12px] text-light-text">Choose how buyers can purchase products from this store.</p>
                <div className="flex flex-col gap-2">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                    checkoutType === "both" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}>
                    <input type="radio" name="checkout" checked={checkoutType === "both"} onChange={() => setCheckoutType("both")}
                      className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                    <div>
                      <p className="text-[13px] font-semibold text-text">Both Twedot & External Checkout</p>
                      <p className="mt-0.5 text-[12px] text-light-text">Let buyers choose between Twedot checkout or your website checkout.</p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                    checkoutType === "twedot" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}>
                    <input type="radio" name="checkout" checked={checkoutType === "twedot"} onChange={() => setCheckoutType("twedot")}
                      className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                    <div>
                      <p className="text-[13px] font-semibold text-text">Twedot Checkout Only</p>
                      <p className="mt-0.5 text-[12px] text-light-text">Buyers will use Twedot's secure checkout.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-[14px] font-bold text-text">Sync Settings</h4>
                <p className="mb-3 text-[12px] text-light-text">Control how often we fetch your products.</p>
                <div className="relative">
                  <IoSyncOutline size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
                  <select value={syncFreq} onChange={e => setSyncFreq(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-feed-bg py-3 pl-10 pr-4 text-[13px] text-text outline-none focus:border-primary">
                    <option value="5">Every 5 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep("details")}
                  className="rounded-xl border border-border px-6 py-3 text-[14px] font-semibold text-text transition-all hover:bg-feed-bg">
                  Back
                </button>
                <button onClick={handleConnect} disabled={connecting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[14px] font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-70">
                  {connecting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connecting...
                    </>
                  ) : (
                    <>Connect Store</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm (auto-redirects on success) */}
          {step === "confirm" && (
            <div className="flex flex-col items-center gap-5 py-10">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-feed-bg border-t-primary" />
              <p className="text-[15px] font-semibold text-text">Finalizing connection...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Store Detail / Management View ──────────────────────────────────────────

function StoreDetail({ store, onBack }: { store: ConnectedStore; onBack: () => void }) {
  const [tab, setTab] = useState<"overview" | "settings" | "products" | "activity">("overview");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const products = MOCK_PRODUCTS[store.id] ?? [];

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "settings" as const, label: "Settings" },
    { key: "products" as const, label: "Products" },
    { key: "activity" as const, label: "Activity" },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Store header */}
      <div className="border-b border-border px-6 py-5">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
          <IoChevronBack size={16} /> Back to stores
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <IoStorefrontOutline size={28} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-bold text-text">{store.storeName}</h2>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  store.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                }`}>
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                    store.status === "active" ? "bg-green-500" : "bg-red-500"
                  }`} />
                  {store.status === "active" ? "Active" : "Error"}
                </span>
              </div>
              <a href={store.storeUrl} target="_blank" rel="noopener noreferrer"
                className="mt-0.5 text-[13px] text-light-text hover:text-primary hover:underline">
                {store.storeUrl}
              </a>
            </div>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-feed-bg">
            <IoEllipsisVertical size={18} className="text-light-text" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                tab === t.key ? "bg-primary/10 text-primary" : "text-light-text hover:bg-feed-bg hover:text-text"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview tab */}
        {tab === "overview" && (
          <div className="p-6">
            {/* Stats grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Connection Status", value: "Active", sub: `Last synced: ${timeAgo(store.lastSync)}`, icon: IoCheckmarkCircle, color: "text-green-500", action: "Sync Now" },
                { label: "Products Available", value: store.productCount.toLocaleString(), sub: "Distributed in feed", icon: IoLayersOutline, color: "text-primary", action: null },
                { label: "Platform", value: PLATFORM_LABELS[store.platform], sub: store.storeUrl.replace(/^https?:\/\//, ""), icon: IoGlobeOutline, color: "text-blue-500", action: null },
                { label: "Checkout", value: store.checkoutConfig.bothEnabled ? "Both" : "Twedot Only", sub: `Sync: ${store.checkoutConfig.syncFrequency}`, icon: IoCartOutline, color: "text-purple-500", action: "Edit" },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-border p-5">
                  <div className="flex items-start justify-between">
                    <stat.icon size={22} className={stat.color} />
                    {stat.action && (
                      <button className="rounded-lg border border-primary px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5">
                        {stat.action}
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-[13px] text-light-text">{stat.label}</p>
                  <p className="mt-1 text-[20px] font-bold text-text">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] text-light-text">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Configuration summary */}
            <div className="rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-text">Configuration</h3>
                <button className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-feed-bg">
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-light-text">Checkout Options</span>
                  <span className="text-[13px] font-medium text-text">
                    {store.checkoutConfig.bothEnabled ? "Both Twedot & External" : "Twedot Only"}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-light-text">Sync Frequency</span>
                  <span className="text-[13px] font-medium text-text">{store.checkoutConfig.syncFrequency}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-light-text">Connected Since</span>
                  <span className="text-[13px] font-medium text-text">{new Date(store.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Disconnect */}
            <div className="mt-6 flex justify-center">
              <button className="flex items-center gap-2 rounded-xl border border-red-200 px-6 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50">
                <IoTrashOutline size={16} /> Disconnect Store
              </button>
            </div>
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="mx-auto max-w-2xl p-6">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-4 text-[16px] font-bold text-text">Checkout Preferences</h3>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary bg-primary/5 p-4">
                    <input type="radio" name="checkout" defaultChecked={store.checkoutConfig.bothEnabled}
                      className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                    <div>
                      <p className="text-[14px] font-semibold text-text">Both Twedot & External Checkout</p>
                      <p className="mt-0.5 text-[12px] text-light-text">Let buyers choose between Twedot checkout or your website checkout.</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:border-primary/30">
                    <input type="radio" name="checkout" defaultChecked={store.checkoutConfig.twedotOnly}
                      className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                    <div>
                      <p className="text-[14px] font-semibold text-text">Twedot Checkout Only</p>
                      <p className="mt-0.5 text-[12px] text-light-text">Buyers will use Twedot's secure checkout.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-[16px] font-bold text-text">Sync Settings</h3>
                <div className="relative">
                  <IoSyncOutline size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
                  <select defaultValue={store.checkoutConfig.syncFrequency}
                    className="w-full appearance-none rounded-xl border border-border bg-feed-bg py-3.5 pl-10 pr-4 text-[14px] text-text outline-none focus:border-primary">
                    <option>Every 5 minutes</option>
                    <option>Every 15 minutes</option>
                    <option>Every 30 minutes</option>
                    <option>Every hour</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-[16px] font-bold text-text">Connection Details</h3>
                <div className="rounded-xl border border-border">
                  {[
                    { label: "Platform", value: PLATFORM_LABELS[store.platform] },
                    { label: "Store URL", value: store.storeUrl },
                    { label: "API Status", value: "Healthy", color: "text-green-600" },
                    { label: "Connected Since", value: new Date(store.connectedAt).toLocaleDateString() },
                    { label: "Last Sync", value: new Date(store.lastSync).toLocaleString() },
                  ].map((r, i) => (
                    <div key={r.label} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}>
                      <span className="text-[13px] text-light-text">{r.label}</span>
                      <span className={`text-[13px] font-medium ${(r as any).color || "text-text"}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-[13px] font-semibold text-text transition-colors hover:bg-feed-bg">
                  <IoRefreshOutline size={16} /> Sync Products Now
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50">
                  <IoTrashOutline size={16} /> Disconnect Store
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products tab */}
        {tab === "products" && (
          <div className="p-6">
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <IoCartOutline size={40} className="text-light-text" />
                <p className="text-[15px] font-semibold text-text">No products found</p>
                <p className="text-[13px] text-light-text">This store has no synced products yet.</p>
                <button className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white">
                  <IoRefreshOutline size={14} /> Sync Now
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-bold text-text">{products.length} Products</p>
                    <p className="text-[12px] text-light-text">From {store.storeName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                      <button onClick={() => setViewMode("grid")}
                        className={`rounded-md p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-light-text hover:text-text"}`}>
                        <IoGridOutline size={15} />
                      </button>
                      <button onClick={() => setViewMode("list")}
                        className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-light-text hover:text-text"}`}>
                        <IoListOutline size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map(p => (
                      <div key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
                        <div className="relative aspect-square overflow-hidden bg-feed-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          {!p.available && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                              <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white">Sold Out</span>
                            </div>
                          )}
                          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            {p.category}
                          </span>
                        </div>
                        <div className="p-3.5">
                          <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                          <p className="mt-1 text-[15px] font-bold text-primary">{formatPrice(p.price, p.currency)}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`text-[11px] font-medium ${p.available ? "text-green-600" : "text-red-500"}`}>
                              {p.available ? `${p.quantity} in stock` : "Out of stock"}
                            </span>
                            {p.variants.length > 0 && (
                              <span className="text-[11px] text-light-text">{p.variants.length} variant{p.variants.length > 1 ? "s" : ""}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border">
                    {products.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-feed-bg/50 ${i > 0 ? "border-t border-border" : ""}`}>
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-feed-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-text">{p.name}</p>
                          <p className="text-[11px] text-light-text">{p.category}</p>
                        </div>
                        <span className="text-[14px] font-bold text-primary">{formatPrice(p.price, p.currency)}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          p.available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                        }`}>
                          {p.available ? "In Stock" : "Sold Out"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Activity tab */}
        {tab === "activity" && (
          <div className="mx-auto max-w-2xl p-6">
            <h3 className="mb-4 text-[15px] font-bold text-text">Recent Activity</h3>
            <div className="space-y-0">
              {[
                { icon: IoSyncOutline, text: "Products synced successfully", sub: `${store.productCount} products updated`, time: timeAgo(store.lastSync), color: "text-green-500 bg-green-50" },
                { icon: IoCheckmarkCircle, text: "API health check passed", sub: "All endpoints responding", time: "1h ago", color: "text-blue-500 bg-blue-50" },
                { icon: IoLayersOutline, text: "12 new products added", sub: "From latest sync", time: "3h ago", color: "text-primary bg-primary/10" },
                { icon: IoCartOutline, text: "Checkout configured", sub: "Both Twedot & External enabled", time: "2d ago", color: "text-purple-500 bg-purple-50" },
                { icon: IoLinkOutline, text: "Store connected", sub: store.storeUrl, time: timeAgo(store.connectedAt), color: "text-green-500 bg-green-50" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 py-4 border-b border-border last:border-b-0">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-text">{item.text}</p>
                    <p className="text-[12px] text-light-text">{item.sub}</p>
                  </div>
                  <span className="text-[11px] text-light-text whitespace-nowrap">{item.time}</span>
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
  const [stores, setStores] = useState<ConnectedStore[]>(MOCK_STORES);
  const [selectedStore, setSelectedStore] = useState<ConnectedStore | null>(null);
  const [showModal, setShowModal] = useState(false);

  function handleConnect(url: string, platform: string) {
    const newStore: ConnectedStore = {
      id: `store_${Date.now()}`,
      storeName: url.replace(/^https?:\/\//, "").replace(/\/$/, "").split(".")[0],
      storeUrl: url.startsWith("http") ? url : `https://${url}`,
      platform: platform as ConnectedStore["platform"],
      status: "active",
      productCount: 0,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
      checkoutConfig: { bothEnabled: true, twedotOnly: false, syncFrequency: "Every 15 minutes" },
    };
    setStores(prev => [newStore, ...prev]);
  }

  if (selectedStore) {
    return <StoreDetail store={selectedStore} onBack={() => setSelectedStore(null)} />;
  }

  return (
    <div className="min-h-screen bg-feed-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/stories" className="flex items-center gap-2 text-[13px] font-medium text-light-text hover:text-text transition-colors">
            <IoArrowBack size={18} />
            <span className="hidden sm:inline">Back to Twedot</span>
          </Link>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <IoStorefrontOutline size={16} className="text-white" />
            </div>
            <span className="text-[16px] font-bold text-text">Twedot Connect</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-feed-bg">
            <IoNotificationsOutline size={20} className="text-light-text" />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <IoPersonCircleOutline size={22} className="text-primary" />
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#4A1D96] via-[#6B4EFF] to-[#8B6FFF]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-10 lg:py-14">
          <div className="max-w-lg">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
                <IoStorefrontOutline size={13} className="text-white" />
              </div>
              <span className="text-[12px] font-semibold text-white/80">Twedot Connect</span>
            </div>
            <h1 className="text-[28px] font-bold leading-tight text-white lg:text-[34px]">
              Connect Your Store<br />to Twedot
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70 lg:text-[15px]">
              Showcase your products, reach more people, and grow your business on the open network.
            </p>
            <button onClick={() => setShowModal(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-semibold text-[#6B4EFF] shadow-lg transition-all hover:shadow-xl hover:bg-white/95">
              <IoLinkOutline size={16} />
              Connect a Store
              <IoArrowForward size={14} />
            </button>
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <IoStorefrontOutline size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Your Store</p>
                  <p className="text-[11px] text-white/60">Connected</p>
                </div>
                <IoCheckmarkCircle size={18} className="ml-4 text-green-400" />
              </div>
              <div className="flex gap-2">
                <div className="h-16 w-16 rounded-xl bg-white/10" />
                <div className="h-16 w-16 rounded-xl bg-white/10" />
                <div className="h-16 w-16 rounded-xl bg-white/10" />
              </div>
              <p className="mt-2 text-[11px] text-white/50">Products now in your feed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Connected stores section */}
        {stores.length > 0 && (
          <div className="mb-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-text">Your Connected Stores</h2>
                <p className="mt-0.5 text-[13px] text-light-text">Manage your linked websites and stores</p>
              </div>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-primary/90">
                Connect a Store <IoAddOutline size={16} />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map(store => (
                <div key={store.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
                  {/* Store image */}
                  <div className="relative h-40 overflow-hidden bg-feed-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={store.image} alt={store.storeName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${
                        store.status === "active" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${store.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
                        {store.status === "active" ? "Active" : "Error"}
                      </span>
                    </div>
                    <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50">
                      <IoEllipsisVertical size={16} />
                    </button>
                  </div>

                  {/* Store info */}
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <IoStorefrontOutline size={20} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-text">{store.storeName}</p>
                        <p className="truncate text-[12px] text-light-text">{store.storeUrl}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-[12px] text-light-text">
                      <span className="flex items-center gap-1.5">
                        <IoLayersOutline size={13} /> {store.productCount.toLocaleString()} products
                      </span>
                      <span className="flex items-center gap-1.5">
                        <IoTimeOutline size={13} /> Synced {timeAgo(store.lastSync)}
                      </span>
                    </div>
                    <button onClick={() => setSelectedStore(store)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-[13px] font-semibold text-text transition-colors hover:bg-feed-bg">
                      <IoOpenOutline size={14} /> View Store <IoChevronForward size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add another store card */}
              <button onClick={() => setShowModal(true)}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-background/50 py-12 text-center transition-all hover:border-primary/40 hover:bg-primary/5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <IoAddOutline size={28} className="text-primary" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-text">Connect Another Store</p>
                  <p className="mt-1 text-[12px] text-light-text">Link another website or platform<br />to expand your reach.</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2 text-[12px] font-semibold text-primary">
                  Connect a Store <IoArrowForward size={12} />
                </span>
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mb-10">
          <h2 className="mb-6 text-[20px] font-bold text-text">How It Works</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { step: 1, icon: IoLinkOutline, title: "Connect", desc: "Link your website securely", color: "bg-blue-50 text-blue-500" },
              { step: 2, icon: IoSyncOutline, title: "Sync", desc: "We'll fetch your products", color: "bg-purple-50 text-purple-500" },
              { step: 3, icon: IoTrendingUpOutline, title: "Discover", desc: "Your products appear in the Twedot feed", color: "bg-green-50 text-green-500" },
              { step: 4, icon: IoCartOutline, title: "Sell", desc: "Chat, sell and grow", color: "bg-orange-50 text-orange-500" },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center rounded-2xl border border-border bg-background p-6 text-center">
                <span className="absolute -top-2.5 left-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{item.step}</span>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <p className="mt-3 text-[14px] font-bold text-text">{item.title}</p>
                <p className="mt-1 text-[12px] text-light-text">{item.desc}</p>
                {i < 3 && (
                  <IoChevronForward size={16} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-light-text lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Supported platforms */}
        <div className="mb-10">
          <h2 className="mb-6 text-[20px] font-bold text-text">Supported Platforms</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { logo: "custom", label: "Custom Website", desc: "Connect any website with our API", available: true },
              { logo: "shopify", label: "Shopify", desc: "Direct integration with Shopify", available: true },
              { logo: "woo", label: "WooCommerce", desc: "WordPress WooCommerce plugin", available: true },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center">
                  {p.logo === "shopify" && <ShopifyLogo className="h-10 w-10" />}
                  {p.logo === "woo" && <WooCommerceLogo className="h-10 w-10 rounded-xl" />}
                  {p.logo === "custom" && <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><IoCodeSlashOutline size={22} className="text-primary" /></div>}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-text">{p.label}</p>
                  <p className="text-[12px] text-light-text">{p.desc}</p>
                </div>
                {p.available && <IoCheckmarkCircle size={20} className="text-green-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4A1D96] to-[#8B6FFF] p-8 lg:p-10">
          <div className="flex items-center justify-between">
            <div className="max-w-md">
              <h3 className="text-[22px] font-bold text-white">Turn Your Business Into a Community</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                With Twedot Connect, your store gets discovered by people nearby. Chat, sell and grow your business.
              </p>
              <button onClick={() => setShowModal(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-semibold text-[#6B4EFF] transition-all hover:bg-white/90">
                Get Started <IoArrowForward size={14} />
              </button>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <IoStorefrontOutline size={36} className="text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <ConnectModal onClose={() => setShowModal(false)} onConnect={handleConnect} />}
    </div>
  );
}
