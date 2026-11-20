"use client";

import React from "react";
import { MissionFlowDraft } from "@/lib/missionFlowTypes";

interface Stage0OocemrPanelProps {
  draft: MissionFlowDraft;
  onPatchDraft: (updater: (prev: MissionFlowDraft) => MissionFlowDraft) => void;
  onSkipStage0: () => void;
}

export function Stage0OocemrPanel({
  draft,
  onPatchDraft,
  onSkipStage0,
}: Stage0OocemrPanelProps) {
  return (
    <div data-testid="mission-stage-panel-0" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-medium text-white">
            Stage 0: Strategic Crossroads &amp; Decision Filter (OOCEMR Gate)
          </h3>
          <p className="text-xs text-zinc-400">
            Outcome → Options (≥3 COAs) → Consequences → Weighted Score → Mitigate → Resolve.
          </p>
        </div>
        <button
          type="button"
          data-testid="mission-skip-stage0-btn"
          onClick={onSkipStage0}
          className="px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/5 transition"
        >
          Decision Already Locked → Skip Stage 0
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-mono text-cyan-400 uppercase mb-1">
          Outcome (Exact Desired Result)
        </label>
        <input
          type="text"
          data-testid="mission-oocemr-outcome-input"
          value={draft.oocemr.outcome}
          onChange={(e) =>
            onPatchDraft((p) => ({
              ...p,
              oocemr: { ...p.oocemr, outcome: e.target.value },
            }))
          }
          placeholder="What exact measurable outcome must exist when this decision succeeds?"
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1424] border border-white/10 text-xs text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {draft.oocemr.options.map((opt) => {
          const weightedScore = Math.round(
            (opt.impactScore * 0.45 + opt.speedScore * 0.3 + opt.riskScore * 0.25) * 10
          );
          const isWinner = draft.oocemr.selectedOptionId === opt.id;

          const patchOpt = (patch: Partial<typeof opt>) =>
            onPatchDraft((p) => ({
              ...p,
              oocemr: {
                ...p.oocemr,
                options: p.oocemr.options.map((o) => (o.id === opt.id ? { ...o, ...patch } : o)),
              },
            }));

          return (
            <div
              key={opt.id}
              data-testid={`mission-coa-card-${opt.id}`}
              className={`p-4 rounded-2xl border space-y-2.5 transition ${
                isWinner
                  ? "border-amber-400/70 bg-amber-500/10"
                  : "border-white/10 bg-[#0e1424]/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => patchOpt({ label: e.target.value })}
                  className="bg-transparent text-xs font-mono font-medium text-white w-full focus:outline-none"
                />
                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[11px] shrink-0">
                  {weightedScore}/100
                </span>
              </div>

              <input
                type="text"
                value={opt.upsides}
                onChange={(e) => patchOpt({ upsides: e.target.value })}
                placeholder="2nd/3rd-order upsides..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-200"
              />
              <input
                type="text"
                value={opt.downsides}
                onChange={(e) => patchOpt({ downsides: e.target.value })}
                placeholder="Downsides / time & cost impact..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-200"
              />
              <input
                type="text"
                value={opt.mitigation}
                onChange={(e) => patchOpt({ mitigation: e.target.value })}
                placeholder="Pre-built risk mitigation safeguard..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-200"
              />

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-zinc-400">
                <label>
                  Impact ({opt.impactScore})
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={opt.impactScore}
                    onChange={(e) => patchOpt({ impactScore: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>
                <label>
                  Speed ({opt.speedScore})
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={opt.speedScore}
                    onChange={(e) => patchOpt({ speedScore: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>
                <label>
                  Safety ({opt.riskScore})
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={opt.riskScore}
                    onChange={(e) => patchOpt({ riskScore: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>
              </div>

              <button
                type="button"
                data-testid={`mission-lock-coa-${opt.id}`}
                onClick={() =>
                  onPatchDraft((p) => ({
                    ...p,
                    oocemr: { ...p.oocemr, selectedOptionId: opt.id, resolved: true },
                  }))
                }
                className={`w-full py-1.5 rounded-xl text-[11px] font-mono uppercase transition ${
                  isWinner
                    ? "bg-amber-400 text-zinc-950 font-medium"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300"
                }`}
              >
                {isWinner ? "✓ Winning COA Locked" : "Lock Winning COA"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
