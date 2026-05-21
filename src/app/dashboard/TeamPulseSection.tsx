"use client";

/**
 * Team Pulse — leader-engagement dashboard panel.
 *
 *   • At-Risk Members      → who to call/reactivate today
 *   • Hot Opportunities    → fastest paths to bonus uplift
 *   • Recent Wins          → social proof from your downline
 *   • Team Health Score    → 0-100 derived metric
 *
 * Fetches once from /api/v1/user/team-pulse and renders.
 * Pre-filled tel: and wa.me/ links — no extra backend work needed.
 */
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Flame, PhoneCall, MessageCircle, Trophy, Activity, Sparkles, ChevronRight } from "lucide-react";
import { getTeamPulse } from "@/actions/user";

interface AtRiskMember {
  userId: string;
  fullName: string;
  phone?: string | null;
  reason: string;
  severity: "high" | "medium";
  packageUSD: number;
  daysSinceActivity: number | null;
  daysSinceTopUp: number | null;
}

interface HotOpportunity {
  userId: string;
  fullName: string;
  phone?: string | null;
  type: "TO_3X_LEG" | "TO_4X_LEG" | "INACTIVE_HIGH_PACKAGE";
  headline: string;
  detail: string;
  packageUSD: number;
  legBusiness120d?: number;
}

interface RankProgress {
  currentMultiplier: number;
  nextMultiplier: number | null;
  isKycVerified: boolean;
  qualifyingLegs3x: number;
  qualifyingLegs4x: number;
  teamBusiness120d: number;
  requiredLegs: number | null;
  requiredLegBusinessPerLeg: number | null;
  requiredTeamBusiness: number | null;
  blockers: string[];
}

interface RecentWin {
  userId: string;
  fullName: string;
  amount: number;
  daysAgo: number;
}

interface TeamHealth {
  score: number;
  band: "excellent" | "good" | "fair" | "weak";
  signals: {
    activeRatio: { value: number; weight: number };
    growth30d: { count: number; weight: number };
    activationVolume30d: { amount: number; weight: number };
  };
  weakSpots: string[];
}

interface ActionPlanItem {
  headline: string;
  detail?: string;
  targetUserId?: string;
  priority: "high" | "medium" | "low";
}

interface TeamPulse {
  atRisk: AtRiskMember[];
  opportunities: HotOpportunity[];
  recentWins: RecentWin[];
  health: TeamHealth;
  actionPlan: ActionPlanItem[];
  rankProgress: RankProgress;
}

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const inrCompact = (n: number) => {
  if (n >= 10_000_000) return "₹" + (n / 10_000_000).toFixed(2).replace(/\.00$/, "") + " Cr";
  if (n >= 100_000) return "₹" + (n / 100_000).toFixed(2).replace(/\.00$/, "") + " L";
  if (n >= 1_000) return "₹" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const maskName = (name: string) => {
  const clean = (name || "").trim();
  if (clean.length <= 2) return clean;
  return `${clean.charAt(0)}${"*".repeat(Math.min(5, Math.max(2, clean.length - 2)))}${clean.charAt(clean.length - 1)}`;
};

const wapp = (phone: string | null | undefined, text: string) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  // Default Indian country code if it's just a 10-digit number
  const full = digits.length === 10 ? "91" + digits : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
};

