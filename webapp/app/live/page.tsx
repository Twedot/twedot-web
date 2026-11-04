"use client";

import dynamic from "next/dynamic";

const LivePageContent = dynamic(() => import("./LivePageContent"), { ssr: false });

export default function LivePage() {
  return <LivePageContent />;
}
