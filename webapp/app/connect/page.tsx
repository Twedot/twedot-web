"use client";

import { useState, useCallback } from "react";
import {
  IoArrowBack,
  IoAddOutline,
  IoStorefrontOutline,
  IoGlobeOutline,
  IoCheckmarkCircle,
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
  IoCodeSlashOutline,
} from "react-icons/io5";

// ─── Accent color (teal, not purple) ─────────────────────────────────────────
const ACCENT = "#0D9488";
const ACCENT_LIGHT = "#0D948815";
const ACCENT_HOVER = "#0F766E";

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
    name: "Creator's Fashion Store",
    url: "https://creatorsstore.com",
    platform: "custom",
    status: "active",
    lastSynced: "2m ago",
    productCount: 120,
    checkoutOption: "both",
    syncFrequency: "15",
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
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function platformLabel(p: Platform) {
  if (p === "custom") return "Custom Website";
  if (p === "shopify") return "Shopify";
  return "WooCommerce";
}

function platformIcon(p: Platform) {
  if (p === "custom") return IoCodeSlashOutline;
  if (p === "shopify") return IoCartOutline;
  return IoGlobeOutline;
}

function statusBadge(s: ConnectionStatus) {
  const map: Record<ConnectionStatus, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-emerald-500/15", text: "text-emerald-500", label: "Active" },
    pending: { bg: "bg-amber-500/15", text: "text-amber-500", label: "Pending" },
    expired: { bg: "bg-red-500/15", text: "text-red-500", label: "Expired" },
    error: { bg: "bg-red-500/15", text: "text-red-500", label: "Error" },
  };
  return map[s];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0 py-5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className={`mx-1.5 h-px w-8 sm:w-12 ${done ? "bg-emerald-500" : "bg-border"}`} />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "text-white"
                    : "bg-feed-bg text-light-text"
                }`}
                style={active ? { backgroundColor: ACCENT } : undefined}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-text" : "text-light-text"
                }`}
              >
                {label}
              </span>
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

