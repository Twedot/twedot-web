"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoCamera, IoPersonOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { ApiError, apiGet, apiPatch, apiUploadFile } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
const CROP_PX = 280; // crop circle diameter in modal

const STEPS = [
  { headline: "What's your name?", sub: "This is how others will find and recognise you on Twedot." },
  { headline: "What do you do?", sub: "Your occupation helps others know your professional background." },
  { headline: "Add a profile photo", sub: "Optional — you can always add or change it later." },
];

// ── Crop modal ─────────────────────────────────────────────────────────────

function CropModal({ file, onCancel, onApply }: {
  file: File;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Use a detached Image to reliably capture dimensions regardless of
  // whether the browser decodes the blob before React's onLoad attaches.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const fit = Math.max(CROP_PX / nw, CROP_PX / nh);
      setNaturalW(nw);
      setNaturalH(nh);
      setScale(fit);
      setSrc(url);
      setLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    setTx(v => v + e.clientX - lastPos.current.x);
    setTy(v => v + e.clientY - lastPos.current.y);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function stopDrag() { dragging.current = false; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale(s => Math.min(8, Math.max(0.2, s - e.deltaY * 0.001)));
  }

  function apply() {
    if (!loaded) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI * 2);
    ctx.clip();
    const r = CROP_PX / 2;
    const srcR = r / scale;
    const srcCX = naturalW / 2 - tx / scale;
    const srcCY = naturalH / 2 - ty / scale;
    // Draw from the DOM img (already loaded, same origin blob)
    ctx.drawImage(imgRef.current!, srcCX - srcR, srcCY - srcR, srcR * 2, srcR * 2, 0, 0, 400, 400);
    canvas.toBlob(b => b && onApply(b), "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-background shadow-xl">

        {/* Content */}
        <div className="flex flex-col items-center gap-5 px-6 pt-6 pb-4">
          <p className="text-[15px] font-semibold text-text">Move and Scale</p>

          {/* Crop circle viewport */}
          <div
            className="relative overflow-hidden rounded-full select-none"
            style={{ width: CROP_PX, height: CROP_PX, cursor: "move", background: "var(--border)" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onWheel={onWheel}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                className="absolute pointer-events-none select-none"
                style={{
                  maxWidth: "none",
                  width: naturalW * scale,
                  height: naturalH * scale,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                }}
              />
            )}
          </div>

          <p className="text-[12px] text-light-text">Scroll to zoom · drag to reposition</p>
        </div>

        {/* Divider buttons — like the logout sheet */}
        <div className="border-t border-border">
          <button
            type="button"
            onClick={apply}
            disabled={!loaded}
            className="w-full py-3.5 text-[15px] font-medium disabled:opacity-40"
            style={{ color: "var(--primary)" }}
          >
            Use Photo
          </button>
        </div>
        <div className="border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 text-[15px] text-text"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main form ───────────────────────────────────────────────────────────────

function CompleteProfileForm() {
  const { completeProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const step = Math.min(Math.max(parseInt(params.get("step") ?? "0", 10) || 0, 0), 2);
  const [name, setName] = useState(params.get("name") ?? "");
  const [occupation, setOccupation] = useState(params.get("occupation") ?? "");

  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Occupation suggestions
  const [allOccupations, setAllOccupations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const occRef = useRef<HTMLDivElement>(null);

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    apiGet<any>("/users/occupations", { auth: false })
      .then((res) => {
        const items = res?.data ?? res;
        const list: string[] = (Array.isArray(items) ? items : [])
          .map((o: any) => (typeof o === "string" ? o : o?.name))
          .filter((n: any): n is string => typeof n === "string" && n.length > 0);
        setAllOccupations(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (occRef.current && !occRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

const quickPicks = allOccupations.slice(0, 12);
  const filtered = occupation.trim()
    ? allOccupations.filter(o => o.toLowerCase().includes(occupation.toLowerCase())).slice(0, 8)
    : [];

  const stepValid = [
    name.trim().length > 0,
    occupation.trim().length > 0,
    true, // photo is optional
  ];

  function buildUrl(nextStep: number) {
    const p = new URLSearchParams();
    p.set("step", String(nextStep));
    if (name) p.set("name", name);
    if (occupation) p.set("occupation", occupation);
    return `/complete-profile?${p.toString()}`;
  }

  // The Go upload service returns { jobId, url, key } directly in the 202 body —
  // no need to wait for the socket event.
  const uploadPhoto = useCallback(async (blob: Blob) => {
    setPhotoUploading(true);
    setPhotoUrl(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, "profile.jpg");
      fd.append("folder", "profile");
      fd.append("mimeType", "image/jpeg");
      fd.append("fileName", "profile.jpg");
      const res = await apiUploadFile<{ jobId: string; url: string; key: string }>("/media/upload/direct", fd);
      setPhotoUrl(res.url);
    } catch {
      setError("Photo upload failed — you can add one from Settings later.");
    } finally {
      setPhotoUploading(false);
    }
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    e.target.value = "";
  }

  function handleCropApply(blob: Blob) {
    setCropFile(null);
    setPhotoBlob(blob);
    const preview = URL.createObjectURL(blob);
    setPhotoPreview(preview);
    uploadPhoto(blob);
  }

  async function handleNext() {
    if (!stepValid[step]) return;
    setShowDropdown(false);
    if (step < 2) { router.push(buildUrl(step + 1)); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      await completeProfile({ name, occupation });
      if (photoUrl) {
        await apiPatch("/users/me", { profile_photo_url: photoUrl }).catch(() => {});
      }
      router.push("/stories");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (step > 0) { setShowDropdown(false); router.push(buildUrl(step - 1)); }
  }

  return (
    <>
      {cropFile && (
        <CropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onApply={handleCropApply}
        />
      )}

      <AuthLayout>
        <div className="flex flex-col">
          {/* Progress dots */}
          <div className="mb-8 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? "24px" : "8px",
                  background: i <= step ? "var(--primary)" : "var(--border)",
                }}
              />
            ))}
          </div>

          {/* Back */}
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="mb-5 flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] text-light-text"
            >
              ←
            </button>
          )}

          <h1 className="text-[22px] font-bold leading-8 tracking-wide text-text">
            {STEPS[step].headline}
          </h1>
          <p className="mt-2 text-[13px] text-light-text">{STEPS[step].sub}</p>

          <div className="mt-9 flex flex-col gap-6">
            {/* Step 0: Name */}
            {step === 0 && (
              <div
                className="border-b pb-2"
                style={{ borderColor: focused === "name" ? "var(--primary)" : "var(--border)" }}
              >
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={e => e.key === "Enter" && handleNext()}
                  placeholder="Your full name"
                  className="w-full text-[14px] text-text placeholder-[#B0B0B0] outline-none"
                />
              </div>
            )}

            {/* Step 1: Occupation */}
            {step === 1 && (
              <div ref={occRef} className="relative flex flex-col gap-4">
                <div
                  className="border-b pb-2"
                  style={{ borderColor: focused === "occ" ? "var(--primary)" : "var(--border)" }}
                >
                  <input
                    autoFocus
                    value={occupation}
                    onChange={e => { setOccupation(e.target.value); setShowDropdown(true); }}
                    onFocus={() => { setFocused("occ"); setShowDropdown(true); }}
                    onBlur={() => setFocused(null)}
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                    placeholder="e.g. Software Engineer, Designer..."
                    className="w-full text-[14px] text-text placeholder-[#B0B0B0] outline-none"
                  />
                </div>

                {/* Dropdown */}
                {showDropdown && filtered.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 rounded-lg border border-border bg-background shadow-md">
                    {filtered.map(o => (
                      <button
                        key={o}
                        type="button"
                        onMouseDown={() => { setOccupation(o); setShowDropdown(false); }}
                        className="flex w-full items-center px-3 py-2.5 text-left text-[13px] text-text hover:bg-input"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick picks */}
                {!occupation && quickPicks.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-light-text">Popular</p>
                    <div className="flex flex-wrap gap-2">
                      {quickPicks.map(o => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => { setOccupation(o); setShowDropdown(false); }}
                          className="rounded-full border border-border px-3 py-1 text-[12px] text-text hover:border-primary hover:text-primary"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Photo */}
            {step === 2 && (
              <div className="flex flex-col items-center gap-5 py-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Avatar preview / upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-input transition hover:border-primary"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <IoPersonOutline size={40} className="text-light-text" />
                  )}

                  {/* Camera overlay */}
                  <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <IoCamera size={14} className="text-white" />
                  </span>
                </button>

                {photoUploading && (
                  <div className="flex items-center gap-2 text-[13px] text-light-text">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Uploading…
                  </div>
                )}

                {photoUrl && !photoUploading && (
                  <p className="text-[13px] text-green-500">Photo ready</p>
                )}

                {!photoPreview && (
                  <p className="text-center text-[12px] text-light-text">
                    Tap the circle to choose a photo
                  </p>
                )}

                {photoPreview && !photoUploading && !photoUrl && (
                  <p className="text-center text-[12px] text-light-text">
                    Tap the circle to change photo
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleNext}
            disabled={!stepValid[step] || isSubmitting || photoUploading}
            className="mt-10 h-9 w-full rounded-lg text-[13px] font-medium text-white disabled:cursor-not-allowed"
            style={{ background: stepValid[step] && !photoUploading ? "var(--primary)" : "var(--primary-off)" }}
          >
            {isSubmitting
              ? "Saving…"
              : step === 2
              ? photoUploading
                ? "Uploading…"
                : "Finish"
              : "Continue"}
          </button>

          {step === 2 && !isSubmitting && (
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setIsSubmitting(true);
                try {
                  await completeProfile({ name, occupation });
                  router.push("/stories");
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="mt-3 text-center text-[12px] text-light-text underline-offset-2 hover:underline"
            >
              Skip for now
            </button>
          )}

          <p className="mt-3 text-center text-[11px] text-light-text">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </AuthLayout>
    </>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
