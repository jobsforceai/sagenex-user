"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";

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
    [key: string]: unknown;
  };
}

interface HistoryTabProps {
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
}

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

const getCounterpartyLabel = (tx: WalletTransaction) => {
  const sender = tx.meta.senderName || tx.meta.senderId || tx.fromUserId;
  const recipient = tx.meta.recipientName || tx.meta.recipientId || tx.toUserId;
  if (sender && recipient) return `${sender} → ${recipient}`;
  if (sender) return `From ${sender}`;
  if (recipient) return `To ${recipient}`;
  return null;
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

const renderMetaValue = (value: unknown, depth = 0): React.ReactNode => {
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

export const HistoryTab = ({ transactions, loading, error }: HistoryTabProps) => {
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  return (
    <div className="mt-6">
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardHeader>
          <CardTitle>Wallet History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 mb-4">
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No transactions found</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-emerald-500 hover:bg-emerald-600 text-black"
              >
                Refresh
              </Button>
            </div>
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
                      ["Currency", tx.currency || "INR"],
                      ["Created By", tx.createdBy],
                    ]
                      .map(([label, value]) => [label, formatDetailValue(value)] as const)
                      .filter(([, value]) => value !== null);

                    const rows = [
                      <TableRow
                        key={tx._id}
                        className="border-gray-800 cursor-pointer hover:bg-gray-900/40"
                        onClick={() => setExpandedTxId(isExpanded ? null : tx._id)}
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
                            {tx.amount.toFixed(2)} {tx.currency || "INR"}
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
                                    <p className="text-gray-200 break-all">{value}</p>
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
  );
};
