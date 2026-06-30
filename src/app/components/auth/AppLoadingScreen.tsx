"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

type AppLoadingScreenProps = {
  message?: string;
  /** When false, fills the parent instead of the viewport (e.g. inside AppShell main). */
  fullScreen?: boolean;
};

export default function AppLoadingScreen({
  message = "Loading…",
  fullScreen = true,
}: AppLoadingScreenProps) {
  return (
    <div
      className={`dashboard-light-scope flex items-center justify-center bg-[#F8FAFC] px-4 ${
        fullScreen ? "min-h-screen" : "min-h-[50vh] w-full py-16"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/sagenex.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-contain opacity-90"
          aria-hidden
        />
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" aria-hidden />
        <p className="text-sm font-semibold text-[#64748B]">{message}</p>
      </div>
    </div>
  );
}
