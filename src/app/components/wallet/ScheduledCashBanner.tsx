"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, Calendar, MapPin, Phone, User } from "lucide-react";
import { getUserCashWithdrawals } from "@/actions/user";

interface ScheduledCashWithdrawal {
  _id: string;
  amount: number;
  grossAmount?: number;
  status: string;
  location?: string;
  scheduledAt?: string;
  contactName?: string;
  contactPhone?: string;
}

interface ScheduledCashBannerProps {
  className?: string;
}

const formatINR = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const ScheduledCashBanner = ({ className }: ScheduledCashBannerProps) => {
  const [items, setItems] = useState<ScheduledCashWithdrawal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUserCashWithdrawals()
      .then((res) => {
        if (cancelled) return;
        if (!res?.error && Array.isArray(res)) {
          setItems(res.filter((cw: ScheduledCashWithdrawal) => cw.status === "SCHEDULED"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {items.map((cw) => (
        <div
          key={cw._id}
          className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/70 to-emerald-50 p-4 shadow-[0_10px_30px_rgba(217,119,6,0.15)] sm:p-5"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                    Scheduled
                  </span>
                  <span className="text-sm font-black text-[#0F172A]">
                    Cash Pickup {formatINR(cw.amount)}
                  </span>
                  {cw.grossAmount && cw.grossAmount !== cw.amount && (
                    <span className="text-[11px] text-zinc-500">
                      ({formatINR(cw.grossAmount)} debited)
                    </span>
                  )}
                </div>
                <div className="mt-2 grid gap-1.5 text-xs text-[#1F2937] sm:grid-cols-2">
                  {cw.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-700" />
                      <span className="font-semibold">{cw.location}</span>
                    </div>
                  )}
                  {cw.scheduledAt && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-700" />
                      <span className="font-semibold">
                        {new Date(cw.scheduledAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  )}
                  {cw.contactName && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-700" />
                      <span className="font-semibold">{cw.contactName}</span>
                    </div>
                  )}
                  {cw.contactPhone && (
                    <a
                      href={`tel:${cw.contactPhone}`}
                      className="flex items-center gap-1.5 text-emerald-700 underline-offset-2 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span className="font-semibold">{cw.contactPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/wallet"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-amber-400 bg-white px-3 text-xs font-bold text-amber-800 hover:bg-amber-50"
            >
              Manage
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduledCashBanner;
