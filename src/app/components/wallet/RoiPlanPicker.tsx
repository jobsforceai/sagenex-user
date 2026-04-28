"use client";

import { type RoiPlanType, getNewTieredROIRate, getTieredROIRate } from "@/lib/roi";

interface RoiPlanPickerProps {
  value: RoiPlanType | null;
  onChange: (plan: RoiPlanType) => void;
  packageUSD?: number;
  show: boolean;
  forceNew: boolean;
}

const RoiPlanPicker = ({ value, onChange, packageUSD, show, forceNew }: RoiPlanPickerProps) => {
  if (!show) return null;

  if (forceNew) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <p className="font-black text-emerald-700">New ROI Plan Active</p>
        <p className="mt-1 text-xs font-semibold text-emerald-700/80">
          All new investments use the updated ROI structure with higher referral benefits.
        </p>
      </div>
    );
  }

  const oldRate = packageUSD ? (getTieredROIRate(packageUSD) * 100).toFixed(0) : null;
  const newRate = packageUSD ? (getNewTieredROIRate(packageUSD) * 100).toFixed(0) : null;

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#0F172A]">Choose ROI Plan</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("old")}
          className={`relative flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
            value === "old"
              ? "border-slate-400 bg-slate-50"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span className="text-sm font-black text-[#0F172A]">Old ROI Plan</span>
          <span className="mt-1 text-xs text-[#64748B]">Existing ROI &amp; referral structure</span>
          {oldRate && (
            <span className="mt-1 text-xs font-semibold text-[#94A3B8]">{oldRate}% monthly ROI at your tier</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange("new")}
          className={`relative flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
            value === "new"
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#0F172A]">New ROI Plan</span>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              Recommended
            </span>
          </div>
          <span className="mt-1 text-xs text-[#64748B]">Higher referral income up to 15%</span>
          {newRate && (
            <span className="mt-1 text-xs font-semibold text-emerald-700">{newRate}% monthly ROI at your tier</span>
          )}
        </button>
      </div>

      <p className="mt-2 text-xs font-semibold text-amber-700">
        Choosing a plan applies new rates to your entire package going forward.
      </p>
    </div>
  );
};

export default RoiPlanPicker;
