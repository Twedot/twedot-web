"use client";

import Image from "next/image";
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
    <div className="flex h-screen overflow-hidden">

      {/* ── Left brand panel ── */}
      <div
        className="relative hidden w-5/12 flex-col overflow-hidden lg:flex"
        style={{ background: "#edeff3" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-10 pt-10 flex-shrink-0">
          <Image src="/auth/mini-logo.svg" alt="" width={24} height={20} />
          <span className="text-xl font-bold tracking-wide text-text">Twedot</span>
        </div>

        {/* Fanned phone images — centered */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* Back card — artist */}
          <div
            style={{
              position: "absolute",
              width: 158,
              height: 272,
              borderRadius: 22,
              overflow: "hidden",
              transform: "rotate(-9deg) translate(-48px, 14px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            }}
          >
            <Image src="/auth/artist.jpg" alt="" fill style={{ objectFit: "cover", objectPosition: "top center" }} sizes="158px" />
            {/* Top: post header */}
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
            {/* Bottom: caption + actions */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)" }}>
              <p style={{ fontSize: 9, color: "white", lineHeight: 1.4, marginBottom: 8, fontWeight: 500 }}>New piece dropping this week 🎨</p>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <IoHeartOutline size={11} color="white" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>142</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <IoChatbubbleOutline size={11} color="white" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>18</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <IoArrowRedoOutline size={11} color="white" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>7</span>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <IoBookmarkOutline size={11} color="white" />
                </div>
              </div>
            </div>
          </div>

          {/* Front card — discover */}
          <div
            style={{
              position: "absolute",
              width: 158,
              height: 272,
              borderRadius: 22,
              overflow: "hidden",
              transform: "rotate(7deg) translate(48px, -14px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            }}
          >
            <Image src="/auth/discover.jpg" alt="" fill style={{ objectFit: "cover", objectPosition: "top center" }} sizes="158px" />
            {/* Top: post header */}
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
            {/* Bottom: caption + actions */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)" }}>
              <p style={{ fontSize: 9, color: "white", lineHeight: 1.4, marginBottom: 8, fontWeight: 500 }}>Exploring the city today ✨</p>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <IoHeartOutline size={11} color="white" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>89</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <IoChatbubbleOutline size={11} color="white" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>12</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <IoArrowRedoOutline size={11} color="white" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>4</span>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <IoBookmarkOutline size={11} color="white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: animated text + footer */}
        <div className="relative z-10 mt-auto flex flex-col px-10 pb-8">
          {/* Sliding headline */}
          <div
            style={{
              transition: "opacity 0.38s ease, transform 0.38s ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(10px)",
            }}
          >
            <p className="text-xl font-semibold text-light-text">{slide.sub}</p>
            <p className="mt-1 text-3xl font-bold leading-tight text-text">{slide.headline}</p>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-light-text">
            Connect with people, showcase your work, and grow your network — all in one place.
          </p>

          {/* Slide dots */}
          <div className="mt-5 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setVisible(true); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 16 : 6,
                  height: 6,
                  background: i === idx ? "var(--primary)" : "#c0c4cc",
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-black/10 pt-5">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Help", href: "/help" },
                { label: "About", href: "https://about.twedot.com" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[11px] text-light-text transition-colors hover:text-text"
                >
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-light-text/60">
              © {new Date().getFullYear()} Twedot Inc.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-6"
        style={{
          background:
            "linear-gradient(to bottom, #edeff3 calc(50% - 30vw), var(--background) calc(50% - 30vw), var(--background) calc(50% + 30vw), #edeff3 calc(50% + 30vw))",
        }}
      >
        {/* Decorative circle */}
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "#edeff3", width: "60vw", height: "60vw", left: "-30vw" }}
        />

        <div className="no-scrollbar relative z-10 w-full max-w-sm overflow-y-auto py-12" style={{ maxHeight: "100%" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
