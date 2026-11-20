"use client";

import React, { useState } from "react";
import { CoPilotMode } from "@/lib/synthesisRoadmapTypes";
import { Sparkles, HelpCircle, PlusCircle, Wand2, Compass, Mic, MicOff } from "lucide-react";

interface CoPilotModeBarProps {
  currentMode: CoPilotMode;
  onChangeMode: (mode: CoPilotMode) => void;
  onSynthesizeDfy: (goal: string) => void;
  onStartDwyInterview: (initialGoal?: string) => void;
  onOpenManualBuilder: () => void;
  isProcessing?: boolean;
}

export function CoPilotModeBar({
  currentMode,
  onChangeMode,
  onSynthesizeDfy,
  onStartDwyInterview,
  onOpenManualBuilder,
  isProcessing = false,
}: CoPilotModeBarProps) {
  const [goalInput, setGoalInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleToggleVoiceGoal = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setGoalInput(transcript);
      }
    };
    recognition.start();
  };

  const handleDfySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    onSynthesizeDfy(goalInput.trim());
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-3 bg-[#0C101C]/90 border-b border-white/5 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
      {/* 1. Left: 3-Way Mode Switcher */}
      <div className="flex items-center gap-1.5 bg-[#05070E] p-1 rounded-2xl border border-white/10 shrink-0">
        <button
          onClick={() => onChangeMode("dfy")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            currentMode === "dfy"
              ? "bg-gradient-to-r from-cyan-400 to-primary text-black font-extrabold shadow-md shadow-cyan-400/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles size={13} />
          <span>Done For You</span>
        </button>

        <button
          onClick={() => onChangeMode("dwy")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            currentMode === "dwy"
              ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-extrabold shadow-md shadow-amber-400/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <HelpCircle size={13} />
          <span>Done With You</span>
        </button>

        <button
          onClick={() => onChangeMode("diy")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            currentMode === "diy"
              ? "bg-white/20 text-white font-extrabold shadow-sm border border-white/20"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <PlusCircle size={13} />
          <span>Do It Yourself</span>
        </button>
      </div>

      {/* 2. Middle/Right: Contextual Action Inputs based on Active Mode */}
      <div className="flex-1 flex items-center justify-end gap-2.5">
        {currentMode === "dfy" && (
          <form onSubmit={handleDfySubmit} className="flex-1 max-w-2xl flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Speak or type any goal (e.g. '155 lb lean cut @ 8% BF', 'Build utility sink', '$50k MRR')..."
                className="w-full bg-[#05070E] border border-white/10 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="button"
                onClick={handleToggleVoiceGoal}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition ${
                  isListening
                    ? "bg-rose-500/20 text-rose-400 animate-pulse"
                    : "text-zinc-400 hover:text-cyan-400"
                }`}
                title={isListening ? "Listening..." : "Speak your goal with microphone"}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isProcessing || !goalInput.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-cyan-400/30 transition disabled:opacity-40"
            >
              <Wand2 size={13} />
              <span>{isProcessing ? "Synthesizing..." : "Generate Full DAG"}</span>
            </button>
          </form>
        )}

        {currentMode === "dwy" && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
              AI asks clarifying questions & builds side-by-side with you
            </span>
            <button
              onClick={() => onStartDwyInterview(goalInput)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-400/30 transition"
            >
              <Compass size={13} />
              <span>Launch Interactive Interview</span>
            </button>
          </div>
        )}

        {currentMode === "diy" && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
              Pure manual node construction • Zero AI interference
            </span>
            <button
              onClick={onOpenManualBuilder}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
            >
              <PlusCircle size={13} />
              <span>+ Add Custom Node</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
