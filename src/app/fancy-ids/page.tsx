"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  Crown,
  Fingerprint,
  Gem,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelFancyIdRequest,
  checkFancyIdAvailability,
  claimFancyIdAstrology,
  FancyIdAstrologyPreview,
  FancyIdAvailability,
  FancyIdCatalogItem,
  FancyIdCatalogResponse,
  FancyIdCatalogTier,
  FancyIdRequestRow,
  getFancyIdCatalog,
  getMyFancyIdRequests,
  getDashboardData,
  getProfileData,
  getWalletData,
  previewFancyIdAstrology,
  requestFancyId,
} from "@/actions/user";

const formatCurrency = (amount?: number) =>
  (amount ?? 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const statusClass: Record<string, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  taken: "border-slate-200 bg-slate-100 text-slate-500",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-500",
};

const reasonLabel = (reason: string) =>
  reason
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const catalogItemStatus = (item: FancyIdCatalogItem) => item.status ?? "available";
const catalogItemMonthlyPrice = (item: FancyIdCatalogItem) => item.monthlyPriceINR ?? item.priceINR ?? 0;
const tierMinimumMonthlyPrice = (tier: FancyIdCatalogTier) => tier.minMonthlyPriceINR ?? tier.minPriceINR ?? 0;

const tierPalettes = [
  {
    match: "five-repeat",
    shell: "border-amber-200/80 bg-[linear-gradient(135deg,#FFF7ED,#FFFFFF_50%,#FFF1F4)]",
    chip: "bg-amber-100 text-amber-800",
    icon: "bg-amber-100 text-amber-700",
    bar: "from-amber-400 via-[#C8103E] to-rose-500",
    card: "bg-[linear-gradient(145deg,#ffffff,#fff7ed)] hover:border-amber-300",
    price: "text-amber-700",
    glow: "bg-amber-200",
  },
  {
    match: "penta",
    shell: "border-fuchsia-200/80 bg-[linear-gradient(135deg,#FDF4FF,#FFFFFF_50%,#FFF1F4)]",
    chip: "bg-fuchsia-100 text-fuchsia-800",
    icon: "bg-fuchsia-100 text-fuchsia-700",
    bar: "from-fuchsia-400 via-[#C8103E] to-purple-500",
    card: "bg-[linear-gradient(145deg,#ffffff,#fdf4ff)] hover:border-fuchsia-300",
    price: "text-fuchsia-700",
    glow: "bg-fuchsia-200",
  },
  {
    match: "big-round",
    shell: "border-emerald-200/80 bg-[linear-gradient(135deg,#ECFDF5,#FFFFFF_52%,#F0FDFA)]",
    chip: "bg-emerald-100 text-emerald-800",
    icon: "bg-emerald-100 text-emerald-700",
    bar: "from-emerald-400 via-teal-400 to-[#C8103E]",
    card: "bg-[linear-gradient(145deg,#ffffff,#ecfdf5)] hover:border-emerald-300",
    price: "text-emerald-700",
    glow: "bg-emerald-200",
  },
  {
    match: "palindrome",
    shell: "border-sky-200/80 bg-[linear-gradient(135deg,#EFF6FF,#FFFFFF_52%,#F0F9FF)]",
    chip: "bg-sky-100 text-sky-800",
    icon: "bg-sky-100 text-sky-700",
    bar: "from-sky-400 via-blue-500 to-[#C8103E]",
    card: "bg-[linear-gradient(145deg,#ffffff,#eff6ff)] hover:border-sky-300",
    price: "text-sky-700",
    glow: "bg-sky-200",
  },
  {
    match: "sequential",
    shell: "border-indigo-200/80 bg-[linear-gradient(135deg,#EEF2FF,#FFFFFF_52%,#F5F3FF)]",
    chip: "bg-indigo-100 text-indigo-800",
    icon: "bg-indigo-100 text-indigo-700",
    bar: "from-indigo-400 via-violet-500 to-[#C8103E]",
    card: "bg-[linear-gradient(145deg,#ffffff,#eef2ff)] hover:border-indigo-300",
    price: "text-indigo-700",
    glow: "bg-indigo-200",
  },
  {
    match: "quad",
    shell: "border-orange-200/80 bg-[linear-gradient(135deg,#FFF7ED,#FFFFFF_52%,#FFFBEB)]",
    chip: "bg-orange-100 text-orange-800",
    icon: "bg-orange-100 text-orange-700",
    bar: "from-orange-400 via-amber-400 to-[#C8103E]",
    card: "bg-[linear-gradient(145deg,#ffffff,#fff7ed)] hover:border-orange-300",
    price: "text-orange-700",
    glow: "bg-orange-200",
  },
] as const;

