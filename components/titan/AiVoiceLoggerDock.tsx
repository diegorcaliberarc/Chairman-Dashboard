"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Check, Sparkles, Send, Volume2 } from "lucide-react";
import { SessionExercise } from "./ExerciseDeck";

interface AiVoiceLoggerDockProps {
  exercises: SessionExercise[];
  isListening: boolean;
  onToggleVoice: () => void;
  onProcessInput: (input: string) => Promise<void>;
  onManualLogSet: (exerciseId: string, weight: number, reps: number, rpe: number) => void;
  lastFeedbackMessage?: string | null;
}

export function AiVoiceLoggerDock({
  exercises,
  isListening,
  onToggleVoice,
  onProcessInput,
  onManualLogSet,
  lastFeedbackMessage,
}: AiVoiceLoggerDockProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id || ""
  );
  const [weightInput, setWeightInput] = useState<string>("");
  const [repsInput, setRepsInput] = useState<string>("");
  const [rpeInput, setRpeInput] = useState<string>("9");
  const [speechTextInput, setSpeechTextInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (exercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(exercises[0].id);
    }
  }, [exercises, selectedExerciseId]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExerciseId) return;
    const w = parseFloat(weightInput) || 0;
    const r = parseInt(repsInput, 10) || 0;
    const rpe = parseFloat(rpeInput) || 9.0;
    if (w <= 0 && r <= 0) return;

    onManualLogSet(selectedExerciseId, w, r, rpe);
    setWeightInput("");
    setRepsInput("");
  };

  const handleTextVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechTextInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onProcessInput(speechTextInput.trim());
      setSpeechTextInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="rounded-2xl border backdrop-blur-xl px-4 sm:px-6 py-4 shadow-lg select-none transition-colors"
      style={{
        backgroundColor: "var(--glass-surface)",
        borderColor: "var(--glass-border)",
      }}
    >
      <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* Left: AI Voice Live Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={onToggleVoice}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
              isListening
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-400 shadow-[0_0_15px_#00f0ff]"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
            }`}
          >
            {isListening ? <Mic size={18} className="animate-pulse" /> : <Mic size={16} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-medium tracking-wide"
                style={{ color: "var(--glass-text-primary)" }}
              >
                AI Real-Time Voice Logger
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-medium border ${
                  isListening
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-400 animate-pulse"
                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-500"
                }`}
              >
                {isListening ? "● Listening" : "Standby"}
              </span>
            </div>
            <p
              className="text-[11px] font-mono truncate max-w-[300px]"
              style={{ color: "var(--glass-text-muted)" }}
            >
              {lastFeedbackMessage || '"Say: Incline Smith 225 lbs for 8 reps at RPE 9"'}
            </p>
          </div>
        </div>

        {/* Center: Quick Log Manual Input Strip & Natural Text Input */}
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full max-w-3xl">
          {/* Quick Manual Set Form */}
          <form
            onSubmit={handleManualSubmit}
            className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
          >
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-[#080B14] border border-white/10 text-xs font-mono text-white rounded-xl py-1.5 px-3 focus:border-amber-400/50 focus:outline-none max-w-[190px] truncate"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              placeholder="225 lbs"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-20 bg-[#080B14] border border-white/10 text-xs font-mono text-white rounded-xl py-1.5 px-2.5 focus:border-amber-400/50 focus:outline-none"
            />

            <input
              type="number"
              min="0"
              placeholder="8 reps"
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
              className="w-16 bg-[#080B14] border border-white/10 text-xs font-mono text-white rounded-xl py-1.5 px-2 focus:border-amber-400/50 focus:outline-none"
            />

            <input
              type="number"
              step="0.5"
              min="5"
              max="10"
              placeholder="RPE 9"
              value={rpeInput}
              onChange={(e) => setRpeInput(e.target.value)}
              className="w-16 bg-[#080B14] border border-white/10 text-xs font-mono text-white rounded-xl py-1.5 px-2 focus:border-amber-400/50 focus:outline-none"
            />

            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono font-bold py-1.5 px-3.5 rounded-xl transition shrink-0 active:scale-95 shadow-md shadow-amber-400/20"
            >
              + Log Set
            </button>
          </form>

          {/* Quick Natural Text / Command input */}
          <form onSubmit={handleTextVoiceSubmit} className="flex-1 flex items-center gap-1.5 w-full">
            <input
              type="text"
              placeholder="or type speech: 'incline 225 for 8'"
              value={speechTextInput}
              onChange={(e) => setSpeechTextInput(e.target.value)}
              className="flex-1 bg-[#080B14] border border-white/10 text-xs font-mono text-cyan-200 placeholder-zinc-600 rounded-xl py-1.5 px-3 focus:border-cyan-400/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !speechTextInput.trim()}
              className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-40"
              title="Process Text Speech"
            >
              <Send size={13} />
            </button>
          </form>
        </div>

        {/* Right: Voice Mic Pulsing Action Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition shadow-lg ${
              isListening
                ? "bg-red-500 hover:bg-red-400 text-white shadow-red-500/30 ring-2 ring-red-400/50 animate-pulse"
                : "bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 shadow-cyan-500/10"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isListening ? "bg-white animate-ping" : "bg-cyan-400 animate-pulse"
              }`}
            />
            <span>{isListening ? "Stop Listening" : "Tap to Speak Set"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
