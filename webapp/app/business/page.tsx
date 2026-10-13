"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  IoAddOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoStorefrontOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoImageOutline,
  IoChevronBack,
  IoChevronDown,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost, apiPatch, apiDelete, apiUploadFile } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessItem {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  is_available: boolean;
  sort_order: number;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  working_days?: string[] | null;
  is_active: boolean;
  items?: BusinessItem[];
}

type View = "list" | "create" | "edit" | "detail" | "add-item" | "edit-item";

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

// ─── Business Card ────────────────────────────────────────────────────────────

function BusinessCard({
  biz,
  active,
  onClick,
}: {
  biz: Business;
  active: boolean;
  onClick: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.value === biz.category);
  return (
    <button
      onClick={onClick}
      className={`overflow-hidden rounded-[14px] border text-left transition-colors ${
        active ? "border-primary" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="aspect-[2/1] w-full overflow-hidden bg-feed-bg">
        {biz.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={biz.cover_image_url}
            alt={biz.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IoStorefrontOutline size={28} className="text-light-text" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[12px] font-semibold text-text">{biz.name}</p>
        <p className="mt-0.5 text-[11px] text-light-text">{cat?.label ?? biz.category}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            biz.is_active
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-feed-bg text-light-text"
          }`}
        >
          {biz.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    </button>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: BusinessItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const price = Number(item.price);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-feed-bg">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IoImageOutline size={20} className="text-light-text" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{item.name}</p>
        {price > 0 && (
          <p className="text-xs font-semibold text-primary">
            ₦{price.toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-light-text hover:bg-feed-bg"
        >
          <IoCreateOutline size={16} />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <IoTrashOutline size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [activeItem, setActiveItem] = useState<BusinessItem | null>(null);

  // Business form
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
  const [workingDays, setWorkingDays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Item form
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [itemPreview, setItemPreview] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadBusinesses = useCallback(async () => {
    const data = await apiGet<{ businesses: Business[] }>("/business/mine").catch(
      () => null
    );
    setBusinesses(data?.businesses ?? []);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    loadBusinesses().finally(() => setLoading(false));
  }, [isAuthenticated, loadBusinesses]);

  // cleanup blob urls
  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (itemPreview?.startsWith("blob:")) URL.revokeObjectURL(itemPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form helpers ────────────────────────────────────────────────────────

  function resetBizForm() {
    setName("");
    setCategory("food");
    setDescription("");
    setAddress("");
    setLat(null);
    setLng(null);
    setPhone("");
    setWebsite("");
    setOpeningTime("09:00");
    setClosingTime("17:00");
    setWorkingDays(["mon", "tue", "wed", "thu", "fri"]);
    setCoverFile(null);
    setCoverPreview(null);
    setLogoFile(null);
    setLogoPreview(null);
  }

  function populateBizForm(b: Business) {
    setName(b.name);
    setCategory(b.category);
    setDescription(b.description ?? "");
    setAddress(b.address ?? "");
    setLat(b.latitude ?? null);
    setLng(b.longitude ?? null);
    setPhone(b.phone ?? "");
    setWebsite(b.website ?? "");
    setOpeningTime(b.opening_time ?? "09:00");
    setClosingTime(b.closing_time ?? "17:00");
    setWorkingDays(b.working_days ?? ["mon", "tue", "wed", "thu", "fri"]);
    setCoverFile(null);
    setCoverPreview(b.cover_image_url ?? null);
    setLogoFile(null);
    setLogoPreview(b.logo_url ?? null);
  }

  function resetItemForm() {
    setItemName("");
    setItemPrice("");
    setItemDesc("");
    setItemFile(null);
    setItemPreview(null);
  }

  function populateItemForm(item: BusinessItem) {
    setItemName(item.name);
    setItemPrice(String(Number(item.price)));
    setItemDesc(item.description ?? "");
    setItemFile(null);
    setItemPreview(item.image_url ?? null);
  }

  function toggleDay(d: string) {
    setWorkingDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  async function saveBusiness() {
    if (!name.trim()) {
      notify("Business name is required");
      return;
    }
    setSaving(true);
    try {
      let cover_image_url = coverPreview;
      let logo_url = logoPreview;

      if (coverFile) cover_image_url = await uploadImage(coverFile, "business");
      if (logoFile) logo_url = await uploadImage(logoFile, "business");

      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        opening_time: openingTime || undefined,
        closing_time: closingTime || undefined,
        working_days: workingDays.length ? workingDays : undefined,
      };
      if (cover_image_url) body.cover_image_url = cover_image_url;
      if (logo_url) body.logo_url = logo_url;

      if (view === "edit" && activeBiz) {
        await apiPatch(`/business/${activeBiz.id}`, body);
        notify("Business updated");
      } else {
        await apiPost("/business", body);
        notify("Business created");
      }

      await loadBusinesses();
      setView("list");
      resetBizForm();
    } catch (e: any) {
      notify(e.message || "Failed to save business");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBusiness(id: string) {
    setDeleting(true);
    try {
      await apiDelete(`/business/${id}`);
      notify("Business deleted");
      await loadBusinesses();
      setView("list");
      setActiveBiz(null);
    } catch (e: any) {
      notify(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function saveItem() {
    if (!itemName.trim()) {
      notify("Item name is required");
      return;
    }
    if (!activeBiz) return;
    setSavingItem(true);
    try {
      let image_url = itemPreview;
      if (itemFile) image_url = await uploadImage(itemFile, "business-items");

      const body: Record<string, unknown> = {
        name: itemName.trim(),
        price: Number(itemPrice) || 0,
        description: itemDesc.trim() || undefined,
      };
      if (image_url) body.image_url = image_url;

      if (view === "edit-item" && activeItem) {
        await apiPatch(`/business/${activeBiz.id}/items/${activeItem.id}`, body);
        notify("Item updated");
      } else {
        await apiPost(`/business/${activeBiz.id}/items`, body);
        notify("Item added");
      }

      // refresh the business detail
      const data = await apiGet<{ business: Business }>(
        `/business/public/${activeBiz.id}`
      );
      setActiveBiz(data.business);
      setView("detail");
      resetItemForm();
    } catch (e: any) {
      notify(e.message || "Failed to save item");
    } finally {
      setSavingItem(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!activeBiz) return;
    try {
      await apiDelete(`/business/${activeBiz.id}/items/${itemId}`);
      notify("Item deleted");
      const data = await apiGet<{ business: Business }>(
        `/business/public/${activeBiz.id}`
      );
      setActiveBiz(data.business);
    } catch (e: any) {
      notify(e.message || "Delete failed");
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  const inputCls =
    "w-full rounded-xl border border-border bg-feed-bg px-3.5 py-2.5 text-sm text-text placeholder:text-light-text outline-none focus:border-primary dark:bg-feed-bg";
  const labelCls = "mb-1.5 block text-xs font-semibold text-light-text";
  const btnPrimary =
    "rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
  const btnSecondary =
    "rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-feed-bg";

  if (isLoading || !isAuthenticated) return null;

  // ─── Business Form (create / edit) ──────────────────────────────────────

  if (view === "create" || view === "edit") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => {
            setView("list");
            resetBizForm();
          }}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <IoChevronBack size={16} /> Back
        </button>

        <h1 className="mb-6 text-lg font-bold text-text">
          {view === "edit" ? "Edit Business" : "Create Business"}
        </h1>

        <div className="space-y-4">
          {/* Cover image */}
          <div>
            <label className={labelCls}>Cover Image</label>
            <div
              onClick={() => coverRef.current?.click()}
              className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-feed-bg hover:border-primary"
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-light-text">
                  <IoImageOutline size={28} className="mx-auto" />
                  <p className="mt-1 text-xs">Tap to upload cover</p>
                </div>
              )}
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCoverFile(f);
                  setCoverPreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
          </div>

          {/* Logo */}
          <div>
            <label className={labelCls}>Logo</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => logoRef.current?.click()}
                className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-feed-bg hover:border-primary"
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <IoImageOutline size={20} className="text-light-text" />
                )}
              </div>
              <p className="text-xs text-light-text">Tap to upload logo</p>
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setLogoFile(f);
                  setLogoPreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>Business Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mama's Kitchen"
              className={inputCls}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category *</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls + " appearance-none pr-10 cursor-pointer"}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <IoChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-light-text"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your business..."
              rows={3}
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className={inputCls}
            />
          </div>

          {/* Website */}
          <div>
            <label className={labelCls}>Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className={inputCls}
            />
          </div>

          {/* Address */}
          <div>
            <label className={labelCls}>Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Lagos"
              className={inputCls}
            />
          </div>

          {/* Map picker */}
          <div>
            <label className={labelCls}>Location on Map</label>
            <div className="h-[280px] overflow-hidden rounded-xl border border-border">
              <MapPicker
                lat={lat}
                lng={lng}
                onSelect={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />
            </div>
            {lat && lng && (
              <p className="mt-1 text-[10px] text-light-text">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Hours */}
          <div>
            <label className={labelCls}>Business Hours</label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className={inputCls + " max-w-[140px]"}
              />
              <span className="text-sm text-light-text">to</span>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className={inputCls + " max-w-[140px]"}
              />
            </div>
          </div>

          {/* Working days */}
          <div>
            <label className={labelCls}>Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    workingDays.includes(d.value)
                      ? "bg-primary text-white"
                      : "border border-border text-light-text hover:bg-feed-bg"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveBusiness}
              disabled={saving}
              className={btnPrimary}
            >
              {saving
                ? "Saving..."
                : view === "edit"
                ? "Update Business"
                : "Create Business"}
            </button>
            <button
              onClick={() => {
                setView("list");
                resetBizForm();
              }}
              className={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Item Form (add / edit) ─────────────────────────────────────────────

  if (view === "add-item" || view === "edit-item") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <button
          onClick={() => {
            setView("detail");
            resetItemForm();
          }}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <IoChevronBack size={16} /> Back to{" "}
          {activeBiz?.name ?? "Business"}
        </button>

        <h1 className="mb-6 text-lg font-bold text-text">
          {view === "edit-item" ? "Edit Item" : "Add Item"}
        </h1>

        <div className="space-y-4">
          {/* Image */}
          <div>
            <label className={labelCls}>Item Image</label>
            <div
              onClick={() => itemFileRef.current?.click()}
              className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-feed-bg hover:border-primary"
            >
              {itemPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={itemPreview}
                  alt="Item"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-light-text">
                  <IoImageOutline size={28} className="mx-auto" />
                  <p className="mt-1 text-xs">Tap to upload</p>
                </div>
              )}
            </div>
            <input
              ref={itemFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setItemFile(f);
                  setItemPreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>Item Name *</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Jollof Rice"
              className={inputCls}
            />
          </div>

          {/* Price */}
          <div>
            <label className={labelCls}>Price (₦)</label>
            <input
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="0"
              min="0"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Item description..."
              rows={3}
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveItem}
              disabled={savingItem}
              className={btnPrimary}
            >
              {savingItem
                ? "Saving..."
                : view === "edit-item"
                ? "Update Item"
                : "Add Item"}
            </button>
            <button
              onClick={() => {
                setView("detail");
                resetItemForm();
              }}
              className={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Business Detail ────────────────────────────────────────────────────

  if (view === "detail" && activeBiz) {
    const cat = CATEGORIES.find((c) => c.value === activeBiz.category);
    const items = activeBiz.items ?? [];

    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => {
            setView("list");
            setActiveBiz(null);
          }}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          <IoChevronBack size={16} /> My Businesses
        </button>

        {/* Cover */}
        {activeBiz.cover_image_url && (
          <div className="mb-4 h-40 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeBiz.cover_image_url}
              alt={activeBiz.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {activeBiz.logo_url && (
              <div className="h-14 w-14 overflow-hidden rounded-full border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeBiz.logo_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-text">{activeBiz.name}</h1>
              <p className="text-xs text-light-text">{cat?.label ?? activeBiz.category}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                populateBizForm(activeBiz);
                setView("edit");
              }}
              className={btnSecondary + " !px-3 !py-1.5 !text-xs"}
            >
              <IoCreateOutline size={14} className="mr-1 inline" /> Edit
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this business and all its items?")) {
                  deleteBusiness(activeBiz.id);
                }
              }}
              disabled={deleting}
              className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
            >
              <IoTrashOutline size={14} className="mr-1 inline" />
              {deleting ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {activeBiz.description && (
          <p className="mt-3 text-sm text-text">{activeBiz.description}</p>
        )}

        {/* Info chips */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-light-text">
          {activeBiz.address && (
            <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1">
              <IoLocationOutline size={12} /> {activeBiz.address}
            </span>
          )}
          {activeBiz.phone && (
            <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1">
              <IoCallOutline size={12} /> {activeBiz.phone}
            </span>
          )}
          {activeBiz.website && (
            <a
              href={activeBiz.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1 hover:text-primary"
            >
              <IoGlobeOutline size={12} /> Website
            </a>
          )}
          {activeBiz.opening_time && activeBiz.closing_time && (
            <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1">
              <IoTimeOutline size={12} /> {activeBiz.opening_time} -{" "}
              {activeBiz.closing_time}
            </span>
          )}
        </div>

        {/* Working days */}
        {activeBiz.working_days && activeBiz.working_days.length > 0 && (
          <div className="mt-3 flex gap-1.5">
            {DAYS.map((d) => (
              <span
                key={d.value}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  activeBiz.working_days!.includes(d.value)
                    ? "bg-primary/10 text-primary"
                    : "bg-feed-bg text-light-text/50"
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>
        )}

        {/* Map */}
        {activeBiz.latitude && activeBiz.longitude && (
          <div className="mt-4 h-[200px] overflow-hidden rounded-xl border border-border">
            <MapPicker
              lat={activeBiz.latitude}
              lng={activeBiz.longitude}
              readOnly
            />
          </div>
        )}

        {/* Items */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">
              Menu / Items ({items.length})
            </h2>
            <button
              onClick={() => {
                resetItemForm();
                setView("add-item");
              }}
              className={btnPrimary + " !px-3 !py-1.5 !text-xs"}
            >
              <IoAddOutline size={14} className="mr-1 inline" /> Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-light-text">
              No items yet. Add your first product or menu item.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setActiveItem(item);
                    populateItemForm(item);
                    setView("edit-item");
                  }}
                  onDelete={() => {
                    if (confirm(`Delete "${item.name}"?`)) deleteItem(item.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── List View ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text">My Businesses</h1>
        <button
          onClick={() => {
            resetBizForm();
            setView("create");
          }}
          className={btnPrimary}
        >
          <IoAddOutline size={16} className="mr-1 inline" /> New Business
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-light-text">
          Loading...
        </div>
      ) : businesses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <IoStorefrontOutline
            size={40}
            className="mx-auto mb-3 text-light-text"
          />
          <p className="text-sm font-semibold text-text">
            No businesses yet
          </p>
          <p className="mt-1 text-xs text-light-text">
            Create your first business page and start selling
          </p>
          <button
            onClick={() => {
              resetBizForm();
              setView("create");
            }}
            className={btnPrimary + " mt-4"}
          >
            Create Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              biz={biz}
              active={activeBiz?.id === biz.id}
              onClick={async () => {
                try {
                  const data = await apiGet<{ business: Business }>(
                    `/business/public/${biz.id}`
                  );
                  setActiveBiz(data.business);
                  setView("detail");
                } catch {
                  setActiveBiz(biz);
                  setView("detail");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
