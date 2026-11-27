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
  IoTrashOutline,
  IoCubeOutline,
  IoEyeOutline,
  IoFlashOutline,
  IoGridOutline,
  IoRocketOutline,
  IoGlobeOutline,
  IoBagHandleOutline,
  IoSearchOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";

// ─── Design Tokens (AWS-inspired: light, clean, orange primary) ─────────────

const T = {
  orange: "#FF9900",
  orangeHover: "#EC7211",
  orangeLight: "#FFF8EE",
  dark: "#232F3E",
  darkAlt: "#1A242F",
  text: "#16191F",
  textBody: "#545B64",
  textMuted: "#879596",
  bg: "#FFFFFF",
  bgAlt: "#F2F3F3",
  bgCard: "#FAFAFA",
  border: "#D5DBDB",
  borderLight: "#EAEDED",
  green: "#1A8D48",
  greenLight: "#E6F6ED",
  red: "#D13212",
  redLight: "#FDF3F1",
  blue: "#0073BB",
  shadow: "0 1px 2px rgba(0,0,0,0.12)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.15)",
  font: "'Poppins', Arial, Helvetica, sans-serif",
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

const PLAT_META: Record<string, { label: string }> = {
  custom_api: { label: "Custom API" },
  shopify: { label: "Shopify" },
  woocommerce: { label: "WooCommerce" },
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

const ACTIVITY = [
  { id: "a1", action: "Product synced", detail: "Classic Leather Handbag updated", store: "Creator's Fashion Store", time: "2m ago" },
  { id: "a2", action: "New order", detail: "Order #1024 — ₦85,000", store: "Creator's Fashion Store", time: "15m ago" },
  { id: "a3", action: "Store connected", detail: "BizMart Online linked via Shopify", store: "BizMart Online", time: "1h ago" },
  { id: "a4", action: "Sync completed", detail: "850 products synced", store: "BizMart Online", time: "3h ago" },
];

// ─── Shared Styles ──────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px",
  borderRadius: 4, background: T.orange, color: T.text, border: "none",
  fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.15s",
  fontFamily: T.font, whiteSpace: "nowrap",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px",
  borderRadius: 4, background: T.bg, color: T.text, border: `1px solid ${T.textBody}`,
  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
};

const card: React.CSSProperties = {
  background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: T.shadow,
  overflow: "hidden", transition: "box-shadow 0.2s",
};

// ─── Top Nav ────────────────────────────────────────────────────────────────

function TopNav({ onAdd }: { onAdd: () => void }) {
  return (
    <header style={{ background: T.dark, color: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IoStorefrontOutline size={20} color={T.orange} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Twedot Connect</span>
          </div>
        </div>
        <button onClick={onAdd}
          style={{ ...btnPrimary, height: 34, fontSize: 13, padding: "0 16px" }}
          onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
          onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
          <IoAddOutline size={15} /> Connect a Store
        </button>
      </div>
    </header>
  );
}

// ─── Platform Logos ─────────────────────────────────────────────────────────

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

// ═════════════════════════════════════════════════════════════════════════════
// CONNECT WIZARD (Screens 2-4: Choose Platform → Enter Details → Config)
// ═════════════════════════════════════════════════════════════════════════════

function ConnectWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [plat, setPlat] = useState("");
  const [url, setUrl] = useState("");
  const [co, setCo] = useState<"both" | "twedot">("both");
  const [sync, setSync] = useState("15");
  const [busy, setBusy] = useState(false);

  const stepLabels = ["Choose Platform", "Enter Details", "Authorize", "Confirm"];

  function next() {
    if (step === 2) { setBusy(true); setTimeout(() => { setBusy(false); setStep(3); }, 1500); return; }
    setStep(step + 1);
  }

  const canNext = step === 0 ? !!plat : step === 1 ? !!url.trim() : true;

  const platforms = [
    { id: "custom_api", name: "Custom Website", desc: "Connect your custom-built store or business website", icon: <IoCodeSlashOutline size={32} /> },
    { id: "shopify", name: "Shopify", desc: "Connect your Shopify store", icon: <ShopifyLogo /> },
    { id: "woocommerce", name: "WooCommerce", desc: "Connect your WooCommerce store", icon: <WooLogo /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bgAlt, fontFamily: T.font }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.borderLight}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, padding: "16px 24px" }}>
          <button onClick={step > 0 && step < 3 ? () => setStep(step - 1) : onClose}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.textBody, padding: 0 }}>
            <IoArrowBack size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Connect a Store</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
        {/* ── Step 0: Choose Platform ── */}
        {step === 0 && (
          <>
            <p style={{ fontSize: 15, color: T.textBody, margin: "0 0 24px" }}>Select the type of store you want to connect</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {platforms.map(p => (
                <button key={p.id} onClick={() => setPlat(p.id)}
                  style={{
                    ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    padding: "24px 14px", cursor: "pointer", textAlign: "center", position: "relative",
                    border: plat === p.id ? `2px solid ${T.orange}` : `1px solid ${T.border}`,
                    background: plat === p.id ? T.orangeLight : T.bg,
                  }}>
                  {plat === p.id && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, background: T.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IoCheckmark size={12} color="#fff" />
                    </div>
                  )}
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: T.bgAlt, display: "flex", alignItems: "center", justifyContent: "center", color: T.textBody }}>
                    {p.icon}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.4 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
              <button onClick={next} disabled={!canNext}
                style={{ ...btnPrimary, opacity: canNext ? 1 : 0.5, cursor: canNext ? "pointer" : "default" }}
                onMouseEnter={e => canNext && (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
                Continue <IoArrowForward size={15} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 1: Enter Details ── */}
        {step === 1 && (
          <>
            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i < 1 ? T.green : i === 1 ? T.orange : T.bgAlt,
                      color: i <= 1 ? "#fff" : T.textMuted, fontSize: 12, fontWeight: 700,
                      border: i > 1 ? `1px solid ${T.border}` : "none",
                    }}>
                      {i < 1 ? <IoCheckmark size={14} /> : i + 1}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: i <= 1 ? 600 : 400, color: i <= 1 ? T.text : T.textMuted, whiteSpace: "nowrap" }}>{label}</span>
                  </div>
                  {i < 3 && <div style={{ width: 36, height: 2, background: i < 1 ? T.green : T.borderLight, margin: "0 6px", marginBottom: 20 }} />}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, margin: "0 auto 16px", borderRadius: 16, background: T.orangeLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IoCartOutline size={32} color={T.orange} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Enter Your Store URL</h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Provide the URL of your store or website to connect it with Twedot.</p>
            </div>

            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://creatorsstore.com"
              style={{
                width: "100%", height: 48, borderRadius: 4, border: `1px solid ${T.border}`,
                padding: "0 14px", fontSize: 15, color: T.text, outline: "none", boxSizing: "border-box",
                fontFamily: T.font,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = T.orange)}
              onBlur={e => (e.currentTarget.style.borderColor = T.border)} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", borderRadius: 4, background: T.bgAlt, marginTop: 12 }}>
              <IoInformationCircleOutline size={18} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: T.textBody, lineHeight: 1.5 }}>
                Make sure your website supports Twedot integration (for best results, use a secure HTTPS URL).
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              <button onClick={onClose} style={{ ...btnSecondary }}>Cancel</button>
              <button onClick={next} disabled={!canNext}
                style={{ ...btnPrimary, opacity: canNext ? 1 : 0.5 }}
                onMouseEnter={e => canNext && (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
                Continue <IoArrowForward size={15} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Store Configuration ── */}
        {step === 2 && (
          <>
            {/* Store card */}
            <div style={{ ...card, display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: T.orangeLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IoStorefrontOutline size={22} color={T.orange} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{url || "Your Store"}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>{url}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.green, background: T.greenLight, padding: "4px 12px", borderRadius: 4 }}>Connected</span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Checkout Preferences</h3>
            <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 14px" }}>Choose how buyers can purchase products from this store.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { v: "both" as const, l: "Both Twedot & External Checkout", d: "Let buyers choose between Twedot checkout or your website checkout." },
                { v: "twedot" as const, l: "Twedot Checkout Only", d: "Buyers will use Twedot's secure checkout." },
              ].map(o => (
                <label key={o.v} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 6, border: `1px solid ${co === o.v ? T.orange : T.border}`, cursor: "pointer", background: co === o.v ? T.orangeLight : T.bg }}>
                  <input type="radio" name="checkout" checked={co === o.v} onChange={() => setCo(o.v)}
                    style={{ accentColor: T.orange, marginTop: 2, width: 18, height: 18, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{o.l}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{o.d}</div>
                  </div>
                </label>
              ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Sync Settings</h3>
            <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 14px" }}>Control how often we fetch your products.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IoSyncOutline size={18} color={T.orange} />
              <select value={sync} onChange={e => setSync(e.target.value)}
                style={{ flex: 1, height: 44, borderRadius: 4, border: `1px solid ${T.border}`, padding: "0 14px", fontSize: 14, color: T.text, background: T.bg, cursor: "pointer", outline: "none", fontFamily: T.font }}>
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              <button onClick={() => setStep(1)} style={{ ...btnSecondary }}>Back</button>
              <button onClick={next} disabled={busy}
                style={{ ...btnPrimary }}
                onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
                {busy ? <><IoSyncOutline size={16} style={{ animation: "spin 1s linear infinite" }} /> Connecting...</> : "Connect Store"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <IoCheckmarkCircle size={40} color={T.green} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>Store Connected!</h2>
            <p style={{ fontSize: 14, color: T.textMuted, margin: "0 0 24px" }}>Your products are syncing. This may take a few minutes.</p>
            <button onClick={onDone}
              style={{ ...btnPrimary }}
              onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
              View Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STORE DETAIL VIEW (Screen 5: Tabs — Overview / Settings / Products / Activity)
// ═════════════════════════════════════════════════════════════════════════════

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
    <div style={{ minHeight: "100vh", background: T.bgAlt, fontFamily: T.font }}>
      <TopNav onAdd={() => {}} />

      {/* Store header */}
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.borderLight}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 28px" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: 0, fontSize: 13, marginBottom: 16 }}>
            <IoArrowBack size={15} /> Back to Connected Stores
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
              <img src={store.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{store.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: T.green, padding: "3px 12px", borderRadius: 4 }}>Active</span>
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{store.url}</div>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
              <IoEllipsisVertical size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: `2px solid ${T.borderLight}` }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 20px", fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
                  color: tab === t.id ? T.orange : T.textMuted,
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: tab === t.id ? `3px solid ${T.orange}` : "3px solid transparent",
                  marginBottom: -2,
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 28px" }}>
        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ ...card, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Connection Status</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: T.green }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Active</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: T.green }} />
                  <span style={{ fontSize: 12, color: T.textMuted }}>Last synced: {ago(store.lastSync)}</span>
                </div>
                <button style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 4, border: `1px solid ${T.orange}`, background: T.bg, color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font }}>
                  <IoSyncOutline size={14} /> Sync Now
                </button>
              </div>
              <div style={{ ...card, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Products Available</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{store.products}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  <IoFlashOutline size={14} color={T.orange} />
                  <span style={{ fontSize: 12, color: T.textMuted }}>Distributed in feed</span>
                </div>
              </div>
            </div>

            <div style={{ ...card, padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Configuration</span>
                <button style={{ height: 30, padding: "0 14px", borderRadius: 4, border: `1px solid ${T.border}`, background: T.bg, fontSize: 12, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: T.font }}>Edit</button>
              </div>
              <div style={{ fontSize: 13, color: T.textBody, marginBottom: 6 }}>
                <span style={{ color: T.textMuted }}>Checkout Options:</span> {store.checkout.mode === "both" ? "Both Twedot & External" : "Twedot Only"}
              </div>
              <div style={{ fontSize: 13, color: T.textBody }}>
                <span style={{ color: T.textMuted }}>Sync Frequency:</span> {store.checkout.syncFreq}
              </div>
            </div>

            <button style={{
              width: "100%", height: 44, borderRadius: 4,
              border: `1px solid ${T.red}`, background: T.redLight,
              color: T.red, fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: T.font,
            }}>
              <IoTrashOutline size={16} /> Disconnect Store
            </button>
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Platform", value: meta.label },
                { label: "Checkout Mode", value: store.checkout.mode === "both" ? "Both Twedot & External" : "Twedot Only" },
                { label: "Sync Frequency", value: store.checkout.syncFreq },
                { label: "Connected On", value: new Date(store.connectedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) },
                { label: "Store URL", value: store.url },
              ].map((s, i) => (
                <div key={i} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
                  <span style={{ fontSize: 13, color: T.textMuted }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{products.length} products</span>
              <button style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 4, border: `1px solid ${T.orange}`, background: T.bg, color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font }}>
                <IoSyncOutline size={14} /> Sync Now
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.map(p => (
                <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.borderLight}` }}>
                    <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{p.category} · Qty: {p.qty}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fmt(p.price)}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.available ? T.green : T.red }}>
                      {p.available ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {tab === "activity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ACTIVITY.filter(a => a.store === store.name).map(a => (
              <div key={a.id} style={{ ...card, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: T.orangeLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IoFlashOutline size={16} color={T.orange} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.action}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{a.detail}</div>
                </div>
                <span style={{ fontSize: 12, color: T.textMuted }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE (Screen 1: Connected Stores with hero + cards + How It Works)
// ═════════════════════════════════════════════════════════════════════════════

export default function ConnectPage() {
  const [view, setView] = useState<"home" | "wizard" | "detail">("home");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  if (view === "wizard") {
    return <ConnectWizard onClose={() => setView("home")} onDone={() => setView("home")} />;
  }

  if (view === "detail" && selectedStore) {
    return <StoreDetailView store={selectedStore} onBack={() => { setView("home"); setSelectedStore(null); }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      <TopNav onAdd={() => setView("wizard")} />

      {/* ── Hero Banner (light, clean — no dark bg) ── */}
      <section style={{ background: `linear-gradient(135deg, ${T.bgAlt} 0%, #fff 100%)`, borderBottom: `1px solid ${T.borderLight}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 4, background: T.orangeLight, fontSize: 12, fontWeight: 700, color: T.orange, marginBottom: 16 }}>
              <IoStorefrontOutline size={14} /> Twedot Connect
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: T.text, margin: "0 0 12px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Connect Your Store to Twedot
            </h1>
            <p style={{ fontSize: 16, color: T.textBody, margin: "0 0 24px", lineHeight: 1.6 }}>
              Showcase your products, reach more people, and grow your business on the open network.
            </p>
            <button onClick={() => setView("wizard")}
              style={{ ...btnPrimary, height: 44, fontSize: 15, padding: "0 24px" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
              <IoLinkOutline size={16} /> Connect a Store <IoArrowForward size={15} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
            {/* Decorative stat cards */}
            <div style={{ ...card, padding: "16px 20px", textAlign: "center" }}>
              <IoTrendingUpOutline size={24} color={T.orange} />
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 6 }}>{short(STORES.reduce((a, s) => a + s.views, 0))}</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Total Views</div>
            </div>
            <div style={{ ...card, padding: "16px 20px", textAlign: "center" }}>
              <IoCubeOutline size={24} color={T.blue} />
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 6 }}>{short(STORES.reduce((a, s) => a + s.products, 0))}</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Products</div>
            </div>
            <div style={{ ...card, padding: "16px 20px", textAlign: "center" }}>
              <IoBagHandleOutline size={24} color={T.green} />
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 6 }}>{short(STORES.reduce((a, s) => a + s.orders, 0))}</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Orders</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Your Connected Stores ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Your Connected Stores</h2>
            <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>Manage your linked websites and stores</p>
          </div>
          <button onClick={() => setView("wizard")}
            style={{ ...btnSecondary, height: 36, fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = T.bgAlt)}
            onMouseLeave={e => (e.currentTarget.style.background = T.bg)}>
            <IoAddOutline size={15} /> Connect a Store
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {/* Store cards with image — matching the mockup */}
          {STORES.map(s => (
            <div key={s.id} style={{ ...card, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = T.shadowHover)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = T.shadow)}>
              {/* Image */}
              <div style={{ position: "relative" }}>
                <div style={{ width: "100%", height: 150, overflow: "hidden" }}>
                  <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, color: "#fff", background: T.green, padding: "3px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: "#fff" }} /> Active
                </span>
                <button onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 4, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IoEllipsisVertical size={16} color="#fff" />
                </button>
              </div>
              {/* Info */}
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>{s.url}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.textBody }}>
                  <IoCubeOutline size={13} /> {short(s.products)} products
                </div>
              </div>
              {/* View Store button */}
              <div style={{ borderTop: `1px solid ${T.borderLight}`, padding: "0 18px" }}>
                <button onClick={() => { setSelectedStore(s); setView("detail"); }}
                  style={{
                    width: "100%", height: 42, background: "none", border: "none",
                    fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: T.font,
                  }}>
                  <IoEyeOutline size={15} /> View Store <IoChevronForward size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Connect Another Store card */}
          <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", cursor: "pointer", minHeight: 280 }}
            onClick={() => setView("wizard")}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = T.shadowHover)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = T.shadow)}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: T.bgAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `2px dashed ${T.border}` }}>
              <IoAddOutline size={28} color={T.orange} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Connect Another Store</div>
            <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "0 0 16px" }}>
              Link another website or platform to expand your reach.
            </p>
            <button style={{ ...btnPrimary, height: 36, fontSize: 13, padding: "0 18px" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
              onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
              Connect a Store <IoArrowForward size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: T.bgAlt, borderTop: `1px solid ${T.borderLight}`, borderBottom: `1px solid ${T.borderLight}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 28px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 24px" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { step: 1, label: "Connect", desc: "Link your website securely", icon: <IoLinkOutline size={24} />, color: T.orange },
              { step: 2, label: "Sync", desc: "We'll fetch your products", icon: <IoSyncOutline size={24} />, color: T.blue },
              { step: 3, label: "Discover", desc: "Your products appear in the Twedot feed", icon: <IoSearchOutline size={24} />, color: T.green },
              { step: 4, label: "Sell", desc: "Chat, sell and grow", icon: <IoRocketOutline size={24} />, color: T.orange },
            ].map(s => (
              <div key={s.step} style={{ ...card, padding: 20, textAlign: "center", position: "relative" }}>
                <div style={{ position: "absolute", top: 10, left: 14, fontSize: 11, fontWeight: 800, color: T.textMuted, background: T.bgAlt, padding: "2px 8px", borderRadius: 4 }}>{s.step}</div>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + "14", display: "flex", alignItems: "center", justifyContent: "center", margin: "8px auto 12px", color: s.color }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section style={{ background: T.dark }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Turn Your Business Into a Community</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: 0 }}>
              With Twedot Connect, your store gets discovered by people nearby.
            </p>
          </div>
          <button onClick={() => setView("wizard")}
            style={{ ...btnPrimary, height: 44, fontSize: 15, padding: "0 24px" }}
            onMouseEnter={e => (e.currentTarget.style.background = T.orangeHover)}
            onMouseLeave={e => (e.currentTarget.style.background = T.orange)}>
            Get Started <IoArrowForward size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
