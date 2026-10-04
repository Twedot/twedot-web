import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
  headline1,
  headline2,
}: {
  children: ReactNode;
  headline1?: string;
  headline2?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left brand panel ── */}
      <div className="relative hidden w-5/12 flex-col justify-between overflow-hidden px-10 py-10 lg:flex" style={{ background: "#edeff3" }}>

        {/* Twedot logo */}
        <div className="flex items-center gap-2">
          <Image src="/auth/mini-logo.svg" alt="" width={24} height={20} />
          <span className="text-xl font-bold tracking-wide text-text">Twedot</span>
        </div>

        {/* Headline block */}
        <div className="pb-4">
          {headline1 && (
            <p className="text-xl font-semibold text-light-text">{headline1}</p>
          )}
          {headline2 && (
            <p className="mt-2 text-3xl font-bold leading-tight text-text">{headline2}</p>
          )}
          <p className="mt-4 text-[13px] leading-relaxed text-light-text">
            Connect with people, showcase your work, and grow your network — all in one place.
          </p>
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

        <div className="no-scrollbar relative z-10 w-full max-w-sm overflow-y-auto py-12" style={{ maxHeight: "100%" }}>{children}</div>
      </div>
    </div>
  );
}
