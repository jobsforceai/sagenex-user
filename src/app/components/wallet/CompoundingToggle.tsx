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
    <Card className="bg-gray-900/40 border border-gray-800">
      <CardContent className="py-4 px-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-lg bg-green-500/10">
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Auto-Compounding</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {enabled
                ? "Your monthly ROI is automatically reinvested into your package."
                : "Enable to auto-reinvest monthly ROI into your package for compounding growth."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {toggling && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={toggling}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
