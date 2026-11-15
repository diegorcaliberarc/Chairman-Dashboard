"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from "@xyflow/react";
import {
  Activity,
  Calendar,
  Compass,
  Copy,
  Cpu,
  Database,
  Dumbbell,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Layers,
  Network,
  Orbit,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

export function SystemNode({ id, data, selected }: NodeProps) {
  const router = useRouter();
  const { setNodes } = useReactFlow();
  const reactions: Record<string, number> = (data.reactions as Record<string, number>) || {};

  const renderIcon = (name: string, color: string) => {
    const props = { size: 16, style: { color } };
    switch (name) {
      case "orbit":
        return <Orbit {...props} />;
      case "dumbbell":
        return <Dumbbell {...props} />;
      case "utensils":
        return <Utensils {...props} />;
      case "calendar":
        return <Calendar {...props} />;
      case "layers":
        return <Layers {...props} />;
      case "wallet":
        return <Wallet {...props} />;
      case "graduation":
        return <GraduationCap {...props} />;
      case "heart":
        return <HeartHandshake {...props} />;
      case "cpu":
        return <Cpu {...props} />;
      case "database":
        return <Database {...props} />;
      default:
        return <Zap {...props} />;
    }
  };

  const handleAddReaction = (emoji: string) => {
    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id !== id) return n;
        const currentReactions = { ...((n.data.reactions as Record<string, number>) || {}) };
        currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
        return {
          ...n,
          data: { ...n.data, reactions: currentReactions },
        };
      })
    );
  };

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  };

  const handleDuplicate = () => {
    setNodes((nodes) => {
      const current = nodes.find((n) => n.id === id);
      if (!current) return nodes;
      return [
        ...nodes,
        {
          ...current,
          id: `node-${Date.now()}`,
          position: { x: current.position.x + 40, y: current.position.y + 40 },
          selected: false,
        },
      ];
    });
  };

  const color = (data.color as string) || "#0969DA";

  return (
    <div className="relative group">
      {/* Contextual Miro / Lucidspark Toolbar */}
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 text-xs"
      >
        <div className="flex items-center gap-1 border-r border-white/10 pr-2">
          {["🔥", "🚀", "💡", "❤️", "👍"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              className="hover:scale-125 transition-transform text-xs px-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>

        {Boolean(data.route) && (
          <button
            onClick={() => router.push(String(data.route))}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors font-mono text-[11px]"
            title="Open Engine"
          >
            <span>Open</span>
            <ExternalLink size={11} />
          </button>
        )}

        <button
          onClick={handleDuplicate}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Duplicate Node"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
          title="Delete Node"
        >
          <Trash2 size={13} />
        </button>
      </NodeToolbar>

      {/* Handles on 4 sides */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-zinc-500 hover:!bg-sky-400" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-zinc-500 hover:!bg-sky-400" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-zinc-500 hover:!bg-sky-400" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-zinc-500 hover:!bg-sky-400" />

      {/* Node Body */}
      <div
        onClick={() => {
          if (data.route && !selected) router.push(String(data.route));
        }}
        style={{ borderColor: selected ? "#38BDF8" : `${color}55` }}
        className={`group relative rounded-2xl border bg-[#0E1017]/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-150 cursor-pointer ${
          data.isRoot
            ? "w-72 ring-2 ring-[#0969DA]/50 shadow-[#0969DA]/20"
            : "w-64"
        } ${selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black scale-105" : "hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}35`,
              }}
            >
              {renderIcon(String(data.iconName || "zap"), color)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">
                {String(data.label || "System Node")}
              </h4>
              <p className="text-[10px] text-zinc-400 font-mono">
                {String(data.subtitle || "")}
              </p>
            </div>
          </div>

          {Boolean(data.statusBadge) && (
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color: color,
              }}
            >
              {String(data.statusBadge)}
            </span>
          )}
        </div>

        {/* Footer info & reactions */}
        <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>{String(data.category || "ENGINE")}</span>

          {/* Reaction count badges */}
          <div className="flex items-center gap-1">
            {Object.entries(reactions).map(([emoji, count]) => (
              <span
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddReaction(emoji);
                }}
                className="px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-zinc-300 cursor-pointer hover:bg-white/10"
              >
                {emoji} {String(count)}
              </span>
            ))}
          </div>

          {Boolean(data.route) && (
            <span className="text-[#58A6FF] opacity-0 group-hover:opacity-100 transition-opacity">
              Open →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
