"use client";

import React from "react";
import { DomainScorecardItem } from "@/lib/commandTypes";
import {
  Heart,
  Briefcase,
  Users,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ShieldCheck,
} from "lucide-react";

interface DomainScorecardGridProps {
  scorecards: DomainScorecardItem[];
  onSelectDomain?: (domain: string) => void;
  selectedDomain?: string;
}

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  health: <Heart size={16} className="text-emerald-400" />,
  wealth: <Briefcase size={16} className="text-amber-400" />,
  relationships: <Users size={16} className="text-sky-400" />,
  happiness: <Sparkles size={16} className="text-purple-400" />,
};

const GRADE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  A: { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  B: { text: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/30" },
  C: { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  D: { text: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  F: { text: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" },
};

export function DomainScorecardGrid({
  scorecards,
  onSelectDomain,
  selectedDomain,
}: DomainScorecardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
      {scorecards.map((sc) => {
        const gradeStyle = GRADE_COLORS[sc.grade] || GRADE_COLORS.C;
        const isSelected = selectedDomain === sc.domain;

        return (
          <div
            key={sc.domain}
            onClick={() => onSelectDomain && onSelectDomain(sc.domain)}
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
              isSelected
                ? "bg-zinc-900/90 border-amber-500/50 ring-1 ring-amber-500/40"
                : "bg-zinc-950/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/40"
            }`}
          >
            {/* Top Row: Domain Icon + Grade Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {DOMAIN_ICONS[sc.domain]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {sc.title}
                  </h4>
                  <div className="text-[10px] text-zinc-500">PACE: {sc.activePace.toUpperCase()}</div>
                </div>
              </div>

              {/* Big Letter Grade Badge */}
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg font-black ${gradeStyle.bg} ${gradeStyle.text} ${gradeStyle.border} shadow-lg`}
              >
                {sc.grade}
              </div>
            </div>

            {/* Middle: Leading KPI Adherence */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 truncate max-w-[140px]">{sc.leadKpiLabel}</span>
                <span className="text-white font-bold">{sc.leadKpiValue}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-amber-400"
                  style={{ width: `${Math.min(100, sc.leadKpiAdherencePct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Target: {sc.leadKpiTarget}</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  {sc.trend === "up" ? (
                    <TrendingUp size={11} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={11} className="text-rose-400" />
                  )}
                  {sc.leadKpiAdherencePct}% adherence
                </span>
              </div>
            </div>

            {/* Bottom Row: Lagging Metric & Bottleneck Tag */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 truncate">
                Lag: <span className="text-zinc-200 font-semibold">{sc.lagKpiValue}</span>
              </span>

              {sc.bottleneckActive ? (
                <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  <AlertOctagon size={10} />
                  BOTTLENECK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck size={10} />
                  CLEAR
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
