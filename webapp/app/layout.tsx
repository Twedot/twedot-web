import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import AppShell from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = "https://twedot.com";
const TITLE = "Twedot — The Open Network for People and Businesses";
const DESCRIPTION =
  "Twedot is the open network where people connect, businesses grow, and communities thrive. Share stories, discover local services, join channels, and build your brand — all in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: TITLE,
    template: "%s | Twedot",
  },
  description: DESCRIPTION,

  keywords: [
    "Twedot",
    "open network",
    "social network",
    "business network",
    "community platform",
    "stories",
    "channels",
    "local services",
    "people and businesses",
    "connect",
    "social media",
  ],

  authors: [{ name: "Twedot Inc.", url: BASE_URL }],
  creator: "Twedot Inc.",
  publisher: "Twedot Inc.",
  applicationName: "Twedot",
  category: "social network",

  alternates: {
    canonical: BASE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Twedot",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Twedot — The Open Network for People and Businesses",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    site: "@twedot",
    creator: "@twedot",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },

  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#6B4EFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      {/* Restore saved theme before first paint to avoid flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('twedot-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');else if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-text">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
