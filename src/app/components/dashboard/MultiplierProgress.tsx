"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

type Leg = {
  userId: string;
  fullName?: string;
  monthlyBusiness: number;
};

type Props = {
  earningsMultiplier?: number;
  legDetails?: Leg[];
  kycStatus?: string;
};

const LEG_3X = 150000;
const LEG_4X = 200000;
const TEAM_3X = 500000;
const TEAM_4X = 1000000;
const NEEDED_3X = 3;
const NEEDED_4X = 4;

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const cappedTeam = (legs: Leg[]) => {
  const raw = legs.reduce((s, l) => s + (l.monthlyBusiness || 0), 0);
  const cap = raw * 0.5;
  return legs.reduce((s, l) => s + Math.min(l.monthlyBusiness || 0, cap), 0);
};

export default function MultiplierProgress({
  earningsMultiplier = 2.5,
  legDetails = [],
  kycStatus,
}: Props) {
  const sorted = [...legDetails].sort((a, b) => (b.monthlyBusiness || 0) - (a.monthlyBusiness || 0));
  const legsAt3x = sorted.filter((l) => (l.monthlyBusiness || 0) >= LEG_3X).length;
  const legsAt4x = sorted.filter((l) => (l.monthlyBusiness || 0) >= LEG_4X).length;
  const teamCapped = cappedTeam(sorted);
  const kycOk = kycStatus === "VERIFIED";

  const at4x = earningsMultiplier >= 4;
  const at3x = earningsMultiplier >= 3 && earningsMultiplier < 4;

  // What is the user trying to reach next?
  const target = at4x ? null : at3x ? 4 : 3;

  const Row = ({
    label,
    have,
    need,
    ok,
    suffix,
  }: {
    label: string;
    have: string;
    need: string;
    ok: boolean;
    suffix?: string;
  }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-amber-400" />
        )}
        <span className="truncate text-sm text-white/85">{label}</span>
      </div>
      <div className="text-right text-sm">
        <span className={ok ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
          {have}
        </span>
        <span className="text-white/50"> / {need}{suffix || ""}</span>
      </div>
    </div>
  );

  return (
    <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 text-white shadow-lg">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/55">Current multiplier</p>
          <p className="mt-1 text-4xl font-black leading-none">{earningsMultiplier}x</p>
        </div>
        {target && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/55">Next goal</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{target}x</p>
          </div>
        )}
      </div>

      {at4x ? (
        <div className="rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300">
          ✓ You\'re at the maximum multiplier (4x). Keep earning!
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs uppercase tracking-wider text-white/55">
            What you need to reach {target}x
          </p>
          <div className="space-y-2">
            {target === 3 && (
              <>
                <Row
                  label={`Legs with ≥ ${fmt(LEG_3X)} business (last 30d)`}
                  have={`${legsAt3x}`}
                  need={`${NEEDED_3X}`}
                  ok={legsAt3x >= NEEDED_3X}
                />
                <Row
                  label="Total team business (50% cap per leg)"
                  have={fmt(teamCapped)}
                  need={fmt(TEAM_3X)}
                  ok={teamCapped >= TEAM_3X}
                />
              </>
            )}
            {target === 4 && (
              <>
                <Row
                  label={`Legs with ≥ ${fmt(LEG_4X)} business (last 30d)`}
                  have={`${legsAt4x}`}
                  need={`${NEEDED_4X}`}
                  ok={legsAt4x >= NEEDED_4X}
                />
                <Row
                  label="Total team business (50% cap per leg)"
                  have={fmt(teamCapped)}
                  need={fmt(TEAM_4X)}
                  ok={teamCapped >= TEAM_4X}
                />
                <Row
                  label="KYC verified"
                  have={kycOk ? "Yes" : "No"}
                  need="Yes"
                  ok={kycOk}
                />
              </>
            )}
          </div>
        </>
      )}

      {sorted.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wider text-white/55">
            Your legs (this month)
          </p>
          <div className="space-y-1.5">
            {sorted.slice(0, 5).map((leg) => {
              const business = leg.monthlyBusiness || 0;
              const threshold = target === 4 ? LEG_4X : LEG_3X;
              const ok = business >= threshold;
              return (
                <div
                  key={leg.userId}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    {ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-amber-400" />
                    )}
                    <span className="truncate text-white/85">
                      {leg.fullName || leg.userId}{" "}
                      <span className="text-white/40">({leg.userId})</span>
                    </span>
                  </div>
                  <span
                    className={
                      ok ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"
                    }
                  >
                    {fmt(business)}
                  </span>
                </div>
              );
            })}
            {sorted.length > 5 && (
              <p className="px-3 pt-1 text-xs text-white/50">
                +{sorted.length - 5} more legs not shown
              </p>
            )}
          </div>
        </div>
      )}

      <Link
        href="/team-business"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
      >
        See full team business breakdown <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
