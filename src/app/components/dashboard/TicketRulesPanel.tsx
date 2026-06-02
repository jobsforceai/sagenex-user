"use client";

/**
 * Collapsible "How Tickets Work" panel for the dashboard.
 *
 * Lives directly under the Rewards-Fuel Tickets card. Closed by default so
 * it doesn't dominate the layout; users can expand it to read the per-direct
 * vs team-business rules.
 *
 * Source of truth for the numbers below:
 *   sagenex-backend/src/config/tickets.ts
 *     TICKET_DIRECT_THRESHOLD_INR        = 400000   (₹4L per direct)
 *     TICKET_TEAM_THRESHOLD_INR          = 500000   (₹5L per team ticket)
 *     TICKET_TEAM_MIN_ACTIVE_LEGS        = 2
 *     TICKET_TEAM_POWER_LEG_CAP_PCT      = 0.40
 *
 * If the team changes any of these, update both the backend constant AND
 * the copy in this file.
 */
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Info,
  RefreshCw,
  Scale,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";

const RULES = [
  {
    icon: UserCheck,
    title: "Direct path",
    headline: "1 ticket per direct who invests ≥ ₹4,00,000",
    body:
      "Counted INDIVIDUALLY for each direct downline — investments from multiple smaller directs do NOT combine to reach ₹4L.",
  },
  {
    icon: Users,
    title: "Team path",
    headline: "1 ticket per ₹5,00,000 of capped team business",
    body:
      "Requires at least 2 active legs in the month. No single leg can contribute more than 40% of the month's team business (power-leg cap).",
  },
  {
    icon: CalendarDays,
    title: "Monthly window",
    headline: "Calculated per calendar month (IST)",
    body:
      "Fresh count each month — direct and team paths can stack within the same month, but volume does not carry forward.",
  },
  {
    icon: RefreshCw,
    title: "No reductions",
    headline: "Existing tickets are never reduced",
    body:
      "Tickets already earned remain in your balance. Recalculations only add new ones; they never claw back.",
  },
];

const EXAMPLES = [
  {
    label: "✅ Qualifies",
    text: "One direct invests ₹4,00,000 in May → 1 direct ticket awarded for May.",
  },
  {
    label: "✅ Qualifies",
    text: "Two directs each invest ₹4,00,000 in May → 2 direct tickets awarded for May.",
  },
  {
    label: "❌ Does NOT qualify",
    text: "Four directs invest ₹1,00,000 each (₹4L total, but no single direct hits ₹4L) → 0 direct tickets.",
  },
  {
    label: "❌ Does NOT qualify",
    text: "One direct invests ₹2L in April + ₹2L in May (different months) → 0 direct tickets — must be ≥ ₹4L within ONE calendar month.",
  },
];

export default function TicketRulesPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      {/* Header — collapsible toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 rounded-3xl p-4 text-left transition hover:bg-slate-50/60 md:p-5"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Ticket className="h-10 w-10 rounded-2xl bg-violet-50 p-2.5 text-violet-700" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-violet-700">Reward Rules</p>
            <h2 className="mt-0.5 text-base font-black text-[#0F172A]">How Tickets Work</h2>
            <p className="mt-0.5 hidden text-xs font-semibold text-slate-500 sm:block">
              {isOpen ? "Tap to collapse" : "Tap to read the eligibility rules"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-slate-200/70 p-4 md:p-5">
          {/* Rules — 4 cards */}
          <div className="grid gap-2.5 md:grid-cols-2">
            {RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <article
                  key={rule.title}
                  className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-9 w-9 shrink-0 rounded-xl bg-white p-1.5 text-violet-700 shadow-sm" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                        {rule.title}
                      </p>
                      <p className="mt-1 text-sm font-black text-[#0F172A]">{rule.headline}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{rule.body}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Examples */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Examples</p>
            </div>
            <ul className="space-y-2">
              {EXAMPLES.map((ex, i) => {
                const ok = ex.label.startsWith("✅");
                return (
                  <li
                    key={i}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold leading-5 ${
                      ok
                        ? "border-emerald-100 bg-emerald-50/60 text-emerald-900"
                        : "border-rose-100 bg-rose-50/60 text-rose-900"
                    }`}
                  >
                    <span className="mr-1.5 font-black">{ex.label}</span>
                    <span className="text-slate-700">{ex.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Power-leg footnote */}
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5">
            <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-xs font-semibold leading-5 text-amber-900">
              <span className="font-black">Power-leg rule (team path):</span> if one of your active legs contributes
              more than 40% of your monthly team business, the excess above 40% is excluded from the team-business
              total used to award tickets.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
