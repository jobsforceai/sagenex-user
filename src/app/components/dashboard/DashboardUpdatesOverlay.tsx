"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getUserUpdates } from "@/actions/user";

type UserUpdate = {
  _id: string;
  title: string;
  body: string;
  type: "MODAL" | "BANNER";
  theme: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  dismissible?: boolean;
  showOnce?: boolean;
};

const themeStyles: Record<
  UserUpdate["theme"],
  { badge: string; card: string; button: string }
> = {
  INFO: {
    badge: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    card: "border-blue-500/30 bg-blue-500/10",
    button: "bg-blue-500 text-black hover:bg-blue-400",
  },
  SUCCESS: {
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    card: "border-emerald-500/30 bg-emerald-500/10",
    button: "bg-emerald-500 text-black hover:bg-emerald-400",
  },
  WARNING: {
    badge: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    card: "border-amber-500/30 bg-amber-500/10",
    button: "bg-amber-400 text-black hover:bg-amber-300",
  },
  DANGER: {
    badge: "bg-red-500/20 text-red-200 border-red-500/30",
    card: "border-red-500/30 bg-red-500/10",
    button: "bg-red-500 text-black hover:bg-red-400",
  },
};

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

const DashboardUpdatesOverlay = memo(function DashboardUpdatesOverlay({
  token,
  onModalChange,
  onUpdatesLoaded,
}: {
  token?: string | null;
  onModalChange?: (active: boolean) => void;
  onUpdatesLoaded?: (hasModal: boolean) => void;
}) {
  const [userUpdates, setUserUpdates] = useState<UserUpdate[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // One-time cleanup: remove stale update-done keys from before the showOnce fix
    if (!localStorage.getItem("update-done-cleanup-v1")) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("update-done:")) localStorage.removeItem(key);
      });
      localStorage.setItem("update-done-cleanup-v1", "true");
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await getUserUpdates();
        const updates: UserUpdate[] = res?.updates || [];

        const filtered = updates.filter((u) => {
          if (u.type === "MODAL") {
            // Only persist dismissal if showOnce is true
            if (u.showOnce && localStorage.getItem(`update-done:${u._id}`)) return false;
            return true;
          }
          if (!u.showOnce) return true;
          return !localStorage.getItem(`update-dismissed:${u._id}`);
        });

        if (!cancelled) {
          setUserUpdates(filtered);
          const hasModal = filtered.some((update) => update.type === "MODAL");
          onUpdatesLoaded?.(hasModal);
        }
      } catch {
        // ignore
        if (!cancelled) onUpdatesLoaded?.(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const bannerUpdates = useMemo(
    () => userUpdates.filter((u) => u.type === "BANNER"),
    [userUpdates]
  );
  const modalUpdates = useMemo(
    () => userUpdates.filter((u) => u.type === "MODAL"),
    [userUpdates]
  );
  const activeModal = modalUpdates[0];

  useEffect(() => {
    onModalChange?.(Boolean(activeModal));
  }, [activeModal, onModalChange]);

  const dismissBanner = (update: UserUpdate) => {
    if (update.showOnce) localStorage.setItem(`update-dismissed:${update._id}`, "true");
    setUserUpdates((prev) => prev.filter((item) => item._id !== update._id));
  };

  const closeModal = (update: UserUpdate) => {
    setUserUpdates((prev) => prev.filter((item) => item._id !== update._id));
  };

  const markUpdateDone = (update: UserUpdate) => {
    if (update.showOnce) localStorage.setItem(`update-done:${update._id}`, "true");
    setUserUpdates((prev) => prev.filter((item) => item._id !== update._id));
  };

  const dismissAfterCta = (update: UserUpdate) => {
    if (update.showOnce) localStorage.setItem(`update-done:${update._id}`, "true");
    // Defer removal so the current CTA href is used for navigation.
    setTimeout(() => {
      setUserUpdates((prev) => prev.filter((item) => item._id !== update._id));
    }, 0);
  };

  const renderCta = (update: UserUpdate, className: string) => {
    if (!update.ctaLabel || !update.ctaUrl) return null;

    const common = {
      className: `rounded-lg px-4 py-2 text-sm font-semibold ${className}`,
      onClick: () => dismissAfterCta(update),
    };

    if (isExternal(update.ctaUrl)) {
      return (
        <a href={update.ctaUrl} target="_blank" rel="noreferrer" {...common}>
          {update.ctaLabel}
        </a>
      );
    }

    return (
      <Link href={update.ctaUrl} {...common}>
        {update.ctaLabel}
      </Link>
    );
  };

  const banner = bannerUpdates.length ? (
    <div className="mb-6 space-y-3">
      {bannerUpdates.map((update) => (
        <div
          key={update._id}
          className={`rounded-2xl border px-4 py-3 text-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${themeStyles[update.theme].card}`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${themeStyles[update.theme].badge}`}
            >
              {update.theme}
            </span>
            <div>
              <p className="font-semibold text-white">{update.title}</p>
              <p className="text-white/70">{update.body}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderCta(update, themeStyles[update.theme].button)}
            {update.dismissible !== false && (
              <button
                type="button"
                onClick={() => dismissBanner(update)}
                className="text-xs text-white/70 hover:text-white"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const modal = activeModal ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${themeStyles[activeModal.theme].badge}`}
            >
              {activeModal.theme}
            </span>
            <h2 className="mt-3 text-2xl font-semibold">{activeModal.title}</h2>
          </div>

          {activeModal.dismissible !== false && (
            <button
              type="button"
              onClick={() => closeModal(activeModal)}
              className="rounded-full border border-white/10 p-2 text-white/70 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {activeModal.imageUrl && (
            <img
              src={activeModal.imageUrl}
              alt={activeModal.title}
              className="h-40 w-full rounded-xl object-cover"
            />
          )}
          <p className="text-sm text-white/70 leading-relaxed">{activeModal.body}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {renderCta(activeModal, themeStyles[activeModal.theme].button)}
          {activeModal.dismissible !== false && (
            <button
              type="button"
              onClick={() => markUpdateDone(activeModal)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:border-white/30 hover:text-white"
            >
              Already done
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {banner}
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
});

export default DashboardUpdatesOverlay;
