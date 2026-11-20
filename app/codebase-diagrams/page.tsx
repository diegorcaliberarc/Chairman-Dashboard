"use client";

import React, { useCallback, useEffect, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { Network, GitBranch, Layers, Plus, RefreshCw, FolderPlus } from "lucide-react";

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

function FreeformMiroWhiteboard() {
  const initialTemplate = TOPOLOGY_TEMPLATES[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialTemplate.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialTemplate.edges);
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
    setNodes((nds) => [
      ...nds,
      {
        id: `sticky-${Date.now()}`,
        type: "stickyNote",
        position: { x: 420 + Math.random() * 80, y: 200 + Math.random() * 80 },
        data: { text: "New infrastructure note...", colorId, author: "CHAIRMAN", reactions: {} },
      },
    ]);
  };

  const handleAddShape = (shapeType: string, colorId: string) => {
    setNodes((nds) => [
      ...nds,
      {
        id: `shape-${Date.now()}`,
        type: "shapeNode",
        position: { x: 440 + Math.random() * 80, y: 230 + Math.random() * 80 },
        data: { label: `${shapeType.toUpperCase()} Service`, shapeType, colorId },
      },
    ]);
  };

  const handleAddFrame = () => {
    setNodes((nds) => [
      {
        id: `frame-${Date.now()}`,
        type: "frameNode",
        position: { x: 280 + Math.random() * 60, y: 140 + Math.random() * 60 },
        data: { title: "Subsystem Boundary", category: "INFRASTRUCTURE", color: "#0969DA", width: 580, height: 380 },
      },
      ...nds,
    ]);
  };

  const handleAddText = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: `text-${Date.now()}`,
        type: "textNode",
        position: { x: 450, y: 150 },
        data: { text: "ARCHITECTURE SPECIFICATION", fontSize: "text-lg" },
      },
    ]);
  };

  const handleAddSystemNode = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: `node-${Date.now()}`,
        type: "systemNode",
        position: { x: 460, y: 240 },
        data: {
          label: "New Infrastructure Node",
          subtitle: "Service / API",
          category: "ACTIVE SERVICE",
          route: "/",
          color: "#0969DA",
          iconName: "zap",
          statusBadge: "ONLINE",
        },
      },
    ]);
  };

  const handleAutoLayout = (direction: "TB" | "LR") => {
    setNodes(getAutoLayoutedNodes(nodes, edges, direction));
  };

  const handleLoadTemplate = (template: TopologyTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
  };

  const handleExportJson = () => {
    const data = { nodes, edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codebase-infrastructure-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.nodes)) setNodes(parsed.nodes);
      if (Array.isArray(parsed.edges)) setEdges(parsed.edges);
    } catch {}
  };

  return (
    <div className="relative h-[78vh] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0D1117]">
      <TopologyTopBar
        onAutoLayout={handleAutoLayout}
        backgroundVariant={backgroundVariant}
        setBackgroundVariant={setBackgroundVariant}
        onSelectTemplate={handleLoadTemplate}
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        panOnDrag={interactionMode === "pan"}
        selectionOnDrag={interactionMode === "select"}
        fitView
        colorMode="dark"
      >
        <Background variant={backgroundVariant} gap={22} size={1} color="#263143" />
        <Controls />
        <MiniMap nodeColor="#38BDF8" maskColor="rgba(13, 17, 23, 0.75)" />
      </ReactFlow>
    </div>
  );
}

