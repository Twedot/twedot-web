"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoStorefrontOutline,
  IoAddOutline,
  IoGlobeOutline,
  IoChevronForward,
  IoChevronBack,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoEllipseOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoLinkOutline,
  IoCartOutline,
  IoShieldCheckmarkOutline,
  IoAlertCircleOutline,
  IoSettingsOutline,
  IoSearchOutline,
  IoCopyOutline,
  IoCheckmark,
  IoWalletOutline,
  IoOpenOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

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
    externalCheckoutUrl?: string;
    defaultCheckout: "twedot" | "external";
  } | null;
  product_count?: number;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

type View = "list" | "detail" | "connect" | "settings";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:       { label: "Connected",    color: "text-green-500",  bg: "bg-green-500/10" },
  pending:      { label: "Pending",      color: "text-yellow-500", bg: "bg-yellow-500/10" },
  error:        { label: "Error",        color: "text-red-500",    bg: "bg-red-500/10" },
  expired:      { label: "Expired",      color: "text-orange-500", bg: "bg-orange-500/10" },
  disconnected: { label: "Disconnected", color: "text-light-text", bg: "bg-feed-bg" },
};

const PLATFORM_OPTIONS = [
  { value: "custom_api", label: "Custom Website", description: "Connect your own website or e-commerce platform via API", icon: IoGlobeOutline },
  { value: "shopify",    label: "Shopify",        description: "Connect your Shopify store (coming soon)",               icon: IoCartOutline, disabled: true },
  { value: "woocommerce", label: "WooCommerce",   description: "Connect your WooCommerce store (coming soon)",           icon: IoCartOutline, disabled: true },
];

