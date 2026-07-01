import { Skeleton } from "@/components/ui/skeleton";

/** Minimal inline skeleton — matches rewards page layout, no logo/spinner */
export default function RewardsPageSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-label="Loading rewards">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-14 bg-[#E2E8F0]" />
            <Skeleton className="h-8 w-36 bg-[#E2E8F0]" />
            <Skeleton className="h-4 w-full max-w-md bg-[#E2E8F0]" />
          </div>
          <Skeleton className="h-4 w-24 bg-[#E2E8F0]" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5"
            >
              <Skeleton className="h-2.5 w-16 bg-[#E2E8F0]" />
              <Skeleton className="mt-2 h-6 w-20 bg-[#E2E8F0]" />
            </div>
          ))}
        </div>
      </header>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
        <Skeleton className="h-4 w-36 bg-[#E2E8F0]" />
        <Skeleton className="mt-3 h-14 w-full rounded-xl bg-[#E2E8F0]" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
        <Skeleton className="h-1 w-full rounded-none bg-[#F4B4C4]" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full bg-[#E2E8F0]" />
            <Skeleton className="h-6 w-28 rounded-lg bg-[#E2E8F0]" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-[#E2E8F0]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-20 bg-[#E2E8F0]" />
              <Skeleton className="h-6 w-52 max-w-full bg-[#E2E8F0]" />
              <Skeleton className="h-4 w-full bg-[#E2E8F0]" />
            </div>
          </div>
          <Skeleton className="h-[88px] w-full rounded-2xl bg-[#E2E8F0]" />
        </div>
      </div>

      <div>
        <Skeleton className="mb-1 h-3 w-24 bg-[#E2E8F0]" />
        <Skeleton className="mb-4 h-4 w-44 bg-[#E2E8F0]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
              <Skeleton className="h-[88px] w-full rounded-none bg-[#F1F5F9]" />
              <div className="p-3.5">
                <Skeleton className="h-3 w-24 bg-[#E2E8F0]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RewardsClaimsSkeleton() {
  return (
    <div
      className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4"
      aria-busy="true"
      aria-label="Loading claim details"
    >
      <Skeleton className="h-4 w-40 bg-[#E2E8F0]" />
      <Skeleton className="mt-2 h-3 w-56 bg-[#E2E8F0]" />
    </div>
  );
}
