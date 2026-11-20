"use client";

import React from "react";
import { BookOpen, Flag, Search } from "lucide-react";
import {
  AarLesson,
  MissionFlowDraft,
  MissionWbsNode,
  computeCriticalPath,
  computeMissionQuantification,
} from "@/lib/missionFlowTypes";
import { PaceType } from "@/lib/synthesisRoadmapTypes";

interface Stage5HudAarPanelProps {
  draft: MissionFlowDraft;
  cpm: ReturnType<typeof computeCriticalPath>;
  quant: ReturnType<typeof computeMissionQuantification>;
  lessonsCount: number;
  filteredLessons: AarLesson[];
  lessonSearch: string;
  onChangeLessonSearch: (val: string) => void;
  aarWorked: string;
  onChangeAarWorked: (val: string) => void;
  aarBroke: string;
  onChangeAarBroke: (val: string) => void;
  aarRule: string;
  onChangeAarRule: (val: string) => void;
  isSavingAar: boolean;
  onSubmitAar: (e: React.FormEvent) => void;
  onUpdateNode: (id: string, patch: Partial<MissionWbsNode>) => void;
  onPatchDraft: (updater: (prev: MissionFlowDraft) => MissionFlowDraft) => void;
}

export function Stage5HudAarPanel({
  draft,
  cpm,
  quant,
  lessonsCount,
  filteredLessons,
  lessonSearch,
  onChangeLessonSearch,
  aarWorked,
  onChangeAarWorked,
  aarBroke,
  onChangeAarBroke,
  aarRule,
  onChangeAarRule,
  isSavingAar,
  onSubmitAar,
  onUpdateNode,
  onPatchDraft,
}: Stage5HudAarPanelProps) {
  return (
    <div data-testid="mission-stage-panel-5" className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
          <div className="text-[10px] text-cyan-400 uppercase">Mission Readiness Score</div>
          <div className="text-2xl text-white mt-1">{quant.readinessScore}%</div>
          <div className="text-[10px] text-zinc-400">Weighted BOM HAVE + Unblocked</div>
        </div>
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <div className="text-[10px] text-amber-400 uppercase">Critical Path Velocity</div>
          <div className="text-2xl text-amber-300 mt-1">{quant.velocity}</div>
          <div className="text-[10px] text-zinc-400">CPM Min: {cpm.totalMinDurationMins} mins</div>
        </div>
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="text-[10px] text-emerald-400 uppercase">Scope Completion</div>
          <div className="text-2xl text-emerald-300 mt-1">{quant.scopeCompletionPct}%</div>
          <div className="text-[10px] text-zinc-400">
            {quant.completedCount}/{quant.totalNodes} WBS Nodes Done
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-white/15 bg-[#0e1424]">
          <div className="text-[10px] text-zinc-400 uppercase mb-2">Active PACE Switcher</div>
          <div className="grid grid-cols-4 gap-1">
            {(["P", "A", "C", "E"] as PaceType[]).map((t) => (
              <button
                key={t}
                type="button"
                data-testid={`mission-pace-btn-${t}`}
                onClick={() => onPatchDraft((p) => ({ ...p, activePace: t }))}
                className={`py-1.5 rounded-lg text-xs transition ${
                  draft.activePace === t
                    ? "bg-cyan-400 text-zinc-950 font-medium"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {draft.nodes.length > 0 && (
        <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2">
          <div className="text-xs font-mono text-zinc-400 uppercase">Live Execution Checklist</div>
          {draft.nodes.map((n) => (
            <label
              key={n.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-cyan-400/30"
            >
              <span className="flex items-center gap-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={n.completed}
                  onChange={() => onUpdateNode(n.id, { completed: !n.completed })}
                />
                <span className={n.completed ? "line-through text-zinc-500" : "text-white"}>
                  {n.title}
                </span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{n.durationMins}m</span>
            </label>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          data-testid="mission-aar-form"
          onSubmit={onSubmitAar}
          className="p-4 rounded-2xl border border-amber-500/30 bg-[#0e1424] space-y-3"
        >
          <div className="text-xs font-mono text-amber-300 uppercase flex items-center gap-1.5">
            <Flag size={13} />
            <span>60-Second AAR Closeout</span>
          </div>
          <input
            type="text"
            value={aarWorked}
            onChange={(e) => onChangeAarWorked(e.target.value)}
            placeholder="1. What worked?"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
          />
          <input
            type="text"
            value={aarBroke}
            onChange={(e) => onChangeAarBroke(e.target.value)}
            placeholder="2. What broke down?"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
          />
          <input
            type="text"
            value={aarRule}
            onChange={(e) => onChangeAarRule(e.target.value)}
            placeholder="3. What single rule changes next time?"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
          />
          <button
            type="submit"
            data-testid="mission-save-aar-btn"
            disabled={isSavingAar}
            className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-medium uppercase"
          >
            {isSavingAar ? "Saving to Vault..." : "Save AAR to Lesson Vault"}
          </button>
        </form>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>Searchable Lesson Vault ({lessonsCount})</span>
            </span>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                data-testid="mission-lesson-search-input"
                value={lessonSearch}
                onChange={(e) => onChangeLessonSearch(e.target.value)}
                placeholder="Search lessons..."
                className="pl-7 pr-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white w-40"
              />
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredLessons.length === 0 ? (
              <div className="py-6 text-center text-[11px] font-mono text-zinc-500">
                No AAR lessons logged yet. Complete your first 60-second closeout on the left.
              </div>
            ) : (
              filteredLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-1"
                >
                  <div className="font-mono text-amber-300">{l.missionTitle}</div>
                  {l.ruleChange && <div className="text-emerald-300">Rule: {l.ruleChange}</div>}
                  {l.whatWorked && <div className="text-zinc-400">Worked: {l.whatWorked}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
