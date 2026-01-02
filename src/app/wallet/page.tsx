"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import FundTransfer from "@/app/components/wallet/FundTransfer";
import CryptoDeposit from "@/app/components/wallet/CryptoDeposit";
import WithdrawalRequest from "@/app/components/wallet/WithdrawalRequest";
import TransferToSGChain from "@/app/components/wallet/TransferToSGChain";
import RedeemFromSGChain from "@/app/components/wallet/RedeemFromSGChain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSgbnCoupon, getWalletData, getDashboardData, getKycStatus } from "@/actions/user";
import { KycStatus } from "@/types";
import { ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";

// Interfaces for wallet page data
interface WalletTransaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  description?: string;
  referenceId?: string;
  sourceType?: string;
  sourceId?: string;
  fromUserId?: string;
  toUserId?: string;
  method?: string;
  currency?: string;
  meta: {
    unlockedLevel?: number;
    rule?: string;
    progressAtUnlock?: number | { team?: number; directs?: number; activeLegs?: number; activeTeam?: number; testQualified?: number };
    senderId?: string;
    senderName?: string;
    recipientId?: string;
    recipientName?: string;
    transactionId?: string;
    transferType?: string;
    bonusType?: string;
    depositId?: string;
    sgchainTransferId?: string;
    reference?: string;
    currencyCode?: string;
    amountLocal?: number;
    [key: string]: unknown; // Allow other meta fields
  };
}

interface LockedBonus {
    level: number;
    name: string;
    lockedAmount: number;
    isUnlocked: boolean;
    unlockRequirement: string;
    progress: {
        activeLegs?: { current: number; required: number; depth?: number };
        activeTeam?: { current: number; required: number };
        testQualified?: { current: number; required: number };
    };
}

interface WalletSummary {
  availableBalance: number;
  bonuses: LockedBonus[];
  withdrawalCap?: number;
  totalLifetimeWithdrawals?: number;
  remainingWithdrawalLimit?: number;
}

type SgbnCoupon = {
  transferId: string;
  code: string;
  amountSgc: number;
  amountUsd: number;
  planType: "BUSINESS" | "FREELANCER";
  status: string;
  expiresAt: string;
  createdAt: string;
};

const couponErrorMessages: Record<string, string> = {
  PLAN_REQUIRED: "Please select a plan to continue.",
  INSUFFICIENT_USD_BALANCE: "Insufficient USD balance to create this coupon.",
  CODE_EXPIRED: "This coupon code has expired.",
  CODE_ALREADY_CLAIMED: "This coupon has already been claimed.",
  PLAN_MISMATCH: "The selected plan does not match this coupon.",
  INVALID_CODE: "Invalid coupon code.",
};

