"use client";

import { useEffect, useRef, useState } from "react";
import { IoLocationOutline } from "react-icons/io5";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

export interface LocationSelection {
  address: string;
  state: string | null;
  lat: number;
  lng: number;
}

async function fetchSuggestions(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "7",
  });
  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { "Accept-Language": "en" },
  });
  if (!res.ok) return [];
  return res.json();
}

function formatLabel(displayName: string) {
  const parts = displayName.split(",").map((p) => p.trim());
  return {
    main: parts.slice(0, 2).join(", "),
    rest: parts.slice(2).join(", "),
  };
}

interface Props {
  value: string;
  onChange: (loc: LocationSelection) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onTextChange,
  placeholder = "Location (e.g. Lagos, Ikeja)",
  className = "",
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    const onClickOut = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onTextChange?.(q);
    setSuggestions([]);
    setOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchSuggestions(q);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        // network error — fail silently
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(item: NominatimResult) {
    const parts = item.display_name.split(",").map((p) => p.trim());
    const shortAddress = parts.slice(0, 3).join(", ");
    const addr = item.address ?? {};
    const rawState = addr.state ?? addr.region ?? null;
    setQuery(shortAddress);
    setOpen(false);
    setSuggestions([]);
    onTextChange?.(shortAddress);
    onChange({ address: shortAddress, state: rawState, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <IoLocationOutline size={14} className="text-light-text flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 rounded-xl bg-feed-bg px-3 py-2 text-[12px] text-text outline-none placeholder-light-text border border-transparent focus:border-primary/50"
        />
        {loading && (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-border border-t-primary animate-spin flex-shrink-0" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1">
          {suggestions.map((item) => {
            const { main, rest } = formatLabel(item.display_name);
            return (
              <li key={item.place_id}>
                <button
                  type="button"
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-feed-bg transition-colors text-left"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                >
                  <IoLocationOutline size={13} className="text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[12px] font-semibold text-text leading-tight">{main}</span>
                    {rest && <span className="text-[11px] text-light-text mt-0.5 truncate">{rest}</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
