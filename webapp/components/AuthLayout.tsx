"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { IoHeartOutline, IoChatbubbleOutline, IoArrowRedoOutline, IoBookmarkOutline } from "react-icons/io5";

const SLIDES = [
  { sub: "Your people. Your work.", headline: "One place." },
  { sub: "Your services.", headline: "Your clients." },
  { sub: "Build your profile.", headline: "Grow your brand." },
  { sub: "Connect & discover.", headline: "Your community." },
];

const ACTIONS_LEFT  = [
  { count: "142" }, { count: "18" }, { count: "7" }, { count: null },
];
const ACTIONS_RIGHT = [
  { count: "89" }, { count: "12" }, { count: "4" }, { count: null },
];
const ICONS = [IoHeartOutline, IoChatbubbleOutline, IoArrowRedoOutline, IoBookmarkOutline];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIdx(i => (i + 1) % SLIDES.length);
        setVisible(true);
      }, 380);
      return () => clearTimeout(swap);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[idx];

  return (
    /* Force light mode on the entire auth layout */
    <div data-theme="light" className="flex h-screen overflow-hidden" style={{ colorScheme: "light" }}>

      {/* ── Left brand panel ── */}
      <div
        className="relative hidden w-5/12 flex-col overflow-hidden lg:flex"
        style={{ background: "#edeff3" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-10 pt-10 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/auth/mini-logo.svg" alt="" width={24} height={20} />
          <span className="text-xl font-bold tracking-wide" style={{ color: "#111" }}>Twedot</span>
        </div>

        {/* Fanned cards — centered */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

          {/* Back card — artist */}
          <div style={{
            position: "absolute", width: 158, height: 272, borderRadius: 22,
            overflow: "hidden", transform: "rotate(-9deg) translate(-48px, 14px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/auth/artist.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 10px 28px", background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#6B4EFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.4)" }}>
                  <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>DA</span>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "white", lineHeight: 1.2 }}>David A.</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", lineHeight: 1.2 }}>2h ago</div>
                </div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 34, padding: "28px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)" }}>
              <p style={{ fontSize: 9, color: "white", lineHeight: 1.4, fontWeight: 500 }}>New piece dropping this week 🎨</p>
            </div>
            <div style={{ position: "absolute", bottom: 10, right: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {ACTIONS_LEFT.map(({ count }, i) => {
                const Icon = ICONS[i];
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Icon size={13} color="white" />
                    {count && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{count}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Front card — lifestyle */}
          <div style={{
            position: "absolute", width: 158, height: 272, borderRadius: 22,
            overflow: "hidden", transform: "rotate(7deg) translate(48px, -14px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/auth/lifestyle.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 10px 28px", background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.4)" }}>
                  <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>AK</span>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "white", lineHeight: 1.2 }}>Amara K.</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", lineHeight: 1.2 }}>5h ago</div>
                </div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 34, padding: "28px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)" }}>
              <p style={{ fontSize: 9, color: "white", lineHeight: 1.4, fontWeight: 500 }}>day in the life &gt;</p>
            </div>
            <div style={{ position: "absolute", bottom: 10, right: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {ACTIONS_RIGHT.map(({ count }, i) => {
                const Icon = ICONS[i];
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Icon size={13} color="white" />
                    {count && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{count}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: animated text + footer */}
        <div className="relative z-10 mt-auto flex flex-col px-10 pb-8">
          <div style={{
            transition: "opacity 0.38s ease, transform 0.38s ease",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(10px)",
          }}>
            <p className="text-xl font-semibold" style={{ color: "#6b7280" }}>{slide.sub}</p>
            <p className="mt-1 text-3xl font-bold leading-tight" style={{ color: "#111" }}>{slide.headline}</p>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed" style={{ color: "#6b7280" }}>
            Connect with people, showcase your work, and grow your network — all in one place.
          </p>

          <div className="mt-5 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setVisible(true); }}
                className="rounded-full transition-all duration-300"
                style={{ width: i === idx ? 16 : 6, height: 6, background: i === idx ? "#6B4EFF" : "#c0c4cc" }}
              />
            ))}
          </div>

          <div className="mt-8 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: "Privacy", href: "https://about.twedot.com/privacy" },
                { label: "Terms", href: "https://about.twedot.com/terms" },
                { label: "Help", href: "/help" },
                { label: "About", href: "https://about.twedot.com" },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{ fontSize: 11, color: "#9ca3af" }}>
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-2" style={{ fontSize: 11, color: "#c0c4cc" }}>
              © {new Date().getFullYear()} Twedot Inc.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel — always white ── */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-6"
        style={{ background: "#ffffff" }}
      >
        {/* Decorative circle */}
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "#edeff3", width: "60vw", height: "60vw", left: "-30vw" }}
        />
        <div className="no-scrollbar relative z-10 w-full max-w-sm overflow-y-auto py-12" style={{ maxHeight: "100%", color: "#111" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
