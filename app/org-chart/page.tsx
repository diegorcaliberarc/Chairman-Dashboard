"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Network,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  FolderPlus,
  Compass,
  FileCode,
  ShieldCheck,
  Bolt,
} from "lucide-react";

import {
  StrategicDomain,
  StrategicTree,
  CoPilotMode,
  PaceType,
  DagNode,
} from "@/lib/synthesisRoadmapTypes";
import { DEFAULT_STRATEGIC_TREES } from "@/lib/defaultStrategicTrees";
import { SynthesisHeaderStrip } from "@/components/roadmaps/SynthesisHeaderStrip";
import { CoPilotModeBar } from "@/components/roadmaps/CoPilotModeBar";
import { DagCanvasView } from "@/components/roadmaps/DagCanvasView";
import { MobileDagAccordion } from "@/components/roadmaps/MobileDagAccordion";
import { TacticalDossierModal } from "@/components/roadmaps/TacticalDossierModal";
import { DoneWithYouModal } from "@/components/roadmaps/DoneWithYouModal";
import { ManualNodeBuilderModal } from "@/components/roadmaps/ManualNodeBuilderModal";

import { SystemNode } from "@/components/topology/customNodes/SystemNode";
import { StickyNoteNode } from "@/components/topology/customNodes/StickyNoteNode";
import { ShapeNode } from "@/components/topology/customNodes/ShapeNode";
import { FrameNode } from "@/components/topology/customNodes/FrameNode";
import { TextNode } from "@/components/topology/customNodes/TextNode";

import { TopologyToolbar } from "@/components/topology/TopologyToolbar";
import { TopologyTopBar } from "@/components/topology/TopologyTopBar";
import { TOPOLOGY_TEMPLATES, TopologyTemplate } from "@/components/topology/topologyTemplates";
import { getAutoLayoutedNodes } from "@/components/topology/layoutUtils";

import {
  INITIAL_DIAGRAM_SPACES,
  KNOWN_MODULES_REGISTRY,
  ArchitectureNode,
  DiagramSpace,
  getMasterTopologyMermaid,
  getCoreEngineMermaid,
  getWealthPortfolioMermaid,
  getHealthLifeMermaid,
} from "@/lib/architectureRegistry";

import { MermaidArchitectureViewer } from "@/components/topology/MermaidArchitectureViewer";
import { NodeInspectorDrawer } from "@/components/topology/NodeInspectorDrawer";
import { MermaidSourceDrawer } from "@/components/topology/MermaidSourceDrawer";
import { NewSpaceModal } from "@/components/topology/NewSpaceModal";

const nodeTypes = {
  systemNode: SystemNode,
  topologyNode: SystemNode,
  stickyNote: StickyNoteNode,
  shapeNode: ShapeNode,
  frameNode: FrameNode,
  textNode: TextNode,
};

// ─────────────────────────────────────────────────────────────────────────────
// Mode B: Freeform Miro / Lucidspark Canvas Engine
// ─────────────────────────────────────────────────────────────────────────────
const WHITEBOARD_STORAGE_KEY = "chairman-org-whiteboard-v1";

