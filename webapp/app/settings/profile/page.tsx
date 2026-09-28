"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IoPersonOutline,
  IoTimeOutline,
  IoContrastOutline,
  IoPhonePortraitOutline,
  IoLogOutOutline,
  IoCheckmark,
  IoCameraOutline,
  IoGlobeOutline,
  IoBriefcaseOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiPatch } from "@/lib/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Theme = "system" | "light" | "dark";

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 mb-5">
      <Icon size={17} className="text-primary" />
      <h2 className="text-[13px] font-semibold text-text">{title}</h2>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-light-text">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-sm text-text placeholder-light-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Profile fields
  const [name, setName] = useState(user?.name ?? "");
  const [occupation, setOccupation] = useState(user?.occupation ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");

  // Business hours
  const [openingTime, setOpeningTime] = useState(user?.opening_time ?? "");
  const [closingTime, setClosingTime] = useState(user?.closing_time ?? "");
  const [workingDays, setWorkingDays] = useState<string[]>(() => {
    if (user?.working_days) return user.working_days.split(",").map((d) => d.trim());
    return [];
  });

  // Appearance
  const [theme, setTheme] = useState<Theme>("system");

  // Saving state
  const [profileSaving, setProfileSaving] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("twedot-theme") as Theme | null;
      if (stored) setTheme(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setOccupation(user.occupation ?? "");
      setBio(user.bio ?? "");
      setWebsite(user.website ?? "");
      setOpeningTime((user as any).opening_time ?? "");
      setClosingTime((user as any).closing_time ?? "");
      if ((user as any).working_days) {
        setWorkingDays((user as any).working_days.split(",").map((d: string) => d.trim()));
      }
    }
  }, [user?.id]);

  function toggleDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function applyTheme(t: Theme) {
    setTheme(t);
    try {
      localStorage.setItem("twedot-theme", t);
    } catch {}
    const root = document.documentElement;
    if (t === "dark") root.setAttribute("data-theme", "dark");
    else if (t === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }

  async function saveProfile() {
    setError(null);
    setProfileSaving(true);
    try {
      await apiPatch("/users/me", {
        name: name.trim() || undefined,
        occupation: occupation.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
      });
      setProfileSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setProfileSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveHours() {
    setError(null);
    setHoursSaving(true);
    try {
      await apiPatch("/users/me", {
        opening_time: openingTime || undefined,
        closing_time: closingTime || undefined,
        working_days: workingDays.length ? workingDays.join(", ") : undefined,
      });
      setHoursSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setHoursSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save hours");
    } finally {
      setHoursSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-xl font-bold text-text">Settings</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Profile ── */}
      <section className="mb-8 rounded-2xl border border-border bg-feed-bg p-6">
        <SectionHeader icon={IoPersonOutline} title="Profile" />

        <div className="flex flex-col gap-5">
          <Field label="Display name">
            <input
              type="text"
              className={inputCls}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Occupation / Role">
            <div className="relative">
              <IoBriefcaseOutline
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text"
              />
              <input
                type="text"
                className={`${inputCls} pl-8`}
                placeholder="e.g. Barber, Chef, Developer"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Bio">
            <textarea
              className={`${inputCls} min-h-[90px] resize-none`}
              placeholder="Tell people about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />
            <span className="text-right text-[10px] text-light-text">
              {bio.length}/300
            </span>
          </Field>

          <Field label="Website">
            <div className="relative">
              <IoGlobeOutline
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text"
              />
              <input
                type="url"
                className={`${inputCls} pl-8`}
                placeholder="https://yourwebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </Field>

          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {profileSaved ? (
                <>
                  <IoCheckmark size={15} />
                  Saved
                </>
              ) : profileSaving ? (
                "Saving…"
              ) : (
                "Save profile"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Business Hours ── */}
      <section className="mb-8 rounded-2xl border border-border bg-feed-bg p-6">
        <SectionHeader icon={IoTimeOutline} title="Business Hours" />

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening time">
              <input
                type="time"
                className={inputCls}
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
              />
            </Field>
            <Field label="Closing time">
              <input
                type="time"
                className={inputCls}
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Working days">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      selected
                        ? "bg-primary text-white"
                        : "border border-border bg-feed-bg text-light-text hover:border-primary hover:text-primary"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="flex justify-end">
            <button
              onClick={saveHours}
              disabled={hoursSaving}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {hoursSaved ? (
                <>
                  <IoCheckmark size={15} />
                  Saved
                </>
              ) : hoursSaving ? (
                "Saving…"
              ) : (
                "Save hours"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Appearance ── */}
      <section className="mb-8 rounded-2xl border border-border bg-feed-bg p-6">
        <SectionHeader icon={IoContrastOutline} title="Appearance" />

        <div className="flex flex-col gap-2">
          <p className="mb-3 text-[12px] text-light-text">
            Choose how Twedot looks to you. This setting applies to this browser only.
          </p>
          {(["system", "light", "dark"] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => applyTheme(t)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                theme === t
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text hover:bg-feed-bg"
              }`}
            >
              <span className="font-medium capitalize">
                {t === "system" ? "System default" : t === "light" ? "Light" : "Dark"}
              </span>
              {theme === t && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <IoCheckmark size={12} className="text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Account ── */}
      <section className="rounded-2xl border border-border bg-feed-bg p-6">
        <SectionHeader icon={IoPhonePortraitOutline} title="Account" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-light-text">
              Phone number
            </span>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-sm text-light-text">
              <IoPhonePortraitOutline size={15} />
              {user?.country_code && `+${user.country_code} `}
              {user?.phone_number ?? "—"}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <IoLogOutOutline size={16} />
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
