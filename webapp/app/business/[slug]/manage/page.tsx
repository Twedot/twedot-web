"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
  IoListOutline,
  IoReceiptOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost, apiPatch, apiDelete, apiUploadFile } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

const MapPicker = dynamic(() => import("../../MapPicker"), { ssr: false });

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

interface BusinessFeature {
  id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  sort_order: number;
}

interface BusinessOrder {
  id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  note?: string | null;
  created_at: string;
  item?: {
    id: string;
    name: string;
    price: number | string;
    image_url?: string | null;
  } | null;
  buyer?: {
    id: string;
    name: string;
    profile_photo_url?: string | null;
  } | null;
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

type View = "detail" | "edit" | "add-item" | "edit-item" | "add-feature" | "edit-feature" | "orders";

const ITEM_CATEGORIES = ["food", "retail", "sales", "stores"];
const isItemBusiness = (cat: string) => ITEM_CATEGORIES.includes(cat);

const CATEGORIES = [
  { value: "food", label: "Food & Restaurant" },
  { value: "services", label: "Services" },
  { value: "retail", label: "Retail & Shop" },
  { value: "sales", label: "Sales" },
  { value: "stores", label: "Stores" },
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
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IoImageOutline size={20} className="text-light-text" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{item.name}</p>
        {price > 0 && (
          <p className="text-xs font-semibold text-primary">₦{price.toLocaleString()}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={onEdit} className="rounded-lg p-1.5 text-light-text hover:bg-feed-bg">
          <IoCreateOutline size={16} />
        </button>
        <button onClick={onDelete} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <IoTrashOutline size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Feature Row ──────────────────────────────────────────────────────────────

function FeatureRow({
  feature,
  onEdit,
  onDelete,
}: {
  feature: BusinessFeature;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <IoListOutline size={18} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{feature.title}</p>
        {feature.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-light-text">{feature.description}</p>
        )}
        {feature.link && (
          <p className="mt-0.5 truncate text-[11px] text-primary">{feature.link}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={onEdit} className="rounded-lg p-1.5 text-light-text hover:bg-feed-bg">
          <IoCreateOutline size={16} />
        </button>
        <button onClick={onDelete} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <IoTrashOutline size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Delete confirm popover ───────────────────────────────────────────────────

function DeleteConfirm({
  title,
  subtitle,
  confirmLabel,
  loading,
  anchorRef,
  onConfirm,
  onCancel,
}: {
  title: string;
  subtitle: string;
  confirmLabel: string;
  loading: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const rect = anchorRef.current?.getBoundingClientRect();
  if (!rect) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div
        className="fixed z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        style={{
          top: `${rect.bottom + 8}px`,
          right: `${window.innerWidth - rect.right}px`,
          minWidth: "220px",
        }}
      >
        <div className="px-4 py-3">
          <p className="text-[13px] font-bold text-text">{title}</p>
          <p className="text-[12px] text-light-text">{subtitle}</p>
        </div>
        <div className="border-t border-border">
          <button
            disabled={loading}
            onClick={onConfirm}
            className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-feed-bg disabled:opacity-60"
          >
            <IoTrashOutline size={16} />
            {loading ? "Deleting…" : confirmLabel}
          </button>
          <button
            disabled={loading}
            onClick={onCancel}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-[13px] font-semibold text-text transition-colors hover:bg-feed-bg"
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Inline delete dialog (centered) ─────────────────────────────────────────

function InlineDeleteDialog({
  title,
  subtitle,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  subtitle: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="px-4 py-3">
          <p className="text-[13px] font-bold text-text">{title}</p>
          <p className="text-[12px] text-light-text">{subtitle}</p>
        </div>
        <div className="border-t border-border">
          <button
            disabled={loading}
            onClick={onConfirm}
            className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-feed-bg disabled:opacity-60"
          >
            <IoTrashOutline size={16} />
            {loading ? "Deleting…" : confirmLabel}
          </button>
          <button
            disabled={loading}
            onClick={onCancel}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-[13px] font-semibold text-text transition-colors hover:bg-feed-bg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManageBusinessPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [biz, setBiz] = useState<Business | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [view, setView] = useState<View>("detail");
  const [activeItem, setActiveItem] = useState<BusinessItem | null>(null);
  const [features, setFeatures] = useState<BusinessFeature[]>([]);
  const [activeFeature, setActiveFeature] = useState<BusinessFeature | null>(null);

  // Delete state
  const [showDeleteBiz, setShowDeleteBiz] = useState(false);
  const [deletingBiz, setDeletingBiz] = useState(false);
  const [deleteItemTarget, setDeleteItemTarget] = useState<BusinessItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [deleteFeatureTarget, setDeleteFeatureTarget] = useState<BusinessFeature | null>(null);
  const [deletingFeature, setDeletingFeature] = useState(false);
  const deleteBizBtnRef = useRef<HTMLButtonElement>(null);

  // Business form state
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

  // Item form state
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [itemPreview, setItemPreview] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Feature form state
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDesc, setFeatureDesc] = useState("");
  const [featureLink, setFeatureLink] = useState("");
  const [savingFeature, setSavingFeature] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadBiz = useCallback(async () => {
    const data = await apiGet<{ business: Business }>(`/business/slug/${slug}`, { auth: false }).catch(() => null);
    if (!data?.business) { router.replace("/business"); return; }
    const b = data.business;
    setBiz(b);
    const [featRes, ordersRes] = await Promise.all([
      !isItemBusiness(b.category)
        ? apiGet<{ features: BusinessFeature[] }>(`/business/public/${b.id}/features`, { auth: false }).catch(() => null)
        : Promise.resolve(null),
      apiGet<{ orders: BusinessOrder[] }>(`/business/${b.id}/orders`).catch(() => null),
    ]);
    setFeatures(featRes?.features ?? []);
    setOrders(ordersRes?.orders ?? []);
  }, [slug, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingBiz(true);
    loadBiz().finally(() => setLoadingBiz(false));
  }, [isAuthenticated, loadBiz]);

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
    setItemName(""); setItemPrice(""); setItemDesc("");
    setItemFile(null); setItemPreview(null);
  }

  function populateItemForm(item: BusinessItem) {
    setItemName(item.name);
    setItemPrice(String(Number(item.price)));
    setItemDesc(item.description ?? "");
    setItemFile(null);
    setItemPreview(item.image_url ?? null);
  }

  function resetFeatureForm() {
    setFeatureTitle(""); setFeatureDesc(""); setFeatureLink("");
  }

  function populateFeatureForm(f: BusinessFeature) {
    setFeatureTitle(f.title);
    setFeatureDesc(f.description ?? "");
    setFeatureLink(f.link ?? "");
  }

  function toggleDay(d: string) {
    setWorkingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function saveBusiness() {
    if (!biz || !name.trim()) { notify("Business name is required"); return; }
    setSaving(true);
    try {
      let cover_image_url = coverPreview;
      let logo_url = logoPreview;
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

      await apiPatch(`/business/${biz.id}`, body);
      notify("Business updated");
      await loadBiz();
      const updated = await apiGet<{ business: Business }>(`/business/slug/${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, { auth: false }).catch(() => null);
      const newSlug = updated?.business?.slug ?? slug;
      if (newSlug !== slug) {
        router.replace(`/business/${newSlug}/manage`);
      } else {
        setView("detail");
      }
    } catch (e: any) {
      notify(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBusiness() {
    if (!biz) return;
    setDeletingBiz(true);
    try {
      await apiDelete(`/business/${biz.id}`);
      notify("Business deleted");
      router.replace("/business");
    } catch (e: any) {
      notify(e.message || "Delete failed");
      setDeletingBiz(false);
      setShowDeleteBiz(false);
    }
  }

  async function saveItem() {
    if (!biz || !itemName.trim()) { notify("Item name is required"); return; }
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
        await apiPatch(`/business/${biz.id}/items/${activeItem.id}`, body);
        notify("Item updated");
      } else {
        await apiPost(`/business/${biz.id}/items`, body);
        notify("Item added");
      }
      await loadBiz();
      setView("detail");
      resetItemForm();
    } catch (e: any) {
      notify(e.message || "Failed to save item");
    } finally {
      setSavingItem(false);
    }
  }

  async function deleteItem(item: BusinessItem) {
    if (!biz) return;
    setDeletingItem(true);
    try {
      await apiDelete(`/business/${biz.id}/items/${item.id}`);
      notify("Item deleted");
      await loadBiz();
    } catch (e: any) {
      notify(e.message || "Delete failed");
    } finally {
      setDeletingItem(false);
      setDeleteItemTarget(null);
    }
  }

  async function saveFeature() {
    if (!biz || !featureTitle.trim()) { notify("Feature title is required"); return; }
    setSavingFeature(true);
    try {
      const body: Record<string, unknown> = {
        title: featureTitle.trim(),
        description: featureDesc.trim() || undefined,
        link: featureLink.trim() || undefined,
      };

      if (view === "edit-feature" && activeFeature) {
        await apiPatch(`/business/${biz.id}/features/${activeFeature.id}`, body);
        notify("Feature updated");
      } else {
        await apiPost(`/business/${biz.id}/features`, body);
        notify("Feature added");
      }
      await loadBiz();
      setView("detail");
      resetFeatureForm();
    } catch (e: any) {
      notify(e.message || "Failed to save feature");
    } finally {
      setSavingFeature(false);
    }
  }

  async function deleteFeature(feature: BusinessFeature) {
    if (!biz) return;
    setDeletingFeature(true);
    try {
      await apiDelete(`/business/${biz.id}/features/${feature.id}`);
      notify("Feature deleted");
      await loadBiz();
    } catch (e: any) {
      notify(e.message || "Delete failed");
    } finally {
      setDeletingFeature(false);
      setDeleteFeatureTarget(null);
    }
  }

  async function updateOrderStatus(orderId: string, status: "accepted" | "declined") {
    if (!biz) return;
    setUpdatingOrder(orderId);
    try {
      await apiPatch(`/business/${biz.id}/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch (e: any) {
      notify(e.message || "Failed to update order");
    } finally {
      setUpdatingOrder(null);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputCls = "w-full rounded-xl border border-border bg-feed-bg px-3.5 py-2.5 text-sm text-text placeholder:text-light-text outline-none focus:border-primary";
  const labelCls = "mb-1.5 block text-xs font-semibold text-light-text";
  const btnPrimary = "rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
  const btnSecondary = "rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text hover:bg-feed-bg";

  if (isLoading || !isAuthenticated) return null;

  if (loadingBiz) {
    return <div className="py-20 text-center text-sm text-light-text">Loading…</div>;
  }

  if (!biz) return null;

  // ─── Edit Business Form ──────────────────────────────────────────────────

  if (view === "edit") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={() => setView("detail")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <IoChevronBack size={16} /> Back
        </button>
        <h1 className="mb-6 text-lg font-bold text-text">Edit Business</h1>
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
            <button onClick={saveBusiness} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Update Business"}</button>
            <button onClick={() => setView("detail")} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Item Form ───────────────────────────────────────────────────────────

  if (view === "add-item" || view === "edit-item") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <button onClick={() => { setView("detail"); resetItemForm(); }}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <IoChevronBack size={16} /> Back to {biz.name}
        </button>
        <h1 className="mb-6 text-lg font-bold text-text">{view === "edit-item" ? "Edit Item" : "Add Item"}</h1>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Item Image</label>
            <div onClick={() => itemFileRef.current?.click()}
              className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-feed-bg hover:border-primary">
              {itemPreview
                ? <img src={itemPreview} alt="Item" className="h-full w-full object-cover" />
                : <div className="text-center text-light-text"><IoImageOutline size={28} className="mx-auto" /><p className="mt-1 text-xs">Tap to upload</p></div>}
            </div>
            <input ref={itemFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setItemFile(f); setItemPreview(URL.createObjectURL(f)); } e.target.value = ""; }} />
          </div>

          <div><label className={labelCls}>Item Name *</label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Jollof Rice" className={inputCls} /></div>

          <div><label className={labelCls}>Price (₦)</label>
            <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="0" min="0" className={inputCls} /></div>

          <div><label className={labelCls}>Description</label>
            <textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Item description…" rows={3} className={inputCls + " resize-none"} /></div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveItem} disabled={savingItem} className={btnPrimary}>{savingItem ? "Saving…" : view === "edit-item" ? "Update Item" : "Add Item"}</button>
            <button onClick={() => { setView("detail"); resetItemForm(); }} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Feature Form ────────────────────────────────────────────────────────

  if (view === "add-feature" || view === "edit-feature") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <button onClick={() => { setView("detail"); resetFeatureForm(); }}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <IoChevronBack size={16} /> Back to {biz.name}
        </button>
        <h1 className="mb-6 text-lg font-bold text-text">
          {view === "edit-feature" ? "Edit Feature" : "Add Feature"}
        </h1>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Feature Title *</label>
            <input
              value={featureTitle}
              onChange={(e) => setFeatureTitle(e.target.value)}
              placeholder="e.g. Payment Integration"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={featureDesc}
              onChange={(e) => setFeatureDesc(e.target.value)}
              placeholder="Describe what this feature or service offers…"
              rows={5}
              className={inputCls + " resize-none"}
            />
          </div>

          <div>
            <label className={labelCls}>Link (optional)</label>
            <input
              value={featureLink}
              onChange={(e) => setFeatureLink(e.target.value)}
              placeholder="https://example.com/feature"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-light-text">Users can tap this to visit more details about this feature.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveFeature} disabled={savingFeature} className={btnPrimary}>
              {savingFeature ? "Saving…" : view === "edit-feature" ? "Update Feature" : "Add Feature"}
            </button>
            <button onClick={() => { setView("detail"); resetFeatureForm(); }} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Orders View ─────────────────────────────────────────────────────────

  if (view === "orders") {
    const statusBadge = (status: string) => {
      const map: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        declined: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        cancelled: "bg-feed-bg text-light-text",
      };
      return map[status] ?? "bg-feed-bg text-light-text";
    };

    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={() => setView("detail")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <IoChevronBack size={16} /> Back to {biz.name}
        </button>
        <h1 className="mb-5 text-lg font-bold text-text">Incoming Orders ({orders.length})</h1>

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <IoReceiptOutline size={36} className="mx-auto mb-2 text-light-text" />
            <p className="text-sm text-light-text">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-border p-4">
                {/* Buyer + item */}
                <div className="flex items-center gap-3">
                  {order.buyer?.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.buyer.profile_photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-feed-bg">
                      <IoStorefrontOutline size={16} className="text-light-text" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{order.buyer?.name ?? "Unknown"}</p>
                    {order.item && (
                      <p className="truncate text-xs text-light-text">
                        {order.item.name}
                        {Number(order.item.price) > 0 && ` · ₦${Number(order.item.price).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {order.note && (
                  <p className="mt-3 rounded-lg bg-feed-bg px-3 py-2 text-xs text-text">
                    &ldquo;{order.note}&rdquo;
                  </p>
                )}

                {order.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={updatingOrder === order.id}
                      onClick={() => updateOrderStatus(order.id, "accepted")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <IoCheckmarkOutline size={14} />
                      {updatingOrder === order.id ? "…" : "Accept"}
                    </button>
                    <button
                      disabled={updatingOrder === order.id}
                      onClick={() => updateOrderStatus(order.id, "declined")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      <IoCloseOutline size={14} />
                      {updatingOrder === order.id ? "…" : "Decline"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Detail View ─────────────────────────────────────────────────────────

  const cat = CATEGORIES.find((c) => c.value === biz.category);
  const items = biz.items ?? [];
  const useItems = isItemBusiness(biz.category);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button onClick={() => router.push("/business")}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
        <IoChevronBack size={16} /> My Businesses
      </button>

      {biz.cover_image_url && (
        <div className="mb-4 h-40 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={biz.cover_image_url} alt={biz.name} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {biz.logo_url && (
            <div className="h-14 w-14 overflow-hidden rounded-full border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={biz.logo_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-text">{biz.name}</h1>
            <p className="text-xs text-light-text">{cat?.label ?? biz.category}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("orders")}
            className="relative flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-feed-bg"
          >
            <IoReceiptOutline size={14} /> Orders
            {orders.filter((o) => o.status === "pending").length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {orders.filter((o) => o.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => { populateBizForm(biz); setView("edit"); }}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-feed-bg"
          >
            <IoCreateOutline size={14} /> Edit
          </button>
          <button
            ref={deleteBizBtnRef}
            onClick={() => setShowDeleteBiz(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
          >
            <IoTrashOutline size={14} /> Delete
          </button>
        </div>
      </div>

      {biz.description && <p className="mt-3 text-sm text-text">{biz.description}</p>}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-light-text">
        {biz.address && (
          <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1">
            <IoLocationOutline size={12} /> {biz.address}
          </span>
        )}
        {biz.phone && (
          <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1">
            <IoCallOutline size={12} /> {biz.phone}
          </span>
        )}
        {biz.website && (
          <a href={biz.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1 hover:text-primary">
            <IoGlobeOutline size={12} /> Website
          </a>
        )}
        {biz.opening_time && biz.closing_time && (
          <span className="flex items-center gap-1 rounded-full bg-feed-bg px-3 py-1">
            <IoTimeOutline size={12} /> {biz.opening_time} - {biz.closing_time}
          </span>
        )}
      </div>

      {biz.working_days && biz.working_days.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {DAYS.map((d) => (
            <span key={d.value}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${biz.working_days!.includes(d.value) ? "bg-primary/10 text-primary" : "bg-feed-bg text-light-text/50"}`}>
              {d.label}
            </span>
          ))}
        </div>
      )}

      {biz.latitude && biz.longitude && (
        <div className="mt-4 h-[200px] overflow-hidden rounded-xl border border-border">
          <MapPicker lat={biz.latitude} lng={biz.longitude} readOnly />
        </div>
      )}

      {/* Items — food & retail only */}
      {useItems && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">Menu / Items ({items.length})</h2>
            <button onClick={() => { resetItemForm(); setView("add-item"); }}
              className={btnPrimary + " !px-3 !py-1.5 !text-xs flex items-center gap-1"}>
              <IoAddOutline size={14} /> Add Item
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
                  onEdit={() => { setActiveItem(item); populateItemForm(item); setView("edit-item"); }}
                  onDelete={() => setDeleteItemTarget(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features — all non-food/retail categories */}
      {!useItems && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">Features / Services ({features.length})</h2>
            <button onClick={() => { resetFeatureForm(); setView("add-feature"); }}
              className={btnPrimary + " !px-3 !py-1.5 !text-xs flex items-center gap-1"}>
              <IoAddOutline size={14} /> Add Feature
            </button>
          </div>

          {features.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-light-text">
              No features yet. Add what your business offers.
            </div>
          ) : (
            <div className="space-y-2">
              {features.map((f) => (
                <FeatureRow
                  key={f.id}
                  feature={f}
                  onEdit={() => { setActiveFeature(f); populateFeatureForm(f); setView("edit-feature"); }}
                  onDelete={() => setDeleteFeatureTarget(f)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete business confirm */}
      {showDeleteBiz && (
        <DeleteConfirm
          title={`Delete "${biz.name}"?`}
          subtitle="This will remove the business and all its data permanently."
          confirmLabel="Delete business"
          loading={deletingBiz}
          anchorRef={deleteBizBtnRef}
          onConfirm={deleteBusiness}
          onCancel={() => setShowDeleteBiz(false)}
        />
      )}

      {/* Delete item confirm */}
      {deleteItemTarget && (
        <InlineDeleteDialog
          title={`Delete "${deleteItemTarget.name}"?`}
          subtitle="This item will be permanently removed."
          confirmLabel="Delete item"
          loading={deletingItem}
          onConfirm={() => deleteItem(deleteItemTarget)}
          onCancel={() => setDeleteItemTarget(null)}
        />
      )}

      {/* Delete feature confirm */}
      {deleteFeatureTarget && (
        <InlineDeleteDialog
          title={`Delete "${deleteFeatureTarget.title}"?`}
          subtitle="This feature will be permanently removed."
          confirmLabel="Delete feature"
          loading={deletingFeature}
          onConfirm={() => deleteFeature(deleteFeatureTarget)}
          onCancel={() => setDeleteFeatureTarget(null)}
        />
      )}
    </div>
  );
}
