"use client";

import React from "react";
import { MissionFlowDraft, pickMissionCoverImage } from "@/lib/missionFlowTypes";
import { StrategicDomain } from "@/lib/synthesisRoadmapTypes";

const DOMAINS: ReadonlyArray<{ id: StrategicDomain; label: string }> = [
  { id: "master", label: "Master" },
  { id: "health", label: "Health" },
  { id: "wealth", label: "Wealth" },
  { id: "dogs", label: "Dogs" },
  { id: "family", label: "Family" },
  { id: "happiness", label: "Happiness" },
  { id: "custom", label: "Custom Project" },
];

interface Stage1EndStatePanelProps {
  draft: MissionFlowDraft;
  onPatchDraft: (updater: (prev: MissionFlowDraft) => MissionFlowDraft) => void;
}

export function Stage1EndStatePanel({
  draft,
  onPatchDraft,
}: Stage1EndStatePanelProps) {
  return (
    <div data-testid="mission-stage-panel-1" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-medium text-white">
          Stage 1: Visual End-State Lock (`GOAL!!` &amp; Commander&apos;s Intent)
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              data-testid={`mission-domain-${d.id}`}
              onClick={() =>
                onPatchDraft((p) => ({
                  ...p,
                  endState: {
                    ...p.endState,
                    domain: d.id,
                    coverImageUrl: pickMissionCoverImage(p.endState.title, d.id),
                  },
                }))
              }
              className={`px-3 py-1 rounded-xl text-xs font-mono border transition ${
                draft.endState.domain === d.id
                  ? "bg-cyan-500 text-zinc-950 border-cyan-400 font-medium"
                  : "bg-white/5 text-zinc-400 border-white/10 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
            Mission Goal Title (`GOAL!!`)
          </label>
          <input
            type="text"
            data-testid="mission-goal-title-input"
            value={draft.endState.title}
            onChange={(e) => {
              const val = e.target.value;
              onPatchDraft((p) => ({
                ...p,
                endState: {
                  ...p.endState,
                  title: val,
                  coverImageUrl: pickMissionCoverImage(val, p.endState.domain),
                },
              }));
            }}
            placeholder="e.g. Get down to 155 lbs @ 8% BF or Ship EquipSyncs Billing"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1424] border border-white/10 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase mb-1">Baseline</label>
            <input
              type="text"
              value={draft.endState.baselineValue}
              onChange={(e) =>
                onPatchDraft((p) => ({
                  ...p,
                  endState: { ...p.endState, baselineValue: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase mb-1">Target</label>
            <input
              type="text"
              value={draft.endState.targetValue}
              onChange={(e) =>
                onPatchDraft((p) => ({
                  ...p,
                  endState: { ...p.endState, targetValue: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-emerald-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase mb-1">Unit</label>
            <input
              type="text"
              value={draft.endState.unit}
              onChange={(e) =>
                onPatchDraft((p) => ({
                  ...p,
                  endState: { ...p.endState, unit: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase mb-1">Hard Deadline</label>
            <input
              type="date"
              value={draft.endState.hardDeadline}
              onChange={(e) =>
                onPatchDraft((p) => ({
                  ...p,
                  endState: { ...p.endState, hardDeadline: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-amber-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
            Commander&apos;s Intent &amp; Purpose
          </label>
          <textarea
            rows={3}
            value={draft.endState.commandersIntent}
            onChange={(e) =>
              onPatchDraft((p) => ({
                ...p,
                endState: { ...p.endState, commandersIntent: e.target.value },
              }))
            }
            placeholder="Why does this matter? What defines victory even if conditions shift?"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1424] border border-white/10 text-xs text-white"
          />
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-amber-400/40 overflow-hidden bg-[#0e1424] shadow-2xl">
          <div className="relative h-48 w-full">
            <img
              src={draft.endState.coverImageUrl}
              alt={draft.endState.title || "Mission Cover"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-black/30 to-transparent" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 font-mono text-[10px] font-medium uppercase">
              🏆 GOAL!! · {draft.endState.domain}
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <h4 className="text-lg font-medium text-white leading-tight">
                {draft.endState.title || "Untitled Mission End-State"}
              </h4>
              <div className="text-xs font-mono text-amber-300 mt-1">
                {draft.endState.baselineValue} → {draft.endState.targetValue} {draft.endState.unit}{" "}
                · Due {draft.endState.hardDeadline}
              </div>
            </div>
          </div>
          <div className="p-4 text-xs text-zinc-300 leading-relaxed">
            {draft.endState.commandersIntent ||
              "Define Commander's Intent on the left to lock end-state purpose."}
          </div>
        </div>
      </div>
    </div>
  );
}
