"use client";

import React from "react";
import { AlertOctagon, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import type { DomainScorecardItem, LifeDomain } from "@/lib/commandTypes";
import { ExecutiveScorecardBox } from "../components/ExecutiveScorecardBox";

export interface UnifiedDomainScorecardGridProps {
  scorecards: DomainScorecardItem[];
  selectedDomain?: LifeDomain;
  onSelectDomain?: (domain: LifeDomain) => void;
}

const GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
  B: "bg-sky-500/15 text-sky-300 border-sky-500/35",
  C: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  D: "bg-orange-500/15 text-orange-300 border-orange-500/35",
  F: "bg-rose-500/15 text-rose-300 border-rose-500/35",
};

const DOMAIN_ACCENTS: Record<LifeDomain, string> = {
  health: "#10b981",
  wealth: "#f59e0b",
  relationships: "#38bdf8",
  happiness: "#a855f7",
};

export function UnifiedDomainScorecardGrid({
  scorecards,
  selectedDomain,
  onSelectDomain,
}: UnifiedDomainScorecardGridProps) {
  return (
    <div
      data-testid="strategy-domain-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch"
    >
      {scorecards.map((sc) => {
        const isSelected = selectedDomain === sc.domain;
        const points = sc.chartPoints ?? [];

        return (
          <ExecutiveScorecardBox
            key={sc.domain}
            testId={`strategy-domain-card-${sc.domain}`}
            title={sc.title}
            subtitle={`PACE: ${sc.activePace.toUpperCase()}`}
            badgeText={sc.grade}
            badgeClassName={GRADE_STYLES[sc.grade] ?? GRADE_STYLES.C}
            silhouette={sc.domain}
            primaryLabel={sc.leadKpiLabel}
            primaryValue={sc.leadKpiValue}
            targetText={`Target: ${sc.leadKpiTarget} · ${sc.leadKpiAdherencePct}% adherence`}
            chartId={`domain-${sc.domain}`}
            chartPoints={points}
            chartThreshold={sc.chartTarget ?? 85}
            chartAccentHex={DOMAIN_ACCENTS[sc.domain]}
            chartMode="area"
            isSelected={isSelected}
            onClick={onSelectDomain ? () => onSelectDomain(sc.domain) : undefined}
            footerLeft={
              <span className="inline-flex items-center gap-1">
                {sc.trend === "up" ? (
                  <TrendingUp size={11} className="text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown size={11} className="text-rose-400 shrink-0" />
                )}
                <span>Lag: {sc.lagKpiValue}</span>
              </span>
            }
            footerRight={
              sc.bottleneckActive ? (
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  <AlertOctagon size={10} />
                  BOTTLENECK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck size={10} />
                  CLEAR
                </span>
              )
            }
          />
        );
      })}
    </div>
  );
}
