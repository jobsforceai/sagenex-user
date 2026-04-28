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
  { badge: string; card: string; button: string; title: string; body: string }
> = {
  INFO: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    card: "border-sky-200 bg-sky-50",
    button: "bg-sky-600 text-white hover:bg-sky-700",
    title: "text-[#0F172A]",
    body: "text-[#475569]",
  },
  SUCCESS: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    card: "border-emerald-200 bg-emerald-50",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    title: "text-[#0F172A]",
    body: "text-[#475569]",
  },
  WARNING: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    card: "border-amber-200 bg-amber-50",
    button: "bg-amber-500 text-white hover:bg-amber-600",
    title: "text-[#0F172A]",
    body: "text-[#475569]",
  },
  DANGER: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    card: "border-rose-200 bg-rose-50",
    button: "bg-[#C81E4A] text-white hover:bg-[#A90D32]",
    title: "text-[#0F172A]",
    body: "text-[#475569]",
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
        if (!cancelled) onUpdatesLoaded?.(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const bannerUpdates = useMemo(() => userUpdates.filter((u) => u.type === "BANNER"), [userUpdates]);
  const modalUpdates = useMemo(() => userUpdates.filter((u) => u.type === "MODAL"), [userUpdates]);
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
    setTimeout(() => {
      setUserUpdates((prev) => prev.filter((item) => item._id !== update._id));
    }, 0);
  };

  const renderCta = (update: UserUpdate, className: string) => {
    if (!update.ctaLabel || !update.ctaUrl) return null;
    const common = {
      className: `rounded-xl px-4 py-2 text-sm font-bold ${className}`,
      onClick: () => dismissAfterCta(update),
    };
    if (isExternal(update.ctaUrl)) {
      return (<a href={update.ctaUrl} target="_blank" rel="noreferrer" {...common}>{update.ctaLabel}</a>);
    }
    return (<Link href={update.ctaUrl} {...common}>{update.ctaLabel}</Link>);
  };

  const banner = bannerUpdates.length ? (
    <div className="mb-6 space-y-3">
      {bannerUpdates.map((update) => (
        <div
          key={update._id}
          className={`rounded-2xl border px-4 py-3 text-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${themeStyles[update.theme].card}`}
        >
          <div className="flex items-start gap-3">
            <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${themeStyles[update.theme].badge}`}>
              {update.theme}
            </span>
            <div>
              <p className={`font-black ${themeStyles[update.theme].title}`}>{update.title}</p>
              <p className={`${themeStyles[update.theme].body}`}>{update.body}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderCta(update, themeStyles[update.theme].button)}
            {update.dismissible !== false && (
              <button type="button" onClick={() => dismissBanner(update)} className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]">
                Dismiss
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const modal = activeModal ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.3em] ${themeStyles[activeModal.theme].badge}`}>
              {activeModal.theme}
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0F172A]">{activeModal.title}</h2>
          </div>
          {activeModal.dismissible !== false && (
            <button type="button" onClick={() => closeModal(activeModal)} aria-label="Close"
              className="rounded-full border border-slate-200 bg-white p-2 text-[#64748B] transition hover:bg-slate-50 hover:text-[#0F172A]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {activeModal.imageUrl && (
            <img src={activeModal.imageUrl} alt={activeModal.title} className="h-40 w-full rounded-2xl object-cover" />
          )}
          <p className="text-sm leading-relaxed text-[#475569]">{activeModal.body}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {renderCta(activeModal, themeStyles[activeModal.theme].button)}
          {activeModal.dismissible !== false && (
            <button type="button" onClick={() => markUpdateDone(activeModal)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0F172A] hover:bg-slate-50">
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
