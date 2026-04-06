"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Gem, DollarSign, TrendingUp, Sparkles } from "lucide-react";

interface Vault {
  totalGoldQuantityGrams?: number;
  totalGoldValueLockedUsd?: number;
  totalCashBonusUsd?: number;
  totalDepositedUsd?: number;
  maturityValueUsd?: number;
}

interface GoldRate {
  pricePerGram: number;
  pricePerGramUsd: number;
  exchangeRate: number;
  source: string;
  timestamp: string;
}

interface VaultSectionProps {
  vault: Vault | null;
  planType: "gold" | "cash";
  goldRate: GoldRate | null;
}

const formatUSD = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });


export default function VaultSection({ vault, planType, goldRate }: VaultSectionProps) {
  if (!vault) {
    return (
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardContent className="pt-6 pb-6 text-center text-gray-500">
          No vault data available.
        </CardContent>
      </Card>
    );
  }

  const isGold = planType === "gold";

  if (isGold) {
    const totalGrams = vault.totalGoldQuantityGrams ?? 0;
    const lockedValue = vault.totalGoldValueLockedUsd ?? 0;
    const liveValue =
      goldRate ? totalGrams * goldRate.pricePerGramUsd : lockedValue;

    return (
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <Gem className="h-5 w-5" />
            Gold Vault
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VaultRow
              icon={<Gem className="h-4 w-4 text-amber-400" />}
              label="Total Gold"
              value={`${totalGrams.toFixed(4)} grams`}
            />
            <VaultRow
              icon={<Lock className="h-4 w-4 text-gray-400" />}
              label="Locked Value"
              value={formatUSD(lockedValue)}
            />
            <VaultRow
              icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
              label="Total Deposited"
              value={formatUSD(vault.totalDepositedUsd ?? 0)}
            />
            <VaultRow
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              label="Live Value"
              value={formatUSD(liveValue)}
            />
            <VaultRow
              icon={<Sparkles className="h-4 w-4 text-purple-400" />}
              label="Maturity Value"
              value={formatUSD(vault.maturityValueUsd ?? 0)}
            />
            {goldRate && (
              <VaultRow
                icon={<DollarSign className="h-4 w-4 text-cyan-400" />}
                label="Live Rate"
                value={`${formatUSD(goldRate.pricePerGramUsd)}/g`}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cash vault
  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-300">
          <DollarSign className="h-5 w-5" />
          Cash Vault
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VaultRow
            icon={<DollarSign className="h-4 w-4 text-blue-400" />}
            label="Total Deposited"
            value={formatUSD(vault.totalDepositedUsd ?? 0)}
          />
          <VaultRow
            icon={<Sparkles className="h-4 w-4 text-purple-400" />}
            label="Cash Bonus (4x)"
            value={formatUSD(vault.totalCashBonusUsd ?? 0)}
          />
          <VaultRow
            icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
            label="Maturity Value"
            value={formatUSD(vault.maturityValueUsd ?? 0)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function VaultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-800/40 px-4 py-3">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
