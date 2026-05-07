"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Leg = {
  userId: string;
  fullName?: string;
  monthlyBusiness: number;
};

type Props = {
  earningsMultiplier?: number;
  legDetails?: Leg[];
  kycStatus?: string;
  /** What the trigger looks like. Defaults to a small ghost button. */
  trigger?: React.ReactNode;
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
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const sorted = [...legDetails].sort((a, b) => (b.monthlyBusiness || 0) - (a.monthlyBusiness || 0));
  const legsAt3x = sorted.filter((l) => (l.monthlyBusiness || 0) >= LEG_3X).length;
  const legsAt4x = sorted.filter((l) => (l.monthlyBusiness || 0) >= LEG_4X).length;
  const teamCapped = cappedTeam(sorted);
  const kycOk = kycStatus === "VERIFIED";

  const at4x = earningsMultiplier >= 4;
  const at3x = earningsMultiplier >= 3 && earningsMultiplier < 4;
  const target = at4x ? null : at3x ? 4 : 3;

  const Row = ({ label, have, need, ok }: { label: string; have: string; need: string; ok: boolean }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0 text-amber-500" />
        )}
        <span className="truncate text-sm text-slate-700">{label}</span>
      </div>
      <div className="text-right text-sm whitespace-nowrap">
        <span className={ok ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>{have}</span>
        <span className="text-slate-400"> / {need}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Info className="h-3.5 w-3.5" />
            View progress
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2">
            <span>Multiplier</span>
            <span className="text-2xl font-black text-emerald-600">{earningsMultiplier}x</span>
            {target && (
              <>
                <span className="text-slate-400">→</span>
                <span className="text-xl font-black text-amber-500">{target}x</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {at4x ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ You\'re at the maximum multiplier (4x). Great work!
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              What you need for {target}x
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
                  <Row label="KYC verified" have={kycOk ? "Yes" : "No"} need="Yes" ok={kycOk} />
                </>
              )}
            </div>
          </>
        )}

        {sorted.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your legs (this month)
            </p>
            <div className="space-y-1.5">
              {sorted.slice(0, 6).map((leg) => {
                const business = leg.monthlyBusiness || 0;
                const threshold = target === 4 ? LEG_4X : LEG_3X;
                const ok = business >= threshold;
                return (
                  <div
                    key={leg.userId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                      <span className="truncate text-slate-700">
                        {leg.fullName || leg.userId}{" "}
                        <span className="text-slate-400">({leg.userId})</span>
                      </span>
                    </div>
                    <span className={ok ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                      {fmt(business)}
                    </span>
                  </div>
                );
              })}
              {sorted.length > 6 && (
                <p className="px-3 pt-1 text-xs text-slate-500">+{sorted.length - 6} more legs not shown</p>
              )}
            </div>
          </div>
        )}

        <Link
          href="/team-business"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#C41E3A] hover:text-[#a01831]"
        >
          See full team business breakdown <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </DialogContent>
    </Dialog>
  );
}
