"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoHelpCircleOutline,
  IoChatbubbleOutline,
  IoChevronForward,
  IoChevronDown,
  IoChevronUp,
  IoSendOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiPost } from "@/lib/api";

type Tab = "faq" | "feedback";

interface FaqItem { q: string; a: string }

const FAQ: FaqItem[] = [
  {
    q: "How do I boost a post?",
    a: "Open the post, tap the three-dot menu, and select 'Boost Post'. Choose your budget and duration, then confirm with your Twedot Credits.",
  },
  {
    q: "How do Twedot Credits work?",
    a: "Twedot Credits are the in-app currency used to boost posts, tip creators, and access premium features. You can purchase credits from the Wallet screen.",
  },
  {
    q: "Why can't I see my stories?",
    a: "Stories appear in the Stories tab. Make sure you're following accounts that post stories, or check your feed filter settings.",
  },
  {
    q: "How do I change my username?",
    a: "Go to Settings → Profile and tap 'Edit Profile'. You can update your username there. Note: username changes may be rate-limited.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Account → Delete Account. This action is permanent and cannot be undone. All your data will be removed within 30 days.",
  },
  {
    q: "How do referrals work?",
    a: "Share your unique invite link from the 'Invite a Friend' screen. When a friend signs up using your link, you both earn referral points that unlock rewards.",
  },
  {
    q: "Why is my post not showing up?",
    a: "Posts go through a brief review process. If your post violates community guidelines it may be removed. Check your notifications for any policy updates.",
  },
  {
    q: "How do I report a user or post?",
    a: "Tap the three-dot menu on any post or profile and select 'Report'. Our team reviews all reports within 24 hours.",
  },
];

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "faq", label: "FAQ", icon: IoHelpCircleOutline },
  { id: "feedback", label: "Send Feedback", icon: IoChatbubbleOutline },
];

export default function HelpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("faq");
  const [open, setOpen] = useState<number | null>(null);

  // Feedback form
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await apiPost("/feedback", { category, message: message.trim() });
      setSent(true);
      setMessage("");
      notify("Feedback sent — thank you!");
    } catch {
      notify("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Help & Feedback</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? "bg-feed-bg" : "hover:bg-feed-bg/60"}`}
              >
                <Icon size={17} className={`flex-shrink-0 ${active ? "text-primary" : "text-light-text"}`} />
                <span className={`flex-1 text-[13px] font-medium ${active ? "text-primary" : "text-text"}`}>{label}</span>
                <IoChevronForward size={13} className={`flex-shrink-0 ${active ? "text-primary" : "text-light-text"}`} />
              </button>
            );
          })}
        </div>

        {/* Support link */}
        <div className="border-t border-border p-4">
          <p className="text-[10px] text-light-text leading-[16px]">
            Need more help?{" "}
            <a href="mailto:support@twedot.com" className="text-primary underline-offset-2 hover:underline">
              support@twedot.com
            </a>
          </p>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">{TABS.find(t => t.id === tab)?.label}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {tab === "faq" && (
            <>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-light-text">Frequently Asked Questions</p>
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                {FAQ.map((item, i) => {
                  const isOpen = open === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full flex-col gap-0 px-4 py-3 text-left hover:bg-feed-bg/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-medium text-text">{item.q}</span>
                        {isOpen
                          ? <IoChevronUp size={14} className="flex-shrink-0 text-light-text" />
                          : <IoChevronDown size={14} className="flex-shrink-0 text-light-text" />}
                      </div>
                      {isOpen && (
                        <p className="mt-2 text-[12px] leading-[18px] text-light-text pr-4">{item.a}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "feedback" && (
            <>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-light-text">Share Your Thoughts</p>

              {sent ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                    <IoCheckmarkCircleOutline size={28} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-text">Thank you for your feedback!</p>
                    <p className="mt-1 text-[12px] text-light-text">We review all submissions and will be in touch if needed.</p>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-2 rounded-full bg-primary px-5 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90"
                  >
                    Send More
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-light-text">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-border bg-feed-bg px-3 py-2 text-[13px] text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="general">General Feedback</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="content">Content / Safety</option>
                      <option value="account">Account Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-light-text">Message</label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind…"
                      rows={6}
                      className="w-full resize-none rounded-xl border border-border bg-feed-bg px-3 py-2.5 text-[13px] text-text placeholder:text-light-text/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="mt-1 text-right text-[10px] text-light-text">{message.length}/1000</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!message.trim() || sending || message.length > 1000}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    <IoSendOutline size={15} />
                    {sending ? "Sending…" : "Send Feedback"}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