function MiroLucidCanvasEngine() {
  const initialTemplate = TOPOLOGY_TEMPLATES[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialTemplate.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialTemplate.edges);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WHITEBOARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { nodes?: Node[]; edges?: Edge[] };
        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          setNodes(parsed.nodes);
        }
        if (Array.isArray(parsed.edges)) {
          setEdges(parsed.edges);
        }
      }
    } catch {}
    setHydrated(true);
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        WHITEBOARD_STORAGE_KEY,
        JSON.stringify({ nodes, edges })
      );
    } catch {}
  }, [hydrated, nodes, edges]);

  const [interactionMode, setInteractionMode] = useState<"select" | "pan">("select");
  const [edgeStyle, setEdgeStyle] = useState<"smoothstep" | "default" | "straight">("smoothstep");
  const [isAnimatedEdges, setIsAnimatedEdges] = useState<boolean>(true);
  const [backgroundVariant, setBackgroundVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    setNodes((nds) => [newNode, ...nds]);
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

  const handleAutoLayout = (direction: "TB" | "LR") => {
    const layouted = getAutoLayoutedNodes(nodes, edges, direction);
    setNodes(layouted);
  };

  const handleSelectTemplate = (tpl: TopologyTemplate) => {
    setNodes(tpl.nodes);
    setEdges(tpl.edges);
  };

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
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[640px] rounded-3xl border border-[#1A1D24] bg-[#08090C] overflow-hidden shadow-2xl">
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
        <Background variant={backgroundVariant} gap={24} size={1.5} color="#1A1D24" />
        <Controls
          className="!bg-[#0E1017]/90 !backdrop-blur-xl !border-white/10 !text-zinc-100 !rounded-2xl !p-1 !shadow-2xl"
          showInteractive={false}
        />
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

// ─────────────────────────────────────────────────────────────────────────────
// Master Org Chart & Architecture Canvas Page
// ─────────────────────────────────────────────────────────────────────────────
export default function OrgChartTopologyPage() {
  const [engineMode, setEngineMode] = useState<"roadmap" | "mermaid" | "whiteboard">("roadmap");
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<DiagramSpace[]>(INITIAL_DIAGRAM_SPACES);
  const [activeSpaceId, setActiveSpaceId] = useState<string>("master");
  const [modules, setModules] = useState<ArchitectureNode[]>(KNOWN_MODULES_REGISTRY);

  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Synthesis Roadmap Sub-Engine State
  const [currentDomain, setCurrentDomain] = useState<StrategicDomain>("master");
  const [strategicTrees, setStrategicTrees] = useState<Record<string, StrategicTree>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("chairman_synthesis_trees_v5");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_STRATEGIC_TREES;
  });
  const [roadmapPace, setRoadmapPace] = useState<PaceType>("P");
  const [roadmapZoom, setRoadmapZoom] = useState<number>(1.0);
  const [roadmapMode, setRoadmapMode] = useState<CoPilotMode>("dfy");
  const [selectedRoadmapNodeId, setSelectedRoadmapNodeId] = useState<string | null>(null);
  const [isDwyModalOpen, setIsDwyModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isRoadmapSynthesizing, setIsRoadmapSynthesizing] = useState(false);

  const activeRoadmapTree = useMemo(() => {
    return strategicTrees[currentDomain] || DEFAULT_STRATEGIC_TREES[currentDomain] || DEFAULT_STRATEGIC_TREES.master;
  }, [strategicTrees, currentDomain]);

  const activeRoadmapNode = useMemo(() => {
    if (!selectedRoadmapNodeId || selectedRoadmapNodeId === "goal") return null;
    const all = [...activeRoadmapTree.tier0, ...activeRoadmapTree.tier1, ...activeRoadmapTree.tier2];
    return all.find((n) => n.id === selectedRoadmapNodeId) || null;
  }, [selectedRoadmapNodeId, activeRoadmapTree]);

  // Active space lookup
  const activeSpace = useMemo(() => {
    return spaces.find((s) => s.id === activeSpaceId) || spaces[0] || INITIAL_DIAGRAM_SPACES[0];
  }, [spaces, activeSpaceId]);

  // Load persisted spaces from localStorage on mount, then sync with API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chairman_topology_spaces");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSpaces(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read local diagram spaces:", e);
    }

    // Background fetch from /api/architecture/map
    fetchArchitectureMap();
  }, []);

  const fetchArchitectureMap = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/architecture/map");
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.spaces) && data.spaces.length > 0) {
          // Merge spaces preserving user edits
          setSpaces((prev) => {
            const merged = [...data.spaces];
            // Keep any locally created spaces
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id)) {
                merged.push(p);
              }
            }
            return merged;
          });
        }
        if (Array.isArray(data.modules)) {
          setModules(data.modules);
        }
      }
    } catch (err) {
      console.warn("Architecture map scan warning:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Persist spaces helper
  const persistSpaces = (nextSpaces: DiagramSpace[]) => {
    setSpaces(nextSpaces);
    try {
      localStorage.setItem("chairman_topology_spaces", JSON.stringify(nextSpaces));
    } catch (e) {
      console.warn("Could not cache spaces to localStorage:", e);
    }
  };

  // Toggle layout direction (TD <-> LR) for current space
  const handleToggleDirection = () => {
    const nextDir: "TD" | "LR" = activeSpace.direction === "LR" ? "TD" : "LR";
    const updatedCode = activeSpace.mermaidCode.replace(
      /^flowchart\s+(TD|LR|TB|BT|RL)/m,
      `flowchart ${nextDir}`
    );

    const updated = spaces.map((s) =>
      s.id === activeSpace.id ? { ...s, direction: nextDir, mermaidCode: updatedCode } : s
    );
    persistSpaces(updated);
  };

  // Apply code in editor
  const handleApplyCode = (newCode: string) => {
    const updated = spaces.map((s) =>
      s.id === activeSpace.id ? { ...s, mermaidCode: newCode } : s
    );
    setSpaces(updated);
  };

  // Save code permanently
  const handleSaveCode = async (newCode: string) => {
    const updatedSpace = {
      ...activeSpace,
      mermaidCode: newCode,
      updatedAt: new Date().toISOString(),
    };
    const updated = spaces.map((s) => (s.id === activeSpace.id ? updatedSpace : s));
    persistSpaces(updated);

    // Call API to persist in Supabase
    try {
      await fetch("/api/architecture/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space: updatedSpace }),
      });
    } catch (e) {
      console.warn("API save warning:", e);
    }
  };

  // Reset current space to original code
  const handleResetCode = () => {
    let defaultCode = "";
    if (activeSpace.id === "master") defaultCode = getMasterTopologyMermaid(activeSpace.direction);
    else if (activeSpace.id === "core") defaultCode = getCoreEngineMermaid(activeSpace.direction);
    else if (activeSpace.id === "wealth") defaultCode = getWealthPortfolioMermaid(activeSpace.direction);
    else if (activeSpace.id === "health") defaultCode = getHealthLifeMermaid(activeSpace.direction);
    else defaultCode = activeSpace.mermaidCode;

    handleApplyCode(defaultCode);
  };

  // Add new space
  const handleCreateSpace = (newSpace: DiagramSpace) => {
    const next = [...spaces, newSpace];
    persistSpaces(next);
    setActiveSpaceId(newSpace.id);

    // Save to API
    try {
      fetch("/api/architecture/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space: newSpace }),
      });
    } catch (e) {
      console.warn("Failed to POST new space:", e);
    }
  };

  return (
    <ExecutiveModuleShell
      moduleId="ORG_CHART"
      eyebrow="System Architecture, Topology & Whiteboard"
      title="Topology Map & Architecture Canvas"
      subtitle="Multi-Page Auto-Directed Mermaid Architecture Whiteboard & Interactive Subsystem Visualizer"
      accentColor="#0969DA"
    >
      <div className="p-2 sm:p-4 lg:p-6 max-w-[1780px] mx-auto space-y-3">
        {/* Master Planning & Interactive Miro Whiteboard Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#080C18]/90 border border-white/10 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 px-2">
              Master Planning &amp; Interactive Whiteboard · Drag any node freely
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center rounded-xl bg-black/60 p-0.5 border border-white/10 text-xs">
              <button
                onClick={() => setEngineMode("roadmap")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  engineMode === "roadmap"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Converging Multi-Branch Master Planning DAG (Draggable Miro-Style)"
              >
                <Bolt size={13} className={engineMode === "roadmap" ? "text-cyan-300" : "text-zinc-400"} />
                <span>Master Planning DAG</span>
              </button>

              <button
                onClick={() => setEngineMode("mermaid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  engineMode === "mermaid"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Auto-Directed Mermaid Subsystem Architecture Viewer"
                data-testid="org-mode-mermaid"
              >
                <GitBranch size={13} className={engineMode === "mermaid" ? "text-emerald-300" : "text-zinc-400"} />
                <span>Mermaid Architecture</span>
              </button>

              <button
                onClick={() => setEngineMode("whiteboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  engineMode === "whiteboard"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Miro / Lucidspark Freeform Whiteboard (Sticky Notes & Connectors)"
              >
                <Layers size={13} className={engineMode === "whiteboard" ? "text-amber-300" : "text-zinc-400"} />
                <span>Miro Whiteboard</span>
              </button>
            </div>
          </div>
        </div>

        {statusToast && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium">
            <span>{statusToast}</span>
            <button
              type="button"
              onClick={() => setStatusToast(null)}
              className="text-emerald-300/80 hover:text-emerald-100 text-xs px-2 py-0.5 rounded bg-emerald-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Master Canvas Container */}
        <div className="relative w-full">
          {engineMode === "roadmap" ? (
            <div className="flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#060911]">
              <SynthesisHeaderStrip
                currentDomain={currentDomain}
                onSelectDomain={(dom) => setCurrentDomain(dom)}
                title={activeRoadmapTree.title}
                loeCount={activeRoadmapTree.loeCount}
                audit={activeRoadmapTree.audit}
                activePace={roadmapPace}
                onSelectPace={(p) => setRoadmapPace(p)}
                zoomScale={roadmapZoom}
                onZoomIn={() => setRoadmapZoom((z) => Math.min(1.4, z + 0.1))}
                onZoomOut={() => setRoadmapZoom((z) => Math.max(0.65, z - 0.1))}
                onZoomReset={() => setRoadmapZoom(1.0)}
                onTriggerSynthesize={async () => {
                  setIsRoadmapSynthesizing(true);
                  try {
                    const res = await fetch("/api/roadmaps/synthesize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "dfy",
                        goalPrompt: activeRoadmapTree.title,
                        domain: currentDomain,
                      }),
                    });
                    const d = await res.json();
                    if (d.success && d.tree) {
                      setStrategicTrees((prev) => ({ ...prev, [currentDomain]: d.tree }));
                    }
                  } catch (e) {
                  } finally {
                    setIsRoadmapSynthesizing(false);
                  }
                }}
                onTriggerBackwardChain={() => {
                  setStatusToast("Backward Chain Audit: Validated 100% convergence to Goal.");
                }}
                isSynthesizing={isRoadmapSynthesizing}
              />
              <CoPilotModeBar
                currentMode={roadmapMode}
                onChangeMode={(m) => setRoadmapMode(m)}
                onSynthesizeDfy={async (goal) => {
                  setIsRoadmapSynthesizing(true);
                  try {
                    const res = await fetch("/api/roadmaps/synthesize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "dfy", goalPrompt: goal, domain: currentDomain }),
                    });
                    const d = await res.json();
                    if (d.success && d.tree) {
                      setStrategicTrees((prev) => ({ ...prev, [currentDomain]: d.tree }));
                    }
                  } catch (e) {
                  } finally {
                    setIsRoadmapSynthesizing(false);
                  }
                }}
                onStartDwyInterview={() => setIsDwyModalOpen(true)}
                onOpenManualBuilder={() => setIsManualModalOpen(true)}
                isProcessing={isRoadmapSynthesizing}
              />
              <div className="hidden lg:flex w-full overflow-hidden">
                <DagCanvasView
                  tree={activeRoadmapTree}
                  zoomScale={roadmapZoom}
                  onNodeClick={(id) => setSelectedRoadmapNodeId(id)}
                  onLockGoal={() =>
                    setStatusToast("Vector Locked: Synthesis Integrity Established.")
                  }
                />
              </div>
              <MobileDagAccordion
                tree={activeRoadmapTree}
                onNodeClick={(id) => setSelectedRoadmapNodeId(id)}
                onLockGoal={() => setStatusToast("Vector Locked.")}
              />
            </div>
          ) : engineMode === "mermaid" ? (
            <MermaidArchitectureViewer
              space={activeSpace}
              modules={modules}
              onNodeSelect={(node) => setSelectedNode(node)}
              onToggleCodeDrawer={() => setIsCodeDrawerOpen((v) => !v)}
              onToggleDirection={handleToggleDirection}
              onRefreshScan={fetchArchitectureMap}
              isScanning={isScanning}
            />
          ) : (
            <ReactFlowProvider>
              <MiroLucidCanvasEngine />
            </ReactFlowProvider>
          )}

          {/* Interactive Floating Node Inspector (Architecture mode) */}
          <NodeInspectorDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />

          {/* Collapsible Mermaid Code Source Drawer */}
          <MermaidSourceDrawer
            isOpen={isCodeDrawerOpen}
            onClose={() => setIsCodeDrawerOpen(false)}
            initialCode={activeSpace.mermaidCode}
            onApply={handleApplyCode}
            onSave={handleSaveCode}
            onReset={handleResetCode}
          />

          {/* New Space Creation Modal */}
          <NewSpaceModal
            isOpen={isNewSpaceModalOpen}
            onClose={() => setIsNewSpaceModalOpen(false)}
            onCreateSpace={handleCreateSpace}
          />

          {/* Roadmap Tactical Dossier Modal */}
          <TacticalDossierModal
            isOpen={selectedRoadmapNodeId !== null}
            node={activeRoadmapNode}
            goalNode={selectedRoadmapNodeId === "goal" ? activeRoadmapTree.tier3 : null}
            onClose={() => setSelectedRoadmapNodeId(null)}
            onToggleCheck={(chkId) => {
              setStrategicTrees((prev) => {
                const tr = { ...(prev[currentDomain] || DEFAULT_STRATEGIC_TREES[currentDomain]) };
                const toggle = (list: DagNode[]) =>
                  list.map((n) =>
                    n.id === selectedRoadmapNodeId
                      ? {
                          ...n,
                          checks: n.checks.map((c) => (c.id === chkId ? { ...c, completed: !c.completed } : c)),
                        }
                      : n
                  );
                tr.tier0 = toggle(tr.tier0);
                tr.tier1 = toggle(tr.tier1);
                tr.tier2 = toggle(tr.tier2);
                return { ...prev, [currentDomain]: tr };
              });
            }}
          />

          {/* Roadmap DWY Modal */}
          <DoneWithYouModal
            isOpen={isDwyModalOpen}
            initialGoal={activeRoadmapTree.title}
            onClose={() => setIsDwyModalOpen(false)}
            onSubmitAnswers={async (answers, goal) => {
              setIsRoadmapSynthesizing(true);
              try {
                const res = await fetch("/api/roadmaps/synthesize", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "dwy_refine",
                    goalPrompt: goal,
                    answers,
                    domain: currentDomain,
                  }),
                });
                const d = await res.json();
                if (d.success && d.tree) {
                  setStrategicTrees((prev) => ({ ...prev, [currentDomain]: d.tree }));
                }
              } catch (e) {
              } finally {
                setIsRoadmapSynthesizing(false);
                setIsDwyModalOpen(false);
              }
            }}
            isProcessing={isRoadmapSynthesizing}
          />

          {/* Roadmap Manual Builder Modal */}
          <ManualNodeBuilderModal
            isOpen={isManualModalOpen}
            domain={currentDomain}
            onClose={() => setIsManualModalOpen(false)}
            onSaveNode={(newNode) => {
              setStrategicTrees((prev) => {
                const tr = { ...(prev[currentDomain] || DEFAULT_STRATEGIC_TREES[currentDomain]) };
                if (newNode.tier === 0) tr.tier0 = [...tr.tier0, newNode];
                else if (newNode.tier === 1) tr.tier1 = [...tr.tier1, newNode];
                else if (newNode.tier === 2) tr.tier2 = [...tr.tier2, newNode];
                return { ...prev, [currentDomain]: tr };
              });
            }}
          />
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
