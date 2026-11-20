"use client";

import React from "react";
import { Check, Save, Search } from "lucide-react";
import {
  CORE_PILLAR_CATEGORIES,
  EvaluatedKpiRow,
  Metric,
  RagBucket,
  SectorCategoryDef,
  scoreToLetterGrade,
} from "../types";
import { SparklineSvg } from "./SparklineSvg";

interface ScorecardMatrixTableProps {
  filteredScorecardSectors: Array<{
    category: SectorCategoryDef;
    rows: EvaluatedKpiRow[];
  }>;
  sectorScores: Record<string, number>;
  sectorRawValues: Record<string, Record<string, { id?: string; val: number; target: number }>>;
  selectedSectorFilter: string;
  onSelectSectorFilter: (sectorId: string) => void;
  ragFilter: "ALL" | RagBucket;
  onSelectRagFilter: (rag: "ALL" | RagBucket) => void;
  searchTerm: string;
  onChangeSearchTerm: (term: string) => void;
  inlineDrafts: Record<string, string>;
  onChangeDraft: (draftKey: string, val: string) => void;
  savedFlashKey: string | null;
  onInlineQuickSave: (row: EvaluatedKpiRow) => void;
  onSaveRawMetric: (metric: Metric) => Promise<void>;
  getKpiSparklinePoints: (row: EvaluatedKpiRow, idx: number) => number[];
}