// ─── Main component ──────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [view, setView] = useState<View>({ screen: "overview" });
  const [stores, setStores] = useState<ConnectedStore[]>(MOCK_STORES);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Connect-a-store form state
  const [storeUrl, setStoreUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [checkoutOption, setCheckoutOption] = useState<CheckoutOption>("both");
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>("15");
  const [connecting, setConnecting] = useState(false);

  // Lifted state for sub-screens (can't use useState inside render functions)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "settings" | "products" | "activity">("overview");

  const resetForm = useCallback(() => {
    setStoreUrl("");
    setStoreName("");
    setCheckoutOption("both");
    setSyncFrequency("15");
    setConnecting(false);
    setSelectedPlatform(null);
    setDetailTab("overview");
  }, []);

  function handleConnect() {
    if (view.screen !== "configure") return;
    setConnecting(true);
    // Simulate connection
    setTimeout(() => {
      const newStore: ConnectedStore = {
        id: String(Date.now()),
        name: storeName || view.name || new URL(view.url).hostname,
        url: view.url,
        platform: view.platform,
        status: "active",
        lastSynced: "just now",
        productCount: 0,
        checkoutOption,
        syncFrequency,
      };
      setStores((prev) => [...prev, newStore]);
      setView({ screen: "store-detail", store: newStore });
      resetForm();
    }, 1500);
  }

  function handleDisconnect(storeId: string) {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    setView({ screen: "overview" });
  }

  function handleSync(storeId: string) {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, lastSynced: "just now" } : s))
    );
  }

  // ─── Overview ──────────────────────────────────────────────────────────────

  function renderOverview() {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h1 className="text-[18px] font-bold text-text">Connected Stores</h1>
            <p className="mt-0.5 text-[12px] text-light-text">
              Link your existing store or website to Twedot and showcase your products to more people.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setView({ screen: "choose-platform" }); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
          >
            <IoAddOutline size={16} />
            Connect a Store
          </button>
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto p-5">
          {stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-feed-bg">
                <IoStorefrontOutline size={36} className="text-light-text" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-text">No stores connected</p>
                <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-light-text">
                  Connect your website or online store to start showcasing your products on Twedot.
                </p>
              </div>
              <button
                onClick={() => { resetForm(); setView({ screen: "choose-platform" }); }}
                className="mt-2 flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-colors"
                style={{ backgroundColor: ACCENT }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
              >
                <IoAddOutline size={16} />
                Connect a Store
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stores.map((store) => {
                const badge = statusBadge(store.status);
                const PlatformIcon = platformIcon(store.platform);
                return (
                  <div
                    key={store.id}
                    className="group relative flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-feed-bg/50 cursor-pointer"
                    onClick={() => setView({ screen: "store-detail", store })}
                  >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: ACCENT_LIGHT }}
                    >
                      <PlatformIcon size={22} style={{ color: ACCENT }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-text">{store.name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-light-text">
                        {store.url}
                      </p>
                      <p className="mt-0.5 text-[11px] text-light-text">
                        Last synced: {store.lastSynced} · {store.productCount} products
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === store.id ? null : store.id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-light-text transition-colors hover:bg-feed-bg hover:text-text"
                      >
                        <IoEllipsisVertical size={18} />
                      </button>
                      {menuOpenId === store.id && (
                        <DropdownMenu
                          onClose={() => setMenuOpenId(null)}
                          items={[
                            { icon: IoSettingsOutline, label: "Settings", onClick: () => setView({ screen: "store-detail", store }) },
                            { icon: IoSyncOutline, label: "Sync Now", onClick: () => handleSync(store.id) },
                            { icon: IoTrashOutline, label: "Disconnect", danger: true, onClick: () => handleDisconnect(store.id) },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Choose Platform ───────────────────────────────────────────────────────

  function renderChoosePlatform() {
    const selected = selectedPlatform;
    const setSelected = setSelectedPlatform;

    const platforms: { id: Platform; label: string; description: string; icon: React.ElementType; available: boolean }[] = [
      { id: "custom", label: "Custom Website", description: "Connect your custom-built store or business website", icon: IoCodeSlashOutline, available: true },
      { id: "shopify", label: "Shopify", description: "Connect your Shopify store", icon: IoCartOutline, available: false },
      { id: "woocommerce", label: "WooCommerce", description: "Connect your WooCommerce store", icon: IoGlobeOutline, available: false },
    ];

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "overview" })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-light-text transition-colors hover:bg-feed-bg hover:text-text"
          >
            <IoArrowBack size={18} />
          </button>
          <h1 className="text-[17px] font-bold text-text">Connect a Store</h1>
        </div>

        <StepIndicator current={0} steps={["Choose Platform", "Enter Details", "Authorize", "Confirm"]} />

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <p className="mb-5 text-center text-[13px] text-light-text">
            Select the type of store you want to connect
          </p>

          <div className="mx-auto grid max-w-lg gap-3">
            {platforms.map((p) => {
              const Icon = p.icon;
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  disabled={!p.available}
                  onClick={() => setSelected(p.id)}
                  className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-current bg-feed-bg"
                      : p.available
                      ? "border-border hover:border-light-text hover:bg-feed-bg/50"
                      : "border-border opacity-50 cursor-not-allowed"
                  }`}
                  style={isSelected ? { borderColor: ACCENT } : undefined}
                >
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isSelected ? ACCENT_LIGHT : undefined }}
                  >
                    <Icon size={24} style={isSelected ? { color: ACCENT } : undefined} className={isSelected ? "" : "text-light-text"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text">{p.label}</p>
                    <p className="mt-0.5 text-[12px] text-light-text">{p.description}</p>
                  </div>
                  {isSelected && (
                    <IoCheckmarkCircle size={22} style={{ color: ACCENT }} className="flex-shrink-0" />
                  )}
                  {!p.available && (
                    <span className="rounded-full bg-feed-bg px-2 py-0.5 text-[10px] font-semibold text-light-text">
                      Coming Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "overview" })}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-light-text hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!selected}
            onClick={() => { if (selected) setView({ screen: "enter-details", platform: selected }); }}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => { if (selected) e.currentTarget.style.backgroundColor = ACCENT_HOVER; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
          >
            Continue
            <IoChevronForward size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Enter Details ─────────────────────────────────────────────────────────

  function renderEnterDetails() {
    if (view.screen !== "enter-details") return null;

    const isValid = storeUrl.trim().length > 0 && /^https?:\/\/.+\..+/.test(storeUrl.trim());

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "choose-platform" })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-light-text transition-colors hover:bg-feed-bg hover:text-text"
          >
            <IoArrowBack size={18} />
          </button>
          <h1 className="text-[17px] font-bold text-text">Connect a Store</h1>
        </div>

        <StepIndicator current={1} steps={["Choose Platform", "Enter Details", "Authorize", "Confirm"]} />

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="mx-auto max-w-lg">
            {/* Illustration area */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-feed-bg">
                <IoStorefrontOutline size={36} className="text-light-text" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-text">Enter Your Store URL</p>
                <p className="mt-1 text-[12px] text-light-text">
                  Provide the URL of your store or website to connect it with Twedot.
                </p>
              </div>
            </div>

            {/* URL input */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">
                  Store URL
                </label>
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://creatorsstore.com"
                  className="w-full rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder-light-text outline-none transition-colors focus:border-current focus:ring-1 focus:ring-current/20"
                  style={{ ["--tw-ring-color" as string]: ACCENT + "33" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">
                  Store Name <span className="font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Awesome Store"
                  className="w-full rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder-light-text outline-none transition-colors focus:border-current focus:ring-1 focus:ring-current/20"
                />
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 rounded-lg bg-feed-bg px-3 py-2.5">
                <IoInformationCircleOutline size={16} className="mt-0.5 flex-shrink-0 text-light-text" />
                <p className="text-[11px] leading-relaxed text-light-text">
                  Make sure your website supports Twedot integration (for best results, use a secure HTTPS URL).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "choose-platform" })}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-light-text hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!isValid}
            onClick={() =>
              setView({
                screen: "configure",
                platform: view.platform,
                url: storeUrl.trim(),
                name: storeName.trim() || new URL(storeUrl.trim()).hostname,
              })
            }
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => { if (isValid) e.currentTarget.style.backgroundColor = ACCENT_HOVER; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
          >
            Continue
            <IoChevronForward size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Store Configuration ───────────────────────────────────────────────────

  function renderConfigure() {
    if (view.screen !== "configure") return null;

    const checkoutOptions: { value: CheckoutOption; label: string; description: string }[] = [
      { value: "both", label: "Both Twedot & External Checkout", description: "Let buyers choose between Twedot checkout or your website checkout." },
      { value: "twedot", label: "Twedot Checkout Only", description: "Buyers will use Twedot's secure checkout." },
      { value: "external", label: "External Checkout Only", description: "Buyers will be redirected to your website to complete the purchase." },
    ];

    const syncOptions: { value: SyncFrequency; label: string }[] = [
      { value: "5", label: "Every 5 minutes" },
      { value: "15", label: "Every 15 minutes" },
      { value: "30", label: "Every 30 minutes" },
      { value: "60", label: "Every hour" },
    ];

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "enter-details", platform: view.platform })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-light-text transition-colors hover:bg-feed-bg hover:text-text"
          >
            <IoArrowBack size={18} />
          </button>
          <h1 className="text-[17px] font-bold text-text">Store Configuration</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto max-w-lg">
            {/* Store summary card */}
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-feed-bg/50 p-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: ACCENT_LIGHT }}
              >
                <IoStorefrontOutline size={20} style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-text">{view.name}</p>
                <p className="truncate text-[12px] text-light-text">{view.url}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                Connected
              </span>
            </div>

            {/* Checkout Preferences */}
            <div className="mb-6">
              <p className="mb-1 text-[13px] font-bold text-text">Checkout Preferences</p>
              <p className="mb-3 text-[11px] text-light-text">
                Choose how buyers can purchase products from this store.
              </p>
              <div className="flex flex-col gap-2">
                {checkoutOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCheckoutOption(opt.value)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                      checkoutOption === opt.value ? "bg-feed-bg/50" : "border-border hover:border-light-text"
                    }`}
                    style={checkoutOption === opt.value ? { borderColor: ACCENT } : undefined}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        checkoutOption === opt.value ? "border-current" : "border-light-text"
                      }`}
                      style={checkoutOption === opt.value ? { borderColor: ACCENT } : undefined}
                    >
                      {checkoutOption === opt.value && (
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-text">{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-light-text">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sync Settings */}
            <div>
              <p className="mb-1 text-[13px] font-bold text-text">Sync Settings</p>
              <p className="mb-3 text-[11px] text-light-text">Control how often we fetch your products.</p>
              <div className="relative">
                <IoTimeOutline size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
                <select
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value as SyncFrequency)}
                  className="w-full appearance-none rounded-lg border border-border bg-feed-bg py-2.5 pl-8 pr-8 text-[13px] text-text outline-none"
                >
                  {syncOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <IoChevronForward size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-light-text" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "enter-details", platform: view.platform })}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-light-text hover:text-text transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => { if (!connecting) e.currentTarget.style.backgroundColor = ACCENT_HOVER; }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
          >
            {connecting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connecting…
              </>
            ) : (
              "Connect Store"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Store Detail / Management ─────────────────────────────────────────────

  function renderStoreDetail() {
    if (view.screen !== "store-detail") return null;
    const { store } = view;
    const badge = statusBadge(store.status);
    const activeTab = detailTab;
    const setActiveTab = setDetailTab;

    const tabs = ["overview", "settings", "products", "activity"] as const;

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <button
            onClick={() => setView({ screen: "overview" })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-light-text transition-colors hover:bg-feed-bg hover:text-text"
          >
            <IoArrowBack size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[16px] font-bold text-text">{store.name}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
            <p className="truncate text-[12px] text-light-text">{store.url}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpenId(menuOpenId === store.id ? null : store.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-light-text transition-colors hover:bg-feed-bg hover:text-text"
            >
              <IoEllipsisVertical size={18} />
            </button>
            {menuOpenId === store.id && (
              <DropdownMenu
                onClose={() => setMenuOpenId(null)}
                items={[
                  { icon: IoSyncOutline, label: "Sync Now", onClick: () => handleSync(store.id) },
                  { icon: IoTrashOutline, label: "Disconnect", danger: true, onClick: () => handleDisconnect(store.id) },
                ]}
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`relative px-4 py-3 text-[13px] font-semibold capitalize transition-colors ${
                activeTab === t ? "text-text" : "text-light-text hover:text-text"
              }`}
            >
              {t}
              {activeTab === t && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "overview" && (
            <div className="mx-auto max-w-lg">
              {/* Stats cards */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Connection Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[14px] font-bold text-text">Active</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-light-text">
                    <IoSyncOutline size={11} /> Last synced: {store.lastSynced}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Products Available</p>
                  <p className="mt-2 text-[22px] font-bold text-text">{store.productCount}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-light-text">
                    <IoStatsChartOutline size={11} /> Distributed in feed
                  </p>
                </div>
              </div>

              {/* Sync Now button */}
              <button
                onClick={() => handleSync(store.id)}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-[13px] font-semibold transition-colors"
                style={{ borderColor: ACCENT, color: ACCENT }}
              >
                <IoRefreshOutline size={15} />
                Sync Now
              </button>

              {/* Configuration summary */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-text">Configuration</p>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="text-[12px] font-medium transition-colors hover:underline"
                    style={{ color: ACCENT }}
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-light-text">Checkout Options</span>
                    <span className="text-[12px] font-medium text-text">
                      {store.checkoutOption === "both" ? "Both Twedot & External" : store.checkoutOption === "twedot" ? "Twedot Only" : "External Only"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-light-text">Sync Frequency</span>
                    <span className="text-[12px] font-medium text-text">Every {store.syncFrequency} minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-light-text">Platform</span>
                    <span className="text-[12px] font-medium text-text">{platformLabel(store.platform)}</span>
                  </div>
                </div>
              </div>

              {/* Disconnect */}
              <button
                onClick={() => handleDisconnect(store.id)}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-500/5"
              >
                <IoTrashOutline size={15} />
                Disconnect Store
              </button>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="mx-auto max-w-lg">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">
                Checkout Preferences
              </p>
              {(["both", "twedot", "external"] as CheckoutOption[]).map((opt) => {
                const labels: Record<CheckoutOption, string> = {
                  both: "Both Twedot & External Checkout",
                  twedot: "Twedot Checkout Only",
                  external: "External Checkout Only",
                };
                return (
                  <button
                    key={opt}
                    className={`mb-2 flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                      store.checkoutOption === opt ? "bg-feed-bg/50" : "border-border"
                    }`}
                    style={store.checkoutOption === opt ? { borderColor: ACCENT } : undefined}
                  >
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2`}
                      style={store.checkoutOption === opt ? { borderColor: ACCENT } : { borderColor: "var(--light-text)" }}
                    >
                      {store.checkoutOption === opt && (
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-text">{labels[opt]}</span>
                  </button>
                );
              })}

              <p className="mb-3 mt-6 text-[11px] font-bold uppercase tracking-widest text-light-text">
                Sync Frequency
              </p>
              <div className="relative">
                <select
                  defaultValue={store.syncFrequency}
                  className="w-full appearance-none rounded-lg border border-border bg-feed-bg py-2.5 pl-3 pr-8 text-[13px] text-text outline-none"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                </select>
                <IoChevronForward size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-light-text" />
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
                <IoCartOutline size={28} className="text-light-text" />
              </div>
              <p className="text-[15px] font-bold text-text">Products are fetched live</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-light-text">
                Twedot retrieves your products directly from your store in real time. They appear in the feed automatically.
              </p>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
                <IoStatsChartOutline size={28} className="text-light-text" />
              </div>
              <p className="text-[15px] font-bold text-text">Activity Log</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-light-text">
                Connection events, sync history, and error logs will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

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
