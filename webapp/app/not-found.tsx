"use client";

import Link from "next/link";
import { IoSearchOutline } from "react-icons/io5";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-feed-bg">
        <IoSearchOutline size={36} className="text-light-text" />
      </div>
      <div>
        <h1 className="text-[28px] font-extrabold text-text">Page not found</h1>
        <p className="mt-2 max-w-xs text-[14px] leading-[22px] text-light-text">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <Link
        href="/feed"
        className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        Go to Feed
      </Link>
    </div>
  );
}
