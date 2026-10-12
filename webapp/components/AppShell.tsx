"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { UiProvider } from "@/lib/UiContext";
import { JobSocketProvider } from "@/lib/jobSocket";
import { uploadStore, UploadState } from "@/lib/uploadStore";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import TrendingPanel from "./TrendingPanel";
import SearchPanel from "./SearchPanel";
import VideoFeedModal from "./VideoFeedModal";
import MobileBottomNav from "./MobileBottomNav";
import MobileNavDrawer from "./MobileNavDrawer";

function UploadProgress() {
  const [state, setState] = useState<UploadState | null>(uploadStore.get());
  useEffect(() => uploadStore.subscribe(setState), []);
  if (!state) return null;
  const pct = state.progress ?? 0;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#111] px-4 py-2.5 shadow-xl min-w-[180px]">
      {state.failed ? (
        <>
          <IoCloseCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-[13px] font-semibold text-white">Upload failed</span>
        </>
      ) : state.done >= state.total ? (
        <>
          <IoCheckmarkCircle size={16} className="text-green-400 shrink-0" />
          <span className="text-[13px] font-semibold text-white">
            {state.label === "text" ? "Posted!" : "Upload complete!"}
          </span>
        </>
      ) : (
        <>
          <svg width={16} height={16} viewBox="0 0 16 16" className="shrink-0 text-[#6B4EFF]">
            <path d="M8 1.5v5l3-3M8 1.5L5 4.5M2.5 9.5v2a2 2 0 002 2h7a2 2 0 002-2v-2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-white leading-none">
              {state.label === "text"
                ? "Posting…"
                : `Uploading ${state.done + 1} / ${state.total}`}
            </span>
            <div className="h-[5px] w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6B4EFF] transition-[width] duration-200"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-white/70 tabular-nums shrink-0">{pct}%</span>
        </>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginOrVerify = pathname === "/login" || pathname === "/verify";
  const isCompleteProfile = pathname === "/complete-profile";
  const isAuthBridge = pathname === "/auth-bridge";
  const profileComplete = !!user?.profileComplete;

  useEffect(() => {
    if (isLoading || isAuthBridge) return;

    if (!isAuthenticated) {
      // Unauthenticated: only /login and /verify are allowed
      if (!isLoginOrVerify) router.replace("/login");
      return;
    }

    if (!profileComplete) {
      // Authenticated but profile incomplete: only /complete-profile allowed
      if (!isCompleteProfile) router.replace("/complete-profile");
      return;
    }

    // Fully authenticated: redirect away from auth pages
    if (isLoginOrVerify || isCompleteProfile) router.replace("/stories");
  }, [isLoading, isAuthenticated, profileComplete, isLoginOrVerify, isCompleteProfile, isAuthBridge, router]);

  // Auth-bridge page handles its own auth flow (popup postMessage)
  if (isAuthBridge) return <>{children}</>;

  // Hold render while auth state resolves to avoid flash
  if (isLoading) return null;

  // Unauthenticated: only render /login and /verify
  if (!isAuthenticated) {
    if (isLoginOrVerify) return <>{children}</>;
    return null;
  }

  // Authenticated, profile incomplete: only render /complete-profile
  if (!profileComplete) {
    if (isCompleteProfile) return <>{children}</>;
    return null;
  }

  // Authenticated, profile complete: block auth pages (redirect fires above)
  if (isLoginOrVerify || isCompleteProfile) return null;

  return (
    <JobSocketProvider>
    <UiProvider>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="flex w-full flex-1">
          <SideNav />
          <main className={`min-w-0 flex-1 overflow-x-clip overflow-y-auto pb-14 lg:pb-0 ${
            ((pathname.startsWith("/channels/") && pathname !== "/channels/create") || pathname.startsWith("/c/"))
              ? "2xl:pl-40"
              : (pathname.startsWith("/settings") || pathname.startsWith("/wallet") || pathname.startsWith("/analytics") || pathname.startsWith("/ads") || pathname.startsWith("/invite") || pathname.startsWith("/help") || pathname.startsWith("/service-history") || pathname.startsWith("/job-request") || pathname.startsWith("/boost") || pathname.startsWith("/inventory"))
              ? "lg:max-w-[800px] xl:max-w-[860px]"
              : "lg:max-w-[500px] xl:max-w-[580px] 2xl:ml-40 2xl:max-w-[620px]"
          }`}>
            {children}
          </main>
          {pathname === "/search" ? <SearchPanel /> : (
            !pathname.startsWith("/settings") &&
            !pathname.startsWith("/wallet") &&
            !pathname.startsWith("/analytics") &&
            !pathname.startsWith("/ads") &&
            !pathname.startsWith("/invite") &&
            !pathname.startsWith("/help") &&
            !pathname.startsWith("/service-history") &&
            !pathname.startsWith("/job-request") &&
            !pathname.startsWith("/boost") &&
            !pathname.startsWith("/inventory") &&
            pathname !== "/create-post" &&
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/register") &&
            // Channel detail is a full-height chat — no trending panel
            !/^\/channels\/[^/]+/.test(pathname) &&
            !pathname.startsWith("/c/") &&
            <TrendingPanel />
          )}
        </div>
        <MobileBottomNav />
        <MobileNavDrawer />
        <UploadProgress />
        <VideoFeedModal />
      </div>
    </UiProvider>
    </JobSocketProvider>
  );
}
