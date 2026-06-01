"use client";

/**
 * /rewards/luxury was consolidated into the main /rewards page in
 * Phase 2 of the rewards perf+UX cleanup (team directive 2026-06-01).
 *
 * This route is preserved as a 1-tick redirect so any bookmarks /
 * external links land in the right place. The luxury progress card +
 * tier-rules content now live on /rewards.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LuxuryRewardsLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/rewards");
  }, [router]);

  return (
    <div className="dashboard-light-scope flex min-h-screen items-center justify-center bg-[#F8FAFC] text-[#0F172A]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-[#C81E4A]" />
        <p className="text-sm font-semibold text-slate-500">Redirecting to Rewards…</p>
      </div>
    </div>
  );
}
