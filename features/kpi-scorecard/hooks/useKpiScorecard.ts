"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CORE_PILLAR_CATEGORIES,
  EvaluatedKpiRow,
  KpiViewMode,
  Metric,
  RAW_METRIC_DEFS,
  RagBucket,
  ScorecardSnapshot,
  ScorecardSummary,
  classifyRag,
  scoreToLetterGrade,
} from "../types";
import { evaluateSectorItems } from "../physics/executiveSectorPhysics";
import {
  fetchKpiMetrics,
  fetchScorecardSnapshots,
  patchKpiMetric,
  postScorecardCheckIn,
} from "@/services/kpiClientService";

export function useKpiScorecard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [viewMode, setViewMode] = useState<KpiViewMode>("both");
  const [snapshots, setSnapshots] = useState<ScorecardSnapshot[]>([]);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("all");
  const [ragFilter, setRagFilter] = useState<"ALL" | RagBucket>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [inlineDrafts, setInlineDrafts] = useState<Record<string, string>>({});
  const [savedFlashKey, setSavedFlashKey] = useState<string | null>(null);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInCadence, setCheckInCadence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [checkInNote, setCheckInNote] = useState("");
  const [savingCheckIn, setSavingCheckIn] = useState(false);

  const initialLoadedRef = useRef(false);

  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    void Promise.all([fetchKpiMetrics(), fetchScorecardSnapshots()])
      .then(([loadedMetrics, history]) => {
        setMetrics(loadedMetrics);
        setSnapshots(history.snapshots);
        setStreakCount(history.streakCount);
      })
      .catch(() => {});
  }, []);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async (metric: Metric) => {
    setSaveError(null);
    setMetrics((prev) => {
      const idx = prev.findIndex(
        (m) =>
          (m.id === metric.id && m.id !== undefined) ||
          (m.category === metric.category && m.metricName === metric.metricName)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...metric };
        return next;
      }
      return [...prev, metric];
    });

    try {
      const saved = await patchKpiMetric(metric);
      if (saved) {
        setMetrics((prev) => {
          const idx = prev.findIndex(
            (m) => m.metricName === saved.metricName && m.category === saved.category
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
      } else {
        setSaveError(`Failed to persist ${metric.metricName} update.`);
      }
    } catch {
      setSaveError(`Network error saving ${metric.metricName}.`);
    }
  }, []);

  const sectorRawValues = useMemo(() => {
    const out: Record<string, Record<string, { id?: string; val: number; target: number }>> = {};
    for (const cat of CORE_PILLAR_CATEGORIES) {
      out[cat.id] = {};
      for (const d of RAW_METRIC_DEFS[cat.id] || []) {
        const found = metrics.find((m) => m.category === cat.id && m.metricName === d.name);
        out[cat.id][d.name] = {
          id: found?.id,
          val: found ? found.value : d.defaultVal,
          target: found?.target ?? d.target,
        };
      }
    }
    return out;
  }, [metrics]);

  const evaluatedRows = useMemo<EvaluatedKpiRow[]>(() => {
    const rows: EvaluatedKpiRow[] = [];
    for (const cat of CORE_PILLAR_CATEGORIES) {
      const vals: Record<string, number> = {};
      for (const [k, obj] of Object.entries(sectorRawValues[cat.id] || {})) {
        vals[k] = obj.val;
      }
      const items = evaluateSectorItems(cat.id, vals);
      for (const item of items) {
        const { rag, points } = classifyRag(item.status);
        const rawInfo = sectorRawValues[cat.id]?.[item.rawMetricName] ?? { val: 0, target: 0 };
        rows.push({
          ...item,
          key: `${cat.id}-${item.label}`,
          sectorId: cat.id,
          sectorTitle: cat.title,
          sectorColor: cat.color,
          rag,
          statusLabel: item.status.label,
          rawMetricValue: rawInfo.val,
          rawMetricTarget: rawInfo.target,
          kpiPoints: points,
        });
      }
    }
    return rows;
  }, [sectorRawValues]);

  const scorecardSummary = useMemo<ScorecardSummary>(() => {
    const greenCount = evaluatedRows.filter((r) => r.rag === "GREEN").length;
    const yellowCount = evaluatedRows.filter((r) => r.rag === "YELLOW").length;
    const redCount = evaluatedRows.filter((r) => r.rag === "RED").length;

    const sectorScores: Record<string, number> = {};
    for (const cat of CORE_PILLAR_CATEGORIES) {
      const catRows = evaluatedRows.filter((r) => r.sectorId === cat.id);
      sectorScores[cat.id] =
        catRows.length > 0
          ? Math.round(catRows.reduce((acc, r) => acc + r.kpiPoints, 0) / catRows.length)
          : 0;
    }

    const liveComputedScore =
      evaluatedRows.length > 0
        ? Math.round(evaluatedRows.reduce((acc, r) => acc + r.kpiPoints, 0) / evaluatedRows.length)
        : 0;

    const overallScore =
      metrics.length === 0 && snapshots.length > 0
        ? snapshots[snapshots.length - 1].overall_score
        : liveComputedScore;

    const overallTrend = [
      ...snapshots.slice(-5).map((s) => s.overall_score),
      overallScore,
    ];
    while (overallTrend.length < 6) {
      overallTrend.unshift(overallScore);
    }

    return {
      overallScore,
      liveComputedScore,
      grade: scoreToLetterGrade(overallScore),
      greenCount,
      yellowCount,
      redCount,
      sectorScores,
      overallTrend: overallTrend.slice(-6),
    };
  }, [evaluatedRows, metrics.length, snapshots]);

  const getKpiSparklinePoints = useCallback(
    (row: EvaluatedKpiRow, idxInSector: number): number[] => {
      void idxInSector;
      const hist = snapshots.slice(-5).map((s) => {
        const base = s.sector_scores?.[row.sectorId] ?? s.overall_score ?? row.kpiPoints;
        return Math.max(0, Math.min(100, base));
      });
      while (hist.length < 5) {
        hist.unshift(row.kpiPoints);
      }
      return [...hist.slice(-5), row.kpiPoints];
    },
    [snapshots]
  );

  const setDraftValue = useCallback((draftKey: string, val: string) => {
    setSavedFlashKey(null);
    setInlineDrafts((prev) => ({ ...prev, [draftKey]: val }));
  }, []);

  const handleInlineQuickSave = useCallback(
    async (row: EvaluatedKpiRow) => {
      const draftKey = `${row.sectorId}:${row.rawMetricName}`;
      const rawStr = inlineDrafts[draftKey];
      const nextVal = rawStr !== undefined ? parseFloat(rawStr) || 0 : row.rawMetricValue;
      const existingInfo = sectorRawValues[row.sectorId]?.[row.rawMetricName];

      await handleSave({
        id: existingInfo?.id,
        category: row.sectorId,
        metricName: row.rawMetricName,
        value: nextVal,
        target: existingInfo?.target ?? row.rawMetricTarget,
      });

      setSavedFlashKey(row.key);
    },
    [handleSave, inlineDrafts, sectorRawValues]
  );

  const handleLogScorecardCheckIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (savingCheckIn) return;
      setSavingCheckIn(true);
      try {
        const score = scorecardSummary.liveComputedScore || scorecardSummary.overallScore;
        const result = await postScorecardCheckIn({
          cadence: checkInCadence,
          overall_score: score,
          grade: scoreToLetterGrade(score),
          green_count: scorecardSummary.greenCount,
          yellow_count: scorecardSummary.yellowCount,
          red_count: scorecardSummary.redCount,
          sector_scores: scorecardSummary.sectorScores,
          executive_note:
            checkInNote.trim() ||
            `Logged ${checkInCadence} executive scorecard check-in (${scorecardSummary.greenCount}G / ${scorecardSummary.yellowCount}Y / ${scorecardSummary.redCount}R).`,
        });
        if (result.ok) {
          setSnapshots(result.snapshots);
          setStreakCount(result.streakCount);
          setCheckInNote("");
          setCheckInOpen(false);
        }
      } finally {
        setSavingCheckIn(false);
      }
    },
    [checkInCadence, checkInNote, savingCheckIn, scorecardSummary]
  );

  const filteredScorecardSectors = useMemo(() => {
    return CORE_PILLAR_CATEGORIES.map((cat) => {
      const catRows = evaluatedRows.filter((r) => {
        if (r.sectorId !== cat.id) return false;
        if (selectedSectorFilter !== "all" && r.sectorId !== selectedSectorFilter) return false;
        if (ragFilter !== "ALL" && r.rag !== ragFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          if (
            !r.label.toLowerCase().includes(q) &&
            !r.sub.toLowerCase().includes(q) &&
            !r.sectorTitle.toLowerCase().includes(q) &&
            !r.rawMetricName.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
      return { category: cat, rows: catRows };
    }).filter((g) => g.rows.length > 0);
  }, [evaluatedRows, selectedSectorFilter, ragFilter, searchTerm]);

  return {
    metrics,
    viewMode,
    setViewMode,
    snapshots,
    streakCount,
    selectedSectorFilter,
    setSelectedSectorFilter,
    ragFilter,
    setRagFilter,
    searchTerm,
    setSearchTerm,
    inlineDrafts,
    setDraftValue,
    savedFlashKey,
    saveError,
    checkInOpen,
    setCheckInOpen,
    checkInCadence,
    setCheckInCadence,
    checkInNote,
    setCheckInNote,
    savingCheckIn,
    sectorRawValues,
    evaluatedRows,
    scorecardSummary,
    filteredScorecardSectors,
    getKpiSparklinePoints,
    handleSave,
    handleInlineQuickSave,
    handleLogScorecardCheckIn,
  };
}
