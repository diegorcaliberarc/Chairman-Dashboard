"use client";

import React, { useState } from "react";
import { NodeProps, NodeToolbar, useReactFlow } from "@xyflow/react";
import { Copy, Trash2 } from "lucide-react";

export function TextNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const [text, setText] = useState<string>((data.text as string) || (data.label as string) || "Double-click to type text");
  const fontSize = (data.fontSize as string) || "text-base";

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: val, label: val } } : n))
    );
  };

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  };

  return (
    <div className="relative group min-w-44">
      <NodeToolbar
        isVisible={selected}
        className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 text-xs"
      >
        <button
          onClick={handleDelete}
          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </NodeToolbar>

      <div
        className={`p-2 rounded-xl border transition-all ${
          selected
            ? "border-sky-400/80 bg-black/40 ring-1 ring-sky-400"
            : "border-transparent hover:border-white/10"
        }`}
      >
        <textarea
          value={text}
          onChange={handleChange}
          rows={2}
          className={`w-full bg-transparent resize-none border-none outline-none font-bold text-zinc-100 placeholder:text-zinc-600 ${fontSize}`}
          placeholder="Type text or header..."
        />
      </div>
    </div>
  );
}
