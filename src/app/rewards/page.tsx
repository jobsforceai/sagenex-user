"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getRewards,
  getRewardPrograms, 
  transferReward,
  getTransferRecipients,
  getProfileData,
  getKycStatus,
} from "@/actions/user";
import { Reward, Recipient, KycStatus, RewardProgram } from "@/types";
import {
  CheckCircle,
  Loader2,
  Gift,
  Send,
  Info,
  FileClock,
  FileCheck,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RewardDocumentModal } from "@/app/components/rewards/RewardDocumentModal";

type ClaimStatus =
  | "NONE"
  | "PENDING"
  | "COMPLETED"
  | "DOCUMENTS_REQUIRED"
  | "DOCUMENTS_PENDING";

const RewardCard = ({
  reward,
  onTransfer,
  onUploadDocuments,
  recipients,
  kycStatus,
  isProgramLocked,
}: {
  reward: Reward;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
  recipients: Recipient[];
  kycStatus: KycStatus | null;
  isProgramLocked: boolean;
}) => {
  const wasReceived = !!reward.transferredFrom;

  const total = reward.rewardSnapshot?.valueUSD ?? 0;
  const current = reward.currentValueUSD ?? 0;
  const progress = wasReceived
    ? 100
    : Math.min(total > 0 ? (current / total) * 100 : 0, 100);

  const sender = reward.transferredFrom
    ? recipients.find((r) => r.userId === reward.transferredFrom)
    : null;

  const showTransferredStatus = reward.isTransferred;

  const renderStatus = () => {
    if (isProgramLocked && reward.claimStatus === "NONE" && !reward.isTransferred) {
        return (
          <div className="flex items-center justify-center gap-2 text-gray-400 font-semibold p-3 rounded-lg bg-gray-800/50">
            <Lock className="w-5 h-5" />
            Program Ended
          </div>
        );
      }

    switch (reward.claimStatus as ClaimStatus) {
      case "COMPLETED":
        return (
          <div className="flex items-center justify-center gap-2 text-green-400 font-semibold p-3 rounded-lg bg-green-900/50">
            <CheckCircle className="w-5 h-5" />
            Claimed Successfully
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold p-3 rounded-lg bg-yellow-900/50">
            <Loader2 className="w-5 h-5 animate-spin" />
            Pending Admin Approval
          </div>
        );
      case "DOCUMENTS_REQUIRED":
        return (
          <Button
            onClick={() => onUploadDocuments(reward)}
            className="w-full font-semibold bg-blue-600 hover:bg-blue-500"
            disabled={isProgramLocked}
          >
            <FileClock className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        );
      case "DOCUMENTS_PENDING":
        return (
          <div className="flex items-center justify-center gap-2 text-purple-400 font-semibold p-3 rounded-lg bg-purple-900/50">
            <FileCheck className="w-5 h-5" />
            Documents Pending Review
          </div>
        );
      case "NONE":
        if (showTransferredStatus) {
          return (
            <div className="flex items-center justify-center gap-2 text-gray-400 font-semibold p-3 rounded-lg bg-gray-800/50">
              <Send className="w-5 h-5" />
              Transferred
            </div>
          );
        }
        if (reward.isEligible) {
          return (
            <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold p-3 rounded-lg bg-yellow-900/50">
              <Loader2 className="w-5 h-5 animate-spin" />
              Pending Admin Approval
            </div>
          );
        }
        return (
          <div className="text-center text-sm text-gray-400 p-3 rounded-lg bg-gray-800/50">
            Keep going to unlock this reward!
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">
            {reward.rewardSnapshot.reward}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              reward.type === "self"
                ? "bg-blue-500/20 text-blue-300"
                : "bg-purple-500/20 text-purple-300"
            }`}
          >
            {reward.type} Business
          </span>
        </div>
        <p className="text-gray-400 flex items-center gap-2 pt-1">
          <Gift className="w-4 h-4 text-emerald-400" />
          Target: ${reward.rewardSnapshot.valueUSD.toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="font-semibold text-white">
              ${current.toLocaleString()} / ${total.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-emerald-500 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {wasReceived && (
          <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-900/50 p-2 rounded-md">
            <Info className="w-4 h-4" />
            <span>Received from {sender ? sender.fullName : "another user"}.</span>
          </div>
        )}

        <div className="mt-auto pt-4">{renderStatus()}</div>
      </CardContent>
    </Card>
  );
};

const TransferModal = ({
  reward,
  recipients,
  onClose,
  onConfirm,
}: {
  reward: Reward;
  recipients: Recipient[];
  onClose: () => void;
  onConfirm: (rewardId: string, recipientId: string) => Promise<void>;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const filteredRecipients = recipients.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedRecipient) return;
    setIsTransferring(true);
    await onConfirm(reward._id, selectedRecipient.userId);
    setIsTransferring(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-2 text-white">Transfer Reward</h3>
        <p className="text-gray-400 mb-6">
          You are about to transfer the reward:{" "}
          <span className="font-semibold text-emerald-300">{reward.rewardSnapshot.reward}</span>. This
          action is irreversible.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="recipient-search" className="block text-sm font-medium text-gray-300 mb-1">
              Search Recipient by Name or ID
            </label>
            <input
              id="recipient-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedRecipient(null);
              }}
              placeholder="Start typing to search..."
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-md">
            {filteredRecipients.length > 0 ? (
              filteredRecipients.map((r) => (
                <button
                  type="button"
                  key={r.userId}
                  onClick={() => {
                    setSelectedRecipient(r);
                    setSearchQuery(`${r.fullName} (${r.userId})`);
                  }}
                  className={`w-full text-left p-3 cursor-pointer hover:bg-gray-700 ${
                    selectedRecipient?.userId === r.userId ? "bg-emerald-800" : ""
                  }`}
                >
                  <p className="font-semibold">{r.fullName}</p>
                  <p className="text-sm text-gray-400">{r.userId}</p>
                </button>
              ))
            ) : (
              <p className="p-3 text-gray-500">No matching users found.</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isTransferring || !selectedRecipient}>
            {isTransferring ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RewardsPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rewardProgress, setRewardProgress] = useState<Record<string, Reward[]>>({});
  const [programConfigs, setProgramConfigs] = useState<Record<string, RewardProgram>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [transferModalReward, setTransferModalReward] = useState<Reward | null>(null);
  const [uploadModalReward, setUploadModalReward] = useState<Reward | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);

  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeRewardType, setActiveRewardType] = useState<"self" | "team">("self");

  const fetchInitialData = async () => {
    setDataLoading(true);
    try {
      const [
        rewardsData,
        programsData,
        recipientsData,
        profileData,
        kycData,
      ] = await Promise.all([
        getRewards(),
        getRewardPrograms(),
        getTransferRecipients(),
        getProfileData(),
        getKycStatus(),
      ]);

      if (kycData && 'error' in kycData) setError(kycData.error as string);
      else setKycStatus(kycData as KycStatus);

      let configs: Record<string, RewardProgram> = {};
      if (programsData && 'error' in programsData) {
        setError(programsData.error as string);
      } else {
        console.log("Fetched program configurations:", programsData);
        configs = (programsData as RewardProgram[]).reduce((acc, program) => {
          acc[program.programId] = program;
          return acc;
        }, {} as Record<string, RewardProgram>);
        setProgramConfigs(configs);
      }

      if (rewardsData && 'error' in rewardsData) {
        setError(rewardsData.error as string);
      } else {
        const allRewards = (rewardsData || []) as Reward[];
        
        const activeProgramIds = Object.keys(configs);
        const visibleRewards = allRewards.filter(reward => activeProgramIds.includes(reward.programId));

        const groupedByProgram = visibleRewards.reduce((acc, reward) => {
          const { programId } = reward;
          if (!acc[programId]) acc[programId] = [];
          acc[programId].push(reward);
          return acc;
        }, {} as Record<string, Reward[]>);
        
        setRewardProgress(groupedByProgram);
        if (Object.keys(groupedByProgram).length > 0) {
          setActiveProgramId(Object.keys(groupedByProgram)[0]);
        }
      }

      if (recipientsData && 'error' in recipientsData) {
        console.error("Could not load recipients:", recipientsData.error);
      } else {
        setRecipients(recipientsData as Recipient[]);
      }

      if (profileData && 'error' in profileData) {
        console.error("Could not load profile:", profileData.error);
      }
    } catch (e) {
      setError("An unexpected error occurred while fetching data.");
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, authLoading, router]);

  const handleTransferReward = async (rewardId: string, recipientId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await transferReward(rewardId, recipientId);
      if (result && 'error' in result) {
        setError(result.error as string);
      } else {
        setMessage((result as { message: string }).message ?? "Reward transferred.");
        setTransferModalReward(null);
        fetchInitialData();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred during transfer."
      );
    }
  };

  const handleRewardUpdate = (updatedReward: Reward) => {
    setUploadModalReward(null);
    setRewardProgress(prevProgress => {
        const newProgress = { ...prevProgress };
        const program = newProgress[updatedReward.programId];
        if (program) {
            const index = program.findIndex(r => r._id === updatedReward._id);
            if (index !== -1) {
                program[index] = updatedReward;
            }
        }
        return newProgress;
    });
  };

  const handleOpenUploadModal = (reward: Reward) => {
    setUploadModalReward(reward);
  };

  const handleCloseUploadModal = () => {
    setUploadModalReward(null);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 sm:p-6 pt-32">
        <header className="text-center my-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 py-4 bg-linear-to-r from-emerald-400 to-green-600  bg-clip-text text-transparent">
            Rewards & Recognition
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Track your progress towards exclusive rewards based on your personal and
            team performance.
          </p>
        </header>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        {message && <p className="text-green-400 text-center mb-4">{message}</p>}

        <div className="space-y-12">
          {Object.keys(rewardProgress).length > 0 ? (
            <div>
              <div className="flex border-b border-gray-700 mb-8">
                {Object.keys(programConfigs).map(programId => (
                  <button
                    key={programId}
                    onClick={() => setActiveProgramId(programId)}
                    className={`px-4 py-2 text-lg font-semibold transition-colors duration-200 flex items-center gap-2 ${
                      activeProgramId === programId
                        ? 'border-b-2 border-emerald-500 text-emerald-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {programConfigs[programId].name}
                    {programConfigs[programId].status === 'locked' && (
                        <span className="text-xs font-medium bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">Ended</span>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeProgramId && rewardProgress[activeProgramId] && (
                  <motion.section
                    key={activeProgramId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {(() => {
                      const rewards = rewardProgress[activeProgramId];
                      const selfRewards = rewards.filter((r) => r.type === "self");
                      const teamRewards = rewards.filter((r) => r.type === "team");
                      const isLocked = programConfigs[activeProgramId]?.status === "locked";

                      return (
                        <>
                          <div className="flex border-b border-gray-800 mb-6">
                            {selfRewards.length > 0 && (
                              <button
                                onClick={() => setActiveRewardType("self")}
                                className={`px-4 py-2 font-semibold transition-colors duration-200 ${
                                  activeRewardType === "self"
                                    ? "border-b-2 border-blue-400 text-blue-300"
                                    : "text-gray-500 hover:text-white"
                                }`}
                              >
                                Self Business
                              </button>
                            )}
                            {teamRewards.length > 0 && (
                              <button
                                onClick={() => setActiveRewardType("team")}
                                className={`px-4 py-2 font-semibold transition-colors duration-200 ${
                                  activeRewardType === "team"
                                    ? "border-b-2 border-purple-400 text-purple-300"
                                    : "text-gray-500 hover:text-white"
                                }`}
                              >
                                Team Business
                              </button>
                            )}
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeRewardType}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              {activeRewardType === "self" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {selfRewards.map((reward) => (
                                    <RewardCard
                                      key={reward._id}
                                      reward={reward}
                                      onTransfer={setTransferModalReward}
                                      onUploadDocuments={handleOpenUploadModal}
                                      recipients={recipients}
                                      kycStatus={kycStatus}
                                      isProgramLocked={isLocked}
                                    />
                                  ))}
                                </div>
                              )}
                              {activeRewardType === "team" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {teamRewards.map((reward) => (
                                    <RewardCard
                                      key={reward._id}
                                      reward={reward}
                                      onTransfer={setTransferModalReward}
                                      onUploadDocuments={handleOpenUploadModal}
                                      recipients={recipients}
                                      kycStatus={kycStatus}
                                      isProgramLocked={isLocked}
                                    />
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg">
              There are no active reward programs at this time.
            </p>
          )}
        </div>
      </main>

      {transferModalReward && (
        <TransferModal
          reward={transferModalReward}
          recipients={recipients}
          onClose={() => setTransferModalReward(null)}
          onConfirm={handleTransferReward}
        />
      )}

      {uploadModalReward && (
        <RewardDocumentModal
          reward={uploadModalReward}
          onClose={handleCloseUploadModal}
          onRewardUpdate={handleRewardUpdate}
        />
      )}
    </div>
  );
};

export default RewardsPage;
