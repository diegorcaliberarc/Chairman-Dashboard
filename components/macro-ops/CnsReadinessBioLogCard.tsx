"use client";

import React, { useState, useEffect } from "react";
import { Activity, Moon, Coffee, Save, Check } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";
import { useSafeTimeout } from "@/lib/hooks/useTimers";

interface CnsReadinessBioLogCardProps {
  todayLog: DailySitrepLog | null;
  onUpdateNotes?: (notes: string) => Promise<void>;
}

export function CnsReadinessBioLogCard({
  todayLog,
  onUpdateNotes,
}: CnsReadinessBioLogCardProps) {
  const recoveryScore = todayLog?.recovery_score ?? 88;
  const sleepHours = todayLog?.sleep_hours ?? 7.8;

  const scheduleTimeout = useSafeTimeout();
  const [notes, setNotes] = useState(todayLog?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setNotes(todayLog?.notes || "");
  }, [todayLog?.notes]);

  const handleSaveNotes = async () => {
    if (!onUpdateNotes) return;
    setIsSaving(true);
    try {
      await onUpdateNotes(notes);
      setJustSaved(true);
      scheduleTimeout(() => setJustSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
          CNS Readiness & Bio-Log
        </span>
        <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
          Oura Sleep: {recoveryScore}%
        </span>
      </div>

      <div className="p-3 rounded-xl bg-background border border-border space-y-2 mt-1">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Sleep Duration:
          </span>
          <span className="text-zinc-200 font-semibold">{sleepHours}h Quality</span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Caffeine Cutoff:
          </span>
          <span className="text-zinc-200 font-semibold">13:30 PM (Met)</span>
        </div>

        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase text-zinc-400">Tactical Journal / Bio Notes:</span>
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-[10px] transition"
            >
              {justSaved ? (
                <>
                  <Check size={11} className="text-emerald-400" />
                  <span className="text-emerald-400">Saved</span>
                </>
              ) : (
                <>
                  <Save size={11} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="High neuromuscular drive, appetite suppressed until post-noon window..."
            className="w-full bg-zinc-950/70 border border-border rounded-lg p-2 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none italic"
          />
        </div>
      </div>
    </div>
  );
}
