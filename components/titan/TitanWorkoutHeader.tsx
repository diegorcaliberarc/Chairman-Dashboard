"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface TitanWorkoutHeaderProps {
  currentDate: string;
  onPrevDate: () => void;
  onNextDate: () => void;
  activeRoutineName: string;
  isListening: boolean;
  onToggleVoice: () => void;
  restSeconds: number;
  isRestActive: boolean;
  onStartRest: (secs?: number) => void;
  onPauseRest: () => void;
  onResetRest: () => void;
  onToggleGlassStudio?: () => void;
}

export function TitanWorkoutHeader({
  currentDate,
  onPrevDate,
  onNextDate,
  activeRoutineName,
  isListening,
  onToggleVoice,
  restSeconds,
  isRestActive,
  onStartRest,
  onPauseRest,
  onResetRest,
  onToggleGlassStudio,
}: TitanWorkoutHeaderProps) {
  // Format MM:SS for rest timer
  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <header className="h-20 bg-[#0A0D18]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xl">
      {/* Left: Status Breadcrumb & Title */}
      <div className="flex items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse" />
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              Hypertrophy & Strength
            </span>
            <span className="text-zinc-600 font-mono text-xs">{"//"}</span>
            <h1 className="text-sm sm:text-base font-display font-extrabold tracking-wide text-white uppercase">
              Titan Bodybuilding Engine
            </h1>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5 hidden sm:block">
            Clean Progressive Overload, Set Telemetry & Integrated Rest Timers
          </p>
        </div>
      </div>

      {/* Right: Rest Timer Pill, AI Voice Logger Trigger, Date Navigation */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live AI Voice Logger Pill */}
        <div
          onClick={onToggleVoice}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border ${
            isListening
              ? "bg-cyan-950/60 border-cyan-400/60 shadow-[0_0_18px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400"
              : "bg-[#111624] border-white/10 hover:border-cyan-400/40 hover:bg-[#141b2e]"
          }`}
          title={isListening ? "Listening... click to stop" : "Click to speak workout logs"}
        >
          <div className="flex items-center gap-1 px-0.5">
            <span
              className={`w-1 h-3 rounded-full transition-all ${
                isListening ? "bg-cyan-400 animate-pulse h-4" : "bg-zinc-600"
              }`}
            />
            <span
              className={`w-1 h-4 rounded-full transition-all ${
                isListening ? "bg-cyan-300 animate-pulse h-5" : "bg-zinc-600"
              }`}
            />
            <span
              className={`w-1 h-2 rounded-full transition-all ${
                isListening ? "bg-cyan-400 animate-pulse h-3" : "bg-zinc-600"
              }`}
            />
          </div>
          <button
            type="button"
            className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5"
          >
            <span>🎙️ {isListening ? "Listening..." : "Voice Logger"}</span>
            {isListening && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center bg-[#111624] border border-white/10 rounded-xl px-2 py-1 text-xs font-mono text-zinc-300">
          <button
            onClick={onPrevDate}
            className="text-zinc-400 hover:text-white px-1.5 py-0.5 font-bold transition hover:bg-white/5 rounded"
            title="Previous Day"
          >
            ‹
          </button>
          <span className="mx-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-200">
            <span>📅</span> {currentDate} {activeRoutineName}
          </span>
          <button
            onClick={onNextDate}
            className="text-zinc-400 hover:text-white px-1.5 py-0.5 font-bold transition hover:bg-white/5 rounded"
            title="Next Day"
          >
            ›
          </button>
        </div>

        {/* Rest Timer Pill */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-mono font-medium">
          <Timer size={14} className={isRestActive ? "animate-spin text-amber-400" : ""} />
          <span>
            Rest: <strong>{formatTime(restSeconds)}</strong>
          </span>
          {isRestActive ? (
            <button
              onClick={onPauseRest}
              className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded transition"
              title="Pause Rest"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={() => onStartRest(90)}
              className="bg-amber-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded hover:bg-amber-300 transition"
              title="Start 90s Rest"
            >
              Start
            </button>
          )}
          <button
            onClick={onResetRest}
            className="text-zinc-400 hover:text-white p-0.5 transition"
            title="Reset Rest Timer"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Glass Studio Mode Button */}
        {onToggleGlassStudio && (
          <button
            onClick={onToggleGlassStudio}
            className="bg-[#111624] hover:bg-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-mono border border-white/10 transition hidden lg:flex items-center gap-1.5"
            title="Open Glass Studio Customizer"
          >
            <Eye size={13} className="text-zinc-400" />
            <span>Glass Studio</span>
          </button>
        )}
      </div>
    </header>
  );
}