export default function CodebaseInfrastructureDiagramsPage() {
  const [engineMode, setEngineMode] = useState<"mermaid" | "miro">("mermaid");
  const [spaces, setSpaces] = useState<DiagramSpace[]>(INITIAL_DIAGRAM_SPACES);
  const [activeSpaceId, setActiveSpaceId] = useState<string>(INITIAL_DIAGRAM_SPACES[0].id);
  const [modules, setModules] = useState<ArchitectureNode[]>(KNOWN_MODULES_REGISTRY);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || spaces[0];

  const fetchArchitectureMap = useCallback(async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/architecture/map");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.modules) && data.modules.length > 0) {
          setModules(data.modules);
        }
      }
    } catch (err) {
      console.error("Architecture scan error:", err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    fetchArchitectureMap();
  }, [fetchArchitectureMap]);

  const handleToggleDirection = () => {
    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== activeSpace.id) return s;
        const nextDir = s.direction === "TD" ? "LR" : "TD";
        return {
          ...s,
          direction: nextDir,
          mermaidCode: s.mermaidCode.replace(/flowchart (TD|LR)/, `flowchart ${nextDir}`),
        };
      })
    );
  };

  const handleApplyCode = (code: string) => {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpace.id ? { ...s, mermaidCode: code } : s)));
  };

  const handleResetCode = () => {
    const dir = activeSpace.direction;
    let fresh = getMasterTopologyMermaid(dir);
    if (activeSpace.id === "core-engine") fresh = getCoreEngineMermaid(dir);
    else if (activeSpace.id === "wealth-portfolio") fresh = getWealthPortfolioMermaid(dir);
    else if (activeSpace.id === "health-life") fresh = getHealthLifeMermaid(dir);
    handleApplyCode(fresh);
  };

  const handleCreateSpace = (newSpace: DiagramSpace) => {
    setSpaces((prev) => [...prev, newSpace]);
    setActiveSpaceId(newSpace.id);
    setIsNewSpaceModalOpen(false);
  };

  return (
    <ExecutiveModuleShell
      moduleId="CODEBASE_DIAGRAMS"
      eyebrow="Settings & Infrastructure"
      title="Codebase Infrastructure Diagrams"
      subtitle="Live codebase architecture spaces and freeform Miro system whiteboard"
      accentColor="#0969DA"
      fullBleed={true}
      headerActions={
        <div className="flex items-center gap-2">
          <div
            className="flex items-center p-1 rounded-xl border text-xs font-mono"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
            }}
          >
            <button
              onClick={() => setEngineMode("mermaid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                engineMode === "mermaid"
                  ? "bg-blue-500/20 text-blue-500 border border-blue-500/35"
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              <GitBranch size={13} />
              <span>Architecture Spaces</span>
            </button>
            <button
              onClick={() => setEngineMode("miro")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                engineMode === "miro"
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/35"
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              <Layers size={13} />
              <span>Freeform Miro Whiteboard</span>
            </button>
          </div>

          {engineMode === "mermaid" && (
            <button
              onClick={() => setIsNewSpaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4984fd] hover:bg-blue-500 text-white text-xs font-medium transition"
            >
              <FolderPlus size={13} />
              <span>New Space</span>
            </button>
          )}
        </div>
      }
    >
      <div className="w-full space-y-4">
        {engineMode === "mermaid" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {spaces.map((sp) => {
              const active = sp.id === activeSpace.id;
              return (
                <button
                  key={sp.id}
                  onClick={() => setActiveSpaceId(sp.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-medium shrink-0 transition ${
                    active
                      ? "bg-[#4984fd]/15 text-[#4984fd] border-[#4984fd]/40"
                      : "opacity-75 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: active ? undefined : "var(--glass-surface)",
                    borderColor: active ? undefined : "var(--glass-border)",
                    color: active ? undefined : "var(--glass-text-primary)",
                  }}
                >
                  {sp.title}
                </button>
              );
            })}
            <button
              onClick={fetchArchitectureMap}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono shrink-0"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
                color: "var(--glass-text-muted)",
              }}
            >
              <RefreshCw size={12} className={isScanning ? "animate-spin text-[#4984fd]" : ""} />
              <span>Rescan Codebase</span>
            </button>
          </div>
        )}

        <div className="relative w-full">
          {engineMode === "mermaid" ? (
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
              <FreeformMiroWhiteboard />
            </ReactFlowProvider>
          )}

          <NodeInspectorDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
          <MermaidSourceDrawer
            isOpen={isCodeDrawerOpen}
            onClose={() => setIsCodeDrawerOpen(false)}
            initialCode={activeSpace.mermaidCode}
            onApply={handleApplyCode}
            onSave={handleApplyCode}
            onReset={handleResetCode}
          />
          <NewSpaceModal
            isOpen={isNewSpaceModalOpen}
            onClose={() => setIsNewSpaceModalOpen(false)}
            onCreateSpace={handleCreateSpace}
          />
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
