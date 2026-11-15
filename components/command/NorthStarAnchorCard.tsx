"use client";

import React, { useState } from "react";
import { CommandNorthStar, LifeDomain } from "@/lib/commandTypes";
import { Target, Calendar, Edit3, Plus, Sparkles, Image as ImageIcon } from "lucide-react";

interface NorthStarAnchorCardProps {
  domain: LifeDomain;
  northStar: CommandNorthStar | null;
  onSaveNorthStar: (data: Partial<CommandNorthStar>) => void;
}

const DOMAIN_CONFIG: Record<
  LifeDomain,
  { label: string; defaultTitle: string; accentColor: string; defaultUnit: string; defaultTarget: number }
> = {
  health: {
    label: "Health & Biometrics",
    defaultTitle: "Operation Objective 155",
    accentColor: "#10b981",
    defaultUnit: "lbs",
    defaultTarget: 155.0,
  },
  wealth: {
    label: "Wealth & Sovereign Ops",
    defaultTitle: "Sovereign SaaS & Estate",
    accentColor: "#f59e0b",
    defaultUnit: "$/mo",
    defaultTarget: 50000,
  },
  relationships: {
    label: "Family & Relationships",
    defaultTitle: "Protected Clan & Harmony",
    accentColor: "#38bdf8",
    defaultUnit: "Cadence %",
    defaultTarget: 100,
  },
  happiness: {
    label: "Pursuit of Happiness",
    defaultTitle: "Cognitive Freedom & Mastery",
    accentColor: "#a855f7",
    defaultUnit: "Mindset Score",
    defaultTarget: 100,
  },
};

export function NorthStarAnchorCard({
  domain,
  northStar,
  onSaveNorthStar,
}: NorthStarAnchorCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const cfg = DOMAIN_CONFIG[domain];

  const [title, setTitle] = useState(northStar?.title || cfg.defaultTitle);
  const [vision, setVision] = useState(northStar?.vision_statement || "");
  const [metricLabel, setMetricLabel] = useState(northStar?.target_metric_label || "Target Weight");
  const [targetVal, setTargetVal] = useState(northStar?.target_metric_value || cfg.defaultTarget);
  const [currentVal, setCurrentVal] = useState(northStar?.current_metric_value || 0);
  const [unit, setUnit] = useState(northStar?.metric_unit || cfg.defaultUnit);
  const [targetDate, setTargetDate] = useState(northStar?.target_date || "");
  const [coverUrl, setCoverUrl] = useState(northStar?.cover_image_url || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNorthStar({
      domain,
      title,
      vision_statement: vision,
      target_metric_label: metricLabel,
      target_metric_value: Number(targetVal),
      current_metric_value: Number(currentVal),
      metric_unit: unit,
      target_date: targetDate || null,
      cover_image_url: coverUrl.trim() || null,
    });
    setIsEditing(false);
  };

  const progressPct =
    northStar && northStar.target_metric_value > 0
      ? Math.min(100, Math.max(0, Math.round((northStar.current_metric_value / northStar.target_metric_value) * 100)))
      : 0;

  if (!northStar && !isEditing) {
    return (
      <div className="w-[280px] shrink-0 h-full min-h-[380px] rounded-2xl bg-zinc-950/60 border border-white/10 border-dashed p-6 flex flex-col items-center justify-center text-center space-y-3 backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
          <Target size={22} style={{ color: cfg.accentColor }} />
        </div>
        <div className="text-sm font-bold text-white font-mono">{cfg.label}</div>
        <p className="text-xs text-zinc-500 max-w-[220px]">
          No North Star Anchor set for {cfg.label}. Set your sovereign benchmark.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-white transition active:scale-95"
        >
          <Plus size={13} />
          Set North Star
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="w-[280px] shrink-0 rounded-2xl bg-zinc-950 border border-white/15 p-5 shadow-2xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="font-bold text-white uppercase tracking-wider">Configure North Star</span>
          <button
            onClick={() => setIsEditing(false)}
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-2.5">
          <div>
            <label className="text-[10px] text-zinc-400 uppercase">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase">Vision Statement</label>
            <textarea
              rows={2}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-sans"
              placeholder="Sovereign outcome description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase">Metric Label</label>
              <input
                type="text"
                value={metricLabel}
                onChange={(e) => setMetricLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 uppercase">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase">Target Value</label>
              <input
                type="number"
                step="any"
                value={targetVal}
                onChange={(e) => setTargetVal(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 uppercase">Current Value</label>
              <input
                type="number"
                step="any"
                value={currentVal}
                onChange={(e) => setCurrentVal(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase">Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-sans"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 rounded-2xl bg-zinc-950/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col justify-between group hover:border-white/20 transition">
      <div>
        {/* Cover Image Banner */}
        <div className="h-28 w-full relative overflow-hidden bg-zinc-900">
          {northStar?.cover_image_url ? (
            <img
              src={northStar.cover_image_url}
              alt={northStar.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div
              className="w-full h-full opacity-40 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${cfg.accentColor}22 0%, #0a0c14 100%)`,
              }}
            >
              <Target size={36} style={{ color: cfg.accentColor }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

          {/* Domain Tag */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
            {cfg.label}
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white transition opacity-0 group-hover:opacity-100"
            title="Edit North Star"
          >
            <Edit3 size={12} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 font-mono">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide leading-snug">
              {northStar?.title}
            </h3>
            {northStar?.vision_statement && (
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 font-sans">
                {northStar.vision_statement}
              </p>
            )}
          </div>

          {/* Target Metric vs Current */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px]">{northStar?.target_metric_label}</span>
              <span className="font-bold text-white">
                {northStar?.target_metric_value} {northStar?.metric_unit}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: cfg.accentColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>Current: {northStar?.current_metric_value} {northStar?.metric_unit}</span>
                <span className="font-bold text-zinc-300">{progressPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Date Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500 bg-zinc-950/40">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {northStar?.target_date ? `Target: ${northStar.target_date}` : "No Deadline Set"}
        </span>
        <span className="text-[10px] uppercase font-bold" style={{ color: cfg.accentColor }}>
          North Star
        </span>
      </div>
    </div>
  );
}
