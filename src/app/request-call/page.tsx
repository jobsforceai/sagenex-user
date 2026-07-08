"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PhoneCall } from "lucide-react";
import { getDashboardData, requestTelebeliCall } from "@/actions/user";
import { useAuth } from "@/app/context/AuthContext";
import { DashboardSkeleton } from "@/app/components/dashboard/DashboardSkeletons";

export default function RequestCallPage() {
  const { token } = useAuth();
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<"hi" | "en" | "te">("hi");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getDashboardData()
      .then((res) => {
        if (res?.error) toast.error(res.error);
        if (res?.profile?.phone) setPhone(res.profile.phone);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const digits = phone.replace(/\D/g, "");
  const invalidPhone = !digits || /^0+$/.test(digits);

  const submit = async () => {
    if (invalidPhone) return toast.error("Please enter a valid phone number.");
    setSubmitting(true);
    try {
      const result = await requestTelebeliCall({ phone, language });
      if (result?.error) return toast.error(result.error);
      if (result?.phone) setPhone(result.phone);
      toast.success(result?.message || "Call queued. You should receive a call shortly.");
    } catch {
      toast.error("Unable to request call right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-[#0F172A]">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Support</p>
            <h1 className="mt-1 text-2xl font-black">Request Call</h1>
          </div>
          <PhoneCall className="h-7 w-7 text-[#C41E3A]" />
        </div>

        <div className="mt-5 space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none transition focus:border-[#C41E3A] focus:bg-white"
          />
          {invalidPhone && <p className="text-xs font-semibold text-amber-700">Add your mobile number before requesting a call.</p>}

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "hi", label: "Hindi" },
              { value: "en", label: "English" },
              { value: "te", label: "Telugu" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setLanguage(item.value as "hi" | "en" | "te")}
                className={`rounded-xl px-2 py-2 text-xs font-black transition ${
                  language === item.value ? "bg-[#C41E3A] !text-white" : "bg-slate-100 text-[#64748B] hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting || invalidPhone}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F172A] py-3 text-sm font-black !text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <PhoneCall className="h-4 w-4" />
            {submitting ? "Requesting..." : "Request Call"}
          </button>
        </div>

        <Link href="/dashboard" className="mt-4 inline-block text-sm font-bold text-[#C41E3A]">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
