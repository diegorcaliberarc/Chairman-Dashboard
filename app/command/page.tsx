"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { DomainScorecardGrid } from "@/components/command/DomainScorecardGrid";
import { DriftWarningBanner } from "@/components/command/DriftWarningBanner";
import { NorthStarAnchorCard } from "@/components/command/NorthStarAnchorCard";
import { PhasesTransitionSequence } from "@/components/command/PhasesTransitionSequence";
import { WeeklyFragoPaceEditor } from "@/components/command/WeeklyFragoPaceEditor";
import { SundayReviewWizardModal } from "@/components/command/SundayReviewWizardModal";
import { AarLessonVault } from "@/components/command/AarLessonVault";
import {
  LifeDomain,
  CommandNorthStar,
  CommandPhase,
  CommandFrago,
  CommandAarLog,
  DomainScorecardItem,
  DriftWarning,
  PaceTier,
} from "@/lib/commandTypes";
import {
  Compass,
  Trophy,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";

function getMondayIso(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

export default function CommandPage() {
  const [selectedDomain, setSelectedDomain] = useState<LifeDomain>("health");
  const [weekStartDate, setWeekStartDate] = useState<string>(getMondayIso());
  const [isSundayWizardOpen, setIsSundayWizardOpen] = useState(false);

  // Live Data State
  const [northStars, setNorthStars] = useState<CommandNorthStar[]>([]);
  const [fragos, setFragos] = useState<Record<string, CommandFrago>>({});
  const [aarLogs, setAarLogs] = useState<CommandAarLog[]>([]);
  const [scorecards, setScorecards] = useState<DomainScorecardItem[]>([]);
  const [driftWarnings, setDriftWarnings] = useState<DriftWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Command Engine Data in parallel for fast navigation
  const loadCommandData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cmdRes, scRes] = await Promise.all([
        fetch(`/api/command?weekStart=${weekStartDate}`),
        fetch(`/api/scorecard`),
      ]);

      if (cmdRes.ok) {
        const cmdData = await cmdRes.json();
        if (cmdData.success) {
          setNorthStars(cmdData.northStars || []);
          setFragos(cmdData.fragos || {});
          setAarLogs(cmdData.aarLogs || []);
        }
      }

      if (scRes.ok) {
        const scData = await scRes.json();
        if (scData.success) {
          setScorecards(scData.scorecards || []);
          setDriftWarnings(scData.driftWarnings || []);
        }
      }
    } catch (err) {
      console.error("Error loading Operations & Strategy data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [weekStartDate]);

  useEffect(() => {
    loadCommandData();
  }, [loadCommandData]);

  // Actions
  const handleSaveNorthStar = async (nsData: Partial<CommandNorthStar>) => {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_north_star", ...nsData }),
      });
      if (res.ok) loadCommandData();
    } catch (e) {
      console.error("Error saving North Star:", e);
    }
  };

  const handleSavePhase = async (phaseData: Partial<CommandPhase>) => {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_phase", ...phaseData }),
      });
      if (res.ok) loadCommandData();
    } catch (e) {
      console.error("Error saving Phase:", e);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Are you sure you want to delete this phase?")) return;
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_phase", id: phaseId }),
      });
      if (res.ok) loadCommandData();
    } catch (e) {
      console.error("Error deleting Phase:", e);
    }
  };

  const handleSaveFrago = async (fragoData: Partial<CommandFrago>) => {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_frago", ...fragoData }),
      });
      if (res.ok) loadCommandData();
    } catch (e) {
      console.error("Error saving FRAGO:", e);
    }
  };

  const handleSwitchPace = async (domain: LifeDomain, paceTier: PaceTier) => {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "switch_pace",
          domain,
          week_start_date: weekStartDate,
          pace_tier: paceTier,
        }),
      });
      if (res.ok) loadCommandData();
    } catch (e) {
      console.error("Error switching PACE:", e);
    }
  };

  const handlePushToPms = async (taskTitles: string[], domain: LifeDomain, sequenceType: string) => {
    try {
      await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push_frago_to_pms",
          domain,
          sequenceType,
          taskTitles,
        }),
      });
    } catch (e) {
      console.error("Error pushing tasks to PMS:", e);
    }
  };

  // Find active North Star for selected domain
  const currentNorthStar = northStars.find((ns) => ns.domain === selectedDomain) || null;
  const currentFrago = fragos[selectedDomain] || null;

  return (
    <ExecutiveModuleShell
      moduleId="COMMAND"
      eyebrow="Operations & Planning"
      title="Operations & Strategy"
      subtitle="Annual goals, weekly priorities, domain scorecard, and reviews"
      accentColor="#f59e0b"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300">
            <Calendar size={13} className="text-amber-400" />
            <span>Week: {weekStartDate}</span>
          </div>

          {/* Sunday Review Wizard Button */}
          <button
            onClick={() => setIsSundayWizardOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-mono text-xs tracking-wider shadow-lg active:scale-95 transition"
          >
            <Trophy size={13} />
            <span>SUNDAY REVIEW WIZARD</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadCommandData}
            className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition"
            title="Refresh Command Deck"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-amber-400" : ""} />
          </button>
        </div>
      }
    >
      <div className="min-h-screen bg-[#07090E] text-zinc-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* 1. DRIFT & BOTTLENECK EARLY WARNING BANNER */}
        <DriftWarningBanner warnings={driftWarnings} />

        {/* 2. 4-DOMAIN SCORECARD GRID (HEALTH, WEALTH, RELATIONSHIPS, HAPPINESS) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <span>Executive Domain Scorecard</span>
            <span className="text-[11px] text-zinc-500">Live leading & lagging telemetry</span>
          </div>
          <DomainScorecardGrid
            scorecards={scorecards}
            selectedDomain={selectedDomain}
            onSelectDomain={(d) => setSelectedDomain(d as LifeDomain)}
          />
        </div>

        {/* 3. DOMAIN SWIMLANE SELECTOR PILLS */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto font-mono text-xs">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px] mr-1">Active Theater:</span>
          {(
            [
              { id: "health", label: "Health & Biometrics" },
              { id: "wealth", label: "Wealth & Sovereign Ops" },
              { id: "relationships", label: "Family & Relationships" },
              { id: "happiness", label: "Pursuit of Happiness" },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedDomain(pill.id)}
              className={`px-3 py-1.5 rounded-xl border font-bold uppercase transition flex items-center gap-1.5 ${
                selectedDomain === pill.id
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-lg"
                  : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* 4. MASTER 3-COLUMN SWIMLANE ARCHITECTURE */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 min-h-[460px]">
          {/* Column 1 (280px): North Star Anchor Card */}
          <NorthStarAnchorCard
            domain={selectedDomain}
            northStar={currentNorthStar}
            onSaveNorthStar={handleSaveNorthStar}
          />

          {/* Column 2 (flex-1): Connected Sequential Phases of Transition */}
          <div className="flex-1 rounded-2xl bg-zinc-950/60 border border-white/10 p-4 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <PhasesTransitionSequence
              northStarId={currentNorthStar?.id || ""}
              phases={currentNorthStar?.phases || []}
              onSavePhase={handleSavePhase}
              onDeletePhase={handleDeletePhase}
            />
          </div>

          {/* Column 3 (360px): Weekly 5-Paragraph FRAGO + 4-Tier PACE Plan */}
          <WeeklyFragoPaceEditor
            domain={selectedDomain}
            frago={currentFrago}
            weekStartDate={weekStartDate}
            onSaveFrago={handleSaveFrago}
            onSwitchPace={handleSwitchPace}
            onPushToPms={handlePushToPms}
          />
        </div>

        {/* 5. SEARCHABLE AFTER-ACTION REVIEW (AAR) LESSON VAULT */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Searchable AAR Lesson Vault
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">
              Permanent operational doctrine & root cause archive
            </span>
          </div>

          <AarLessonVault aarLogs={aarLogs} />
        </div>
      </div>

      {/* SUNDAY REVIEW WIZARD MODAL */}
      <SundayReviewWizardModal
        isOpen={isSundayWizardOpen}
        onClose={() => setIsSundayWizardOpen(false)}
        scorecards={scorecards}
        weekStartDate={weekStartDate}
        onComplete={loadCommandData}
      />
    </ExecutiveModuleShell>
  );
}
