import { Skeleton } from "@/components/ui/skeleton";

const bone = "bg-[#E2E8F0]";

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Loading profile">
      <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 md:p-8">
        <div className="flex items-center gap-5">
          <Skeleton className={`h-24 w-24 shrink-0 rounded-full ${bone}`} />
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-3 w-16 ${bone}`} />
            <Skeleton className={`h-8 w-48 ${bone}`} />
            <Skeleton className={`h-4 w-56 ${bone}`} />
          </div>
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <Skeleton className={`h-4 w-32 ${bone}`} />
          <Skeleton className={`mt-4 h-10 w-full ${bone}`} />
          <Skeleton className={`mt-2 h-10 w-full ${bone}`} />
        </div>
      ))}
    </div>
  );
}

export function CoursesPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5" aria-busy="true" aria-label="Loading courses">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className={`h-6 w-36 rounded-full ${bone}`} />
            <Skeleton className={`h-8 w-32 ${bone}`} />
            <Skeleton className={`h-4 w-full max-w-md ${bone}`} />
          </div>
          <Skeleton className={`h-16 w-24 rounded-2xl ${bone}`} />
        </header>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
              <Skeleton className={`h-3 w-16 ${bone}`} />
              <Skeleton className={`mt-2 h-6 w-12 ${bone}`} />
            </div>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
              <Skeleton className={`h-40 w-full rounded-none ${bone}`} />
              <div className="space-y-2 p-4">
                <Skeleton className={`h-5 w-3/4 ${bone}`} />
                <Skeleton className={`h-3 w-full ${bone}`} />
                <Skeleton className={`h-9 w-full rounded-xl ${bone}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5" aria-busy="true" aria-label="Loading course">
      <div className="mx-auto max-w-7xl">
        <Skeleton className={`mb-5 h-4 w-32 ${bone}`} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className={`aspect-video w-full rounded-2xl ${bone}`} />
            <Skeleton className={`h-8 w-2/3 ${bone}`} />
            <Skeleton className={`h-4 w-full ${bone}`} />
            <Skeleton className={`h-4 w-5/6 ${bone}`} />
          </div>
          <div className="space-y-3">
            <Skeleton className={`h-6 w-40 ${bone}`} />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={`h-12 w-full rounded-xl ${bone}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5" aria-busy="true" aria-label="Loading wallet">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className={`h-9 w-32 ${bone}`} />
            <Skeleton className={`hidden h-4 w-64 sm:block ${bone}`} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Skeleton className={`h-10 w-28 rounded-full ${bone}`} />
            <Skeleton className={`h-10 w-28 rounded-full ${bone}`} />
          </div>
        </div>
        <Skeleton className={`h-44 w-full rounded-3xl ${bone}`} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={`h-24 rounded-2xl ${bone}`} />
          ))}
        </div>
        <Skeleton className={`h-64 w-full rounded-2xl ${bone}`} />
      </div>
    </div>
  );
}
