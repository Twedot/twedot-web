"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IoLogOutOutline,
  IoChevronUpOutline,
  IoChevronDownOutline,
  IoGameControllerOutline,
  IoMenuOutline,
  IoPlay,
  IoPlayOutline,
  IoNotifications,
  IoNotificationsOutline,
  IoChatbubble,
  IoChatbubbleOutline,
  IoWalletOutline,
  IoStatsChartOutline,
  IoPersonAddOutline,
  IoHelpCircleOutline,
  IoStarOutline,
  IoTimeOutline,
  IoMegaphoneOutline,
  IoSettings,
  IoSettingsOutline,
  IoAddOutline,
  IoCartOutline,
  IoBriefcaseOutline,
  IoHardwareChipOutline,
} from "react-icons/io5";
import { IoLocationOutline, IoLocation } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useHasUnseenStories } from "@/lib/unseenStories";
import { useJobSocket } from "@/lib/jobSocket";

const mainItems = [
  { href: "/feed", label: "Stories", icon: IoPlayOutline, activeIcon: IoPlay },
  { href: "/nearby", label: "Nearby", icon: IoLocationOutline, activeIcon: IoLocation },
  { label: "Chats", icon: IoChatbubbleOutline, activeIcon: IoChatbubble },
  { href: "/job-request", label: "Job Request", icon: IoNotificationsOutline, activeIcon: IoNotifications },
];

const PLUGIN_ITEMS = [
  { type: "ecommerce", label: "E-commerce Plugin", icon: IoCartOutline, color: "bg-emerald-500", desc: "Connect your online store" },
  { type: "service", label: "Service Plugin", icon: IoBriefcaseOutline, color: "bg-blue-500", desc: "Connect your services" },
  { type: "ai_agent", label: "AI Agent Plugin", icon: IoHardwareChipOutline, color: "bg-purple-500", desc: "Connect your AI agent" },
];

