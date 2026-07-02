"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSafeRedirectPath } from "@/lib/auth-routes";

export default function LoginRequiredScreen() {
  const pathname = usePathname();
  const nextPath = getSafeRedirectPath(pathname);
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <div className="dashboard-light-scope flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#C41E3A]">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-5 font-display text-xl font-black text-[#0F172A]">Sign in required</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
          Sign in to continue. If you were already signed in, your session may have expired.
        </p>
        <Button
          asChild
          className="mt-6 h-11 w-full rounded-xl bg-[#C41E3A] text-sm font-bold text-white hover:bg-[#ad1b34]"
        >
          <Link href={loginHref}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in
          </Link>
        </Button>
        <Link
          href="/"
          className="mt-4 block text-center text-sm font-semibold text-[#94A3B8] transition hover:text-[#C41E3A]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
