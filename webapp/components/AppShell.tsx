"use client";

import { usePathname } from "next/navigation";
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

function UploadProgress() {
  const [state, setState] = useState<UploadState | null>(uploadStore.get());
  useEffect(() => uploadStore.subscribe(setState), []);
  if (!state) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#111] px-4 py-2.5 shadow-xl">
      {state.failed ? (
        <>
          <IoCloseCircle size={16} className="text-red-400" />
          <span className="text-[13px] font-semibold text-white">Upload failed</span>
        </>
      ) : state.done >= state.total ? (
        <>
          <IoCheckmarkCircle size={16} className="text-green-400" />
          <span className="text-[13px] font-semibold text-white">
            {state.label === "text" ? "Posted!" : "Upload complete!"}
          </span>
        </>
      ) : (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span className="text-[13px] font-semibold text-white">
            {state.label === "text"
              ? "Posting…"
              : `Uploading ${state.done + 1} / ${state.total}…`}
          </span>
        </>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return <>{children}</>;

  return (
    <JobSocketProvider>
    <UiProvider>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="flex w-full flex-1">
          <SideNav />
          <main className={`min-w-0 flex-1 overflow-x-clip ${
            ((pathname.startsWith("/channels/") && pathname !== "/channels/create") || pathname.startsWith("/c/"))
              ? "2xl:pl-40"
              : (pathname.startsWith("/settings") || pathname.startsWith("/wallet") || pathname.startsWith("/analytics") || pathname.startsWith("/ads") || pathname.startsWith("/invite") || pathname.startsWith("/help") || pathname.startsWith("/service-history") || pathname.startsWith("/job-request"))
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
            pathname !== "/create-post" &&
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/register") &&
            // Channel detail is a full-height chat — no trending panel
            !/^\/channels\/[^/]+/.test(pathname) &&
            !pathname.startsWith("/c/") &&
            <TrendingPanel />
          )}
        </div>
        <UploadProgress />
      </div>
    </UiProvider>
    </JobSocketProvider>
  );
}
