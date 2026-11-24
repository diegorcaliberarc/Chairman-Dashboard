"use client";

import React from "react";
import { ArrowLeft, Check, CheckCircle2, Send } from "lucide-react";

interface SundayReviewStep3PmsPushProps {
  tasksToPush: string;
  onChangeTasks: (val: string) => void;
  onBack: () => void;
  onDispatch: () => void;
  isSubmitting: boolean;
  pmsSuccess: boolean;
}

export function SundayReviewStep3PmsPush({
  tasksToPush,
  onChangeTasks,
  onBack,
  onDispatch,
  isSubmitting,
  pmsSuccess,
}: SundayReviewStep3PmsPushProps) {
  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
        <div className="font-bold flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>AAR Successfully Saved to Lesson Vault!</span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1 font-sans">
          Review and push the following tasks into Pristine PMS. They will be automatically tagged with{" "}
          <span className="text-rose-400 font-bold">BOTTLENECK</span> priority to ensure immediate execution.
        </p>
      </div>

      <div>
        <label className="text-[10px] uppercase text-zinc-400 block mb-1">
          Tasks to Dispatch to Pristine PMS (1 task per line)
        </label>
        <textarea
          rows={4}
          value={tasksToPush}
          onChange={(e) => onChangeTasks(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
          placeholder="• Prep evening macro shake&#10;• Clear desk food clutter&#10;• Lock in 10k steps before 6 PM"
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onDispatch}
          disabled={isSubmitting || pmsSuccess}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-xs tracking-wider shadow-xl active:scale-95 transition disabled:opacity-50"
        >
          {pmsSuccess ? (
            <>
              <Check size={14} />
              <span>TASKS DISPATCHED!</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>{isSubmitting ? "DISPATCHING..." : "DISPATCH TASKS TO PMS"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