const SGBN_PLANS = [
  {
    label: "Business",
    planType: "BUSINESS" as const,
    amountUsd: 120,
    buttonClass: "border-amber-400/50 text-amber-200 hover:bg-amber-500/10",
  },
  {
    label: "Freelancer",
    planType: "FREELANCER" as const,
    amountUsd: 60,
    buttonClass: "border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/10",
  },
];

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const LockedBonusesCard = ({ bonuses }: { bonuses: LockedBonus[] | undefined }) => {
    const getProgressPct = (current: number, required: number) =>
        required > 0 ? Math.min(100, (current / required) * 100) : 100;

    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Locked Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
                {bonuses && bonuses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {bonuses.map(bonus => {
                            const progressItems = [
                                bonus.progress?.activeLegs && {
                                    label: bonus.progress.activeLegs.depth
                                        ? `Active legs (depth ${bonus.progress.activeLegs.depth})`
                                        : "Active legs",
                                    current: bonus.progress.activeLegs.current,
                                    required: bonus.progress.activeLegs.required,
                                    barClass: "bg-sky-500",
                                },
                                bonus.progress?.activeTeam && {
                                    label: "Active team",
                                    current: bonus.progress.activeTeam.current,
                                    required: bonus.progress.activeTeam.required,
                                    barClass: "bg-emerald-500",
                                },
                                bonus.progress?.testQualified && {
                                    label: "Tests qualified",
                                    current: bonus.progress.testQualified.current,
                                    required: bonus.progress.testQualified.required,
                                    barClass: "bg-amber-500",
                                },
                            ].filter(
                                (item): item is { label: string; current: number; required: number; barClass: string } =>
                                    Boolean(item)
                            );
                            const imageLevel = bonus.level + 1;
                            const displayName = bonus.name?.trim()
                                ? `${bonus.name} - Level ${imageLevel}`
                                : `Matrix Level ${imageLevel}`;
                            
                            return (
                                <div key={bonus.level} className="p-4 rounded-lg bg-gray-800/60 border border-gray-700/50 shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            {bonus.isUnlocked ? (
                                                <Unlock className="text-emerald-400 h-5 w-5" />
                                            ) : (
                                                <Lock className="text-amber-400 h-5 w-5" />
                                            )}
                                            <p className="text-gray-200 font-semibold">{displayName}</p>
                                        </div>
                                        <span className={`font-bold text-xl ${bonus.isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${bonus.lockedAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {progressItems.length > 0 ? (
                                            progressItems.map((item) => (
                                                <div key={item.label}>
                                                    <div className="text-xs text-gray-400 flex justify-between mb-1.5">
                                                        <span>{item.label}</span>
                                                        <span className="font-medium">
                                                            {item.current} / {item.required}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                        <div 
                                                            className={`${item.barClass} h-2.5 rounded-full`}
                                                            style={{ width: `${getProgressPct(item.current, item.required)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-500">Progress data unavailable.</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">{bonus.unlockRequirement}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No locked bonuses at the moment.</p>
                )}
            </CardContent>
        </Card>
    );
};

const getTransactionTitle = (tx: WalletTransaction) => {
  if (tx.description) return tx.description;
  if (tx.type === "ROI_UPLINE_BONUS") return "ROI Upline Bonus";
  if (tx.type === "UNILEVEL" && tx.meta?.bonusType === "REINVESTMENT") return "Reinvestment Bonus";
  if (tx.type === "BONUS_UNLOCK") return "Bonus Unlocked";
  if (tx.type === "ROI") return "SPECIAL BONUS";
  return tx.type;
};

const getTransactionTypeLabel = (tx: WalletTransaction) => {
  if (tx.type === "ROI") return "SPECIAL BONUS";
  if (tx.type === "ROI_UPLINE_BONUS") return "ROI Upline Bonus";
  if (tx.type === "UNILEVEL" && tx.meta?.bonusType === "REINVESTMENT") return "Reinvestment Bonus";
  return tx.type;
};

const getTransactionReference = (tx: WalletTransaction) => {
  return (
    tx.referenceId ||
    tx.meta.transactionId ||
    tx.meta.depositId ||
    tx.meta.sgchainTransferId ||
    tx.sourceId ||
    null
  );
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const StatCard = ({ title, value, accent }: { title: string; value: string; accent?: string }) => (
  <Card className="bg-gray-900/40 border-gray-800">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-gray-400">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className={`text-2xl font-semibold ${accent ?? "text-white"}`}>{value}</p>
    </CardContent>
  </Card>
);

const formatLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());

const isEmptyValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
};

const isIsoDateString = (value: string) => /^\d{4}-\d{2}-\d{2}T/.test(value);

const formatDetailValue = (value: unknown) => {
  if (isEmptyValue(value)) return null;
  if (typeof value === "string") {
    return isIsoDateString(value) ? new Date(value).toLocaleString() : value;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const renderMetaValue = (value: unknown, depth = 0) => {
  if (isEmptyValue(value)) return "—";
  if (typeof value === "string") {
    return isIsoDateString(value) ? new Date(value).toLocaleString() : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {value.map((item, index) => (
          <div key={`${depth}-${index}`} className="text-gray-200 break-all">
            {renderMetaValue(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-1">
        {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
          <div key={`${depth}-${key}`} className="flex items-start justify-between gap-3">
            <span className="text-xs text-gray-500">{formatLabel(key)}</span>
            <span className="text-gray-200 break-all text-right">
              {renderMetaValue(val, depth + 1)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return String(value);
};

const getCounterpartyLabel = (tx: WalletTransaction) => {
  const sender = tx.meta.senderName || tx.meta.senderId || tx.fromUserId;
  const recipient = tx.meta.recipientName || tx.meta.recipientId || tx.toUserId;
  if (sender && recipient) return `${sender} → ${recipient}`;
  if (sender) return `From ${sender}`;
  if (recipient) return `To ${recipient}`;
  return null;
};


const WalletPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [coupon, setCoupon] = useState<SgbnCoupon | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"BUSINESS" | "FREELANCER" | null>(null);
  const [couponLoading, setCouponLoading] = useState<"BUSINESS" | "FREELANCER" | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isCouponExpired, setIsCouponExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [walletRes, dashboardRes, kycData] = await Promise.all([
          getWalletData(),
          getDashboardData(),
          getKycStatus(),
      ]);

      if (walletRes.error || dashboardRes.error || kycData.error) {
        throw new Error(walletRes.error || dashboardRes.error || kycData.error || "Failed to fetch data");
      }
      
      console.log("Wallet API response (ledger):", walletRes);
      console.log("Dashboard API response (for summary):", dashboardRes);

      setTransactions(Array.isArray(walletRes) ? walletRes : []);
      setWalletSummary(dashboardRes.wallet || null);
      setKycStatus(kycData);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
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
      fetchData();
    }
  }, [isAuthenticated, authLoading, router, fetchData]);

  useEffect(() => {
    if (!coupon?.expiresAt) {
      setTimeRemaining(null);
      setIsCouponExpired(false);
      return;
    }
    const expiry = new Date(coupon.expiresAt).getTime();
    if (Number.isNaN(expiry)) {
      setTimeRemaining(null);
      setIsCouponExpired(false);
      return;
    }

    const updateCountdown = () => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        setIsCouponExpired(true);
        return;
      }
      setTimeRemaining(formatCountdown(diff));
      setIsCouponExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [coupon?.expiresAt]);

  const handleCreateCoupon = async (planType: "BUSINESS" | "FREELANCER") => {
    setCouponError(null);
    setCouponMessage(null);
    setCouponLoading(planType);
    try {
      const res = await createSgbnCoupon(planType);
      if (res?.error) {
        setCouponError(couponErrorMessages[res.error] || res.error);
        return;
      }

      const nextCoupon: SgbnCoupon | null = res?.transferId ? res : res?.coupon || null;
      if (!nextCoupon?.code) {
        setCouponError("Unable to create coupon. Please try again.");
        return;
      }
      setCoupon(nextCoupon);
      setCouponMessage("Coupon created. Use it in SGBN within 10 minutes.");
      setSelectedPlan(null);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Failed to create coupon.");
    } finally {
      setCouponLoading(null);
    }
  };

  const handleCopyCode = async () => {
    if (!coupon?.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCouponMessage("Coupon code copied.");
    } catch {
      setCouponError("Unable to copy the code. Please copy it manually.");
    }
  };

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  const lockedBonusTotal =
    walletSummary?.bonuses?.reduce((sum, bonus) => sum + (bonus.isUnlocked ? 0 : bonus.lockedAmount), 0) ?? 0;
  const remainingWithdrawalLimit = Math.max(0, walletSummary?.remainingWithdrawalLimit ?? 0);

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6 pt-20 sm:pt-24 space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Wallet</h1>
          <p className="text-gray-400 mt-2">Manage your funds, view transactions, and upgrade your plan.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Available Balance"
            value={formatCurrency(walletSummary?.availableBalance ?? 0)}
            accent="text-emerald-400"
          />
          <StatCard
            title="Remaining Withdrawal Limit"
            value={formatCurrency(remainingWithdrawalLimit)}
          />
          <StatCard
            title="Total Withdrawn"
            value={formatCurrency(walletSummary?.totalLifetimeWithdrawals ?? 0)}
          />
          <StatCard
            title="Locked Bonuses"
            value={formatCurrency(lockedBonusTotal)}
            accent="text-amber-300"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-start">
          <div className="space-y-6">
            <FundTransfer currentBalance={walletSummary?.availableBalance ?? 0} className="h-full" />
          </div>
          <div className="space-y-6">
            <TransferToSGChain
              currentBalance={walletSummary?.availableBalance ?? 0}
              className="min-h-[220px]"
            />
            <RedeemFromSGChain onSuccess={fetchData} className="min-h-[220px]" />
            <Card className="bg-gray-900/40 border-gray-800">
              <CardHeader>
                <CardTitle>SGBN Coupons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  Create a coupon for SGBN plans. Coupons are valid for 10 minutes (USD only).
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SGBN_PLANS.map((plan) => (
                    <Button
                      key={plan.planType}
                      type="button"
                      variant="outline"
                      className={`border-gray-700 ${plan.buttonClass} ${
                        selectedPlan === plan.planType ? "bg-white/5" : ""
                      }`}
                      onClick={() => {
                        setSelectedPlan(plan.planType);
                        setCouponError(null);
                        setCouponMessage(null);
                      }}
                      disabled={couponLoading !== null}
                    >
                      {`${plan.label} ${formatCurrency(plan.amountUsd)}`}
                    </Button>
                  ))}
                </div>
                {selectedPlan && (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300 space-y-3">
                    <p>
                      Generate a {selectedPlan} coupon? It will be valid for 10 minutes.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="bg-emerald-500 text-black hover:bg-emerald-400"
                        onClick={() => handleCreateCoupon(selectedPlan)}
                        disabled={couponLoading !== null}
                      >
                        {couponLoading === selectedPlan ? "Creating..." : "Generate Coupon"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-700 text-gray-200 hover:bg-white/5"
                        onClick={() => setSelectedPlan(null)}
                        disabled={couponLoading !== null}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {couponError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {couponError}
                  </div>
                )}
                {couponMessage && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    {couponMessage}
                  </div>
                )}

                {coupon && (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                          Coupon Code
                        </p>
                        <p className="mt-2 font-mono text-sm text-emerald-200 break-all">
                          {coupon.code}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10"
                        onClick={handleCopyCode}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                      <div>
                        <p className="text-xs text-gray-500">Plan</p>
                        <p>{coupon.planType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p>{formatCurrency(coupon.amountUsd)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p>{isCouponExpired ? "EXPIRED" : coupon.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expires In</p>
                        <p>{timeRemaining || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <CryptoDeposit className="min-h-[220px]" />
            <WithdrawalRequest 
                currentBalance={walletSummary?.availableBalance ?? 0}
                kycStatus={kycStatus?.status}
                remainingWithdrawalLimit={remainingWithdrawalLimit}
                className="min-h-[220px]"
            />
          </div>
        </div>

        <LockedBonusesCard bonuses={walletSummary?.bonuses} />

        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle>Wallet History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-white">Details</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Date &amp; Time</TableHead>
                      <TableHead className="text-white text-right">More</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.flatMap((tx) => {
                      const isExpanded = expandedTxId === tx._id;
                      const reference = getTransactionReference(tx);
                      const counterparty = getCounterpartyLabel(tx);
                      const metaEntries = Object.entries(tx.meta || {})
                        .map(([key, value]) => [formatLabel(key), value] as const)
                        .filter(([, value]) => !isEmptyValue(value));

                      const detailItems = [
                        ["Description", tx.description],
                        ["Type", getTransactionTypeLabel(tx)],
                        ["Source Type", tx.sourceType],
                        ["Source ID", tx.sourceId],
                        ["Reference ID", reference],
                        ["From User", tx.fromUserId],
                        ["To User", tx.toUserId],
                        ["Counterparty", counterparty],
                        ["Method", tx.method],
                        ["Currency", tx.currency || "USDT"],
                        ["Created By", tx.createdBy],
                      ]
                        .map(([label, value]) => [label, formatDetailValue(value)] as const)
                        .filter(([, value]) => value !== null);

                      const rows = [
                        <TableRow
                          key={tx._id}
                          className="border-gray-800 cursor-pointer hover:bg-gray-900/40"
                          onClick={() =>
                            setExpandedTxId(isExpanded ? null : tx._id)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setExpandedTxId(isExpanded ? null : tx._id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                        >
                          <TableCell className="font-medium">
                              <div className="space-y-1">
                                <div>{getTransactionTitle(tx)}</div>
                                <span className="text-gray-500 text-xs block">
                                  Type: {getTransactionTypeLabel(tx)}
                                </span>
                              </div>
                          </TableCell>
                          <TableCell className={tx.amount > 0 ? "text-green-400" : "text-red-400"}>
                            <div className="font-semibold">
                              {tx.amount > 0 ? "+" : ""}
                              {tx.amount.toFixed(2)} {tx.currency || "USDT"}
                            </div>
                            {tx.meta.amountLocal && tx.meta.currencyCode && (
                              <div className="text-xs text-gray-400">
                                {tx.meta.amountLocal} {tx.meta.currencyCode}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>{tx.status}</div>
                            {tx.method && (
                              <div className="text-xs text-gray-400">{tx.method}</div>
                            )}
                          </TableCell>
                          <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="inline h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4" />
                            )}
                          </TableCell>
                        </TableRow>,
                      ];

                      if (isExpanded) {
                        rows.push(
                          <TableRow key={`${tx._id}-expanded`} className="border-gray-800 bg-black/30">
                            <TableCell colSpan={5} className="py-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                  {detailItems.map(([label, value]) => (
                                    <div
                                      key={label}
                                      className="rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2"
                                    >
                                      <p className="text-xs uppercase tracking-wide text-gray-500">
                                        {label}
                                      </p>
                                      <p className="text-gray-200 break-all">
                                        {value}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                {metaEntries.length > 0 && (
                                  <div className="border-t border-gray-800 pt-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                                      Meta
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                      {metaEntries.map(([label, value]) => (
                                        <div
                                          key={label}
                                          className="rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2"
                                        >
                                          <p className="text-xs uppercase tracking-wide text-gray-500">
                                            {label}
                                          </p>
                                          <div className="mt-1 text-gray-200 break-all">
                                            {renderMetaValue(value)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return rows;
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
