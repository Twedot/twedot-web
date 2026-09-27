"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoNotificationsOutline, IoChatbubbleOutline, IoSearchOutline } from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const { notify } = useUi();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/feed?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-white px-6">
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          onClick={() => router.push("/feed")}
          className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-primary"
        >
          <span className="hidden sm:inline">Twedot</span>
        </button>
      </div>

      <form
        onSubmit={handleSearch}
        className="absolute left-1/2 w-full max-w-xl -translate-x-1/2 px-4"
      >
        <div className="flex items-center gap-2 rounded-full border border-border bg-feed-bg px-4 py-2 focus-within:border-primary">
          <IoSearchOutline size={18} className="flex-shrink-0 text-light-text" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Twedot"
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-light-text"
          />
        </div>
      </form>

      <div className="ml-auto flex flex-shrink-0 items-center gap-2">
        <button
          onClick={() => notify("Messages are coming soon")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-feed-bg"
        >
          <IoChatbubbleOutline size={19} />
        </button>

        <button
          onClick={() => notify("Post composer is coming soon")}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-text hover:bg-feed-bg"
        >
          <MdOutlineAddBox size={18} />
          Create
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-feed-bg">
          <IoNotificationsOutline size={20} />
        </button>

        {user?.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profile_photo_url}
            alt={user.name ?? ""}
            className="h-8 w-8 cursor-pointer rounded-full object-cover"
            onClick={() => router.push("/profile")}
          />
        ) : (
          <div
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
            onClick={() => router.push("/profile")}
          >
            {(user?.name ?? "T").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
