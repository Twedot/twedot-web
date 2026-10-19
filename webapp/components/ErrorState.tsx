"use client";

import { IoWifiOutline, IoWarningOutline, IoRefreshOutline } from "react-icons/io5";

interface ErrorStateProps {
  title?: string;
  message?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** compact = smaller version for mid-page use (e.g. below a feed header) */
  compact?: boolean;
}

export default function ErrorState({
  title,
  message,
  isOffline,
  onRetry,
  retryLabel = "Refresh",
  secondaryLabel,
  onSecondary,
  compact = false,
}: ErrorStateProps) {
  const defaultTitle = isOffline ? "You're offline" : "Something went wrong";
  const defaultMessage = isOffline
    ? "Check your internet connection and try again."
    : "Something went wrong, but don't worry — it's not your fault. Try again.";

  if (compact) {
    return (
      <div className="mx-4 my-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-background px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-feed-bg">
          {isOffline
            ? <IoWifiOutline size={26} className="text-light-text" />
            : <IoWarningOutline size={26} className="text-light-text" />}
        </div>
        <div>
          <p className="text-[15px] font-bold text-text">{title ?? defaultTitle}</p>
          <p className="mt-1 text-[13px] leading-5 text-light-text">{message ?? defaultMessage}</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-text px-5 py-2.5 text-[13px] font-bold text-background transition-opacity hover:opacity-80"
            >
              <IoRefreshOutline size={14} />
              {retryLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold text-text transition-colors hover:bg-feed-bg"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feed-bg">
        {isOffline
          ? <IoWifiOutline size={30} className="text-light-text" />
          : <IoWarningOutline size={30} className="text-light-text" />}
      </div>
      <div>
        <h1 className="text-[22px] font-extrabold text-text">{title ?? defaultTitle}</h1>
        <p className="mt-2 max-w-[280px] text-[14px] leading-[22px] text-light-text">
          {message ?? defaultMessage}
        </p>
      </div>
      <div className="flex w-full max-w-[280px] flex-col gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-text px-5 py-3 text-[15px] font-bold text-background transition-opacity hover:opacity-80"
          >
            <IoRefreshOutline size={16} />
            {retryLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="flex w-full items-center justify-center rounded-full border border-border px-5 py-3 text-[15px] font-semibold text-text transition-colors hover:bg-feed-bg"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
