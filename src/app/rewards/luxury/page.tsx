"use client";
import LuxuryRewardsCard from "@/app/components/LuxuryRewardsCard";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LuxuryRewardsPage() {
  const { isAuthenticated, authLoading } = useAuth() as any;
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/rewards"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Rewards
        </Link>
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C81E4A]">Sagenex SGX</p>
          <h1 className="mt-1 text-3xl font-black text-[#0F172A]">Luxury Rewards Progress</h1>
          <p className="mt-1 text-sm text-slate-500">Live tracking against 10L / 30L / 50L / 1Cr tiers.</p>
        </header>
        <LuxuryRewardsCard />
      </div>
    </div>
  );
}
