"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IoCloseOutline,
  IoPersonOutline,
  IoPlay, IoPlayOutline,
  IoLocation, IoLocationOutline,
  IoChatbubble, IoChatbubbleOutline,
  IoNotifications, IoNotificationsOutline,
  IoAddOutline,
  IoChevronUpOutline, IoChevronDownOutline,
  IoCompassOutline,
  IoGameControllerOutline,
  IoCartOutline,
  IoBriefcaseOutline,
  IoHardwareChipOutline,
  IoMegaphoneOutline,
  IoWalletOutline,
  IoCubeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoPersonAddOutline,
  IoHelpCircleOutline,
  IoStarOutline,
  IoSettings, IoSettingsOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useJobSocket } from "@/lib/jobSocket";
import { useHasUnseenStories } from "@/lib/unseenStories";
import { apiGet } from "@/lib/api";
import { channelUrl } from "@/lib/url";

interface MyRoom { id?: string; room_id?: string; name: string; photo_url: string | null; unread_count?: number }

const PLUGIN_ITEMS = [
  { type: "ecommerce", label: "E-commerce Plugin", icon: IoCartOutline, color: "bg-emerald-500", desc: "Connect your online store" },
  { type: "service",   label: "Service Plugin",    icon: IoBriefcaseOutline, color: "bg-blue-500",    desc: "Connect your services" },
  { type: "ai_agent",  label: "AI Agent Plugin",   icon: IoHardwareChipOutline, color: "bg-purple-500", desc: "Connect your AI agent" },
];

const MORE_ITEMS = [
  { icon: IoMegaphoneOutline,  label: "Ads",             href: "/ads" },
  { icon: IoWalletOutline,     label: "Wallet",           href: "/wallet" },
  { icon: IoCubeOutline,       label: "Inventory",        href: "/inventory" },
  { icon: IoStatsChartOutline, label: "Analytics",        href: "/analytics" },
  { icon: IoTimeOutline,       label: "Service History",  href: "/service-history" },
  { icon: IoPersonAddOutline,  label: "Invite a Friend",  href: "/invite" },
  { icon: IoHelpCircleOutline, label: "Help & Feedback",  href: "/help" },
  { icon: IoStarOutline,       label: "Rate Twedot",      external: "https://play.google.com/store/apps/details?id=com.twedot" },
] as const;

