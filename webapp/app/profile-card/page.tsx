"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  IoDownloadOutline,
  IoShareSocialOutline,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoBriefcaseOutline,
  IoCodeSlashOutline,
  IoStar,
  IoDiamond,
  IoTrophy,
  IoCheckmark,
  IoImageOutline,
} from "react-icons/io5";
import {
  GLOBAL_RANK_COLORS,
  GLOBAL_RANK_ICON,
  GLOBAL_RANK_LABELS,
  getGlobalRankTier,
} from "@/lib/globalRank";

const COLOR_THEMES = [
  { name: "Purple",  hex: "#6b4eff", r: 107, g: 78,  b: 255, bg1: "#1a1050", bg2: "#0f0a2a", bg3: "#0a0618", bg4: "#110d30", header1: "rgba(50,35,120,0.5)", header2: "rgba(35,25,85,0.3)", card1: "rgba(28,20,65,0.97)", card2: "rgba(18,13,48,0.98)", card3: "rgba(14,10,38,1)", inner: "#16103a" },
  { name: "Blue",    hex: "#3b82f6", r: 59,  g: 130, b: 246, bg1: "#0c1a3d", bg2: "#070e24", bg3: "#050a18", bg4: "#0a1530", header1: "rgba(20,50,120,0.5)", header2: "rgba(15,35,85,0.3)", card1: "rgba(12,25,60,0.97)", card2: "rgba(8,18,48,0.98)", card3: "rgba(6,12,38,1)", inner: "#0c1830" },
  { name: "Emerald", hex: "#10b981", r: 16,  g: 185, b: 129, bg1: "#081f18", bg2: "#040f0c", bg3: "#030a08", bg4: "#061510", header1: "rgba(15,70,50,0.5)", header2: "rgba(10,50,35,0.3)", card1: "rgba(10,35,28,0.97)", card2: "rgba(6,22,18,0.98)", card3: "rgba(4,16,13,1)", inner: "#08201a" },
  { name: "Rose",    hex: "#f43f5e", r: 244, g: 63,  b: 94,  bg1: "#2a0a12", bg2: "#1a050a", bg3: "#120408", bg4: "#200810", header1: "rgba(100,20,35,0.5)", header2: "rgba(70,15,25,0.3)", card1: "rgba(50,12,22,0.97)", card2: "rgba(35,8,16,0.98)", card3: "rgba(28,6,12,1)", inner: "#2a0a14" },
  { name: "Orange",  hex: "#f97316", r: 249, g: 115, b: 22,  bg1: "#2a1505", bg2: "#1a0c03", bg3: "#120802", bg4: "#201008", header1: "rgba(100,45,10,0.5)", header2: "rgba(70,30,8,0.3)", card1: "rgba(50,22,8,0.97)", card2: "rgba(35,15,5,0.98)", card3: "rgba(28,10,4,1)", inner: "#2a1408" },
  { name: "Cyan",    hex: "#06b6d4", r: 6,   g: 182, b: 212, bg1: "#081e28", bg2: "#041018", bg3: "#030a10", bg4: "#06151e", header1: "rgba(10,60,80,0.5)", header2: "rgba(8,40,55,0.3)", card1: "rgba(8,30,42,0.97)", card2: "rgba(5,20,30,0.98)", card3: "rgba(4,14,22,1)", inner: "#082028" },
  { name: "Gold",    hex: "#eab308", r: 234, g: 179, b: 8,   bg1: "#1e1800", bg2: "#120e00", bg3: "#0a0800", bg4: "#181200", header1: "rgba(80,65,10,0.5)", header2: "rgba(55,45,8,0.3)", card1: "rgba(40,32,8,0.97)", card2: "rgba(28,22,5,0.98)", card3: "rgba(20,16,4,1)", inner: "#1e1a08" },
  { name: "Pink",    hex: "#ec4899", r: 236, g: 72,  b: 153, bg1: "#2a0820", bg2: "#1a0512", bg3: "#12030c", bg4: "#200818", header1: "rgba(90,20,60,0.5)", header2: "rgba(65,15,40,0.3)", card1: "rgba(48,12,32,0.97)", card2: "rgba(32,8,22,0.98)", card3: "rgba(24,6,16,1)", inner: "#2a0a1e" },
  { name: "Black",   hex: "#555555", r: 85,  g: 85,  b: 85,  bg1: "#111111", bg2: "#0a0a0a", bg3: "#050505", bg4: "#0e0e0e", header1: "rgba(40,40,40,0.5)", header2: "rgba(28,28,28,0.3)", card1: "rgba(22,22,22,0.97)", card2: "rgba(16,16,16,0.98)", card3: "rgba(12,12,12,1)", inner: "#141414" },
] as const;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function RankIcon({ type, size, color }: { type: "star" | "diamond" | "trophy"; size: number; color: string }) {
  if (type === "diamond") return <IoDiamond size={size} style={{ color }} />;
  if (type === "trophy") return <IoTrophy size={size} style={{ color }} />;
  return <IoStar size={size} style={{ color }} />;
}

