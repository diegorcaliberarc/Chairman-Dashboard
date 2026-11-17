"use client";

import React, { useState } from "react";
import { Sparkles, Edit3, Check, Ruler, Activity } from "lucide-react";

export interface BiometricDimensions {
  neck: number;
  shoulders: number;
  chest: number;
  biceps: number;
  waist: number;
  hips: number;
  thighs: number;
  calves: number;
}

interface BiometricSilhouetteHUDProps {
  measurements: BiometricDimensions;
  onUpdateMeasurement: (part: keyof BiometricDimensions, value: number) => void;
  onQuickNaturalInput: (text: string) => void;
}

export function BiometricSilhouetteHUD({
  measurements,
  onUpdateMeasurement,
  onQuickNaturalInput,
}: BiometricSilhouetteHUDProps) {
  const [quickInput, setQuickInput] = useState("");
  const [editingPart, setEditingPart] = useState<keyof BiometricDimensions | null>(null);

  const handleSubmitQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickNaturalInput(quickInput.trim());
    setQuickInput("");
  };

  return (
    <div className="bg-[#0F131C] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Frontal Biometric Dimension Scanner
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-400/30">
          Front View Only • v5.0
        </span>
      </div>

      {/* Wireframe Graphic Display with Floating Callouts */}
      <div className="relative mt-4 rounded-2xl overflow-hidden border border-cyan-400/20 bg-[#070A14] p-3">
        <div className="relative min-h-[500px] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#060B13] via-[#0A0E1A] to-[#0F131C]">
          {/* Front Silhouette Graphic */}
          <img
            src="/workouts/body_silhouette.png"
            alt="Front-facing anatomical wireframe vector silhouette"
            className="w-full max-h-[520px] object-contain filter contrast-125 brightness-110 pointer-events-none select-none"
          />

          {/* 1. Neck Callout (Top Left) */}
          <div className="absolute top-4 left-3 bg-[#0C101B]/95 backdrop-blur-md border border-cyan-400/40 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Neck</div>
            <div className="text-white font-bold">
              {measurements.neck} in{" "}
              <span className="text-[10px] text-zinc-500 font-normal">
                ({Math.round(measurements.neck * 2.54)} cm)
              </span>
            </div>
          </div>

          {/* 2. Shoulders Callout (Top Right) */}
          <div className="absolute top-8 right-3 bg-[#0C101B]/95 backdrop-blur-md border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl text-right">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Shoulders</div>
            <div className="text-amber-300 font-bold">
              {measurements.shoulders} in{" "}
              <span className="text-[10px] text-zinc-400 font-normal">
                ({Math.round(measurements.shoulders * 2.54)} cm)
              </span>
            </div>
          </div>

          {/* 3. Chest (Thorax) Callout (Mid Left) */}
          <div className="absolute top-24 left-3 bg-[#0C101B]/95 backdrop-blur-md border border-cyan-400/50 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Chest (Thorax)</div>
            <div className="text-cyan-300 font-bold">
              {measurements.chest > 0 ? `${measurements.chest} in` : `--`}
              {measurements.chest > 0 && (
                <span className="text-[10px] text-zinc-400 font-normal ml-1">
                  ({Math.round(measurements.chest * 2.54)} cm)
                </span>
              )}
            </div>
            {measurements.chest > 0 && (
              <div className="text-[9px] text-emerald-400 font-semibold">+0.4 in hypertrophy</div>
            )}
          </div>

          {/* 4. Biceps Callout (Mid Right) */}
          <div className="absolute top-36 right-3 bg-[#0C101B]/95 backdrop-blur-md border border-cyan-400/40 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl text-right">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Biceps (L / R)</div>
            <div className="text-white font-bold">
              {measurements.biceps > 0 ? `${measurements.biceps} in` : `--`}
              {measurements.biceps > 0 && (
                <span className="text-[10px] text-zinc-500 font-normal ml-1">
                  ({Math.round(measurements.biceps * 2.54)} cm)
                </span>
              )}
            </div>
            {measurements.biceps > 0 && (
              <div className="text-[9px] text-emerald-400 font-semibold">Symmetric: 99.4%</div>
            )}
          </div>

          {/* 5. Waist Callout (Lower Left) */}
          <div className="absolute top-52 left-3 bg-[#0C101B]/95 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Waist</div>
            <div className="text-white font-bold">
              {measurements.waist > 0 ? `${measurements.waist} in` : `--`}
              {measurements.waist > 0 && (
                <span className="text-[10px] text-zinc-500 font-normal ml-1">
                  ({Math.round(measurements.waist * 2.54)} cm)
                </span>
              )}
            </div>
            {measurements.waist > 0 && (
              <div className="text-[9px] text-cyan-300 font-semibold">Taper Index: V-Taper</div>
            )}
          </div>

          {/* 6. Hips Callout (Lower Right) */}
          <div className="absolute top-64 right-3 bg-[#0C101B]/95 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl text-right">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Hips</div>
            <div className="text-white font-bold">
              {measurements.hips} in{" "}
              <span className="text-[10px] text-zinc-500 font-normal">
                ({Math.round(measurements.hips * 2.54)} cm)
              </span>
            </div>
          </div>

          {/* 7. Thighs Callout (Bottom Left) */}
          <div className="absolute bottom-20 left-3 bg-[#0C101B]/95 backdrop-blur-md border border-cyan-400/40 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Thighs (Quads)</div>
            <div className="text-white font-bold">
              {measurements.thighs} in{" "}
              <span className="text-[10px] text-zinc-500 font-normal">
                ({Math.round(measurements.thighs * 2.54)} cm)
              </span>
            </div>
          </div>

          {/* 8. Calves Callout (Bottom Right) */}
          <div className="absolute bottom-8 right-3 bg-[#0C101B]/95 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-xl text-right">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider">Calves</div>
            <div className="text-white font-bold">
              {measurements.calves} in{" "}
              <span className="text-[10px] text-zinc-500 font-normal">
                ({Math.round(measurements.calves * 2.54)} cm)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Interactive Tape Measurement Input Pills */}
      <div className="mt-4 space-y-3">
        <div className="text-[11px] font-mono text-zinc-300 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">📏</span> Interactive Tape Measurement Updates
          </span>
          <span className="text-[10px] text-zinc-500">Live Sync</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Chest Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-cyan-400/40 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">CHEST</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.chest}
                onChange={(e) => onUpdateMeasurement("chest", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Shoulders Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-amber-400/40 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">SHOULDERS</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.shoulders}
                onChange={(e) => onUpdateMeasurement("shoulders", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-amber-300 font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Biceps Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-cyan-400/40 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">BICEPS (R)</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.biceps}
                onChange={(e) => onUpdateMeasurement("biceps", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Waist Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-white/20 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">WAIST</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.waist}
                onChange={(e) => onUpdateMeasurement("waist", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Neck Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-white/20 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">NECK</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.neck}
                onChange={(e) => onUpdateMeasurement("neck", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Hips Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-white/20 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">HIPS</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.hips}
                onChange={(e) => onUpdateMeasurement("hips", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Thighs Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-cyan-400/40 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">THIGHS (R)</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.thighs}
                onChange={(e) => onUpdateMeasurement("thighs", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>

          {/* Calves Pill */}
          <div className="bg-[#0A0D16] border border-white/10 hover:border-white/20 rounded-xl p-2.5 transition">
            <div className="text-[9px] font-mono text-zinc-400">CALVES</div>
            <div className="flex items-center justify-between mt-1">
              <input
                type="number"
                step="0.1"
                value={measurements.calves}
                onChange={(e) => onUpdateMeasurement("calves", parseFloat(e.target.value) || 0)}
                className="w-16 bg-transparent border-0 p-0 text-white font-mono font-bold text-xs focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-500">in</span>
            </div>
          </div>
        </div>

        {/* Voice Quick Metric Update Bar */}
        <form onSubmit={handleSubmitQuick} className="pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Type or say: 'Update chest to 46.8 in'"
              className="flex-1 bg-[#0A0D16] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-cyan-400/50 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-mono px-3.5 py-2 rounded-xl transition border border-white/10 shrink-0 font-semibold"
            >
              Update Biometrics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
