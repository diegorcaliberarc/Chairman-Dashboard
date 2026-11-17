"use client";

import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  X,
  Copy,
  Check,
  Code2,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { ArchitectureNode } from "@/lib/architectureRegistry";

interface NodeInspectorDrawerProps {
  node: ArchitectureNode | null;
  onClose: () => void;
}

export function NodeInspectorDrawer({ node, onClose }: NodeInspectorDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!node) return null;

  const handleCopyRoute = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(node.route);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "WIP":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "PLANNED":
      default:
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 w-full max-w-[380px] rounded-2xl bg-[#080C18]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4">
      {/* Header Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-amber-500 to-emerald-500" />

      <div className="p-5 space-y-4">
        {/* Title & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border tracking-wider ${getStatusColor(
                  node.status
                )}`}
              >
                ● {node.status}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
                {node.pillar}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">{node.label}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{node.subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
            title="Close Inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Route Path Box */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-sky-400">
          <div className="truncate">
            <span className="text-zinc-500 select-none">route: </span>
            <span className="font-semibold text-sky-300">{node.route}</span>
          </div>
          <button
            onClick={handleCopyRoute}
            className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition flex-shrink-0"
            title="Copy Route Path"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Subsystem Description */}
        <div className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
          {node.description}
        </div>

        {/* Sub-features */}
        {node.subFeatures && node.subFeatures.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-zinc-400">
              <Layers size={12} className="text-amber-400" />
              <span>KEY CAPABILITIES</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.subFeatures.map((feat, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[11px] text-zinc-200"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Associated APIs */}
        {node.apis && node.apis.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-zinc-400">
              <Server size={12} className="text-sky-400" />
              <span>LINKED APIS & HANDLERS</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              {node.apis.map((api, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded-md bg-black/30 border border-white/5 text-zinc-300 truncate"
                >
                  {api}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {node.techStack && node.techStack.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-zinc-400">
              <Code2 size={12} className="text-purple-400" />
              <span>TECH STACK</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.techStack.map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono text-purple-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Button: Launch Page */}
        <div className="pt-2">
          {node.route && node.route !== "/" ? (
            <Link
              href={node.route}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]"
            >
              <span>Launch Module</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <span>View Master Cockpit</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
