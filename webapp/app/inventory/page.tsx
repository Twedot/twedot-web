"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoCubeOutline,
  IoInformationCircleOutline,
  IoAddOutline,
  IoImageOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCloseOutline,
  IoChevronBack,
  IoChevronForward,
  IoCloudUploadOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost, apiPatch, apiDelete, apiUploadFile } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryImage {
  id: string;
  image_url: string;
  thumbnail_url?: string;
}

interface InventoryItem {
  id: string;
  title: string;
  price?: number | string | null;
  description?: string | null;
  is_available: boolean;
  type?: string;
  images?: InventoryImage[];
}

type View = "list" | "detail" | "create" | "edit";

const MAX_PHOTOS = 5;

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("fileName", file.name);
  fd.append("mimeType", file.type);
  fd.append("folder", "inventory");
  const result = await apiUploadFile<{ url: string }>("/media/upload/direct", fd);
  return result.url;
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, active, onClick }: { item: InventoryItem; active: boolean; onClick: () => void }) {
  const thumb = item.images?.[0]?.thumbnail_url || item.images?.[0]?.image_url;
  const price = item.price != null ? Number(item.price) : null;
  return (
    <button
      onClick={onClick}
      className={`overflow-hidden rounded-[14px] border text-left transition-colors ${
        active ? "border-primary" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-feed-bg">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IoCubeOutline size={28} className="text-light-text" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[12px] font-semibold text-text">{item.title}</p>
        {price != null && price > 0 ? (
          <p className="mt-0.5 text-[11px] font-semibold text-primary">₦{price.toLocaleString()}</p>
        ) : (
          <p className="mt-0.5 text-[11px] text-light-text">No price</p>
        )}
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          item.is_available ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-feed-bg text-light-text"
        }`}>
          {item.is_available ? "In stock" : "Out of stock"}
        </span>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [view, setView] = useState<View>("list");
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isInStock, setIsInStock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Photo state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<InventoryImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadItems = useCallback(async () => {
    const data = await apiGet<{ items: InventoryItem[] }>("/inventory/my-items").catch(() => null);
    setItems(data?.items ?? []);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingItems(true);
    loadItems().finally(() => setLoadingItems(false));
  }, [isAuthenticated, loadItems]);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => { previewUrls.forEach(URL.revokeObjectURL); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Photo helpers ────────────────────────────────────────────────────────

  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - existingImages.length - selectedFiles.length;
    const toAdd = files.slice(0, remaining);
    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setSelectedFiles(prev => [...prev, ...toAdd]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeNewPhoto(idx: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function removeExistingPhoto(idx: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Form helpers ─────────────────────────────────────────────────────────

  function resetForm() {
    setTitle(""); setPrice(""); setDescription(""); setIsInStock(true);
    previewUrls.forEach(URL.revokeObjectURL);
    setSelectedFiles([]); setPreviewUrls([]); setExistingImages([]);
  }

  function openCreate() {
    resetForm();
    setActiveItem(null);
    setView("create");
  }

  function openEdit(item: InventoryItem) {
    setTitle(item.title);
    setPrice(item.price != null ? String(item.price) : "");
    setDescription(item.description ?? "");
    setIsInStock(item.is_available);
    setExistingImages(item.images ?? []);
    previewUrls.forEach(URL.revokeObjectURL);
    setSelectedFiles([]); setPreviewUrls([]);
    setActiveItem(item);
    setView("edit");
  }

  function openDetail(item: InventoryItem) {
    setActiveItem(item);
    setCarouselIdx(0);
    setView("detail");
  }

  // ── Upload all selected files ────────────────────────────────────────────

  async function uploadSelectedFiles(): Promise<string[]> {
    return Promise.all(selectedFiles.map(uploadImage));
  }

  // ── Save (create) ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const numericPrice = price.trim() ? parseFloat(price.replace(/,/g, "")) : undefined;

    try {
      let newImageUrls: string[] = [];
      if (selectedFiles.length) {
        newImageUrls = await uploadSelectedFiles();
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: "product",
        is_available: isInStock,
      };
      if (numericPrice != null && !isNaN(numericPrice) && numericPrice > 0) payload.price = numericPrice;
      if (newImageUrls.length) payload.image_urls = newImageUrls;

      const created = await apiPost<{ item: InventoryItem }>("/inventory", payload);
      if (!created?.item) { notify("Failed to create item"); return; }
      await loadItems();
      resetForm();
      setView("list");
      notify("Item created");
    } catch (err: any) {
      notify(err?.message ?? "Failed to create item");
    } finally {
      setSaving(false);
    }
  };

  // ── Save (edit) ──────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    if (!activeItem || !title.trim() || saving) return;
    setSaving(true);
    const numericPrice = price.trim() ? parseFloat(price.replace(/,/g, "")) : undefined;

    try {
      let newImageUrls: string[] = [];
      if (selectedFiles.length) {
        newImageUrls = await uploadSelectedFiles();
      }

      const allImageUrls = [
        ...existingImages.map(img => img.image_url),
        ...newImageUrls,
      ];

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: "product",
        is_available: isInStock,
        image_urls: allImageUrls,
      };
      if (numericPrice != null && !isNaN(numericPrice) && numericPrice > 0) payload.price = numericPrice;

      await apiPatch(`/inventory/${activeItem.id}`, payload);
      await loadItems();
      setView("list");
      setActiveItem(null);
      notify("Item updated");
    } catch (err: any) {
      notify(err?.message ?? "Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete item ──────────────────────────────────────────────────────────

  const handleDelete = async (itemId: string) => {
    if (deleting) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiDelete(`/inventory/${itemId}`);
      await loadItems();
      setView("list");
      setActiveItem(null);
      notify("Item deleted");
    } catch (err: any) {
      notify(err?.message ?? "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) return null;

  const totalPhotos = existingImages.length + selectedFiles.length;
  const canAddMore = totalPhotos < MAX_PHOTOS;
  const canSave = title.trim().length > 0 && !saving;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left panel: item grid ── */}
      <div className="flex w-[330px] flex-shrink-0 flex-col border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Inventory</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <IoAddOutline size={15} />
            Add Item
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-4 mt-3 mb-1 flex items-start gap-2 rounded-xl bg-primary/[0.07] p-3">
          <IoInformationCircleOutline size={16} className="mt-0.5 flex-shrink-0 text-primary" />
          <p className="text-[11px] leading-[17px] text-text/80">
            Add items to your inventory so other users can see your products and services.
          </p>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {loadingItems ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[14px] border border-border">
                  <div className="aspect-square w-full animate-pulse bg-feed-bg" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-feed-bg" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-feed-bg" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <IoCubeOutline size={40} className="text-light-text" />
              <p className="text-[12px] leading-5 text-light-text max-w-[200px]">
                No items yet. Add your first product or service.
              </p>
              <button
                onClick={openCreate}
                className="rounded-full bg-primary px-5 py-2 text-[12px] font-semibold text-white hover:bg-primary/90"
              >
                Add Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {items.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  active={activeItem?.id === item.id && (view === "detail" || view === "edit")}
                  onClick={() => openDetail(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Detail view ── */}
        {view === "detail" && activeItem && (() => {
          const images = activeItem.images?.map(img => img.image_url) ?? [];
          return (
            <>
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="text-[13px] font-bold text-text">Item Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(activeItem)}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-feed-bg transition-colors"
                  >
                    <IoCreateOutline size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(activeItem.id)}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                  >
                    <IoTrashOutline size={14} />
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Image carousel */}
                <div className="relative overflow-hidden bg-[#1a1a1a]" style={{ height: 280 }}>
                  {images.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={images[carouselIdx]} alt="" className="h-full w-full object-contain" />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setCarouselIdx(i => Math.max(0, i - 1))}
                            disabled={carouselIdx === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
                          >
                            <IoChevronBack size={16} />
                          </button>
                          <button
                            onClick={() => setCarouselIdx(i => Math.min(images.length - 1, i + 1))}
                            disabled={carouselIdx === images.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
                          >
                            <IoChevronForward size={16} />
                          </button>
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {images.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCarouselIdx(i)}
                                className={`rounded-full transition-all ${i === carouselIdx ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/40"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <IoImageOutline size={48} className="text-white/30" />
                    </div>
                  )}
                </div>

                <div className="px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[18px] font-bold text-text">{activeItem.title}</h3>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      activeItem.is_available ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-feed-bg text-light-text"
                    }`}>
                      {activeItem.is_available ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                  {activeItem.price != null && Number(activeItem.price) > 0 && (
                    <p className="mt-1 text-[22px] font-extrabold text-text">
                      ₦{Number(activeItem.price).toLocaleString()}
                    </p>
                  )}
                  {activeItem.description && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-light-text">Description</p>
                      <p className="text-[13px] leading-[20px] text-text">{activeItem.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* ── Create / Edit form ── */}
        {(view === "create" || view === "edit") && (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-[13px] font-bold text-text">{view === "create" ? "Add Item" : "Edit Item"}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setView("list"); setActiveItem(null); resetForm(); }}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-feed-bg transition-colors"
                >
                  <IoCloseOutline size={14} />
                  Cancel
                </button>
                <button
                  onClick={view === "create" ? handleCreate : handleUpdate}
                  disabled={!canSave}
                  className="rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Photos */}
              <div className="border-b border-border px-5 py-4">
                <p className="mb-3 text-[13px] font-semibold text-text">
                  Photos <span className="text-[11px] font-normal text-light-text">({totalPhotos}/{MAX_PHOTOS})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* Existing images */}
                  {existingImages.map((img, idx) => (
                    <div key={img.id} className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.thumbnail_url || img.image_url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeExistingPhoto(idx)}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <IoCloseOutline size={12} />
                      </button>
                    </div>
                  ))}
                  {/* New (local) previews */}
                  {previewUrls.map((url, idx) => (
                    <div key={url} className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border border-primary/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeNewPhoto(idx)}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <IoCloseOutline size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Add more button */}
                  {canAddMore && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-[72px] w-[72px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-feed-bg text-light-text hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <IoCloudUploadOutline size={20} />
                      <span className="text-[9px] font-semibold">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePickFiles}
                />
              </div>

              {/* Fields */}
              <div className="border-b border-border px-5 py-4 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-light-text">
                      Item Title <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-light-text">{title.length}/50</span>
                  </div>
                  <input
                    type="text"
                    maxLength={50}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter item title"
                    className="w-full rounded-xl border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder-light-text/50 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-light-text">Price</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-feed-bg px-3 py-2.5">
                    <span className="text-[13px] font-semibold text-light-text">₦</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent text-[13px] text-text placeholder-light-text/50 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-light-text">Description</label>
                    <span className="text-[10px] text-light-text">{description.length}/500</span>
                  </div>
                  <textarea
                    maxLength={500}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your item..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder-light-text/50 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Availability toggle */}
              <div className="border-b border-border px-5 py-4">
                <p className="mb-3 text-[13px] font-semibold text-text">Availability</p>
                <div className="flex items-center justify-between rounded-xl bg-feed-bg px-4 py-3">
                  <div>
                    <p className="text-[12px] font-semibold text-text">In Stock</p>
                    <p className="mt-0.5 text-[11px] text-light-text">{isInStock ? "Available for purchase" : "Currently unavailable"}</p>
                  </div>
                  <button
                    onClick={() => setIsInStock(v => !v)}
                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${isInStock ? "bg-primary" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isInStock ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Delete button on edit */}
              {view === "edit" && activeItem && (
                <div className="px-5 py-4 pb-6">
                  <button
                    onClick={() => handleDelete(activeItem.id)}
                    disabled={deleting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-[12px] font-semibold text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                  >
                    <IoTrashOutline size={15} />
                    Delete Item
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {view === "list" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <IoCubeOutline size={44} className="text-light-text" />
            <p className="text-[13px] font-semibold text-text">Select an item</p>
            <p className="text-[12px] leading-5 text-light-text">Click an item on the left to view its details, or add a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
