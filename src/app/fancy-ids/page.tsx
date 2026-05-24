"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Crown,
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

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const [catalogRes, requestsRes, profileRes, walletRes] = await Promise.all([
        getFancyIdCatalog(14),
        getMyFancyIdRequests(),
        getProfileData(),
        getWalletData(),
      ]);

      if (catalogRes?.error) toast.error(catalogRes.error);
      else setCatalog(catalogRes as FancyIdCatalogResponse);

      if (requestsRes?.error) toast.error(requestsRes.error);
      else setRequests((requestsRes.rows ?? []) as FancyIdRequestRow[]);

      if (!profileRes?.error) setProfile(profileRes);
      if (!walletRes?.error) {
        const walletPayload = walletRes as {
          availableBalance?: number;
          balance?: number;
          summary?: { availableBalance?: number; balance?: number };
          wallet?: { availableBalance?: number; balance?: number };
        };
        setBalance(Number(
          walletPayload.summary?.availableBalance ??
          walletPayload.summary?.balance ??
          walletPayload.wallet?.availableBalance ??
          walletPayload.wallet?.balance ??
          walletPayload.availableBalance ??
          walletPayload.balance ??
          0
        ));
      }
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

  const featured = useMemo(() => {
    const items = catalog?.tiers.flatMap((tier) => tier.items.map((item) => ({ ...item, tier }))) ?? [];
    return items.filter((item) => catalogItemStatus(item) === "available").slice(0, 4);
  }, [catalog]);

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
        <section className="relative overflow-hidden rounded-2xl border border-[#7A001F]/20 bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_56%,#33000D_100%)] p-3 text-white shadow-[0_18px_45px_rgba(122,0,31,0.18)] sm:rounded-3xl sm:p-8">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_12px_12px,rgba(255,255,255,0.22)_1.5px,transparent_0)] [background-size:28px_28px]" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="relative grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-50 sm:gap-2 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
                <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                SAGENEX Fancy IDs
              </p>
              <h1 className="mt-2 max-w-2xl text-xl font-black leading-[1.03] tracking-tight sm:mt-4 sm:text-6xl">
                Subscribe to an ID people remember.
              </h1>
              <p className="mt-1.5 max-w-xl text-[11px] font-semibold leading-4 text-white/80 sm:mt-3 sm:text-base sm:leading-6">
                Request premium number patterns, custom names, or astrology-matched IDs. First month is debited now, then admin approval assigns it to you.
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-5 sm:max-w-xl sm:gap-2">
                {[
                  ["Wallet", formatCurrency(balance)],
                  ["Current", profile?.fancyId ? profile.fancyId.toUpperCase() : profile?.userId || "--"],
                  ["Billing", "Monthly"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/18 bg-white/10 p-1.5 backdrop-blur sm:rounded-2xl sm:p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/55 sm:text-[9px] sm:tracking-[0.12em]">{label}</p>
                    <p className="mt-0.5 truncate text-[11px] font-black text-white sm:mt-1 sm:text-lg">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden rounded-2xl border border-white/18 bg-white/12 p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur sm:block sm:rounded-3xl sm:p-4">
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

        {featured.length > 0 && (
          <section className="grid grid-cols-3 gap-1.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {featured.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCatalogRequest(item)}
                className="group rounded-2xl border border-slate-200/70 bg-white p-2 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)] sm:rounded-3xl sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#C8103E] sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Gem className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  </div>
                  <span className={`rounded-full border px-1 py-0.5 text-[7px] font-black uppercase sm:px-2 sm:py-1 sm:text-[9px] ${statusClass[catalogItemStatus(item)]}`}>
                    Avail
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-black tracking-tight text-[#0F172A] sm:mt-3 sm:text-3xl">{item.id}</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-[#64748B] sm:mt-1 sm:text-xs">{item.tier.label}</p>
                <p className="mt-1 text-[10px] font-black text-[#C8103E] sm:mt-3 sm:text-sm">{formatCurrency(catalogItemMonthlyPrice(item))} / mo</p>
              </button>
            ))}
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
              {catalog?.tiers.map((tier) => (
                <FancyTier key={tier.key} tier={tier} onRequest={handleCatalogRequest} />
              ))}
              {!catalog?.tiers.length && (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-[#64748B]">
                  No catalog items are available right now.
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

function FancyTier({ tier, onRequest }: { tier: FancyIdCatalogTier; onRequest: (item: FancyIdCatalogItem) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-[#0F172A] sm:text-sm">{tier.label}</p>
          <p className="text-[11px] font-bold text-[#64748B]">Starting at {formatCurrency(tierMinimumMonthlyPrice(tier))} / mo</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 sm:px-2.5 sm:py-1 sm:text-[10px]">
          {tier.badge}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-2 xl:grid-cols-4">
        {tier.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onRequest(item)}
            disabled={catalogItemStatus(item) !== "available"}
            className="rounded-xl border border-slate-200/70 bg-white p-2 text-left transition hover:border-[#C8103E]/30 hover:bg-[#FFF1F4]/40 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Ticket className="h-3.5 w-3.5 text-[#C8103E] sm:h-4 sm:w-4" />
              <span className={`rounded-full border px-1 py-0.5 text-[7px] font-black uppercase sm:px-1.5 sm:text-[8px] ${statusClass[catalogItemStatus(item)]}`}>
                {catalogItemStatus(item) === "available" ? "Avail" : catalogItemStatus(item)}
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm font-black text-[#0F172A] sm:mt-2 sm:text-lg">{item.id}</p>
            <p className="mt-0.5 text-[10px] font-black text-[#C8103E] sm:mt-1 sm:text-xs">{formatCurrency(catalogItemMonthlyPrice(item))} / mo</p>
            <p className="mt-1 line-clamp-1 text-[8px] font-bold text-[#64748B] sm:mt-2 sm:text-[10px]">
              {item.reasons.map(reasonLabel).join(" · ")}
            </p>
          </button>
        ))}
      </div>
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
    <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 sm:h-11 sm:w-11 sm:rounded-2xl">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-[#0F172A] sm:text-base">Astrology Match</h2>
          <p className="text-[11px] font-semibold text-[#64748B] sm:text-xs">Generate a lucky Fancy ID</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:mt-4">
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
