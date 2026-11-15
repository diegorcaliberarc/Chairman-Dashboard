"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  ReactFlowProvider,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { Network } from "lucide-react";

import { SystemNode } from "@/components/topology/customNodes/SystemNode";
import { StickyNoteNode } from "@/components/topology/customNodes/StickyNoteNode";
import { ShapeNode } from "@/components/topology/customNodes/ShapeNode";
import { FrameNode } from "@/components/topology/customNodes/FrameNode";
import { TextNode } from "@/components/topology/customNodes/TextNode";

import { TopologyToolbar } from "@/components/topology/TopologyToolbar";
import { TopologyTopBar } from "@/components/topology/TopologyTopBar";
import { TOPOLOGY_TEMPLATES, TopologyTemplate } from "@/components/topology/topologyTemplates";
import { getAutoLayoutedNodes } from "@/components/topology/layoutUtils";

const nodeTypes = {
  systemNode: SystemNode,
  topologyNode: SystemNode,
  stickyNote: StickyNoteNode,
  shapeNode: ShapeNode,
  frameNode: FrameNode,
  textNode: TextNode,
};

function MiroLucidCanvasEngine() {
  const initialTemplate = TOPOLOGY_TEMPLATES[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialTemplate.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialTemplate.edges);

  // Interaction & Styling modes (Miro / Lucidspark)
  const [interactionMode, setInteractionMode] = useState<"select" | "pan">("select");
  const [edgeStyle, setEdgeStyle] = useState<"smoothstep" | "default" | "straight">("smoothstep");
  const [isAnimatedEdges, setIsAnimatedEdges] = useState<boolean>(true);
  const [backgroundVariant, setBackgroundVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ── Edge Connection Handler (Drag & Drop Connector Line) ──────────────────
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: edgeStyle,
            animated: isAnimatedEdges,
            style: { stroke: "#38BDF8", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#38BDF8" },
          },
          eds
        )
      );
    },
    [edgeStyle, isAnimatedEdges, setEdges]
  );

  // ── Node Creation Actions (Toolbar Dock) ──────────────────────────────────
  const handleAddSticky = (colorId: string) => {
    const id = `sticky-${Date.now()}`;
    const newNode: Node = {
      id,
      type: "stickyNote",
      position: { x: 450 + Math.random() * 80, y: 220 + Math.random() * 80 },
      data: {
        text: "New architectural insight or task...",
        colorId,
        author: "CHAIRMAN",
        reactions: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddShape = (shapeType: string, colorId: string) => {
    const id = `shape-${Date.now()}`;
    const newNode: Node = {
      id,
      type: "shapeNode",
      position: { x: 450 + Math.random() * 80, y: 240 + Math.random() * 80 },
      data: {
        label: `${shapeType.toUpperCase()} Service`,
        shapeType,
        colorId,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddFrame = () => {
    const id = `frame-${Date.now()}`;
    const newNode: Node = {
      id,
      type: "frameNode",
      position: { x: 300 + Math.random() * 50, y: 150 + Math.random() * 50 },
      data: {
        title: "Subsystem Architecture Frame",
        category: "DOMAIN BOUNDARY",
        color: "#0969DA",
        width: 580,
        height: 380,
      },
    };
    setNodes((nds) => [newNode, ...nds]); // place frame behind nodes
  };

  const handleAddText = () => {
    const id = `text-${Date.now()}`;
    const newNode: Node = {
      id,
      type: "textNode",
      position: { x: 450, y: 150 },
      data: {
        text: "ARCHITECTURE SPECIFICATION",
        fontSize: "text-lg",
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddSystemNode = () => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type: "systemNode",
      position: { x: 480, y: 260 },
      data: {
        label: "New Chairman Engine",
        subtitle: "Enterprise Microservice",
        category: "ACTIVE ENGINE",
        route: "/",
        color: "#0969DA",
        iconName: "zap",
        statusBadge: "ONLINE",
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // ── Auto-Layout / Tidy ────────────────────────────────────────────────────
  const handleAutoLayout = (direction: "TB" | "LR") => {
    const layouted = getAutoLayoutedNodes(nodes, edges, direction);
    setNodes(layouted);
  };

  // ── Template Switcher ─────────────────────────────────────────────────────
  const handleSelectTemplate = (tpl: TopologyTemplate) => {
    setNodes(tpl.nodes);
    setEdges(tpl.edges);
  };

  // ── Export & Import JSON ──────────────────────────────────────────────────
  const handleExportJson = () => {
    const data = { nodes, edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chairman-topology-architecture-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.nodes)) setNodes(parsed.nodes);
      if (Array.isArray(parsed.edges)) setEdges(parsed.edges);
    } catch (e) {
      console.error("Failed to parse imported topology JSON:", e);
    }
  };

  // ── Search & Filter Dimming (Miro & Lucid Quick Find) ─────────────────────
  const processedNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.map((n) => {
      const label = String(n.data?.label || n.data?.text || n.data?.title || "").toLowerCase();
      const cat = String(n.data?.category || "").toLowerCase();
      const matches = label.includes(q) || cat.includes(q);
      return {
        ...n,
        style: {
          ...n.style,
          opacity: matches ? 1 : 0.2,
          transition: "opacity 0.2s ease",
        },
      };
    });
  }, [nodes, searchQuery]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[760px] rounded-3xl border border-[#1A1D24] bg-[#08090C] overflow-hidden shadow-2xl">
      {/* Top Facilitation & Sprint Timer Bar */}
      <TopologyTopBar
        onAutoLayout={handleAutoLayout}
        backgroundVariant={backgroundVariant}
        setBackgroundVariant={setBackgroundVariant}
        onSelectTemplate={handleSelectTemplate}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {/* Left Floating Creation Toolbar (Lucidspark & Miro Dock) */}
      <TopologyToolbar
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        onAddSticky={handleAddSticky}
        onAddShape={handleAddShape}
        onAddFrame={handleAddFrame}
        onAddText={handleAddText}
        onAddSystemNode={handleAddSystemNode}
        edgeStyle={edgeStyle}
        setEdgeStyle={setEdgeStyle}
        isAnimatedEdges={isAnimatedEdges}
        setIsAnimatedEdges={setIsAnimatedEdges}
      />

      {/* Interactive Infinite Canvas */}
      <ReactFlow
        nodes={processedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag={interactionMode === "pan"}
        selectionOnDrag={interactionMode === "select"}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={backgroundVariant}
          gap={24}
          size={1.5}
          color="#1A1D24"
        />

        {/* Viewport Zoom & Fit Controls (Bottom-Right Miro Style) */}
        <Controls
          className="!bg-[#0E1017]/90 !backdrop-blur-xl !border-white/10 !text-zinc-100 !rounded-2xl !p-1 !shadow-2xl"
          showInteractive={false}
        />

        {/* Radar MiniMap */}
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "stickyNote") return "#FACC15";
            if (n.type === "shapeNode") return "#38BDF8";
            if (n.type === "frameNode") return "#4F46E5";
            return "#0969DA";
          }}
          maskColor="rgba(8, 9, 12, 0.85)"
          className="!bg-[#0E1017]/90 !backdrop-blur-xl !border-white/10 !rounded-2xl !overflow-hidden !shadow-2xl"
        />
      </ReactFlow>
    </div>
  );
}

export default function OrgChartTopologyPage() {
  return (
    <ExecutiveModuleShell
      moduleId="ORG_CHART"
      eyebrow="System Architecture, Topology & Whiteboard"
      title="Topology Map & Architecture Canvas"
      subtitle="Lucidspark & Miro Grade Collaborative Whiteboard with Sticky Notes, Shapes, Connectors, Frames & Sprint Timers"
      accentColor="#0969DA"
    >
      <div className="p-2 sm:p-4 lg:p-6 max-w-[1700px] mx-auto space-y-3">
        {/* Sub-header instruction banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-[#58A6FF]" />
            <span>
              Miro/Lucid Mode: Press <span className="text-zinc-200 font-bold">V</span> to select,{" "}
              <span className="text-zinc-200 font-bold">H</span> to pan, drag handles to connect, or click node toolbar for emojis & options.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
              Infinite Canvas · 60fps GPU Accelerated
            </span>
          </div>
        </div>

        {/* Master Canvas Wrapped in Provider */}
        <ReactFlowProvider>
          <MiroLucidCanvasEngine />
        </ReactFlowProvider>
      </div>
    </ExecutiveModuleShell>
  );
}
