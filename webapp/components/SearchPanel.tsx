"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IoSearchOutline, IoPersonOutline } from "react-icons/io5";
import { apiGet } from "@/lib/api";
import RankBadge from "./RankBadge";
import { useUi } from "@/lib/UiContext";
import { profileUrl } from "@/lib/url";

interface UserResult {
  id: string;
  name: string;
  profile_photo_url: string | null;
  occupation: string | null;
  global_activity_score: number;
  rank_visible: boolean;
}

const RECENT_KEY = "tw_recent_searches";

function loadRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function removeRecentSearch(term: string) {
  try {
    const updated = loadRecentSearches().filter((s) => s !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

interface InventoryItem {
  id: string;
  title: string;
  price: number;
  type: "product" | "service";
  images: { image_url: string }[];
}

const FOOTER_LINKS = [
  { label: "About", href: null },
  { label: "Help", href: null },
  { label: "Privacy Policy & Terms of Service", href: "https://twedot.com/privacy" },
];

function SearchPanelInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { notify } = useUi();
  const q = params.get("q") ?? "";

  const [users, setUsers] = useState<UserResult[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadRecentSearches());
  }, [q]);

  useEffect(() => {
    setUsers([]);
    setItems([]);
    if (!q.trim()) return;

    Promise.allSettled([
      apiGet<UserResult[]>(`/users/find?q=${encodeURIComponent(q)}&limit=5`),
      apiGet<InventoryItem[]>(`/inventory/public-search?q=${encodeURIComponent(q)}&limit=4`),
    ]).then(([usersRes, itemsRes]) => {
      setUsers(usersRes.status === "fulfilled" && Array.isArray(usersRes.value) ? usersRes.value : []);
      setItems(itemsRes.status === "fulfilled" && Array.isArray(itemsRes.value) ? itemsRes.value : []);
    });
  }, [q]);

  if (!q.trim()) return null;

  return (
    <aside className="sticky top-14 hidden h-fit w-[340px] flex-shrink-0 self-start py-4 pl-4 pr-3 lg:block xl:w-[360px] 2xl:w-[360px] 2xl:pl-8">

      {/* Search history */}
      {history.length > 0 && (
        <div className="mb-3 rounded-2xl bg-feed-bg px-4 py-3">
          <h2 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-light-text">
            Search history
          </h2>
          <div className="flex flex-col gap-0.5">
            {history.slice(0, 5).map((term) => (
              <div key={term} className="flex items-center gap-2 rounded-lg hover:bg-background/60">
                <button
                  onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                  className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left"
                >
                  <IoSearchOutline size={12} className="flex-shrink-0 text-light-text" />
                  <span className="truncate text-[12px] text-text">{term}</span>
                </button>
                <button
                  onClick={() => { removeRecentSearch(term); setHistory((h) => h.filter((s) => s !== term)); }}
                  className="pr-2 text-[10px] text-light-text hover:text-text"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching profiles */}
      {users.length > 0 && (
        <div className="mb-3 rounded-2xl bg-feed-bg px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-light-text">
              Profiles
            </h2>
            <button
              onClick={() => router.push(`/search?q=${encodeURIComponent(q)}&type=users`)}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              See all
            </button>
          </div>
          <div className="flex flex-col">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(profileUrl(u.name, u.id))}
                className="flex items-center gap-2.5 py-2.5 text-left hover:opacity-80"
              >
                {u.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.profile_photo_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-border/60">
                    <IoPersonOutline size={14} className="text-light-text" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[11px] font-semibold text-text">{u.name}</p>
                    <RankBadge activityScore={u.global_activity_score ?? 0} rankVisible={u.rank_visible ?? true} />
                  </div>
                  {u.occupation && (
                    <p className="truncate text-[10px] text-light-text">{u.occupation}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matching products & services */}
      {items.length > 0 && (
        <div className="mb-3 rounded-2xl bg-feed-bg px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-light-text">
              Products &amp; Services
            </h2>
            <button
              onClick={() => router.push(`/search?q=${encodeURIComponent(q)}&type=products`)}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              See all
            </button>
          </div>
          <div className="flex flex-col">
            {items.map((item) => {
              const img = item.images?.[0]?.image_url ?? null;
              return (
                <div key={item.id} className="flex items-center gap-2.5 py-2.5">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-border/60">
                      <IoSearchOutline size={14} className="text-light-text" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-text">{item.title}</p>
                    <p className="text-[10px] text-light-text capitalize">{item.type}</p>
                    {item.price > 0 && (
                      <p className="text-[10px] font-medium text-primary">₦{item.price.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <nav className="flex flex-wrap gap-x-3 gap-y-2 px-2 pt-1 text-[9px] text-light-text">
        {FOOTER_LINKS.map((link) =>
          link.href ? (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {link.label}
            </a>
          ) : (
            <button key={link.label} onClick={() => notify(`${link.label} is coming soon`)} className="hover:underline">
              {link.label}
            </button>
          )
        )}
      </nav>
    </aside>
  );
}

export default function SearchPanel() {
  return (
    <Suspense fallback={null}>
      <SearchPanelInner />
    </Suspense>
  );
}