function ac(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

export default function ProfileCardPage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const cardOnlyRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [businessAvailable, setBusinessAvailable] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  const CARD_OUTER_W = 600;
  const t = COLOR_THEMES[themeIdx];
  const { r, g, b } = t;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cardScale, setCardScale] = useState(1);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;
    const update = () => {
      const w = wrapper.clientWidth;
      const s = w >= CARD_OUTER_W ? 1 : w / CARD_OUTER_W;
      setCardScale(s);
      setCardHeight(card.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    ro.observe(card);
    return () => ro.disconnect();
  }, [user, themeIdx, businessAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user?.profile_photo_url) return;
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(user.profile_photo_url)}`;
    fetch(proxyUrl)
      .then((res) => { if (!res.ok) throw new Error(); return res.blob(); })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setAvatarDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, [user?.profile_photo_url]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUser().catch(() => {});
    apiGet<any>("/users/me/invite-token")
      .then((res) => {
        const token = res?.data?.token ?? res?.token ?? (typeof res === "string" ? res : null);
        if (token) setInviteToken(token);
      })
      .catch(() => {});
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const profileUrl = inviteToken
    ? `https://twedot.com/u/${encodeURIComponent(inviteToken)}`
    : `https://twedot.com`;

  const captureCard = useCallback(async (ref: React.RefObject<HTMLDivElement | null>): Promise<string | null> => {
    if (!ref.current) return null;
    const el = ref.current;
    const prev = el.style.transform;
    el.style.transform = "none";
    try {
      return await toPng(el, { pixelRatio: 3 });
    } finally {
      el.style.transform = prev;
    }
  }, []);

  const handleDownload = useCallback(async (cardOnly: boolean) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const ref = cardOnly ? cardOnlyRef : cardRef;
      const dataUrl = await captureCard(ref);
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `twedot-${(user?.name ?? "profile").replace(/\s+/g, "-").toLowerCase()}${cardOnly ? "-card" : ""}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      notify("Failed to generate card image. Try again.");
    } finally {
      setDownloading(false);
    }
  }, [downloading, user?.name, notify, captureCard]);

  const handleShare = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await captureCard(cardOnlyRef);
      if (!dataUrl) { setDownloading(false); return; }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "twedot-card.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${user?.name ?? "Twedot"} on Twedot`,
          text: `Check out my profile on Twedot! ${profileUrl}`,
          files: [file],
        }).catch(() => {});
      } else {
        const link = document.createElement("a");
        link.download = `twedot-${(user?.name ?? "profile").replace(/\s+/g, "-").toLowerCase()}-card.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch {
      notify("Sharing not supported. The card has been downloaded instead.");
    }
    setDownloading(false);
  }, [downloading, user?.name, notify, captureCard, profileUrl]);

  if (isLoading || !user) return null;

  const tier = getGlobalRankTier(user.global_activity_score ?? 0);
  const rankColor = GLOBAL_RANK_COLORS[tier];
  const rankLabel = GLOBAL_RANK_LABELS[tier];
  const rankIconType = GLOBAL_RANK_ICON[tier];
  const location = [user.city, user.country].filter(Boolean).join(", ") || "Somewhere on Earth";
  const followerCount = (user as any)?.follower_count ?? 0;
  const followingCount = (user as any)?.following_count ?? 0;

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      <h1 className="text-[18px] font-bold text-text">Your Profile Card</h1>
      <p className="text-[13px] text-light-text text-center max-w-[400px]">
        Preview your shareable profile card. Download it or share directly to other platforms.
      </p>

      {/* ── Color picker ── */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <span className="text-[12px] font-semibold text-light-text">Theme</span>
        <div className="flex gap-2 flex-wrap justify-center">
          {COLOR_THEMES.map((ct, i) => (
            <button
              key={ct.name}
              onClick={() => setThemeIdx(i)}
              title={ct.name}
              className="relative flex items-center justify-center transition-transform hover:scale-110"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: ct.hex,
                border: i === themeIdx ? "2px solid white" : "2px solid transparent",
                outline: i === themeIdx ? `2px solid ${ct.hex}` : "none",
                outlineOffset: 1,
              }}
            >
              {i === themeIdx && <IoCheckmark size={14} color="white" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Business toggle control ── */}
      <button
        onClick={() => setBusinessAvailable(!businessAvailable)}
        className="flex items-center gap-2 text-[12px] font-semibold text-light-text hover:text-text transition-colors"
      >
        <div
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: businessAvailable ? t.hex : "rgba(255,255,255,0.15)",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: businessAvailable ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s",
            }}
          />
        </div>
        Available for Business
      </button>

      {/* ── Full card with background (for full download) ── */}
      <div
        ref={wrapperRef}
        className="w-full"
        style={{ maxWidth: CARD_OUTER_W, overflow: "hidden", height: cardHeight }}
      >
      <div
        ref={cardRef}
        style={{
          width: CARD_OUTER_W,
          transform: `scale(${cardScale})`,
          transformOrigin: "top left",
          paddingTop: 50,
          paddingBottom: 70,
          paddingLeft: 36,
          paddingRight: 36,
          background: `linear-gradient(160deg, ${t.bg1} 0%, ${t.bg2} 40%, ${t.bg3} 70%, ${t.bg4} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── 3D Card wrapper ── */}
        <div style={{ position: "relative", width: "100%", perspective: "1200px" }}>
          <div style={{ position: "relative", width: "100%", transform: "rotateY(-2deg) rotateX(1deg)", transformStyle: "preserve-3d" }}>
            {/* RIGHT EDGE */}
            <div style={{ position: "absolute", top: 10, right: -7, bottom: 10, width: 8, borderRadius: "0 6px 6px 0", background: `linear-gradient(180deg, ${ac(r,g,b,0.5)} 0%, ${ac(r,g,b,0.3)} 50%, ${ac(r,g,b,0.4)} 100%)`, transform: "rotateY(70deg)", transformOrigin: "left center" }} />
            {/* BOTTOM EDGE */}
            <div style={{ position: "absolute", left: 10, right: 10, bottom: -6, height: 7, borderRadius: "0 0 6px 6px", background: `linear-gradient(90deg, ${ac(r,g,b,0.3)} 0%, ${ac(r,g,b,0.25)} 50%, ${ac(r,g,b,0.35)} 100%)`, transform: "rotateX(70deg)", transformOrigin: "top center" }} />
            {/* THICK outer border */}
            <div style={{ position: "absolute", inset: -4, borderRadius: 30, background: `linear-gradient(135deg, ${ac(r,g,b,0.65)} 0%, ${ac(r,g,b,0.45)} 25%, ${ac(r,g,b,0.55)} 50%, ${ac(r,g,b,0.4)} 75%, ${ac(r,g,b,0.65)} 100%)` }} />

            {/* ── Card body (also used for card-only download) ── */}
            <div
              ref={cardOnlyRef}
              style={{
                position: "relative",
                margin: 3,
                borderRadius: 27,
                overflow: "hidden",
                width: 522,
                background: `linear-gradient(150deg, ${t.card1} 0%, ${t.card2} 50%, ${t.card3} 100%)`,
                border: `1px solid ${ac(r,g,b,0.3)}`,
                fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
              }}
            >
              {/* Glass shine */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)", pointerEvents: "none", zIndex: 1 }} />

              {/* ═══ HEADER ═══ */}
              <div
                style={{
                  position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 24px 14px",
                  background: `linear-gradient(180deg, ${t.header1} 0%, ${t.header2} 100%)`,
                  borderBottom: `1px solid ${ac(r,g,b,0.25)}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="28" height="24" viewBox="0 0 42 36" fill="none">
                    <path d="M26.5986 0C35.1033 0.00026388 41.9988 6.89476 41.999 15.3994C41.999 23.9043 35.1034 30.7995 26.5986 30.7998H16.4082L5.80957 35.4531C5.54529 35.5691 5.24913 35.3755 5.24902 35.0869V26.9795C2.03162 24.157 0 20.0157 0 15.3994C0.000256501 6.8946 6.89454 0 15.3994 0H26.5986ZM29.0479 7C26.1484 7 23.7979 9.35056 23.7979 12.25C23.7979 12.8524 23.9011 13.4309 24.0879 13.9697L17.8779 16.04C17.1406 14.0326 15.2114 12.6008 12.9482 12.6006C10.0491 12.6008 7.69846 14.9505 7.69824 17.8496C7.69845 20.7488 10.0491 23.0994 12.9482 23.0996C15.8474 23.0994 18.198 20.7487 18.1982 17.8496C18.1982 17.6338 18.1826 17.4209 18.1572 17.2119L24.6143 15.0596C25.5455 16.5255 27.1825 17.5 29.0479 17.5C31.9468 17.4997 34.2976 15.149 34.2979 12.25C34.2979 9.35077 31.947 7.00035 29.0479 7Z" fill="white"/>
                  </svg>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>twedot</span>
                </div>
                {businessAvailable && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", border: `1px solid ${ac(r,g,b,0.25)}`, borderRadius: 20, padding: "5px 14px" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Business Available</span>
                  </div>
                )}
              </div>

              {/* ═══ MAIN: Avatar + Info ═══ */}
              <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 18, padding: "20px 24px 18px" }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ borderRadius: "50%", padding: 3, background: `linear-gradient(135deg, ${t.hex} 0%, ${ac(r,g,b,0.6)} 50%, ${t.hex} 100%)` }}>
                    {(avatarDataUrl ?? user.profile_photo_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(avatarDataUrl ?? user.profile_photo_url)!}
                        alt={user.name ?? ""}
                        style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: `3px solid ${t.inner}`, display: "block" }}
                      />
                    ) : (
                      <div style={{ width: 100, height: 100, borderRadius: "50%", background: t.inner, border: `3px solid ${t.inner}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                        {(user.name ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name ?? "No name"}
                    </span>
                    {user.is_verified && <IoCheckmarkCircle size={18} style={{ color: t.hex, flexShrink: 0 }} />}
                  </div>
                  <span style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.3, marginTop: 1 }}>
                    {user.occupation || "Twedot User"}
                  </span>
                  {/* Rank badge with "Rank:" label */}
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>Rank:</span>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700,
                        background: `${rankColor}20`, color: rankColor,
                      }}
                    >
                      <RankIcon type={rankIconType} size={14} color={rankColor} />
                      {rankLabel}
                    </span>
                  </div>
                  {/* Stats */}
                  <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                      <IoPeopleOutline size={18} color="rgba(255,255,255,0.55)" />
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1 }}>{fmt(followerCount)}</span>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Followers</div>
                      </div>
                    </div>
                    <div style={{ width: 1, height: 30, background: ac(r,g,b,0.25), margin: "0 12px" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                      <IoPersonAddOutline size={18} color="rgba(255,255,255,0.55)" />
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1 }}>{fmt(followingCount)}</span>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>Following</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ AVAILABLE FOR BUSINESS + QR CODE ═══ */}
              <div
                style={{
                  position: "relative", zIndex: 2, margin: "0 24px",
                  display: "flex", alignItems: "center", gap: 10,
                  borderRadius: 16, padding: "12px 14px",
                  background: ac(r,g,b,0.06), border: `1px solid ${ac(r,g,b,0.18)}`,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: ac(r,g,b,0.15), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IoBriefcaseOutline size={18} color="rgba(255,255,255,0.75)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
                    {businessAvailable ? "Available for Business" : "Not Available"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {businessAvailable
                      ? (user.bio
                          ? user.bio.length > 40 ? user.bio.slice(0, 40) + "…" : user.bio
                          : "Open to collaborations, deals and projects.")
                      : "Currently not taking new work."}
                  </div>
                </div>
                {/* Toggle display */}
                <div style={{ width: 42, height: 24, borderRadius: 12, background: businessAvailable ? ac(r,g,b,0.35) : "rgba(255,255,255,0.1)", position: "relative", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: businessAvailable ? t.hex : "rgba(255,255,255,0.3)", left: businessAvailable ? "auto" : 3, right: businessAvailable ? 3 : "auto" }} />
                </div>
                {/* QR Code */}
                <div style={{ flexShrink: 0, borderRadius: 8, padding: 3, background: "white" }}>
                  <QRCodeSVG
                    value={profileUrl}
                    size={46}
                    bgColor="white"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
              </div>

              {/* ═══ BOTTOM TAGS ═══ */}
              <div style={{ position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", gap: 6, padding: "14px 24px 20px" }}>
                {user.occupation && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#d1d5db", background: ac(r,g,b,0.08), border: `1px solid ${ac(r,g,b,0.2)}` }}>
                    <IoCodeSlashOutline size={12} color="rgba(255,255,255,0.5)" />
                    {user.occupation}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#d1d5db", background: ac(r,g,b,0.08), border: `1px solid ${ac(r,g,b,0.2)}` }}>
                  <IoLocationOutline size={12} color="rgba(255,255,255,0.5)" />
                  {location}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#d1d5db", background: ac(r,g,b,0.08), border: `1px solid ${ac(r,g,b,0.2)}` }}>
                  <IoStar size={12} color={rankColor} />
                  {rankLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ GLASS STAND ═══ */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 80 }}>
            <div style={{ width: 3, height: 22, background: `linear-gradient(180deg, ${ac(r,g,b,0.4)} 0%, ${ac(r,g,b,0.15)} 100%)`, borderRadius: 2 }} />
            <div style={{ width: 3, height: 22, background: `linear-gradient(180deg, ${ac(r,g,b,0.4)} 0%, ${ac(r,g,b,0.15)} 100%)`, borderRadius: 2 }} />
          </div>
          <div style={{ width: 160, height: 14, borderRadius: 8, background: `linear-gradient(180deg, ${ac(r,g,b,0.2)} 0%, ${ac(r,g,b,0.05)} 100%)`, border: `1px solid ${ac(r,g,b,0.2)}` }} />
          <div style={{ width: 120, height: 6, marginTop: 4, borderRadius: "50%", background: `radial-gradient(ellipse, ${ac(r,g,b,0.15)} 0%, transparent 70%)` }} />
        </div>
      </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => handleDownload(true)}
          disabled={downloading}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <IoDownloadOutline size={16} />
          {downloading ? "Generating…" : "Download Card"}
        </button>
        <button
          onClick={() => handleDownload(false)}
          disabled={downloading}
          className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold text-text hover:bg-feed-bg disabled:opacity-50 transition-colors"
        >
          <IoImageOutline size={16} />
          Full Image
        </button>
        <button
          onClick={handleShare}
          disabled={downloading}
          className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold text-text hover:bg-feed-bg disabled:opacity-50 transition-colors"
        >
          <IoShareSocialOutline size={16} />
          Share
        </button>
      </div>
    </div>
  );
}
