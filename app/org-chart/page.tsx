"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  NodeProps,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Activity,
  Calendar,
  Compass,
  Cpu,
  Database,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Layers,
  Network,
  Orbit,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

interface TopologyNodeData {
  label: string;
  subtitle: string;
  category: string;
  route: string;
  color: string;
  iconName: string;
  isRoot?: boolean;
  statusBadge?: string;
}

// Custom Node Component with Dark Obsidian Glass Aesthetics
function TopologyNode({ data }: any) {
  const router = useRouter();

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

  return (
    <div
      onClick={() => {
        if (data.route) router.push(data.route);
      }}
      style={{ borderColor: `${data.color}55` }}
      className={`group relative rounded-2xl border bg-[#0E1017]/95 p-4 shadow-2xl backdrop-blur-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] cursor-pointer ${
        data.isRoot
          ? "w-72 ring-2 ring-[#0969DA]/50 shadow-[#0969DA]/20"
          : "w-64"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-zinc-600 !w-2 !h-2"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner"
            style={{
              backgroundColor: `${data.color}15`,
              borderColor: `${data.color}35`,
            }}
          >
            {renderIcon(data.iconName, data.color)}
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">
              {data.label}
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">
              {data.subtitle}
            </p>
          </div>
        </div>

        {data.statusBadge && (
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold"
            style={{
              backgroundColor: `${data.color}15`,
              borderColor: `${data.color}40`,
              color: data.color,
            }}
          >
            {data.statusBadge}
          </span>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>{data.category}</span>
        <span className="text-[#58A6FF] opacity-0 group-hover:opacity-100 transition-opacity">
          Open →
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-zinc-600 !w-2 !h-2"
      />
    </div>
  );
}

const nodeTypes = {
  topologyNode: TopologyNode,
};

// Initial Nodes Tree Topology
const INITIAL_NODES = [
  // Root Level 0: The Chairman OS
  {
    id: "root-os",
    type: "topologyNode",
    position: { x: 500, y: 30 },
    data: {
      label: "Chairman OS Kernel",
      subtitle: "Universal Command & Dispatch",
      category: "CORE KERNEL",
      route: "/",
      color: "#0969DA",
      iconName: "orbit",
      isRoot: true,
      statusBadge: "ONLINE",
    },
  },

  // Level 1: Five Primary Life & Enterprise Pillars
  {
    id: "pillar-health",
    type: "topologyNode",
    position: { x: 50, y: 180 },
    data: {
      label: "Pillar: Health & Fitness",
      subtitle: "Hypertrophy & Macro Telemetry",
      category: "PERFORMANCE",
      route: "/workouts",
      color: "#F59E0B",
      iconName: "dumbbell",
      statusBadge: "ACTIVE",
    },
  },
  {
    id: "pillar-wealth",
    type: "topologyNode",
    position: { x: 350, y: 180 },
    data: {
      label: "Pillar: Wealth & SaaS",
      subtitle: "Capital, Ledger & Architecture",
      category: "ENTERPRISE",
      route: "/budget",
      color: "#10B981",
      iconName: "wallet",
      statusBadge: "HEALTHY",
    },
  },
  {
    id: "pillar-ops",
    type: "topologyNode",
    position: { x: 650, y: 180 },
    data: {
      label: "Pillar: Operations & PMS",
      subtitle: "Sovereign Task Ledger & Temporal",
      category: "EXECUTION",
      route: "/pms",
      color: "#0969DA",
      iconName: "layers",
      statusBadge: "SYNCED",
    },
  },
  {
    id: "pillar-mindset",
    type: "topologyNode",
    position: { x: 950, y: 180 },
    data: {
      label: "Pillar: Epistemic & Mindset",
      subtitle: "Master Curriculum & Family Hub",
      category: "SOVEREIGN",
      route: "/education",
      color: "#8B5CF6",
      iconName: "graduation",
      statusBadge: "ACTIVE",
    },
  },

  // Level 2 Sub-Nodes: Health Pillar
  {
    id: "leaf-titan",
    type: "topologyNode",
    position: { x: -50, y: 340 },
    data: {
      label: "Titan Workouts",
      subtitle: "Set & Rep Progression Logger",
      category: "SUPABASE RLS",
      route: "/workouts",
      color: "#F59E0B",
      iconName: "dumbbell",
    },
  },
  {
    id: "leaf-macros",
    type: "topologyNode",
    position: { x: 150, y: 340 },
    data: {
      label: "Continuous Macro Ops",
      subtitle: "Daily Calorie & Protein Tracker",
      category: "SUPABASE RLS",
      route: "/macro-ops",
      color: "#F59E0B",
      iconName: "utensils",
    },
  },

  // Level 2 Sub-Nodes: Wealth Pillar
  {
    id: "leaf-budget",
    type: "topologyNode",
    position: { x: 280, y: 340 },
    data: {
      label: "Yearly Budget Ledger",
      subtitle: "Plaid Financial Telemetry",
      category: "FINANCIAL",
      route: "/budget",
      color: "#10B981",
      iconName: "wallet",
    },
  },
  {
    id: "leaf-radar",
    type: "topologyNode",
    position: { x: 480, y: 340 },
    data: {
      label: "Market Intelligence",
      subtitle: "Content & Trends Scrubber",
      category: "MARKETING AI",
      route: "/marketing-agent",
      color: "#10B981",
      iconName: "cpu",
    },
  },

  // Level 2 Sub-Nodes: Operations Pillar
  {
    id: "leaf-pms",
    type: "topologyNode",
    position: { x: 600, y: 340 },
    data: {
      label: "Pristine PMS",
      subtitle: "List, Board, Gantt & Table",
      category: "POSTGRESQL",
      route: "/pms",
      color: "#0969DA",
      iconName: "layers",
    },
  },
  {
    id: "leaf-calendar",
    type: "topologyNode",
    position: { x: 800, y: 340 },
    data: {
      label: "Circadian Solar Dial",
      subtitle: "24-Hour Wheel & Google Sync",
      category: "TEMPORAL",
      route: "/calendar",
      color: "#0969DA",
      iconName: "calendar",
    },
  },

  // Level 2 Sub-Nodes: Mindset & Epistemic Pillar
  {
    id: "leaf-education",
    type: "topologyNode",
    position: { x: 920, y: 340 },
    data: {
      label: "Master Curriculum",
      subtitle: "Enterprise Software Architecture",
      category: "GAMIFIED",
      route: "/education",
      color: "#8B5CF6",
      iconName: "graduation",
    },
  },
  {
    id: "leaf-family",
    type: "topologyNode",
    position: { x: 1120, y: 340 },
    data: {
      label: "Family Hub & Pods",
      subtitle: "His, Hers & Shared Ops",
      category: "RELATIONSHIPS",
      route: "/family-hub",
      color: "#8B5CF6",
      iconName: "heart",
    },
  },

  // Level 3 Infrastructure Node: System Resources
  {
    id: "leaf-resources",
    type: "topologyNode",
    position: { x: 500, y: 480 },
    data: {
      label: "System Resources Hub",
      subtitle: "Architecture Matrix & SOPs",
      category: "INFRASTRUCTURE",
      route: "/resources",
      color: "#38BDF8",
      iconName: "database",
      statusBadge: "DOCUMENTED",
    },
  },
];

const INITIAL_EDGES = [
  // Root to Pillars
  {
    id: "e-root-health",
    source: "root-os",
    target: "pillar-health",
    animated: true,
    style: { stroke: "#F59E0B", strokeWidth: 2 },
  },
  {
    id: "e-root-wealth",
    source: "root-os",
    target: "pillar-wealth",
    animated: true,
    style: { stroke: "#10B981", strokeWidth: 2 },
  },
  {
    id: "e-root-ops",
    source: "root-os",
    target: "pillar-ops",
    animated: true,
    style: { stroke: "#0969DA", strokeWidth: 2 },
  },
  {
    id: "e-root-mindset",
    source: "root-os",
    target: "pillar-mindset",
    animated: true,
    style: { stroke: "#8B5CF6", strokeWidth: 2 },
  },

  // Health to Leaves
  {
    id: "e-health-titan",
    source: "pillar-health",
    target: "leaf-titan",
    style: { stroke: "#F59E0B66", strokeWidth: 1.5 },
  },
  {
    id: "e-health-macros",
    source: "pillar-health",
    target: "leaf-macros",
    style: { stroke: "#F59E0B66", strokeWidth: 1.5 },
  },

  // Wealth to Leaves
  {
    id: "e-wealth-budget",
    source: "pillar-wealth",
    target: "leaf-budget",
    style: { stroke: "#10B98166", strokeWidth: 1.5 },
  },
  {
    id: "e-wealth-radar",
    source: "pillar-wealth",
    target: "leaf-radar",
    style: { stroke: "#10B98166", strokeWidth: 1.5 },
  },

  // Ops to Leaves
  {
    id: "e-ops-pms",
    source: "pillar-ops",
    target: "leaf-pms",
    style: { stroke: "#0969DA66", strokeWidth: 1.5 },
  },
  {
    id: "e-ops-calendar",
    source: "pillar-ops",
    target: "leaf-calendar",
    style: { stroke: "#0969DA66", strokeWidth: 1.5 },
  },

  // Mindset to Leaves
  {
    id: "e-mindset-edu",
    source: "pillar-mindset",
    target: "leaf-education",
    style: { stroke: "#8B5CF666", strokeWidth: 1.5 },
  },
  {
    id: "e-mindset-fam",
    source: "pillar-mindset",
    target: "leaf-family",
    style: { stroke: "#8B5CF666", strokeWidth: 1.5 },
  },

  // Ops to Resources
  {
    id: "e-ops-resources",
    source: "pillar-ops",
    target: "leaf-resources",
    animated: true,
    style: { stroke: "#38BDF888", strokeWidth: 1.5, strokeDasharray: "4 4" },
  },
];

export default function OrgChartTopologyPage() {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, , onEdgesChange] = useEdgesState(INITIAL_EDGES);

  return (
    <ExecutiveModuleShell
      moduleId="ORG_CHART"
      eyebrow="System Architecture & Flow"
      title="Topology & Routing Map"
      subtitle="Interactive Clickable Node-and-Edge Matrix Routing into All Chairman Dashboard Engines"
      accentColor="#0969DA"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        {/* HUD Info Header */}
        <div className="flex items-center justify-between px-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-[#58A6FF]" />
            <span>Interactive Node Topology: Click any node to dispatch navigation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              13 System Nodes Online
            </span>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div className="w-full h-[720px] rounded-3xl border border-[#1A1D24] bg-[#090A0F] overflow-hidden shadow-2xl relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#1A1D24"
            />
            <Controls className="!bg-[#111214] !border-[#1A1D24] !text-zinc-100 rounded-xl" />
            <MiniMap
              nodeColor="#0969DA"
              maskColor="rgba(9, 10, 15, 0.85)"
              className="!bg-[#111214] !border-[#1A1D24] rounded-2xl overflow-hidden"
            />
          </ReactFlow>
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
