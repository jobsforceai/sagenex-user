"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import TreeClient from "./TreeClient";
import Navbar from "@/app/components/Navbar";
import PlacementQueue from "@/app/components/dashboard/PlacementQueue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserNode, ParentNode, QueuedUser } from "@/types";
import { getBonusRulesConfig, getTeamTree, getPlacementQueue } from "@/actions/user";
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

const TeamPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [treeData, setTreeData] = useState<TreeApiResponse | null>(null);
  const [queue, setQueue] = useState<QueuedUser[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRulesConfig | null>(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchTeamData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [treeResult, queueResult, bonusRulesResult] = await Promise.all([
        getTeamTree(),
        getPlacementQueue(),
        getBonusRulesConfig(),
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
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">My Team</h1>
            <p className="text-sm text-white/50">View team structure and bonus rules.</p>
          </div>
          <Button
            variant="outline"
            className="border-blue-500/40 text-blue-200 hover:bg-blue-500/10"
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
      </div>

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
                            <span className="text-white/70">Level {level.level}</span>
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
                      {bonusRules?.unilevelUnlockRules?.map((rule) => (
                        <div
                          key={rule.level}
                          className="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-white/80">Level {rule.level}</span>
                            {rule.requiresTest && (
                              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">
                                Test required
                              </span>
                            )}
                          </div>
                          <p className="text-white/60">{rule.description || "—"}</p>
                        </div>
                      )) || (
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
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          {cycle.splits?.map((split) => (
                            <div
                              key={split.level}
                              className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                            >
                              <span className="text-white/70">Level {split.level}</span>
                              <span className="text-white">{split.percentageLabel || "—"}</span>
                            </div>
                          )) || (
                            <p className="text-xs text-white/40">No splits configured.</p>
                          )}
                        </div>
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
  );
};

export default TeamPage;
