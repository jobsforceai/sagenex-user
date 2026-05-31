"use client";

/**
 * Sagenex AI assistant — SSE-streaming chat.
 *
 * Connects to POST /api/v1/ai-agent/chat/stream with the user's JWT and
 * streams tokens back via Server-Sent Events. Replaces the previous
 * non-streaming `askChatbot` flow.
 *
 * Event schema (matches sagenex-backend/src/ai-agent/ai-agent.controller.ts):
 *   meta       — { conversationId, userId, status }
 *   provider   — { provider: 'nova'|'gemini', modelId }
 *   tool_start — { name }
 *   tool_done  — { name }
 *   delta      — { text }      (sanitised, user-visible tokens)
 *   blocked    — { conversationId, status: 'BLOCKED', message }
 *   error      — { conversationId, status: 'FAIL', message }
 *   done       — { conversationId, status: 'PASS', toolsUsed, provider }
 */

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2, Wrench, Sparkles } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

type Msg = {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  provider?: "nova" | "gemini";
  status?: "PASS" | "BLOCKED" | "FAIL";
};

const SUGGESTIONS = [
  "What's my current balance?",
  "What is my Fancy ID?",
  "How many flight tickets have I earned?",
  "When is my next ROI?",
];

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

/** Read auth token from document.cookie. Returns empty string if not present. */
const getAuthToken = (): string => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

/** Parse a single SSE chunk from the buffer. Returns { events, remainder }. */
const parseSseChunks = (raw: string): { events: Array<{ event: string; data: string }>; remainder: string } => {
  const events: Array<{ event: string; data: string }> = [];
  const parts = raw.split("\n\n");
  const remainder = parts.pop() ?? "";
  for (const block of parts) {
    if (!block.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length) events.push({ event, data: dataLines.join("\n") });
  }
  return { events, remainder };
};

export default function ChatbotAssistant() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [provider, setProvider] = useState<"nova" | "gemini" | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeTools, streaming]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  if (!isAuthenticated) return null;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const token = getAuthToken();
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Please sign in to chat with the assistant.", status: "FAIL" },
      ]);
      return;
    }

    setInput("");
    setActiveTools([]);
    setProvider(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setStreaming(true);

    // Optimistic empty assistant slot we'll patch as tokens arrive.
    const assistantIdx = messages.length + 1; // current user msg is at length, assistant at length+1
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const ac = new AbortController();
    abortRef.current = ac;
    let buffer = "";
    let assistantText = "";
    let finalStatus: "PASS" | "BLOCKED" | "FAIL" = "PASS";
    let finalToolsUsed: string[] = [];
    let finalProvider: "nova" | "gemini" | undefined;

    try {
      const res = await fetch(`${API_BASE}/api/v1/ai-agent/chat/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message: trimmed }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${body.slice(0, 100)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseChunks(buffer);
        buffer = remainder;

        for (const ev of events) {
          let parsed: any = {};
          try { parsed = JSON.parse(ev.data); } catch { /* keep empty */ }

          switch (ev.event) {
            case "provider":
              if (parsed.provider) {
                setProvider(parsed.provider);
                finalProvider = parsed.provider;
              }
              break;
            case "tool_start":
              if (parsed.name) setActiveTools((prev) => [...prev, parsed.name]);
              break;
            case "tool_done":
              // intentional no-op — keep the tool listed for the final message
              break;
            case "delta":
              if (typeof parsed.text === "string") {
                assistantText += parsed.text;
                setMessages((prev) => {
                  const next = [...prev];
                  if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], content: assistantText };
                  return next;
                });
              }
              break;
            case "blocked":
              finalStatus = "BLOCKED";
              if (!assistantText) {
                assistantText = "I can't help with that — try a different question.";
                setMessages((prev) => {
                  const next = [...prev];
                  if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], content: assistantText };
                  return next;
                });
              }
              break;
            case "error":
              finalStatus = "FAIL";
              if (!assistantText) {
                assistantText = "Something went wrong. Try again in a moment.";
                setMessages((prev) => {
                  const next = [...prev];
                  if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], content: assistantText };
                  return next;
                });
              }
              break;
            case "done":
              finalStatus = parsed.status ?? "PASS";
              finalToolsUsed = Array.isArray(parsed.toolsUsed) ? parsed.toolsUsed : [];
              if (parsed.provider) finalProvider = parsed.provider;
              break;
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        finalStatus = "FAIL";
        if (!assistantText) {
          assistantText = "Couldn't reach the assistant. Check your connection and try again.";
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIdx]) next[assistantIdx] = { ...next[assistantIdx], content: assistantText };
            return next;
          });
        }
      }
    } finally {
      setMessages((prev) => {
        const next = [...prev];
        if (next[assistantIdx]) {
          next[assistantIdx] = {
            ...next[assistantIdx],
            toolsUsed: finalToolsUsed,
            provider: finalProvider,
            status: finalStatus,
          };
        }
        return next;
      });
      setActiveTools([]);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Sagenex assistant"
        className="fixed bottom-[148px] right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C81E4A] text-white shadow-[0_10px_30px_rgba(200,30,74,0.35)] transition hover:bg-[#A90D32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E4A]/50 md:bottom-20"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-2 bottom-[208px] z-50 flex w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:right-4 sm:left-auto sm:w-[380px] md:bottom-36">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-[#C81E4A] to-[#7A001F] px-4 py-3 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                Sagenex AI {provider && <span className="ml-1 normal-case tracking-normal text-white/60">· {provider}</span>}
              </p>
              <p className="text-sm font-black">Ask anything about your account</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] px-3 py-3"
            style={{ minHeight: 320, maxHeight: 420 }}
          >
            {messages.length === 0 && (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-bold text-[#0F172A]">Hi 👋 Ask about your wallet, rank, team, bonuses, deposits, gold plan, tickets, or rewards.</p>
                <p className="text-xs text-[#64748B]">Read-only — I can only see your own account.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-[#0F172A] hover:bg-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] space-y-1 rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#C81E4A] text-white"
                      : m.status === "BLOCKED"
                        ? "border border-amber-200 bg-amber-50 text-amber-900"
                        : m.status === "FAIL"
                          ? "border border-red-200 bg-red-50 text-red-900"
                          : "border border-slate-200 bg-white text-[#0F172A]"
                  }`}
                >
                  {m.content || (m.role === "assistant" && streaming && i === messages.length - 1
                    ? <span className="inline-flex items-center gap-1 text-[#64748B]"><Loader2 className="h-3 w-3 animate-spin" /> thinking…</span>
                    : null
                  )}
                  {m.role === "assistant" && m.toolsUsed && m.toolsUsed.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 border-t border-slate-100 pt-1 text-[10px] text-[#64748B]">
                      {m.toolsUsed.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                          <Wrench className="h-2.5 w-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {streaming && activeTools.length > 0 && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#64748B]">
                  <Sparkles className="h-3 w-3 animate-pulse text-[#C81E4A]" />
                  Looking up {activeTools[activeTools.length - 1]}…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={streaming}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E4A]/30 disabled:opacity-60"
              maxLength={1500}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C81E4A] text-white transition hover:bg-[#A90D32] disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
