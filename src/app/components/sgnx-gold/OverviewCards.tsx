"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  TrendingUp,
  CalendarClock,
  DollarSign,
  Weight,
  Gem,
} from "lucide-react";

interface Enrollment {
  _id: string;
  planType: "gold" | "cash";
  monthlyAmountUsd: number;
  status: string;
  completedMonths: number;
  totalMonths: number;
  bonusGoldQuantityGrams?: number;
  goldRateLockedPerGram?: number;
  nextDueDate?: string;
  createdAt: string;
}

interface GoldRate {
  pricePerGram: number;
  pricePerGramBeforeGst: number;
  gstPercent: number;
  pricePerGramUsd: number;
  exchangeRate: number;
  source: string;
  timestamp: string;
}

interface OverviewCardsProps {
  enrollment: Enrollment;
  goldRate: GoldRate | null;
}

// Wallet migrated to INR — *Usd fields now carry INR values (legacy name)
const formatUSD = (v: number) =>
  "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatDate = (v: string) => new Date(v).toLocaleDateString("en-US");

export default function OverviewCards({ enrollment, goldRate }: OverviewCardsProps) {
  const isGold = enrollment.planType === "gold";
  const totalDeposited = enrollment.monthlyAmountUsd * enrollment.completedMonths;
  const maturityMonths = 11;

  // Bonus = first deposit × multiplier; maturity = all deposits + bonus
  const bonusValue = isGold
    ? enrollment.monthlyAmountUsd * 3
    : enrollment.monthlyAmountUsd * 4;
  const totalExpected = enrollment.monthlyAmountUsd * maturityMonths;
  const maturityValue = totalExpected + bonusValue;

  const liveGoldValue =
    isGold && enrollment.bonusGoldQuantityGrams && goldRate
      ? enrollment.bonusGoldQuantityGrams * goldRate.pricePerGram
      : null;

  const cards = [
    {
      label: "Plan Type",
      value: (
        <Badge
          className={
            isGold
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }
        >
          {isGold ? "Gold" : "Cash"}
        </Badge>
      ),
      icon: <Gem className="h-4 w-4 text-amber-400" />,
    },
    {
      label: "Progress",
      value: `${enrollment.completedMonths} / ${maturityMonths}`,
      icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    },
    {
      label: "Total Deposited",
      value: formatUSD(totalDeposited),
      icon: <DollarSign className="h-4 w-4 text-blue-400" />,
    },
    {
      label: "Monthly Amount",
      value: formatUSD(enrollment.monthlyAmountUsd),
      icon: <Coins className="h-4 w-4 text-purple-400" />,
    },
    {
      label: "Maturity Value",
      value: formatUSD(maturityValue),
      icon: <TrendingUp className="h-4 w-4 text-amber-400" />,
    },
    {
      label: "Next Auto-Pay",
      value: enrollment.nextDueDate
        ? formatDate(enrollment.nextDueDate)
        : "N/A",
      icon: <CalendarClock className="h-4 w-4 text-cyan-400" />,
    },
  ];

  // Gold-specific cards
  if (isGold) {
    cards.push({
      label: "Gold Held",
      value: `${(enrollment.bonusGoldQuantityGrams ?? 0).toFixed(4)} g`,
      icon: <Weight className="h-4 w-4 text-amber-400" />,
    });
    cards.push({
      label: "Live Gold Value",
      value: liveGoldValue !== null ? formatUSD(liveGoldValue) : "N/A",
      icon: <DollarSign className="h-4 w-4 text-amber-400" />,
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="bg-gray-900/40 border-gray-800 rounded-2xl"
        >
          <CardContent className="pt-4 pb-4 px-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              {card.icon}
              <span>{card.label}</span>
            </div>
            <div className="text-white text-lg font-semibold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
