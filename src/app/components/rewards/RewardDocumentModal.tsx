"use client";

import { Reward } from "@/types";
import { RewardDocumentManager } from "./RewardDocumentManager";
import { X } from "lucide-react";

interface RewardDocumentModalProps {
  reward: Reward;
  onClose: () => void;
  onRewardUpdate: (updatedReward: Reward) => void;
}

export const RewardDocumentModal = ({ reward, onClose, onRewardUpdate }: RewardDocumentModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Reward documents</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[#0F172A]">
              {reward.rewardSnapshot.reward}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-slate-200 bg-white p-2 text-[#64748B] transition hover:bg-slate-50 hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <RewardDocumentManager reward={reward} onRewardUpdate={onRewardUpdate} onClose={onClose} />
      </div>
    </div>
  );
};
