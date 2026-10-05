"use client";

import Link from "next/link";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const HASHTAG_REGEX = /^#[a-zA-Z0-9_]+$/;
const MENTION_REGEX = /^@[a-zA-Z0-9_]+$/;
const SPLIT_REGEX = /(https?:\/\/[^\s]+|#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;

interface LinkTextProps {
  text: string;
  onTagClick?: () => void;
}

export default function LinkText({ text, onTagClick }: LinkTextProps) {
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
        if (HASHTAG_REGEX.test(part)) {
          return (
            <Link
              key={i}
              href={`/stories?q=${encodeURIComponent(part.slice(1))}`}
              className="text-blue-500 hover:underline"
              onClick={(e) => { e.stopPropagation(); onTagClick?.(); }}
            >
              {part}
            </Link>
          );
        }
        if (MENTION_REGEX.test(part)) {
          return (
            <Link
              key={i}
              href={`/profile?username=${encodeURIComponent(part.slice(1))}`}
              className="text-primary hover:underline"
              onClick={(e) => { e.stopPropagation(); onTagClick?.(); }}
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
