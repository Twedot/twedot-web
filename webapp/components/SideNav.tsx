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
} from "react-icons/io5";
import { MdEngineering, MdOutlineEngineering } from "react-icons/md";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { useHasUnseenStories } from "@/lib/unseenStories";

// Stories/Inbox use Ionicons on mobile too, which genuinely ships an outline glyph for
// the inactive state (play-outline/notifications-outline) — so those switch shape, not
// just color, matching app/(tabs)/_layout.tsx exactly.
//
// Nearby/Chats are custom art on mobile (worker.svg/chat.svg) with no outline variant
// at all — can't do a real outline swap with the actual asset. Swapped to icon-library
// equivalents that do have both states: Chats reuses the same IoChatbubble(Outline)
// TopBar already uses for messages, Nearby uses Material's hard-hat "engineering" glyph
// (closest available match to the Worker icon's meaning) since it ships outline/filled.
// Profile (rendered separately below) keeps the real person.svg/person-active.svg —
// same no-outline-asset limitation, but it's not part of this inline-icon fix.
const mainItems = [
  { href: "/feed", label: "Stories", icon: IoPlayOutline, activeIcon: IoPlay },
  { href: "/nearby", label: "Nearby", icon: MdOutlineEngineering, activeIcon: MdEngineering },
  { label: "Chats", icon: IoChatbubbleOutline, activeIcon: IoChatbubble },
  { href: "/inbox", label: "Inbox", icon: IoNotificationsOutline, activeIcon: IoNotifications },
];

const games = [
  { label: "Auto Forge", color: "bg-orange-400" },
  { label: "Guess Moby's Game", color: "bg-sky-400" },
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
  const [gamesOpen, setGamesOpen] = useState(true);
  const [feedsOpen, setFeedsOpen] = useState(true);

  const width = sidebarCollapsed ? "w-[68px]" : "w-[280px]";

  return (
    <div className="sticky top-14 hidden flex-shrink-0 lg:block">
      <nav
        className={`no-scrollbar sticky top-14 h-[calc(100vh-3.5rem)] ${width} flex flex-col gap-0 overflow-y-auto border-r border-border bg-white p-0 transition-[width] duration-150`}
      >
        {/* centered wrapper — equal left/right margin so items sit in the middle of the column */}
        <div className={`mx-auto flex flex-1 flex-col gap-0 pb-3 pt-4 ${sidebarCollapsed ? "w-full px-1" : "w-[85%]"}`}>

        {mainItems.map((item) => {
          const active = Boolean(item.href && pathname === item.href);
          const Icon = active ? item.activeIcon : item.icon;
          const cls = `flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal ${
            active ? "font-semibold text-text" : "text-text hover:bg-feed-bg"
          } ${sidebarCollapsed ? "justify-center px-0" : ""}`;
          const inner = (
            <>
              <span className="relative flex-shrink-0">
                <Icon size={19} className={active ? "text-text" : "text-light-text"} />
                {item.label === "Stories" && hasUnseenStories && !active && (
                  <span className="absolute -right-0.5 -top-0.5 h-[10px] w-[10px] rounded-full border-2 border-white bg-[#FF3B30]" />
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
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg ${
            sidebarCollapsed ? "justify-center px-0" : ""
          }`}
        >
          {/* No /channels route exists yet, so this can never register as "active" —
              same grey-by-default, purple-only-when-active rule as every other icon. */}
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-feed-bg text-[13px] font-bold text-light-text">
            #
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
            <button
              onClick={() => notify("Plugins are coming soon")}
              title="Twedot Plugins"
              className="flex items-center justify-center rounded-lg px-0 py-2.5 text-text hover:bg-feed-bg"
            >
              <IoGameControllerOutline size={22} />
            </button>
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
              activeChannels.map((channel) => (
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
                <button
                  onClick={() => notify("Marble Mazes is coming soon")}
                  className="relative flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary to-[#8b6bff] px-2 py-2.5 text-left"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/70">
                    <IoGameControllerOutline size={16} className="text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">Marble Mazes</div>
                    <div className="truncate text-xs text-white/80">Roll to the goal!</div>
                  </span>
                  <span className="absolute right-2 top-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    NEW
                  </span>
                </button>

                {games.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => notify(`${g.label} is coming soon`)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg"
                  >
                    <span className={`h-7 w-7 flex-shrink-0 rounded-full ${g.color}`} />
                    <span className="min-w-0 flex-1 truncate">{g.label}</span>
                  </button>
                ))}

                <button
                  onClick={() => notify("More games are coming soon")}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-normal text-text hover:bg-feed-bg"
                >
                  <IoGameControllerOutline size={22} className="flex-shrink-0" />
                  Discover More
                </button>
              </>
            )}
          </>
        )}

        <div className="mt-auto border-t border-border pt-2">
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
            <IoLogOutOutline size={22} className="flex-shrink-0" />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>

        </div>{/* end centered wrapper */}
      </nav>

      {/* fixed at vertical midpoint of sidebar's right border — never scrolls */}
      <button
        onClick={toggleSidebar}
        title="Collapse sidebar"
        style={{ top: '50vh', left: sidebarCollapsed ? '60px' : '272px' }}
        className="fixed z-30 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-light-text shadow-sm hover:bg-feed-bg transition-[left] duration-150"
      >
        <IoMenuOutline size={16} />
      </button>
    </div>
  );
}
