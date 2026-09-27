"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoCloseOutline,
  IoImageOutline,
  IoVideocamOutline,
  IoTextOutline,
  IoAtOutline,
  IoGlobeOutline,
  IoCheckmarkCircle,
  IoPersonOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPlayCircle,
  IoChatbubbleOutline,
  IoChatbubble,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiPost, apiUploadFile } from "@/lib/api";
import { uploadStore } from "@/lib/uploadStore";

type Mode = "text" | "image" | "video";
type MediaItem = { file: File; preview: string; type: "image" | "video" };

function generateId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("text");
  const [textContent, setTextContent] = useState("");
  const [caption, setCaption] = useState("");
  const [allowComments, setAllowComments] = useState(true);

  // Multi-item media state — mirrors the mobile's selectedMedia array
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [textContent]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 10);
    const newItems: MediaItem[] = arr.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    }));
    setMediaItems((prev) => {
      const combined = [...prev, ...newItems].slice(0, 10);
      return combined;
    });
    setCurrentIndex((prev) => {
      const existing = prev; // keep on current unless first pick
      return existing;
    });
    // Set mode based on first file if just picking
    if (arr[0]) setMode(arr[0].type.startsWith("video/") ? "video" : "image");
  }, []);

  const handleInitialPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setMediaItems([]);
    setCurrentIndex(0);
    addFiles(files);
  }, [addFiles]);

  const handleAddMore = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFiles(files);
    // jump to the first newly added item
    setCurrentIndex((prev) => {
      // will be set after state update — handled via effect
      return prev;
    });
    e.target.value = "";
  }, [addFiles]);

  // After adding more, jump to first new item
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (mediaItems.length > prevCountRef.current && prevCountRef.current > 0) {
      setCurrentIndex(prevCountRef.current);
    }
    prevCountRef.current = mediaItems.length;
  }, [mediaItems.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    setMediaItems([]);
    setCurrentIndex(0);
    addFiles(files);
  }, [addFiles]);

  const removeItem = (index: number) => {
    setMediaItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, mediaItems.length - 2)));
  };

  const current = mediaItems[currentIndex] ?? null;

  const canPost =
    !posting &&
    (mode === "text" ? textContent.trim().length > 0 : mediaItems.length > 0);

  const handlePost = () => {
    if (!canPost) return;
    setError(null);
    setPosting(true);

    // Navigate to stories immediately — upload continues in the background
    router.push("/feed");

    if (mode === "text") {
      uploadStore.set({ total: 1, done: 0, failed: false, label: "text" });
      apiPost("/status/", {
        type: "text",
        content: textContent.trim(),
        isPrivate: false,
        allowComments,
      })
        .then(() => {
          uploadStore.set({ total: 1, done: 1, failed: false, label: "text" });
          setTimeout(() => uploadStore.set(null), 2500);
        })
        .catch(() => {
          uploadStore.set({ total: 1, done: 0, failed: true, label: "text" });
          setTimeout(() => uploadStore.set(null), 3000);
        });
      return;
    }

    // Media upload — fire each item sequentially in the background
    const items = [...mediaItems];
    const groupId = items.length > 1 ? generateId() : undefined;
    uploadStore.set({ total: items.length, done: 0, failed: false, label: "media" });

    (async () => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const fd = new FormData();
          fd.append("file", item.file);
          fd.append("fileName", item.file.name);
          fd.append("mimeType", item.file.type);
          fd.append("clientStatusId", generateId());
          fd.append("statusType", item.type);
          fd.append("caption", caption.trim());
          fd.append("isPrivate", "false");
          fd.append("allowComments", allowComments ? "true" : "false");
          if (groupId) fd.append("groupId", groupId);
          await apiUploadFile("/media/upload/direct", fd);
          uploadStore.set({ total: items.length, done: i + 1, failed: false, label: "media" });
        } catch {
          uploadStore.set({ total: items.length, done: i, failed: true, label: "media" });
          setTimeout(() => uploadStore.set(null), 3000);
          return;
        }
      }
      setTimeout(() => uploadStore.set(null), 2500);
    })();
  };

  if (isLoading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-light-text hover:bg-feed-bg transition-colors"
        >
          <IoCloseOutline size={20} />
        </button>
        <h1 className="text-[16px] font-bold text-text">Create Story</h1>
      </div>

      {/* Mode switcher */}
      <div className="mb-5 flex gap-1.5">
        {(["text", "image", "video"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${
              mode === m ? "bg-primary text-white" : "bg-feed-bg text-light-text hover:text-text"
            }`}
          >
            {m === "text" ? <IoTextOutline size={14} /> : m === "image" ? <IoImageOutline size={14} /> : <IoVideocamOutline size={14} />}
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</div>
      )}

      {/* ── TEXT MODE ── */}
      {mode === "text" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            {user.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_photo_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <IoPersonOutline size={20} className="text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="mb-1 text-[13px] font-semibold text-text">{user.name ?? "You"}</p>
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value.slice(0, 300))}
                placeholder="What's happening?"
                autoFocus
                rows={4}
                className="w-full resize-none bg-transparent text-[15px] leading-[1.6] text-text outline-none placeholder-light-text"
              />
            </div>
          </div>
          <div className="text-right text-[11px] text-light-text">{textContent.length}/300</div>
        </div>
      )}

      {/* ── IMAGE / VIDEO MODE ── */}
      {(mode === "image" || mode === "video") && (
        <>
          {mediaItems.length === 0 ? (
            /* Empty drop zone */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-feed-bg hover:bg-border/30 transition-colors"
            >
              {mode === "image" ? (
                <IoImageOutline size={44} className="text-light-text" />
              ) : (
                <IoVideocamOutline size={44} className="text-light-text" />
              )}
              <p className="text-[14px] font-semibold text-text">
                {mode === "image" ? "Pick images" : "Pick a video"}
              </p>
              <p className="text-[12px] text-light-text">Click to browse · drag & drop · up to 10 files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={mode === "image" ? "image/*" : "video/*"}
                multiple={mode === "image"}
                onChange={handleInitialPick}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview + horizontal thumbnail strip below */
            <div className="flex flex-col gap-3">
              {/* Main preview — full width, fixed height */}
              <div className="relative w-full h-[280px] overflow-hidden rounded-2xl bg-black">
                {current?.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.preview}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : current?.type === "video" ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    key={current.preview}
                    src={current.preview}
                    controls
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}

                <span className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white drop-shadow">
                  Cover
                </span>

                <button
                  onClick={() => removeItem(currentIndex)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
                >
                  <IoTrashOutline size={15} />
                </button>
              </div>

              {/* Horizontal thumbnail strip — scrolls if needed, no height impact */}
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {mediaItems.map((item, i) => (
                  <button
                    key={item.preview}
                    onClick={() => setCurrentIndex(i)}
                    className="relative h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-xl bg-black"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {item.type === "video" && (
                      <IoPlayCircle size={14} className="absolute bottom-1 right-1 text-white drop-shadow" />
                    )}
                    {i === currentIndex && mediaItems.length > 1 && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <IoCheckmarkCircle size={10} className="text-white" />
                      </span>
                    )}
                  </button>
                ))}

                {/* Add More tile */}
                {mediaItems.length < 10 && (
                  <button
                    onClick={() => addMoreRef.current?.click()}
                    className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-feed-bg hover:bg-border/40 transition-colors"
                  >
                    <IoAddOutline size={20} className="text-light-text" />
                  </button>
                )}
                <input
                  ref={addMoreRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleAddMore}
                  className="hidden"
                />
              </div>

              {/* Caption */}
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value.slice(0, 500));
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="Add a caption…"
                rows={2}
                className="w-full resize-none overflow-hidden rounded-xl bg-feed-bg px-3 py-2.5 text-[14px] text-text outline-none placeholder-light-text"
              />
            </div>
          )}
        </>
      )}

      {/* Actions — two rows, same text-light-text style, no borders */}
      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
        {/* Row 1: quick insert */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => mode === "text" ? setTextContent((t) => `${t}#`) : setCaption((c) => `${c}#`)}
            className="flex items-center gap-1 text-[12px] font-bold text-light-text hover:text-primary transition-colors"
          >
            <span className="text-[13px] font-bold leading-none">#</span>
            Hashtag
          </button>
          <button
            onClick={() => mode === "text" ? setTextContent((t) => `${t}@`) : setCaption((c) => `${c}@`)}
            className="flex items-center gap-1 text-[12px] font-bold text-light-text hover:text-primary transition-colors"
          >
            <IoAtOutline size={12} />
            Mention
          </button>
        </div>

        {/* Row 2: Public then Comments stacked */}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-normal text-light-text">
            <IoGlobeOutline size={13} />
            Public · Everyone can see
          </span>

          <button
            onClick={() => setAllowComments((v) => !v)}
            className="flex items-center gap-2 text-[12px] font-normal text-light-text transition-colors"
          >
            {allowComments ? <IoChatbubble size={13} /> : <IoChatbubbleOutline size={13} />}
            Allow Comments
            <span className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full transition-colors ${allowComments ? "bg-primary" : "bg-border"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${allowComments ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Draft + Post row */}
      <div className="mt-4 flex items-center justify-end gap-2 pb-10">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-border px-5 py-2 text-[13px] font-semibold text-text hover:bg-feed-bg transition-colors"
        >
          Draft
        </button>
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2 text-[13px] font-bold text-white disabled:opacity-40 hover:bg-primary/90 transition-all"
        >
          {posting ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}
