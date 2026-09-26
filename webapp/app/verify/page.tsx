"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function VerifyForm() {
  const { verifyOtp, resendOtp, resendOtpViaEmail } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const phoneNumber = params.get("phone") ?? "";
  const email = params.get("email") ?? "";

  // Email is the primary OTP channel (register() always requires + sends there first,
  // with SMS as a fallback), matching the mobile app's default.
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">(email ? "email" : "phone");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot flip once the countdown reaches zero
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const isValid = code.every((d) => d !== "");

  async function handleVerify() {
    if (!isValid || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await verifyOtp(phoneNumber, code.join(""));
      router.replace(result.profileComplete ? "/feed" : "/complete-profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend(channel: "email" | "phone") {
    setError(null);
    try {
      if (channel === "email" && email) await resendOtpViaEmail(phoneNumber, email);
      else await resendOtp(phoneNumber);
      setOtpChannel(channel);
      setTimer(90);
      setCanResend(false);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't resend code.");
    }
  }

  return (
    <AuthLayout>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#E9E9E9] bg-white text-text"
        aria-label="Back"
      >
        ←
      </button>

      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold text-text">
          {otpChannel === "email" ? email || phoneNumber : phoneNumber}
        </h1>
        <p className="mt-2 text-[15px] text-light-text">
          Enter the 6-digit code that we sent by {otpChannel === "email" ? "email" : "SMS"}
        </p>

        <div className="mt-8 flex justify-center gap-2.5">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={digit}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(-1);
                setCode((prev) => {
                  const next = [...prev];
                  next[i] = v;
                  return next;
                });
                if (v && i < 5) inputs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              maxLength={1}
              className="h-[54px] w-[46px] rounded-xl border-[1.5px] text-center text-xl font-semibold text-text outline-none"
              style={{ borderColor: focusedIndex === i ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5">
          {!canResend ? (
            <span className="text-base text-light-text">Resend in {formatTime(timer)}</span>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleResend(otpChannel)}
                className="text-base font-medium text-primary"
              >
                Tap to get a code via {otpChannel === "email" ? "email" : "SMS"}
              </button>
              {email && (
                <button
                  type="button"
                  onClick={() => handleResend(otpChannel === "email" ? "phone" : "email")}
                  className="text-[13px] text-light-text"
                >
                  Send it by {otpChannel === "email" ? "SMS" : "email"} instead
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={!isValid || isSubmitting}
        className="mt-10 h-10 w-full rounded-lg text-sm font-medium text-white disabled:cursor-not-allowed"
        style={{ background: isValid ? "var(--primary)" : "var(--primary-off)" }}
      >
        {isSubmitting ? "Verifying..." : "Continue"}
      </button>
    </AuthLayout>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
