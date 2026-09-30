"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPatch, apiUploadFile } from "@/lib/api";
import { useJobSocket } from "@/lib/jobSocket";
import {
  IoPersonOutline,
  IoCameraOutline,
  IoLocationOutline,
  IoCallOutline,
  IoShieldOutline,
  IoNotificationsOutline,
  IoContrastOutline,
  IoChatbubbleOutline,
  IoOptionsOutline,
  IoWalletOutline,
  IoCubeOutline,
  IoStatsChartOutline,
  IoMegaphoneOutline,
  IoHelpCircleOutline,
  IoPersonAddOutline,
  IoStarOutline,
  IoReloadOutline,
  IoTimeOutline,
  IoLockClosedOutline,
  IoSearchOutline,
  IoChevronForward,
  IoChevronBack,
  IoKeyOutline,
  IoCheckmark,
  IoSunnyOutline,
  IoMoonOutline,
  IoPhonePortraitOutline,
  IoConstructOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoBriefcaseOutline,
  IoGlobeOutline,
  IoSchoolOutline,
} from "react-icons/io5";

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder-light-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors";

// ─── Theme ───────────────────────────────────────────────────────────────────

type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.setAttribute("data-theme", "dark");
  else if (t === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try { localStorage.setItem("twedot-theme", t); } catch {}
}

// ─── Panels ──────────────────────────────────────────────────────────────────

function ComingSoonPanel({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
        <IoConstructOutline size={28} className="text-light-text" />
      </div>
      <p className="text-[16px] font-bold text-text">{label}</p>
      <p className="max-w-xs text-[13px] leading-[20px] text-light-text">
        {description} This feature is coming soon.
      </p>
    </div>
  );
}

