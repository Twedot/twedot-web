"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import { countryData } from "@/lib/country-codes";
import AuthLayout from "@/components/AuthLayout";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function LoginPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [country, setCountry] = useState(countryData.find((c) => c.code === "+1") ?? countryData[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? countryData.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : countryData;

  useEffect(() => {
    if (dropdownOpen) searchRef.current?.focus();
  }, [dropdownOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isValid = phoneNumber.length > 1 && isValidEmail(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const fullPhone = `${country.code}${phoneNumber.replace(/^0+/, "")}`;
      await register(fullPhone, country.code, email.trim());
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
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <h1 className="text-[22px] font-bold leading-8 tracking-wide text-text">
          Getting Started
        </h1>
        <p className="mt-2 text-[13px] text-light-text">
          Enter your phone number and email. We will send you a confirmation code.
        </p>

        <div className="mt-9 flex gap-3">
          <div className="flex w-5 flex-col items-center">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="my-1.5 w-0.5 flex-1 bg-border" />
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>

          <div className="flex flex-1 flex-col gap-6">
            {/* Phone row */}
            <div
              className="flex items-center gap-3 border-b pb-2"
              style={{ borderColor: phoneFocused ? "var(--primary)" : "var(--border)" }}
            >
              {/* Country picker */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => { setDropdownOpen((o) => !o); setSearch(""); }}
                  className="flex items-center gap-1 text-[14px] font-medium text-text outline-none"
                >
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                  <svg className="ml-0.5 h-3 w-3 text-light-text" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L1 3h10L6 8z" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
                    <div className="p-2">
                      <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full rounded-md bg-input px-3 py-1.5 text-[13px] text-text placeholder-light-text outline-none"
                      />
                    </div>
                    <ul className="max-h-52 overflow-y-auto">
                      {filtered.map((c) => (
                        <li key={`${c.code}-${c.name}`}>
                          <button
                            type="button"
                            onClick={() => { setCountry(c); setDropdownOpen(false); setSearch(""); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-text hover:bg-input"
                          >
                            <span className="shrink-0">{c.flag}</span>
                            <span className="flex-1 truncate text-left">{c.name}</span>
                            <span className="shrink-0 text-light-text">{c.code}</span>
                          </button>
                        </li>
                      ))}
                      {filtered.length === 0 && (
                        <li className="px-3 py-4 text-center text-[13px] text-light-text">No results</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-border" />
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="Your phone number"
                inputMode="tel"
                autoFocus
                className="flex-1 text-[14px] text-text placeholder-[#B0B0B0] outline-none"
              />
            </div>

            {/* Email row */}
            <div
              className="flex items-center border-b pb-2"
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
                className="flex-1 text-[14px] text-text placeholder-[#B0B0B0] outline-none"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="mt-8 h-9 w-full rounded-lg text-[13px] font-medium text-white disabled:cursor-not-allowed"
          style={{ background: isValid ? "var(--primary)" : "var(--primary-off)" }}
        >
          {isSubmitting ? "Loading..." : "Continue"}
        </button>

        <p className="mt-3 text-center text-[11px] leading-5 text-light-text">
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
