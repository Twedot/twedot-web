"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isOffline =
    error.message?.toLowerCase().includes("no internet") ||
    error.message?.toLowerCase().includes("failed to fetch") ||
    error.message?.toLowerCase().includes("network") ||
    (typeof navigator !== "undefined" && !navigator.onLine);

  return (
    <ErrorState
      isOffline={isOffline}
      message={
        isOffline
          ? "Check your internet connection and try again."
          : "Something went wrong, but don't worry — it's not your fault. Try again."
      }
      onRetry={reset}
      retryLabel="Refresh"
      secondaryLabel="Go home"
      onSecondary={() => router.push("/")}
    />
  );
}
