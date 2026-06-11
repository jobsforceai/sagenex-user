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

const displayUnilevelLevel = (level: number) => level + 1;

const normalizeUnilevelDescription = (tx: WalletTransaction, value?: string) => {
  if (!value || tx.type !== "UNILEVEL") return value;
  return value.replace(/\bL(\d+)\b/g, (_, raw) => `L${displayUnilevelLevel(Number(raw))}`);
};

const getTransactionTitle = (tx: WalletTransaction) => {
  const description = normalizeUnilevelDescription(tx, tx.description);
  if (description) return description;
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
      <Card className="rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827]">Wallet History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
              <p className="mb-4 text-zinc-500">No transactions found</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#C41E3A] text-white hover:bg-[#ad1b34]"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E8E8E8]">
                    <TableHead className="text-zinc-500">Details</TableHead>
                    <TableHead className="text-zinc-500">Amount</TableHead>
                    <TableHead className="text-zinc-500">Status</TableHead>
                    <TableHead className="text-zinc-500">Date &amp; Time</TableHead>
                    <TableHead className="text-right text-zinc-500">More</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.flatMap((tx) => {
                    const isExpanded = expandedTxId === tx._id;
                    const reference = getTransactionReference(tx);
                    const counterparty = getCounterpartyLabel(tx);
                    const metaEntries = Object.entries(tx.meta || {})
                      .map(([key, value]) => {
                        // For UNILEVEL bonuses, the backend stores level=1 to mean
                        // the depth-2 upline. User-facing UI everywhere else shows
                        // it as Level 2 (since L1 in user terms is the DIRECT bonus).
                        // Shift the displayed level by +1 for consistency with the
                        // Bonus Summary panel.
                        if (tx.type === "UNILEVEL" && (key === "level" || key === "unilevelLevel") && typeof value === "number") {
                          return [formatLabel(key), displayUnilevelLevel(value)] as const;
                        }
                        if (key === "description" && typeof value === "string") {
                          return [formatLabel(key), normalizeUnilevelDescription(tx, value)] as const;
                        }
                        return [formatLabel(key), value] as const;
                      })
                      .filter(([, value]) => !isEmptyValue(value));

                    const detailItems = ([
                      ["Description", normalizeUnilevelDescription(tx, tx.description)],
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
                    ] satisfies Array<readonly [string, unknown]>)
                      .map(([label, value]) => [label, formatDetailValue(value)] as const)
                      .filter(([, value]) => value !== null);

                    const rows = [
                      <TableRow
                        key={tx._id}
                        className="cursor-pointer border-[#E8E8E8] hover:bg-zinc-50"
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
                            <div className="font-medium text-[#111827]">{getTransactionTitle(tx)}</div>
                            <span className="block text-xs text-zinc-500">
                              Type: {getTransactionTypeLabel(tx)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={tx.amount > 0 ? "text-emerald-600" : "text-[#C41E3A]"}>
                          <div className="font-semibold">
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount.toFixed(2)} INR
                          </div>
                          {tx.meta.amountLocal && tx.meta.currencyCode && (
                            <div className="text-xs text-zinc-400">
                              {tx.meta.amountLocal} {tx.meta.currencyCode}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-[#111827]">{tx.status}</div>
                          {tx.method && (
                            <div className="text-xs text-zinc-400">{tx.method}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-500">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-zinc-400">
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
                        <TableRow key={`${tx._id}-expanded`} className="border-[#E8E8E8] bg-[#F8F9FA]">
                          <TableCell colSpan={5} className="py-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                {detailItems.map(([label, value]) => (
                                  <div
                                    key={label}
                                    className="rounded-lg border border-[#E8E8E8] bg-white px-3 py-2"
                                  >
                                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                                      {label}
                                    </p>
                                    <p className="break-all text-[#111827]">{value}</p>
                                  </div>
                                ))}
                              </div>
                              {metaEntries.length > 0 && (
                                <div className="border-t border-[#E8E8E8] pt-4">
                                  <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">
                                    Meta
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                    {metaEntries.map(([label, value]) => (
                                      <div
                                        key={label}
                                        className="rounded-lg border border-[#E8E8E8] bg-white px-3 py-2"
                                      >
                                        <p className="text-xs uppercase tracking-wide text-zinc-400">
                                          {label}
                                        </p>
                                        <div className="mt-1 break-all text-[#111827]">
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
