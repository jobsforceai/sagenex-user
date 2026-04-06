"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEnrollmentDetail } from "@/actions/sgnxgold";
import { CalendarCheck, Loader2 } from "lucide-react";

interface MonthlyRecord {
  month: number;
  status: "PAID" | "PENDING" | "FAILED" | "UPCOMING";
  paidAt?: string;
  amountUsd?: number;
}

interface PaymentProgressProps {
  enrollmentId: string;
}

const statusStyles: Record<string, { bg: string; border: string; label: string }> = {
  PAID: { bg: "bg-emerald-500", border: "border-emerald-400", label: "Paid" },
  PENDING: { bg: "bg-yellow-500", border: "border-yellow-400", label: "Pending" },
  FAILED: { bg: "bg-red-500", border: "border-red-400", label: "Failed" },
  UPCOMING: { bg: "bg-gray-700", border: "border-gray-600", label: "Upcoming" },
};

export default function PaymentProgress({ enrollmentId }: PaymentProgressProps) {
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const result = await getEnrollmentDetail(enrollmentId);
        if (cancelled) return;
        if (result?.error) {
          setError(result.error);
          return;
        }

        const monthlyRecords: MonthlyRecord[] = result.monthlyRecords ?? [];

        // Fill up to 11 months if missing
        const filled: MonthlyRecord[] = [];
        for (let m = 1; m <= 11; m++) {
          const existing = monthlyRecords.find((r: MonthlyRecord) => r.month === m);
          if (existing) {
            filled.push(existing);
          } else {
            filled.push({ month: m, status: "UPCOMING" });
          }
        }
        setRecords(filled);
      } catch {
        if (!cancelled) setError("Failed to load payment progress.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  if (loading) {
    return (
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardContent className="pt-6 pb-6 flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment progress...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardContent className="pt-6 pb-6 text-center text-red-400">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CalendarCheck className="h-5 w-5 text-emerald-400" />
          11-Month Payment Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Month grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-3">
          {records.map((record) => {
            const style = statusStyles[record.status] ?? statusStyles.UPCOMING;
            return (
              <div
                key={record.month}
                className={`flex flex-col items-center justify-center rounded-xl border ${style.border} bg-gray-800/40 p-3 gap-1`}
              >
                <div
                  className={`h-3 w-3 rounded-full ${style.bg}`}
                />
                <span className="text-xs font-medium text-white">
                  M{record.month}
                </span>
                <span className="text-[10px] text-gray-400">{style.label}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-800">
          {Object.entries(statusStyles).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${style.bg}`} />
              <span className="text-xs text-gray-400">{style.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
