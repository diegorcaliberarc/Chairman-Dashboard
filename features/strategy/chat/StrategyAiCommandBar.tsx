"use client";

import React, { useState } from "react";
import { Send, Sparkles, CheckCircle2, AlertTriangle, Loader2, Mic } from "lucide-react";
import type { StrategyChatMutationReceipt } from "@/lib/commandTypes";
import { submitStrategyChatMutation } from "@services/strategyClientService";

export interface StrategyAiCommandBarProps {
  weekStartDate: string;
  onMutationComplete: () => Promise<void> | void;
}

const QUICK_MUTATION_CHIPS = [
  "Log 1680 kcal and 188g protein today",
  "Log 11200 steps NEAT today",
  "Log 7.8h sleep and 92% recovery",
] as const;

export function StrategyAiCommandBar({
  weekStartDate,
  onMutationComplete,
}: StrategyAiCommandBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<StrategyChatMutationReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executePrompt = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await submitStrategyChatMutation(trimmed, weekStartDate);
      setReceipt(result);
      setPrompt("");
      await onMutationComplete();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "State mutation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void executePrompt(prompt);
  };

  return (
    <section
      data-testid="strategy-ai-chat-widget"
      aria-label="Operations & Strategy AI Command Bar"
      className="relative z-10 w-full rounded-2xl border border-amber-500/30 bg-zinc-950/85 p-3.5 sm:p-4 backdrop-blur-xl shadow-2xl space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          <span>Strategy AI Command &amp; Live State Mutation</span>
        </div>
        <span className="text-zinc-400 flex items-center gap-1.5">
          <Mic size={12} className="text-zinc-500" />
          <span>Text or Wispr Flow voice dictation · auth.uid() RLS</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          data-testid="strategy-ai-chat-input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isSubmitting}
          placeholder="Log calories, protein, steps, sleep, or domain metric (e.g., 'Log 1650 kcal and 185g protein, 10800 steps')..."
          className="flex-1 min-w-0 rounded-xl bg-zinc-900/90 border border-white/10 focus:border-amber-400/70 focus:outline-none px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 font-sans transition"
        />
        <button
          data-testid="strategy-ai-chat-submit"
          type="submit"
          disabled={isSubmitting || prompt.trim().length < 3}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-45 disabled:hover:bg-amber-500 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition shrink-0"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span>{isSubmitting ? "Mutating..." : "Execute"}</span>
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_MUTATION_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => void executePrompt(chip)}
            disabled={isSubmitting}
            className="text-[11px] font-mono text-zinc-300 hover:text-amber-300 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-lg px-2.5 py-1 transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {receipt && (
        <div
          data-testid="strategy-ai-chat-receipt"
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 text-xs font-mono text-emerald-200"
        >
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate">{receipt.summary}</span>
        </div>
      )}

      {errorMsg && (
        <div
          data-testid="strategy-ai-chat-error"
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-500/30 px-3 py-2 text-xs font-mono text-rose-200"
        >
          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </section>
  );
}