const inputCls =
  "w-full rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder-light-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.disconnected;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.color} ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-green-500" : status === "pending" ? "bg-yellow-500" : status === "error" ? "bg-red-500" : status === "expired" ? "bg-orange-500" : "bg-light-text"}`} />
      {s.label}
    </span>
  );
}

// ─── Store Card ──────────────────────────────────────────────────────────────

function StoreCard({ store, active, onClick }: { store: ConnectedStore; active: boolean; onClick: () => void }) {
  const domain = (() => {
    try { return new URL(store.store_url).hostname; } catch { return store.store_url; }
  })();

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all ${
        active ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/40 hover:bg-feed-bg/50"
      }`}
    >
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
        active ? "bg-primary/10" : "bg-feed-bg"
      }`}>
        <IoStorefrontOutline size={20} className={active ? "text-primary" : "text-light-text"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-text">
          {store.store_name || domain}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-light-text">{domain}</p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <StatusBadge status={store.connection_status} />
        {store.product_count != null && store.product_count > 0 && (
          <span className="text-[10px] text-light-text">{store.product_count} products</span>
        )}
      </div>
    </button>
  );
}

// ─── Connect Store Form ──────────────────────────────────────────────────────

function ConnectStoreForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: (store: ConnectedStore) => void;
}) {
  const { notify } = useUi();
  const [step, setStep] = useState<"platform" | "details" | "verify">("platform");
  const [platform, setPlatform] = useState<string>("");
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string; productCount?: number } | null>(null);

  function selectPlatform(value: string) {
    setPlatform(value);
    setStep("details");
  }

  async function handleConnect() {
    if (!storeUrl.trim() || connecting) return;
    setConnecting(true);
    try {
      const res = await apiPost<{ store: ConnectedStore }>("/integrations/connect", {
        platform,
        store_name: storeName.trim() || undefined,
        store_url: storeUrl.trim(),
        credentials: {
          api_key: apiKey.trim() || undefined,
          api_secret: apiSecret.trim() || undefined,
        },
      });
      if (res?.store) {
        setStep("verify");
        setVerifying(true);
        try {
          const verify = await apiPost<{ success: boolean; message: string; product_count?: number }>(
            `/integrations/${res.store.id}/verify`, {}
          );
          setVerifyResult({
            success: verify?.success ?? false,
            message: verify?.message ?? "Verification complete",
            productCount: verify?.product_count,
          });
          onSuccess({ ...res.store, connection_status: verify?.success ? "active" : "error", product_count: verify?.product_count });
        } catch {
          setVerifyResult({ success: false, message: "Could not verify the connection. You can retry from store settings." });
          onSuccess(res.store);
        } finally {
          setVerifying(false);
        }
      }
    } catch (err: any) {
      notify(err?.message ?? "Failed to connect store");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          {step !== "platform" && step !== "verify" && (
            <button
              onClick={() => step === "details" ? setStep("platform") : undefined}
              className="flex h-7 w-7 items-center justify-center rounded-full text-light-text hover:bg-feed-bg hover:text-text"
            >
              <IoChevronBack size={16} />
            </button>
          )}
          <h2 className="text-[15px] font-bold text-text">Connect a Store</h2>
        </div>
        {step !== "verify" && (
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-light-text hover:bg-feed-bg hover:text-text"
          >
            <IoCloseOutline size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Select Platform */}
        {step === "platform" && (
          <div className="px-5 py-5">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-light-text">Platform</p>
            <p className="mb-5 text-[13px] leading-[20px] text-light-text">
              Choose the type of store you want to connect to Twedot.
            </p>
            <div className="flex flex-col gap-3">
              {PLATFORM_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !opt.disabled && selectPlatform(opt.value)}
                    disabled={opt.disabled}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${
                      opt.disabled
                        ? "border-border opacity-50 cursor-not-allowed"
                        : platform === opt.value
                          ? "border-primary bg-primary/[0.04]"
                          : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-feed-bg">
                      <Icon size={20} className="text-light-text" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-text">{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-light-text">{opt.description}</p>
                    </div>
                    {!opt.disabled && <IoChevronForward size={14} className="flex-shrink-0 text-light-text" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === "details" && (
          <div className="px-5 py-5">
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-primary/[0.07] p-3">
              <IoInformationCircleOutline size={16} className="mt-0.5 flex-shrink-0 text-primary" />
              <p className="text-[11px] leading-[17px] text-text/80">
                Your external website needs to implement the Twedot integration contract.
                Products will be fetched directly from your platform — Twedot does not store your catalogue.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">
                  Store Name
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. My Online Shop"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">
                  Website URL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <IoGlobeOutline size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
                  <input
                    type="url"
                    className={`${inputCls} pl-8`}
                    placeholder="https://mystore.com"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-light-text">
                  The base URL of your store. Twedot will call /api/twedot/v1/* endpoints on this domain.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">
                  API Key
                </label>
                <input
                  className={inputCls}
                  placeholder="Your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">
                  API Secret
                </label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Your API secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onCancel}
                  className="rounded-full border border-border px-4 py-2 text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!storeUrl.trim() || connecting}
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {connecting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <IoLinkOutline size={15} />
                      Connect Store
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === "verify" && (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            {verifying ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                </div>
                <p className="text-[16px] font-bold text-text">Verifying connection…</p>
                <p className="max-w-xs text-[13px] leading-[20px] text-light-text">
                  Twedot is testing the connection to your store and retrieving product information.
                </p>
              </>
            ) : verifyResult?.success ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                  <IoCheckmarkCircle size={32} className="text-green-500" />
                </div>
                <p className="text-[16px] font-bold text-text">Store connected!</p>
                <p className="max-w-xs text-[13px] leading-[20px] text-light-text">
                  {verifyResult.message}
                  {verifyResult.productCount != null && (
                    <> Found <span className="font-semibold text-text">{verifyResult.productCount}</span> products.</>
                  )}
                </p>
                <button
                  onClick={onCancel}
                  className="mt-2 rounded-full bg-primary px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                  <IoAlertCircleOutline size={32} className="text-red-500" />
                </div>
                <p className="text-[16px] font-bold text-text">Verification failed</p>
                <p className="max-w-xs text-[13px] leading-[20px] text-light-text">
                  {verifyResult?.message ?? "Could not verify the connection."}
                </p>
                <button
                  onClick={onCancel}
                  className="mt-2 rounded-full border border-border px-5 py-2 text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Store Detail ────────────────────────────────────────────────────────────

function StoreDetail({
  store,
  onBack,
  onDisconnect,
  onReconnect,
  onUpdateCheckout,
}: {
  store: ConnectedStore;
  onBack: () => void;
  onDisconnect: (id: string) => void;
  onReconnect: (id: string) => void;
  onUpdateCheckout: (id: string, config: ConnectedStore["checkout_configuration"]) => void;
}) {
  const { notify } = useUi();
  const [copied, setCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const checkout = store.checkout_configuration ?? {
    twedotEnabled: true,
    externalEnabled: false,
    defaultCheckout: "twedot" as const,
  };

  const domain = (() => {
    try { return new URL(store.store_url).hostname; } catch { return store.store_url; }
  })();

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(store.store_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await apiDelete(`/integrations/${store.id}`);
      onDisconnect(store.id);
      notify("Store disconnected");
    } catch (err: any) {
      notify(err?.message ?? "Failed to disconnect store");
    } finally {
      setDisconnecting(false);
      setShowDisconnectConfirm(false);
    }
  }

  async function handleReconnect() {
    setReconnecting(true);
    try {
      await apiPost(`/integrations/${store.id}/reconnect`, {});
      onReconnect(store.id);
      notify("Reconnection initiated");
    } catch (err: any) {
      notify(err?.message ?? "Failed to reconnect");
    } finally {
      setReconnecting(false);
    }
  }

  async function toggleCheckoutOption(key: "twedotEnabled" | "externalEnabled") {
    const updated = { ...checkout, [key]: !checkout[key] };
    if (!updated.twedotEnabled && !updated.externalEnabled) {
      notify("At least one checkout method must be enabled");
      return;
    }
    if (!updated.twedotEnabled) updated.defaultCheckout = "external";
    if (!updated.externalEnabled) updated.defaultCheckout = "twedot";
    try {
      await apiPatch(`/integrations/${store.id}`, { checkout_configuration: updated });
      onUpdateCheckout(store.id, updated);
    } catch (err: any) {
      notify(err?.message ?? "Failed to update checkout settings");
    }
  }

  async function setDefaultCheckout(method: "twedot" | "external") {
    const updated = { ...checkout, defaultCheckout: method };
    try {
      await apiPatch(`/integrations/${store.id}`, { checkout_configuration: updated });
      onUpdateCheckout(store.id, updated);
    } catch (err: any) {
      notify(err?.message ?? "Failed to update checkout settings");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-medium text-light-text hover:text-text"
        >
          <IoChevronBack size={16} />
          <span>Stores</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Store overview */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-feed-bg">
              <IoStorefrontOutline size={26} className="text-light-text" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-bold text-text">{store.store_name || domain}</h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={store.connection_status} />
                <span className="text-[11px] text-light-text">·</span>
                <span className="text-[11px] text-light-text capitalize">{store.platform.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* URL + Copy */}
        <div className="border-b border-border px-5 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-light-text">Store URL</p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-feed-bg px-3 py-2.5">
            <IoGlobeOutline size={14} className="flex-shrink-0 text-light-text" />
            <span className="min-w-0 flex-1 truncate text-[12px] text-text">{store.store_url}</span>
            <button onClick={copyUrl} className="flex-shrink-0 text-[12px] font-semibold text-primary hover:underline">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-4">
          <div className="rounded-xl bg-feed-bg px-4 py-3">
            <p className="text-[11px] text-light-text">Products</p>
            <p className="mt-1 text-[20px] font-bold text-text">{store.product_count ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-feed-bg px-4 py-3">
            <p className="text-[11px] text-light-text">Last Synced</p>
            <p className="mt-1 text-[13px] font-semibold text-text">
              {store.last_synced_at
                ? new Date(store.last_synced_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Never"
              }
            </p>
          </div>
        </div>

        {/* Checkout Configuration */}
        <div className="border-b border-border px-5 py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Checkout</p>

          {/* Twedot checkout toggle */}
          <div className="flex items-center justify-between rounded-xl bg-feed-bg px-4 py-3">
            <div className="flex items-center gap-3">
              <IoWalletOutline size={18} className="text-primary" />
              <div>
                <p className="text-[12px] font-semibold text-text">Twedot Checkout</p>
                <p className="mt-0.5 text-[10px] text-light-text">Pay through Twedot escrow</p>
              </div>
            </div>
            <button
              onClick={() => toggleCheckoutOption("twedotEnabled")}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checkout.twedotEnabled ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checkout.twedotEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* External checkout toggle */}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-feed-bg px-4 py-3">
            <div className="flex items-center gap-3">
              <IoOpenOutline size={18} className="text-light-text" />
              <div>
                <p className="text-[12px] font-semibold text-text">External Checkout</p>
                <p className="mt-0.5 text-[10px] text-light-text">Redirect to store's checkout</p>
              </div>
            </div>
            <button
              onClick={() => toggleCheckoutOption("externalEnabled")}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checkout.externalEnabled ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checkout.externalEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Default checkout */}
          {checkout.twedotEnabled && checkout.externalEnabled && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-semibold text-light-text">Default method</p>
              <div className="flex gap-2">
                {(["twedot", "external"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setDefaultCheckout(method)}
                    className={`flex-1 rounded-lg py-2 text-center text-[12px] font-semibold transition-colors ${
                      checkout.defaultCheckout === method
                        ? "bg-primary text-white"
                        : "border border-border text-light-text hover:border-primary hover:text-primary"
                    }`}
                  >
                    {method === "twedot" ? "Twedot" : "External"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connection info */}
        <div className="border-b border-border px-5 py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Connection</p>
          <div className="space-y-2">
            {[
              { label: "Connected",    value: new Date(store.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
              { label: "Platform",     value: store.platform.replace("_", " ") },
              { label: "External ID",  value: store.external_store_id ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 py-1.5">
                <span className="min-w-[100px] text-[11px] text-light-text">{label}</span>
                <span className="flex-1 text-[12px] font-medium text-text capitalize break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 pb-8">
          <div className="flex flex-col gap-2">
            {(store.connection_status === "expired" || store.connection_status === "error") && (
              <button
                onClick={handleReconnect}
                disabled={reconnecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 text-[12px] font-semibold text-primary hover:bg-primary/[0.04] disabled:opacity-50 transition-colors"
              >
                <IoRefreshOutline size={15} />
                {reconnecting ? "Reconnecting…" : "Reconnect"}
              </button>
            )}

            {!showDisconnectConfirm ? (
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-[12px] font-semibold text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30 transition-colors"
              >
                <IoTrashOutline size={15} />
                Disconnect Store
              </button>
            ) : (
              <div className="rounded-xl border border-red-200 p-4 dark:border-red-900">
                <p className="text-[13px] font-bold text-text">Disconnect this store?</p>
                <p className="mt-1 text-[12px] text-light-text">
                  Products from this store will immediately stop appearing in the Twedot feed.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex-1 rounded-lg bg-red-500 py-2 text-[12px] font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {disconnecting ? "Disconnecting…" : "Yes, Disconnect"}
                  </button>
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="flex-1 rounded-lg border border-border py-2 text-[12px] font-semibold text-text hover:bg-feed-bg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [activeStore, setActiveStore] = useState<ConnectedStore | null>(null);
  const [query, setQuery] = useState("");

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

  function openDetail(store: ConnectedStore) {
    setActiveStore(store);
    setView("detail");
  }

  function handleDisconnect(storeId: string) {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    setView("list");
    setActiveStore(null);
  }

  function handleReconnect(storeId: string) {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, connection_status: "pending" as const } : s))
    );
    if (activeStore?.id === storeId) {
      setActiveStore((prev) => prev ? { ...prev, connection_status: "pending" } : prev);
    }
  }

  function handleUpdateCheckout(storeId: string, config: ConnectedStore["checkout_configuration"]) {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, checkout_configuration: config } : s))
    );
    if (activeStore?.id === storeId) {
      setActiveStore((prev) => prev ? { ...prev, checkout_configuration: config } : prev);
    }
  }

  function handleConnectSuccess(store: ConnectedStore) {
    setStores((prev) => {
      const existing = prev.findIndex((s) => s.id === store.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = store;
        return updated;
      }
      return [store, ...prev];
    });
  }

  const filteredStores = query.trim()
    ? stores.filter((s) => {
        const q = query.toLowerCase();
        return (
          (s.store_name?.toLowerCase().includes(q)) ||
          s.store_url.toLowerCase().includes(q) ||
          s.platform.toLowerCase().includes(q)
        );
      })
    : stores;

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden pl-3 md:pl-4">
      {/* ── Left panel: store list ── */}
      <div className="flex w-full flex-col border-r border-border bg-background md:w-[330px] md:flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Connected Stores</h1>
          <button
            onClick={() => { setView("connect"); setActiveStore(null); }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <IoAddOutline size={15} />
            Connect
          </button>
        </div>

        {/* Search */}
        {stores.length > 0 && (
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-full bg-feed-bg px-3.5 py-2">
              <IoSearchOutline size={15} className="flex-shrink-0 text-light-text" />
              <input
                type="text"
                placeholder="Search stores"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-light-text"
              />
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="mx-4 mt-2 mb-1 flex items-start gap-2 rounded-xl bg-primary/[0.07] p-3">
          <IoStorefrontOutline size={16} className="mt-0.5 flex-shrink-0 text-primary" />
          <p className="text-[11px] leading-[17px] text-text/80">
            Connect your external stores and their products will appear in the Twedot feed for discovery.
          </p>
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {loading ? (
            <div className="flex flex-col gap-3 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 rounded-xl border border-border p-4">
                  <div className="h-11 w-11 animate-pulse rounded-xl bg-feed-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-feed-bg" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-feed-bg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStores.length === 0 && stores.length > 0 ? (
            <p className="py-8 text-center text-[13px] text-light-text">
              No stores matching &quot;{query}&quot;
            </p>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
                <IoStorefrontOutline size={28} className="text-light-text" />
              </div>
              <p className="text-[14px] font-semibold text-text">No connected stores</p>
              <p className="max-w-[200px] text-[12px] leading-5 text-light-text">
                Connect your website or online store to start showing products on Twedot.
              </p>
              <button
                onClick={() => setView("connect")}
                className="mt-1 rounded-full bg-primary px-5 py-2 text-[12px] font-semibold text-white hover:bg-primary/90"
              >
                Connect a Store
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pt-1">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  active={activeStore?.id === store.id && view === "detail"}
                  onClick={() => openDetail(store)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="hidden flex-1 flex-col overflow-hidden bg-background md:flex">
        {view === "detail" && activeStore && (
          <StoreDetail
            store={activeStore}
            onBack={() => { setView("list"); setActiveStore(null); }}
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
            onUpdateCheckout={handleUpdateCheckout}
          />
        )}

        {view === "connect" && (
          <ConnectStoreForm
            onCancel={() => setView("list")}
            onSuccess={handleConnectSuccess}
          />
        )}

        {view === "list" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
              <IoStorefrontOutline size={28} className="text-light-text" />
            </div>
            <p className="text-[14px] font-semibold text-text">Twedot Connect</p>
            <p className="max-w-xs text-[12px] leading-5 text-light-text">
              Connect your external stores and let Twedot discover your products.
              Select a store to view details, or connect a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
