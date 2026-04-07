"use client";

import { type RoiPlanType, getNewTieredROIRate, getTieredROIRate } from "@/lib/roi";

interface RoiPlanPickerProps {
  value: RoiPlanType | null;
  onChange: (plan: RoiPlanType) => void;
  packageUSD?: number;
  /** Backend says whether to show the picker at all. */
  show: boolean;
  /** Backend says all deposits are forced to 'new' (post April 10). */
  forceNew: boolean;
}

/**
 * ROI Plan selector driven by backend config.
 * When forceNew=true, shows an info banner (auto "new").
 * When show=false, renders nothing.
 */
const RoiPlanPicker = ({ value, onChange, packageUSD, show, forceNew }: RoiPlanPickerProps) => {
  if (!show) return null;

  if (forceNew) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        <p className="font-semibold">New ROI Plan Active</p>
        <p className="text-xs text-emerald-300/80 mt-1">
          All new investments use the updated ROI structure with higher referral benefits.
        </p>
      </div>
    );
  }

  const oldRate = packageUSD ? (getTieredROIRate(packageUSD) * 100).toFixed(0) : null;
  const newRate = packageUSD ? (getNewTieredROIRate(packageUSD) * 100).toFixed(0) : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Choose ROI Plan
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Old ROI */}
        <button
          type="button"
          onClick={() => onChange("old")}
          className={`relative flex flex-col items-start p-4 rounded-lg border-2 transition-all duration-200 text-left
            ${value === "old"
              ? "bg-gray-700 border-gray-500"
              : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600"
            }`}
        >
          <span className="font-semibold text-white text-sm">Old ROI Plan</span>
          <span className="text-xs text-gray-400 mt-1">
            Existing ROI &amp; referral structure
          </span>
          {oldRate && (
            <span className="text-xs text-gray-500 mt-1">{oldRate}% monthly ROI at your tier</span>
          )}
        </button>

        {/* New ROI (recommended) */}
        <button
          type="button"
          onClick={() => onChange("new")}
          className={`relative flex flex-col items-start p-4 rounded-lg border-2 transition-all duration-200 text-left
            ${value === "new"
              ? "bg-emerald-900/40 border-emerald-500"
              : "bg-gray-800/50 border-gray-700 hover:bg-emerald-900/20 hover:border-emerald-600"
            }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">New ROI Plan</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded">
              Recommended
            </span>
          </div>
          <span className="text-xs text-gray-400 mt-1">
            Higher referral income up to 15%
          </span>
          {newRate && (
            <span className="text-xs text-emerald-400/70 mt-1">{newRate}% monthly ROI at your tier</span>
          )}
        </button>
      </div>

      <p className="text-xs text-amber-400/70 mt-2">
        Choosing a plan applies new rates to your entire package going forward.
      </p>
    </div>
  );
};

export default RoiPlanPicker;
