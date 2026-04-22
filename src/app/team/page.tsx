"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import TreeClient from "./TreeClient";
import AppShell from "@/app/components/AppShell";
import PlacementQueue from "@/app/components/dashboard/PlacementQueue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserNode, ParentNode, QueuedUser } from "@/types";
import { getBonusRulesConfig, getTeamTree, getPlacementQueue, getDashboardData } from "@/actions/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

interface TreeApiResponse {
  tree: UserNode;
  parent: ParentNode | null;
}

type BonusRulesConfig = {
  rulesCutoff?: {
    iso?: string;
    timezone?: string;
    description?: string;
  };
  directBonus?: {
    firstDepositOnly?: boolean;
    percentageLabel?: string;
    recipient?: string;
    notes?: string;
  };
  unilevelBonus?: {
    appliesOn?: string;
    chainStart?: string;
    levels?: { level: number; percentageLabel?: string }[];
    notes?: string;
  };
  unilevelUnlockRules?: {
    level: number;
    description?: string;
    activeLegDepth?: number;
    activeLegsRequired?: number;
    activeTeamRequired?: number;
    requiresTest?: boolean;
  }[];
  reinvestmentBonus?: {
    appliesOn?: string;
    levels?: {
      cycle: string;
      depositNumber: number;
      totalPercentageLabel?: string;
      splits?: { level: number; percentageLabel?: string }[];
    }[];
    notes?: string;
  };
};

// Frontend displays unilevel levels as +1 to match user-facing terminology.
// Backend rules start at level 1 (internal), but UI should start at level 2.
const DISPLAY_LEVEL_OFFSET = 1;

// UI-only baseline rule for "Level 1" in the frontend (not provided by backend).
const DEFAULT_LEVEL_ONE_RULE = {
  level: 1,
  description: "Have 1 active member at Level 1.",
  requiresTest: false,
  activeLegDepth: 1,
  activeLegsRequired: 1,
  activeTeamRequired: 0,
};

const TeamPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [treeData, setTreeData] = useState<TreeApiResponse | null>(null);
  const [queue, setQueue] = useState<QueuedUser[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRulesConfig | null>(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [profileData, setProfileData] = useState<{ fullName?: string; profilePicture?: string; } | null>(null);
  const [rankData, setRankData] = useState<{ name?: string } | null>(null);
  const [walletData, setWalletData] = useState<{ availableBalance?: number } | null>(null);

  const fetchTeamData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [treeResult, queueResult, bonusRulesResult, dashboardResult] = await Promise.all([
        getTeamTree(),
        getPlacementQueue(),
        getBonusRulesConfig(),
        getDashboardData(),
      ]);

      if (treeResult.error) {
        setError(treeResult.error);
      } else {
        setTreeData(treeResult);
      }

      if (queueResult.error) {
        // Handle queue error separately if needed, for now just log it
        console.error("Could not fetch placement queue:", queueResult.error);
      } else {
        setQueue(queueResult);
      }

      if (bonusRulesResult?.error) {
        console.error("Could not fetch bonus rules:", bonusRulesResult.error);
      } else {
        setBonusRules(bonusRulesResult);
      }
      
      // Extract profile and rank from dashboard
      if (dashboardResult && !dashboardResult.error) {
        if (dashboardResult.profile) {
          setProfileData(dashboardResult.profile);
        }
        if (dashboardResult.rank || dashboardResult.performanceRank) {
          setRankData(dashboardResult.rank || dashboardResult.performanceRank);
        }
        if (dashboardResult.wallet) {
          setWalletData(dashboardResult.wallet);
        }
      }

    } catch {
      setError("An error occurred while fetching team data");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchTeamData();
    }
  }, [isAuthenticated, authLoading, router, fetchTeamData]);

  if (authLoading || dataLoading) {
    return <div className="bg-[#f8f9fa] text-[#0a0a0a] min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-[#f8f9fa] text-[#0a0a0a] min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <AppShell
      balance={walletData?.availableBalance}
      userName={profileData?.fullName}
      userRank={rankData?.name}
      avatarUrl={profileData?.profilePicture}
    >
      <div className="dashboard-light-scope p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#0a0a0a]">My Team</h1>
            <p className="text-sm text-zinc-600">View team structure and bonus rules.</p>
          </div>
          <Button
            variant="outline"
            className="border-[#C41E3A]/40 text-[#C41E3A] hover:bg-[#C41E3A]/10"
            onClick={() => setBonusModalOpen(true)}
          >
            Bonus Rules
          </Button>
        </div>
        <PlacementQueue queue={queue} onUserPlaced={fetchTeamData} />
        <Card>
          <CardHeader>
            <CardTitle>My Team</CardTitle>
          </CardHeader>
          <CardContent>
            {treeData && treeData.tree ? (
              <TreeClient tree={treeData.tree} />
            ) : (
              <p>No team members found.</p>
            )}
          </CardContent>
        </Card>

        {bonusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)] max-h-[85vh] overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Bonus Rules</h2>
                <p className="text-xs text-white/50">
                  {bonusRules?.rulesCutoff?.description || "Rules apply from the cutoff date below."}
                </p>
                {bonusRules?.rulesCutoff?.iso && (
                  <p className="mt-1 text-xs text-white/40">
                    Cutoff: {new Date(bonusRules.rulesCutoff.iso).toLocaleString()}{" "}
                    {bonusRules?.rulesCutoff?.timezone ? `(${bonusRules.rulesCutoff.timezone})` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBonusModalOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 overflow-y-auto max-h-[70vh] pr-2">
              <Tabs defaultValue="first" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-gray-900/40 border border-gray-800 rounded-2xl p-1">
                  <TabsTrigger value="first">First Investment</TabsTrigger>
                  <TabsTrigger value="reinvest">Reinvestments</TabsTrigger>
                </TabsList>

                <TabsContent value="first" className="mt-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-white/60">Direct Bonus</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {bonusRules?.directBonus?.percentageLabel || "—"}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        Recipient: {bonusRules?.directBonus?.recipient || "—"}
                      </p>
                      {bonusRules?.directBonus?.notes && (
                        <p className="mt-2 text-xs text-white/50">
                          {bonusRules.directBonus.notes}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-white/60">Unilevel Bonus</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {bonusRules?.unilevelBonus?.levels?.map((level) => (
                          <div
                            key={level.level}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                          >
                            {/* Backend levels start at 1; UI shows levels starting at 2 */}
                            <span className="text-white/70">
                              Level {level.level + DISPLAY_LEVEL_OFFSET}
                            </span>
                            <span className="text-white">{level.percentageLabel || "—"}</span>
                          </div>
                        )) || (
                          <p className="text-xs text-white/40">No unilevel levels configured.</p>
                        )}
                      </div>
                      {bonusRules?.unilevelBonus?.notes && (
                        <p className="mt-3 text-xs text-white/50">
                          {bonusRules.unilevelBonus.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">Unilevel Unlock Rules</p>
                    <div className="mt-3 space-y-2 text-xs">
                      {/* UI adds Level 1 rule and shifts backend levels by +1 for clarity */}
                      {[DEFAULT_LEVEL_ONE_RULE, ...(bonusRules?.unilevelUnlockRules || [])].map(
                        (rule) => {
                          const displayLevel =
                            rule === DEFAULT_LEVEL_ONE_RULE
                              ? 1
                              : rule.level + DISPLAY_LEVEL_OFFSET;
                          const isDefaultLevelOne = rule === DEFAULT_LEVEL_ONE_RULE;
                          const activeLegsRequired = rule.activeLegsRequired ?? 0;
                          const activeLegDepth = rule.activeLegDepth ?? displayLevel;
                          const activeTeamRequired = rule.activeTeamRequired ?? 0;
                          const descriptionText = isDefaultLevelOne
                            ? "Have 1 active member at Level 1."
                            : activeTeamRequired > 0
                              ? `Have ${activeLegsRequired} active users at Level ${activeLegDepth} and ${activeTeamRequired} active team members.`
                              : `Have ${activeLegsRequired} active users at Level ${activeLegDepth}.`;
                          return (
                            <div
                              key={`rule-${displayLevel}`}
                              className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${
                                isDefaultLevelOne
                                  ? "border-emerald-500/40 bg-emerald-500/10"
                                  : "border-white/10 bg-black/30"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={
                                    isDefaultLevelOne ? "text-emerald-200" : "text-white/80"
                                  }
                                >
                                  Level {displayLevel}
                                </span>
                                {isDefaultLevelOne && (
                                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-200">
                                    Unlocked
                                  </span>
                                )}
                              </div>
                              <p
                                className={
                                  isDefaultLevelOne ? "text-emerald-100/80" : "text-white/60"
                                }
                              >
                                {descriptionText}
                              </p>
                            </div>
                          );
                        }
                      )}
                      {(!bonusRules?.unilevelUnlockRules ||
                        bonusRules.unilevelUnlockRules.length === 0) && (
                        <p className="text-xs text-white/40">No unlock rules configured.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reinvest" className="mt-5">
                  <div className="space-y-3">
                    {bonusRules?.reinvestmentBonus?.levels?.map((cycle) => (
                      <div
                        key={cycle.cycle}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-white/60">
                              {cycle.cycle} · Deposit #{cycle.depositNumber}
                            </p>
                            <p className="text-lg font-semibold text-white">
                              Total: {cycle.totalPercentageLabel || "—"}
                            </p>
                          </div>
                        </div>
                        {cycle.splits && cycle.splits.length > 0 ? (
                          cycle.splits.length === 1 && cycle.splits[0].level === 1 ? null : (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              {cycle.splits.map((split) => (
                                <div
                                  key={split.level}
                                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                                >
                                  <span className="text-white/70">Level {split.level}</span>
                                  <span className="text-white">
                                    {split.percentageLabel || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <p className="mt-3 text-xs text-white/40">No splits configured.</p>
                        )}
                      </div>
                    )) || (
                      <p className="text-xs text-white/40">No reinvestment rules configured.</p>
                    )}
                    {bonusRules?.reinvestmentBonus?.notes && (
                      <p className="text-xs text-white/50">
                        {bonusRules.reinvestmentBonus.notes}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default TeamPage;
