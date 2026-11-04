"use client";

import { useRouter } from "next/navigation";

export default function LiveError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-3 bg-background px-6">
      <p className="text-[14px] font-semibold text-light-text">Something went wrong loading live streams</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-full bg-red-500 px-6 py-2.5 text-[13px] font-bold text-white hover:bg-red-600">
          Try Again
        </button>
        <button onClick={() => router.push("/")} className="rounded-full border border-border px-6 py-2.5 text-[13px] font-bold text-text hover:bg-foreground/5">
          Go Home
        </button>
      </div>
    </div>
  );
}
