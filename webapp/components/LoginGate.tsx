"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { IoLogInOutline } from "react-icons/io5";

export function useLoginGate() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const requireLogin = useCallback(
    (action?: () => void) => {
      if (isAuthenticated) {
        action?.();
        return true;
      }
      router.push("/login");
      return false;
    },
    [isAuthenticated, router]
  );

  return { isGuest: !isAuthenticated, requireLogin };
}

export function LoginBanner() {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-feed-bg/95 px-4 py-2.5 backdrop-blur-sm">
      <p className="text-[13px] text-light-text">
        Sign in to like, comment, follow, and post.
      </p>
      <button
        onClick={() => router.push("/login")}
        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <IoLogInOutline size={14} />
        Sign in
      </button>
    </div>
  );
}