const defaultTierPalette = {
  shell: "border-rose-200/80 bg-[linear-gradient(135deg,#FFF1F4,#FFFFFF_52%,#F8FAFC)]",
  chip: "bg-rose-100 text-rose-800",
  icon: "bg-rose-100 text-[#C8103E]",
  bar: "from-[#C8103E] via-rose-400 to-amber-400",
  card: "bg-[linear-gradient(145deg,#ffffff,#fff8fa)] hover:border-[#C8103E]/30",
  price: "text-[#C8103E]",
  glow: "bg-rose-200",
};

const getTierPalette = (tier: Pick<FancyIdCatalogTier, "key" | "label">) => {
  const token = `${tier.key} ${tier.label}`.toLowerCase();
  return tierPalettes.find((palette) => token.includes(palette.match)) ?? defaultTierPalette;
};

const filterChips = [
  { key: "all", label: "All" },
  { key: "legendary", label: "Legendary" },
  { key: "repeat", label: "Repeat" },
  { key: "penta", label: "Penta" },
  { key: "palindrome", label: "Palindrome" },
  { key: "sequential", label: "Sequential" },
  { key: "mirror", label: "Mirror" },
  { key: "round", label: "Round" },
] as const;

type FilterKey = (typeof filterChips)[number]["key"];

const tierMatchesFilter = (tier: FancyIdCatalogTier, filter: FilterKey) => {
  if (filter === "all") return true;
  const token = `${tier.key} ${tier.label} ${tier.badge} ${tier.items
    .flatMap((item) => item.reasons)
    .join(" ")}`.toLowerCase();
  if (filter === "legendary") return token.includes("legendary") || token.includes("five");
  if (filter === "repeat") return token.includes("repeat") || token.includes("same-digit") || token.includes("streak");
  return token.includes(filter);
};

type RequestTarget = {
  displayId: string;
  type: "PATTERN" | "CUSTOM" | "NUMEROLOGY";
  monthlyPrice: number;
  source: "catalog" | "custom" | "astrology";
  note?: string;
  /**
   * For astrology requests, captures the exact name + DOB inputs that produced
   * the matched displayId at preview time. Submitted as-is so the user can't
   * silently change inputs between previewing and confirming.
   */
  astrologyInputs?: { name: string; dob: string };
};

