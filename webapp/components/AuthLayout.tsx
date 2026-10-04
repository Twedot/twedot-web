"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

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
          {/* Back card — rotated left */}
          <div
            style={{
              position: "absolute",
              width: 155,
              height: 265,
              borderRadius: 22,
              overflow: "hidden",
              transform: "rotate(-9deg) translate(-48px, 14px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <Image
              src="/auth/onboarding-hero.jpg"
              alt=""
              fill
              style={{ objectFit: "cover", objectPosition: "top" }}
              sizes="155px"
            />
          </div>
          {/* Front card — rotated right */}
          <div
            style={{
              position: "absolute",
              width: 155,
              height: 265,
              borderRadius: 22,
              overflow: "hidden",
              transform: "rotate(7deg) translate(48px, -14px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <Image
              src="/auth/onboarding-hero.jpg"
              alt=""
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
              sizes="155px"
            />
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
