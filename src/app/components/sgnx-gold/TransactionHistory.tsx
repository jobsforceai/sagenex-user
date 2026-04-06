"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History } from "lucide-react";

interface Enrollment {
  _id: string;
  planType: "gold" | "cash";
  monthlyAmountUsd: number;
  status: string;
  completedMonths: number;
  totalMonths: number;
  bonusGoldQuantityGrams?: number;
  createdAt: string;
}

interface TransactionHistoryProps {
  enrollments: Enrollment[];
}

const formatUSD = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });
const formatDate = (v: string) => new Date(v).toLocaleDateString("en-US");

const statusBadgeClass: Record<string, string> = {
  ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  PAUSED: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
  FAILED: "border-red-500/30 bg-red-500/10 text-red-200",
  COMPLETED: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  MATURED: "border-purple-500/30 bg-purple-500/10 text-purple-200",
};

const planBadgeClass: Record<string, string> = {
  gold: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  cash: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
};

export default function TransactionHistory({ enrollments }: TransactionHistoryProps) {
  if (!enrollments.length) {
    return (
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardContent className="pt-6 pb-6 text-center text-gray-500">
          No enrollments found. Create your first SGNX Gold enrollment!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5 text-blue-400" />
          Enrollment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400">Date</TableHead>
              <TableHead className="text-gray-400">Plan</TableHead>
              <TableHead className="text-gray-400">Monthly Amt</TableHead>
              <TableHead className="text-gray-400">Progress</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Bonus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => {
              const isGold = enrollment.planType === "gold";
              const bonusValue = isGold
                ? enrollment.monthlyAmountUsd * 3
                : enrollment.monthlyAmountUsd * 4;

              return (
                <TableRow
                  key={enrollment._id}
                  className="border-gray-800 hover:bg-gray-800/30"
                >
                  <TableCell className="text-gray-300">
                    {formatDate(enrollment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={planBadgeClass[enrollment.planType] ?? ""}>
                      {enrollment.planType === "gold" ? "Gold" : "Cash"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {formatUSD(enrollment.monthlyAmountUsd)}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    <span className="text-emerald-400 font-medium">
                      {enrollment.completedMonths}
                    </span>
                    <span className="text-gray-500"> / {enrollment.totalMonths}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        statusBadgeClass[enrollment.status] ??
                        statusBadgeClass.ACTIVE
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {isGold
                      ? `${(enrollment.bonusGoldQuantityGrams ?? 0).toFixed(4)} g`
                      : formatUSD(bonusValue)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
