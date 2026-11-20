"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import { Metric, RAW_METRIC_DEFS, SectorCategoryDef } from "../types";
import { evaluateSectorItems } from "../physics/executiveSectorPhysics";

interface SectorPhysicsCardProps {
  category: SectorCategoryDef;
  allMetrics: Metric[];
  onSave: (metric: Metric) => Promise<void>;
}

export function SectorPhysicsCard({
  category,
  allMetrics,
  onSave,
}: SectorPhysicsCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const defs = useMemo(() => RAW_METRIC_DEFS[category.id] || [], [category.id]);
  const [localVals, setLocalVals] = useState<Record<string, number>>({});

  useEffect(() => {
    const vals: Record<string, number> = {};
    defs.forEach((d) => {
      const m = allMetrics.find(
        (item) => item.category === category.id && item.metricName === d.name
      );
      vals[d.name] = m ? m.value : d.defaultVal;
    });
    setLocalVals(vals);
  }, [allMetrics, category.id, defs, isFlipped]);

  const evaluatedItems = useMemo(
    () => evaluateSectorItems(category.id, localVals),
    [category.id, localVals]
  );

  const save = async () => {
    for (const d of defs) {
      const m = allMetrics.find(
        (item) => item.category === category.id && item.metricName === d.name
      );
      if (!m || m.value !== localVals[d.name]) {
        await onSave({
          id: m?.id,
          category: category.id,
          metricName: d.name,
          value: localVals[d.name],
          target: m?.target ?? d.target,
        });
      }
    }
    setIsFlipped(false);
  };

  const Icon = category.icon;
  const isActiveSector = evaluatedItems.length > 0;
  const cardHeight = isActiveSector ? "h-[380px]" : "h-[220px]";

  return (
    <div
      data-testid={`kpi-sector-card-${category.id}`}
      className={`relative w-full ${cardHeight} perspective-1000 group`}
    >
      <div
        className={`w-full h-full absolute transition-transform duration-500 preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        <div className="absolute w-full h-full backface-hidden bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" style={{ color: category.color }} />
              <h3
                className="font-serif text-lg tracking-widest uppercase"
                style={{ color: category.color }}
              >
                {category.title}
              </h3>
            </div>
            <button
              type="button"
              data-testid={`kpi-sector-flip-btn-${category.id}`}
              onClick={() => isActiveSector && setIsFlipped(true)}
              className={`p-1.5 rounded-md transition-colors ${
                isActiveSector
                  ? "hover:bg-zinc-200/50 dark:hover:bg-white/10 text-zinc-500"
                  : "opacity-50 cursor-not-allowed text-zinc-300 dark:text-zinc-700"
              }`}
              aria-label={`Edit ${category.title} raw drivers`}
            >
              <Edit2 size={14} />
            </button>
          </div>

          {isActiveSector ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {evaluatedItems.map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">
                      {k.sub}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">
                      {k.actualDisplay}
                    </span>
                    <span
                      className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}
                    >
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 mt-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">
                AWAITING DATA
              </div>
              <div className="font-serif text-sm text-zinc-400 dark:text-zinc-500 text-center px-4 leading-relaxed">
                This sector is offline. Focus strictly on active core systems.
              </div>
            </div>
          )}
        </div>

        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-zinc-50 dark:bg-[#0E0F14] border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200/50 dark:border-white/10 shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
              Update Metrics
            </h3>
            <button
              type="button"
              data-testid={`kpi-sector-cancel-btn-${category.id}`}
              onClick={() => setIsFlipped(false)}
              className="p-1 rounded hover:bg-red-500/10 text-red-400"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {defs.map((d) => (
              <div key={d.name} className="flex flex-col gap-1">
                <label className="text-[9px] tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                  {d.name}
                </label>
                <input
                  type="number"
                  value={localVals[d.name] ?? ""}
                  onChange={(e) =>
                    setLocalVals({ ...localVals, [d.name]: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded p-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[color:var(--theme-grad-start)] transition-colors"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            data-testid={`kpi-sector-confirm-btn-${category.id}`}
            onClick={save}
            className="mt-3 w-full py-2 shrink-0 bg-[rgba(var(--theme-grad-start-rgb),0.1)] border border-[color:var(--theme-grad-start)]/30 rounded flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-bold text-[color:var(--theme-grad-start)] hover:bg-[rgba(var(--theme-grad-start-rgb),0.2)] transition-colors"
          >
            <Save size={12} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
