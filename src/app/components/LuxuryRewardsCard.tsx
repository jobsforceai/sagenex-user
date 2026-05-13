"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Sparkles, Clock, CheckCircle2, XCircle, Target } from "lucide-react";
import { toast } from "sonner";
import { getLuxuryProgress, claimLuxuryReward } from "@/actions/luxury-rewards";

const TIER_META: Record<string, { label: string; icon: any; accent: string; bgGrad: string; }> = {
  '10L': { label: 'Starter Tier',  icon: Sparkles, accent: 'text-amber-600',  bgGrad: 'from-amber-50 to-white' },
  '30L': { label: 'Mid Tier',      icon: Trophy,   accent: 'text-emerald-600', bgGrad: 'from-emerald-50 to-white' },
  '50L': { label: 'Elite Tier',    icon: Target,   accent: 'text-sky-600',     bgGrad: 'from-sky-50 to-white' },
  '1CR': { label: 'Crown Tier',    icon: Crown,    accent: 'text-[#C81E4A]',   bgGrad: 'from-[#FFF7ED] to-[#FFF1F4]' },
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const lakh = (n: number) =>
  n >= 10000000 ? `₹${(n/10000000).toFixed(2)}Cr`
  : n >= 100000 ? `₹${(n/100000).toFixed(2)}L`
  : inr(n);

const daysLeft = (endsAt: string | Date | null) => {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
};

export default function LuxuryRewardsCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await getLuxuryProgress();
    if (res?.error) toast.error(res.error);
    else setData(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleClaim = async () => {
    if (!data?.cycle?._id) return;
    setClaiming(true);
    const res = await claimLuxuryReward(data.cycle._id);
    if (res?.error) toast.error(res.error);
    else { toast.success("Reward claimed!"); await load(); }
    setClaiming(false);
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center text-sm text-slate-500">Loading Luxury Rewards…</CardContent>
      </Card>
    );
  }

  const snap = data?.snapshot;
  const cycle = data?.cycle;

  if (!snap?.hasAnchor) {
    return (
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <Crown className="h-5 w-5 text-[#C81E4A]" /> Luxury Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Make your first new-plan deposit to unlock the Luxury Rewards program.
        </CardContent>
      </Card>
    );
  }

  const pendingApproval = cycle?.status === 'REWARD_PENDING_APPROVAL';
  const claimable = pendingApproval && cycle?.approvedAt;
  const claimed = cycle?.status === 'CLAIMED';

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <Crown className="h-5 w-5 text-[#C81E4A]" /> Luxury Rewards
          </CardTitle>
          {cycle?.kind === 'CARRY' && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Carry Cycle</Badge>
          )}
          {claimed && (
            <Badge className="bg-emerald-500/15 text-emerald-700">Claimed: {cycle.qualifiedTierId}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Headline row */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Capped Team</p>
            <p className="mt-1 text-lg font-black text-slate-900">{lakh(snap.cappedTeamBusinessINR)}</p>
            <p className="text-[10px] text-slate-500">raw {lakh(snap.rawTeamBusinessINR)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Direct Business</p>
            <p className="mt-1 text-lg font-black text-slate-900">{lakh(snap.directBusinessINR)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Active Legs</p>
            <p className="mt-1 text-lg font-black text-slate-900">{snap.activeLegsCount}</p>
          </div>
        </div>

        {/* Per-tier progress */}
        <div className="space-y-3">
          {snap.tierProgress.map((tp: any) => {
            const meta = TIER_META[tp.tierId];
            const Icon = meta.icon;
            const days = daysLeft(tp.windowEndsAt);
            const miss: string[] = [];
            if (tp.missing.teamBizINR > 0)   miss.push(`${lakh(tp.missing.teamBizINR)} team`);
            if (tp.missing.directBizINR > 0) miss.push(`${lakh(tp.missing.directBizINR)} direct`);
            if (tp.missing.legs > 0)         miss.push(`${tp.missing.legs} leg${tp.missing.legs>1?'s':''}`);
            return (
              <div key={tp.tierId} className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${meta.bgGrad} px-4 py-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${meta.accent}`} />
                    <span className="font-black text-slate-900">{tp.tierId} {meta.label}</span>
                    {tp.qualified && <Badge className="bg-emerald-500/15 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Qualified</Badge>}
                    {!tp.windowOpen && !tp.qualified && <Badge variant="outline" className="border-slate-300 text-slate-500"><XCircle className="mr-1 h-3 w-3"/>Window closed</Badge>}
                  </div>
                  {tp.windowOpen && days !== null && (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Clock className="h-3 w-3"/>{days}d left</span>
                  )}
                </div>
                <div className="mt-2 grid gap-1.5">
                  <Progress value={tp.teamBizPct} className="h-1.5"/>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    <span>Team {tp.teamBizPct}%</span>
                    <span>Direct {tp.directBizPct}%</span>
                    <span>Legs {tp.legsPct}%</span>
                  </div>
                  {miss.length > 0 && tp.windowOpen && (
                    <p className="text-[11px] text-slate-500">Need: {miss.join(' + ')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {pendingApproval && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm font-black text-amber-900">You qualified for {cycle.qualifiedTierId}!</p>
            <p className="text-xs text-amber-800">
              {claimable ? "Admin approved — claim now to lock your reward." : "Pending admin approval."}
            </p>
            {claimable && (
              <Button className="mt-2" disabled={claiming} onClick={handleClaim}>
                {claiming ? "Claiming…" : "Claim reward"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
