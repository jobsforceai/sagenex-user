"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { askChatbot } from "@/actions/user";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's my current balance?",
  "Why didn't I get my unilevel bonus?",
  "What do I need for 4x multiplier?",
  "When is my next ROI?",
];

export default function ChatbotAssistant() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!isAuthenticated) return null;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const history = messages.slice(-8);
      const res: any = await askChatbot(trimmed, history);
      const reply = res?.reply || (res?.error ? `Sorry — ${res.error}.` : "I couldn't reach the assistant. Try again.");
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Support assistant"
        className="fixed bottom-[148px] right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C81E4A] text-white shadow-[0_10px_30px_rgba(200,30,74,0.35)] transition hover:bg-[#A90D32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E4A]/50 md:bottom-20"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-2 bottom-[208px] z-50 flex w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:right-4 sm:left-auto sm:w-[360px] md:bottom-36">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-[#C81E4A] to-[#7A001F] px-4 py-3 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Support assistant</p>
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

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] px-3 py-3" style={{ minHeight: 280, maxHeight: 380 }}>
            {messages.length === 0 && (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-bold text-[#0F172A]">Hi 👋 Ask me about your wallet, multiplier, bonuses, or team.</p>
                <p className="text-xs text-[#64748B]">I can only see your own account data — not other users.</p>
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
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-[#C81E4A] text-white" : "border border-slate-200 bg-white text-[#0F172A]"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#64748B]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C81E4A]" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E4A]/30 disabled:opacity-60"
              maxLength={1500}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
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
