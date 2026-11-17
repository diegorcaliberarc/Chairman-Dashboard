"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import mermaid from "mermaid";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Code2,
  RefreshCw,
  Download,
  ArrowUpDown,
  ArrowLeftRight,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { ArchitectureNode, DiagramSpace } from "@/lib/architectureRegistry";

interface MermaidArchitectureViewerProps {
  space: DiagramSpace;
  modules: ArchitectureNode[];
  onNodeSelect: (node: ArchitectureNode) => void;
  onToggleCodeDrawer: () => void;
  onToggleDirection: () => void;
  onRefreshScan: () => void;
  isScanning?: boolean;
}

export function MermaidArchitectureViewer({
  space,
  modules,
  onNodeSelect,
  onToggleCodeDrawer,
  onToggleDirection,
  onRefreshScan,
  isScanning = false,
}: MermaidArchitectureViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const transformRef = useRef<any>(null);

  // Initialize Mermaid configuration on mount
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "loose",
        themeVariables: {
          darkMode: true,
          background: "#080c18",
          primaryColor: "#091e3a",
          primaryTextColor: "#f8fafc",
          primaryBorderColor: "#38bdf8",
          lineColor: "#64748b",
          secondaryColor: "#1e1b4b",
          tertiaryColor: "#0f172a",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "13px",
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          padding: 16,
          nodeSpacing: 45,
          rankSpacing: 55,
        },
      });
    } catch (e) {
      console.error("Mermaid initialization error:", e);
    }
  }, []);

  // Render diagram whenever code or direction changes
  useEffect(() => {
    let isCancelled = false;

    const renderDiagram = async () => {
      if (!space.mermaidCode) return;
      setIsRendering(true);
      setRenderError(null);

      const renderId = `mermaid-canvas-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        // Ensure direction in syntax matches space.direction
        let codeToRender = space.mermaidCode.trim();
        if (space.direction) {
          codeToRender = codeToRender.replace(/^flowchart\s+(TD|LR|TB|BT|RL)/m, `flowchart ${space.direction}`);
        }

        const { svg } = await mermaid.render(renderId, codeToRender);
        if (!isCancelled) {
          setSvgContent(svg);
          setRenderError(null);
          setIsRendering(false);
        }
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        if (!isCancelled) {
          setRenderError(err?.message || "Failed to render Mermaid diagram. Check syntax.");
          setIsRendering(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [space.mermaidCode, space.direction]);

  // Attach interactive click listeners to rendered SVG nodes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !svgContent) return;

    const handleNodeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest node group
      const nodeEl = target.closest(".node, .flowchart-node") as HTMLElement | null;
      if (!nodeEl) return;

      const fullText = nodeEl.textContent || "";
      const nodeId = nodeEl.id || "";

      // Match node with our registry
      const matchedModule = modules.find((m) => {
        const idMatches = nodeId.toUpperCase().includes(m.id.toUpperCase());
        const labelMatches = fullText.toLowerCase().includes(m.label.toLowerCase());
        const routeMatches = m.route !== "/" && fullText.includes(m.route);
        return idMatches || labelMatches || routeMatches;
      });

      if (matchedModule) {
        onNodeSelect(matchedModule);
      } else {
        // Fallback placeholder node
        const cleanedTitle = fullText.split(/[\n\r]/)[0]?.trim() || "System Node";
        onNodeSelect({
          id: nodeId || "NODE_" + Date.now(),
          label: cleanedTitle,
          subtitle: "Architectural Subsystem",
          route: "/",
          pillar: "infra",
          spaceId: space.id as any,
          status: "LIVE",
          description: "Configured subsystem in the Chairman architecture graph.",
          apis: [],
          subFeatures: ["System Node"],
          dependencies: [],
          techStack: ["Next.js", "Tailwind"],
          iconName: "Server",
        });
      }
    };

    el.addEventListener("click", handleNodeClick);
    return () => {
      el.removeEventListener("click", handleNodeClick);
    };
  }, [svgContent, modules, onNodeSelect, space.id]);

  // Export SVG utility
  const handleExportSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chairman-${space.id}-topology-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[640px] bg-[#05070E] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Background Dot Matrix Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Floating Canvas Controls Dock (Top Right) */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 p-1 rounded-2xl bg-[#090D18]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-zinc-300">
        {/* Direction Switcher (TD vs LR) */}
        <button
          onClick={onToggleDirection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition"
          title={`Switch Direction (Current: ${space.direction === "LR" ? "Left-to-Right" : "Top-Down"})`}
        >
          {space.direction === "LR" ? <ArrowLeftRight size={14} className="text-amber-400" /> : <ArrowUpDown size={14} className="text-sky-400" />}
          <span>{space.direction}</span>
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Code Drawer Toggle */}
        <button
          onClick={onToggleCodeDrawer}
          className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="Open Mermaid Source Editor"
        >
          <Code2 size={15} />
        </button>

        {/* Refresh Codebase Scan */}
        <button
          onClick={onRefreshScan}
          disabled={isScanning}
          className={`p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition ${
            isScanning ? "animate-spin text-sky-400" : ""
          }`}
          title="Re-scan Codebase Routes & Features"
        >
          <RefreshCw size={14} />
        </button>

        {/* Export SVG */}
        <button
          onClick={handleExportSvg}
          className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="Export Diagram as SVG"
        >
          <Download size={14} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Zoom Controls */}
        <button
          onClick={() => transformRef.current?.zoomIn(0.25)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => transformRef.current?.zoomOut(0.25)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => transformRef.current?.resetTransform()}
          className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
          title="Reset Zoom & Pan (Fit Screen)"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Floating Space Badge & Stats Pill (Top Left) */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-[#090D18]/90 backdrop-blur-xl border border-white/10 shadow-xl font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold text-white tracking-wide">{space.title}</span>
        <span className="text-zinc-500">·</span>
        <span className="text-[11px] text-zinc-400">{space.badge}</span>
      </div>

      {/* Error Banner if Mermaid syntax fails */}
      {renderError && (
        <div className="absolute top-16 left-4 right-4 z-40 p-3 rounded-2xl bg-red-950/80 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 backdrop-blur-xl">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <div className="flex-1 truncate">{renderError}</div>
          <button
            onClick={onToggleCodeDrawer}
            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-semibold text-[11px] text-red-300"
          >
            Fix Syntax
          </button>
        </div>
      )}

      {/* Interactive Transformable Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
        <TransformWrapper
          ref={transformRef}
          initialScale={0.9}
          minScale={0.2}
          maxScale={3.0}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.08 }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full flex items-center justify-center p-12"
          >
            <div
              ref={containerRef}
              className="mermaid-svg-container transition-opacity duration-300 flex items-center justify-center min-w-[700px] min-h-[500px]"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Bottom Hint Bar */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-white/5 bg-black/40 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">Tip:</span>
          <span>Click any diagram node to inspect sub-features and jump directly to that live page.</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>Scroll to Zoom</span>
          <span>·</span>
          <span>Drag to Pan</span>
          <span>·</span>
          <span>Auto-Directed Directed Graph</span>
        </div>
      </div>
    </div>
  );
}