export default function MobileNavDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { notify, drawerOpen, closeDrawer } = useUi();
  const { badgeCount: jobBadge } = useJobSocket();
  const hasUnseenStories = useHasUnseenStories();
  const [feedsOpen, setFeedsOpen] = useState(true);
  const [gamesOpen, setGamesOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(true);
  const [myRooms, setMyRooms] = useState<MyRoom[]>([]);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutRef = useRef<HTMLButtonElement>(null);

  const loadRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiGet<MyRoom[]>("/rooms/mine");
      setMyRooms(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => { if (drawerOpen) loadRooms(); }, [drawerOpen, loadRooms]);

  const go = (href: string) => { closeDrawer(); router.push(href); };

  const mainItems = [
    { href: "/stories",     label: "Stories",    icon: IoPlayOutline,          activeIcon: IoPlay,
      badge: hasUnseenStories ? "dot" : null },
    { href: "/nearby",      label: "Nearby",     icon: IoLocationOutline,      activeIcon: IoLocation,      badge: null },
    { href: "/channels",    label: "Channels",   icon: IoChatbubbleOutline,    activeIcon: IoChatbubble,    badge: null },
    { href: "/job-request", label: "Job Request",icon: IoNotificationsOutline, activeIcon: IoNotifications,
      badge: jobBadge > 0 ? String(jobBadge > 99 ? "99+" : jobBadge) : null },
  ];

  if (!drawerOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] sm:hidden" onClick={closeDrawer}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute bottom-0 left-0 top-0 w-[280px] flex flex-col bg-background shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — user profile */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 flex-shrink-0">
          {user?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-feed-bg">
              <IoPersonOutline size={20} className="text-light-text" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-text">{user?.name ?? "You"}</p>
          </div>
          <button onClick={closeDrawer} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-feed-bg">
            <IoCloseOutline size={20} className="text-light-text" />
          </button>
        </div>

        {/* Scrollable nav content */}
        <nav className="no-scrollbar flex-1 overflow-y-auto py-3">

          {/* Main items */}
          {mainItems.map(item => {
            const active = pathname === item.href;
            const Icon = active ? item.activeIcon : item.icon;
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-left text-[14px] font-semibold ${active ? "text-text" : "text-light-text hover:bg-feed-bg"}`}
              >
                <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <Icon size={20} className={active ? "text-text" : "text-light-text"} />
                  {item.badge === "dot" && !active && (
                    <span className="absolute -right-0.5 -top-0.5 h-[10px] w-[10px] rounded-full border-2 border-background bg-[#FF3B30]" />
                  )}
                  {item.badge && item.badge !== "dot" && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-background bg-[#FF3B30] px-[3px] text-[9px] font-bold leading-none text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.label}
              </button>
            );
          })}

          {/* Create Channel */}
          <button
            onClick={() => go("/channels/create")}
            className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-left text-[14px] font-semibold text-light-text hover:bg-feed-bg"
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <IoAddOutline size={20} className="text-light-text" />
            </span>
            Create Channel
          </button>

          <div className="my-2 border-t border-border" />

          {/* My Channels */}
          <div className="flex items-center justify-between px-4 py-1.5">
            <button
              onClick={() => setFeedsOpen(v => !v)}
              className="flex flex-1 items-center justify-between text-left text-[10px] font-bold uppercase tracking-wide text-light-text hover:text-text"
            >
              My Channels
              {feedsOpen ? <IoChevronUpOutline size={12} /> : <IoChevronDownOutline size={12} />}
            </button>
            <button onClick={() => go("/channels")} className="ml-2 text-[10px] font-medium text-primary hover:underline">
              See all
            </button>
          </div>
          {feedsOpen && myRooms.length === 0 && (
            <button onClick={() => go("/channels")} className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-[12px] text-light-text hover:bg-feed-bg">
              <IoCompassOutline size={14} className="flex-shrink-0 text-light-text" />
              Discover channels
            </button>
          )}
          {feedsOpen && myRooms.map(room => {
            const rid = room.id ?? room.room_id ?? "";
            const cUrl = channelUrl(room.name ?? "", rid);
            return (
              <button
                key={rid}
                onClick={() => go(cUrl)}
                className={`flex w-full items-center gap-2 rounded-lg px-4 py-1.5 text-left text-[13px] font-semibold hover:bg-feed-bg ${pathname === cUrl ? "text-primary" : "text-text"}`}
              >
                {room.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={room.photo_url} alt={room.name} className="h-6 w-6 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">#</span>
                )}
                <span className="min-w-0 flex-1 truncate">{room.name}</span>
                {(room.unread_count ?? 0) > 0 && (
                  <span className="flex-shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {(room.unread_count ?? 0) > 99 ? "99+" : room.unread_count}
                  </span>
                )}
              </button>
            );
          })}

          <div className="my-2 border-t border-border" />

          {/* Twedot Plugins */}
          <button
            onClick={() => setGamesOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-light-text hover:bg-feed-bg"
          >
            Twedot Plugins
            {gamesOpen ? <IoChevronUpOutline size={14} /> : <IoChevronDownOutline size={14} />}
          </button>
          {gamesOpen && (
            <>
              {PLUGIN_ITEMS.map(p => (
                <button key={p.type} onClick={() => go(`/plugins?type=${p.type}`)} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-[13px] font-semibold text-light-text hover:bg-feed-bg">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${p.color}`}>
                    <p.icon size={14} className="text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{p.label}</div>
                    <div className="truncate text-[11px] text-light-text">{p.desc}</div>
                  </span>
                </button>
              ))}
              <button onClick={() => go("/plugins")} className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2 text-left text-[14px] font-semibold text-light-text hover:bg-feed-bg">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <IoGameControllerOutline size={20} className="text-light-text" />
                </span>
                Manage Plugins
              </button>
            </>
          )}

          <div className="my-2 border-t border-border" />

          {/* More */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-light-text hover:bg-feed-bg"
          >
            More
            {moreOpen ? <IoChevronUpOutline size={12} /> : <IoChevronDownOutline size={12} />}
          </button>
          {moreOpen && MORE_ITEMS.map(item => (
            "href" in item ? (
              <button key={item.label} onClick={() => go(item.href)} className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-left text-[14px] font-semibold ${pathname === item.href ? "text-text" : "text-light-text hover:bg-feed-bg"}`}>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center"><item.icon size={20} /></span>
                {item.label}
              </button>
            ) : (
              <a key={item.label} href={item.external} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-left text-[14px] font-semibold text-light-text hover:bg-feed-bg">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center"><item.icon size={20} /></span>
                {item.label}
              </a>
            )
          ))}
        </nav>

        {/* Bottom: Settings + Logout */}
        <div className="flex-shrink-0 border-t border-border">
          <button
            onClick={() => go("/settings")}
            className={`flex w-full items-center gap-3.5 px-4 py-3 text-left text-[14px] font-semibold ${pathname.startsWith("/settings") ? "text-text" : "text-light-text hover:bg-feed-bg"}`}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              {pathname.startsWith("/settings") ? <IoSettings size={20} /> : <IoSettingsOutline size={20} className="text-light-text" />}
            </span>
            Settings
          </button>
          <button
            ref={logoutRef}
            onClick={() => setShowLogout(true)}
            className="flex w-full items-center gap-3.5 px-4 py-3 text-left text-[14px] font-semibold text-light-text hover:bg-feed-bg hover:text-red-500"
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <IoLogOutOutline size={20} />
            </span>
            Logout
          </button>
        </div>
      </div>

      {/* Logout confirm */}
      {showLogout && (
        <div className="absolute inset-0 flex items-end justify-center p-4" onClick={e => e.stopPropagation()}>
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="px-4 py-3">
              <p className="text-[13px] font-bold text-text">Log out of Twedot?</p>
              <p className="text-[12px] text-light-text">You can log back in any time.</p>
            </div>
            <div className="border-t border-border">
              <button
                disabled={loggingOut}
                onClick={async () => {
                  setLoggingOut(true);
                  await logout();
                  closeDrawer();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-500 hover:bg-feed-bg disabled:opacity-60"
              >
                <IoLogOutOutline size={16} />
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
              <button
                disabled={loggingOut}
                onClick={() => setShowLogout(false)}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-[13px] font-semibold text-text hover:bg-feed-bg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
