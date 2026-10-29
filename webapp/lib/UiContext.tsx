"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface UiContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  notify: (message: string) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  postPanelId: string | null;
  openPostPanel: (postId: string) => void;
  closePostPanel: () => void;
}

const UiContext = createContext<UiContextValue>({
  sidebarCollapsed: false,
  toggleSidebar: () => {},
  notify: () => {},
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  postPanelId: null,
  openPostPanel: () => {},
  closePostPanel: () => {},
});

export function UiProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1280;
  });
  const [toast, setToast] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [postPanelId, setPostPanelId] = useState<string | null>(null);
  const userToggledRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!userToggledRef.current) setSidebarCollapsed(!e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleSidebar = useCallback(() => {
    userToggledRef.current = true;
    setSidebarCollapsed((v) => !v);
  }, []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openPostPanel = useCallback((postId: string) => setPostPanelId(postId), []);
  const closePostPanel = useCallback(() => setPostPanelId(null), []);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const value = useMemo(
    () => ({ sidebarCollapsed, toggleSidebar, notify, drawerOpen, openDrawer, closeDrawer, postPanelId, openPostPanel, closePostPanel }),
    [sidebarCollapsed, toggleSidebar, notify, drawerOpen, openDrawer, closeDrawer, postPanelId, openPostPanel, closePostPanel]
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="rounded-full bg-text px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
}

export function useUi() {
  return useContext(UiContext);
}
