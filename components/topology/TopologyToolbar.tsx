"use client";

import React, { useState } from "react";
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Database,
  Cloud,
  Terminal,
  Type,
  Layout,
  Network,
  Zap,
  ChevronRight,
  Plus,
} from "lucide-react";
import { STICKY_COLORS } from "./customNodes/StickyNoteNode";
import { SHAPE_COLORS } from "./customNodes/ShapeNode";

interface TopologyToolbarProps {
  interactionMode: "select" | "pan";
  setInteractionMode: (mode: "select" | "pan") => void;
  onAddSticky: (colorId: string) => void;
  onAddShape: (shapeType: string, colorId: string) => void;
  onAddFrame: () => void;
  onAddText: () => void;
  onAddSystemNode: () => void;
  edgeStyle: "smoothstep" | "default" | "straight";
  setEdgeStyle: (style: "smoothstep" | "default" | "straight") => void;
  isAnimatedEdges: boolean;
  setIsAnimatedEdges: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export function TopologyToolbar({
  interactionMode,
  setInteractionMode,
  onAddSticky,
  onAddShape,
  onAddFrame,
  onAddText,
  onAddSystemNode,
  edgeStyle,
  setEdgeStyle,
  isAnimatedEdges,
  setIsAnimatedEdges,
}: TopologyToolbarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<"sticky" | "shapes" | "connectors" | null>(null);

  const toggleSubmenu = (menu: "sticky" | "shapes" | "connectors") => {
    setOpenSubmenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <div className="absolute left-6 top-20 z-40 flex items-start gap-2">
      {/* Primary Vertical Creation Dock (Lucidspark & Miro) */}
      <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-[#0E1017]/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-zinc-300">
        {/* Select Tool (V) */}
        <button
          onClick={() => {
            setInteractionMode("select");
            setOpenSubmenu(null);
          }}
          className={`p-2.5 rounded-xl transition-all ${
            interactionMode === "select"
              ? "bg-[#0969DA] text-white shadow-lg shadow-[#0969DA]/30"
              : "hover:bg-white/10 hover:text-white"
          }`}
          title="Select Tool (V) - Click & drag nodes or marquee select"
        >
          <MousePointer size={17} />
        </button>

        {/* Hand / Pan Tool (H) */}
        <button
          onClick={() => {
            setInteractionMode("pan");
            setOpenSubmenu(null);
          }}
          className={`p-2.5 rounded-xl transition-all ${
            interactionMode === "pan"
              ? "bg-[#0969DA] text-white shadow-lg shadow-[#0969DA]/30"
              : "hover:bg-white/10 hover:text-white"
          }`}
          title="Hand / Pan Tool (H) - Drag to navigate canvas"
        >
          <Hand size={17} />
        </button>

        <div className="w-6 h-px bg-white/10 my-0.5" />

        {/* Sticky Notes Tool (N) with Color Palette flyout */}
        <div className="relative">
          <button
            onClick={() => toggleSubmenu("sticky")}
            className={`p-2.5 rounded-xl transition-all ${
              openSubmenu === "sticky"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "hover:bg-white/10 hover:text-amber-300"
            }`}
            title="Sticky Note (N) - Click to drop brainstorm notes"
          >
            <StickyNote size={17} />
          </button>
        </div>

        {/* Shapes Tool (S) with Geometry Flyout */}
        <div className="relative">
          <button
            onClick={() => toggleSubmenu("shapes")}
            className={`p-2.5 rounded-xl transition-all ${
              openSubmenu === "shapes"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "hover:bg-white/10 hover:text-sky-300"
            }`}
            title="Shapes & Architecture Nodes (S) - Rectangles, Cylinders, Diamonds, Cloud"
          >
            <Square size={17} />
          </button>
        </div>

        {/* Frame / Container Tool (F) */}
        <button
          onClick={() => {
            onAddFrame();
            setOpenSubmenu(null);
          }}
          className="p-2.5 rounded-xl transition-all hover:bg-white/10 hover:text-indigo-300 text-zinc-400"
          title="Frame / Grouping Container (F) - Wrap architecture clusters"
        >
          <Layout size={17} />
        </button>

        {/* Text Tool (T) */}
        <button
          onClick={() => {
            onAddText();
            setOpenSubmenu(null);
          }}
          className="p-2.5 rounded-xl transition-all hover:bg-white/10 hover:text-emerald-300 text-zinc-400"
          title="Text Label / Header (T) - Add floating typography"
        >
          <Type size={17} />
        </button>

        {/* System Sovereign Engine Card Tool */}
        <button
          onClick={() => {
            onAddSystemNode();
            setOpenSubmenu(null);
          }}
          className="p-2.5 rounded-xl transition-all hover:bg-white/10 hover:text-purple-300 text-zinc-400"
          title="Chairman Engine Node - Add live sovereign system card"
        >
          <Zap size={17} />
        </button>

        <div className="w-6 h-px bg-white/10 my-0.5" />

        {/* Connector Styles Flyout (L) */}
        <button
          onClick={() => toggleSubmenu("connectors")}
          className={`p-2.5 rounded-xl transition-all ${
            openSubmenu === "connectors"
              ? "bg-[#0969DA]/20 text-[#58A6FF] border border-[#0969DA]/40"
              : "hover:bg-white/10 hover:text-[#58A6FF]"
          }`}
          title="Connectors & Flow Lines (L) - Elbow, Curved, Straight, Animated Flow"
        >
          <Network size={17} />
        </button>
      </div>

      {/* Flyout Submenu Panels (Miro / Lucidspark style popover) */}
      {openSubmenu === "sticky" && (
        <div className="p-3 rounded-2xl bg-[#0E1017]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-2 animate-in fade-in slide-in-from-left-2 duration-150">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block px-1">
            Drop Sticky Note (N)
          </span>
          <div className="grid grid-cols-4 gap-2">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onAddSticky(c.id);
                  setOpenSubmenu(null);
                }}
                style={{ backgroundColor: c.bg, borderColor: c.border }}
                className="w-8 h-8 rounded-lg border-2 shadow-md hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                title={`Add ${c.id} sticky`}
              >
                <Plus size={14} style={{ color: c.text }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {openSubmenu === "shapes" && (
        <div className="p-3 rounded-2xl bg-[#0E1017]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-2.5 w-60 animate-in fade-in slide-in-from-left-2 duration-150">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block px-1">
            System & Process Shapes (S)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                onAddShape("rectangle", "sky");
                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition-colors"
            >
              <Square size={14} className="text-sky-400" />
              <span>Process Box</span>
            </button>
            <button
              onClick={() => {
                onAddShape("cylinder", "emerald");
                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition-colors"
            >
              <Database size={14} className="text-emerald-400" />
              <span>Database</span>
            </button>
            <button
              onClick={() => {
                onAddShape("diamond", "amber");
                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition-colors"
            >
              <span className="w-3.5 h-3.5 rotate-45 border border-amber-400 inline-block" />
              <span>Decision</span>
            </button>
            <button
              onClick={() => {
                onAddShape("cloud", "sky");
                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition-colors"
            >
              <Cloud size={14} className="text-sky-400" />
              <span>Cloud Mesh</span>
            </button>
            <button
              onClick={() => {
                onAddShape("circle", "violet");
                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition-colors"
            >
              <Circle size={14} className="text-purple-400" />
              <span>State / Event</span>
            </button>
            <button
              onClick={() => {
                onAddShape("terminal", "dark");
                setOpenSubmenu(null);
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-200 transition-colors"
            >
              <Terminal size={14} className="text-emerald-400" />
              <span>Worker Node</span>
            </button>
          </div>
        </div>
      )}

      {openSubmenu === "connectors" && (
        <div className="p-3 rounded-2xl bg-[#0E1017]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-3 w-56 animate-in fade-in slide-in-from-left-2 duration-150">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block px-1 mb-1.5">
              Line Geometry (L)
            </span>
            <div className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => setEdgeStyle("smoothstep")}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                  edgeStyle === "smoothstep" ? "bg-[#0969DA] text-white" : "bg-white/[0.04] text-zinc-300 hover:bg-white/10"
                }`}
              >
                <span>Orthogonal / Elbow</span>
                <span className="text-[10px] font-mono opacity-70">Miro</span>
              </button>
              <button
                onClick={() => setEdgeStyle("default")}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                  edgeStyle === "default" ? "bg-[#0969DA] text-white" : "bg-white/[0.04] text-zinc-300 hover:bg-white/10"
                }`}
              >
                <span>Curved Bezier</span>
                <span className="text-[10px] font-mono opacity-70">Lucid</span>
              </button>
              <button
                onClick={() => setEdgeStyle("straight")}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                  edgeStyle === "straight" ? "bg-[#0969DA] text-white" : "bg-white/[0.04] text-zinc-300 hover:bg-white/10"
                }`}
              >
                <span>Straight</span>
                <span className="text-[10px] font-mono opacity-70">Direct</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-zinc-300">Live Particle Flow</span>
            <button
              onClick={() => setIsAnimatedEdges((prev) => !prev)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                isAnimatedEdges ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAnimatedEdges ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
