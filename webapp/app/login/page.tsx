"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function LoginPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = phoneNumber.length > 1 && isValidEmail(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/^0+/, "")}`;
      await register(fullPhone, countryCode, email.trim());
      router.push(
        `/verify?phone=${encodeURIComponent(fullPhone)}&email=${encodeURIComponent(email.trim())}`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout headline1="Your people. Your work." headline2="One place.">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <h1 className="text-[28px] font-bold leading-9 tracking-wide text-text">
          Getting Started
        </h1>
        <p className="mt-3 text-base text-light-text">
          Enter your phone number and email. We will send you a confirmation code.
        </p>

        <div className="mt-12 flex gap-3">
          <div className="flex w-5 flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="my-1.5 w-0.5 flex-1 bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>

          <div className="flex flex-1 flex-col gap-7">
            <div
              className="flex items-center gap-3.5 border-b pb-2.5"
              style={{ borderColor: phoneFocused ? "var(--primary)" : "var(--border)" }}
            >
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-transparent text-[17px] font-medium text-text outline-none"
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+234">🇳🇬 +234</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+27">🇿🇦 +27</option>
              </select>
              <div className="h-5.5 w-px bg-border" />
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="Your phone number"
                inputMode="tel"
                autoFocus
                className="flex-1 text-[17px] text-text placeholder-[#B0B0B0] outline-none"
              />
            </div>

            <div
              className="flex items-center border-b pb-2.5"
              style={{ borderColor: emailFocused ? "var(--primary)" : "var(--border)" }}
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="Your email address"
                type="email"
                autoCapitalize="none"
                className="flex-1 text-[17px] text-text placeholder-[#B0B0B0] outline-none"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="mt-10 h-10 w-full rounded-lg text-sm font-medium text-white disabled:cursor-not-allowed"
          style={{ background: isValid ? "var(--primary)" : "var(--primary-off)" }}
        >
          {isSubmitting ? "Loading..." : "Continue"}
        </button>

        <p className="mt-3 text-center text-[13px] leading-5 text-light-text">
          By continuing, you agree to our{" "}
          <a
            href="https://twedot.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary"
          >
            Privacy Policy &amp; Terms of Service
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}
