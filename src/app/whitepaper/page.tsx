"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Lock, Shield, TriangleAlert } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const PDF_PATH =
  process.env.NEXT_PUBLIC_WHITEPAPER_URL ||
  "https://sagenex-academy-videos.s3.ap-south-1.amazonaws.com/whitepaper/Sagenex+2026.pdf";

const blockedKeys = new Set(["s", "p", "o", "S", "P", "O"]);

export default function WhitepaperPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [watermarkLabel, setWatermarkLabel] = useState<string>("Sagenex Confidential");
  const [banner, setBanner] = useState<string | null>(null);

  // Derive a session-specific watermark so shared screenshots are traceable.
  const watermarkText = useMemo(() => {
    const now = new Date();
    const iso = now.toISOString();
    const session = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${watermarkLabel} · Session ${session} · ${iso}`;
  }, [watermarkLabel]);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => event.preventDefault();

    const handleKeyDown = (event: KeyboardEvent) => {
      const isBlockedCombo = (event.metaKey || event.ctrlKey) && blockedKeys.has(event.key);
      if (isBlockedCombo || event.key === "PrintScreen") {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown, true);

    // Route guard: only allow authenticated users.
    if (!loading && !isAuthenticated) {
      router.replace("/login?next=/whitepaper");
    }

    // Basic deterrent: when the tab loses visibility, show a banner on return.
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") return;
      setBanner("Heads up: screenshots/recordings can be traceable via the session watermark.");
      setTimeout(() => setBanner(null), 6000);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // If we can pull a user hint from the URL (e.g., ?user=email), add it to the watermark.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const userParam = params.get("user");
      if (userParam) {
        setWatermarkLabel(`${userParam}`);
      } else if (user?.email || user?.fullName) {
        setWatermarkLabel(user.email || user.fullName || "Sagenex Confidential");
      }
    }

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, loading, router, user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Checking access…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
        <div className="space-y-2">
          <p className="text-base font-semibold">Access restricted</p>
          <p className="text-sm text-white/65">Please log in to view the whitepaper.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0b1310] to-[#0f1d17] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            <Shield className="h-4 w-4" aria-hidden />
            Watermarked View
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Sagenex Whitepaper</h1>
          <p className="max-w-2xl text-sm text-white/70 sm:text-base">
            This view limits downloads and printing, adds a persistent watermark, and blocks common shortcut keys. Screenshots
            cannot be fully prevented on the web, but this view reduces casual sharing.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/65">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Lock className="h-4 w-4" aria-hidden />
              Downloads disabled
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <EyeOff className="h-4 w-4" aria-hidden />
              Right-click blocked
            </span>
          </div>
        </header>

        <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          {/* Watermark grid overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 select-none opacity-35"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent 0 120px, rgba(255,255,255,0.05) 120px 140px), repeating-linear-gradient(-45deg, transparent 0 120px, rgba(16,185,129,0.06) 120px 140px)`
            }}
          />

          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-8 px-8 py-10 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-white/25">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <span className="rotate-[-18deg] select-none" style={{ textShadow: "0 0 12px rgba(0,0,0,0.35)" }}>
                  {watermarkText}
                </span>
              </div>
            ))}
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 select-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 120px), repeating-linear-gradient(-45deg, rgba(16,185,129,0.08) 0, rgba(16,185,129,0.08) 2px, transparent 2px, transparent 120px)",
              maskImage: "radial-gradient(circle at center, rgba(0,0,0,0.85), transparent 70%)",
            }}
          />

          <div className="pointer-events-none absolute inset-x-6 top-4 flex justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
            <span>Sagenex Confidential</span>
            <span>No Direct Download</span>
          </div>

          <iframe
            src={`${PDF_PATH}#toolbar=0&navpanes=0&scrollbar=0`}
            title="Sagenex Whitepaper"
            className="h-[78vh] w-full border-0 bg-black/40"
            allow="clipboard-read; clipboard-write"
          />
        </div>

        <p className="mt-4 text-xs text-white/55">
          Note: Advanced users can still capture screenshots. For highly sensitive material, share in a controlled offline setting
          or with a dedicated DRM solution.
        </p>

        {banner && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            <span>{banner}</span>
          </div>
        )}
      </div>
    </main>
  );
}
