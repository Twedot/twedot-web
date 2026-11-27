"use client";

import { useState } from "react";
import {
  IoStorefrontOutline,
  IoAddOutline,
  IoChevronForward,
  IoArrowBack,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoCartOutline,
  IoTimeOutline,
  IoLinkOutline,
  IoCodeSlashOutline,
  IoSyncOutline,
  IoCheckmark,
  IoArrowForward,
  IoSettingsOutline,
  IoEllipsisVertical,
  IoInformationCircleOutline,
  IoSearchOutline,
  IoTrashOutline,
  IoCubeOutline,
  IoEyeOutline,
  IoBagHandleOutline,
  IoNotificationsOutline,
  IoCardOutline,
  IoColorPaletteOutline,
  IoShieldCheckmarkOutline,
  IoOptionsOutline,
  IoFlashOutline,
  IoGridOutline,
} from "react-icons/io5";

// ─── Design tokens ──────────────────────────────────────────────────────────

const P = {
  primary: "#6B4EFF",
  primaryLight: "#EDE9FF",
  primaryDark: "#5438DB",
  bg: "#FFFFFF",
  bg2: "#F8F7FC",
  fg: "#1A1A2E",
  fg2: "#555",
  muted: "#999",
  green: "#22C55E",
  greenSoft: "#ECFDF5",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  orange: "#F59E0B",
  blue: "#3B82F6",
  border: "#E5E5EE",
  radius: 12,
};

// ─── Types & Mock Data ──────────────────────────────────────────────────────

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

