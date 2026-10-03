"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoHelpCircleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiPost } from "@/lib/api";

const FAQS = [
  {
    q: "How do I boost a post?",
    a: "Go to any of your posts, tap the Boost button, choose your budget and duration, then confirm. Your post will start reaching more people within minutes.",
  },
  {
    q: "How does the ranking system work?",
    a: "Your rank is based on your activity score — posting, getting likes, comments, views, and followers all contribute. Higher rank means more visibility on the platform.",
  },
  {
    q: "How do I earn from my posts?",
    a: "Creators earn credits based on engagement on their posts. Credits accumulate in your Wallet and can be withdrawn once you reach the minimum threshold.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Go to Settings → Account → Delete Account. This is permanent and will remove all your data from Twedot.",
  },
  {
    q: "How do I report someone?",
    a: "Tap the three-dot menu on any post or profile and select Report. Our moderation team reviews all reports within 24 hours.",
  },
  {
    q: "Why is my post not showing on the feed?",
    a: "New posts may take a few minutes to appear. If it's been longer, check your account status in Settings. Private posts only appear to your followers.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-feed-bg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-[14px] font-medium text-text pr-3">{q}</span>
        {open ? (
          <IoChevronUpOutline size={16} className="flex-shrink-0 text-light-text" />
        ) : (
          <IoChevronDownOutline size={16} className="flex-shrink-0 text-light-text" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-[13px] leading-[20px] text-light-text">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isLoading && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const handleSubmit = async () => {
    if (!feedback.trim() || !rating) {
      notify("Please add a message and rating");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/feedback", { message: feedback.trim(), rating });
      setSubmitted(true);
      setFeedback("");
      setRating(null);
    } catch {
      notify("Failed to send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col pb-16">
      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <h1 className="text-[20px] font-bold text-text">Help & Feedback</h1>
        <p className="mt-0.5 text-[13px] text-light-text">Find answers or send us a message</p>
      </div>

      {/* FAQ */}
      <div className="px-4">
        <p className="mb-3 text-[13px] font-semibold text-light-text uppercase tracking-wide">Frequently Asked</p>
        <div className="flex flex-col gap-2">
          {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

      {/* Feedback form */}
      <div className="mt-6 px-4">
        <p className="mb-3 text-[13px] font-semibold text-light-text uppercase tracking-wide">Send Feedback</p>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-feed-bg py-10 text-center">
            <IoCheckmarkCircleOutline size={36} className="text-green-400" />
            <p className="text-[14px] font-semibold text-text">Thank you!</p>
            <p className="text-[12px] text-light-text">Your feedback helps us improve Twedot.</p>
            <button onClick={() => setSubmitted(false)} className="mt-1 text-[12px] text-primary hover:underline">
              Send another
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-feed-bg p-4">
            {/* Rating */}
            <p className="mb-2 text-[13px] font-medium text-text">How's your experience?</p>
            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`flex-1 rounded-xl py-2 text-[18px] transition-colors ${
                    rating === n ? "bg-primary/20 ring-1 ring-primary" : "bg-background hover:bg-primary/10"
                  }`}
                >
                  {["😞", "😐", "🙂", "😊", "🤩"][n - 1]}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think or report an issue…"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-text placeholder-light-text outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || !feedback.trim() || !rating}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <IoChatbubbleOutline size={15} />
              {submitting ? "Sending…" : "Send Feedback"}
            </button>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="mx-4 mt-4 rounded-2xl bg-feed-bg px-4 py-4">
        <div className="flex items-start gap-3">
          <IoHelpCircleOutline size={20} className="mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p className="text-[13px] font-semibold text-text">Still need help?</p>
            <p className="mt-0.5 text-[12px] leading-[18px] text-light-text">
              Email us at{" "}
              <span className="select-all text-primary">support@twedot.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
