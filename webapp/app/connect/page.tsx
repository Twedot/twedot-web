"use client";

import { useState, useCallback } from "react";
import {
  IoArrowBack,
  IoAddOutline,
  IoEllipsisVertical,
  IoChevronForward,
  IoSyncOutline,
  IoTrashOutline,
  IoSettingsOutline,
  IoTimeOutline,
  IoCartOutline,
  IoStatsChartOutline,
  IoRefreshOutline,
  IoInformationCircleOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";

// ─── Accent (teal, not purple) ───────────────────────────────────────────────
const A = "#0D9488";
const A_HOVER = "#0F766E";
const A_LIGHT = "rgba(13,148,136,0.1)";

// ─── Brand SVGs ──────────────────────────────────────────────────────────────

function IconCustomWebsite({ size = 48, selected = false }: { size?: number; selected?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill={selected ? A_LIGHT : "#f0fdf4"} />
      <text x="24" y="30" textAnchor="middle" fontFamily="monospace" fontWeight="bold" fontSize="18" fill={selected ? A : "#16a34a"}>{"</>"}</text>
    </svg>
  );
}

function IconShopify({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#f0fdf4" />
      <g transform="translate(10,8) scale(0.6)">
        <path d="M41.3 9.84c-.05-.32-.3-.5-.53-.52-.23-.02-4.76-.09-4.76-.09s-3.78-3.67-4.15-4.04c-.37-.37-1.1-.26-1.38-.18-.04.01-.74.23-1.9.58-.32-.92-.88-2.1-1.86-3.3C25.1.3 23 0 21.37 0c-.07 0-.14 0-.21.01-.3-.38-.67-.56-1-.56h-.05c-2.3.05-4.5 1.72-6.2 4.72-1.2 2.1-2.1 4.74-2.36 6.79-2.42.75-4.11 1.27-4.14 1.28-1.21.38-1.25.42-1.41 1.56C5.87 14.89 0 59.84 0 59.84l41.09 7.09L48 59.75s-6.65-49.5-6.7-49.9zM26.5 7.46l-3.07.95c0-1.6-.22-3.86-1-5.73 2.47.47 3.68 3.27 4.07 4.78zM21.1 8.86l-6.6 2.05c.64-2.44 1.84-4.87 3.32-6.46.55-.59 1.33-1.25 2.23-1.62.87 1.82 1.07 4.4 1.05 6.03zM16.22.84c.73 0 1.33.15 1.83.46-2.76 1.3-5.72 4.58-6.96 11.14l-5.22 1.62C7.03 8.42 11.26.96 16.22.84z" fill="#95BF47"/>
        <path d="M40.77 9.32c-.23-.02-4.76-.09-4.76-.09s-3.78-3.67-4.15-4.04c-.14-.14-.33-.2-.53-.22L28.49 67l19.51-4.17S41.35 9.64 40.77 9.32z" fill="#5E8E3E"/>
        <path d="M21.35 19.08l-2.26 6.74s-1.98-.93-4.37-.77c-3.49.24-3.52 2.42-3.49 2.97.19 3.08 8.3 3.75 8.76 10.97.36 5.68-3.01 9.56-7.87 9.86-5.83.37-9.04-3.07-9.04-3.07l1.24-5.25s3.23 2.44 5.82 2.28c1.69-.1 2.3-1.49 2.24-2.46-.25-4.03-6.86-3.79-7.28-10.4-.35-5.56 3.3-11.19 11.35-11.7 3.1-.19 4.9.57 4.9.57z" fill="#fff"/>
      </g>
    </svg>
  );
}

function IconWooCommerce({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#f3e8ff" />
      <g transform="translate(6,10)">
        <path d="M3.3 0h29.4A3.3 3.3 0 0136 3.3v16.86a3.3 3.3 0 01-3.3 3.3H21.42l3.18 4.54-8.1-4.54H3.3A3.3 3.3 0 010 20.16V3.3A3.3 3.3 0 013.3 0z" fill="#7B5EA7"/>
        <text x="18" y="16" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">Woo</text>
      </g>
    </svg>
  );
}

// ─── Store avatar ────────────────────────────────────────────────────────────

function StoreAvatar({ name, color }: { name: string; color: string }) {
  const bg = color === "green" ? "#dcfce7" : color === "red" ? "#fee2e2" : color === "blue" ? "#dbeafe" : "#f3f4f6";
  const fg = color === "green" ? "#16a34a" : color === "red" ? "#dc2626" : color === "blue" ? "#2563eb" : "#6b7280";
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
      <IoCartOutline size={22} style={{ color: fg }} />
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = "custom" | "shopify" | "woocommerce";
type ConnectionStatus = "active" | "expired" | "pending" | "error";
type CheckoutOption = "both" | "twedot" | "external";
type SyncFrequency = "5" | "15" | "30" | "60";

interface ConnectedStore {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  status: ConnectionStatus;
  lastSynced: string;
  productCount: number;
  checkoutOption: CheckoutOption;
  syncFrequency: SyncFrequency;
  avatarColor: string;
}

type View =
  | { screen: "overview" }
  | { screen: "choose-platform" }
  | { screen: "enter-details"; platform: Platform }
  | { screen: "configure"; platform: Platform; url: string; name: string }
  | { screen: "store-detail"; store: ConnectedStore };

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_STORES: ConnectedStore[] = [
  {
    id: "1",
    name: "Creator’s Fashion Store",
    url: "https://creatorsstore.com",
    platform: "custom",
    status: "active",
    lastSynced: "2m ago",
    productCount: 120,
    checkoutOption: "both",
    syncFrequency: "15",
    avatarColor: "green",
  },
  {
    id: "2",
    name: "BizMart Online",
    url: "https://bizmart.com",
    platform: "custom",
    status: "active",
    lastSynced: "5m ago",
    productCount: 85,
    checkoutOption: "twedot",
    syncFrequency: "30",
    avatarColor: "red",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(s: ConnectionStatus) {
  const map: Record<ConnectionStatus, { cls: string; label: string }> = {
    active:  { cls: "bg-emerald-500/15 text-emerald-500", label: "Active" },
    pending: { cls: "bg-amber-500/15 text-amber-500", label: "Pending" },
    expired: { cls: "bg-red-500/15 text-red-500", label: "Expired" },
    error:   { cls: "bg-red-500/15 text-red-500", label: "Error" },
  };
  return map[s];
}

// ─── Shared pieces ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["Choose Platform", "Enter Details", "Authorize", "Confirm"];
  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && <div className={`mx-2 h-px w-10 sm:w-14 ${done ? "bg-emerald-500" : "bg-border"}`} />}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${
                  done ? "bg-emerald-500 text-white" : active ? "text-white" : "bg-feed-bg text-light-text"
                }`}
                style={active ? { backgroundColor: A } : undefined}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-text" : "text-light-text"}`}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DropdownMenu({
  items,
  onClose,
}: {
  items: { icon: React.ElementType; label: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-border bg-background shadow-xl">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => { item.onClick(); onClose(); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-feed-bg ${
                item.danger ? "text-red-500" : "text-text"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost" | "danger-outline";
  className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all disabled:opacity-40 cursor-pointer";
  if (variant === "primary")
    return (
      <button onClick={onClick} disabled={disabled}
        className={`${base} text-white ${className}`}
        style={{ backgroundColor: A }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = A_HOVER; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = A; }}
      >{children}</button>
    );
  if (variant === "outline")
    return (
      <button onClick={onClick} disabled={disabled}
        className={`${base} border-2 bg-transparent ${className}`}
        style={{ borderColor: A, color: A }}
      >{children}</button>
    );
  if (variant === "danger-outline")
    return (
      <button onClick={onClick} disabled={disabled}
        className={`${base} border border-red-500/30 text-red-500 hover:bg-red-500/5 ${className}`}
      >{children}</button>
    );
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} text-light-text hover:text-text ${className}`}
    >{children}</button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function ConnectPage() {
  const [view, setView] = useState<View>({ screen: "overview" });
  const [stores, setStores] = useState<ConnectedStore[]>(MOCK_STORES);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // form
  const [storeUrl, setStoreUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [checkoutOption, setCheckoutOption] = useState<CheckoutOption>("both");
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>("15");
  const [connecting, setConnecting] = useState(false);

  // lifted sub-screen state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "settings" | "products" | "activity">("overview");

  const resetForm = useCallback(() => {
    setStoreUrl(""); setStoreName(""); setCheckoutOption("both"); setSyncFrequency("15");
    setConnecting(false); setSelectedPlatform(null); setDetailTab("overview");
  }, []);

  function handleConnect() {
    if (view.screen !== "configure") return;
    setConnecting(true);
    setTimeout(() => {
      const newStore: ConnectedStore = {
        id: String(Date.now()),
        name: storeName || view.name,
        url: view.url,
        platform: view.platform,
        status: "active",
        lastSynced: "just now",
        productCount: 0,
        checkoutOption,
        syncFrequency,
        avatarColor: "blue",
      };
      setStores(prev => [...prev, newStore]);
      setView({ screen: "store-detail", store: newStore });
      resetForm();
    }, 1500);
  }

  function handleDisconnect(id: string) { setStores(prev => prev.filter(s => s.id !== id)); setView({ screen: "overview" }); }
  function handleSync(id: string) { setStores(prev => prev.map(s => s.id === id ? { ...s, lastSynced: "just now" } : s)); }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  function renderOverview() {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-text">Connected Stores</h1>
            <p className="mt-0.5 text-[13px] text-light-text">Link your existing store or website to Twedot and showcase your products to more people.</p>
          </div>
          <Btn onClick={() => { resetForm(); setView({ screen: "choose-platform" }); }} className="mt-3 sm:mt-0">
            <IoAddOutline size={16} /> Connect a Store
          </Btn>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stores.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-feed-bg">
                <IoCartOutline size={44} className="text-light-text" />
              </div>
              <p className="text-[17px] font-bold text-text">No stores connected</p>
              <p className="max-w-md text-[13px] leading-relaxed text-light-text">
                Connect your website or online store to start showcasing your products on Twedot.
              </p>
              <Btn onClick={() => { resetForm(); setView({ screen: "choose-platform" }); }}>
                <IoAddOutline size={16} /> Connect a Store
              </Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stores.map(store => {
                const badge = statusBadge(store.status);
                return (
                  <button
                    key={store.id}
                    onClick={() => { setDetailTab("overview"); setView({ screen: "store-detail", store }); }}
                    className="group flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-feed-bg/60"
                  >
                    <StoreAvatar name={store.name} color={store.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="truncate text-[14px] font-semibold text-text">{store.name}</span>
                        <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-light-text">{store.url}</p>
                      <p className="mt-0.5 text-[11px] text-light-text">Last synced: {store.lastSynced} &middot; {store.productCount} products</p>
                    </div>
                    <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === store.id ? null : store.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-light-text hover:bg-feed-bg hover:text-text"
                      >
                        <IoEllipsisVertical size={18} />
                      </button>
                      {menuOpenId === store.id && (
                        <DropdownMenu
                          onClose={() => setMenuOpenId(null)}
                          items={[
                            { icon: IoSettingsOutline, label: "Settings", onClick: () => { setDetailTab("settings"); setView({ screen: "store-detail", store }); } },
                            { icon: IoSyncOutline, label: "Sync Now", onClick: () => handleSync(store.id) },
                            { icon: IoTrashOutline, label: "Disconnect", danger: true, onClick: () => handleDisconnect(store.id) },
                          ]}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CHOOSE PLATFORM
  // ═══════════════════════════════════════════════════════════════════════════

  function renderChoosePlatform() {
    const platforms: { id: Platform; label: string; desc: string; available: boolean; render: (sel: boolean) => React.ReactNode }[] = [
      {
        id: "custom", label: "Custom Website", desc: "Connect your custom-built store or business website", available: true,
        render: (sel) => <IconCustomWebsite size={56} selected={sel} />,
      },
      {
        id: "shopify", label: "Shopify", desc: "Connect your Shopify store", available: false,
        render: () => <IconShopify size={56} />,
      },
      {
        id: "woocommerce", label: "WooCommerce", desc: "Connect your WooCommerce store", available: false,
        render: () => <IconWooCommerce size={56} />,
      },
    ];

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button onClick={() => setView({ screen: "overview" })} className="flex h-9 w-9 items-center justify-center rounded-lg text-light-text hover:bg-feed-bg hover:text-text">
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-[18px] font-bold text-text">Connect a Store</h1>
        </div>

        <StepIndicator current={0} />

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <p className="mb-6 text-center text-[14px] text-light-text">Select the type of store you want to connect</p>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            {platforms.map(p => {
              const sel = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  disabled={!p.available}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 px-4 py-6 text-center transition-all ${
                    sel ? "shadow-sm" : p.available ? "border-border hover:border-light-text" : "border-border opacity-50 cursor-not-allowed"
                  }`}
                  style={sel ? { borderColor: A, backgroundColor: A_LIGHT } : undefined}
                >
                  {sel && (
                    <IoCheckmarkCircle size={22} style={{ color: A }} className="absolute right-3 top-3" />
                  )}
                  {!p.available && (
                    <span className="absolute right-3 top-3 rounded-full bg-feed-bg px-2 py-0.5 text-[9px] font-bold text-light-text uppercase">Soon</span>
                  )}
                  {p.render(sel)}
                  <div>
                    <p className="text-[14px] font-bold text-text">{p.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-light-text">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Btn variant="ghost" onClick={() => setView({ screen: "overview" })}>Cancel</Btn>
          <Btn disabled={!selectedPlatform} onClick={() => { if (selectedPlatform) setView({ screen: "enter-details", platform: selectedPlatform }); }}>
            Continue <IoChevronForward size={14} />
          </Btn>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ENTER DETAILS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderEnterDetails() {
    if (view.screen !== "enter-details") return null;
    const isValid = /^https?:\/\/.+\..+/.test(storeUrl.trim());

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button onClick={() => setView({ screen: "choose-platform" })} className="flex h-9 w-9 items-center justify-center rounded-lg text-light-text hover:bg-feed-bg hover:text-text">
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-[18px] font-bold text-text">Connect a Store</h1>
        </div>

        <StepIndicator current={1} />

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="mx-auto max-w-md">
            {/* Illustration */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-feed-bg">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <rect x="4" y="18" width="44" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" className="text-light-text" fill="none"/>
                  <path d="M4 24h44" stroke="currentColor" strokeWidth="2" className="text-light-text"/>
                  <rect x="14" y="30" width="10" height="10" rx="2" fill={A} opacity=".25"/>
                  <rect x="28" y="30" width="10" height="10" rx="2" fill={A} opacity=".15"/>
                  <path d="M12 10h28M18 4h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-light-text"/>
                </svg>
              </div>
              <p className="text-[16px] font-bold text-text">Enter Your Store URL</p>
              <p className="text-[12px] text-light-text">Provide the URL of your store or website to connect it with Twedot.</p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Store URL</label>
                <input
                  type="url" value={storeUrl} onChange={e => setStoreUrl(e.target.value)}
                  placeholder="https://creatorsstore.com"
                  className="w-full rounded-xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text placeholder-light-text outline-none transition-colors focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Store Name <span className="font-normal">(optional)</span></label>
                <input
                  type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
                  placeholder="My Awesome Store"
                  className="w-full rounded-xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text placeholder-light-text outline-none transition-colors focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-feed-bg px-4 py-3">
                <IoInformationCircleOutline size={18} className="mt-0.5 shrink-0 text-light-text" />
                <p className="text-[12px] leading-relaxed text-light-text">
                  Make sure your website supports Twedot integration (for best results, use a secure HTTPS URL).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Btn variant="ghost" onClick={() => setView({ screen: "choose-platform" })}>Cancel</Btn>
          <Btn
            disabled={!isValid}
            onClick={() => {
              let name = storeName.trim();
              try { if (!name) name = new URL(storeUrl.trim()).hostname; } catch { name = storeUrl.trim(); }
              setView({ screen: "configure", platform: view.platform, url: storeUrl.trim(), name });
            }}
          >
            Continue <IoChevronForward size={14} />
          </Btn>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. STORE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  function renderConfigure() {
    if (view.screen !== "configure") return null;

    const checkoutOpts: { value: CheckoutOption; label: string; desc: string }[] = [
      { value: "both", label: "Both Twedot & External Checkout", desc: "Let buyers choose between Twedot checkout or your website checkout." },
      { value: "twedot", label: "Twedot Checkout Only", desc: "Buyers will use Twedot’s secure checkout." },
      { value: "external", label: "External Checkout Only", desc: "Redirect buyers to your website to complete the purchase." },
    ];

    const syncOpts: { value: SyncFrequency; label: string }[] = [
      { value: "5", label: "Every 5 minutes" },
      { value: "15", label: "Every 15 minutes" },
      { value: "30", label: "Every 30 minutes" },
      { value: "60", label: "Every hour" },
    ];

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button onClick={() => setView({ screen: "enter-details", platform: view.platform })} className="flex h-9 w-9 items-center justify-center rounded-lg text-light-text hover:bg-feed-bg hover:text-text">
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-[18px] font-bold text-text">Store Configuration</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-lg">
            {/* Store card */}
            <div className="mb-7 flex items-center gap-3 rounded-xl border border-border bg-feed-bg/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: A_LIGHT }}>
                <IoCartOutline size={20} style={{ color: A }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-text">{view.name}</p>
                <p className="truncate text-[12px] text-light-text">{view.url}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">Connected</span>
            </div>

            {/* Checkout */}
            <p className="mb-1 text-[14px] font-bold text-text">Checkout Preferences</p>
            <p className="mb-4 text-[12px] text-light-text">Choose how buyers can purchase products from this store.</p>
            <div className="mb-7 flex flex-col gap-2.5">
              {checkoutOpts.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCheckoutOption(opt.value)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    checkoutOption === opt.value ? "bg-feed-bg/50" : "border-border hover:border-light-text"
                  }`}
                  style={checkoutOption === opt.value ? { borderColor: A } : undefined}
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                    style={{ borderColor: checkoutOption === opt.value ? A : "var(--light-text)" }}
                  >
                    {checkoutOption === opt.value && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: A }} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-text">{opt.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-light-text">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Sync */}
            <p className="mb-1 text-[14px] font-bold text-text">Sync Settings</p>
            <p className="mb-3 text-[12px] text-light-text">Control how often we fetch your products.</p>
            <div className="relative">
              <IoTimeOutline size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-light-text" />
              <select value={syncFrequency} onChange={e => setSyncFrequency(e.target.value as SyncFrequency)}
                className="w-full appearance-none rounded-xl border border-border bg-feed-bg py-3 pl-9 pr-9 text-[13px] text-text outline-none"
              >
                {syncOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <IoChevronForward size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-light-text" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Btn variant="ghost" onClick={() => setView({ screen: "enter-details", platform: view.platform })}>Back</Btn>
          <Btn onClick={handleConnect} disabled={connecting}>
            {connecting ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Connecting&hellip;</> : "Connect Store"}
          </Btn>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. STORE DETAIL & MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  function renderStoreDetail() {
    if (view.screen !== "store-detail") return null;
    const { store } = view;
    const badge = statusBadge(store.status);
    const tabs = ["overview", "settings", "products", "activity"] as const;

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <button onClick={() => setView({ screen: "overview" })} className="flex h-9 w-9 items-center justify-center rounded-lg text-light-text hover:bg-feed-bg hover:text-text">
            <IoArrowBack size={20} />
          </button>
          <StoreAvatar name={store.name} color={store.avatarColor} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="truncate text-[16px] font-bold text-text">{store.name}</span>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
            </div>
            <p className="truncate text-[12px] text-light-text">{store.url}</p>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpenId(menuOpenId === store.id ? null : store.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-light-text hover:bg-feed-bg hover:text-text"
            >
              <IoEllipsisVertical size={18} />
            </button>
            {menuOpenId === store.id && (
              <DropdownMenu onClose={() => setMenuOpenId(null)} items={[
                { icon: IoSyncOutline, label: "Sync Now", onClick: () => handleSync(store.id) },
                { icon: IoTrashOutline, label: "Disconnect", danger: true, onClick: () => handleDisconnect(store.id) },
              ]} />
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border px-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setDetailTab(t)}
              className={`relative px-4 py-3.5 text-[13px] font-semibold capitalize transition-colors ${detailTab === t ? "text-text" : "text-light-text hover:text-text"}`}
            >
              {t}
              {detailTab === t && <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: A }} />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {detailTab === "overview" && (
            <div className="mx-auto max-w-lg">
              {/* Stat cards */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-light-text">Connection Status</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-[15px] font-bold text-text">Active</span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-light-text">
                    <IoSyncOutline size={12} className="text-emerald-500" /> Last synced: {store.lastSynced}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-light-text">Products Available</p>
                  <p className="mt-3 text-[26px] font-bold text-text">{store.productCount}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-light-text">
                    <IoStatsChartOutline size={12} /> Distributed in feed
                  </p>
                </div>
              </div>

              {/* Sync Now */}
              <Btn variant="outline" onClick={() => handleSync(store.id)} className="mb-7 w-full">
                <IoRefreshOutline size={15} /> Sync Now
              </Btn>

              {/* Config summary */}
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-text">Configuration</p>
                  <button onClick={() => setDetailTab("settings")} className="text-[12px] font-semibold hover:underline" style={{ color: A }}>Edit</button>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    ["Checkout Options", store.checkoutOption === "both" ? "Both Twedot & External" : store.checkoutOption === "twedot" ? "Twedot Only" : "External Only"],
                    ["Sync Frequency", `Every ${store.syncFrequency} minutes`],
                    ["Platform", store.platform === "custom" ? "Custom Website" : store.platform === "shopify" ? "Shopify" : "WooCommerce"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between border-b border-border pb-2.5 last:border-0 last:pb-0">
                      <span className="text-[12px] text-light-text">{k}</span>
                      <span className="text-[12px] font-semibold text-text">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disconnect */}
              <Btn variant="danger-outline" onClick={() => handleDisconnect(store.id)} className="mt-10 w-full">
                <IoTrashOutline size={15} /> Disconnect Store
              </Btn>
            </div>
          )}

          {detailTab === "settings" && (
            <div className="mx-auto max-w-lg">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Checkout Preferences</p>
              {(["both", "twedot", "external"] as CheckoutOption[]).map(opt => {
                const labels: Record<CheckoutOption, string> = { both: "Both Twedot & External Checkout", twedot: "Twedot Checkout Only", external: "External Checkout Only" };
                const active = store.checkoutOption === opt;
                return (
                  <button key={opt} className={`mb-2.5 flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${active ? "bg-feed-bg/50" : "border-border"}`}
                    style={active ? { borderColor: A } : undefined}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ borderColor: active ? A : "var(--light-text)" }}
                    >
                      {active && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: A }} />}
                    </div>
                    <span className="text-[13px] font-semibold text-text">{labels[opt]}</span>
                  </button>
                );
              })}

              <p className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-widest text-light-text">Sync Frequency</p>
              <div className="relative">
                <select defaultValue={store.syncFrequency} className="w-full appearance-none rounded-xl border border-border bg-feed-bg py-3 pl-4 pr-9 text-[13px] text-text outline-none">
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                </select>
                <IoChevronForward size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-light-text" />
              </div>
            </div>
          )}

          {detailTab === "products" && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-feed-bg">
                <IoCartOutline size={32} className="text-light-text" />
              </div>
              <p className="text-[16px] font-bold text-text">Products are fetched live</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-light-text">
                Twedot retrieves your products directly from your store in real time. They appear in the feed automatically.
              </p>
            </div>
          )}

          {detailTab === "activity" && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-feed-bg">
                <IoStatsChartOutline size={32} className="text-light-text" />
              </div>
              <p className="text-[16px] font-bold text-text">Activity Log</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-light-text">
                Connection events, sync history, and error logs will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {view.screen === "overview" && renderOverview()}
      {view.screen === "choose-platform" && renderChoosePlatform()}
      {view.screen === "enter-details" && renderEnterDetails()}
      {view.screen === "configure" && renderConfigure()}
      {view.screen === "store-detail" && renderStoreDetail()}
    </div>
  );
}
