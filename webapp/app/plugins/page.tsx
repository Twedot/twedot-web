"use client";

import { useRouter } from "next/navigation";
import { IoHardwareChipOutline, IoChevronBack } from "react-icons/io5";

export default function PluginsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg">
          <IoChevronBack size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-text">Twedot Plugins</h1>
          <p className="text-[12px] text-light-text">Extend your profile with powerful integrations</p>
        </div>
      </div>

      {/* Coming soon */}
      <div className="flex flex-col items-center justify-center px-8 py-32 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <IoHardwareChipOutline size={38} className="text-primary" />
        </div>
        <h2 className="text-[22px] font-bold text-text">Coming Soon</h2>
        <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-light-text">
          Twedot Plugins are on the way. Connect your store, services, and AI tools directly to your profile — stay tuned.
        </p>
        <span className="mt-6 rounded-full bg-primary/10 px-4 py-1.5 text-[12px] font-semibold text-primary">
          In development
        </span>
      </div>
    </div>
  );
}
