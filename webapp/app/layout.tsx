import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import AppShell from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Twedot — The Open Network for Businesses",
  description: "Twedot — The Open Network for Businesses",
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
      <body className="flex min-h-full flex-col bg-white text-text">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
