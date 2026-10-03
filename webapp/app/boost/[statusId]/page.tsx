"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IoInformationCircle, IoClose, IoAdd, IoRemove, IoChevronDown, IoChevronUp, IoCheckmark,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiPost } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

type AudienceType = "nearby" | "city" | "country";

interface BoostQuote {
  audienceSize: number; impressionsMin: number; impressionsMax: number;
  effectiveReach: number; costCredits: number; durationDays: number; balance: number;
}

const MIN_DURATION = 1;
const MAX_DURATION = 30;
const REACH_STEP = 50;
const MIN_REACH = 450;

const AUDIENCE_OPTIONS = [
  { type: "nearby" as AudienceType, label: "Automatic", sublabel: "Twedot targets people near you", needsValue: false },
  { type: "city" as AudienceType, label: "City", sublabel: "One or more cities you choose", needsValue: true, placeholder: "e.g. Lagos, Abuja" },
  { type: "country" as AudienceType, label: "Country", sublabel: "One or more countries you choose", needsValue: true, placeholder: "e.g. Nigeria, Ghana" },
];

const TARGETING_PRESETS = ["Fashion", "Food", "Technology", "Beauty", "Business", "Fitness", "Events", "Services", "Shopping"];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

export default function BoostPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const params = useParams();
  const statusId = params.statusId as string;

  const [duration, setDuration] = useState(7);
  const [durationText, setDurationText] = useState("7");
  const [audienceType, setAudienceType] = useState<AudienceType>("nearby");
  const [cityTags, setCityTags] = useState<string[]>([]);
  const [countryTags, setCountryTags] = useState<string[]>([]);
  const [audienceInput, setAudienceInput] = useState("");
  const [targetingOpen, setTargetingOpen] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [otherActive, setOtherActive] = useState(false);
  const [otherTags, setOtherTags] = useState<string[]>([]);
  const [otherInput, setOtherInput] = useState("");
  const [quote, setQuote] = useState<BoostQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [reachOverride, setReachOverride] = useState<number | null>(null);
  const [displayReach, setDisplayReach] = useState<number | null>(null);
  const displayReachRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => { if (!isLoading && !isAuthenticated) router.replace("/login"); }, [isLoading, isAuthenticated, router]);
  useEffect(() => { displayReachRef.current = displayReach; }, [displayReach]);

  const audienceTags = audienceType === "city" ? cityTags : audienceType === "country" ? countryTags : [];
  const setAudienceTags = audienceType === "city" ? setCityTags : setCountryTags;
  const selectedAudience = AUDIENCE_OPTIONS.find(a => a.type === audienceType)!;
  const audienceIsValid = !selectedAudience.needsValue || audienceTags.length > 0;
  const targeting = [...selectedPresets, ...(otherActive ? otherTags : [])];

  const adjustReach = useCallback((delta: number) => {
    const base = displayReachRef.current ?? quote?.effectiveReach ?? MIN_REACH;
    const next = Math.max(MIN_REACH, base + delta);
    displayReachRef.current = next;
    setDisplayReach(next);
    setReachOverride(next);
  }, [quote?.effectiveReach]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!audienceIsValid || !statusId) { setQuote(null); setQuoting(false); return; }
    setQuoting(true);
    const id = ++reqIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const audienceValue = selectedAudience.needsValue ? audienceTags : null;
        const result = await apiPost<BoostQuote>("/boost/quote", {
          statusId, durationDays: duration, audienceType, audienceValue, targeting,
          ...(reachOverride != null ? { desiredReach: reachOverride } : {}),
        });
        if (id !== reqIdRef.current) return;
        setQuote(result);
        if (result) setDisplayReach(result.effectiveReach);
      } catch { /* ignore */ }
      setQuoting(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusId, duration, audienceType, cityTags, countryTags, selectedPresets, otherActive, otherTags, reachOverride]);

  const addAudienceTag = () => {
    const t = audienceInput.trim();
    if (t && !audienceTags.includes(t)) setAudienceTags(prev => [...prev, t]);
    setAudienceInput("");
  };
  const addOtherTag = () => {
    const t = otherInput.trim();
    if (t && !otherTags.includes(t)) setOtherTags(prev => [...prev, t]);
    setOtherInput("");
  };

  const shownReach = displayReach ?? quote?.effectiveReach ?? null;
  const shownMin = shownReach != null ? Math.round(shownReach * 0.85) : 0;
  const shownMax = shownReach != null ? Math.round(shownReach * 1.15) : 0;
  const reachFraction = quote && quote.audienceSize > 0 ? Math.min(1, shownMax / quote.audienceSize) : 0;
  const canAfford = quote != null && quote.balance >= quote.costCredits;

  const handleBoost = async () => {
    if (boosting || !quote) return;
    if (!canAfford) { router.push("/wallet/buy-credits"); return; }
    setBoosting(true);
    try {
      const audienceValue = selectedAudience.needsValue ? audienceTags : null;
      const result = await apiPost<{ ok?: boolean; error?: string }>(`/boost/${statusId}`, {
        durationDays: duration, audienceType, audienceValue, targeting,
        ...(reachOverride != null ? { desiredReach: reachOverride } : {}),
      });
      if ((result as any)?.error) { notify((result as any).error); return; }
      notify("Post boosted!");
      router.back();
    } catch { notify("Could not boost this post — please try again"); }
    finally { setBoosting(false); }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
          <IoInformationCircle size={17} className="flex-shrink-0 text-primary" />
          <p className="text-[13px] font-bold text-text">Boost your post to reach more people</p>
        </div>
        <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg transition-colors">
          <IoClose size={18} className="text-light-text" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-[500px] flex flex-col gap-5">

          {/* Audience */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.4px] text-light-text">Audience</p>
            <div className="rounded-xl border border-border overflow-hidden">
              {AUDIENCE_OPTIONS.map((a, i) => (
                <div key={a.type}>
                  <button
                    onClick={() => { setAudienceType(a.type); setAudienceInput(""); }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-feed-bg/60 ${i < AUDIENCE_OPTIONS.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-text">{a.label}</p>
                      <p className="text-[11px] text-light-text mt-0.5">{a.sublabel}</p>
                    </div>
                    <div className={`ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${audienceType === a.type ? "border-primary" : "border-border"}`}>
                      {audienceType === a.type && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                  {audienceType === a.type && a.needsValue && (
                    <div className="border-t border-border px-4 pb-3 pt-2 bg-feed-bg/30">
                      <input
                        autoFocus
                        type="text"
                        placeholder={a.placeholder}
                        value={audienceInput}
                        onChange={e => setAudienceInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addAudienceTag()}
                        className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-light-text/50"
                      />
                      {audienceTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {audienceTags.map((tag, ti) => (
                            <span key={ti} className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              {tag}
                              <button onClick={() => setAudienceTags(prev => prev.filter((_, j) => j !== ti))}>
                                <IoClose size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Targeting */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.4px] text-light-text">Targeting (optional)</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setTargetingOpen(o => !o)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-feed-bg/60 ${targetingOpen ? "border-b border-border" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text">Categories</p>
                  <p className="text-[11px] text-light-text mt-0.5 truncate">
                    {targeting.length === 0 ? "Anyone — no category filter" : targeting.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}
                  </p>
                </div>
                {targetingOpen ? <IoChevronUp size={16} className="text-light-text ml-2 flex-shrink-0" /> : <IoChevronDown size={16} className="text-light-text ml-2 flex-shrink-0" />}
              </button>
              {targetingOpen && (
                <>
                  {TARGETING_PRESETS.map((label, i) => {
                    const active = selectedPresets.includes(label.toLowerCase());
                    return (
                      <button
                        key={label}
                        onClick={() => setSelectedPresets(prev => active ? prev.filter(t => t !== label.toLowerCase()) : [...prev, label.toLowerCase()])}
                        className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-left transition-colors hover:bg-feed-bg/60"
                      >
                        <span className="text-[12px] font-medium text-text">{label}</span>
                        <div className={`h-5 w-5 flex-shrink-0 rounded-[5px] border-2 flex items-center justify-center transition-colors ${active ? "border-primary bg-primary" : "border-border"}`}>
                          {active && <IoCheckmark size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setOtherActive(a => !a)}
                    className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-left transition-colors hover:bg-feed-bg/60"
                  >
                    <span className="text-[12px] font-medium text-text">Other</span>
                    <div className={`h-5 w-5 flex-shrink-0 rounded-[5px] border-2 flex items-center justify-center transition-colors ${otherActive ? "border-primary bg-primary" : "border-border"}`}>
                      {otherActive && <IoCheckmark size={12} className="text-white" />}
                    </div>
                  </button>
                  {otherActive && (
                    <div className="border-t border-border px-4 pb-3 pt-2 bg-feed-bg/30">
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Gadgets"
                        value={otherInput}
                        onChange={e => setOtherInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addOtherTag()}
                        className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-light-text/50"
                      />
                      {otherTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {otherTags.map((tag, ti) => (
                            <span key={ti} className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              {tag}
                              <button onClick={() => setOtherTags(prev => prev.filter((_, j) => j !== ti))}>
                                <IoClose size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.4px] text-light-text">Duration</p>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-feed-bg px-3 py-1">
              <button
                onClick={() => { const n = Math.max(MIN_DURATION, duration - 1); setDuration(n); setDurationText(String(n)); }}
                disabled={duration <= MIN_DURATION}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-border/60 disabled:opacity-40"
              >
                <IoRemove size={15} />
              </button>
              <input
                type="number"
                value={durationText}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setDurationText(v);
                  const n = parseInt(v, 10);
                  if (Number.isFinite(n) && n >= MIN_DURATION && n <= MAX_DURATION) setDuration(n);
                }}
                onBlur={() => setDurationText(String(duration))}
                maxLength={2}
                className="flex-1 bg-transparent py-3 text-center text-[18px] font-bold text-text outline-none"
              />
              <span className="text-[12px] font-semibold text-light-text">{duration === 1 ? "Day" : "Days"}</span>
              <button
                onClick={() => { const n = Math.min(MAX_DURATION, duration + 1); setDuration(n); setDurationText(String(n)); }}
                disabled={duration >= MAX_DURATION}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-border/60 disabled:opacity-40"
              >
                <IoAdd size={15} />
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-light-text">Tap + or − to change · {MIN_DURATION}–{MAX_DURATION} days</p>
          </div>

          {/* Est. People Reached */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.4px] text-light-text">Est. People Reached</p>
            {!quote && quoting ? (
              <div className="h-10 animate-pulse rounded-xl bg-feed-bg" />
            ) : quote ? (
              <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustReach(-REACH_STEP)}
                    disabled={(shownReach ?? 0) <= MIN_REACH}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-border/60 disabled:opacity-40"
                  >
                    <IoRemove size={15} />
                  </button>
                  <p className="flex-1 text-center text-[20px] font-extrabold text-text">{fmt(shownMin)} – {fmt(shownMax)}</p>
                  <button
                    onClick={() => adjustReach(REACH_STEP)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-border/60"
                  >
                    <IoAdd size={15} />
                  </button>
                  <span className="ml-1 text-[11px] text-light-text">of {fmt(quote.audienceSize)}</span>
                </div>
                <div className="mt-2.5 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${reachFraction * 100}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-light-text">Tap + or − to raise reach — cost scales with it</p>
              </>
            ) : (
              <p className="text-[11px] text-light-text">Enter an audience to see your estimated reach.</p>
            )}
          </div>

          {/* Cost */}
          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-light-text">Cost</span>
              <span className="text-[13px] font-bold text-text">{quote ? `${quote.costCredits} Credits` : "—"}</span>
            </div>
            {quote && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-light-text">Your Balance</span>
                <span className={`text-[13px] font-bold ${canAfford ? "text-text" : "text-red-400"}`}>{quote.balance} Credits</span>
              </div>
            )}
            {quote && !canAfford && (
              <p className="text-[11px] font-semibold text-red-400 text-center">
                You need {quote.costCredits - quote.balance} more Credits — click Buy Credits below
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 border-t border-border px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-lg py-2.5 text-[12px] font-bold text-light-text hover:bg-feed-bg/60 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleBoost}
          disabled={boosting || !quote}
          className="flex-1 rounded-lg bg-primary py-2.5 text-[12px] font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {boosting ? "Boosting…" : canAfford ? "Boost Post" : "Buy Credits"}
        </button>
      </div>
    </div>
  );
}
