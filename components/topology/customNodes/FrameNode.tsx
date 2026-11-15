"use client";

import React, { useState } from "react";
import { NodeProps, NodeToolbar, useReactFlow } from "@xyflow/react";
import { Layout, Trash2, Copy, Lock } from "lucide-react";

export function FrameNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const [title, setTitle] = useState<string>((data.title as string) || (data.label as string) || "System Frame");
  const color = (data.color as string) || "#0969DA";
  const width = (data.width as number) || 520;
  const height = (data.height as number) || 400;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, title: val, label: val } } : n))
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
          id: `frame-${Date.now()}`,
          position: { x: current.position.x + 50, y: current.position.y + 50 },
          selected: false,
        },
      ];
    });
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderColor: selected ? "#38BDF8" : `${color}40`,
        backgroundColor: `${color}08`,
      }}
      className={`relative rounded-3xl border-2 border-dashed backdrop-blur-[2px] transition-all p-4 flex flex-col justify-between pointer-events-none select-none ${
        selected ? "ring-2 ring-sky-400/50 shadow-2xl" : ""
      }`}
    >
      {/* Contextual Toolbar */}
      <NodeToolbar
        isVisible={selected}
        className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 text-xs"
      >
        <button
          onClick={handleDuplicate}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Duplicate Frame"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
          title="Delete Frame"
        >
          <Trash2 size={13} />
        </button>
      </NodeToolbar>

      {/* Frame Header Bar */}
      <div className="pointer-events-auto flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center border"
            style={{ backgroundColor: `${color}25`, borderColor: `${color}50` }}
          >
            <Layout size={13} style={{ color }} />
          </div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent border-none outline-none font-bold text-xs tracking-wider uppercase font-mono text-zinc-200 focus:text-white"
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            {data.category ? String(data.category) : "TIER CONTAINER"}
          </span>
        </div>
      </div>

      {/* Bottom watermark */}
      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600">
        <span>MIRO / LUCID FRAME</span>
        <span>{width}×{height}</span>
      </div>
    </div>
  );
}
