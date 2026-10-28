"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { UiProvider, useUi } from "@/lib/UiContext";
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
import PostCommentPanel from "./PostCommentPanel";
import ChatProvider from "@/lib/ChatProvider";
import ChatTray from "./ChatTray";

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

// Rendered inside UiProvider — can safely call useUi()
function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { postPanelId } = useUi();

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex w-full flex-1">
        <SideNav />
        <main className={`min-w-0 flex-1 overflow-x-clip overflow-y-auto pb-14 lg:pb-0 ${
          pathname === "/stories" || pathname.startsWith("/p/")
            ? ""
            : ((pathname.startsWith("/channels/") && pathname !== "/channels/create") || pathname.startsWith("/c/"))
            ? "2xl:pl-40"
            : (pathname.startsWith("/settings") || pathname.startsWith("/wallet") || pathname.startsWith("/analytics") || pathname.startsWith("/ads") || pathname.startsWith("/invite") || pathname.startsWith("/help") || pathname.startsWith("/service-history") || pathname.startsWith("/job-request") || pathname.startsWith("/boost") || pathname.startsWith("/inventory"))
            ? "lg:max-w-[800px] xl:max-w-[860px]"
            : "lg:max-w-[500px] xl:max-w-[580px] 2xl:ml-40 2xl:max-w-[620px]"
        }`}>
          {children}
        </main>
        {postPanelId ? (
          <PostCommentPanel />
        ) : pathname === "/search" ? <SearchPanel /> : (
          pathname !== "/stories" &&
          !pathname.startsWith("/p/") &&
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
          !/^\/channels\/[^/]+/.test(pathname) &&
          !pathname.startsWith("/c/") &&
          <TrendingPanel />
        )}
      </div>
      <MobileBottomNav />
      <MobileNavDrawer />
      <UploadProgress />
      <VideoFeedModal />
      <ChatTray />
    </div>
  );
}

// Routes guests can browse without logging in
const PUBLIC_ROUTES = [
  "/stories",
  "/search",
  "/status/",
  "/p/",
  "/u/",
  "/channels",
  "/c/",
  "/nearby",
  "/live",
  "/rank",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r)
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginOrVerify = pathname === "/login" || pathname === "/verify";
  const isCompleteProfile = pathname === "/complete-profile";
  const isAuthBridge = pathname === "/auth-bridge";
  const isFullscreen = pathname.startsWith("/live/watch");
  const profileComplete = !!user?.profileComplete;
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (isLoading || isAuthBridge) return;

    if (!isAuthenticated) {
      // Allow guests on public routes — redirect private routes to login
      if (!isLoginOrVerify && !isPublic) router.replace("/login");
      return;
    }

    if (!profileComplete) {
      if (!isCompleteProfile) router.replace("/complete-profile");
      return;
    }

    if (isLoginOrVerify || isCompleteProfile) {
      let dest = "/stories";
      try {
        const pending = sessionStorage.getItem("bridge_pending");
        if (pending && pending.startsWith("/auth-bridge")) {
          sessionStorage.removeItem("bridge_pending");
          dest = pending;
        }
      } catch {}
      router.replace(dest);
    }
  }, [isLoading, isAuthenticated, profileComplete, isLoginOrVerify, isCompleteProfile, isAuthBridge, isPublic, router]);

  if (isAuthBridge) return <>{children}</>;
  if (isLoading) return null;

  if (!isAuthenticated) {
    if (isLoginOrVerify) return <>{children}</>;
    // Let guests see public routes inside the full shell layout
    if (isPublic) {
      return (
        <UiProvider>
          <AppShellLayout>{children}</AppShellLayout>
        </UiProvider>
      );
    }
    return null;
  }

  if (!profileComplete) {
    if (isCompleteProfile) return <>{children}</>;
    return null;
  }

  if (isLoginOrVerify || isCompleteProfile) return null;

  if (isFullscreen) return <>{children}</>;

  return (
    <JobSocketProvider>
    <UiProvider>
      <ChatProvider />
      <AppShellLayout>{children}</AppShellLayout>
    </UiProvider>
    </JobSocketProvider>
  );
}
