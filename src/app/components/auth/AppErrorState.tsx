"use client";

import type { ReactNode } from "react";

type AppErrorStateProps = {
  title: string;
  message: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function AppErrorState({
  title,
  message,
  icon,
  actions,
  className = "",
}: AppErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className}`}
      role="alert"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        {icon && <div className="mx-auto flex justify-center">{icon}</div>}
        <h2 className={`text-xl font-black text-[#0F172A] ${icon ? "mt-5" : ""}`}>{title}</h2>
        <p className="mt-2 text-sm text-[#64748B]">{message}</p>
        {actions && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>}
      </div>
    </div>
  );
}
