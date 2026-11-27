"use client";

import { useState } from "react";
import {
  IoStorefrontOutline,
  IoAddOutline,
  IoChevronForward,
  IoArrowBack,
  IoArrowForward,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoCartOutline,
  IoTimeOutline,
  IoLinkOutline,
  IoCodeSlashOutline,
  IoSyncOutline,
  IoCheckmark,
  IoSettingsOutline,
  IoEllipsisVertical,
  IoInformationCircleOutline,
  IoTrashOutline,
  IoCubeOutline,
  IoEyeOutline,
  IoFlashOutline,
  IoRocketOutline,
  IoSearchOutline,
  IoGlobeOutline,
  IoBagHandleOutline,
  IoStarOutline,
  IoLogoInstagram,
  IoLogoFacebook,
  IoLogoYoutube,
  IoLogoLinkedin,
  IoLogoApple,
} from "react-icons/io5";

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — Twedot app palette, light theme
   Purple (#6b4eff) as accent, not dominant primary
   ═══════════════════════════════════════════════════════════════════════ */

const C = {
  purple: "#6b4eff",
  purpleOff: "#c8bfff",
  purpleLight: "#f0edff",
  bg: "#ffffff",
  bgAlt: "#f6f8f9",
  text: "#1e1e1e",
  textSub: "#5c6c74",
  textMuted: "#8f9fa6",
  border: "#c9d7de",
  borderSub: "#e4eaed",
  green: "#22c55e",
  greenLight: "#ecfdf5",
  red: "#ef4444",
  redLight: "#fef2f2",
  blue: "#3b82f6",
  font: "'Poppins', system-ui, sans-serif",
};

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════════════════ */

interface Store {
  id: string; name: string; url: string;
  platform: "custom_api" | "shopify" | "woocommerce";
  status: "active" | "error"; products: number;
  views: number; orders: number;
  connectedAt: string; lastSync: string; image: string;
  checkout: { mode: "both" | "twedot"; syncFreq: string };
}

interface Product {
  id: string; name: string; price: number; image: string;
  available: boolean; qty: number; category: string;
}

const STORES: Store[] = [
  { id: "s1", name: "Creator's Fashion Store", url: "https://creatorsfashion.com", platform: "custom_api", status: "active", products: 1200, views: 24500, orders: 342, connectedAt: "2026-11-20T10:30:00Z", lastSync: "2026-11-26T08:22:00Z", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop", checkout: { mode: "both", syncFreq: "Every 15 minutes" } },
  { id: "s2", name: "BizMart Online", url: "https://bizmart.com", platform: "shopify", status: "active", products: 850, views: 18200, orders: 198, connectedAt: "2026-11-18T08:15:00Z", lastSync: "2026-11-26T07:50:00Z", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop", checkout: { mode: "twedot", syncFreq: "Every 30 minutes" } },
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

const PLAT_META: Record<string, { label: string }> = { custom_api: { label: "Custom API" }, shopify: { label: "Shopify" }, woocommerce: { label: "WooCommerce" } };
const fmt = (n: number) => `₦${n.toLocaleString()}`;
const short = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : `${n}`;
function ago(d: string) { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 2) return "just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; }

const ACTIVITY = [
  { id: "a1", action: "Product synced", detail: "Classic Leather Handbag updated", store: "Creator's Fashion Store", time: "2m ago" },
  { id: "a2", action: "New order", detail: "Order #1024 — ₦85,000", store: "Creator's Fashion Store", time: "15m ago" },
  { id: "a3", action: "Store connected", detail: "BizMart Online linked via Shopify", store: "BizMart Online", time: "1h ago" },
  { id: "a4", action: "Sync completed", detail: "850 products synced", store: "BizMart Online", time: "3h ago" },
];

/* ═══════════════════════════════════════════════════════════════════════
   LOGOS
   ═══════════════════════════════════════════════════════════════════════ */

function TwedotLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 42 36" fill="none">
      <path d="M26.5986 0C35.1033 0.00026388 41.9988 6.89476 41.999 15.3994C41.999 23.9043 35.1034 30.7995 26.5986 30.7998H16.4082L5.80957 35.4531C5.54529 35.5691 5.24913 35.3755 5.24902 35.0869V26.9795C2.03162 24.157 0 20.0157 0 15.3994C0.000256501 6.8946 6.89454 0 15.3994 0H26.5986ZM29.0479 7C26.1484 7 23.7979 9.35056 23.7979 12.25C23.7979 12.8524 23.9011 13.4309 24.0879 13.9697L17.8779 16.04C17.1406 14.0326 15.2114 12.6008 12.9482 12.6006C10.0491 12.6008 7.69846 14.9505 7.69824 17.8496C7.69845 20.7488 10.0491 23.0994 12.9482 23.0996C15.8474 23.0994 18.198 20.7487 18.1982 17.8496C18.1982 17.6338 18.1826 17.4209 18.1572 17.2119L24.6143 15.0596C25.5455 16.5255 27.1825 17.5 29.0479 17.5C31.9468 17.4997 34.2976 15.149 34.2979 12.25C34.2979 9.35077 31.947 7.00035 29.0479 7Z" fill={C.purple} />
    </svg>
  );
}

function ShopifyLogo({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s * 1.14} viewBox="0 0 109.5 124.5" fill="none">
      <path d="M95.6 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.8-.8-2.3-.5-2.9-.4-.1 0-1.5.5-4 1.2-2.4-6.8-6.5-13.1-13.9-13.1h-.6C53.3 3.8 50.6 2 48.4 2c-17.2 0-25.4 21.5-28 32.4-6.7 2.1-11.5 3.5-12 3.7-3.7 1.2-3.8 1.3-4.3 4.8C3.7 45.6 0 76.8 0 76.8l71.5 13.4L95.6 28.2z" fill="#95BF47"/>
      <path d="M94.5 27.2c-.5 0-10.2-.8-10.2-.8s-6.7-6.7-7.5-7.5c-.3-.3-.6-.4-1-.4l-4.3 86.7 23.9-5.9S95.6 28.2 95.6 28.2c-.1-.6-.6-1-1.1-1z" fill="#5E8E3E"/>
      <path d="M54.8 43.1l-4.8 14.3s-4.2-2.2-9.3-2.2c-7.5 0-7.9 4.7-7.9 5.9 0 6.5 16.9 9 16.9 24.2 0 12-7.6 19.7-17.8 19.7-12.3 0-18.6-7.6-18.6-7.6l3.3-10.9s6.5 5.6 12 5.6c3.6 0 5.1-2.8 5.1-4.9 0-8.5-13.9-8.9-13.9-22.8C20.4 51.2 30.1 38 44.4 38c5.5 0 10.4 2.1 10.4 5.1z" fill="#fff"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CONNECT WIZARD (Screens 2–4)
   ═══════════════════════════════════════════════════════════════════════ */

function ConnectWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [plat, setPlat] = useState("");
  const [url, setUrl] = useState("");
  const [co, setCo] = useState<"both" | "twedot">("both");
  const [sync, setSync] = useState("15");
  const [busy, setBusy] = useState(false);

  const stepLabels = ["Choose Platform", "Enter Details", "Authorize", "Confirm"];
  function next() { if (step === 2) { setBusy(true); setTimeout(() => { setBusy(false); setStep(3); }, 1500); return; } setStep(step + 1); }
  const canNext = step === 0 ? !!plat : step === 1 ? !!url.trim() : true;

  const platforms = [
    { id: "custom_api", name: "Custom Website", desc: "Connect your custom-built store or business website", icon: <IoCodeSlashOutline size={32} /> },
    { id: "shopify", name: "Shopify", desc: "Connect your Shopify store", icon: <ShopifyLogo s={24} /> },
    { id: "woocommerce", name: "WooCommerce", desc: "Connect your WooCommerce store", icon: <svg width={36} height={22} viewBox="0 0 120 28" fill="none"><text x="0" y="22" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="24" fill="#7B5EA7">Woo</text></svg> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, padding: "16px 24px" }}>
          <button onClick={step > 0 && step < 3 ? () => setStep(step - 1) : onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: C.textSub, padding: 0 }}><IoArrowBack size={20} /></button>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Connect a Store</span>
        </div>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
        {step === 0 && (<>
          <p style={{ fontSize: 15, color: C.textSub, margin: "0 0 24px" }}>Select the type of store you want to connect</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {platforms.map(p => (
              <button key={p.id} onClick={() => setPlat(p.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 14px", borderRadius: 14, border: plat === p.id ? `2px solid ${C.purple}` : `1px solid ${C.border}`, background: plat === p.id ? C.purpleLight : C.bg, cursor: "pointer", textAlign: "center", position: "relative", transition: "all 0.15s", boxShadow: "none", overflow: "hidden" }}>
                {plat === p.id && <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center" }}><IoCheckmark size={12} color="#fff" /></div>}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.bgAlt, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub }}>{p.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{p.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
            <button onClick={next} disabled={!canNext} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 22px", borderRadius: 24, background: canNext ? C.purple : C.borderSub, color: canNext ? "#fff" : C.textMuted, border: "none", fontSize: 14, fontWeight: 600, cursor: canNext ? "pointer" : "default", fontFamily: C.font }}>Continue <IoArrowForward size={15} /></button>
          </div>
        </>)}
        {step === 1 && (<>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
            {stepLabels.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: i < 1 ? C.green : i === 1 ? C.purple : C.bgAlt, color: i <= 1 ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700, border: i > 1 ? `1px solid ${C.border}` : "none" }}>{i < 1 ? <IoCheckmark size={14} /> : i + 1}</div>
                  <span style={{ fontSize: 11, fontWeight: i <= 1 ? 600 : 400, color: i <= 1 ? C.text : C.textMuted, whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < 3 && <div style={{ width: 36, height: 2, background: i < 1 ? C.green : C.borderSub, margin: "0 6px", marginBottom: 20 }} />}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, margin: "0 auto 16px", borderRadius: 16, background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center" }}><IoCartOutline size={32} color={C.purple} /></div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Enter Your Store URL</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Provide the URL of your store or website to connect it with Twedot.</p>
          </div>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://creatorsstore.com" style={{ width: "100%", height: 48, borderRadius: 10, border: `1px solid ${C.border}`, padding: "0 14px", fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: C.font }} onFocus={e => (e.currentTarget.style.borderColor = C.purple)} onBlur={e => (e.currentTarget.style.borderColor = C.border)} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px", borderRadius: 10, background: C.bgAlt, marginTop: 12 }}>
            <IoInformationCircleOutline size={18} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>Make sure your website supports Twedot integration (for best results, use a secure HTTPS URL).</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
            <button onClick={onClose} style={{ fontSize: 14, fontWeight: 500, color: C.textSub, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Cancel</button>
            <button onClick={next} disabled={!canNext} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 22px", borderRadius: 24, background: canNext ? C.purple : C.borderSub, color: canNext ? "#fff" : C.textMuted, border: "none", fontSize: 14, fontWeight: 600, cursor: canNext ? "pointer" : "default", fontFamily: C.font }}>Continue <IoArrowForward size={15} /></button>
          </div>
        </>)}
        {step === 2 && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, border: `1px solid ${C.borderSub}`, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center" }}><IoStorefrontOutline size={22} color={C.purple} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{url || "Your Store"}</div><div style={{ fontSize: 12, color: C.textMuted }}>{url}</div></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.greenLight, padding: "4px 12px", borderRadius: 20 }}>Connected</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Checkout Preferences</h3>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 14px" }}>Choose how buyers can purchase products from this store.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {([{ v: "both" as const, l: "Both Twedot & External Checkout", d: "Let buyers choose between Twedot checkout or your website checkout." }, { v: "twedot" as const, l: "Twedot Checkout Only", d: "Buyers will use Twedot's secure checkout." }]).map(o => (
              <label key={o.v} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 12, border: `1px solid ${co === o.v ? C.purple : C.borderSub}`, cursor: "pointer", background: co === o.v ? C.purpleLight : C.bg }}>
                <input type="radio" name="checkout" checked={co === o.v} onChange={() => setCo(o.v)} style={{ accentColor: C.purple, marginTop: 2, width: 18, height: 18, flexShrink: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{o.l}</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{o.d}</div></div>
              </label>
            ))}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Sync Settings</h3>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 14px" }}>Control how often we fetch your products.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IoSyncOutline size={18} color={C.purple} />
            <select value={sync} onChange={e => setSync(e.target.value)} style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, padding: "0 14px", fontSize: 14, color: C.text, background: C.bg, cursor: "pointer", outline: "none", fontFamily: C.font }}>
              <option value="5">Every 5 minutes</option><option value="15">Every 15 minutes</option><option value="30">Every 30 minutes</option><option value="60">Every hour</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
            <button onClick={() => setStep(1)} style={{ fontSize: 14, fontWeight: 500, color: C.textSub, background: "none", border: "none", cursor: "pointer" }}>Back</button>
            <button onClick={next} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 22px", borderRadius: 24, background: C.purple, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>{busy ? <><IoSyncOutline size={16} style={{ animation: "spin 1s linear infinite" }} /> Connecting...</> : "Connect Store"}</button>
          </div>
        </>)}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: C.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><IoCheckmarkCircle size={40} color={C.green} /></div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Store Connected!</h2>
            <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 24px" }}>Your products are syncing. This may take a few minutes.</p>
            <button onClick={onDone} style={{ height: 42, padding: "0 28px", borderRadius: 24, background: C.purple, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>View Store</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STORE DETAIL VIEW (Screen 5)
   ═══════════════════════════════════════════════════════════════════════ */

function StoreDetailView({ store, onBack }: { store: Store; onBack: () => void }) {
  const [tab, setTab] = useState<"overview" | "settings" | "products" | "activity">("overview");
  const products = PRODUCTS[store.id] || [];
  const meta = PLAT_META[store.platform];
  const tabs: { id: typeof tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "settings", label: "Settings" }, { id: "products", label: "Products" }, { id: "activity", label: "Activity" }];

  return (
    <div style={{ minHeight: "100vh", background: C.bgAlt, fontFamily: C.font }}>
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 28px" }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 0, fontSize: 13, marginBottom: 16 }}><IoArrowBack size={15} /> Back to Connected Stores</button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.borderSub}`, flexShrink: 0 }}><img src={store.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{store.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: C.green, padding: "3px 12px", borderRadius: 20 }}>Active</span>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{store.url}</div>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}><IoEllipsisVertical size={20} /></button>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: `2px solid ${C.borderSub}` }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", fontSize: 14, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? C.purple : C.textMuted, background: "none", border: "none", cursor: "pointer", borderBottom: tab === t.id ? `3px solid ${C.purple}` : "3px solid transparent", marginBottom: -2 }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 28px" }}>
        {tab === "overview" && (<div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${C.borderSub}`, background: C.bg }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Connection Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><div style={{ width: 10, height: 10, borderRadius: 5, background: C.green }} /><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Active</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><div style={{ width: 10, height: 10, borderRadius: 5, background: C.green }} /><span style={{ fontSize: 12, color: C.textMuted }}>Last synced: {ago(store.lastSync)}</span></div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 20, border: `1px solid ${C.purple}`, background: C.bg, color: C.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}><IoSyncOutline size={14} /> Sync Now</button>
            </div>
            <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${C.borderSub}`, background: C.bg }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Products Available</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{store.products}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}><IoFlashOutline size={14} color={C.purple} /><span style={{ fontSize: 12, color: C.textMuted }}>Distributed in feed</span></div>
            </div>
          </div>
          <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${C.borderSub}`, background: C.bg, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Configuration</span><button style={{ height: 30, padding: "0 14px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: C.font }}>Edit</button></div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 6 }}><span style={{ color: C.textMuted }}>Checkout Options:</span> {store.checkout.mode === "both" ? "Both Twedot & External" : "Twedot Only"}</div>
            <div style={{ fontSize: 13, color: C.textSub }}><span style={{ color: C.textMuted }}>Sync Frequency:</span> {store.checkout.syncFreq}</div>
          </div>
          <button style={{ width: "100%", height: 44, borderRadius: 10, border: `1px solid ${C.red}30`, background: C.redLight, color: C.red, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: C.font }}><IoTrashOutline size={16} /> Disconnect Store</button>
        </div>)}
        {tab === "settings" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[{ label: "Platform", value: meta.label }, { label: "Checkout Mode", value: store.checkout.mode === "both" ? "Both Twedot & External" : "Twedot Only" }, { label: "Sync Frequency", value: store.checkout.syncFreq }, { label: "Connected On", value: new Date(store.connectedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) }, { label: "Store URL", value: store.url }].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 12, border: `1px solid ${C.borderSub}`, background: C.bg }}><span style={{ fontSize: 13, color: C.textMuted }}>{s.label}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.value}</span></div>
          ))}
        </div>)}
        {tab === "products" && (<div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{products.length} products</span>
            <button style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 20, border: `1px solid ${C.purple}`, background: C.bg, color: C.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}><IoSyncOutline size={14} /> Sync Now</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.borderSub}`, background: C.bg }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `1px solid ${C.borderSub}` }}><img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div><div style={{ fontSize: 12, color: C.textMuted }}>{p.category} · Qty: {p.qty}</div></div>
                <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(p.price)}</div><span style={{ fontSize: 11, fontWeight: 600, color: p.available ? C.green : C.red }}>{p.available ? "In Stock" : "Out of Stock"}</span></div>
              </div>
            ))}
          </div>
        </div>)}
        {tab === "activity" && (<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACTIVITY.filter(a => a.store === store.name).map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, border: `1px solid ${C.borderSub}`, background: C.bg }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center" }}><IoFlashOutline size={16} color={C.purple} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.action}</div><div style={{ fontSize: 12, color: C.textMuted }}>{a.detail}</div></div>
              <span style={{ fontSize: 12, color: C.textMuted }}>{a.time}</span>
            </div>
          ))}
        </div>)}
      </div>
      <ConnectFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FOOTER (from twedot-landing)
   ═══════════════════════════════════════════════════════════════════════ */

