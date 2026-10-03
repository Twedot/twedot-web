"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack, IoRocketOutline, IoLockClosedOutline, IoCheckmarkCircle } from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import { useUi } from "@/lib/UiContext";

const NGN_PER_CREDIT = 1.5;

export default function BuyCreditsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [amountText, setAmountText] = useState("1000");
  const [buying, setBuying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<{ balance: number }>("/credits/balance").then(r => setBalance(r?.balance ?? 0)).catch(() => setBalance(0));
  }, [isAuthenticated]);

  const credits = Math.max(0, parseInt(amountText, 10) || 0);
  const nairaPrice = credits * NGN_PER_CREDIT;
  const isValid = credits > 0;

  const handleBuy = async () => {
    if (buying || !isValid) return;
    setBuying(true);
    try {
      const result = await apiPost<{ authorizationUrl: string; reference: string; message: string }>("/credits/purchase", { amountNaira: credits });
      if (!result?.authorizationUrl || !result?.reference) {
        notify(result?.message || "Credits purchase is not available yet");
        return;
      }
      setPendingRef(result.reference);
      window.open(result.authorizationUrl, "_blank");
    } catch {
      notify("Could not start checkout — please try again");
    } finally {
      setBuying(false);
    }
  };

  const handleVerify = async () => {
    if (!pendingRef || verifying) return;
    setVerifying(true);
    let attempts = 0;
    let done = false;
    while (attempts < 6 && !done) {
      try {
        const r = await apiGet<{ status: string; balance?: number }>(`/credits/purchase/verify/${pendingRef}`);
        if (r?.status === "success") {
          setBalance(r.balance ?? balance);
          setSuccess(true);
          setPendingRef(null);
          notify("Credits added to your account!");
          done = true;
        } else if (r?.status === "failed") {
          notify("Payment was not completed");
          setPendingRef(null);
          done = true;
        } else {
          await new Promise(res => setTimeout(res, 1500));
          attempts++;
        }
      } catch {
        break;
      }
    }
    if (!done) notify("Still processing — check your balance in a moment");
    setVerifying(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg transition-colors">
          <IoArrowBack size={18} className="text-text" />
        </button>
        <h1 className="text-[14px] font-bold text-text">Buy Twedot Credits</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto max-w-[440px] flex flex-col gap-5">

          {/* Balance card */}
          <div className="rounded-[18px] border border-white/[0.08] bg-[#12121A] p-[22px]">
            <div className="flex items-center gap-2 mb-[14px]">
              <IoRocketOutline size={20} className="text-primary" />
              <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-white/70">TWEDOT CREDITS</span>
            </div>
            <p className="text-[11px] font-semibold text-white/50">Balance</p>
            {balance == null ? (
              <div className="my-2 h-8 w-28 animate-pulse rounded bg-white/10" />
            ) : (
              <p className="text-[28px] font-extrabold text-white mt-0.5 leading-tight">
                {balance.toLocaleString()} <span className="text-[14px] font-semibold">Credits</span>
              </p>
            )}
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 rounded-[14px] bg-feed-bg p-6 text-center">
              <IoCheckmarkCircle size={40} className="text-green-500" />
              <p className="text-[13px] font-bold text-text">Credits added!</p>
              <p className="text-[12px] text-light-text">Your new balance is shown above.</p>
              <button
                onClick={() => { setSuccess(false); setAmountText("1000"); }}
                className="mt-1 rounded-full bg-primary px-5 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90"
              >
                Buy More
              </button>
            </div>
          ) : pendingRef ? (
            /* Verify payment section */
            <div className="rounded-[14px] bg-feed-bg p-5 flex flex-col gap-3">
              <p className="text-[12px] font-bold text-text">Complete payment in the tab that opened</p>
              <p className="text-[12px] text-light-text leading-[18px]">
                Once you've paid on Paystack, click the button below to confirm your credits.
              </p>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="rounded-lg bg-primary py-2.5 text-[12px] font-bold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {verifying ? "Checking…" : "I've completed payment"}
              </button>
              <button
                onClick={() => setPendingRef(null)}
                className="text-[11px] text-light-text hover:text-text"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Amount input */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.4px] text-light-text">How many Credits?</p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-feed-bg px-4 py-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={amountText}
                    onChange={e => setAmountText(e.target.value.replace(/[^0-9]/g, ""))}
                    className="flex-1 bg-transparent py-3 text-[22px] font-extrabold text-text outline-none placeholder:text-light-text/40"
                    placeholder="0"
                  />
                  <span className="flex-shrink-0 text-[12px] font-semibold text-light-text">Credits</span>
                </div>
                <p className="mt-1.5 text-[12px] font-semibold text-light-text">
                  = ₦{nairaPrice.toLocaleString()} &nbsp;·&nbsp; 1 Credit = ₦{NGN_PER_CREDIT}
                </p>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-2.5 rounded-xl bg-feed-bg p-3.5">
                <IoLockClosedOutline size={15} className="flex-shrink-0 mt-0.5 text-light-text" />
                <p className="text-[12px] leading-[18px] text-light-text">
                  Secure checkout powered by Paystack — your card details are handled by Paystack, never seen by Twedot.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buy button */}
      {!pendingRef && !success && (
        <div className="border-t border-border px-5 py-4">
          <div className="mx-auto max-w-[440px]">
            <button
              onClick={handleBuy}
              disabled={buying || !isValid}
              className="w-full rounded-lg bg-primary py-3 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {buying ? "Opening checkout…" : `Buy ₦${nairaPrice.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
