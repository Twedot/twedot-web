import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const parsed = new URL(url);
    const allowed = ["twedot.com", "prodapi.twedot.com", "upload.twedot.com", "res.cloudinary.com", "lh3.googleusercontent.com", "cdn.twedot.com"];
    if (!allowed.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    const upstream = await fetch(url);
    if (!upstream.ok) return NextResponse.json({ error: "Upstream error" }, { status: upstream.status });

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