export default function FancyIdsPage() {
  const [catalog, setCatalog] = useState<FancyIdCatalogResponse | null>(null);
  const [requests, setRequests] = useState<FancyIdRequestRow[]>([]);
  const [profile, setProfile] = useState<{ userId?: string; fancyId?: string | null; fullName?: string } | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState<FancyIdAvailability | null>(null);
  const [checking, setChecking] = useState(false);
  const [requestTarget, setRequestTarget] = useState<RequestTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [astroName, setAstroName] = useState("");
  const [astroDob, setAstroDob] = useState("");
  const [astroPreview, setAstroPreview] = useState<FancyIdAstrologyPreview | null>(null);
  const [astroLoading, setAstroLoading] = useState(false);
  const [purchaseAcknowledged, setPurchaseAcknowledged] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const [catalogRes, requestsRes, profileRes, walletRes, dashboardRes] = await Promise.all([
        getFancyIdCatalog(14),
        getMyFancyIdRequests(),
        getProfileData(),
        getWalletData(),
        getDashboardData(),
      ]);

      if (catalogRes?.error) toast.error(catalogRes.error);
      else setCatalog(catalogRes as FancyIdCatalogResponse);

      if (requestsRes?.error) toast.error(requestsRes.error);
      else setRequests((requestsRes.rows ?? []) as FancyIdRequestRow[]);

      if (!profileRes?.error) setProfile(profileRes);

      // Wallet balance — try dashboard payload first (which is what the
      // sidebar uses and is known reliable), fall back to the wallet
      // endpoint payload across all the field shapes the backend has
      // used over time.
      const walletPayload = (!walletRes?.error ? walletRes : null) as {
        availableBalance?: number;
        balance?: number;
        summary?: { availableBalance?: number; balance?: number };
        wallet?: { availableBalance?: number; balance?: number };
      } | null;
      const dashPayload = (!dashboardRes?.error ? dashboardRes : null) as {
        wallet?: { availableBalance?: number };
      } | null;
      setBalance(Number(
        dashPayload?.wallet?.availableBalance ??
        walletPayload?.summary?.availableBalance ??
        walletPayload?.summary?.balance ??
        walletPayload?.wallet?.availableBalance ??
        walletPayload?.wallet?.balance ??
        walletPayload?.availableBalance ??
        walletPayload?.balance ??
        0
      ));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load Fancy IDs.";
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!catalog?.tiers.length) return;
    setExpandedTiers((current) => {
      if (Object.keys(current).length > 0) return current;
      return Object.fromEntries(catalog.tiers.map((tier, index) => [tier.key, index < 2]));
    });
  }, [catalog]);

  const featured = useMemo(() => {
    const items = catalog?.tiers.flatMap((tier) => tier.items.map((item) => ({ ...item, tier }))) ?? [];
    return items.filter((item) => catalogItemStatus(item) === "available").slice(0, 4);
  }, [catalog]);

  const catalogStats = useMemo(() => {
    const tiers = catalog?.tiers ?? [];
    const allItems = tiers.flatMap((tier) => tier.items);
    // "available" is rendered as "live IDs available" — only count items
    // whose status is actually available (filter out taken/reserved). The
    // starting price is still computed across all priced items so the
    // "From ₹X / mo" badge stays accurate even if every cheap ID is taken.
    const availableItems = allItems.filter((item) => catalogItemStatus(item) === "available");
    const prices = allItems.map(catalogItemMonthlyPrice).filter((price) => price > 0);
    return {
      tiers: tiers.length,
      available: availableItems.length,
      startingPrice: prices.length ? Math.min(...prices) : 0,
    };
  }, [catalog]);

  const filteredTiers = useMemo(
    () => (catalog?.tiers ?? []).filter((tier) => tierMatchesFilter(tier, activeFilter)),
    [catalog, activeFilter],
  );

  const currentDisplayId = profile?.fancyId ? profile.fancyId.toUpperCase() : profile?.userId || "--";

  const openRequest = (target: RequestTarget) => {
    setPurchaseAcknowledged(false);
    setRequestTarget(target);
  };

  const handleCatalogRequest = (item: FancyIdCatalogItem) => {
    if (catalogItemStatus(item) !== "available") return;
    openRequest({
      displayId: item.id,
      type: "PATTERN",
      monthlyPrice: catalogItemMonthlyPrice(item),
      source: "catalog",
    });
  };

  const handleCheck = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setChecking(true);
    try {
      const res = await checkFancyIdAvailability(trimmed);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      const nextAvailability = res as FancyIdAvailability;
      setAvailability(nextAvailability);
      if (nextAvailability.state === "available") {
        openRequest({
          displayId: nextAvailability.displayId,
          type: nextAvailability.type,
          monthlyPrice: nextAvailability.monthlyPriceINR,
          source: "custom",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Availability check failed.";
      toast.error(msg);
    } finally {
      setChecking(false);
    }
  };

  const handleRequest = async () => {
    if (!requestTarget) return;
    if (!purchaseAcknowledged) {
      toast.error("Please confirm the wallet debit before continuing.");
      return;
    }
    setSubmitting(true);
    try {
      // Astrology: submit the snapshotted inputs that produced the previewed
      // match, NOT the current state of the form (the user may have edited
      // name/DOB after preview opened the modal).
      const res =
        requestTarget.source === "astrology" && requestTarget.astrologyInputs
          ? await claimFancyIdAstrology(
              requestTarget.astrologyInputs.name,
              requestTarget.astrologyInputs.dob,
            )
          : await requestFancyId(requestTarget.displayId);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Request submitted. First month has been reserved from your wallet.");
      setRequestTarget(null);
      setPurchaseAcknowledged(false);
      setAvailability(null);
      setAstroPreview(null);
      setQuery("");
      void load(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    setSubmitting(true);
    try {
      const res = await cancelFancyIdRequest(requestId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Request cancelled and refunded.");
      void load(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel request.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAstrologyPreview = async () => {
    if (!astroName.trim() || !astroDob) {
      toast.error("Name and date of birth are required.");
      return;
    }
    setAstroLoading(true);
    try {
      const res = await previewFancyIdAstrology(astroName.trim(), astroDob);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      const preview = res as FancyIdAstrologyPreview;
      setAstroPreview(preview);
      if (preview.status === "available" && preview.matched) {
        // Snapshot the inputs that produced THIS match — submission later
        // uses these snapshotted values, not the latest state of the form,
        // so the user can't change name/DOB between preview and confirm and
        // end up paying for a different ID than they saw.
        openRequest({
          displayId: preview.matched.id,
          type: "NUMEROLOGY",
          monthlyPrice: preview.matched.priceINR,
          source: "astrology",
          note: preview.matched.reasonForShift,
          astrologyInputs: { name: astroName.trim(), dob: astroDob },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Astrology preview failed.";
      toast.error(msg);
    } finally {
      setAstroLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-56 animate-pulse rounded-3xl bg-white" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl bg-white" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-2.5 py-2.5 pb-24 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-3 sm:space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-[#7A001F]/20 bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_56%,#170006_100%)] p-3 text-white shadow-[0_18px_45px_rgba(122,0,31,0.18)] sm:rounded-3xl sm:p-8">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_12px_12px,rgba(255,255,255,0.22)_1.5px,transparent_0)] [background-size:28px_28px]" />
          
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="absolute left-1/3 top-10 hidden h-40 w-40 rounded-full bg-white/10 blur-3xl sm:block" />
          <div className="relative grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-50 sm:gap-2 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
                <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Premium Identity Vault
              </p>
              <h1 className="mt-2 max-w-2xl text-xl font-black leading-[1.03] tracking-tight sm:mt-4 sm:text-6xl">
                Own the ID they remember.
              </h1>
              <p className="mt-1.5 max-w-xl text-[11px] font-semibold leading-4 text-white/80 sm:mt-3 sm:text-base sm:leading-6">
                Reserve rare number patterns, custom SAGENEX names, and astrology-matched identities with admin approval and monthly billing.
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-5 sm:max-w-xl sm:gap-2">
                {[
                  ["Wallet", formatCurrency(balance)],
                  ["Current", currentDisplayId],
                  ["From", `${formatCurrency(catalogStats.startingPrice)} / mo`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/18 bg-white/10 p-1.5 backdrop-blur sm:rounded-2xl sm:p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/55 sm:text-[9px] sm:tracking-[0.12em]">{label}</p>
                    <p className="mt-0.5 truncate text-[11px] font-black text-white sm:mt-1 sm:text-lg">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
                {[
                  "No bidding",
                  "Admin approval",
                  "Refund on reject",
                  "Monthly subscription",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/75">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden space-y-3 sm:block">
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/12 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl" />
                <div className="relative rounded-2xl border border-white/18 bg-[linear-gradient(135deg,rgba(15,23,42,0.78),rgba(122,0,31,0.72))] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-amber-200">
                      <Fingerprint className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100">
                      Verified
                    </span>
                  </div>
                  <p className="mt-7 text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Featured sample</p>
                  <p className="text-4xl font-black tracking-tight text-white">U99999</p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/45">Current</p>
                      <p className="max-w-[150px] truncate text-sm font-black text-white">{currentDisplayId}</p>
                    </div>
                    <p className="rounded-full bg-white/12 px-3 py-1 text-xs font-black text-amber-100">
                      {catalogStats.available} live
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/18 bg-white/12 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60 sm:text-[10px] sm:tracking-[0.14em]">Check custom ID</p>
              <div className="mt-2 flex gap-1.5 sm:mt-3 sm:gap-2">
                <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-2.5 sm:h-12 sm:rounded-2xl sm:px-3">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleCheck()}
                    placeholder="Uabhinay or U99999"
                    className="min-w-0 flex-1 bg-transparent text-xs font-black text-[#0F172A] placeholder:text-slate-400 focus:outline-none sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={checking || !query.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-200 px-3 text-xs font-black text-[#4B1A00] transition hover:bg-amber-100 disabled:opacity-50 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                </button>
              </div>
              {availability && (
                <div className="mt-2 rounded-xl bg-white/10 p-2.5 text-xs font-bold text-white sm:mt-3 sm:rounded-2xl sm:p-3 sm:text-sm">
                  {availability.state === "invalid" && availability.error}
                  {availability.state === "taken" && `${availability.displayId} is already taken or under review.`}
                  {availability.state === "mine-pending" && `${availability.displayId} is already pending in your requests.`}
                  {availability.state === "available" && `${availability.displayId} is ${formatCurrency(availability.monthlyPriceINR)} per month.`}
                </div>
              )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-white p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:hidden">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#64748B]">Check custom ID</p>
          <div className="mt-2 flex gap-1.5">
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleCheck()}
                placeholder="Uabhinay or U99999"
                className="min-w-0 flex-1 bg-transparent text-xs font-black text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking || !query.trim()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#C8103E] px-3 text-xs font-black text-white transition hover:bg-[#A90D32] disabled:opacity-50"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
            </button>
          </div>
          {availability && (
            <div className="mt-2 rounded-xl bg-slate-50 p-2 text-xs font-bold text-[#0F172A]">
              {availability.state === "invalid" && availability.error}
              {availability.state === "taken" && `${availability.displayId} is already taken or under review.`}
              {availability.state === "mine-pending" && `${availability.displayId} is already pending in your requests.`}
              {availability.state === "available" && `${availability.displayId} is ${formatCurrency(availability.monthlyPriceINR)} per month.`}
            </div>
          )}
        </section>

        <section className="sticky top-0 z-20 -mx-2.5 border-y border-slate-200/70 bg-[#F8FAFC]/92 px-2.5 py-2 backdrop-blur sm:static sm:mx-0 sm:rounded-3xl sm:border sm:bg-white sm:p-3 sm:shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
            {filterChips.map((chip) => {
              const active = activeFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setActiveFilter(chip.key)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition sm:text-xs ${
                    active
                      ? "border-[#C8103E] bg-[#C8103E] text-white shadow-[0_10px_24px_rgba(200,16,62,0.2)]"
                      : "border-slate-200 bg-white text-[#475569] hover:border-[#C8103E]/30 hover:bg-[#FFF1F4] hover:text-[#C8103E]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-[linear-gradient(135deg,#ECFDF5,#FFFFFF_55%,#FFF1F4)] px-3 py-2 shadow-[0_8px_22px_rgba(15,23,42,0.05)] sm:rounded-3xl sm:px-5 sm:py-3">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-200/50 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-[#0F172A] sm:text-sm">
                Vault update · {catalogStats.available} live IDs available
              </p>
              <p className="hidden text-xs font-semibold text-[#64748B] sm:block">
                Requests are first-come, first-served. IDs under review disappear from the catalog.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-emerald-700 shadow-sm">
              Live
            </span>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#0F172A] sm:text-xl">Featured Drops</h2>
                <p className="hidden text-sm font-semibold text-[#64748B] sm:block">Fresh picks from the identity vault.</p>
              </div>
              <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[10px] font-black text-[#C8103E]">
                {featured.length} picks
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {featured.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCatalogRequest(item)}
                  className={`group relative overflow-hidden rounded-2xl border p-2 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)] sm:rounded-3xl sm:p-5 ${getTierPalette(item.tier).card}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${getTierPalette(item.tier).bar} opacity-80`} />
                  <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full ${getTierPalette(item.tier).glow} blur-2xl transition`} />
                  <div className="flex items-start justify-between gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${getTierPalette(item.tier).icon}`}>
                      <Gem className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className={`rounded-full border px-1 py-0.5 text-[7px] font-black uppercase sm:px-2 sm:py-1 sm:text-[9px] ${statusClass[catalogItemStatus(item)]}`}>
                      Avail
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-black tracking-tight text-[#0F172A] sm:mt-3 sm:text-3xl">{item.id}</p>
                  <p className="mt-0.5 truncate text-[9px] font-bold text-[#64748B] sm:mt-1 sm:text-xs">{item.tier.label}</p>
                  <div className="mt-1 flex items-center justify-between gap-1 sm:mt-3">
                    <p className={`truncate text-[10px] font-black sm:text-sm ${getTierPalette(item.tier).price}`}>{formatCurrency(catalogItemMonthlyPrice(item))} / mo</p>
                    <span className={`hidden rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm sm:inline-flex ${getTierPalette(item.tier).price}`}>
                      Reserve
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#0F172A] sm:text-lg">Available Fancy IDs</h2>
                <p className="mt-1 hidden text-sm text-[#64748B] sm:block">Unavailable and under-review IDs are hidden by the backend.</p>
              </div>
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-[#0F172A] hover:bg-slate-50 disabled:opacity-50 sm:px-3 sm:py-2 sm:text-xs"
              >
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>

            <div className="mt-3 space-y-4 sm:mt-4 sm:space-y-5">
              {filteredTiers.map((tier) => (
                <FancyTier
                  key={tier.key}
                  tier={tier}
                  expanded={expandedTiers[tier.key] ?? false}
                  onToggle={() =>
                    setExpandedTiers((current) => ({
                      ...current,
                      [tier.key]: !(current[tier.key] ?? false),
                    }))
                  }
                  onRequest={handleCatalogRequest}
                />
              ))}
              {!catalog?.tiers.length && (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-[#64748B]">
                  No catalog items are available right now.
                </div>
              )}
              {catalog?.tiers.length && filteredTiers.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-[#64748B]">
                  No IDs found in this group yet.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-3 sm:space-y-4">
            <AstrologyCard
              name={astroName}
              dob={astroDob}
              preview={astroPreview}
              loading={astroLoading}
              onNameChange={setAstroName}
              onDobChange={setAstroDob}
              onPreview={handleAstrologyPreview}
            />

            <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-11 sm:w-11 sm:rounded-2xl">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#0F172A] sm:text-base">How subscription works</h2>
                  <p className="text-[11px] font-semibold text-[#64748B] sm:text-xs">Request, approval, monthly billing</p>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs font-semibold text-[#475569] sm:mt-4 sm:space-y-3 sm:text-sm">
                {[
                  "First month is debited from your available wallet immediately.",
                  "The ID is locked while admin reviews your request.",
                  "After approval, billing renews every 30 days.",
                  "If rejected or cancelled while pending, the debit is refunded.",
                ].map((item) => (
                  <p key={item} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 sm:h-4 sm:w-4" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-[#0F172A] sm:text-base">My Requests</h2>
                <span className="rounded-full bg-[#FFF1F4] px-2 py-1 text-[10px] font-black text-[#C8103E]">{requests.length}</span>
              </div>
              <div className="mt-3 space-y-2 sm:mt-4">
                {requests.length > 0 ? requests.map((row) => (
                  <div key={row._id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:rounded-2xl sm:p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-[#0F172A] sm:text-lg">{row.displayId}</p>
                        <p className="text-[11px] font-bold text-[#64748B] sm:text-xs">{row.type} · {formatCurrency(row.myBidAmount)} / mo</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${statusClass[row.status]}`}>
                        {row.status}
                      </span>
                    </div>
                    {row.status === "PENDING" && row.myBidStatus === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(row._id)}
                        disabled={submitting}
                        className="mt-2 h-8 w-full rounded-xl border border-rose-200 bg-white text-[11px] font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50 sm:mt-3 sm:h-9 sm:text-xs"
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-[#64748B] sm:rounded-2xl sm:px-4 sm:py-6 sm:text-sm">
                    Your pending and approved Fancy ID requests will appear here.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {requestTarget && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/45 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_25px_80px_rgba(15,23,42,0.22)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#64748B]">Request Fancy ID</p>
                <h2 className="mt-1 text-2xl font-black text-[#0F172A] sm:text-3xl">{requestTarget.displayId}</h2>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">
                  {formatCurrency(requestTarget.monthlyPrice)} per month
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequestTarget(null);
                  setPurchaseAcknowledged(false);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close request modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-[#FFF1F4] p-3 text-xs font-semibold leading-5 text-[#7A001F] sm:mt-5 sm:p-4 sm:text-sm sm:leading-6">
              First month will be debited now. Your request then goes to admin approval. If it is rejected or you cancel while pending, the amount is refunded.
            </div>
            {requestTarget.note && (
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                {requestTarget.note}
              </div>
            )}
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-[#0F172A]">
              <input
                type="checkbox"
                checked={purchaseAcknowledged}
                onChange={(event) => setPurchaseAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#C8103E]"
              />
              <span>
                I understand this will debit {formatCurrency(requestTarget.monthlyPrice)} from my wallet now as the first month&apos;s Fancy ID subscription.
              </span>
            </label>
            <button
              type="button"
              onClick={handleRequest}
              disabled={submitting || !purchaseAcknowledged}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#D4143F,#7A001F)] text-sm font-black text-white shadow-[0_14px_28px_rgba(200,16,62,0.22)] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:h-12"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm request"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function FancyTier({
  tier,
  expanded,
  onToggle,
  onRequest,
}: {
  tier: FancyIdCatalogTier;
  expanded: boolean;
  onToggle: () => void;
  onRequest: (item: FancyIdCatalogItem) => void;
}) {
  const palette = getTierPalette(tier);
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:rounded-3xl sm:p-3.5 ${palette.shell}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${palette.bar}`} />
      <div className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full ${palette.glow} opacity-45 blur-3xl`} />
      <button
        type="button"
        onClick={onToggle}
        className="relative flex w-full items-center justify-between gap-2 text-left sm:gap-3"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${palette.icon}`}>
            <Gem className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-[#0F172A] sm:text-sm">{tier.label}</p>
            <p className="text-[10px] font-bold text-[#64748B] sm:text-[11px]">
              {tier.items.length} IDs · from {formatCurrency(tierMinimumMonthlyPrice(tier))} / mo
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black sm:px-2.5 sm:py-1 sm:text-[10px] ${palette.chip}`}>
            {tier.badge}
          </span>
          <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      <div className={`relative grid transition-all duration-300 ${expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-2 xl:grid-cols-4">
            {tier.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onRequest(item)}
                disabled={catalogItemStatus(item) !== "available"}
                className={`group relative overflow-hidden rounded-xl border border-slate-200/70 p-2 text-left transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:p-3 ${palette.card}`}
              >
                <div className={`absolute -right-8 -top-8 h-16 w-16 rounded-full ${palette.glow} opacity-0 blur-xl transition group-hover:opacity-80`} />
                <div className="relative flex items-center justify-between gap-2">
                  <Ticket className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${palette.price}`} />
                  <span className={`rounded-full border px-1 py-0.5 text-[7px] font-black uppercase sm:px-1.5 sm:text-[8px] ${statusClass[catalogItemStatus(item)]}`}>
                    {catalogItemStatus(item) === "available" ? "Avail" : catalogItemStatus(item)}
                  </span>
                </div>
                <p className="relative mt-1.5 truncate text-sm font-black text-[#0F172A] sm:mt-2 sm:text-lg">{item.id}</p>
                <div className="relative mt-0.5 flex items-center justify-between gap-1 sm:mt-1">
                  <p className={`truncate text-[10px] font-black sm:text-xs ${palette.price}`}>{formatCurrency(catalogItemMonthlyPrice(item))} / mo</p>
                  <span className={`hidden rounded-full bg-white px-2 py-0.5 text-[10px] font-black shadow-sm sm:inline-flex ${palette.price}`}>
                    Reserve
                  </span>
                </div>
                <p className="relative mt-1 line-clamp-1 text-[8px] font-bold text-[#64748B] sm:mt-2 sm:text-[10px]">
                  {item.reasons.map(reasonLabel).join(" · ")}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-[10px] font-bold text-[#64748B] backdrop-blur">
            <span>Tap an ID to reserve</span>
            <span className={palette.price}>{tier.items.length} available</span>
          </div>
        </div>
      </div>
      {!expanded && (
        <button
          type="button"
          onClick={onToggle}
          className="relative mt-2 flex w-full items-center justify-between rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-xs font-black text-[#0F172A] backdrop-blur transition hover:bg-white"
        >
          <span className="truncate">
            Preview: {tier.items.slice(0, 3).map((item) => item.id).join(" · ")}
          </span>
          <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[9px] ${palette.chip}`}>
            Open
          </span>
        </button>
      )}
    </div>
  );
}

function AstrologyCard({
  name,
  dob,
  preview,
  loading,
  onNameChange,
  onDobChange,
  onPreview,
}: {
  name: string;
  dob: string;
  preview: FancyIdAstrologyPreview | null;
  loading: boolean;
  onNameChange: (value: string) => void;
  onDobChange: (value: string) => void;
  onPreview: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-[linear-gradient(145deg,#ffffff,#f7f1ff)] p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-4">
      <Image
        src="/astro.png"
        alt=""
        width={220}
        height={220}
        className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 object-contain opacity-25 sm:-right-10 sm:-top-10 sm:h-40 sm:w-40"
      />
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 sm:h-11 sm:w-11 sm:rounded-2xl">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-[#0F172A] sm:text-base">Astrology Match</h2>
          <p className="text-[11px] font-semibold text-[#64748B] sm:text-xs">Generate a lucky Fancy ID</p>
        </div>
      </div>
      <div className="relative mt-3 grid gap-2 sm:mt-4">
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Full name"
          className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#C8103E] focus:ring-4 focus:ring-[#C8103E]/10 sm:h-11 sm:rounded-2xl sm:text-sm"
        />
        <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-[#C8103E] focus-within:ring-4 focus-within:ring-[#C8103E]/10 sm:h-11 sm:rounded-2xl">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={dob}
            onChange={(event) => onDobChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[#0F172A] outline-none sm:text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onPreview}
          disabled={loading}
          className="h-10 rounded-xl bg-[#0F172A] text-xs font-black text-white transition hover:bg-[#1E293B] disabled:opacity-60 sm:h-11 sm:rounded-2xl sm:text-sm"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Preview match"}
        </button>
      </div>
      {preview && (
        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 sm:rounded-2xl sm:p-3">
          {preview.status === "available" && preview.matched ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Matched ID</p>
                  <p className="text-xl font-black text-[#0F172A] sm:text-2xl">{preview.matched.id}</p>
                </div>
                <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  {formatCurrency(preview.matched.priceINR)} / mo
                </p>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#64748B]">
                Core {preview.profile.coreNumber}: {preview.profile.meaning}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">{preview.message || "No matching ID is available right now."}</p>
          )}
        </div>
      )}
    </div>
  );
}
