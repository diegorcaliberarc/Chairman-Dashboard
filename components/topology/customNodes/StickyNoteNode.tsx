"use client";

import React, { useState } from "react";
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from "@xyflow/react";
import { Trash2, Copy, Smile, Tag } from "lucide-react";

export const STICKY_COLORS = [
  { id: "yellow", bg: "#FEF08A", text: "#713F12", border: "#FACC15" },
  { id: "peach", bg: "#FED7AA", text: "#7C2D12", border: "#FB923C" },
  { id: "pink", bg: "#FBCFE8", text: "#831843", border: "#F472B6" },
  { id: "green", bg: "#BBF2BD", text: "#14532D", border: "#4ADE80" },
  { id: "cyan", bg: "#BAE6FD", text: "#0C4A6E", border: "#38BDF8" },
  { id: "purple", bg: "#E9D5FF", text: "#581C87", border: "#C084FC" },
  { id: "obsidian", bg: "#181A20", text: "#F4F4F5", border: "#3F3F46" },
];

export function StickyNoteNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const [text, setText] = useState<string>((data.text as string) || (data.label as string) || "Idea / Note...");
  const colorId = (data.colorId as string) || "yellow";
  const activeColor = STICKY_COLORS.find((c) => c.id === colorId) || STICKY_COLORS[0];
  const reactions: Record<string, number> = (data.reactions as Record<string, number>) || {};

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: val, label: val } } : n))
    );
  };

  const handleColorChange = (newColorId: string) => {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, colorId: newColorId } } : n))
    );
  };

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  };

  const handleDuplicate = () => {
    setNodes((nodes) => {
      const current = nodes.find((n) => n.id === id);
      if (!current) return nodes;
      const clone = {
        ...current,
        id: `sticky-${Date.now()}`,
        position: { x: current.position.x + 40, y: current.position.y + 40 },
        selected: false,
      };
      return [...nodes, clone];
    });
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

  return (
    <div className="relative group">
      {/* Contextual Miro / Lucidspark Floating Toolbar */}
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 text-xs"
      >
        {/* Color Palette Picker */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10 pr-2">
          {STICKY_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => handleColorChange(c.id)}
              className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                colorId === c.id ? "ring-2 ring-white scale-110" : ""
              }`}
              style={{ backgroundColor: c.bg, borderColor: c.border }}
              title={c.id}
            />
          ))}
        </div>

        {/* Quick Reactions */}
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

        {/* Duplicate & Delete */}
        <button
          onClick={handleDuplicate}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Duplicate"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </NodeToolbar>

      {/* Handles on all 4 cardinal directions */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-zinc-500/80 hover:!bg-sky-400" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-zinc-500/80 hover:!bg-sky-400" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-zinc-500/80 hover:!bg-sky-400" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-zinc-500/80 hover:!bg-sky-400" />

      {/* Sticky Note Body */}
      <div
        style={{
          backgroundColor: activeColor.bg,
          color: activeColor.text,
          borderColor: selected ? "#38BDF8" : activeColor.border,
        }}
        className={`w-52 min-h-52 p-4 rounded-xl border shadow-xl transition-all duration-150 flex flex-col justify-between select-text ${
          selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black scale-[1.02]" : "hover:shadow-2xl"
        }`}
      >
        {/* Note Text Area */}
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Type note or architectural observation..."
          className="w-full bg-transparent resize-none border-none outline-none font-sans text-xs leading-relaxed font-medium placeholder:opacity-50 h-32"
          style={{ color: activeColor.text }}
        />

        {/* Bottom Metadata & Reaction Badges */}
        <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-mono">
          <span className="opacity-70 font-semibold tracking-wider">
            {data.author ? String(data.author) : "CHAIRMAN"}
          </span>

          {/* Active Reaction Pills */}
          <div className="flex items-center gap-1">
            {Object.entries(reactions).map(([emoji, count]) => (
              <span
                key={emoji}
                onClick={() => handleAddReaction(emoji)}
                className="px-1.5 py-0.5 rounded-full bg-black/10 border border-black/10 text-[10px] cursor-pointer hover:bg-black/20"
              >
                {emoji} {String(count)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
