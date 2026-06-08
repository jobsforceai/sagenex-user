import { NextResponse } from "next/server";
import { getApiV1BaseUrl } from "@/lib/api-base";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const whitepaperUrl = `${getApiV1BaseUrl("http://localhost:10000")}/whitepaper`;
    const upstream = await fetch(whitepaperUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ message: "Whitepaper is unavailable." }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="Sagenex-Whitepaper.pdf"',
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to proxy whitepaper:", error);
    return NextResponse.json({ message: "Whitepaper is unavailable." }, { status: 502 });
  }
}
