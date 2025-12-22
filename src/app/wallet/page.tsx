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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWalletData, getDashboardData, getKycStatus } from "@/actions/user";
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
    progressAtUnlock?: number | { team: number; directs: number };
    senderId?: string;
    senderName?: string;
    recipientId?: string;
    recipientName?: string;
    transactionId?: string;
    transferType?: string;
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
        team: { current: number; required: number };
        directs: { current: number; required: number };
    };
}

interface WalletSummary {
  availableBalance: number;
  bonuses: LockedBonus[];
}

const LockedBonusesCard = ({ bonuses }: { bonuses: LockedBonus[] | undefined }) => {
    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Locked Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
                {bonuses && bonuses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {bonuses.map(bonus => {
                            const teamProgress = Math.min(100, (bonus.progress.team?.current / bonus.progress.team.required) * 100);
                            const directsProgress = Math.min(100, (bonus.progress.directs?.current / bonus.progress.directs?.required) * 100);
                            
                            return (
                                <div key={bonus.level} className="p-4 rounded-lg bg-gray-800/60 border border-gray-700/50 shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            {bonus.isUnlocked ? (
                                                <Unlock className="text-emerald-400 h-5 w-5" />
                                            ) : (
                                                <Lock className="text-amber-400 h-5 w-5" />
                                            )}
                                            <p className="text-gray-200 font-semibold">{bonus.name}</p>
                                        </div>
                                        <span className={`font-bold text-xl ${bonus.isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${bonus.lockedAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-400 flex justify-between mb-1.5">
                                                <span>Team Progress</span>
                                                <span className="font-medium">{bonus.progress.team.current} / {bonus.progress.team.required}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                <div 
                                                    className="bg-sky-500 h-2.5 rounded-full" 
                                                    style={{ width: `${teamProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 flex justify-between mb-1.5">
                                                <span>Directs Progress</span>
                                                <span className="font-medium">{bonus.progress.directs?.current} / {bonus.progress.directs?.required}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                <div 
                                                    className="bg-emerald-500 h-2.5 rounded-full" 
                                                    style={{ width: `${directsProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
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
  if (tx.type === "BONUS_UNLOCK") return "Bonus Unlocked";
  if (tx.type === "ROI") return "SPECIAL BONUS";
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

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6 pt-20 sm:pt-24 space-y-8">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Wallet</h1>
          <p className="text-gray-400 mt-2">Manage your funds, view transactions, and upgrade your plan.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
              <div className="space-y-6 sm:space-y-8">
                <Card className="bg-gray-900/40 border-gray-800 w-full sm:max-w-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">Available Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-emerald-400">
                      ${walletSummary?.availableBalance.toFixed(2) ?? '0.00'}
                    </p>
                  </CardContent>
                </Card>
                <FundTransfer currentBalance={walletSummary?.availableBalance ?? 0} />
              </div>
              <div className="space-y-6 sm:space-y-8">
                <TransferToSGChain currentBalance={walletSummary?.availableBalance ?? 0} />
                <RedeemFromSGChain onSuccess={fetchData} />
              </div>
            </div>
          </div>
          <div className="xl:col-span-1 space-y-6 sm:space-y-8">
            <CryptoDeposit />
            <WithdrawalRequest 
                currentBalance={walletSummary?.availableBalance ?? 0}
                kycStatus={kycStatus?.status}
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
                        ["Type", tx.type],
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
                              {tx.sourceType && (
                                <span className="text-gray-500 text-xs block">
                                  Source: {tx.sourceType}
                                </span>
                              )}
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
