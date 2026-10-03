"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack, IoCameraOutline, IoCheckmark } from "react-icons/io5";
import { apiPost, apiUploadFile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { channelUrl } from "@/lib/url";

type JoinType = "open" | "invite_request" | "additional_check";

const ALL_CATEGORIES = [
  { value: "gist", label: "Gist" }, { value: "lifestyle", label: "Lifestyle" },
  { value: "entertainment", label: "Entertainment" }, { value: "education", label: "Education" },
  { value: "business", label: "Business" }, { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" }, { value: "fashion_beauty", label: "Fashion & Beauty" },
  { value: "food_cooking", label: "Food & Cooking" }, { value: "music", label: "Music" },
  { value: "movies_tv", label: "Movies & TV" }, { value: "gaming", label: "Gaming" },
  { value: "relationships", label: "Relationships" }, { value: "health_fitness", label: "Health & Fitness" },
  { value: "career_jobs", label: "Career & Jobs" }, { value: "money_finance", label: "Money & Finance" },
  { value: "entrepreneurship", label: "Entrepreneurship" }, { value: "travel", label: "Travel" },
  { value: "religion_spirituality", label: "Religion & Spirituality" },
  { value: "politics_society", label: "Politics & Society" }, { value: "news_trends", label: "News & Trends" },
  { value: "comedy_memes", label: "Comedy & Memes" }, { value: "cars_transport", label: "Cars & Transport" },
  { value: "home_living", label: "Home & Living" }, { value: "arts_creativity", label: "Arts & Creativity" },
  { value: "books_writing", label: "Books & Writing" }, { value: "science", label: "Science" },
  { value: "photography", label: "Photography" }, { value: "local_communities", label: "Local Communities" },
  { value: "buy_sell", label: "Buy & Sell" }, { value: "services", label: "Services" },
  { value: "events", label: "Events" }, { value: "hobbies_interests", label: "Hobbies & Interests" },
  { value: "pets_animals", label: "Pets & Animals" }, { value: "parenting_family", label: "Parenting & Family" },
  { value: "opinions_debates", label: "Opinions & Debates" }, { value: "advice", label: "Advice" },
  { value: "random", label: "Random" },
];

export default function CreateChannelPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [joinType, setJoinType] = useState<JoinType>("open");
  const [checkTitle, setCheckTitle] = useState("");
  const [checkDesc, setCheckDesc] = useState("");
  const [rankingEnabled, setRankingEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function toggleCat(val: string) {
    setSelectedCats((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { setError("Channel name is required"); return; }
    setLoading(true);
    setError(null);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const uploadRes = await apiUploadFile<{ url: string }>("/media/upload", fd);
        photoUrl = uploadRes.url;
      }

      const body: Record<string, unknown> = {
        name: trimmedName,
        description: description.trim() || undefined,
        joinType,
        rankingEnabled,
        categories: selectedCats.length > 0 ? selectedCats : undefined,
        photoUrl,
      };
      if (joinType === "additional_check") {
        body.additionalCheckTitle = checkTitle.trim() || undefined;
        body.additionalCheckDescription = checkDesc.trim() || undefined;
      }

      const room = await apiPost<{ id: string }>("/rooms", body);
      const newRoomId = (room as any).id ?? (room as any).room?.id;
      router.replace(channelUrl(trimmedName, newRoomId));
    } catch (err: any) {
      setError(err?.message ?? "Failed to create channel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg transition-colors"
        >
          <IoArrowBack size={20} className="text-text" />
        </button>
        <h1 className="text-[17px] font-bold text-text">Create Channel</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-0 pb-10">
        {/* Photo picker */}
        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-feed-bg overflow-hidden border-2 border-border hover:opacity-80 transition-opacity"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Channel photo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <IoCameraOutline size={26} className="text-light-text" />
                <span className="text-[10px] font-medium text-light-text">Add Photo</span>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>

        {/* Name */}
        <div className="px-4 pb-1">
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-light-text">
            Channel Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Tech Talk, Naija Hustle…"
            className="w-full rounded-xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary"
          />
          <div className="mt-1 text-right text-[11px] text-light-text">{name.length}/100</div>
        </div>

        {/* Description */}
        <div className="px-4 pb-4">
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-light-text">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What's this channel about?"
            className="w-full resize-none rounded-xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary"
          />
          <div className="mt-1 text-right text-[11px] text-light-text">{description.length}/500</div>
        </div>

        {/* Categories */}
        <div className="border-t border-border px-4 pt-4 pb-4">
          <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-light-text">
            Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((c) => {
              const active = selectedCats.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleCat(c.value)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active ? "bg-primary text-white" : "bg-feed-bg text-text hover:bg-border/50"
                  }`}
                >
                  {active && <IoCheckmark size={11} />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Who can join */}
        <div className="border-t border-border px-4 pt-4 pb-4">
          <label className="mb-3 block text-[12px] font-semibold uppercase tracking-wide text-light-text">
            Who Can Join
          </label>
          {(["open", "invite_request", "additional_check"] as JoinType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setJoinType(t)}
              className={`mb-2 flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                joinType === t ? "bg-primary/10 ring-1 ring-primary/30" : "bg-feed-bg hover:bg-border/40"
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${joinType === t ? "border-primary bg-primary" : "border-border"}`} />
              <div>
                <p className={`text-[13px] font-semibold ${joinType === t ? "text-primary" : "text-text"}`}>
                  {t === "open" ? "Open" : t === "invite_request" ? "Request to Join" : "Additional Check"}
                </p>
                <p className="text-[11px] text-light-text">
                  {t === "open"
                    ? "Anyone can join immediately"
                    : t === "invite_request"
                    ? "Members must request and be approved"
                    : "Members must answer a question to join"}
                </p>
              </div>
            </button>
          ))}

          {joinType === "additional_check" && (
            <div className="mt-2 flex flex-col gap-2">
              <input
                value={checkTitle}
                onChange={(e) => setCheckTitle(e.target.value)}
                placeholder="Question title (e.g. What brings you here?)"
                className="w-full rounded-xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary"
              />
              <textarea
                value={checkDesc}
                onChange={(e) => setCheckDesc(e.target.value)}
                rows={2}
                placeholder="Extra instructions (optional)"
                className="w-full resize-none rounded-xl border border-border bg-feed-bg px-4 py-3 text-[14px] text-text outline-none placeholder:text-light-text focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Ranking toggle */}
        <div className="flex items-center justify-between border-t border-border px-4 py-4">
          <div>
            <p className="text-[14px] font-semibold text-text">Enable Ranking</p>
            <p className="text-[12px] text-light-text">Members earn rank points for activity</p>
          </div>
          <button
            type="button"
            onClick={() => setRankingEnabled((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${rankingEnabled ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${rankingEnabled ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="px-4 pt-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded-full bg-primary py-3 text-[14px] font-bold text-white transition-opacity disabled:opacity-50 hover:bg-primary/90"
          >
            {loading ? "Creating…" : "Create Channel"}
          </button>
        </div>
      </form>
    </div>
  );
}
