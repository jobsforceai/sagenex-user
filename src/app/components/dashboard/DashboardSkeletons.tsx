import { Skeleton } from "@/components/ui/skeleton";

/**
 * Hero Banner Skeleton
 * Mimics the gradient banner with welcome text, name, rank, and balance
 */
export const HeroBannerSkeleton = () => (
  <div className="relative overflow-hidden rounded-[20px] p-7 bg-gray-200">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="text-left sm:text-right">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-40 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="mt-5 border-t border-gray-300 pt-4">
      <Skeleton className="h-3 w-40 mb-3" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  </div>
);

/**
 * KPI Cards Skeleton (4 cards in a row)
 * Mimics Current Rank, Rank Progress, Package Value, Tickets
 */
export const KPICardsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Quick Actions Skeleton (4 cards in a row)
 * Mimics Salary, Rewards, Payouts, SGNX Gold links
 */
export const QuickActionsSkeleton = () => (
  <section>
    <Skeleton className="h-3 w-24 mb-3" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <Skeleton className="h-10 w-10 rounded-xl mb-3" />
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  </section>
);

/**
 * Earnings Snapshot Skeleton
 * Mimics 4 financial metric cards (Invested Principal, Referral Earnings, etc.)
 */
export const EarningsSnapshotSkeleton = () => (
  <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
    <Skeleton className="h-5 w-40 mb-4" />
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Top Performers Skeleton
 * Mimics leaderboard with 6 entries
 */
export const TopPerformersSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
    <div className="border-b border-[#E8E8E8] px-5 py-4">
      <Skeleton className="h-5 w-40 mb-1" />
      <Skeleton className="h-3 w-48 mt-2" />
    </div>
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[#E8E8E8] px-5 py-3.5">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Right Column Card Skeleton (for Referral Link, Stats, Wallet Summary, etc.)
 * Generic card skeleton with title and content
 */
export const RightColumnCardSkeleton = ({ lines = 4 }: { lines?: number }) => (
  <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
    <Skeleton className="h-4 w-32 mb-3" />
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Referral Stats Skeleton
 * Mimics 4 stat boxes (Total Referrals, Active Agents, Invested, Downline Vol.)
 */
export const ReferralStatsSkeleton = () => (
  <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
    <Skeleton className="h-4 w-32 mb-3" />
    <div className="grid grid-cols-2 gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-[#F8F9FA] p-3">
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Full Dashboard Skeleton Loader
 * Complete layout matching the real dashboard structure
 */
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-5">
    {/* Hero Banner */}
    <HeroBannerSkeleton />

    {/* KPI Cards */}
    <KPICardsSkeleton />

    {/* Quick Actions */}
    <QuickActionsSkeleton />

    {/* Main Grid */}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* Left column (2/3) */}
      <div className="space-y-5 xl:col-span-2">
        <EarningsSnapshotSkeleton />
        <TopPerformersSkeleton />
      </div>

      {/* Right column (1/3) */}
      <div className="space-y-5">
        <RightColumnCardSkeleton lines={3} /> {/* Referral Link */}
        <ReferralStatsSkeleton />
        <RightColumnCardSkeleton lines={4} /> {/* Wallet Summary */}
        <RightColumnCardSkeleton lines={3} /> {/* Ticket Balance */}
        <RightColumnCardSkeleton lines={3} /> {/* Multiplier Window (optional) */}
      </div>
    </div>
  </div>
);