const STORES: Store[] = [
  {
    id: "s1", name: "Creator's Fashion Store", url: "https://creatorsfashion.com",
    platform: "custom_api", status: "active", products: 120, views: 24500, orders: 342,
    connectedAt: "2026-11-20T10:30:00Z", lastSync: "2026-11-26T08:22:00Z",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
    checkout: { mode: "both", syncFreq: "Every 15 minutes" },
  },
  {
    id: "s2", name: "BizMart Online", url: "https://bizmart.com",
    platform: "shopify", status: "active", products: 85, views: 18200, orders: 198,
    connectedAt: "2026-11-18T08:15:00Z", lastSync: "2026-11-26T07:50:00Z",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop",
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

const PLAT_META: Record<string, { label: string }> = {
  custom_api: { label: "Custom API" },
  shopify: { label: "Shopify" },
  woocommerce: { label: "WooCommerce" },
};

const fmt = (n: number) => `₦${n.toLocaleString()}`;

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

const ACTIVITY = [
  { id: "a1", action: "Product synced", detail: "Classic Leather Handbag updated", store: "Creator's Fashion Store", time: "2m ago" },
  { id: "a2", action: "New order", detail: "Order #1024 — ₦85,000", store: "Creator's Fashion Store", time: "15m ago" },
  { id: "a3", action: "Store connected", detail: "BizMart Online linked via Shopify", store: "BizMart Online", time: "1h ago" },
  { id: "a4", action: "Sync completed", detail: "85 products synced", store: "BizMart Online", time: "3h ago" },
];

// ─── Settings Sidebar Items (from wireframe screen 1) ──────────────────────

const SETTINGS_ITEMS = [
  { id: "account", label: "Account Settings", icon: <IoSettingsOutline size={16} /> },
  { id: "privacy", label: "Privacy & Security", icon: <IoShieldCheckmarkOutline size={16} /> },
  { id: "stores", label: "Connected Stores", icon: <IoStorefrontOutline size={16} /> },
  { id: "notifs", label: "Notifications", icon: <IoNotificationsOutline size={16} /> },
  { id: "payment", label: "Payment Methods", icon: <IoCardOutline size={16} /> },
  { id: "appearance", label: "Appearance", icon: <IoColorPaletteOutline size={16} /> },
  { id: "other", label: "Other Preferences", icon: <IoOptionsOutline size={16} /> },
];

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 2-4: Connect Wizard (Choose Platform → Enter Details → Config)
// ═══════════════════════════════════════════════════════════════════════════

function ConnectWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0); // 0=choose platform, 1=enter details, 2=configuration, 3=done
  const [plat, setPlat] = useState("");
  const [url, setUrl] = useState("");
  const [co, setCo] = useState<"both" | "twedot">("both");
  const [sync, setSync] = useState("15");
  const [busy, setBusy] = useState(false);

  const stepLabels = ["Choose Platform", "Enter Details", "Authorize", "Confirm"];

  function next() {
    if (step === 2) {
      setBusy(true);
      setTimeout(() => { setBusy(false); setStep(3); }, 1500);
      return;
    }
    setStep(step + 1);
  }

  const canContinue = step === 0 ? !!plat : step === 1 ? !!url.trim() : true;

  const platforms = [
    { id: "custom_api", name: "Custom Website", desc: "Connect your custom-built store or business website", icon: <IoCodeSlashOutline size={28} /> },
    { id: "shopify", name: "Shopify", desc: "Connect your Shopify store", icon: <ShopifyLogo /> },
    { id: "woocommerce", name: "WooCommerce", desc: "Connect your WooCommerce store", icon: <WooLogo /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 32px", borderBottom: `1px solid ${P.border}` }}>
        <button onClick={step > 0 && step < 3 ? () => setStep(step - 1) : onClose}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: P.fg, padding: 0 }}>
          <IoArrowBack size={20} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: P.fg }}>
          {step < 3 ? "Connect a Store" : "Store Configuration"}
        </span>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Step 0: Choose Platform (Screen 2) ── */}
        {step === 0 && (
          <>
            <p style={{ fontSize: 15, color: P.fg2, margin: "0 0 28px", fontWeight: 400 }}>
              Select the type of store you want to connect
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {platforms.map(p => (
                <button key={p.id} onClick={() => setPlat(p.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    padding: "24px 12px", borderRadius: 14,
                    border: `2px solid ${plat === p.id ? P.primary : P.border}`,
                    background: plat === p.id ? P.primaryLight : P.bg,
                    cursor: "pointer", textAlign: "center", position: "relative", transition: "all 0.15s",
                  }}>
                  {plat === p.id && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, background: P.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IoCheckmark size={12} color="#fff" />
                    </div>
                  )}
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: P.bg2, display: "flex", alignItems: "center", justifyContent: "center", color: P.primary }}>
                    {p.icon}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.fg }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: P.muted, fontWeight: 400, lineHeight: 1.4 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
              <button onClick={next} disabled={!canContinue}
                style={{
                  display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px",
                  borderRadius: 10, background: canContinue ? P.primary : P.border,
                  color: canContinue ? "#fff" : P.muted, border: "none",
                  fontSize: 14, fontWeight: 600, cursor: canContinue ? "pointer" : "default",
                }}>
                Continue <IoArrowForward size={16} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 1: Enter Details (Screen 3) ── */}
        {step === 1 && (
          <>
            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i < 1 ? P.primary : i === 1 ? P.primary : P.bg2,
                      color: i <= 1 ? "#fff" : P.muted, fontSize: 12, fontWeight: 700,
                      border: i > 1 ? `2px solid ${P.border}` : "none",
                    }}>
                      {i < 1 ? <IoCheckmark size={14} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: i <= 1 ? 600 : 400, color: i <= 1 ? P.primary : P.muted, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < 3 && <div style={{ width: 40, height: 2, background: i < 1 ? P.primary : P.border, margin: "0 4px", marginBottom: 20 }} />}
                </div>
              ))}
            </div>

            {/* Illustration area */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, margin: "0 auto 16px", borderRadius: 20, background: P.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IoCartOutline size={36} color={P.primary} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: P.fg, margin: "0 0 6px" }}>Enter Your Store URL</h2>
              <p style={{ fontSize: 13, color: P.muted, margin: 0, fontWeight: 400 }}>Provide the URL of your store or website to connect it with Twedot.</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://creatorsstore.com"
                style={{
                  width: "100%", height: 48, borderRadius: 10, border: `1px solid ${P.border}`,
                  padding: "0 16px", fontSize: 15, color: P.fg, outline: "none", boxSizing: "border-box",
                  transition: "border 0.15s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = P.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = P.border)} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", borderRadius: 10, background: P.bg2 }}>
              <IoInformationCircleOutline size={18} color={P.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: P.fg2, lineHeight: 1.5 }}>
                Make sure your website supports Twedot integration (for best results, use a secure HTTPS URL).
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
              <button onClick={onClose}
                style={{ fontSize: 14, fontWeight: 500, color: P.fg2, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Cancel
              </button>
              <button onClick={next} disabled={!canContinue}
                style={{
                  display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px",
                  borderRadius: 10, background: canContinue ? P.primary : P.border,
                  color: canContinue ? "#fff" : P.muted, border: "none",
                  fontSize: 14, fontWeight: 600, cursor: canContinue ? "pointer" : "default",
                }}>
                Continue <IoArrowForward size={16} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Store Configuration (Screen 4) ── */}
        {step === 2 && (
          <>
            {/* Store card */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, border: `1px solid ${P.border}`, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: P.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IoStorefrontOutline size={22} color={P.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: P.fg }}>
                  {url || "Your Store"}
                </div>
                <div style={{ fontSize: 12, color: P.muted }}>{url || "https://..."}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: P.green, background: P.greenSoft, padding: "4px 12px", borderRadius: 20 }}>Connected</span>
            </div>

            {/* Checkout Preferences */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: P.fg, margin: "0 0 4px" }}>Checkout Preferences</h3>
              <p style={{ fontSize: 13, color: P.muted, margin: "0 0 14px" }}>Choose how buyers can purchase products from this store.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, border: `1px solid ${co === "both" ? P.primary : P.border}`, cursor: "pointer", background: co === "both" ? P.primaryLight : P.bg }}>
                  <input type="radio" name="checkout" checked={co === "both"} onChange={() => setCo("both")}
                    style={{ accentColor: P.primary, marginTop: 2, width: 18, height: 18, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: P.fg }}>Both Twedot & External Checkout</div>
                    <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>Let buyers choose between Twedot checkout or your website checkout.</div>
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, border: `1px solid ${co === "twedot" ? P.primary : P.border}`, cursor: "pointer", background: co === "twedot" ? P.primaryLight : P.bg }}>
                  <input type="radio" name="checkout" checked={co === "twedot"} onChange={() => setCo("twedot")}
                    style={{ accentColor: P.primary, marginTop: 2, width: 18, height: 18, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: P.fg }}>Twedot Checkout Only</div>
                    <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>Buyers will use Twedot's secure checkout.</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Sync Settings */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: P.fg, margin: "0 0 4px" }}>Sync Settings</h3>
              <p style={{ fontSize: 13, color: P.muted, margin: "0 0 14px" }}>Control how often we fetch your products.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IoSyncOutline size={18} color={P.primary} />
                <select value={sync} onChange={e => setSync(e.target.value)}
                  style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${P.border}`, padding: "0 14px", fontSize: 14, color: P.fg, background: P.bg, cursor: "pointer", outline: "none" }}>
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)}
                style={{ fontSize: 14, fontWeight: 500, color: P.fg2, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Back
              </button>
              <button onClick={next} disabled={busy}
                style={{
                  display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px",
                  borderRadius: 10, background: P.primary, color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                {busy ? <><IoSyncOutline size={16} style={{ animation: "spin 1s linear infinite" }} /> Connecting...</> : "Connect Store"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: P.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <IoCheckmarkCircle size={40} color={P.green} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: P.fg, margin: "0 0 8px" }}>Store Connected!</h2>
            <p style={{ fontSize: 14, color: P.muted, margin: "0 0 24px" }}>Your products are syncing. This may take a few minutes.</p>
            <button onClick={onDone}
              style={{ height: 44, padding: "0 28px", borderRadius: 10, background: P.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              View Store
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 5: Store Detail & Management
// ═══════════════════════════════════════════════════════════════════════════

function StoreDetailView({ store, onBack }: { store: Store; onBack: () => void }) {
  const [tab, setTab] = useState<"overview" | "settings" | "products" | "activity">("overview");
  const products = PRODUCTS[store.id] || [];
  const meta = PLAT_META[store.platform];

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "settings", label: "Settings" },
    { id: "products", label: "Products" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Back link */}
      <div style={{ padding: "16px 32px", borderBottom: `1px solid ${P.border}` }}>
        <button onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: P.muted, cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 500 }}>
          <IoArrowBack size={16} /> Back to Connected Stores
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 32px" }}>
        {/* Store header — matches wireframe screen 5 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", border: `1px solid ${P.border}`, flexShrink: 0 }}>
            <img src={store.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: P.fg }}>{store.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: P.green, padding: "3px 12px", borderRadius: 20 }}>Active</span>
            </div>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 2 }}>{store.url}</div>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: P.muted, padding: 4 }}>
            <IoEllipsisVertical size={20} />
          </button>
        </div>

        {/* Tabs — matches wireframe */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${P.border}`, marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "10px 20px", fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? P.primary : P.muted,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t.id ? `2px solid ${P.primary}` : "2px solid transparent",
                marginBottom: -2, transition: "all 0.15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab (Screen 5 wireframe) ── */}
        {tab === "overview" && (
          <div>
            {/* Two cards side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Connection Status */}
              <div style={{ padding: "20px", borderRadius: 14, border: `1px solid ${P.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.fg, marginBottom: 12 }}>Connection Status</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: P.green }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: P.fg }}>Active</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: P.green }} />
                  <span style={{ fontSize: 12, color: P.muted }}>Last synced: {ago(store.lastSync)}</span>
                </div>
                <button style={{
                  display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 16px",
                  borderRadius: 8, border: `1px solid ${P.primary}`, background: P.bg,
                  color: P.primary, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  <IoSyncOutline size={14} /> Sync Now
                </button>
              </div>

              {/* Products Available */}
              <div style={{ padding: "20px", borderRadius: 14, border: `1px solid ${P.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.fg, marginBottom: 12 }}>Products Available</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: P.fg, letterSpacing: "-0.02em", lineHeight: 1 }}>{store.products}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <IoFlashOutline size={14} color={P.primary} />
                  <span style={{ fontSize: 12, color: P.muted }}>Distributed in feed</span>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div style={{ padding: "20px", borderRadius: 14, border: `1px solid ${P.border}`, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: P.fg }}>Configuration</span>
                <button style={{
                  height: 32, padding: "0 16px", borderRadius: 8, border: `1px solid ${P.border}`,
                  background: P.bg, fontSize: 12, fontWeight: 600, color: P.fg, cursor: "pointer",
                }}>
                  Edit
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13, color: P.fg2 }}>
                  <span style={{ color: P.muted }}>Checkout Options:</span> {store.checkout.mode === "both" ? "Both Twedot & External" : "Twedot Only"}
                </div>
                <div style={{ fontSize: 13, color: P.fg2 }}>
                  <span style={{ color: P.muted }}>Sync Frequency:</span> {store.checkout.syncFreq}
                </div>
              </div>
            </div>

            {/* Disconnect */}
            <button style={{
              width: "100%", height: 44, borderRadius: 10,
              border: `1px solid ${P.red}30`, background: P.redSoft,
              color: P.red, fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <IoTrashOutline size={16} /> Disconnect Store
            </button>
          </div>
        )}

        {/* ── Settings tab ── */}
        {tab === "settings" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Platform", value: meta.label },
                { label: "Checkout Mode", value: store.checkout.mode === "both" ? "Both Twedot & External" : "Twedot Only" },
                { label: "Sync Frequency", value: store.checkout.syncFreq },
                { label: "Connected On", value: new Date(store.connectedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) },
                { label: "Store URL", value: store.url },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 12, border: `1px solid ${P.border}` }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: P.muted }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: P.fg }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button style={{ flex: 1, height: 42, borderRadius: 10, background: P.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Edit Configuration
              </button>
              <button style={{ height: 42, padding: "0 20px", borderRadius: 10, background: P.redSoft, color: P.red, border: `1px solid ${P.red}20`, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <IoTrashOutline size={15} /> Disconnect
              </button>
            </div>
          </div>
        )}

        {/* ── Products tab ── */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: P.fg }}>{products.length} products</span>
              <button style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 8, border: `1px solid ${P.primary}`, background: P.bg, color: P.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <IoSyncOutline size={14} /> Sync Now
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, border: `1px solid ${P.border}`, background: P.bg }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `1px solid ${P.border}` }}>
                    <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: P.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: P.muted }}>{p.category} · Qty: {p.qty}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: P.fg }}>{fmt(p.price)}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.available ? P.green : P.red }}>
                      {p.available ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Activity tab ── */}
        {tab === "activity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ACTIVITY.filter(a => a.store === store.name).map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, border: `1px solid ${P.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: P.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IoFlashOutline size={16} color={P.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: P.fg }}>{a.action}</div>
                  <div style={{ fontSize: 12, color: P.muted }}>{a.detail}</div>
                </div>
                <span style={{ fontSize: 12, color: P.muted, flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 1: Connected Stores Overview (Settings Layout)
// ═══════════════════════════════════════════════════════════════════════════

function ConnectedStoresView({ onAdd, onViewStore }: { onAdd: () => void; onViewStore: (s: Store) => void }) {
  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'Poppins', system-ui, sans-serif", display: "flex" }}>
      {/* Settings sidebar — matches wireframe screen 1 */}
      <aside style={{ width: 240, borderRight: `1px solid ${P.border}`, padding: "28px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: P.fg, margin: "0 0 4px" }}>Settings</h2>
          <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>Manage your account and integrations</p>
        </div>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {SETTINGS_ITEMS.map(item => {
            const active = item.id === "stores";
            return (
              <button key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
                  background: active ? P.primaryLight : "transparent",
                  color: active ? P.primary : P.fg2,
                  border: "none", cursor: "pointer", fontSize: 13,
                  fontWeight: active ? 600 : 400, textAlign: "left",
                  borderLeft: active ? `3px solid ${P.primary}` : "3px solid transparent",
                  transition: "all 0.1s",
                }}>
                {item.icon} {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content — matches wireframe screen 1 */}
      <main style={{ flex: 1, padding: "28px 36px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: P.fg, margin: "0 0 6px" }}>Connected Stores</h1>
            <p style={{ fontSize: 14, color: P.muted, margin: 0, fontWeight: 400 }}>
              Link your existing store or website to Twedot and showcase your products to more people.
            </p>
          </div>
          <button onClick={onAdd}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 18px",
              borderRadius: 10, background: P.primary, color: "#fff", border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
            <IoAddOutline size={16} /> Connect a Store
          </button>
        </div>

        {/* Store list — matches wireframe: list items, not fancy cards */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {STORES.map(s => {
            const meta = PLAT_META[s.platform];
            return (
              <div key={s.id}
                onClick={() => onViewStore(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderRadius: 14, border: `1px solid ${P.border}`, background: P.bg,
                  cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P.primary + "60"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(107,78,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.boxShadow = "none"; }}>
                {/* Store icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: `1px solid ${P.border}`, flexShrink: 0 }}>
                  <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                {/* Store info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: P.fg }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: P.muted, marginTop: 2 }}>
                    {s.url}
                  </div>
                  <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
                    Last synced: {ago(s.lastSync)} · {s.products} products
                  </div>
                </div>
                {/* Status badge */}
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "#fff", padding: "4px 14px", borderRadius: 20,
                  background: s.status === "active" ? P.green : P.red,
                }}>
                  Active
                </span>
                {/* 3-dot menu */}
                <button onClick={e => e.stopPropagation()}
                  style={{ background: "none", border: "none", cursor: "pointer", color: P.muted, padding: 4 }}>
                  <IoEllipsisVertical size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Platform logos
// ═══════════════════════════════════════════════════════════════════════════

function ShopifyLogo() {
  return (
    <svg width={28} height={32} viewBox="0 0 109.5 124.5" fill="none">
      <path d="M95.6 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.8-.8-2.3-.5-2.9-.4-.1 0-1.5.5-4 1.2-2.4-6.8-6.5-13.1-13.9-13.1h-.6C53.3 3.8 50.6 2 48.4 2c-17.2 0-25.4 21.5-28 32.4-6.7 2.1-11.5 3.5-12 3.7-3.7 1.2-3.8 1.3-4.3 4.8C3.7 45.6 0 76.8 0 76.8l71.5 13.4L95.6 28.2z" fill="#95BF47"/>
      <path d="M94.5 27.2c-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.3-.3-.6-.4-1-.4l-4.3 86.7 23.9-5.9S95.6 28.2 95.6 28.2c-.1-.6-.6-1-1.1-1z" fill="#5E8E3E"/>
      <path d="M54.8 43.1l-4.8 14.3s-4.2-2.2-9.3-2.2c-7.5 0-7.9 4.7-7.9 5.9 0 6.5 16.9 9 16.9 24.2 0 12-7.6 19.7-17.8 19.7-12.3 0-18.6-7.6-18.6-7.6l3.3-10.9s6.5 5.6 12 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.5-13.9-8.9-13.9-22.8C20.4 51.2 30.1 38 44.4 38c5.5 0 10.4 2.1 10.4 5.1z" fill="#fff"/>
    </svg>
  );
}

function WooLogo() {
  return (
    <svg width={36} height={22} viewBox="0 0 120 28" fill="none">
      <text x="0" y="22" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="24" fill="#7B5EA7">Woo</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY
// ═══════════════════════════════════════════════════════════════════════════

export default function ConnectPage() {
  const [view, setView] = useState<"list" | "wizard" | "detail">("list");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  if (view === "wizard") {
    return (
      <ConnectWizard
        onClose={() => setView("list")}
        onDone={() => { setView("list"); }}
      />
    );
  }

  if (view === "detail" && selectedStore) {
    return (
      <StoreDetailView
        store={selectedStore}
        onBack={() => { setView("list"); setSelectedStore(null); }}
      />
    );
  }

  return (
    <ConnectedStoresView
      onAdd={() => setView("wizard")}
      onViewStore={(s) => { setSelectedStore(s); setView("detail"); }}
    />
  );
}
