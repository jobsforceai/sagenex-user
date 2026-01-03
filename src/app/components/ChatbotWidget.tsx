"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type Source = {
  page: number;
  score?: number;
  snippet?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => question.trim().length > 0 && !isLoading, [question, isLoading]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, isLoading]);

  const pushMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSend = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };
    pushMessage(userMessage);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/kb/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, docId: "main_pdf" }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = (await response.json()) as {
        answer?: string;
        sources?: Source[];
        outOfContext?: boolean;
      };

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data?.outOfContext ? "Out of context." : data?.answer || "",
        sources: data?.outOfContext ? [] : data?.sources || [],
      };
      pushMessage(assistantMessage);
    } catch (error) {
      pushMessage({
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        content: "Something went wrong, try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          type="button"
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-lg shadow-emerald-500/40 transition-transform duration-200 hover:-translate-y-1 hover:shadow-emerald-500/60"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
        </button>
      )}

      {isOpen && (
        <div className="w-[320px] sm:w-[360px] rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900/95 to-black/95 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Sagenex Assistant</p>
              <p className="text-xs text-emerald-300/80">Always on. Always ready.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 p-1 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">
                Drop a question — I will keep it crisp.
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-[0_6px_20px_rgba(0,0,0,0.25)] ${
                    message.role === "user"
                      ? "ml-auto bg-emerald-500/25 text-emerald-100"
                      : "bg-white/5 text-gray-200"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="w-fit rounded-2xl bg-white/5 px-3 py-2 text-xs text-gray-400">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              disabled={isLoading}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Enter to send · Shift/Cmd+Enter for new line</span>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black shadow shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSend}
                disabled={!canSend}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
