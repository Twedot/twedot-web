"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface UiContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  notify: (message: string) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const value = useMemo(
    () => ({ sidebarCollapsed, toggleSidebar, notify }),
    [sidebarCollapsed, toggleSidebar, notify]
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
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
