"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleCompounding, getCompoundingStatus } from "@/actions/user";

export const CompoundingToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const [isPackageActive, setIsPackageActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getCompoundingStatus().then((res) => {
      if (!res?.error) {
        setEnabled(res?.compoundingEnabled ?? false);
        setIsPackageActive(res?.isPackageActive ?? false);
      }
      setLoading(false);
    });
  }, []);

  const handleToggle = async () => {
    if (toggling || !isPackageActive) return;
    setToggling(true);
    try {
      const res = await toggleCompounding();
      if (res?.error) {
        toast.error(res.error);
      } else {
        setEnabled(res.compoundingEnabled);
        toast.success(res.message);
      }
    } catch {
      toast.error("Failed to update compounding setting.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) return null;
  if (!isPackageActive) return null;

  return (
    <Card className="rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">Auto-Compounding</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {enabled
                ? "Your monthly ROI is automatically reinvested into your package."
                : "Enable to auto-reinvest monthly ROI into your package for compounding growth."}
            </p>
          </div>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-2">
          {toggling && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={toggling}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
