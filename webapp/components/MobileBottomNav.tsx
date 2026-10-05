"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IoPlay, IoPlayOutline,
  IoLocation, IoLocationOutline,
  IoChatbubble, IoChatbubbleOutline,
  IoNotifications, IoNotificationsOutline,
  IoPerson, IoPersonOutline,
} from "react-icons/io5";
import { useHasUnseenStories } from "@/lib/unseenStories";
import { useJobSocket } from "@/lib/jobSocket";

const NAV_ITEMS = [
  { href: "/stories",     label: "Stories",     icon: IoPlayOutline,          activeIcon: IoPlay },
  { href: "/nearby",      label: "Nearby",       icon: IoLocationOutline,      activeIcon: IoLocation },
  { href: "/channels",    label: "Channels",     icon: IoChatbubbleOutline,    activeIcon: IoChatbubble },
  { href: "/job-request", label: "Jobs",         icon: IoNotificationsOutline, activeIcon: IoNotifications },
  { href: "/profile",     label: "Profile",      icon: IoPersonOutline,        activeIcon: IoPerson },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const hasUnseenStories = useHasUnseenStories();
  const { badgeCount: jobBadge } = useJobSocket();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border bg-background lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/profile"
          ? pathname === "/profile" || pathname.startsWith("/profile/")
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = active ? item.activeIcon : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold ${active ? "text-primary" : "text-light-text"}`}
          >
            <div className="relative">
              <Icon size={22} />
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
          </Link>
        );
      })}
    </nav>
  );
}
