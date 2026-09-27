"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { UiProvider } from "@/lib/UiContext";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import TrendingPanel from "./TrendingPanel";
import SearchPanel from "./SearchPanel";

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return <>{children}</>;

  return (
    <UiProvider>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="flex w-full flex-1 gap-24 2xl:gap-40">
          <SideNav />
          <div className="flex flex-1 gap-4 2xl:gap-8">
            <main className="min-w-0 w-full max-w-[640px] shrink overflow-x-clip">
              {children}
            </main>
            {pathname === "/feed" && <TrendingPanel />}
            {pathname === "/search" && <SearchPanel />}
          </div>
        </div>
      </div>
    </UiProvider>
  );
}
