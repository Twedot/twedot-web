"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  IoImageOutline,
  IoChevronBack,
  IoChevronDown,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiPost, apiUploadFile } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

const MapPicker = dynamic(() => import("../MapPicker"), { ssr: false });

const CATEGORIES = [
  { value: "food", label: "Food & Restaurant" },
  { value: "services", label: "Services" },
  { value: "retail", label: "Retail & Shop" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health & Wellness" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
] as const;

const DAYS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
] as const;

async function uploadImage(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("fileName", file.name);
  fd.append("mimeType", file.type);
  fd.append("folder", folder);
  const result = await apiUploadFile<{ url: string }>("/media/upload/direct", fd);
  return result.url;
}

export default function CreateBusinessPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("17:00");
  const [workingDays, setWorkingDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  function toggleDay(d: string) {
    setWorkingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function save() {
    if (!name.trim()) { notify("Business name is required"); return; }
    setSaving(true);
    try {
      let cover_image_url: string | undefined;
      let logo_url: string | undefined;
      if (coverFile) cover_image_url = await uploadImage(coverFile, "business");
      if (logoFile) logo_url = await uploadImage(logoFile, "business");

      const body: Record<string, unknown> = {
        name: name.trim(), category,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        latitude: lat ?? undefined, longitude: lng ?? undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        opening_time: openingTime || undefined,
        closing_time: closingTime || undefined,
        working_days: workingDays.length ? workingDays : undefined,
      };
      if (cover_image_url) body.cover_image_url = cover_image_url;
      if (logo_url) body.logo_url = logo_url;

      const data = await apiPost<{ business: { slug: string } }>("/business", body);
      notify("Business created");
      router.replace(`/business/${data.business.slug}/manage`);
    } catch (e: any) {
      notify(e.message || "Failed to create business");
      setSaving(false);
    }
  }

  if (isLoading || !isAuthenticated) return null;

  const inputCls = "w-full rounded-xl border border-border bg-feed-bg px-3.5 py-2.5 text-sm text-text placeholder:text-light-text outline-none focus:border-primary";
  const labelCls = "mb-1.5 block text-xs font-semibold text-light-text";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button onClick={() => router.push("/business")}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
        <IoChevronBack size={16} /> My Businesses
      </button>
      <h1 className="mb-6 text-lg font-bold text-text">Create Business</h1>

      <div className="space-y-4">
        {/* Cover */}
        <div>
          <label className={labelCls}>Cover Image</label>
          <div onClick={() => coverRef.current?.click()}
            className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-feed-bg hover:border-primary">
            {coverPreview
              ? <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
              : <div className="text-center text-light-text"><IoImageOutline size={28} className="mx-auto" /><p className="mt-1 text-xs">Tap to upload cover</p></div>}
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />
        </div>

        {/* Logo */}
        <div>
          <label className={labelCls}>Logo</label>
          <div className="flex items-center gap-4">
            <div onClick={() => logoRef.current?.click()}
              className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-feed-bg hover:border-primary">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                : <IoImageOutline size={20} className="text-light-text" />}
            </div>
            <p className="text-xs text-light-text">Tap to upload logo</p>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />
        </div>

        <div><label className={labelCls}>Business Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mama's Kitchen" className={inputCls} /></div>

        <div><label className={labelCls}>Category *</label>
          <div className="relative">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls + " appearance-none pr-10 cursor-pointer"}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <IoChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-light-text" />
          </div>
        </div>

        <div><label className={labelCls}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your business…" rows={3} className={inputCls + " resize-none"} /></div>

        <div><label className={labelCls}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" className={inputCls} /></div>

        <div><label className={labelCls}>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" className={inputCls} /></div>

        <div><label className={labelCls}>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, Lagos" className={inputCls} /></div>

        <div>
          <label className={labelCls}>Location on Map</label>
          <div className="h-[280px] overflow-hidden rounded-xl border border-border">
            <MapPicker lat={lat} lng={lng} onSelect={(la, ln) => { setLat(la); setLng(ln); }} />
          </div>
          {lat && lng && <p className="mt-1 text-[10px] text-light-text">{lat.toFixed(5)}, {lng.toFixed(5)}</p>}
        </div>

        <div><label className={labelCls}>Business Hours</label>
          <div className="flex items-center gap-3">
            <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} className={inputCls + " max-w-[140px]"} />
            <span className="text-sm text-light-text">to</span>
            <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className={inputCls + " max-w-[140px]"} />
          </div>
        </div>

        <div><label className={labelCls}>Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button key={d.value} onClick={() => toggleDay(d.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${workingDays.includes(d.value) ? "bg-primary text-white" : "border border-border text-light-text hover:bg-feed-bg"}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Creating…" : "Create Business"}
          </button>
          <button onClick={() => router.push("/business")}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-feed-bg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
