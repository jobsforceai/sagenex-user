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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Upload Documents for: {reward.offerSnapshot.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
        </div>
        <RewardDocumentManager reward={reward} onRewardUpdate={onRewardUpdate} onClose={onClose} />
      </div>
    </div>
  );
};