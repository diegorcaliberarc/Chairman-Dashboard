import { Node, Edge, MarkerType } from "@xyflow/react";

export interface TopologyTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

export const TOPOLOGY_TEMPLATES: TopologyTemplate[] = [
  {
    id: "chairman-master",
    name: "Chairman Dashboard Sovereign Topology",
    description: "Complete 5-Pillar Architecture with Core Kernel, Database Layer, and Engine Clusters",
    nodes: [
      // Frame: Core Kernel & Executive Orchestration
      {
        id: "frame-core",
        type: "frameNode",
        position: { x: 380, y: -40 },
        data: {
          title: "Tier 1: Sovereign Core & Dispatch",
          category: "CORE ORCHESTRATION",
          color: "#0969DA",
          width: 580,
          height: 190,
        },
      },
      // Root Node
      {
        id: "root-os",
        type: "systemNode",
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

      // Level 1: Four Primary Life & Enterprise Pillars
      {
        id: "pillar-health",
        type: "systemNode",
        position: { x: 50, y: 220 },
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
        type: "systemNode",
        position: { x: 350, y: 220 },
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
        type: "systemNode",
        position: { x: 650, y: 220 },
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
        type: "systemNode",
        position: { x: 950, y: 220 },
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
        type: "systemNode",
        position: { x: -60, y: 400 },
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
        type: "systemNode",
        position: { x: 140, y: 400 },
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
        type: "systemNode",
        position: { x: 260, y: 400 },
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
        type: "systemNode",
        position: { x: 460, y: 400 },
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
        type: "systemNode",
        position: { x: 580, y: 400 },
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
        type: "systemNode",
        position: { x: 780, y: 400 },
        data: {
          label: "Circadian Solar Dial",
          subtitle: "24-Hour Wheel & Google Sync",
          category: "TEMPORAL",
          route: "/calendar",
          color: "#0969DA",
          iconName: "calendar",
        },
      },

      // Level 2 Sub-Nodes: Mindset Pillar
      {
        id: "leaf-education",
        type: "systemNode",
        position: { x: 900, y: 400 },
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
        type: "systemNode",
        position: { x: 1100, y: 400 },
        data: {
          label: "Family Hub & Pods",
          subtitle: "His, Hers & Shared Ops",
          category: "RELATIONSHIPS",
          route: "/family-hub",
          color: "#8B5CF6",
          iconName: "heart",
        },
      },

      // Level 3 Infrastructure Node: System Resources Hub
      {
        id: "leaf-resources",
        type: "systemNode",
        position: { x: 500, y: 560 },
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

      // Sticky Note: Architecture Review Memo
      {
        id: "sticky-memo-1",
        type: "stickyNote",
        position: { x: 1140, y: 50 },
        data: {
          text: "Executive Review Q4:\n- Sub-second Circadian Arc load latency verified\n- Supabase pooler connections optimized\n- Live Miro/Lucidspark canvas operational",
          colorId: "yellow",
          author: "CHAIRMAN",
          reactions: { "🔥": 4, "🚀": 3 },
        },
      },

      // Database Cylinder Node
      {
        id: "shape-db",
        type: "shapeNode",
        position: { x: 260, y: 560 },
        data: {
          label: "Supabase AWS PostgreSQL Pooler",
          shapeType: "cylinder",
          colorId: "emerald",
        },
      },
    ],
    edges: [
      // Root to Pillars
      {
        id: "e-root-health",
        source: "root-os",
        target: "pillar-health",
        animated: true,
        style: { stroke: "#F59E0B", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#F59E0B" },
      },
      {
        id: "e-root-wealth",
        source: "root-os",
        target: "pillar-wealth",
        animated: true,
        style: { stroke: "#10B981", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981" },
      },
      {
        id: "e-root-ops",
        source: "root-os",
        target: "pillar-ops",
        animated: true,
        style: { stroke: "#0969DA", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#0969DA" },
      },
      {
        id: "e-root-mindset",
        source: "root-os",
        target: "pillar-mindset",
        animated: true,
        style: { stroke: "#8B5CF6", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8B5CF6" },
      },

      // Health to Leaves
      {
        id: "e-health-titan",
        source: "pillar-health",
        target: "leaf-titan",
        style: { stroke: "#F59E0B88", strokeWidth: 1.5 },
      },
      {
        id: "e-health-macros",
        source: "pillar-health",
        target: "leaf-macros",
        style: { stroke: "#F59E0B88", strokeWidth: 1.5 },
      },

      // Wealth to Leaves
      {
        id: "e-wealth-budget",
        source: "pillar-wealth",
        target: "leaf-budget",
        style: { stroke: "#10B98188", strokeWidth: 1.5 },
      },
      {
        id: "e-wealth-radar",
        source: "pillar-wealth",
        target: "leaf-radar",
        style: { stroke: "#10B98188", strokeWidth: 1.5 },
      },

      // Ops to Leaves
      {
        id: "e-ops-pms",
        source: "pillar-ops",
        target: "leaf-pms",
        style: { stroke: "#0969DA88", strokeWidth: 1.5 },
      },
      {
        id: "e-ops-calendar",
        source: "pillar-ops",
        target: "leaf-calendar",
        style: { stroke: "#0969DA88", strokeWidth: 1.5 },
      },

      // Mindset to Leaves
      {
        id: "e-mindset-edu",
        source: "pillar-mindset",
        target: "leaf-education",
        style: { stroke: "#8B5CF688", strokeWidth: 1.5 },
      },
      {
        id: "e-mindset-fam",
        source: "pillar-mindset",
        target: "leaf-family",
        style: { stroke: "#8B5CF688", strokeWidth: 1.5 },
      },

      // Ops to Resources
      {
        id: "e-ops-resources",
        source: "pillar-ops",
        target: "leaf-resources",
        animated: true,
        style: { stroke: "#38BDF8AA", strokeWidth: 1.5, strokeDasharray: "4 4" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#38BDF8" },
      },

      // Leaf Budget to Database
      {
        id: "e-budget-db",
        source: "leaf-budget",
        target: "shape-db",
        style: { stroke: "#10B981AA", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981" },
      },
    ],
  },
  {
    id: "cloud-microservices",
    name: "Cloud Mesh & Event-Driven Architecture",
    description: "Ingress Gateway, NextAuth Security, API Routers, Redis Cache, and PostgreSQL Cluster",
    nodes: [
      {
        id: "ms-cloud",
        type: "shapeNode",
        position: { x: 400, y: 30 },
        data: { label: "Vercel Edge Network / Cloudflare CDN", shapeType: "cloud", colorId: "sky" },
      },
      {
        id: "ms-ingress",
        type: "shapeNode",
        position: { x: 400, y: 180 },
        data: { label: "Next.js App Router Ingress Gateway", shapeType: "rectangle", colorId: "violet" },
      },
      {
        id: "ms-auth",
        type: "shapeNode",
        position: { x: 160, y: 320 },
        data: { label: "NextAuth / OAuth Token Authority", shapeType: "diamond", colorId: "amber" },
      },
      {
        id: "ms-api",
        type: "shapeNode",
        position: { x: 400, y: 320 },
        data: { label: "LivingOS Core API Mesh", shapeType: "rectangle", colorId: "sky" },
      },
      {
        id: "ms-workers",
        type: "shapeNode",
        position: { x: 640, y: 320 },
        data: { label: "Async Telemetry & Cron Schedulers", shapeType: "terminal", colorId: "emerald" },
      },
      {
        id: "ms-db",
        type: "shapeNode",
        position: { x: 400, y: 480 },
        data: { label: "Supabase PostgreSQL Database Pooler", shapeType: "cylinder", colorId: "emerald" },
      },
      {
        id: "ms-sticky",
        type: "stickyNote",
        position: { x: 740, y: 80 },
        data: {
          text: "SLA Targets:\n- Latency: < 150ms p95\n- Pooler timeout: 10s\n- Zero cold start delay with SWR",
          colorId: "cyan",
          author: "SYSARCH",
          reactions: { "⚡": 5 },
        },
      },
    ],
    edges: [
      {
        id: "e-cloud-ingress",
        source: "ms-cloud",
        target: "ms-ingress",
        animated: true,
        style: { stroke: "#38BDF8", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#38BDF8" },
      },
      {
        id: "e-ingress-auth",
        source: "ms-ingress",
        target: "ms-auth",
        style: { stroke: "#FBBF24", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#FBBF24" },
      },
      {
        id: "e-ingress-api",
        source: "ms-ingress",
        target: "ms-api",
        animated: true,
        style: { stroke: "#38BDF8", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#38BDF8" },
      },
      {
        id: "e-ingress-workers",
        source: "ms-ingress",
        target: "ms-workers",
        style: { stroke: "#34D399", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#34D399" },
      },
      {
        id: "e-api-db",
        source: "ms-api",
        target: "ms-db",
        animated: true,
        style: { stroke: "#34D399", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#34D399" },
      },
      {
        id: "e-workers-db",
        source: "ms-workers",
        target: "ms-db",
        style: { stroke: "#34D39988", strokeWidth: 1.5, strokeDasharray: "4 4" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#34D399" },
      },
    ],
  },
  {
    id: "sprint-ideation",
    name: "Miro / Lucidspark Sprint Ideation Board",
    description: "Brainstorming canvas with colored Sticky Notes, Votes, and Frames",
    nodes: [
      {
        id: "frame-ideas",
        type: "frameNode",
        position: { x: 50, y: 50 },
        data: { title: "High-Leverage Strategic Bets", category: "IDEATION TIER", color: "#F59E0B", width: 720, height: 440 },
      },
      {
        id: "sticky-1",
        type: "stickyNote",
        position: { x: 90, y: 120 },
        data: { text: "Autonomous Copilot HUD with live multimodal voice synthesis", colorId: "yellow", author: "CHAIRMAN", reactions: { "🔥": 6, "🚀": 3 } },
      },
      {
        id: "sticky-2",
        type: "stickyNote",
        position: { x: 330, y: 120 },
        data: { text: "Interactive 3D Mol* biomolecular viewer for epigenetic aging markers", colorId: "peach", author: "CHAIRMAN", reactions: { "💡": 4 } },
      },
      {
        id: "sticky-3",
        type: "stickyNote",
        position: { x: 560, y: 120 },
        data: { text: "Real-time Plaid banking webhook sync with auto debt-snowball allocator", colorId: "green", author: "CHAIRMAN", reactions: { "❤️": 5 } },
      },
      {
        id: "sticky-4",
        type: "stickyNote",
        position: { x: 90, y: 310 },
        data: { text: "Zero-latency offline indexed SQLite cache with bi-directional syncing", colorId: "cyan", author: "CHAIRMAN", reactions: { "⚡": 8 } },
      },
      {
        id: "sticky-5",
        type: "stickyNote",
        position: { x: 330, y: 310 },
        data: { text: "Circadian Solar Arc real-time sun/moon ray tracing on GPU canvas", colorId: "purple", author: "CHAIRMAN", reactions: { "🔥": 7 } },
      },
    ],
    edges: [],
  },
  {
    id: "blank-canvas",
    name: "Blank Canvas",
    description: "Start fresh with an empty infinite board and build your custom topology",
    nodes: [],
    edges: [],
  },
];
