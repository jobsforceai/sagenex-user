"use client";
import LuxuryRewardsCard from "@/app/components/LuxuryRewardsCard";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LuxuryRewardsPage() {
  const { isAuthenticated, authLoading } = useAuth() as any;
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
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