const BAND_COLOUR: Record<TeamHealth["band"], { dot: string; pill: string; ring: string }> = {
  excellent: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-100" },
  good:      { dot: "bg-sky-500",     pill: "bg-sky-50 text-sky-700",          ring: "ring-sky-100" },
  fair:      { dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700",      ring: "ring-amber-100" },
  weak:      { dot: "bg-rose-500",    pill: "bg-rose-50 text-rose-700",        ring: "ring-rose-100" },
};

export default function TeamPulseSection() {
  const [data, setData] = useState<TeamPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTeamPulse();
      if (res?.error) { setError(res.error); setData(null); }
      else { setError(null); setData(res); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load team pulse");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-50" />
          ))}
        </div>
      </section>
    );
  }
  if (error || !data) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <p className="text-sm text-[#64748B]">Team Pulse unavailable. {error}</p>
      </section>
    );
  }

  const { atRisk, opportunities, recentWins, health, rankProgress } = data;
  const band = BAND_COLOUR[health.band];

  // Multiplier-path card values
  const rp = rankProgress;
  const hasNextMultiplier = rp.nextMultiplier !== null;
  const targetLegs = rp.requiredLegs ?? 0;
  const haveLegs = rp.nextMultiplier === 3 ? rp.qualifyingLegs3x : rp.qualifyingLegs4x;
  const targetTeam = rp.requiredTeamBusiness ?? 0;
  const haveTeam = rp.teamBusiness120d;
  const teamPct = targetTeam > 0 ? Math.min(100, Math.round((haveTeam / targetTeam) * 100)) : 100;
  const legPct = targetLegs > 0 ? Math.min(100, Math.round((haveLegs / targetLegs) * 100)) : 100;

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Team engine</p>
          <h2 className="mt-1 text-2xl font-black text-[#0F172A]">Team Pulse</h2>
          <p className="mt-1 text-xs text-[#64748B]">Who needs a nudge today, what&apos;s ripe, and how your team is trending.</p>
        </div>

        {/* Health pill */}
        <div className={`flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 ring-1 ${band.ring}`}>
          <div className="relative h-12 w-12">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1F5F9" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                strokeWidth="3" strokeLinecap="round"
                className={health.band === 'excellent' ? 'stroke-emerald-500' : health.band === 'good' ? 'stroke-sky-500' : health.band === 'fair' ? 'stroke-amber-500' : 'stroke-rose-500'}
                strokeDasharray={`${(health.score / 100) * 100} 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#0F172A]">{health.score}</div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#64748B]">Health</p>
            <p className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-black capitalize ${band.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${band.dot}`} />{health.band}
            </p>
          </div>
        </div>
      </div>

      {/* Health signals strip */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">
            <Activity className="h-3.5 w-3.5" />Active directs
          </div>
          <p className="mt-2 text-xl font-black text-[#0F172A]">{Math.round(health.signals.activeRatio.value * 100)}%</p>
          <p className="mt-0.5 text-[11px] text-[#64748B]">Of your direct referrals</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">
            <Trophy className="h-3.5 w-3.5" />New joins · 30d
          </div>
          <p className="mt-2 text-xl font-black text-[#0F172A]">{health.signals.growth30d.count}</p>
          <p className="mt-0.5 text-[11px] text-[#64748B]">Across your downline</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">
            <Flame className="h-3.5 w-3.5" />Team business · 30d
          </div>
          <p className="mt-2 text-xl font-black text-[#0F172A]">{inrCompact(health.signals.activationVolume30d.amount)}</p>
          <p className="mt-0.5 text-[11px] text-[#64748B]">Activation volume</p>
        </div>
      </div>

      {/* Multiplier path */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#64748B]">Multiplier path</p>
            <p className="mt-1 text-base font-black text-[#0F172A]">
              {hasNextMultiplier
                ? <>You’re at <span className="text-[#C8103E]">{rp.currentMultiplier}x</span> — next stop <span className="text-emerald-600">{rp.nextMultiplier}x</span></>
                : <>You’re at <span className="text-emerald-600">{rp.currentMultiplier}x</span> — max tier</>}
            </p>
          </div>
          {hasNextMultiplier && (
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-[#0F172A]">{rp.blockers.length} thing{rp.blockers.length === 1 ? '' : 's'} left</span>
          )}
        </div>

        {hasNextMultiplier ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Legs progress */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">
                <span>Qualifying legs</span>
                <span className="font-black text-[#0F172A]">{haveLegs}/{targetLegs}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: legPct + '%' }} />
              </div>
              <p className="mt-1.5 text-[11px] text-[#64748B]">Each leg needs ₹{(rp.requiredLegBusinessPerLeg ?? 0).toLocaleString('en-IN')}+ business in last 120 days</p>
            </div>
            {/* Team business progress */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">
                <span>Team business · 120d</span>
                <span className="font-black text-[#0F172A]">{inrCompact(haveTeam)}/{inrCompact(targetTeam)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-sky-500" style={{ width: teamPct + '%' }} />
              </div>
              <p className="mt-1.5 text-[11px] text-[#64748B]">Across your full downline in the rolling 120-day window</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-[#64748B]">You’re at the top earning multiplier. Keep your qualifying legs strong — they refresh on a rolling 120-day window.</p>
        )}

        {hasNextMultiplier && rp.blockers.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-[#0F172A]">
            {rp.blockers.map((b, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8103E]" /><span>{b}</span></li>)}
            {!rp.isKycVerified && rp.nextMultiplier === 4 && (
              <li className="flex items-start gap-2 text-[11px] text-amber-700">• KYC verification is required for 4x</li>
            )}
          </ul>
        )}
      </div>

      {/* The three lists */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">

        {/* AT-RISK */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />At risk
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-rose-700">{atRisk.length}</span>
          </div>
          {atRisk.length === 0 ? (
            <p className="mt-4 text-xs text-[#64748B]">All your directs are active — nothing to chase today. ✨</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {atRisk.map(m => {
                const text = `Hi ${m.fullName?.split(' ')[0] || 'there'}, missed seeing you on Sagenex. Let's hop on a quick call to get you back on track.`;
                const w = wapp(m.phone, text);
                return (
                  <li key={m.userId} className="rounded-xl border border-rose-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#0F172A]">{maskName(m.fullName)} <span className="text-xs font-bold text-[#64748B]">· {m.userId}</span></p>
                        <p className="mt-0.5 text-[11px] text-rose-700">{m.reason}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${m.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                        {m.severity === 'high' ? 'high' : 'med'}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <a
                        href={m.phone ? `tel:${m.phone}` : undefined}
                        aria-disabled={!m.phone}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black transition ${m.phone ? 'bg-[#0F172A] text-white hover:opacity-90' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                      >
                        <PhoneCall className="h-3 w-3" />Call
                      </a>
                      <a
                        href={w ?? undefined}
                        target="_blank" rel="noopener noreferrer"
                        aria-disabled={!w}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black transition ${w ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                      >
                        <MessageCircle className="h-3 w-3" />WhatsApp
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* HOT OPPORTUNITIES */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-amber-700">
              <Flame className="h-3.5 w-3.5" />Hot opportunities
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-amber-700">{opportunities.length}</span>
          </div>
          {opportunities.length === 0 ? (
            <p className="mt-4 text-xs text-[#64748B]">Nothing actionable right now. Plant some seeds.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {opportunities.map(o => {
                const text = `Hi ${o.fullName?.split(' ')[0] || 'there'}! ${o.headline}. Wanted to flag it — let's chat?`;
                const w = wapp(o.phone, text);
                return (
                  <li key={o.userId} className="rounded-xl border border-amber-100 bg-white p-3">
                    <p className="truncate text-sm font-black text-[#0F172A]">{maskName(o.fullName)} <span className="text-xs font-bold text-[#64748B]">· {o.userId}</span></p>
                    <p className="mt-0.5 text-[11px] font-bold text-amber-700">{o.headline}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-[#64748B]">{o.detail}</p>
                    <div className="mt-2 flex gap-1.5">
                      <a
                        href={o.phone ? `tel:${o.phone}` : undefined}
                        aria-disabled={!o.phone}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black transition ${o.phone ? 'bg-[#0F172A] text-white hover:opacity-90' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                      >
                        <PhoneCall className="h-3 w-3" />Call
                      </a>
                      <a
                        href={w ?? undefined}
                        target="_blank" rel="noopener noreferrer"
                        aria-disabled={!w}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black transition ${w ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'cursor-not-allowed bg-slate-100 text-slate-400'}`}
                      >
                        <MessageCircle className="h-3 w-3" />WhatsApp
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* RECENT WINS */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-700">
              <Trophy className="h-3.5 w-3.5" />Recent wins
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-emerald-700">{recentWins.length}</span>
          </div>
          {recentWins.length === 0 ? (
            <p className="mt-4 text-xs text-[#64748B]">No team activations this week — keep pushing.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentWins.map((w, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0F172A]">{maskName(w.fullName)}</p>
                    <p className="text-[11px] font-bold text-[#64748B]">{w.userId} · {w.daysAgo === 0 ? 'today' : `${w.daysAgo}d ago`}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">+{inrCompact(w.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* Action Plan — what to do today (rule-based, personalized) */}
      {data.actionPlan?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-[#FFF7ED] via-white to-[#F0F9FF] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F172A] text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#64748B]">What to do today</p>
          </div>
          <ul className="mt-3 space-y-2">
            {data.actionPlan.map((a, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                <span className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${a.priority === 'high' ? 'bg-rose-500' : a.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#0F172A]">{a.headline}</p>
                  {a.detail && <p className="mt-0.5 text-[11px] text-[#64748B]">{a.detail}</p>}
                </div>
                {a.targetUserId && (
                  <a href="/team" className="shrink-0 self-center rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-black text-[#0F172A] hover:bg-slate-50">
                    {a.targetUserId} <ChevronRight className="-mr-0.5 ml-0.5 inline h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weak spots strip — quieter follow-up under the action plan */}
      {health.weakSpots.length > 0 && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">Watch outs</p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-[#0F172A]">
            {health.weakSpots.map((s, i) => <li key={i} className="flex items-start gap-2">•<span>{s}</span></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
