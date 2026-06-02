"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getBackendBaseUrl } from "@/lib/api-base";

/**
 * Floating Sync Profile button — renders on every authenticated page
 * (mobile + desktop). Triggers the same /api/v1/user/sync/stream audit
 * that the Navbar's Sync Profile button uses.
 */
export default function SyncProfileFab() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState("");

  if (!isAuthenticated) return null;

  const startSync = async () => {
    setOpen(true);
    setRunning(true);
    setMessages(["Connecting to audit service..."]);
    setDone(false);
    setSummary("");

    try {
      const token = document.cookie
        .split("; ")
        .find((r) => r.startsWith("authToken="))
        ?.split("=")[1];
      const backendUrl = getBackendBaseUrl();
      const res = await fetch(`${backendUrl}/api/v1/user/sync/stream`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok || !res.body) throw new Error("Failed to connect");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";
      while (true) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const line of parts) {
          if (line.startsWith("event: ")) currentEvent = line.slice(7).trim();
          else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === "progress" && data.message) {
                setMessages((prev) => [...prev, data.message]);
              } else if (currentEvent === "done") {
                setDone(true);
                setSummary(data.message ?? "Audit complete.");
              } else if (currentEvent === "error") {
                setDone(true);
                setSummary(data.message ?? "Something went wrong.");
              }
            } catch {}
            currentEvent = "";
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, "Connection error. Please try again."]);
      setDone(true);
      setSummary("Sync failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const close = () => {
    setOpen(false);
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={startSync}
        disabled={running}
        aria-label="Sync profile"
        className="fixed z-40 right-4 bottom-[88px] md:bottom-6 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-[#5a4527] shadow-[0_10px_30px_rgba(131,108,73,0.28)] bg-gradient-to-b from-[#efe3cf] to-[#e1d0b5] hover:from-[#f3e8d8] hover:to-[#e7d8bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9c49f]/70 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{running ? "Syncing..." : "Sync Profile"}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                {!done ? (
                  <svg className="h-4 w-4 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <h3 className="text-base font-semibold text-white">
                {done ? "Audit Complete" : "Audit Scan Running..."}
              </h3>
            </div>
            <div className="mb-4 max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-black/30 p-3">
              {messages.map((m, i) => (
                <p key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="mt-0.5 text-emerald-400">›</span>
                  {m}
                </p>
              ))}
              {!done && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-500 animate-pulse">
                  <span className="text-emerald-500">›</span> Working...
                </p>
              )}
            </div>
            {done && (
              <>
                <p className="mb-4 text-sm text-zinc-300">{summary}</p>
                <button
                  onClick={close}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                >
                  Close &amp; Refresh
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