function AppearancePanel() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem("twedot-theme") as Theme) ?? "system"; } catch { return "system"; }
  });

  const OPTIONS = [
    { value: "system" as Theme, label: "System default", description: "Follows your device's light or dark setting", icon: IoPhonePortraitOutline },
    { value: "light"  as Theme, label: "Light",          description: "Always use the light theme",                 icon: IoSunnyOutline },
    { value: "dark"   as Theme, label: "Dark",           description: "Always use the dark theme",                  icon: IoMoonOutline },
  ];

  return (
    <div className="py-2">
      <p className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Theme</p>
      {OPTIONS.map(({ value, label, description, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => { setTheme(value); applyTheme(value); }}
            className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-feed-bg"
          >
            <Icon size={20} className={active ? "text-primary" : "text-light-text"} />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-text">{label}</p>
              <p className="mt-0.5 text-[12px] text-light-text">{description}</p>
            </div>
            <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`}>
              {active && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AccountInfoPanel() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Account</p>
      {[
        { label: "Name", value: user.name },
        { label: "Phone", value: user.country_code ? `+${user.country_code} ${user.phone_number}` : user.phone_number },
        { label: "Occupation", value: user.occupation },
        { label: "Location", value: [user.city, user.country].filter(Boolean).join(", ") },
        { label: "Website", value: user.website },
      ].filter((r) => r.value).map(({ label, value }) => (
        <div key={label} className="flex items-start gap-3 border-b border-border py-3 last:border-0">
          <span className="min-w-[100px] text-[12px] text-light-text">{label}</span>
          <span className="flex-1 text-[13px] font-medium text-text break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function EditProfilePanel() {
  const { user, refreshUser } = useAuth();
  const { socket } = useJobSocket();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schoolDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [occupation, setOccupation] = useState(user?.occupation ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [school, setSchool] = useState((user as any)?.school?.name ?? "");
  const [schoolSuggestions, setSchoolSuggestions] = useState<{ id: string; name: string; country?: string | null }[]>([]);
  const [schoolFocused, setSchoolFocused] = useState(false);
  const [openingTime, setOpeningTime] = useState((user as any)?.opening_time ?? "");
  const [closingTime, setClosingTime] = useState((user as any)?.closing_time ?? "");
  const [workingDays, setWorkingDays] = useState<string[]>(() => {
    const wd = (user as any)?.working_days;
    return wd ? wd.split(",").map((d: string) => d.trim()).filter(Boolean) : [];
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photo upload state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const pendingJobId = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setOccupation(user.occupation ?? "");
      setBio(user.bio ?? "");
      setWebsite(user.website ?? "");
      setSchool((user as any)?.school?.name ?? "");
      setOpeningTime((user as any)?.opening_time ?? "");
      setClosingTime((user as any)?.closing_time ?? "");
      const wd = (user as any)?.working_days;
      setWorkingDays(wd ? wd.split(",").map((d: string) => d.trim()).filter(Boolean) : []);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for media_job_complete to get the uploaded photo URL
  useEffect(() => {
    if (!socket) return;
    const onComplete = (data: { jobId: string; url: string }) => {
      if (data.jobId !== pendingJobId.current) return;
      pendingJobId.current = null;
      apiPatch("/users/me", { profile_photo_url: data.url })
        .then(() => refreshUser().catch(() => {}))
        .catch(() => setPhotoError("Photo saved but profile update failed"))
        .finally(() => setPhotoUploading(false));
    };
    const onFailed = (data: { jobId: string }) => {
      if (data.jobId !== pendingJobId.current) return;
      pendingJobId.current = null;
      setPhotoUploading(false);
      setPhotoPreview(null);
      setPhotoError("Photo upload failed. Please try again.");
    };
    socket.on("media_job_complete", onComplete);
    socket.on("media_job_failed", onFailed);
    return () => { socket.off("media_job_complete", onComplete); socket.off("media_job_failed", onFailed); };
  }, [socket, refreshUser]);

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "profile");
      fd.append("mimeType", file.type);
      fd.append("fileName", file.name);
      const res = await apiUploadFile<{ jobId: string }>("/media/upload/direct", fd);
      pendingJobId.current = res.jobId;
    } catch {
      setPhotoUploading(false);
      setPhotoPreview(null);
      setPhotoError("Upload failed. Please try again.");
    }
    e.target.value = "";
  }, []);

  function onSchoolChange(val: string) {
    setSchool(val);
    if (schoolDebounceRef.current) clearTimeout(schoolDebounceRef.current);
    if (val.trim().length < 2) { setSchoolSuggestions([]); return; }
    schoolDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiGet<{ data: { id: string; name: string; country?: string | null }[] }>(
          `/schools/suggest?q=${encodeURIComponent(val.trim())}`
        );
        const list = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
        setSchoolSuggestions(list.slice(0, 5));
      } catch { setSchoolSuggestions([]); }
    }, 300);
  }

  function toggleDay(day: string) {
    setWorkingDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await apiPatch("/users/me", {
        name: name.trim() || undefined,
        occupation: occupation.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
        school: school.trim(),
        opening_time: openingTime || undefined,
        closing_time: closingTime || undefined,
        working_days: workingDays.length ? DAYS.filter((d) => workingDays.includes(d)).join(",") : undefined,
      });
      await refreshUser().catch(() => {});
      setSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const avatarSrc = photoPreview ?? user?.profile_photo_url ?? null;

  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Edit Profile</p>

      {/* Avatar upload */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="relative">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-border/40">
              <IoPersonOutline size={32} className="text-light-text" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {photoUploading
              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <IoCameraOutline size={14} />}
          </button>
        </div>
        <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
          className="text-[12px] font-medium text-primary hover:underline disabled:opacity-60">
          {photoUploading ? "Uploading…" : "Change profile photo"}
        </button>
        {photoError && <p className="text-[11px] text-red-500">{photoError}</p>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Name</label>
          <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Category / Occupation */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Category</label>
          <div className="relative">
            <IoBriefcaseOutline size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
            <input className={`${inputCls} pl-8`} placeholder="e.g. Plumber, Hair Stylist" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Bio</label>
          <textarea className={`${inputCls} min-h-[72px] resize-none`} placeholder="Tell people about yourself or your service…" value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))} maxLength={150} />
          <span className="text-right text-[10px] text-light-text">{bio.length}/150</span>
        </div>

        {/* Website / Links */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Links</label>
          <div className="relative">
            <IoGlobeOutline size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
            <input type="url" className={`${inputCls} pl-8`} placeholder="e.g. mywebsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>

        {/* School */}
        <div className="relative flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">School</label>
          <div className="relative">
            <IoSchoolOutline size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-text" />
            <input
              className={`${inputCls} pl-8`}
              placeholder="University or school attended (optional)"
              value={school}
              onChange={(e) => onSchoolChange(e.target.value)}
              onFocus={() => setSchoolFocused(true)}
              onBlur={() => setTimeout(() => setSchoolFocused(false), 150)}
            />
          </div>
          {schoolFocused && schoolSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
              {schoolSuggestions.map((s) => (
                <button key={s.id} onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSchool(s.name); setSchoolSuggestions([]); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-text hover:bg-feed-bg">
                  <IoSchoolOutline size={13} className="flex-shrink-0 text-primary" />
                  <span className="truncate">{s.name}{s.country ? ` · ${s.country}` : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Working days */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Open on</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = workingDays.includes(day);
              return (
                <button key={day} onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active ? "bg-primary text-white" : "border border-border text-light-text hover:border-primary hover:text-primary"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Opening / Closing time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Opens</label>
            <input type="time" className={inputCls} value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-light-text">Closes</label>
            <input type="time" className={inputCls} value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-all">
            {saved ? <><IoCheckmark size={14} /> Saved</> : saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PushNotificationsPanel() {
  const [status, setStatus] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!("Notification" in window)) { setStatus("unsupported"); return; }
    setStatus(Notification.permission);
  }, []);

  async function request() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setStatus(result);
  }

  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Push Notifications</p>
      {status === "unsupported" && (
        <p className="text-[13px] text-light-text">Your browser does not support push notifications.</p>
      )}
      {status === "granted" && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <IoCheckmark size={16} className="text-green-600" />
          </div>
          <p className="text-[13px] font-medium text-text">Notifications are enabled for this browser.</p>
        </div>
      )}
      {status === "denied" && (
        <p className="text-[13px] text-light-text">Notifications are blocked. To enable them, update your browser's site settings for this page.</p>
      )}
      {status === "default" && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-light-text">Allow Twedot to send you push notifications for new messages, job requests, and activity.</p>
          <button onClick={request} className="w-fit rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90">
            Enable Notifications
          </button>
        </div>
      )}
    </div>
  );
}

function InviteFriendPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiGet<any>("/users/me/invite-token")
      .then((res) => {
        const t = res?.data?.token ?? res?.token ?? (typeof res === "string" ? res : null);
        if (t) setToken(t);
      })
      .catch(() => {});
  }, []);

  async function copyLink() {
    const url = `https://twedot.com/u/${encodeURIComponent(token ?? "")}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  }

  const url = token ? `https://twedot.com/u/${encodeURIComponent(token)}` : null;

  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Invite a Friend</p>
      <p className="mb-4 text-[13px] leading-[20px] text-light-text">Share your personal invite link and earn rewards when your friends join Twedot.</p>
      {url ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-feed-bg px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[12px] text-text">{url}</span>
          <button onClick={copyLink} className="flex-shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      ) : (
        <p className="text-[13px] text-light-text">Generating your invite link…</p>
      )}
    </div>
  );
}

function RateTwedotPanel() {
  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Rate Twedot</p>
      <p className="mb-5 text-[13px] leading-[20px] text-light-text">Love Twedot? Leave us a review on the Play Store and help others discover the app.</p>
      <a
        href="https://play.google.com/store/apps/details?id=com.twedot"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
      >
        <IoStarOutline size={15} />
        Rate on Play Store
      </a>
    </div>
  );
}

