"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IoSearchOutline, IoPersonOutline } from "react-icons/io5";
import { apiGet } from "@/lib/api";
import RankBadge from "./RankBadge";
import { useUi } from "@/lib/UiContext";

interface UserResult {
  id: string;
  name: string;
  profile_photo_url: string | null;
  occupation: string | null;
  global_activity_score: number;
  rank_visible: boolean;
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

function relatedQueries(q: string): { label: string; q: string; type?: string }[] {
  return [
    { label: `${q} near me`,       q,             type: undefined  },
    { label: `${q} professionals`, q,             type: "users"    },
    { label: `best ${q}`,          q,             type: undefined  },
    { label: `${q} services`,      q,             type: "services" },
    { label: `${q} products`,      q,             type: "products" },
  ];
}

function SearchPanelInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { notify } = useUi();
  const q = params.get("q") ?? "";

  const [users, setUsers] = useState<UserResult[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);

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
    <aside className="sticky top-14 hidden h-fit w-[340px] flex-shrink-0 self-start py-4 pr-4 2xl:block">

      {/* Related searches */}
      <div className="mb-3 rounded-2xl bg-feed-bg px-4 py-3">
        <h2 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-light-text">
          Related searches
        </h2>
        <div className="flex flex-col gap-1.5">
          {relatedQueries(q).map((rq) => {
            const url = rq.type
              ? `/search?q=${encodeURIComponent(rq.q)}&type=${rq.type}`
              : `/search?q=${encodeURIComponent(rq.q)}`;
            return (
              <button
                key={rq.label}
                onClick={() => router.push(url)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white"
              >
                <IoSearchOutline size={12} className="flex-shrink-0 text-light-text" />
                <span className="text-[12px] text-text">{rq.label}</span>
              </button>
            );
          })}
        </div>
      </div>

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
          <div className="flex flex-col divide-y divide-border/40">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(`/profile/${u.id}`)}
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
          <div className="flex flex-col divide-y divide-border/40">
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
