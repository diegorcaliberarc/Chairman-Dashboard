export type ArchitectureStatus = "LIVE" | "WIP" | "PLANNED";

export interface ArchitectureNode {
  id: string;
  label: string;
  subtitle: string;
  route: string;
  pillar: "command" | "health" | "wealth" | "relationships" | "fam" | "joy" | "infra";
  spaceId: "master" | "core" | "wealth" | "health";
  status: ArchitectureStatus;
  description: string;
  apis: string[];
  subFeatures: string[];
  dependencies: string[];
  techStack: string[];
  iconName: string;
}

export interface DiagramSpace {
  id: string;
  title: string;
  description: string;
  badge: string;
  isDefault?: boolean;
  direction: "TD" | "LR";
  mermaidCode: string;
  updatedAt: string;
}

export const KNOWN_MODULES_REGISTRY: ArchitectureNode[] = [
  // Master & Core
  {
    id: "COMMAND",
    label: "Command Center",
    subtitle: "Strategic FRAGO & PACE Plan",
    route: "/command",
    pillar: "command",
    spaceId: "core",
    status: "LIVE",
    description: "North Star target cascade, weekly FRAGO execution directives, 5-tier priority matrix, and operational pace.",
    apis: ["/api/command", "/api/tasks", "/api/chat"],
    subFeatures: ["North Star Cascade", "PACE Matrix", "Weekly FRAGO Directives", "5-Tier Goal Funnel"],
    dependencies: ["AUTH", "SUPABASE_DB", "VAULT"],
    techStack: ["Next.js 14", "Tailwind CSS", "Lucide React", "Supabase RLS"],
    iconName: "Compass",
  },
  {
    id: "CALENDAR",
    label: "Circadian Solar Arc",
    subtitle: "24-Hour Solar Chronobiology",
    route: "/calendar",
    pillar: "health",
    spaceId: "core",
    status: "LIVE",
    description: "24-Hour continuous circadian solar clock, day-to-night celestial dial, dynamic orbital HUD wedges, subtask lists, and time-scrubbing.",
    apis: ["/api/circadian", "/api/circadian/radar", "/api/calendar-events", "/api/calendar-ops", "/api/calendar/google-sync"],
    subFeatures: ["Celestial Day-to-Night Sphere", "Orbital HUD Wedges", "Dual Solar Nodes", "Subtask Trackers", "Google Calendar Sync"],
    dependencies: ["AUTH", "SUPABASE_DB", "MACRO_OPS", "WORKOUTS"],
    techStack: ["SVG Canvas", "Polar/Cartesian Math", "Google Calendar API", "Next.js"],
    iconName: "CalendarRange",
  },
  {
    id: "HORIZON",
    label: "Horizon & Vision Zoom",
    subtitle: "90-Day Execution Sprints",
    route: "/horizon",
    pillar: "command",
    spaceId: "core",
    status: "LIVE",
    description: "Strategic time horizons across 10-year, 3-year, 1-year, and 90-day execution sprints with fractal alignment.",
    apis: ["/api/horizon", "/api/roadmaps"],
    subFeatures: ["Fractal Horizon Ladder", "90-Day Sprint Tracker", "Milestone Telemetry", "North Star Tie-in"],
    dependencies: ["COMMAND", "SUPABASE_DB"],
    techStack: ["Tailwind", "React", "Supabase"],
    iconName: "Sunrise",
  },
  {
    id: "VAULT",
    label: "Neural Knowledge Vault",
    subtitle: "Second Brain Graph",
    route: "/vault",
    pillar: "joy",
    spaceId: "core",
    status: "LIVE",
    description: "Second brain vector knowledge base, epistemic notes graph, AI semantic indexing, and architectural SOP repositories.",
    apis: ["/api/vault", "/api/chat"],
    subFeatures: ["Graph Visualization", "Semantic Vector Search", "SOP Repository", "Ephemeral Memory Store"],
    dependencies: ["SUPABASE_DB", "INTEGRATIONS"],
    techStack: ["PostgreSQL pgvector", "Next.js", "Tailwind"],
    iconName: "Network",
  },
  {
    id: "EPISTEMIC",
    label: "Epistemic Risk Matrix",
    subtitle: "Antifragility Protocols",
    route: "/epistemic",
    pillar: "joy",
    spaceId: "core",
    status: "LIVE",
    description: "Antifragility assessment, black swan hazard detection, sovereign risk mitigation protocols, and operational hedges.",
    apis: ["/api/epistemic"],
    subFeatures: ["Hazard Matrix", "Antifragile Scorecards", "Risk Mitigation Hedges", "Kill-Switch Triggers"],
    dependencies: ["COMMAND", "VAULT"],
    techStack: ["Tailwind", "React"],
    iconName: "ShieldAlert",
  },

  // Wealth & SaaS Portfolio
  {
    id: "EQUIPSYNX",
    label: "EquipSynx SaaS Platform",
    subtitle: "Enterprise Field & Fleet OS",
    route: "/pms",
    pillar: "wealth",
    spaceId: "wealth",
    status: "WIP",
    description: "Commercial field service & equipment management platform featuring 7 user roles, 29 operational features, GPS dispatch, work orders, POS, and telemetry.",
    apis: ["/api/pms", "/api/life-ops"],
    subFeatures: ["7-Role RBAC", "Live GPS Dispatch Map", "Equipment Telemetry", "Digital Invoicing & POS", "Inventory Lifecycle"],
    dependencies: ["AUTH", "SUPABASE_DB", "BUDGET"],
    techStack: ["Next.js", "Supabase Auth", "FastAPI Service", "Stripe POS"],
    iconName: "Truck",
  },
  {
    id: "CALIBER_ARC",
    label: "Caliber Arc Futures",
    subtitle: "NQ/MNQ Execution Cockpit",
    route: "/caliber-arc",
    pillar: "wealth",
    spaceId: "wealth",
    status: "LIVE",
    description: "High-velocity futures trading terminal for NQ and MNQ contracts with trade scrubbing, edge verification, and PnL metrics.",
    apis: ["/api/trading"],
    subFeatures: ["Futures Terminal", "Trade Scrubber", "Execution Telemetry", "Win-Rate & Edge Radars"],
    dependencies: ["AUTH", "SUPABASE_DB"],
    techStack: ["WebSocket", "TradingView Lightweight Charts", "Tailwind"],
    iconName: "TrendingUp",
  },
  {
    id: "BUDGET",
    label: "12M Budget Ledger",
    subtitle: "Shift Pay & Run-Rate Engine",
    route: "/budget",
    pillar: "wealth",
    spaceId: "wealth",
    status: "LIVE",
    description: "Multi-scenario 12-month financial ledger modeling shift pay, SaaS recurring expenses, capital reserves, and runway.",
    apis: ["/api/budget"],
    subFeatures: ["12-Month Projections", "Shift Pay Calculator", "Expense Subscriptions", "Runway Stress Test"],
    dependencies: ["SUPABASE_DB"],
    techStack: ["React Table", "Recharts", "Next.js"],
    iconName: "Wallet",
  },
  {
    id: "MARKETING_AGENT",
    label: "Trend Scrubber & Virality",
    subtitle: "Autonomous Content Engine",
    route: "/marketing-agent",
    pillar: "wealth",
    spaceId: "wealth",
    status: "LIVE",
    description: "AI-driven viral trend detection, gaming marketing ideation, algorithmic angle scrubbing, and distribution pipelines.",
    apis: ["/api/marketing-agent"],
    subFeatures: ["TikTok/IG Reel Scrubber", "Gaming Trend Aggregator", "Hook Multiplier", "Campaign Pipeline"],
    dependencies: ["INTEGRATIONS"],
    techStack: ["Next.js", "Gemini 2.5 API", "Tailwind"],
    iconName: "Radar",
  },
  {
    id: "EDUCATION",
    label: "Education Academy",
    subtitle: "Systems Architecture Mastery",
    route: "/education",
    pillar: "wealth",
    spaceId: "wealth",
    status: "LIVE",
    description: "Engineering curriculum, tier-based XP progression, and system architecture blueprints for full-stack sovereign mastery.",
    apis: ["/api/education"],
    subFeatures: ["Curriculum Tracks", "XP Progress Engine", "Architecture Blueprints", "Lab Exercises"],
    dependencies: ["VAULT"],
    techStack: ["React", "Tailwind CSS"],
    iconName: "GraduationCap",
  },
  {
    id: "PMS",
    label: "Sovereign PMS",
    subtitle: "ClickUp Bi-Directional Bridge",
    route: "/pms",
    pillar: "wealth",
    spaceId: "wealth",
    status: "LIVE",
    description: "Bi-directional ClickUp synchronization, sprint velocity dashboards, FRAGO task boards, and executive delegation.",
    apis: ["/api/pms", "/api/tasks"],
    subFeatures: ["ClickUp 2-Way Sync", "Sprint Velocity Metrics", "Kanban Workflows", "FRAGO Delegation"],
    dependencies: ["SUPABASE_DB", "INTEGRATIONS"],
    techStack: ["ClickUp REST API v2", "Next.js"],
    iconName: "KanbanSquare",
  },

  // Health, Mindset & Life Pillars
  {
    id: "MACRO_OPS",
    label: "Macro Ops & Ingestion",
    subtitle: "1,700 kcal / 180g Protein Tracker",
    route: "/macro-ops",
    pillar: "health",
    spaceId: "health",
    status: "LIVE",
    description: "Precision biometric fuel ledger, glycogen repletion curves, kinetic steps heatmap, quick food parsing, and SITREP council.",
    apis: ["/api/nutrition", "/api/parse-food", "/api/sitrep"],
    subFeatures: ["1700 kcal Target Pacing", "180g Nitrogen Saturation", "Portion Weighing Scales", "24h Ingestion Heatmap", "SITREP Council HUD"],
    dependencies: ["AUTH", "SUPABASE_DB", "CALENDAR"],
    techStack: ["Next.js", "Glass Studio Dynamic Tokens", "Tailwind", "IndexedDB"],
    iconName: "Utensils",
  },
  {
    id: "WORKOUTS",
    label: "Titan Workouts Engine",
    subtitle: "Bodybuilding Logger & 1RM",
    route: "/workouts",
    pillar: "health",
    spaceId: "health",
    status: "LIVE",
    description: "Bodybuilding session tracker with volume metrics, rest interval timers, rep/set targets, equipment checklists, and roadmap calendar.",
    apis: ["/api/titan/exercises", "/api/titan/sessions", "/api/titan/sets", "/api/titan/templates"],
    subFeatures: ["Session Duration & Volume", "Rest Interval Timer", "Equipment Breakdown", "Rep/Set Intensity", "Roadmap Workout Calendar"],
    dependencies: ["AUTH", "SUPABASE_DB"],
    techStack: ["Next.js", "Tailwind", "Supabase PostgreSQL"],
    iconName: "Dumbbell",
  },
  {
    id: "MINDSET",
    label: "Mindset Counsel",
    subtitle: "Cognitive Frame Anchors",
    route: "/mindset",
    pillar: "relationships",
    spaceId: "health",
    status: "LIVE",
    description: "Cognitive framing protocol, anchor counsel, inner dialogue calibration, and high-stress executive de-escalation.",
    apis: ["/api/mindset", "/api/chat"],
    subFeatures: ["Frame Anchors", "Cognitive Distortion Filter", "Dialogue Calibration", "Stress De-escalation"],
    dependencies: ["VAULT"],
    techStack: ["Next.js", "Tailwind"],
    iconName: "Flame",
  },
  {
    id: "PODS",
    label: "His & Hers Pods",
    subtitle: "Shared Goals & Growth",
    route: "/pods",
    pillar: "relationships",
    spaceId: "health",
    status: "LIVE",
    description: "Collaborative spouse pods for synchronized vision, bucket lists, mutual growth radars, and milestone celebrations.",
    apis: ["/api/pods"],
    subFeatures: ["Shared Bucket List", "Growth Alignment Radar", "Connection Milestones", "Daily Check-in"],
    dependencies: ["SUPABASE_DB"],
    techStack: ["Next.js", "Supabase"],
    iconName: "Users",
  },
  {
    id: "FAMILY_HUB",
    label: "5-Wheel Family Hub",
    subtitle: "Nova, Astro & Comet Recovery",
    route: "/family-hub",
    pillar: "fam",
    spaceId: "health",
    status: "LIVE",
    description: "Canine biometrics for Nova, Astro, and Comet recovery telemetry, veterinary dosage logs, and family operational schedules.",
    apis: ["/api/family-hub"],
    subFeatures: ["Canine Activity Tracking", "Comet Medication Protocol", "Walk Timelines", "Vet Telemetry"],
    dependencies: ["CALENDAR", "SUPABASE_DB"],
    techStack: ["Next.js", "Tailwind"],
    iconName: "Dog",
  },
  {
    id: "LIFE_OPS",
    label: "Life Ops & Fleet",
    subtitle: "Logistics & Maintenance",
    route: "/life-ops",
    pillar: "fam",
    spaceId: "health",
    status: "LIVE",
    description: "Home infrastructure maintenance, automotive fleet management, preventive maintenance schedules, and warranty vaults.",
    apis: ["/api/life-ops"],
    subFeatures: ["Fleet Mileage & Service Logs", "Home Preventive Schedules", "Warranty Vault", "Vendor Roster"],
    dependencies: ["BUDGET", "SUPABASE_DB"],
    techStack: ["Next.js", "Tailwind"],
    iconName: "Wrench",
  },

  // Infrastructure & Auxiliary
  {
    id: "KPIS",
    label: "KPI Scorecard",
    subtitle: "Executive Metric Cockpit",
    route: "/kpis",
    pillar: "command",
    spaceId: "master",
    status: "LIVE",
    description: "Real-time executive scorecards tracking health, wealth, operational speed, and life consistency metrics.",
    apis: ["/api/kpi-scorecard", "/api/scorecard", "/api/metrics"],
    subFeatures: ["Multi-Pillar Radars", "Consistency Index", "Weekly Metric Diff", "Alert Triggers"],
    dependencies: ["MACRO_OPS", "WORKOUTS", "CALIBER_ARC", "BUDGET"],
    techStack: ["Recharts", "Next.js"],
    iconName: "Activity",
  },
  {
    id: "INTEGRATIONS",
    label: "MCP & Tools Console",
    subtitle: "APIs, Keys & Bridges",
    route: "/integrations",
    pillar: "infra",
    spaceId: "master",
    status: "LIVE",
    description: "Model Context Protocol connections, API credential management, webhook status, and external tool telemetry.",
    apis: ["/api/integrations", "/api/agent"],
    subFeatures: ["MCP Server Manager", "Credential Vault", "Live API Heartbeats", "Webhook Event Bus"],
    dependencies: ["AUTH", "SUPABASE_DB"],
    techStack: ["FastAPI Bridge", "Next.js"],
    iconName: "PlugZap",
  },
  {
    id: "RESOURCES",
    label: "Resources & SOPs",
    subtitle: "Architecture Matrix & Docs",
    route: "/resources",
    pillar: "joy",
    spaceId: "master",
    status: "LIVE",
    description: "Centralized architecture documentation, SOP catalogs, operational runbooks, and codebase reference links.",
    apis: ["/api/vault"],
    subFeatures: ["SOP Documentation", "System Architecture Runbooks", "Quick Code Reference", "API Contracts"],
    dependencies: ["VAULT"],
    techStack: ["Markdown", "Next.js"],
    iconName: "Database",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pre-Compiled Mermaid Diagram Generators per Space
// ─────────────────────────────────────────────────────────────────────────────

export function getMasterTopologyMermaid(dir: "TD" | "LR" = "TD"): string {
  return `flowchart ${dir}
  %% Master System Topology Diagram
  classDef liveNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
  classDef wipNode fill:#2d1b06,stroke:#f59e0b,stroke-width:2px,color:#fef3c7;
  classDef infraNode fill:#0b1329,stroke:#64748b,stroke-width:1.5px,color:#cbd5e1;
  classDef gatewayNode fill:#06241b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;

  subgraph CLIENT["⚡ FRONTEND CLIENT LAYER (Next.js 14 PWA)"]
    direction ${dir}
    SHELL["Executive Shell & Glass Studio<br/><code>/</code>"]:::liveNode
    OVERVIEW["Overview Cockpit<br/><code>/overview</code>"]:::liveNode
    KPIS["Executive KPI Scorecard<br/><code>/kpis</code>"]:::liveNode
    RESOURCES["Resources & SOP Matrix<br/><code>/resources</code>"]:::liveNode
  end

  subgraph PILLARS["🏛️ THE 5 EXECUTIVE OPERATIONAL PILLARS"]
    direction ${dir}
    subgraph P1["Pillar I: Command & Governance"]
      COMMAND["Command Center<br/><code>/command</code>"]:::liveNode
      HORIZON["Horizon & Vision Zoom<br/><code>/horizon</code>"]:::liveNode
      VAULT["Neural Knowledge Vault<br/><code>/vault</code>"]:::liveNode
      EPISTEMIC["Epistemic Matrix<br/><code>/epistemic</code>"]:::liveNode
    end
    subgraph P2["Pillar II: Health & Biometrics"]
      CALENDAR["Circadian Solar Arc<br/><code>/calendar</code>"]:::liveNode
      MACRO_OPS["Macro Ops Ingestion<br/><code>/macro-ops</code>"]:::liveNode
      WORKOUTS["Titan Workouts Engine<br/><code>/workouts</code>"]:::liveNode
    end
    subgraph P3["Pillar III: Wealth & SaaS"]
      EQUIPSYNX["EquipSynx SaaS Platform<br/><code>7 Roles · 29 Features</code>"]:::wipNode
      CALIBER_ARC["Caliber Arc Futures<br/><code>/caliber-arc</code>"]:::liveNode
      BUDGET["12M Budget Ledger<br/><code>/budget</code>"]:::liveNode
      MARKETING["Trend Scrubber<br/><code>/marketing-agent</code>"]:::liveNode
      EDUCATION["Education Academy<br/><code>/education</code>"]:::liveNode
      PMS["Sovereign PMS<br/><code>/pms</code>"]:::liveNode
    end
    subgraph P4["Pillar IV: Relationships & Fam"]
      PODS["His & Hers Pods<br/><code>/pods</code>"]:::liveNode
      MINDSET["Mindset Counsel<br/><code>/mindset</code>"]:::liveNode
      FAMILY_HUB["5-Wheel Family Hub<br/><code>/family-hub</code>"]:::liveNode
      LIFE_OPS["Life Ops & Fleet<br/><code>/life-ops</code>"]:::liveNode
    end
  end

  subgraph BACKEND["🛡️ SECURE SERVICES & PERSISTENCE LAYER"]
    direction ${dir}
    AUTH["NextAuth.js & JWT Sessions<br/><code>/api/auth/[...nextauth]</code>"]:::gatewayNode
    APIS["Next.js Route Handlers<br/><code>/api/* (39 Endpoints)</code>"]:::gatewayNode
    MCP["Model Context Protocol Bridges<br/><code>/integrations</code>"]:::infraNode
    SUPABASE[("Supabase PostgreSQL & RLS<br/>Database & Storage")]:::infraNode
  end

  CLIENT --> APIS
  APIS --> SUPABASE
  AUTH --> APIS
  APIS --> PILLARS
  MCP --> APIS
  COMMAND -.-> P1
  CALENDAR -.-> P2
  CALIBER_ARC -.-> P3
  MACRO_OPS --> KPIS
  WORKOUTS --> KPIS
  CALIBER_ARC --> KPIS
  BUDGET --> KPIS`;
}

export function getCoreEngineMermaid(dir: "TD" | "LR" = "TD"): string {
  return `flowchart ${dir}
  %% Chairman Core & Circadian Engine Diagram
  classDef liveNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
  classDef solarNode fill:#2d1b06,stroke:#f59e0b,stroke-width:2px,color:#fef3c7;
  classDef storageNode fill:#1f1338,stroke:#a855f7,stroke-width:1.5px,color:#f3e8ff;
  classDef apiNode fill:#06241b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;

  subgraph STRATEGY["🎯 EXECUTIVE COMMAND & GOVERNANCE"]
    direction ${dir}
    COMMAND["Command Center (PACE Plan)<br/><code>/command</code>"]:::liveNode
    HORIZON["Horizon Zoom (90-Day Sprints)<br/><code>/horizon</code>"]:::liveNode
    EPISTEMIC["Epistemic Antifragility Matrix<br/><code>/epistemic</code>"]:::liveNode
  end

  subgraph CIRCADIAN["☀️ 24-HOUR CIRCADIAN SOLAR ENGINE"]
    direction ${dir}
    CALENDAR["Circadian Celestial Dial<br/><code>/calendar</code>"]:::solarNode
    DIAL["Day-to-Night Photosphere<br/><code>R=180 Flush Dial</code>"]:::solarNode
    ORBITAL_HUD["Orbital HUD Event Wedges<br/><code>Direct Labels & Split View</code>"]:::solarNode
    SOLAR_ARC["Luminous Solar Time Arc<br/><code>Apex/Nadir Dual Nodes</code>"]:::solarNode
    SUBTASKS["Chronobiological Subtasks<br/><code>Checklists & Habits</code>"]:::solarNode
  end

  subgraph VAULT_MESH["🧠 NEURAL VAULT & AGENTIC COPILOT"]
    direction ${dir}
    VAULT["Neural Knowledge Vault<br/><code>/vault</code>"]:::storageNode
    COPILOT["Multimodal Copilot<br/><code>/api/copilot & /api/chat</code>"]:::apiNode
    CLICKUP["ClickUp Realtime Sync<br/><code>/api/calendar/google-sync</code>"]:::apiNode
  end

  subgraph STORAGE["💾 PERSISTENCE & DATA INGESTION"]
    direction ${dir}
    EVENTS_API["Calendar Events API<br/><code>/api/calendar-events</code>"]:::apiNode
    RADAR_API["Circadian Radar API<br/><code>/api/circadian/radar</code>"]:::apiNode
    POSTGRES[("Supabase DB (calendar_events)")]:::storageNode
  end

  COMMAND --> CALENDAR
  CALENDAR --> DIAL
  DIAL --> SOLAR_ARC
  DIAL --> ORBITAL_HUD
  ORBITAL_HUD --> SUBTASKS
  CALENDAR <--> EVENTS_API
  EVENTS_API --> POSTGRES
  RADAR_API --> POSTGRES
  COPILOT --> VAULT
  COMMAND --> HORIZON
  HORIZON --> EPISTEMIC
  CLICKUP --> EVENTS_API`;
}

export function getWealthPortfolioMermaid(dir: "TD" | "LR" = "TD"): string {
  return `flowchart ${dir}
  %% Wealth & SaaS Portfolio Diagram
  classDef saasNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
  classDef futuresNode fill:#2d1b06,stroke:#f59e0b,stroke-width:2px,color:#fef3c7;
  classDef budgetNode fill:#06241b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;
  classDef pmsNode fill:#1f1338,stroke:#a855f7,stroke-width:2px,color:#f3e8ff;

  subgraph EQUIPSYNX["🚛 EQUIPSYNX COMMERCIAL FLEET & FIELD OS"]
    direction ${dir}
    ROLES["7 Role RBAC Engine<br/><code>Admin · Dispatch · Tech · Finance</code>"]:::saasNode
    DISPATCH["Live GPS Fleet Dispatch<br/><code>Asset Geofences & Tracking</code>"]:::saasNode
    ORDERS["Work Orders & Scheduling<br/><code>Job Dispatch & Status</code>"]:::saasNode
    POS["Digital POS & Invoicing<br/><code>Stripe & Quickbooks Sync</code>"]:::saasNode
    INVENTORY["Parts & Inventory Lifecycle<br/><code>Barcode & Depletion</code>"]:::saasNode
  end

  subgraph TRADING["📈 CALIBER ARC FUTURES ENGINE"]
    direction ${dir}
    COCKPIT["NQ/MNQ Execution Terminal<br/><code>/caliber-arc</code>"]:::futuresNode
    SCRUBBER["Trade Scrubber Telemetry<br/><code>Win Rate & Sharpe Ratio</code>"]:::futuresNode
    WATERFALL["PnL Waterfall & Risk Radar<br/><code>Drawdown Guards</code>"]:::futuresNode
  end

  subgraph CAPITAL["💰 CAPITAL ARCHITECT & GROWTH"]
    direction ${dir}
    BUDGET["12M Budget Ledger<br/><code>/budget</code>"]:::budgetNode
    SHIFTS["Shift Pay & Multi-Scenario<br/><code>Run-Rate Modeling</code>"]:::budgetNode
    MARKETING["Trend Scrubber Virality<br/><code>/marketing-agent</code>"]:::budgetNode
    EDUCATION["Education Academy Blueprint<br/><code>/education</code>"]:::budgetNode
    PMS["Sovereign ClickUp PMS<br/><code>/pms</code>"]:::pmsNode
  end

  ROLES --> DISPATCH
  DISPATCH --> ORDERS
  ORDERS --> POS
  ORDERS --> INVENTORY
  COCKPIT --> SCRUBBER
  SCRUBBER --> WATERFALL
  WATERFALL --> BUDGET
  POS --> BUDGET
  BUDGET --> SHIFTS
  MARKETING --> EQUIPSYNX
  PMS --> ORDERS`;
}

export function getHealthLifeMermaid(dir: "TD" | "LR" = "TD"): string {
  return `flowchart ${dir}
  %% Health, Mindset & Life Pillars Diagram
  classDef macroNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
  classDef titanNode fill:#2d1b06,stroke:#f59e0b,stroke-width:2px,color:#fef3c7;
  classDef famNode fill:#06241b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;
  classDef mindsetNode fill:#1f1338,stroke:#a855f7,stroke-width:2px,color:#f3e8ff;

  subgraph MACROS["🥗 MACRO OPS & NUTRITION ENGINE (1,700 kcal / 180g)"]
    direction ${dir}
    MACRO_HUD["Macro Ops Dashboard<br/><code>/macro-ops</code>"]:::macroNode
    PACING["Target Pacing & Ingestion<br/><code>1700 kcal · 180g Protein</code>"]:::macroNode
    HEATMAP["24h Kinetic & Nutrient Matrix<br/><code>Density & Pacing Heatmap</code>"]:::macroNode
    SITREP["SITREP Council & Debrief<br/><code>Daily Bio-Telemetry Review</code>"]:::macroNode
  end

  subgraph TITAN["🏋️ TITAN BODYBUILDING ENGINE"]
    direction ${dir}
    WORKOUTS["Titan Workouts Terminal<br/><code>/workouts</code>"]:::titanNode
    METRICS["Volume & Duration Cockpit<br/><code>Sets · Reps · Rest Timers</code>"]:::titanNode
    EQUIPMENT["Equipment & Intensity Radar<br/><code>Left Equipment · Right RPE</code>"]:::titanNode
    ROADMAP["Roadmap Workout Calendar<br/><code>Left-to-Right Progression</code>"]:::titanNode
  end

  subgraph COGNITIVE["🧘 MINDSET & RELATIONSHIPS"]
    direction ${dir}
    MINDSET["Mindset Counsel Anchors<br/><code>/mindset</code>"]:::mindsetNode
    PODS["His & Hers Shared Pods<br/><code>/pods</code>"]:::mindsetNode
  end

  subgraph FAMILY["🐕 5-WHEEL FAMILY & FLEET LOGISTICS"]
    direction ${dir}
    FAMILY_HUB["5-Wheel Family Hub<br/><code>/family-hub</code>"]:::famNode
    PETS["Nova, Astro & Comet Telemetry<br/><code>Walk Logs & Meds</code>"]:::famNode
    FLEET["Life Ops & Fleet Maintenance<br/><code>/life-ops</code>"]:::famNode
  end

  MACRO_HUD --> PACING
  PACING --> HEATMAP
  HEATMAP --> SITREP
  WORKOUTS --> METRICS
  METRICS --> EQUIPMENT
  EQUIPMENT --> ROADMAP
  WORKOUTS <--> PACING
  FAMILY_HUB --> PETS
  FLEET --> FAMILY_HUB
  MINDSET --> PODS`;
}

export const INITIAL_DIAGRAM_SPACES: DiagramSpace[] = [
  {
    id: "master",
    title: "Master System Topology",
    description: "High-level map of the entire Chairman ecosystem, Auth, APIs, Databases, and 5 Pillars.",
    badge: "Ecosystem",
    isDefault: true,
    direction: "TD",
    mermaidCode: getMasterTopologyMermaid("TD"),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "core",
    title: "Chairman Core & Circadian",
    description: "Command Center, 24H Solar Wheel, ClickUp Sync, Knowledge Vault, and Chronobiology.",
    badge: "Core OS",
    isDefault: true,
    direction: "TD",
    mermaidCode: getCoreEngineMermaid("TD"),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wealth",
    title: "Wealth & SaaS Portfolio",
    description: "EquipSynx 7-Role Dispatch, Caliber Arc Futures, 12M Budget Ledger, and Virality.",
    badge: "EquipSynx & Wealth",
    isDefault: true,
    direction: "TD",
    mermaidCode: getWealthPortfolioMermaid("TD"),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "health",
    title: "Health, Mindset & Life",
    description: "Macro Ops 1,700 kcal tracker, Titan Workouts, Mindset Counsel, and 5-Wheel Family Hub.",
    badge: "Bio & Life",
    isDefault: true,
    direction: "TD",
    mermaidCode: getHealthLifeMermaid("TD"),
    updatedAt: new Date().toISOString(),
  },
];
