"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";

export default function CompleteProfilePage() {
  const { completeProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim() && occupation.trim() && city.trim() && country.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await completeProfile({ name, occupation, city, country });
      router.push("/stories");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold text-text">Complete Profile</h1>
          <p className="mt-2 text-[15px] leading-5 text-light-text">
            Tell us a bit about yourself to finish setting up your account
          </p>
        </div>

        <div className="mx-auto mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#F0EFFF] text-4xl">
          🙂
        </div>

        <div className="flex flex-col gap-5">
          <Field label="Full Name" value={name} onChange={setName} placeholder="Enter" />
          <Field label="Occupation" value={occupation} onChange={setOccupation} placeholder="Enter" />
          <Field label="City" value={city} onChange={setCity} placeholder="Enter" />
          <Field label="Country" value={country} onChange={setCountry} placeholder="Enter" />
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="mt-8 h-10 w-full rounded-lg text-sm font-medium text-white disabled:cursor-not-allowed"
          style={{ background: isValid ? "var(--primary)" : "var(--primary-off)" }}
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-medium text-light-text">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[50px] rounded-xl border border-[#E5E5EA] px-4 text-base text-text outline-none focus:border-primary"
      />
    </div>
  );
}
