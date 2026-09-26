import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
  headline1,
  headline2,
}: {
  children: ReactNode;
  headline1?: string;
  headline2?: string;
}) {
  return (
    <div className="flex flex-1">
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/auth/onboarding-hero.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div className="absolute top-8 left-8 flex items-center gap-2">
          <Image src="/auth/mini-logo.svg" alt="" width={28} height={24} />
          <span className="text-2xl font-bold tracking-wide text-white">Twedot</span>
        </div>

        {(headline1 || headline2) && (
          <div className="absolute bottom-16 left-8 right-8">
            {headline1 && (
              <p className="text-2xl font-semibold text-white">{headline1}</p>
            )}
            {headline2 && (
              <p className="mt-2 text-4xl font-semibold leading-tight text-white">
                {headline2}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
