import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Join Twedot — The Open Network for People and Businesses",
  description:
    "Create your free Twedot account. Share stories, discover local businesses, join communities, and build your brand on the open network for people and businesses.",
  alternates: { canonical: "https://twedot.com/login" },
  openGraph: {
    title: "Join Twedot — The Open Network for People and Businesses",
    description:
      "Create your free Twedot account. Share stories, discover local businesses, join communities, and build your brand.",
    url: "https://twedot.com/login",
  },
  twitter: {
    title: "Join Twedot — The Open Network for People and Businesses",
    description:
      "Create your free Twedot account. Share stories, discover local businesses, join communities, and build your brand.",
  },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
