"use client";

import React, { useState } from "react";
import { DriftWarning } from "@/lib/commandTypes";
import { AlertTriangle, AlertOctagon, Info, ChevronRight, X } from "lucide-react";

interface DriftWarningBannerProps {
  warnings: DriftWarning[];
}

export function DriftWarningBanner({ warnings }: DriftWarningBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeWarnings = warnings.filter((w) => !dismissedIds.has(w.id));

  if (activeWarnings.length === 0) return null;

  return (
    <div className="space-y-2 font-mono text-xs">
      {activeWarnings.map((w) => {
        const isCritical = w.severity === "critical";
        const isWarning = w.severity === "warning";

        return (
          <div
            key={w.id}
            className={`p-3.5 rounded-2xl border backdrop-blur-xl flex items-start justify-between gap-3 shadow-xl transition relative overflow-hidden ${
              isCritical
                ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                : isWarning
                ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                : "bg-sky-950/30 border-sky-500/30 text-sky-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {isCritical ? (
                  <AlertOctagon size={16} className="text-rose-400 animate-pulse" />
                ) : isWarning ? (
                  <AlertTriangle size={16} className="text-amber-400" />
                ) : (
                  <Info size={16} className="text-sky-400" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-white">
                    {w.title}
                  </span>
                  <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-white/10 font-bold">
                    {w.domain}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  {w.message}
                </p>
                <div className="text-[10px] text-zinc-400 pt-0.5">
                  Metric: <span className="text-white font-bold">{w.currentValue}</span> | Required Threshold: <span className="text-white font-bold">{w.threshold}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const next = new Set(dismissedIds);
                next.add(w.id);
                setDismissedIds(next);
              }}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              title="Dismiss Alert"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
