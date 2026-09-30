"use client";

import { useEffect } from "react";
import { IoWifiOutline, IoRefreshOutline, IoWarningOutline } from "react-icons/io5";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isOffline =
    error.message?.toLowerCase().includes("no internet") ||
    error.message?.toLowerCase().includes("failed to fetch") ||
    error.message?.toLowerCase().includes("network") ||
    (typeof navigator !== "undefined" && !navigator.onLine);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-feed-bg">
        {isOffline ? (
          <IoWifiOutline size={36} className="text-light-text" />
        ) : (
          <IoWarningOutline size={36} className="text-light-text" />
        )}
      </div>
      <div>
        <h1 className="text-[22px] font-extrabold text-text">
          {isOffline ? "You're offline" : "Something went wrong"}
        </h1>
        <p className="mt-2 max-w-xs text-[14px] leading-[22px] text-light-text">
          {isOffline
            ? "Check your internet connection and try again."
            : "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <IoRefreshOutline size={16} />
        Try again
      </button>
    </div>
  );
}
