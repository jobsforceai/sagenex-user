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
import { formatINR } from "@/lib/currency";

interface Enrollment {
  _id: string;
  planType: "gold" | "cash";
  monthlyAmountUsd: number;
  monthlyAmountInr?: number;
  status: string;
  completedMonths: number;
  totalMonths: number;
  bonusGoldQuantityGrams?: number;
  createdAt: string;
}

interface TransactionHistoryProps {
  enrollments: Enrollment[];
}

const formatDate = (v: string) => new Date(v).toLocaleDateString("en-US");

const statusBadgeClass: Record<string, string> = {
  ACTIVE: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
  PAUSED: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
  FAILED: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
  COMPLETED: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
  MATURED: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
};

const planBadgeClass: Record<string, string> = {
  gold: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
  cash: "border-[#E8E8E8] bg-[#F8F9FA] text-zinc-600",
};

export default function TransactionHistory({ enrollments }: TransactionHistoryProps) {
  if (!enrollments.length) {
    return (
      <Card className="bg-white border-[#E8E8E8] rounded-2xl">
        <CardContent className="pt-6 pb-6 text-center text-zinc-500">
          No enrollments found. Create your first SGNX Gold enrollment!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#E8E8E8] rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#111827]">
          <History className="h-5 w-5 text-[#C41E3A]" />
          Enrollment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-[#E8E8E8] hover:bg-transparent">
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-zinc-400">Plan</TableHead>
              <TableHead className="text-zinc-400">Monthly Amt</TableHead>
              <TableHead className="text-zinc-400">Progress</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Bonus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => {
              const isGold = enrollment.planType === "gold";
              const monthlyAmount = enrollment.monthlyAmountInr ?? enrollment.monthlyAmountUsd;
              const bonusValue = isGold ? monthlyAmount * 3 : monthlyAmount * 4;

              return (
                <TableRow
                  key={enrollment._id}
                  className="border-[#E8E8E8] hover:bg-[#F8F9FA]"
                >
                  <TableCell className="text-zinc-600">
                    {formatDate(enrollment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={planBadgeClass[enrollment.planType] ?? ""}>
                      {enrollment.planType === "gold" ? "Gold" : "Cash"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {formatINR(monthlyAmount)}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    <span className="font-medium text-[#C41E3A]">
                      {enrollment.completedMonths}
                    </span>
                    <span className="text-zinc-400"> / {enrollment.totalMonths}</span>
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
                  <TableCell className="text-zinc-600">
                    {isGold
                      ? `${(enrollment.bonusGoldQuantityGrams ?? 0).toFixed(4)} g`
                      : formatINR(bonusValue)}
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