const FOOTER_LINKS = [
  { title: "Product", items: [{ label: "Features", href: "/#features" }, { label: "Security", href: "/#security" }, { label: "Download", href: "https://play.google.com/store/apps/details?id=com.twedot&pli=1" }, { label: "Changelog", href: "#" }] },
  { title: "Business", items: [{ label: "List Your Service", href: "#" }, { label: "Analytics", href: "#" }, { label: "Pricing", href: "#" }, { label: "API", href: "#" }] },
  { title: "Company", items: [{ label: "About", href: "/about" }, { label: "Blog", href: "#" }, { label: "Careers", href: "/careers" }, { label: "Contact", href: "/contact" }] },
  { title: "Legal", items: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Child Safety", href: "/child-safety" }, { label: "Delete Account", href: "/delete-account" }] },
];

function ConnectFooter() {
  return (
    <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.borderSub}`, padding: "56px 48px 0", marginTop: 48 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Newsletter */}
        <div style={{ borderBottom: `1px solid ${C.borderSub}`, paddingBottom: 40, marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 4, letterSpacing: "-0.3px" }}>Stay in the loop</div>
            <div style={{ fontSize: 14, color: C.textMuted }}>Product updates, local commerce insights, and early access to new features.</div>
          </div>
          <div style={{ display: "flex", gap: 0, alignItems: "center", width: "100%", maxWidth: 380 }}>
            <input type="email" placeholder="Enter your email" style={{ padding: "12px 16px", borderRadius: "24px 0 0 24px", border: `1.5px solid ${C.border}`, borderRight: "none", background: C.bg, color: C.text, fontSize: 14, outline: "none", flex: 1, minWidth: 0, fontFamily: C.font }} />
            <button style={{ padding: "12px 22px", borderRadius: "0 24px 24px 0", background: C.purple, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: C.font }}>Subscribe</button>
          </div>
        </div>
        {/* Body */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 48, marginBottom: 48, flexWrap: "wrap" }}>
          <div style={{ minWidth: 200, maxWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
              <TwedotLogo size={28} />
              <span style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.3px" }}>Twedot</span>
            </div>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.85, marginBottom: 24 }}>Social. Local. Rewarding. Post content, connect with people, discover local vendors, and earn from your videos.</p>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>Download</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ top: "Download on the", bottom: "App Store", href: "#" }, { top: "Get it on", bottom: "Google Play", href: "https://play.google.com/store/apps/details?id=com.twedot&pli=1" }].map(b => (
                  <a key={b.bottom} href={b.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", textDecoration: "none" }}>
                    <IoGlobeOutline size={18} color={C.text} />
                    <div><div style={{ fontSize: 9, color: C.textMuted, lineHeight: 1 }}>{b.top}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{b.bottom}</div></div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            {FOOTER_LINKS.map(col => (
              <div key={col.title}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{col.title}</div>
                {col.items.map(item => (
                  <a key={item.label} href={item.href} style={{ display: "block", color: C.textMuted, fontSize: 13, textDecoration: "none", padding: "4px 0", lineHeight: 1.8 }}>{item.label}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${C.borderSub}`, padding: "20px 0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ color: C.textMuted, fontSize: 13, opacity: 0.7 }}>© 2026 Twedot Inc. All rights reserved.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} /><span style={{ color: C.textMuted, fontSize: 12, opacity: 0.8 }}>All systems operational</span></div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE (Screen 1 — matching mockup image exactly)
   Hero → Your Connected Stores → How It Works → CTA → Footer
   ═══════════════════════════════════════════════════════════════════════ */

export default function ConnectPage() {
  const [view, setView] = useState<"home" | "wizard" | "detail">("home");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  if (view === "wizard") return <ConnectWizard onClose={() => setView("home")} onDone={() => setView("home")} />;
  if (view === "detail" && selectedStore) return <StoreDetailView store={selectedStore} onBack={() => { setView("home"); setSelectedStore(null); }} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.font }}>

      {/* ── Your Connected Stores ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Your Connected Stores</h2>
            <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Manage your linked websites and stores</p>
          </div>
          <button onClick={() => setView("wizard")} style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px", borderRadius: 24, background: C.purple, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}><IoAddOutline size={16} /> Connect a Store</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {STORES.map(s => (
            <div key={s.id} style={{ borderRadius: 16, border: `1px solid ${C.borderSub}`, background: C.bg, overflow: "hidden", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
              <div style={{ position: "relative" }}>
                <div style={{ width: "100%", height: 150, overflow: "hidden" }}><img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, color: "#fff", background: C.green, padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: 3, background: "#fff" }} /> Active</span>
                <button onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: 20, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><IoEllipsisVertical size={16} color="#fff" /></button>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{s.url}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.textSub }}><IoCubeOutline size={13} /> {short(s.products)} products</div>
              </div>
              <div style={{ borderTop: `1px solid ${C.borderSub}` }}>
                <button onClick={() => { setSelectedStore(s); setView("detail"); }} style={{ width: "100%", height: 44, background: "none", border: "none", fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: C.font }}>
                  <IoEyeOutline size={15} /> View Store <IoChevronForward size={14} />
                </button>
              </div>
            </div>
          ))}
          {/* Connect Another Store */}
          <div style={{ borderRadius: 16, border: `1px solid ${C.borderSub}`, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", cursor: "pointer" }}
            onClick={() => setView("wizard")}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `2px dashed ${C.purpleOff}` }}>
              <IoAddOutline size={28} color={C.purple} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Connect Another Store</div>
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: "center", margin: "0 0 16px" }}>Link another website or platform to expand your reach.</p>
            <button style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 18px", borderRadius: 20, border: `1px solid ${C.purple}`, background: C.bg, color: C.purple, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>Connect a Store <IoArrowForward size={14} /></button>
          </div>
        </div>
      </section>

      {/* ── Grow Your Reach (sidebar promo from mockup, now inline) ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 40px" }}>
        <div style={{ background: C.purpleLight, borderRadius: 16, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center" }}><IoRocketOutline size={22} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Grow Your Reach</div>
              <div style={{ fontSize: 13, color: C.textSub }}>Connect your store and showcase your products to millions.</div>
            </div>
          </div>
          <button onClick={() => setView("wizard")} style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px", borderRadius: 24, background: C.purple, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>Learn More <IoArrowForward size={14} /></button>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.borderSub}`, borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 28px", letterSpacing: "-0.02em" }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr", gap: 0, alignItems: "center" }}>
            {[
              { n: 1, label: "Connect", desc: "Link your website securely", icon: <IoLinkOutline size={24} /> },
              { n: 2, label: "Sync", desc: "We'll fetch your products", icon: <IoSyncOutline size={24} /> },
              { n: 3, label: "Discover", desc: "Your products appear in the Twedot feed", icon: <IoStarOutline size={24} /> },
              { n: 4, label: "Sell", desc: "Chat, sell and grow", icon: <IoBagHandleOutline size={24} /> },
            ].flatMap((s, i) => {
              const stepCard = (
                <div key={`s${s.n}`} style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.borderSub}`, padding: "28px 20px", textAlign: "center", position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, left: 14, width: 22, height: 22, borderRadius: 11, background: C.purple, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: C.purpleLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: C.purple }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              );
              if (i < 3) {
                return [stepCard, <div key={`a${i}`} style={{ display: "flex", justifyContent: "center", padding: "0 8px" }}><IoChevronForward size={20} color={C.textMuted} /></div>];
              }
              return [stepCard];
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{ background: C.text }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Turn Your Business Into a Community</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>With Twedot Connect, your store gets discovered by people nearby.</p>
          </div>
          <button onClick={() => setView("wizard")} style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 26px", borderRadius: 24, background: C.bg, color: C.text, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: C.font, flexShrink: 0 }}>
            Get Started <IoArrowForward size={16} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <ConnectFooter />
    </div>
  );
}
