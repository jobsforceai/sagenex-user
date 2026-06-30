"use client";

import Image from "next/image";
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
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#C41E3A]">
          <Lock className="h-7 w-7" />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Image src="/sagenex.png" alt="Sagenex" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-sm font-black tracking-wide text-[#0F172A]">SAGENEX</span>
        </div>
        <h1 className="mt-3 text-2xl font-black text-[#0F172A]">Sign in required</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          You need to sign in to view this page. Your session may have expired.
        </p>
        <Button
          asChild
          className="mt-6 h-12 w-full rounded-2xl bg-[#C41E3A] text-sm font-bold text-white hover:bg-[#ad1b34]"
        >
          <Link href={loginHref}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in
          </Link>
        </Button>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-[#64748B] transition hover:text-[#C41E3A]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
