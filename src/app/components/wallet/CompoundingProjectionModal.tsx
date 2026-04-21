"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap } from "lucide-react";
import { getCompoundingStatus, toggleCompounding } from "@/actions/user";
import { getNewTieredROIRate, getTieredROIRate } from "@/lib/roi";
import { toast } from "sonner";

interface Snapshot {
  month: number;
  simpleEarnings: number;
  compoundEarnings: number;
  compoundPackage: number;
  extra: number;
}

const SNAPSHOT_MONTHS = [12, 24, 36];

function buildProjection(packageUSD: number, monthlyRateFn: (pkg: number) => number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let compoundPkg = packageUSD;
  let totalSimple = 0;
  let totalCompound = 0;
  const maxMonths = Math.max(...SNAPSHOT_MONTHS);

  for (let m = 1; m <= maxMonths; m++) {
    const simpleEarning = packageUSD * monthlyRateFn(packageUSD);
    const compoundEarning = compoundPkg * monthlyRateFn(compoundPkg);
    totalSimple += simpleEarning;
    totalCompound += compoundEarning;
    compoundPkg += compoundEarning;

    if (SNAPSHOT_MONTHS.includes(m)) {
      snapshots.push({
        month: m,
        simpleEarnings: totalSimple,
        compoundEarnings: totalCompound,
        compoundPackage: compoundPkg,
        extra: totalCompound - totalSimple,
      });
    }
  }
  return snapshots;
}

const fmt = (v: number) =>
  `₹${Math.round(v).toLocaleString("en-IN")}`;

export function CompoundingProjectionModal() {
  const [open, setOpen] = useState(false);
  const [packageUSD, setPackageUSD] = useState(0);
  const [compoundingEnabled, setCompoundingEnabled] = useState(false);
  const [roiPlanType, setRoiPlanType] = useState<"old" | "new" | undefined>(undefined);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    getCompoundingStatus().then((res) => {
      if (!res?.error && res?.isPackageActive && (res?.packageUSD ?? 0) > 0) {
        setPackageUSD(res.packageUSD);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType);
        setOpen(true);
      }
    });
  }, []);

  const rateFn = roiPlanType === "new" ? getNewTieredROIRate : getTieredROIRate;
  const monthlyRate = rateFn(packageUSD);
  const monthlyEarning = packageUSD * monthlyRate;
  const snapshots = buildProjection(packageUSD, rateFn);

  const handleEnable = async () => {
    if (compoundingEnabled) { setOpen(false); return; }
    setEnabling(true);
    try {
      const res = await toggleCompounding();
      if (res?.error) {
        toast.error(res.error);
      } else {
        setCompoundingEnabled(true);
        toast.success("Compounding enabled!");
        setOpen(false);
      }
    } catch {
      toast.error("Failed to enable compounding.");
    } finally {
      setEnabling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-950 border border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Compounding vs Simple ROI
          </DialogTitle>
        </DialogHeader>

        {/* Current ROI snapshot */}
        <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4 space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Your Package</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{fmt(packageUSD)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(monthlyRate * 100).toFixed(0)}% / month → <span className="text-emerald-400 font-semibold">{fmt(monthlyEarning)} / month</span>
              </p>
            </div>
            {compoundingEnabled && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                Compounding ON
              </span>
            )}
          </div>
        </div>

        {/* How compounding works */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-gray-300 space-y-1">
          <p className="font-semibold text-emerald-300">How compounding works</p>
          <p>
            Without compounding, your {fmt(monthlyEarning)} monthly ROI goes to your available balance — package stays flat.
          </p>
          <p>
            With compounding, that ROI is automatically added back to your package each month, growing your base and earning more next month.
          </p>
        </div>

        {/* Projection snapshots */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Earnings Projection</p>
          {snapshots.map((s) => (
            <div key={s.month} className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-xs text-gray-400 mb-2 font-medium">After {s.month === 12 ? '1 Year' : s.month === 24 ? '2 Years' : '3 Years'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Simple ROI</p>
                  <p className="text-base font-semibold text-white">{fmt(s.simpleEarnings)}</p>
                  <p className="text-[10px] text-gray-500">Package stays {fmt(packageUSD)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wide">With Compounding</p>
                  <p className="text-base font-bold text-emerald-400">{fmt(s.compoundEarnings)}</p>
                  <p className="text-[10px] text-gray-400">Package grows to {fmt(s.compoundPackage)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
                <Zap className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300 font-semibold">
                  +{fmt(s.extra)} extra with compounding
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            Maybe Later
          </Button>
          {!compoundingEnabled ? (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={handleEnable}
              disabled={enabling}
            >
              {enabling ? "Enabling..." : "Enable Compounding"}
            </Button>
          ) : (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={() => setOpen(false)}
            >
              Got it
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
