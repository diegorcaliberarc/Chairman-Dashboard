"use client";

import React, { useState } from "react";
import { Handle, Position, NodeProps, NodeToolbar, useReactFlow } from "@xyflow/react";
import { Copy, Trash2, Database, Cloud, Square, Circle, Terminal } from "lucide-react";

export const SHAPE_COLORS = [
  { id: "sky", fill: "#0369A1", stroke: "#38BDF8", text: "#E0F2FE" },
  { id: "emerald", fill: "#065F46", stroke: "#34D399", text: "#D1FAE5" },
  { id: "amber", fill: "#92400E", stroke: "#FBBF24", text: "#FEF3C7" },
  { id: "violet", fill: "#5B21B6", stroke: "#A78BFA", text: "#EDE9FE" },
  { id: "rose", fill: "#9F1239", stroke: "#FB7185", text: "#FFE4E6" },
  { id: "dark", fill: "#111318", stroke: "#3F3F46", text: "#F4F4F5" },
];

export function ShapeNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow();
  const shapeType = (data.shapeType as string) || "rectangle";
  const [label, setLabel] = useState<string>((data.label as string) || "Architecture Node");
  const colorId = (data.colorId as string) || "sky";
  const activeColor = SHAPE_COLORS.find((c) => c.id === colorId) || SHAPE_COLORS[0];

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabel(val);
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: val } } : n))
    );
  };

  const handleColorChange = (newColorId: string) => {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, colorId: newColorId } } : n))
    );
  };

  const handleShapeChange = (newShape: string) => {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, shapeType: newShape } } : n))
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
          id: `shape-${Date.now()}`,
          position: { x: current.position.x + 40, y: current.position.y + 40 },
          selected: false,
        },
      ];
    });
  };

  // Render SVG or shape shell
  const renderShapeGeometry = () => {
    switch (shapeType) {
      case "circle":
        return (
          <div
            style={{
              backgroundColor: `${activeColor.fill}CC`,
              borderColor: activeColor.stroke,
            }}
            className={`w-36 h-36 rounded-full border-2 shadow-2xl flex flex-col items-center justify-center p-3 text-center transition-all ${
              selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black" : ""
            }`}
          >
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              className="bg-transparent border-none outline-none text-center font-semibold text-xs w-full"
              style={{ color: activeColor.text }}
            />
          </div>
        );

      case "diamond":
        return (
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div
              style={{
                backgroundColor: `${activeColor.fill}CC`,
                borderColor: activeColor.stroke,
              }}
              className={`absolute inset-0 rotate-45 border-2 rounded-xl shadow-2xl transition-all ${
                selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black" : ""
              }`}
            />
            <div className="relative z-10 p-2 text-center">
              <span className="text-[9px] uppercase tracking-wider block font-mono text-zinc-400">DECISION</span>
              <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                className="bg-transparent border-none outline-none text-center font-semibold text-xs w-28"
                style={{ color: activeColor.text }}
              />
            </div>
          </div>
        );

      case "cylinder":
        return (
          <div
            style={{
              backgroundColor: `${activeColor.fill}CC`,
              borderColor: activeColor.stroke,
            }}
            className={`w-44 py-4 px-3 rounded-2xl border-2 shadow-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black" : ""
            }`}
          >
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Database size={15} style={{ color: activeColor.stroke }} />
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold">DATABASE</span>
            </div>
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              className="bg-transparent border-none outline-none text-center font-bold text-xs w-full"
              style={{ color: activeColor.text }}
            />
          </div>
        );

      case "cloud":
        return (
          <div
            style={{
              backgroundColor: `${activeColor.fill}CC`,
              borderColor: activeColor.stroke,
            }}
            className={`w-48 py-5 px-4 rounded-3xl border-2 border-dashed shadow-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black" : ""
            }`}
          >
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Cloud size={16} style={{ color: activeColor.stroke }} />
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold">CLOUD MESH</span>
            </div>
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              className="bg-transparent border-none outline-none text-center font-bold text-xs w-full"
              style={{ color: activeColor.text }}
            />
          </div>
        );

      case "terminal":
        return (
          <div
            style={{
              backgroundColor: "#0B0D12",
              borderColor: activeColor.stroke,
            }}
            className={`w-48 rounded-xl border-2 shadow-2xl overflow-hidden transition-all ${
              selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black" : ""
            }`}
          >
            <div className="bg-black/60 px-3 py-1.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <Terminal size={12} className="text-zinc-400" />
            </div>
            <div className="p-3">
              <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                className="bg-transparent border-none outline-none font-mono text-xs text-emerald-400 w-full"
              />
            </div>
          </div>
        );

      default:
        // standard rectangle / rounded
        return (
          <div
            style={{
              backgroundColor: `${activeColor.fill}CC`,
              borderColor: activeColor.stroke,
            }}
            className={`w-44 p-4 rounded-xl border-2 shadow-2xl flex flex-col items-center justify-center text-center transition-all ${
              selected ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-black" : ""
            }`}
          >
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              className="bg-transparent border-none outline-none text-center font-bold text-xs w-full"
              style={{ color: activeColor.text }}
            />
          </div>
        );
    }
  };

  return (
    <div className="relative group">
      {/* Contextual Floating Toolbar */}
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 text-xs"
      >
        {/* Shape Switcher */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10 pr-2">
          <button
            onClick={() => handleShapeChange("rectangle")}
            className={`p-1 rounded ${shapeType === "rectangle" ? "bg-white/20 text-white" : "text-zinc-400"}`}
            title="Rectangle"
          >
            <Square size={13} />
          </button>
          <button
            onClick={() => handleShapeChange("circle")}
            className={`p-1 rounded ${shapeType === "circle" ? "bg-white/20 text-white" : "text-zinc-400"}`}
            title="Circle"
          >
            <Circle size={13} />
          </button>
          <button
            onClick={() => handleShapeChange("cylinder")}
            className={`p-1 rounded ${shapeType === "cylinder" ? "bg-white/20 text-white" : "text-zinc-400"}`}
            title="Database"
          >
            <Database size={13} />
          </button>
          <button
            onClick={() => handleShapeChange("cloud")}
            className={`p-1 rounded ${shapeType === "cloud" ? "bg-white/20 text-white" : "text-zinc-400"}`}
            title="Cloud"
          >
            <Cloud size={13} />
          </button>
          <button
            onClick={() => handleShapeChange("terminal")}
            className={`p-1 rounded ${shapeType === "terminal" ? "bg-white/20 text-white" : "text-zinc-400"}`}
            title="Terminal"
          >
            <Terminal size={13} />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1 px-1 border-r border-white/10 pr-2">
          {SHAPE_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => handleColorChange(c.id)}
              className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                colorId === c.id ? "ring-2 ring-white scale-110" : ""
              }`}
              style={{ backgroundColor: c.stroke }}
              title={c.id}
            />
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

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-zinc-400 hover:!bg-sky-400" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-zinc-400 hover:!bg-sky-400" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-zinc-400 hover:!bg-sky-400" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-zinc-400 hover:!bg-sky-400" />

      {renderShapeGeometry()}
    </div>
  );
}
