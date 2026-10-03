"use client";

import Link from "next/link";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const HASHTAG_REGEX = /(#[a-zA-Z0-9_]+)/g;
const SPLIT_REGEX = /(https?:\/\/[^\s]+|#[a-zA-Z0-9_]+)/g;

export default function LinkText({ text }: { text: string }) {
  const parts = text.split(SPLIT_REGEX).filter(Boolean);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {part}
            </a>
          );
        }
        if (part.match(HASHTAG_REGEX)) {
          return (
            <Link
              key={i}
              href={`/stories?q=${encodeURIComponent(part.slice(1))}`}
              className="text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
