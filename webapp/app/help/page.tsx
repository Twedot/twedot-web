"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoBookOutline, IoHeadsetOutline, IoBugOutline, IoDocumentTextOutline,
  IoInformationCircleOutline, IoChevronForward,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiPost } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

type RightPane = "none" | "faq" | "feedback";

interface HelpOption {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action: () => void;
}

const FAQ_ITEMS = [
  { q: "How do I boost a post?", a: "Open the post, tap the three-dot menu, and select 'Boost Post'. Choose your budget and duration, then confirm with your Twedot Credits." },
  { q: "How do Twedot Credits work?", a: "Twedot Credits are the in-app currency used to boost posts. 1 Twedot Credit = ₦1.5. Purchase them from the Wallet screen." },
  { q: "How do I earn from Twedot?", a: "Reach the Supreme rank and earn ₦0.10 for every qualified video view (60+ seconds watched on a 60+ second video). See Wallet → Earnings for your balance." },
  { q: "Why can't I see my stories?", a: "Stories appear in the Stories tab. Make sure you're following accounts that post stories, or check your feed filter settings." },
  { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account. This is permanent and cannot be undone. All data is removed within 30 days." },
  { q: "How do I report a user or post?", a: "Tap the three-dot menu on any post or profile and select 'Report'. Our team reviews all reports within 24 hours." },
  { q: "Service requests not showing?", a: "Add your occupation on your profile in the Twedot app. Service requests are matched to your occupation type." },
];

export default function HelpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [pane, setPane] = useState<RightPane>("none");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Feedback form
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await apiPost("/feedback", { category, message: message.trim() });
      setSent(true);
      setMessage("");
      notify("Feedback sent — thank you!");
    } catch { notify("Failed to send. Please try again."); }
    finally { setSending(false); }
  };

  if (!isAuthenticated) return null;

  const helpOptions: HelpOption[] = [
    { id: "faq", icon: IoBookOutline, title: "Frequently Asked Questions", subtitle: "FAQ", action: () => setPane("faq") },
    { id: "support", icon: IoHeadsetOutline, title: "Contact Support", subtitle: "Get help from Twedot", action: () => window.open("mailto:support@twedot.com") },
    { id: "feedback", icon: IoBugOutline, title: "Give feedback", subtitle: "Report technical issues", action: () => setPane("feedback") },
  ];
  const aboutOptions: HelpOption[] = [
    { id: "privacy", icon: IoDocumentTextOutline, title: "Privacy Policy", subtitle: "Twedot terms and privacy policy", action: () => window.open("https://twedot.com/privacy", "_blank") },
    { id: "appinfo", icon: IoInformationCircleOutline, title: "App info", subtitle: "App status", action: () => {} },
  ];

  const renderOption = (opt: HelpOption, isLast: boolean) => (
    <div key={opt.id}>
      <button
        onClick={opt.action}
        className="flex w-full items-center gap-[14px] px-4 py-[14px] text-left transition-opacity hover:opacity-70"
      >
        <opt.icon size={22} className="flex-shrink-0 text-light-text" />
        <div className="flex-1">
          <p className="text-[12px] font-medium text-text">{opt.title}</p>
          {opt.subtitle && <p className="mt-0.5 text-[11px] text-light-text">{opt.subtitle}</p>}
        </div>
        <IoChevronForward size={16} className="flex-shrink-0 text-light-text" />
      </button>
      {!isLast && <div className="ml-[54px] h-px bg-border" />}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[280px] flex-shrink-0 flex-col border-r border-border overflow-y-auto">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Help</h1>
        </div>

        {/* Help section */}
        <div className="px-4 pt-5">
          <p className="mb-2 px-1 text-[12px] font-medium uppercase tracking-[0.5px] text-light-text">Help</p>
          <div className="overflow-hidden rounded-xl border border-border bg-feed-bg">
            {helpOptions.map((opt, i) => renderOption(opt, i === helpOptions.length - 1))}
          </div>
        </div>

        {/* About section */}
        <div className="px-4 pt-5 pb-5">
          <p className="mb-2 px-1 text-[12px] font-medium uppercase tracking-[0.5px] text-light-text">About</p>
          <div className="overflow-hidden rounded-xl border border-border bg-feed-bg">
            {aboutOptions.map((opt, i) => renderOption(opt, i === aboutOptions.length - 1))}
          </div>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {pane === "none" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <IoHeadsetOutline size={40} className="text-light-text" />
            <p className="text-[13px] font-semibold text-text">How can we help?</p>
            <p className="text-[12px] text-light-text">Select an option from the left to get started.</p>
          </div>
        )}

        {pane === "faq" && (
          <>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[13px] font-bold text-text">Frequently Asked Questions</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="overflow-hidden rounded-xl border border-border">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className={i < FAQ_ITEMS.length - 1 ? "border-b border-border" : ""}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-feed-bg/60 transition-colors"
                    >
                      <span className="flex-1 text-[12px] font-medium text-text">{item.q}</span>
                      <span className="flex-shrink-0 text-[12px] text-light-text">{openFaq === i ? "▲" : "▼"}</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4">
                        <p className="text-[12px] leading-[18px] text-light-text">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {pane === "feedback" && (
          <>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[13px] font-bold text-text">Give Feedback</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-[26px]">✓</span>
                  </div>
                  <p className="text-[13px] font-semibold text-text">Thanks for your feedback!</p>
                  <p className="text-[12px] text-light-text">We review all submissions and will be in touch if needed.</p>
                  <button onClick={() => setSent(false)} className="mt-2 rounded-full bg-primary px-5 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90">
                    Send More
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4 max-w-lg">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-light-text">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-border bg-feed-bg px-3 py-2 text-[12px] text-text focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="general">General Feedback</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="content">Content / Safety</option>
                      <option value="account">Account Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-light-text">Message</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's on your mind…" rows={6} maxLength={1000}
                      className="w-full resize-none rounded-xl border border-border bg-feed-bg px-3 py-2.5 text-[12px] text-text placeholder:text-light-text/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                    <p className="mt-1 text-right text-[10px] text-light-text">{message.length}/1000</p>
                  </div>
                  <button type="submit" disabled={!message.trim() || sending} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[12px] font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                    {sending ? "Sending…" : "Send Feedback"}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
