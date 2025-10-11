// components/ReferralGrowthTools.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
// If you can add this package:  npm i react-qr-code
// Otherwise, keep the fallback box below.
import QRCode from "react-qr-code";

type Props = {
  referralLink: string;
  onCopy: () => void;
  totalReferrals: number;
  activeAgents: number;
  investedAgents: number;
  downlineVolumeLabel?: string; // e.g. "₹108.0L"
};

export default function ReferralGrowthTools({
  referralLink,
  onCopy,
  totalReferrals,
  activeAgents,
  investedAgents,
  downlineVolumeLabel,
}: Props) {
  const qrValue = useMemo(() => referralLink || "", [referralLink]);

  return (
    <Card className="bg-[#0b0b0b] border border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl md:text-2xl tracking-tight">
          Referral &amp; Growth Tools
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-8">
          {/* Left Column: QR Code */}
          <div className=" flex justify-start flex-row">
            <div className="p-2 bg-white left-0 rounded-lg w-fit">
              {qrValue ? (
                <QRCode value={qrValue} size={120} />
              ) : (
                <div className="h-[120px] w-[120px] rounded-md bg-neutral-900" />
              )}
            </div>
            <div className=" ml-4 font-semibold text-start">
              <h3 className=" text-2xl">Share via QR</h3>
              <p className="text-xl text-neutral-400">
                Agents can scan to join your downline.
              </p>
            </div>
          </div>

          {/* Right Column: Link and Stats */}
          <div className="space-y-6">
            {/* Link + copy */}
            <div>
              <label className="text-sm font-medium text-neutral-300">
                Your Referral Link
              </label>
              <div className="relative mt-1">
                <Input
                  value={referralLink}
                  readOnly
                  className="bg-black/40 border-neutral-800 text-neutral-200 pr-12 font-mono"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onCopy}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white"
                  aria-label="Copy referral link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBlock
                label="Total Referrals"
                value={Intl.NumberFormat().format(totalReferrals)}
              />
              <StatBlock
                label="Active Agents"
                value={Intl.NumberFormat().format(activeAgents)}
                valueClass="text-green-400"
              />
              <StatBlock
                label="Invested Agents"
                value={Intl.NumberFormat().format(investedAgents)}
              />
              <StatBlock
                label="Downline Volume"
                value={downlineVolumeLabel ?? "—"}
                valueClass="tabular-nums"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBlock({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-black/40 border border-neutral-800 px-5 py-6">
      <div className="text-neutral-400 text-sm">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${valueClass ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