export function ScorecardMatrixTable({
  filteredScorecardSectors,
  sectorScores,
  sectorRawValues,
  selectedSectorFilter,
  onSelectSectorFilter,
  ragFilter,
  onSelectRagFilter,
  searchTerm,
  onChangeSearchTerm,
  inlineDrafts,
  onChangeDraft,
  savedFlashKey,
  onInlineQuickSave,
  onSaveRawMetric,
  getKpiSparklinePoints,
}: ScorecardMatrixTableProps) {
  return (
    <section data-testid="kpi-matrix-section" className="space-y-4">
      <div className="rounded-xl bg-white/80 dark:bg-black/50 border border-zinc-200/60 dark:border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="kpi-sector-filter-all"
            onClick={() => onSelectSectorFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
              selectedSectorFilter === "all"
                ? "bg-amber-500/25 text-amber-700 dark:text-amber-200 border border-amber-400/40"
                : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 hover:text-white"
            }`}
          >
            All Pillars
          </button>
          {CORE_PILLAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              data-testid={`kpi-sector-filter-${cat.id}`}
              onClick={() => onSelectSectorFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-colors border ${
                selectedSectorFilter === cat.id
                  ? "bg-white/15 text-white border-white/30"
                  : "bg-zinc-100 dark:bg-white/[0.03] text-zinc-500 dark:text-zinc-400 border-transparent hover:text-white"
              }`}
              style={
                selectedSectorFilter === cat.id
                  ? { borderColor: cat.color, color: cat.color }
                  : undefined
              }
            >
              {cat.title}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/[0.04] p-1 rounded-lg">
            {(["ALL", "GREEN", "YELLOW", "RED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                data-testid={`kpi-rag-filter-${st.toLowerCase()}`}
                onClick={() => onSelectRagFilter(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  ragFilter === st
                    ? "bg-white dark:bg-white/15 text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {st === "ALL"
                  ? "All RAG"
                  : st === "GREEN"
                  ? "Optimal"
                  : st === "YELLOW"
                  ? "Warning"
                  : "Critical"}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="kpi-search-input"
              value={searchTerm}
              onChange={(e) => onChangeSearchTerm(e.target.value)}
              placeholder="Filter KPIs..."
              className="pl-8 pr-3 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/85 dark:bg-[#0b0e16]/90 border border-zinc-200/60 dark:border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.03] text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4">KPI Directive</th>
                <th className="py-3 px-3">Target</th>
                <th className="py-3 px-3">Current Actual</th>
                <th className="py-3 px-3">Variance %</th>
                <th className="py-3 px-3">RAG Status</th>
                <th className="py-3 px-3">6-Pt Trend</th>
                <th className="py-3 px-4 text-right">Inline Quick-Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-white/[0.06]">
              {filteredScorecardSectors.map(({ category: cat, rows }) => {
                const Icon = cat.icon;
                const secScore = sectorScores[cat.id] ?? 0;
                return (
                  <React.Fragment key={cat.id}>
                    <tr className="bg-zinc-100/70 dark:bg-white/[0.035]">
                      <td colSpan={7} className="py-2.5 px-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" style={{ color: cat.color }} />
                            <span
                              className="font-serif text-sm font-bold tracking-widest uppercase"
                              style={{ color: cat.color }}
                            >
                              {cat.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-black/25 border border-white/10 text-[10px] font-mono text-zinc-300">
                              Sector Score: {secScore}/100 ({scoreToLetterGrade(secScore)})
                            </span>
                          </div>

                          {cat.id === "wealth" && (
                            <div className="flex flex-wrap items-center gap-2 text-[10px]">
                              {(["income_other", "expenses_base", "debt_total"] as const).map(
                                (extraName) => {
                                  const dKey = `wealth:${extraName}`;
                                  const cur = sectorRawValues.wealth?.[extraName]?.val ?? 0;
                                  return (
                                    <div
                                      key={extraName}
                                      className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10"
                                    >
                                      <span className="font-mono text-zinc-400">{extraName}:</span>
                                      <input
                                        type="number"
                                        value={
                                          inlineDrafts[dKey] !== undefined
                                            ? inlineDrafts[dKey]
                                            : cur
                                        }
                                        onChange={(e) => onChangeDraft(dKey, e.target.value)}
                                        onBlur={() => {
                                          if (inlineDrafts[dKey] !== undefined) {
                                            void onSaveRawMetric({
                                              id: sectorRawValues.wealth?.[extraName]?.id,
                                              category: "wealth",
                                              metricName: extraName,
                                              value: parseFloat(inlineDrafts[dKey]) || 0,
                                              target: 0,
                                            });
                                          }
                                        }}
                                        className="w-16 bg-transparent font-mono text-white focus:outline-none text-right"
                                      />
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}

                          {cat.id === "relate" && (
                            <div className="flex items-center gap-1.5 text-[10px] bg-black/30 px-2 py-0.5 rounded border border-white/10">
                              <span className="font-mono text-zinc-400">rel_decisions_total:</span>
                              <input
                                type="number"
                                value={
                                  inlineDrafts["relate:rel_decisions_total"] !== undefined
                                    ? inlineDrafts["relate:rel_decisions_total"]
                                    : sectorRawValues.relate?.rel_decisions_total?.val ?? 1
                                }
                                onChange={(e) =>
                                  onChangeDraft("relate:rel_decisions_total", e.target.value)
                                }
                                onBlur={() => {
                                  if (inlineDrafts["relate:rel_decisions_total"] !== undefined) {
                                    void onSaveRawMetric({
                                      id: sectorRawValues.relate?.rel_decisions_total?.id,
                                      category: "relate",
                                      metricName: "rel_decisions_total",
                                      value:
                                        parseFloat(inlineDrafts["relate:rel_decisions_total"]) || 1,
                                      target: 0,
                                    });
                                  }
                                }}
                                className="w-14 bg-transparent font-mono text-white focus:outline-none text-right"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {rows.map((row, idx) => {
                      const draftKey = `${row.sectorId}:${row.rawMetricName}`;
                      const inputVal =
                        inlineDrafts[draftKey] !== undefined
                          ? inlineDrafts[draftKey]
                          : String(row.rawMetricValue);
                      const sparkPoints = getKpiSparklinePoints(row, idx);

                      return (
                        <tr
                          key={row.key}
                          className="hover:bg-zinc-50 dark:hover:bg-white/[0.025] transition-colors"
                        >
                          <td className="py-2.5 px-4">
                            <div className="text-xs font-bold tracking-wider uppercase text-zinc-900 dark:text-zinc-100">
                              {row.label}
                            </div>
                            <div className="text-[10px] text-zinc-500">{row.sub}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {row.targetDisplay}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs font-bold text-zinc-900 dark:text-white">
                            {row.actualDisplay}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs">
                            <span
                              className={
                                row.variancePct >= 0
                                  ? "text-emerald-500 font-semibold"
                                  : "text-rose-400 font-semibold"
                              }
                            >
                              {row.variancePct >= 0
                                ? `+${row.variancePct}%`
                                : `${row.variancePct}%`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                row.rag === "GREEN"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : row.rag === "YELLOW"
                                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                  : "bg-red-500/15 text-red-400 border-red-500/30"
                              }`}
                            >
                              {row.statusLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <SparklineSvg points={sparkPoints} rag={row.rag} />
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[9.5px] font-mono text-zinc-500 hidden xl:inline">
                                {row.rawMetricName}
                              </span>
                              <input
                                type="number"
                                step="any"
                                data-testid={`kpi-inline-input-${row.rawMetricName}`}
                                value={inputVal}
                                onChange={(e) => onChangeDraft(draftKey, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    onInlineQuickSave(row);
                                  }
                                }}
                                className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/15 font-mono text-xs text-right text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                              />
                              <button
                                type="button"
                                data-testid={`kpi-inline-save-${row.rawMetricName}`}
                                onClick={() => onInlineQuickSave(row)}
                                title="Save KPI Input"
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  savedFlashKey === row.key
                                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                                    : "bg-zinc-100 dark:bg-white/[0.06] hover:bg-amber-500/20 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                                }`}
                              >
                                {savedFlashKey === row.key ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
