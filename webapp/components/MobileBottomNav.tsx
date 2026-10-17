"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IoPlay, IoPlayOutline,
  IoLocation, IoLocationOutline,
  IoChatbubble, IoChatbubbleOutline,
  IoNotifications, IoNotificationsOutline,
  IoPerson, IoPersonOutline,
  IoRadioOutline,
} from "react-icons/io5";
import { useHasUnseenStories } from "@/lib/unseenStories";
import { useJobSocket } from "@/lib/jobSocket";

type NavItem = {
  href: string; label: string;
  icon: React.ComponentType<{ size?: number }>; activeIcon: React.ComponentType<{ size?: number }>;
  external?: boolean; liveDot?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/stories",                  label: "Stories", icon: IoPlayOutline,          activeIcon: IoPlay },
  { href: "https://world.twedot.com",  label: "Live",    icon: IoRadioOutline,         activeIcon: IoRadioOutline, external: true, liveDot: true },
  { href: "/nearby",                   label: "Nearby",  icon: IoLocationOutline,      activeIcon: IoLocation },
  { href: "/channels",                 label: "Channels",icon: IoChatbubbleOutline,    activeIcon: IoChatbubble },
  { href: "/job-request",              label: "Jobs",    icon: IoNotificationsOutline, activeIcon: IoNotifications },
  { href: "/profile",                  label: "Profile", icon: IoPersonOutline,        activeIcon: IoPerson },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const hasUnseenStories = useHasUnseenStories();
  const { badgeCount: jobBadge } = useJobSocket();
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const mainEl = document.querySelector("main") as HTMLElement | null;

    function handle(y: number) {
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      if (delta > 0 && y > 30) setNavHidden(true);
      else if (delta < 0) setNavHidden(false);
    }

    // Some pages scroll on <main>, others on window — listen to both
    function onMain() { handle(mainEl?.scrollTop ?? 0); }
    function onWindow() { handle(window.scrollY); }

    mainEl?.addEventListener("scroll", onMain, { passive: true });
    window.addEventListener("scroll", onWindow, { passive: true });

    return () => {
      mainEl?.removeEventListener("scroll", onMain);
      window.removeEventListener("scroll", onWindow);
    };
  }, []);

  // Reset on route change
  useEffect(() => {
    setNavHidden(false);
    lastScrollY.current = 0;
  }, [pathname]);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border bg-background lg:hidden transition-transform duration-300 ${navHidden ? "translate-y-full" : "translate-y-0"}`}>
      {NAV_ITEMS.map((item) => {
        const active = !item.external && (
          item.href === "/profile"
            ? pathname === "/profile" || pathname.startsWith("/profile/")
            : pathname === item.href || pathname.startsWith(item.href + "/")
        );
        const Icon = active ? item.activeIcon : item.icon;
        const inner = (
          <>
            <div className="relative">
              <Icon size={22} />
              {item.liveDot && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[8px] w-[8px]">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF3B30] opacity-75" />
                  <span className="relative inline-flex h-[8px] w-[8px] rounded-full bg-[#FF3B30]" />
                </span>
              )}
              {item.href === "/stories" && hasUnseenStories && !active && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF3B30]" />
              )}
              {item.href === "/job-request" && jobBadge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FF3B30] px-[2px] text-[8px] font-bold leading-none text-white">
                  {jobBadge > 99 ? "99+" : jobBadge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </>
        );
        const cls = `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold ${item.liveDot ? "text-[#FF3B30]" : active ? "text-primary" : "text-light-text"}`;
        return item.external ? (
          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
            {inner}
          </a>
        ) : (
          <Link key={item.href} href={item.href} className={cls}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
