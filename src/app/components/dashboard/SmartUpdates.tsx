"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";
import { getUserUpdates } from "@/actions/user";

type UserUpdate = {
  _id: string;
  title: string;
  body: string;
  type: "MODAL" | "BANNER";
  theme: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  createdAt?: string | null;
};

const themeStyles: Record<UserUpdate["theme"], { badge: string; button: string }> = {
  INFO: {
    badge: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    button: "bg-blue-500 text-black hover:bg-blue-400",
  },
  SUCCESS: {
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    button: "bg-emerald-500 text-black hover:bg-emerald-400",
  },
  WARNING: {
    badge: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    button: "bg-amber-400 text-black hover:bg-amber-300",
  },
  DANGER: {
    badge: "bg-red-500/20 text-red-200 border-red-500/30",
    button: "bg-red-500 text-black hover:bg-red-400",
  },
};

const formatTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "Just now";

const isExternal = (url: string) => /^https?:\/\//i.test(url);

const SmartUpdates = () => {
  const [updates, setUpdates] = useState<UserUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getUserUpdates();
        const list: UserUpdate[] = res?.updates || [];
        if (!cancelled) setUpdates(list);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load updates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle>Smart Updates</CardTitle>
      </CardHeader>
      <CardContent className="max-h-72 overflow-y-auto pr-2">
        {loading && <p className="text-sm text-muted-foreground">Loading updates...</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}
        {!loading && !error && updates.length === 0 && (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        )}
        {updates.map((update, index) => (
          <div
            key={update._id}
            className={`flex gap-4 py-4 ${index === 0 ? "pt-0" : ""} border-b border-white/10 last:border-0`}
          >
            <div className="mt-0.5 h-10 w-10 shrink-0 rounded-xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-300" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${themeStyles[update.theme].badge}`}
                  >
                    {update.theme}
                  </span>
                  <p className="text-xs text-white/50">
                    {formatTime(update.createdAt)}
                  </p>
                </div>
                {update.ctaLabel && update.ctaUrl && (
                  <div className="shrink-0">
                    {isExternal(update.ctaUrl) ? (
                      <a
                        href={update.ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${themeStyles[update.theme].button} shadow-sm shadow-black/20`}
                      >
                        {update.ctaLabel}
                      </a>
                    ) : (
                      <Link
                        href={update.ctaUrl}
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${themeStyles[update.theme].button} shadow-sm shadow-black/20`}
                      >
                        {update.ctaLabel}
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{update.title}</p>
                <p className="text-sm text-white/70">{update.body}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SmartUpdates;
