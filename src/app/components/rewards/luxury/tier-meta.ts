export type TierId = "10L" | "30L" | "50L" | "1CR";

export type TierProgress = {
  tierId: TierId;
  qualified?: boolean;
  windowOpen?: boolean;
  windowEndsAt?: string | Date | null;
  teamBizPct?: number;
  directBizPct?: number;
  legsPct?: number;
  missing?: {
    teamBizINR?: number;
    directBizINR?: number;
    legs?: number;
  };
};

export type LuxurySnapshot = {
  hasAnchor?: boolean;
  computing?: boolean;
  cappedTeamBusinessINR?: number;
  rawTeamBusinessINR?: number;
  directBusinessINR?: number;
  activeLegsCount?: number;
  cycleAnchorAt?: string | Date | null;
  tierProgress?: TierProgress[];
  highestQualifiedTier?: TierId;
};

export type LuxuryCycle = {
  _id?: string;
  kind?: string;
  status?: string;
  approvedAt?: string | Date | null;
  qualifiedTierId?: TierId;
};

export type LuxuryProgressResponse = {
  snapshot?: LuxurySnapshot;
  cycle?: LuxuryCycle;
  error?: string;
};

export const TIER_ORDER: TierId[] = ["10L", "30L", "50L", "1CR"];

export const TIER_META: Record<
  TierId,
  {
    label: string;
    stage: number;
    teamBiz: number;
    directBiz: number;
    legs: number;
    windowDays: number;
    image: string;
    prizes: string;
    accent: string;
    accentSoft: string;
    ring: string;
  }
> = {
  "10L": {
    label: "Starter",
    stage: 1,
    teamBiz: 1_000_000,
    directBiz: 50_000,
    legs: 2,
    windowDays: 90,
    image: "/rewards/starter-prize.png",
    prizes: "Tech gadgets & foreign trip",
    accent: "#059669",
    accentSoft: "#ECFDF5",
    ring: "ring-emerald-500/40",
  },
  "30L": {
    label: "Mid",
    stage: 2,
    teamBiz: 3_000_000,
    directBiz: 150_000,
    legs: 3,
    windowDays: 90,
    image: "/rewards/mid-prize.png",
    prizes: "Premium bike & international trip",
    accent: "#2563EB",
    accentSoft: "#EFF6FF",
    ring: "ring-blue-500/40",
  },
  "50L": {
    label: "Elite",
    stage: 3,
    teamBiz: 5_000_000,
    directBiz: 250_000,
    legs: 4,
    windowDays: 120,
    image: "/rewards/elite-prize.png",
    prizes: "Office setup & premium car",
    accent: "#7C3AED",
    accentSoft: "#F5F3FF",
    ring: "ring-violet-500/40",
  },
  "1CR": {
    label: "Crown",
    stage: 4,
    teamBiz: 10_000_000,
    directBiz: 500_000,
    legs: 5,
    windowDays: 120,
    image: "/rewards/crown-prize.png",
    prizes: "House support & luxury car",
    accent: "#D97706",
    accentSoft: "#FFFBEB",
    ring: "ring-amber-500/40",
  },
};

export const inr = (n = 0) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const lakh = (n = 0) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2).replace(/\.00$/, "")} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return inr(n);
};

export const clampPct = (value = 0) => Math.min(100, Math.max(0, Math.round(value)));

export const daysLeft = (endsAt?: string | Date | null) => {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
};

export type StageStatus = "cleared" | "current" | "ahead" | "review" | "claimed" | "window_closed";

export function resolveStageStatus(
  tier: TierProgress | undefined,
  opts: {
    isCurrent: boolean;
    pendingApproval: boolean;
    claimed: boolean;
    qualifiedTierId?: TierId | null;
  },
): StageStatus {
  const id = tier?.tierId;
  if (opts.claimed && opts.qualifiedTierId === id) return "claimed";
  if (opts.pendingApproval && opts.qualifiedTierId === id) return "review";
  if (tier?.qualified) return "cleared";
  if (opts.isCurrent) {
    if (tier?.windowOpen === false) return "window_closed";
    return "current";
  }
  return "ahead";
}
