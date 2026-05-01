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

const fmt = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

interface CompoundingProjectionModalProps {
  manualOpen?: boolean;
  onManualClose?: () => void;
  onCompoundingChange?: (enabled: boolean) => void;
}

export function CompoundingProjectionModal({ manualOpen, onManualClose, onCompoundingChange }: CompoundingProjectionModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [packageUSD, setPackageUSD] = useState(0);
  const [compoundingEnabled, setCompoundingEnabled] = useState(false);
  const [roiPlanType, setRoiPlanType] = useState<"old" | "new" | undefined>(undefined);
  const [enabling, setEnabling] = useState(false);

  // Auto-open once on mount for active-package users (first-time pitch)
  useEffect(() => {
    if (manualOpen) return; // don't auto-open if parent is controlling
    getCompoundingStatus().then((res) => {
      if (!res?.error && res?.isPackageActive && (res?.packageUSD ?? 0) > 0) {
        setPackageUSD(res.packageUSD);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType);
        setOpen(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External (manual) open: refetch status + open
  useEffect(() => {
    if (!manualOpen) return;
    getCompoundingStatus().then((res) => {
      if (!res?.error) {
        setPackageUSD(res.packageUSD ?? 0);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType);
        setOpen(true);
      }
    });
  }, [manualOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onManualClose?.();
  };

  const rateFn = roiPlanType === "new" ? getNewTieredROIRate : getTieredROIRate;
  const monthlyRate = rateFn(packageUSD);
  const monthlyEarning = packageUSD * monthlyRate;
  const snapshots = buildProjection(packageUSD, rateFn);

  const handleEnable = async () => {
    if (compoundingEnabled) { setOpen(false); return; }
    setEnabling(true);
    try {
      const res = await toggleCompounding();
      if (res?.error) { toast.error(res.error); }
      else {
        setCompoundingEnabled(true);
        onCompoundingChange?.(true);
        toast.success("Compounding enabled!");
        setOpen(false);
      }
    } catch { toast.error("Failed to enable compounding."); }
    finally { setEnabling(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border border-slate-200/70 bg-white p-6 text-[#0F172A] shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-[#0F172A]">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Compounding vs Simple ROI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Your Package</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black text-[#0F172A]">{fmt(packageUSD)}</p>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {(monthlyRate * 100).toFixed(0)}% / month →{" "}
                <span className="font-bold text-emerald-700">{fmt(monthlyEarning)} / month</span>
              </p>
            </div>
            {compoundingEnabled && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                Compounding ON
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-[#0F172A]">
          <p className="font-black text-emerald-700">How compounding works</p>
          <p className="text-[#475569]">
            Without compounding, your {fmt(monthlyEarning)} monthly ROI goes to your available balance — package stays flat.
          </p>
          <p className="text-[#475569]">
            With compounding, that ROI is automatically added back to your package each month, growing your base and earning more next month.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Earnings Projection</p>
          {snapshots.map((s) => (
            <div key={s.month} className="rounded-2xl border border-slate-200/70 bg-white p-3">
              <p className="mb-2 text-xs font-bold text-[#64748B]">
                After {s.month === 12 ? "1 Year" : s.month === 24 ? "2 Years" : "3 Years"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">Simple ROI</p>
                  <p className="text-base font-black text-[#0F172A]">{fmt(s.simpleEarnings)}</p>
                  <p className="text-[10px] text-[#94A3B8]">Package stays {fmt(packageUSD)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">With Compounding</p>
                  <p className="text-base font-black text-emerald-700">{fmt(s.compoundEarnings)}</p>
                  <p className="text-[10px] text-[#64748B]">Package grows to {fmt(s.compoundPackage)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                <Zap className="h-3 w-3 shrink-0 text-emerald-600" />
                <span className="text-xs font-black text-emerald-700">+{fmt(s.extra)} extra with compounding</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Maybe Later
          </Button>
          {!compoundingEnabled ? (
            <Button
              className="h-11 flex-1 rounded-xl bg-emerald-600 font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] hover:bg-emerald-700"
              onClick={handleEnable}
              disabled={enabling}
            >
              {enabling ? "Enabling..." : "Enable Compounding"}
            </Button>
          ) : (
            <Button
              className="h-11 flex-1 rounded-xl bg-emerald-600 font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] hover:bg-emerald-700"
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