function ServiceHistoryPanel() {
  const router = useRouter();
  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Service History</p>
      <p className="mb-5 text-[13px] leading-[20px] text-light-text">View and manage all your past service bookings and job requests.</p>
      <button
        onClick={() => router.push("/job-request")}
        className="flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
      >
        <IoTimeOutline size={15} />
        Open Service History
      </button>
    </div>
  );
}

function LogoutPanel() {
  const { logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  }

  return (
    <div className="px-5 py-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Sign Out</p>
      <p className="mb-5 text-[13px] leading-[20px] text-light-text">You will be signed out of your account on this browser. You can sign back in at any time.</p>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex w-fit items-center gap-2 rounded-full border border-red-300 px-5 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60 transition-colors"
      >
        <IoLogOutOutline size={15} />
        {loggingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

type SettingsItem = {
  icon: React.ElementType;
  label: string;
  description: string;
  renderPanel: () => React.ReactNode;
};

type SettingsCategory = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SettingsItem[];
};

function soon(icon: React.ElementType, label: string, description: string): SettingsItem {
  return { icon, label, description, renderPanel: () => <ComingSoonPanel label={label} description={description} /> };
}

const CATEGORIES: SettingsCategory[] = [
  {
    id: "account", label: "Your Account", icon: IoPersonOutline,
    items: [
      { icon: IoPersonOutline,  label: "Account Information", description: "See your account details.", renderPanel: () => <AccountInfoPanel /> },
      { icon: IoCreateOutline,  label: "Edit Profile",        description: "Update your name, bio, location and more.", renderPanel: () => <EditProfilePanel /> },
      soon(IoKeyOutline,        "Change Password",  "Change your Twedot account password."),
      soon(IoLocationOutline,   "Service Location", "Manage your service delivery area."),
      soon(IoCallOutline,       "Contact Info",     "Manage your contact details."),
      { icon: IoLogOutOutline,  label: "Sign Out", description: "Sign out of this account.", renderPanel: () => <LogoutPanel /> },
    ],
  },
  {
    id: "privacy", label: "Privacy & Security", icon: IoShieldOutline,
    items: [
      soon(IoLockClosedOutline, "Account Privacy",    "Control who can see your posts and profile."),
      soon(IoShieldOutline,     "Security",           "Manage your account security and sessions."),
      soon(IoPersonOutline,     "Blocked Accounts",   "Manage accounts you have blocked."),
      soon(IoLockClosedOutline, "Data & Permissions", "Control what data Twedot collects."),
    ],
  },
  {
    id: "notifications", label: "Notifications", icon: IoNotificationsOutline,
    items: [
      { icon: IoNotificationsOutline, label: "Push Notifications",  description: "Control push notifications on this browser.", renderPanel: () => <PushNotificationsPanel /> },
      soon(IoNotificationsOutline, "Email Notifications", "Manage the emails Twedot sends you."),
      soon(IoNotificationsOutline, "In-App Alerts",       "Customize in-app alert settings."),
    ],
  },
  {
    id: "chats", label: "Chats & Messaging", icon: IoChatbubbleOutline,
    items: [
      soon(IoChatbubbleOutline, "Chat Preferences", "Manage how your chats appear."),
      soon(IoChatbubbleOutline, "Message Requests", "Control who can send you messages."),
    ],
  },
  {
    id: "preferences", label: "Preferences", icon: IoOptionsOutline,
    items: [
      { icon: IoContrastOutline, label: "Appearance", description: "Switch between light, dark, or system theme.", renderPanel: () => <AppearancePanel /> },
      soon(IoOptionsOutline, "App Preferences", "Language, region, and accessibility settings."),
    ],
  },
  {
    id: "commerce", label: "Wallet & Commerce", icon: IoWalletOutline,
    items: [
      soon(IoWalletOutline,     "Wallet",          "Manage your wallet and transactions."),
      soon(IoCubeOutline,       "Inventory",       "Manage your service inventory."),
      soon(IoStatsChartOutline, "Analytics",       "View your performance analytics."),
      soon(IoMegaphoneOutline,  "Ads",             "Manage your ad campaigns."),
      { icon: IoTimeOutline,    label: "Service History", description: "View past service bookings.", renderPanel: () => <ServiceHistoryPanel /> },
    ],
  },
  {
    id: "help", label: "Help & Feedback", icon: IoHelpCircleOutline,
    items: [
      soon(IoHelpCircleOutline, "Help Center",     "Browse help articles and FAQs."),
      soon(IoChatbubbleOutline, "Send Feedback",   "Share your thoughts with us."),
      soon(IoPersonOutline,     "Contact Support", "Get in touch with our support team."),
    ],
  },
  {
    id: "resources", label: "Additional Resources", icon: IoPersonAddOutline,
    items: [
      { icon: IoPersonAddOutline, label: "Invite a Friend", description: "Share your invite link with friends.", renderPanel: () => <InviteFriendPanel /> },
      { icon: IoStarOutline,      label: "Rate Twedot",     description: "Rate us on the Play Store.",          renderPanel: () => <RateTwedotPanel /> },
      soon(IoReloadOutline, "App Updates", "Check for the latest Twedot updates."),
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

type MobileStep = "cats" | "items" | "detail";

function SettingsContent() {
  const sectionParam = useSearchParams().get("section");
  const [query, setQuery] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>(CATEGORIES[0].id);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);
  const [mobileStep, setMobileStep] = useState<MobileStep>("cats");

  // Auto-open a specific item when ?section= is passed (e.g. from "Edit profile" button)
  useEffect(() => {
    if (!sectionParam) return;
    for (const cat of CATEGORIES) {
      const idx = cat.items.findIndex(
        (item) => item.label.toLowerCase().replace(/\s+/g, "-") === sectionParam
      );
      if (idx !== -1) {
        setSelectedCatId(cat.id);
        setSelectedItemIdx(idx);
        setMobileStep("panel");
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const results: { cat: SettingsCategory; item: SettingsItem; itemIdx: number }[] = [];
    for (const cat of CATEGORIES) {
      for (let i = 0; i < cat.items.length; i++) {
        const item = cat.items[i];
        if (item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) {
          results.push({ cat, item, itemIdx: i });
        }
      }
    }
    return results;
  }, [query]);

  const selectedCat  = CATEGORIES.find((c) => c.id === selectedCatId) ?? CATEGORIES[0];
  const selectedItem = selectedItemIdx !== null ? (selectedCat.items[selectedItemIdx] ?? null) : null;

  function pickCategory(id: string) {
    setSelectedCatId(id);
    setSelectedItemIdx(null);
    setMobileStep("items");
  }

  function pickItem(idx: number) {
    setSelectedItemIdx(idx);
    setMobileStep("detail");
  }

  function goBackToItems() {
    setSelectedItemIdx(null);
    setMobileStep("items");
  }

  const rightPanel = selectedItem ? (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <button onClick={goBackToItems} className="flex items-center gap-1.5 text-[13px] font-medium text-light-text hover:text-text">
          <IoChevronBack size={16} />
          <span>{selectedCat.label}</span>
        </button>
      </div>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[17px] font-bold text-text">{selectedItem.label}</h2>
        <p className="mt-0.5 text-[12px] text-light-text">{selectedItem.description}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {selectedItem.renderPanel()}
      </div>
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[17px] font-bold text-text">{selectedCat.label}</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {selectedCat.items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => pickItem(idx)}
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-feed-bg"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-feed-bg">
                <Icon size={18} className="text-light-text" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text">{item.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-light-text">{item.description}</p>
              </div>
              <IoChevronForward size={14} className="flex-shrink-0 text-light-text" />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden pl-3 md:pl-4">

      {/* ── Left: category list ── */}
      <div className={`flex flex-col border-r border-border bg-background md:w-[330px] md:flex-shrink-0 ${
        mobileStep !== "cats" ? "hidden md:flex" : "flex w-full"
      }`}>
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Settings</h1>
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-full bg-feed-bg px-3.5 py-2">
            <IoSearchOutline size={15} className="flex-shrink-0 text-light-text" />
            <input
              type="text"
              placeholder="Search settings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-light-text"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          {searchResults !== null ? (
            searchResults.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-light-text">No results for &quot;{query}&quot;</p>
            ) : (
              searchResults.map(({ cat, item, itemIdx }) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${cat.id}-${itemIdx}`}
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setSelectedItemIdx(itemIdx);
                      setMobileStep("detail");
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-feed-bg/60"
                  >
                    <Icon size={16} className="flex-shrink-0 text-light-text" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-text">{item.label}</p>
                      <p className="text-[11px] text-light-text">{cat.label}</p>
                    </div>
                    <IoChevronForward size={12} className="flex-shrink-0 text-light-text" />
                  </button>
                );
              })
            )
          ) : (
            CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === selectedCatId && !selectedItem;
              return (
                <button
                  key={cat.id}
                  onClick={() => pickCategory(cat.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive ? "bg-feed-bg" : "hover:bg-feed-bg/60"
                  }`}
                >
                  <Icon size={17} className={`flex-shrink-0 ${isActive ? "text-primary" : "text-light-text"}`} />
                  <span className="flex-1 text-[13px] font-medium text-text">{cat.label}</span>
                  <IoChevronForward size={13} className={`flex-shrink-0 ${isActive ? "text-primary" : "text-light-text"}`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: items list OR detail ── */}
      <div className={`flex-1 overflow-hidden bg-background ${
        mobileStep === "cats" ? "hidden md:flex md:flex-col" : "flex flex-col"
      }`}>
        {!selectedItem && (
          <button
            onClick={() => setMobileStep("cats")}
            className="flex items-center gap-1.5 border-b border-border px-4 py-3 text-[12px] text-light-text md:hidden"
          >
            <IoChevronBack size={14} /> Settings
          </button>
        )}
        {rightPanel}
      </div>

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