const activeChannels = [
  { label: "General", roomCount: 4 },
  { label: "Tech Talk", roomCount: 2 },
  { label: "Naija Hustle", roomCount: 0 },
  { label: "Music & Vibes", roomCount: 3 },
  { label: "Sports Zone", roomCount: 0 },
];

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar, notify } = useUi();
  const hasUnseenStories = useHasUnseenStories();
  const { badgeCount: jobBadge } = useJobSocket();
  const [gamesOpen, setGamesOpen] = useState(true);
  const [feedsOpen, setFeedsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const width = sidebarCollapsed ? "w-[68px]" : "w-[280px]";

  return (
    <div className="sticky top-14 hidden flex-shrink-0 lg:block">
      <nav
        className={`no-scrollbar sticky top-14 h-[calc(100vh-3.5rem)] ${width} flex flex-col gap-0 overflow-y-auto border-r border-border bg-background p-0 transition-[width] duration-150`}
      >
        {/* centered wrapper — equal left/right margin so items sit in the middle of the column */}
        <div className={`mx-auto flex flex-1 flex-col gap-0 pb-3 pt-4 ${sidebarCollapsed ? "w-full px-1" : "w-[85%]"}`}>

        {mainItems.map((item) => {
          const active = Boolean(item.href && pathname === item.href);
          const Icon = active ? item.activeIcon : item.icon;
          const cls = `flex items-center gap-3.5 rounded-lg px-3 py-2 text-left text-sm font-normal ${
            active ? "font-semibold text-text" : "text-text hover:bg-feed-bg"
          } ${sidebarCollapsed ? "justify-center px-0" : ""}`;
          const inner = (
            <>
              <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <Icon size={20} className={active ? "text-text" : "text-light-text"} />
                {item.label === "Stories" && hasUnseenStories && !active && (
                  <span className="absolute -right-0.5 -top-0.5 h-[10px] w-[10px] rounded-full border-2 border-white bg-[#FF3B30]" />
                )}
                {item.label === "Job Request" && jobBadge === 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-[11px] w-[11px] rounded-full border-2 border-white bg-[#FF3B30]" />
                )}
                {item.label === "Job Request" && jobBadge > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#FF3B30] px-[3px] text-[9px] font-bold leading-none text-white">
                    {jobBadge > 99 ? "99+" : jobBadge}
                  </span>
                )}
              </span>
              {!sidebarCollapsed && item.label}
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} title={item.label} className={cls}>
              {inner}
            </Link>
          ) : (
            <button
              key={item.label}
              onClick={() => notify(`${item.label} is coming soon`)}
              title={item.label}
              className={cls}
            >
              {inner}
            </button>
          );
        })}

        <button
          onClick={() => notify("Creating a channel is coming soon")}
          title="Create Channel"
          className={`flex items-center gap-3.5 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg ${
            sidebarCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <IoAddOutline size={20} className="text-light-text" />
          </span>
          {!sidebarCollapsed && "Create Channel"}
        </button>

        <div className="my-2 border-t border-border" />

        {sidebarCollapsed ? (
          <>
            <button
              onClick={() => notify("Channels are coming soon")}
              title="Active Channels"
              className="flex items-center justify-center rounded-lg px-0 py-2.5 text-text hover:bg-feed-bg"
            >
              <span className="text-lg font-bold text-light-text">#</span>
            </button>
            <Link
              href="/plugins"
              title="Twedot Plugins"
              className={`flex items-center justify-center rounded-lg px-0 py-2.5 hover:bg-feed-bg ${pathname.startsWith("/plugins") ? "text-primary" : "text-text"}`}
            >
              <IoGameControllerOutline size={22} />
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={() => setFeedsOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-light-text hover:bg-feed-bg"
            >
              Active Channels
              {feedsOpen ? <IoChevronUpOutline size={12} /> : <IoChevronDownOutline size={12} />}
            </button>

            {feedsOpen &&
              activeChannels.filter((c) => c.roomCount > 0).map((channel) => (
                <button
                  key={channel.label}
                  onClick={() => notify(`${channel.label} is coming soon`)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-normal text-text hover:bg-feed-bg"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg text-xs font-bold text-light-text">
                    #
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{channel.label}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-normal text-light-text">
                      <span>{channel.roomCount} rooms</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          channel.roomCount > 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span>active</span>
                    </div>
                  </div>
                </button>
              ))}

            <div className="my-2 border-t border-border" />

            <button
              onClick={() => setGamesOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-light-text hover:bg-feed-bg"
            >
              Twedot Plugins
              {gamesOpen ? <IoChevronUpOutline size={14} /> : <IoChevronDownOutline size={14} />}
            </button>

            {gamesOpen && (
              <>
                {PLUGIN_ITEMS.map((p) => {
                  const PluginIcon = p.icon;
                  return (
                    <Link
                      key={p.type}
                      href={`/plugins?type=${p.type}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg"
                    >
                      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${p.color}`}>
                        <PluginIcon size={14} className="text-white" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{p.label}</div>
                        <div className="truncate text-[11px] text-light-text">{p.desc}</div>
                      </span>
                    </Link>
                  );
                })}

                <Link
                  href="/plugins"
                  className="flex items-center gap-3.5 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <IoGameControllerOutline size={20} className="text-light-text" />
                  </span>
                  Manage Plugins
                </Link>
              </>
            )}
          </>
        )}

        {!sidebarCollapsed && (
          <>
            <div className="my-2 border-t border-border" />

            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-light-text hover:bg-feed-bg"
            >
              More
              {settingsOpen ? <IoChevronUpOutline size={12} /> : <IoChevronDownOutline size={12} />}
            </button>

            {settingsOpen && (
              <>
                {[
                  { icon: IoMegaphoneOutline, label: "Ads" },
                  { icon: IoWalletOutline, label: "Wallet" },
                  { icon: IoStatsChartOutline, label: "Analytics" },
                  { icon: IoTimeOutline, label: "Service History", href: "/job-request" },
                  { icon: IoPersonAddOutline, label: "Invite a Friend" },
                  { icon: IoHelpCircleOutline, label: "Help & Feedback" },
                  { icon: IoStarOutline, label: "Rate Twedot", external: "https://play.google.com/store/apps/details?id=com.twedot" },
                ].map(({ icon: Icon, label, href, external }: { icon: React.ElementType; label: string; href?: string; external?: string }) =>
                  href ? (
                    <Link
                      key={label}
                      href={href}
                      className={`flex items-center gap-3.5 rounded-lg px-3 py-2 text-left text-sm font-normal ${
                        pathname === href ? "font-semibold text-text" : "text-text hover:bg-feed-bg"
                      }`}
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <Icon size={20} className="text-light-text" />
                      </span>
                      {label}
                    </Link>
                  ) : external ? (
                    <a
                      key={label}
                      href={external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <Icon size={20} className="text-light-text" />
                      </span>
                      {label}
                    </a>
                  ) : (
                    <button
                      key={label}
                      onClick={() => notify(`${label} is coming soon`)}
                      className="flex items-center gap-3.5 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg"
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <Icon size={20} className="text-light-text" />
                      </span>
                      {label}
                    </button>
                  )
                )}
              </>
            )}
          </>
        )}

        <div className="mt-auto border-t border-border pt-2">
          <Link
            href="/settings"
            title="Settings"
            className={`flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-left text-sm font-normal ${
              pathname.startsWith("/settings") ? "font-semibold text-text" : "text-light-text hover:bg-feed-bg hover:text-text"
            } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              {pathname.startsWith("/settings") ? (
                <IoSettings size={20} />
              ) : (
                <IoSettingsOutline size={20} />
              )}
            </span>
            {!sidebarCollapsed && "Settings"}
          </Link>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            title="Logout"
            className={`flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-left text-sm font-normal text-light-text hover:bg-feed-bg hover:text-red-500 ${
              sidebarCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <IoLogOutOutline size={20} />
            </span>
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>

        </div>{/* end centered wrapper */}
      </nav>

      {/* fixed at vertical midpoint of sidebar's right border — never scrolls */}
      <button
        onClick={toggleSidebar}
        title="Collapse sidebar"
        style={{ top: '50vh', left: sidebarCollapsed ? '52px' : '264px' }}
        className="fixed z-40 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-light-text shadow-sm hover:bg-feed-bg transition-[left] duration-150"
      >
        <IoMenuOutline size={16} />
      </button>
    </div>
  );
}
