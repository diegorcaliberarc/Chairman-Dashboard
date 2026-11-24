"use client";

import React, { useState, useEffect } from "react";
import { X, Play, RotateCcw, Copy, Check, Save } from "lucide-react";
import { useSafeTimeout } from "@/lib/hooks/useTimers";

interface MermaidSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode: string;
  onApply: (newCode: string) => void;
  onSave: (newCode: string) => void;
  onReset: () => void;
}

export function MermaidSourceDrawer({
  isOpen,
  onClose,
  initialCode,
  onApply,
  onSave,
  onReset,
}: MermaidSourceDrawerProps) {
  const scheduleTimeout = useSafeTimeout();
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      scheduleTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveClick = () => {
    onSave(code);
    setSaved(true);
    scheduleTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 z-50 w-full max-w-[520px] bg-[#070A14]/98 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Mermaid Architecture Source
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="Close Drawer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Editor Description */}
      <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/5 text-[11px] text-zinc-400">
        Edit flowchart syntax live. Mermaid auto-routes all edges and subgraphs with zero overlapping boxes.
      </div>

      {/* Code Textarea */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full flex-1 p-3.5 rounded-xl bg-black/60 border border-white/10 text-sky-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-sky-500/50 selection:bg-sky-500/30"
          placeholder="flowchart TD..."
        />
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/10 bg-black/40 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition font-mono text-[11px]"
            title="Reset to default template"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition font-mono text-[11px]"
            title="Copy Mermaid code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onApply(code)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition"
          >
            <Play size={13} className="text-amber-400 fill-amber-400" />
            <span>Apply</span>
          </button>
          <button
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition shadow-lg shadow-sky-500/20"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            <span>{saved ? "Saved!" : "Save Space"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
