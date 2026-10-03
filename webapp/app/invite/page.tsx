"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoPeopleOutline, IoCopyOutline, IoShareSocialOutline, IoLogoWhatsapp, IoChatbubbleOutline, IoCheckmarkOutline } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";

const APP_STORE_LINK = "https://apps.apple.com/app/twedot/id6744031056";
const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.twedot";

export default function InviteFriendPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const inviteLink = PLAY_STORE_LINK;
  const inviteMessage = `Hey! I'm using Twedot to chat and discover people nearby. Download it here: ${inviteLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify("Invite link copied!");
    } catch { notify(inviteLink); }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as any).share({ title: "Join Twedot", text: inviteMessage, url: inviteLink }).catch(() => {});
    } else { handleCopy(); }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, "_blank");
  };

  const handleSMS = () => {
    window.open(`sms:?&body=${encodeURIComponent(inviteMessage)}`, "_blank");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Left ── */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-[20px] font-bold text-text">Invite a Friend</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Hero icon */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-primary/10">
              <IoPeopleOutline size={36} className="text-primary" />
            </div>
            <p className="text-[18px] font-semibold leading-snug text-text">Twedot is better with friends!</p>
            <p className="mt-1.5 text-[14px] leading-5 text-light-text">Invite contacts to chat and trade with you on Twedot.</p>
          </div>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[17px] font-bold text-text">Share Your Invite</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Invite link row */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-light-text">Invite Link</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 rounded-[10px] border border-border bg-feed-bg px-[14px] py-[11px]">
              <p className="truncate text-[14px] text-light-text">play.google.com/store/apps/details?id=com.twedot</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-border bg-feed-bg hover:bg-feed-bg/70 transition-colors"
            >
              {copied ? <IoCheckmarkOutline size={20} className="text-green-500" /> : <IoCopyOutline size={20} className="text-light-text" />}
            </button>
            <button
              onClick={handleShare}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-primary hover:bg-primary/90 transition-colors"
            >
              <IoShareSocialOutline size={20} className="text-white" />
            </button>
          </div>

          {/* Invite message preview */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-light-text">Invite Message</p>
          <div className="mb-5 rounded-xl border border-border bg-feed-bg p-[14px]">
            <p className="text-[14px] leading-5 text-light-text">{inviteMessage}</p>
          </div>

          {/* Send via */}
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-light-text">Send Via</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-[15px] text-[16px] font-semibold text-white hover:bg-[#22c55e] transition-colors"
            >
              <IoLogoWhatsapp size={18} />
              Send via WhatsApp
            </button>
            <button
              onClick={handleSMS}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-[15px] text-[16px] font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <IoChatbubbleOutline size={16} />
              Send via SMS
            </button>
          </div>

          {/* App store links */}
          <div className="mt-6 flex gap-3">
            <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl border border-border bg-feed-bg py-2.5 text-center text-[13px] font-semibold text-text hover:bg-feed-bg/70 transition-colors">
              App Store (iOS)
            </a>
            <a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl border border-border bg-feed-bg py-2.5 text-center text-[13px] font-semibold text-text hover:bg-feed-bg/70 transition-colors">
              Google Play
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
