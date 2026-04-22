import Image from "next/image";
import Link from "next/link";

type VisualAsset = {
  src: string;
  alt: string;
  href: string;
  badge: string;
};

const visualAssets: VisualAsset[] = [
  {
    src: "/dashboard/dashboard-hero-figurine.png",
    alt: "Dashboard hero graphic",
    href: "/dashboard",
    badge: "Overview",
  },
  {
    src: "/dashboard/dashboard-rank-figurine.png",
    alt: "Rank progression graphic",
    href: "/team",
    badge: "Rank",
  },
  {
    src: "/dashboard/dashboard-earnings-figurine.png",
    alt: "Earnings visual graphic",
    href: "/wallet",
    badge: "Earnings",
  },
  {
    src: "/dashboard/dashboard-ticket-figurine.png",
    alt: "Ticket balance graphic",
    href: "/payouts",
    badge: "Tickets",
  },
  {
    src: "/dashboard/dashboard-progress-figurine.png",
    alt: "Progress visual graphic",
    href: "/salary",
    badge: "Progress",
  },
  {
    src: "/dashboard/dashboard-leaderboard-figurine.png",
    alt: "Leaderboard visual graphic",
    href: "/rewards",
    badge: "Leaderboard",
  },
];

interface DashboardVisualSectionProps {
  compact?: boolean;
}

const DashboardVisualSection = ({ compact = false }: DashboardVisualSectionProps) => {
  const assetsToRender = compact ? visualAssets.slice(0, 3) : visualAssets;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(196,30,58,0.08),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(0,179,134,0.09),transparent_40%)]" />
      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-zinc-400">Visual Hub</p>
          <h2 className="mt-1 text-[20px] font-bold tracking-tight text-[#111827]">
            {compact ? "Dashboard Graphics" : "Platform Visual Story"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {compact
              ? "Quick visual shortcuts to key sections."
              : "Cutout visuals mapped to your core actions and performance areas."}
          </p>
        </div>
        {!compact && (
          <Link
            href="/dashboard"
            className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-[#F8F9FA]"
          >
            View all
          </Link>
        )}
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-3"}`}>
        {assetsToRender.map((asset) => (
          <Link
            key={asset.src}
            href={asset.href}
            className="group relative overflow-hidden rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="absolute left-2 top-2 z-20 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-zinc-500 shadow-sm">
              {asset.badge}
            </span>
            <div className={`relative mx-auto ${compact ? "h-28 w-full" : "h-36 w-full"}`}>
              <Image
                src={asset.src}
                alt={asset.alt}
                fill
                sizes={compact ? "(max-width: 640px) 100vw, 30vw" : "(max-width: 768px) 50vw, 33vw"}
                className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                priority={false}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default DashboardVisualSection;