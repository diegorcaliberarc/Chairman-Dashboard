"use client";

import {
  Bot,
  Brain,
  CalendarDays,
  Palette,
  Map,
  LayoutDashboard,
  Briefcase,
  User,
  CalendarRange,
  Archive,
  CheckCircle2,
  Activity,
  Utensils,
  TrendingUp,
  KanbanSquare,
  Dog,
  Users,
  Network,
  Wrench,
  Sunrise,
  ShieldAlert,
  Flame,
  PlugZap,
  GraduationCap,
  Wallet,
  Smartphone,
  Radar,
  Heart,
  CircleDollarSign,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Dumbbell,
  Database,
  Settings,
  Compass,
  GitBranch,
  Zap,
  HeartHandshake,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserAccountModal } from "./UserAccountModal";
import { useState, useEffect, useMemo } from "react";
import { AppearanceSettings } from "./AppearanceSettings";

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      setDate(n.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="select-none text-left">
      <div className="font-mono text-sm tracking-wider text-zinc-900 dark:text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{time}</div>
      <div className="text-[10px] tracking-wider mt-0.5 text-zinc-900 dark:text-white">{date}</div>
    </div>
  );
}

export type LifePillarFilter =
  | "all"
  | "operations"
  | "health"
  | "wealth"
  | "fam"
  | "happiness";

interface NavModuleItem {
  id: string;
  label: string;
  pillar: "operations" | "health" | "wealth" | "fam" | "happiness";
  icon: React.ReactNode;
  route: string;
  badge?: string;
  description: string;
}

const ALL_MODULE_ITEMS: NavModuleItem[] = [
  // Operations (Top-down strategy, home overview, PMS, roadmap, architecture, skills & artifacts)
  {
    id: "MASTER",
    label: "Home Dashboard",
    pillar: "operations",
    icon: <LayoutDashboard size={14} />,
    route: "/",
    description: "Customizable workspace overview",
  },
  {
    id: "COMMAND",
    label: "Operations & Strategy",
    pillar: "operations",
    icon: <Compass size={14} />,
    route: "/command",
    badge: "Ops",
    description: "Goals, priorities & weekly plans",
  },
  {
    id: "PMS",
    label: "Project Management",
    pillar: "operations",
    icon: <KanbanSquare size={14} />,
    route: "/pms",
    description: "Projects, tasks & sprints",
  },
  {
    id: "ROADMAPS",
    label: "Strategic Roadmap",
    pillar: "operations",
    icon: <GitBranch size={14} />,
    route: "/roadmaps",
    description: "Multi-branch plans & milestones",
  },
  {
    id: "ORG_CHART",
    label: "Architecture Map",
    pillar: "operations",
    icon: <Network size={14} />,
    route: "/org-chart",
    description: "Master planning & whiteboard",
  },
  {
    id: "HORIZON",
    label: "Horizon & Zoom",
    pillar: "operations",
    icon: <Sunrise size={14} />,
    route: "/horizon",
    description: "Multi-horizon focus & altitude",
  },
  {
    id: "LIFE_OPS",
    label: "Life Operations",
    pillar: "operations",
    icon: <Wrench size={14} />,
    route: "/life-ops",
    description: "Systems, routines & maintenance",
  },
  {
    id: "SKILLS",
    label: "Skills",
    pillar: "operations",
    icon: <Zap size={14} />,
    route: "/skills",
    badge: "AI",
    description: "Reusable workflows & team skills",
  },
  {
    id: "ARTIFACTS",
    label: "Artifacts",
    pillar: "operations",
    icon: <Sparkles size={14} />,
    route: "/artifacts",
    badge: "Build",
    description: "Apps, dashboards, slides & reports",
  },

  // Health (Workouts, Nutrition, Circadian Solar, Mindset)
  {
    id: "WORKOUTS",
    label: "Strength & Training",
    pillar: "health",
    icon: <Dumbbell size={14} />,
    route: "/workouts",
    description: "Progressive overload & rest timers",
  },
  {
    id: "MACRO_OPS",
    label: "Nutrition & Hydration",
    pillar: "health",
    icon: <Utensils size={14} />,
    route: "/macro-ops",
    description: "Voice food log, macros & water",
  },
  {
    id: "CALENDAR_HABITS",
    label: "Circadian Solar",
    pillar: "health",
    icon: <CalendarRange size={14} />,
    route: "/calendar",
    description: "2400 solar dial & synced calendar",
  },
  {
    id: "MINDSET",
    label: "Mindset & Clarity",
    pillar: "health",
    icon: <Flame size={14} />,
    route: "/mindset",
    description: "Cognitive framing & reflection",
  },

  // Wealth (Budget, Caliber Arc, Trend Intelligence)
  {
    id: "BUDGET",
    label: "Budget & Shift Ledger",
    pillar: "wealth",
    icon: <Wallet size={14} />,
    route: "/budget",
    description: "12-month cashflow & shifts",
  },
  {
    id: "CALIBER_ARC",
    label: "Caliber Arc",
    pillar: "wealth",
    icon: <TrendingUp size={14} />,
    route: "/caliber-arc",
    description: "Trading journal & execution",
  },
  {
    id: "MARKETING_AGENT",
    label: "Trend Intelligence",
    pillar: "wealth",
    icon: <Radar size={14} />,
    route: "/marketing-agent",
    description: "Market signals & growth research",
  },
  {
    id: "EDUCATION",
    label: "Learning Academy",
    pillar: "wealth",
    icon: <GraduationCap size={14} />,
    route: "/education",
    description: "Curriculum, mastery & wealth skills",
  },

  // Family (His & Hers Pods + Family Hub)
  {
    id: "PODS",
    label: "His & Hers Pods",
    pillar: "fam",
    icon: <Users size={14} />,
    route: "/pods",
    description: "Shared goals & connection",
  },
  {
    id: "FAMILY_HUB",
    label: "Family Hub",
    pillar: "fam",
    icon: <Dog size={14} />,
    route: "/family-hub",
    description: "Household & pack schedules",
  },
];

const SETTINGS_NAV_ITEMS = [
  { label: "Codebase Infrastructure Diagrams", route: "/codebase-diagrams", icon: <Network size={13} /> },
  { label: "Epistemic Matrix", route: "/epistemic", icon: <ShieldAlert size={13} /> },
  { label: "Integrations & Console", route: "/integrations", icon: <PlugZap size={13} /> },
  { label: "Resources & Guides", route: "/resources", icon: <Database size={13} /> },
  { label: "Knowledge Vault", route: "/vault", icon: <Archive size={13} /> },
];

const PILLARS_CONFIG: Array<{
  id: LifePillarFilter;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: "all",
    label: "All",
    shortLabel: "All",
    icon: <Layers size={16} />,
    color: "var(--theme-grad-start, #4984fd)",
  },
  {
    id: "operations",
    label: "Operations",
    shortLabel: "Ops",
    icon: <Compass size={16} />,
    color: "#4984fd",
  },
  {
    id: "health",
    label: "Health",
    shortLabel: "Health",
    icon: <Activity size={16} />,
    color: "#10B981",
  },
  {
    id: "wealth",
    label: "Wealth",
    shortLabel: "Wealth",
    icon: <CircleDollarSign size={16} />,
    color: "#F59E0B",
  },
  {
    id: "fam",
    label: "Family",
    shortLabel: "Family",
    icon: <Heart size={16} />,
    color: "#EC4899",
  },
  {
    id: "happiness",
    label: "Happiness",
    shortLabel: "Joy",
    icon: <Sparkles size={16} />,
    color: "#8B5CF6",
  },
];

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  calConnected?: boolean;
  onCalToggle?: () => void;
  isAppearanceOpen?: boolean;
  setIsAppearanceOpen?: (open: boolean) => void;
  user?: any;
  deepWork?: boolean;
  setDeepWork?: (val: boolean | ((p: boolean) => boolean)) => void;
  activeTasksCount?: number;
  activeSubtasksCount?: number;
  tasksLoading?: boolean;
}

export function Sidebar({
  activeTab = "overview",
  setActiveTab = () => {},
  calConnected = false,
  onCalToggle = () => {},
  isAppearanceOpen = false,
  setIsAppearanceOpen = () => {},
  user = null,
  deepWork = false,
  setDeepWork = () => {},
  activeTasksCount = 0,
  activeSubtasksCount = 0,
  tasksLoading = false,
}: SidebarProps) {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [dbCalConnected, setDbCalConnected] = useState(false);

  useEffect(() => {
    fetch("/api/calendar/google-sync")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.connected) setDbCalConnected(true);
      })
      .catch(() => {});
  }, []);

  const effectiveUser = {
    name: user?.name || session?.user?.name || "Diego Rodriguez",
    email: user?.email || session?.user?.email || "diegoforodriguez@gmail.com",
    image: user?.image || session?.user?.image || null,
  };
  const effectiveCalConnected = calConnected || dbCalConnected || Boolean((session as any)?.accessToken);

  // Two Collapsible Columns State (persisted in localStorage)
  const [col1Collapsed, setCol1Collapsed] = useState(false);
  const [col2Collapsed, setCol2Collapsed] = useState(false);
  const [activePillar, setActivePillar] = useState<LifePillarFilter>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const c1 = localStorage.getItem("sidebar-col1-collapsed");
      if (c1 !== null) setCol1Collapsed(c1 === "true");
      const c2 = localStorage.getItem("sidebar-col2-collapsed");
      if (c2 !== null) setCol2Collapsed(c2 === "true");
      const p = localStorage.getItem("sidebar-active-pillar");
      if (p) setActivePillar(p as LifePillarFilter);
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCol1 = () => {
    setCol1Collapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-col1-collapsed", String(next));
      return next;
    });
  };

  const handleToggleCol2 = () => {
    setCol2Collapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-col2-collapsed", String(next));
      return next;
    });
  };

  const handleSelectPillar = (p: LifePillarFilter) => {
    setActivePillar(p);
    localStorage.setItem("sidebar-active-pillar", p);
    if (col2Collapsed) {
      setCol2Collapsed(false);
      localStorage.setItem("sidebar-col2-collapsed", "false");
    }
  };

  useEffect(() => {
    const handleToggle = () => setNovaOpen((p) => !p);
    window.addEventListener("toggleNovaCore", handleToggle);
    return () => window.removeEventListener("toggleNovaCore", handleToggle);
  }, []);

  // Global Quick-Action Shortcut (Cmd+Shift+M / Ctrl+Shift+M) -> Mindset Massage
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        router.push("/mindset");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  // Drag & Drop customizable module order + sphere assignment (persisted in localStorage)
  const [moduleLayout, setModuleLayout] = useState<
    Array<{ id: string; pillar: NavModuleItem["pillar"] }>
  >(() => ALL_MODULE_ITEMS.map((m) => ({ id: m.id, pillar: m.pillar })));
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [dragOverPillar, setDragOverPillar] = useState<LifePillarFilter | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chairman-sidebar-layout-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Array<{ id: string; pillar: NavModuleItem["pillar"] }>;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = new Set(ALL_MODULE_ITEMS.map((m) => m.id));
          const merged = parsed.filter((p) => validIds.has(p.id));
          const existingIds = new Set(merged.map((p) => p.id));
          for (const m of ALL_MODULE_ITEMS) {
            if (!existingIds.has(m.id)) merged.push({ id: m.id, pillar: m.pillar });
          }
          setModuleLayout(merged);
        }
      }
    } catch {}
  }, []);

  const persistLayout = (next: Array<{ id: string; pillar: NavModuleItem["pillar"] }>) => {
    setModuleLayout(next);
    try {
      localStorage.setItem("chairman-sidebar-layout-v1", JSON.stringify(next));
    } catch {}
  };

  const handleDropOnPillar = (targetPillar: LifePillarFilter) => {
    if (!draggedModuleId || targetPillar === "all") {
      setDraggedModuleId(null);
      setDragOverPillar(null);
      return;
    }
    const next = moduleLayout.map((entry) =>
      entry.id === draggedModuleId ? { ...entry, pillar: targetPillar } : entry
    );
    persistLayout(next);
    setDraggedModuleId(null);
    setDragOverPillar(null);
  };

  const handleDropOnModule = (targetId: string) => {
    if (!draggedModuleId || draggedModuleId === targetId) {
      setDraggedModuleId(null);
      return;
    }
    const next = [...moduleLayout];
    const fromIdx = next.findIndex((x) => x.id === draggedModuleId);
    const toIdx = next.findIndex((x) => x.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    persistLayout(next);
    setDraggedModuleId(null);
  };

  // Filtered module items for Column 2 based on Column 1 selection & custom order
  const filteredModules = useMemo(() => {
    const byId: Record<string, NavModuleItem> = {};
    for (const m of ALL_MODULE_ITEMS) byId[m.id] = m;
    const ordered = moduleLayout
      .map((entry) => {
        const base = byId[entry.id];
        return base ? { ...base, pillar: entry.pillar } : null;
      })
      .filter(Boolean) as NavModuleItem[];
    if (activePillar === "all") return ordered;
    return ordered.filter((item) => item.pillar === activePillar);
  }, [activePillar, moduleLayout]);

  // Active pillar metadata
  const currentPillarMeta = useMemo(() => {
    return PILLARS_CONFIG.find((p) => p.id === activePillar) ?? PILLARS_CONFIG[0];
  }, [activePillar]);

  return (
    <>
      {/* Mobile Top Navigation Bar (iPhone & Android Viewports) */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-14 backdrop-blur-xl border-b z-40 flex items-center justify-between px-4"
        style={{
          backgroundColor: "var(--glass-surface-elevated)",
          borderColor: "var(--glass-border)",
          color: "var(--glass-text-primary)",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileMenuOpen((p) => !p)}
          className="p-2 rounded-[12px] border transition-colors flex items-center gap-2"
          style={{
            backgroundColor: "var(--glass-surface)",
            borderColor: "var(--glass-border)",
            color: "var(--glass-text-primary)",
          }}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span className="text-[13px] font-medium tracking-[-0.13px]">
            {currentPillarMeta.label}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4984fd]" />
          <span className="text-[14px] font-medium tracking-[-0.13px]">
            Chairman Dashboard
          </span>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#1c1d22]/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Dual-Column Sidebar: Sticky Full-Height Desktop Rail (Never Cuts Off on Scroll!) */}
      <aside
        className={`fixed lg:sticky left-0 top-0 h-screen shrink-0 flex flex-row border-r z-50 lg:z-30 transition-all duration-300 backdrop-blur-xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          backgroundColor: "var(--glass-surface-elevated)",
          borderColor: "var(--glass-border)",
          color: "var(--glass-text-primary)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        {/* ====================================================================
         * COLUMN 1: CLICKUP-STYLE ICON RAIL (Icon on Top + Label Below, No Numbers)
         * ================================================================== */}
        <div
          className="h-full w-[68px] flex flex-col items-center border-r py-3 gap-1.5 shrink-0"
          style={{
            backgroundColor: "var(--glass-surface)",
            borderColor: "var(--glass-border)",
          }}
        >
          {/* Brand Emblem */}
          <button
            type="button"
            data-testid="nav-home-emblem"
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 border transition-transform hover:scale-105"
            style={{
              backgroundColor: "rgba(73, 132, 253, 0.14)",
              borderColor: "rgba(73, 132, 253, 0.4)",
              color: "#4984fd",
            }}
            title="Home Dashboard"
          >
            <Compass size={17} />
          </button>

          {/* Life Spheres Icon-Top Navigation (Also Drop Targets for Dragging Modules!) */}
          <div className="flex flex-col items-center gap-1.5 flex-1 w-full px-1.5 overflow-y-auto">
            {PILLARS_CONFIG.map((p) => {
              const isSelected = activePillar === p.id;
              const isDropHover = dragOverPillar === p.id && p.id !== "all";
              return (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`nav-sphere-${p.id}`}
                  onClick={() => handleSelectPillar(p.id)}
                  onDragOver={(e) => {
                    if (p.id !== "all") {
                      e.preventDefault();
                      setDragOverPillar(p.id);
                    }
                  }}
                  onDragLeave={() => setDragOverPillar(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnPillar(p.id);
                  }}
                  className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${
                    isSelected ? "sidebar-active-pulse" : ""
                  }`}
                  style={{
                    borderColor: isDropHover
                      ? "#4984fd"
                      : isSelected
                      ? "rgba(73, 132, 253, 0.45)"
                      : "transparent",
                    backgroundColor: isDropHover
                      ? "rgba(73, 132, 253, 0.22)"
                      : isSelected
                      ? "rgba(73, 132, 253, 0.14)"
                      : "transparent",
                    color: isSelected ? "var(--glass-text-primary)" : "var(--glass-text-muted)",
                  }}
                  title={`${p.label} — drop a module here to move it`}
                >
                  <span style={{ color: isSelected ? "#4984fd" : p.color }}>
                    {p.icon}
                  </span>
                  <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                    {p.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ====================================================================
         * COLUMN 2: PILLAR MODULES & SYSTEMS (Compact Width)
         * ================================================================== */}
        <div
          className={`h-full flex flex-col relative transition-all duration-300 ${
            col2Collapsed ? "w-14" : "w-52"
          }`}
        >
          {/* Brand / Header & Col 2 Toggle */}
          <div className="px-4 py-3.5 border-b border-zinc-200/50 dark:border-white/10 flex items-center justify-between gap-2">
            {!col2Collapsed ? (
              <div className="min-w-0 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentPillarMeta.color }}
                />
                <div className="min-w-0">
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {currentPillarMeta.label}
                  </h2>
                  <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate">
                    {filteredModules.length} Modules Online
                  </p>
                </div>
              </div>
            ) : (
              <span
                className="w-3 h-3 rounded-full mx-auto"
                style={{ backgroundColor: currentPillarMeta.color }}
              />
            )}

            <button
              type="button"
              onClick={handleToggleCol2}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors shrink-0"
              title={col2Collapsed ? "Expand Modules Column" : "Collapse Modules Column"}
            >
              <PanelLeft
                size={14}
                className={`transition-transform duration-200 ${
                  col2Collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Module Links List */}
          <div className="flex flex-col gap-1 p-2.5 flex-1 overflow-y-auto">
            {filteredModules.map((item) => {
              const isActive =
                item.route === "/"
                  ? pathname === "/" && activeTab === item.id
                  : pathname === item.route;

              return (
                <button
                  key={item.id}
                  data-testid={`nav-module-${item.id}`}
                  draggable
                  onDragStart={() => setDraggedModuleId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnModule(item.id);
                  }}
                  onDragEnd={() => {
                    setDraggedModuleId(null);
                    setDragOverPillar(null);
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.route === pathname) {
                      if (item.route === "/") setActiveTab(item.id);
                    } else {
                      if (item.route === "/") setActiveTab(item.id);
                      router.push(item.route);
                    }
                  }}
                  className={`flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-xl text-left transition-all border cursor-grab active:cursor-grabbing ${
                    isActive ? "sidebar-active-pulse" : ""
                  }`}
                  style={{
                    borderColor: isActive ? "rgba(73, 132, 253, 0.48)" : "transparent",
                    backgroundColor: isActive ? "rgba(73, 132, 253, 0.12)" : "transparent",
                    color: isActive ? "var(--glass-text-primary)" : "var(--glass-text-muted)",
                    opacity: draggedModuleId === item.id ? 0.5 : 1,
                  }}
                  title={`${item.label} — drag to reorder or drop onto a sphere`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0"
                      style={{
                        color: isActive ? "var(--theme-grad-start, #4984fd)" : "var(--glass-text-muted)",
                      }}
                    >
                      {item.icon}
                    </span>
                    {!col2Collapsed && (
                      <div className="min-w-0 truncate">
                        <div
                          className="text-[11.5px] font-medium truncate"
                          style={{ color: "var(--glass-text-primary)" }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="text-[9.5px] truncate"
                          style={{ color: "var(--glass-text-muted)" }}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {!col2Collapsed && item.badge && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-400 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Footer User Profile & Execution Settings */}
          <div className="mt-auto p-2.5 border-t border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 flex items-center justify-between gap-1.5 h-14">
            <button
              type="button"
              data-testid="nav-avatar-menu-trigger"
              onClick={() => setSettingsMenuOpen((p) => !p)}
              className="relative flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#4984fd]/50 transition-all shrink-0"
              title="Account, Settings & Google Calendar"
            >
              {effectiveUser?.image ? (
                <img
                  src={effectiveUser.image}
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#4984fd]/50 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#4984fd]/20 border border-[#4984fd]/40 flex items-center justify-center text-[#4984fd] text-xs font-medium shrink-0">
                  {(effectiveUser?.name ?? "D")[0].toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                  effectiveCalConnected ? "bg-emerald-400" : "bg-amber-400"
                }`}
                style={{ borderColor: "var(--glass-surface-elevated)" }}
              />
            </button>

            {/* Unified Account, Google Calendar & Settings Popover */}
            {settingsMenuOpen && (
              <div
                data-testid="nav-settings-popover"
                className="absolute bottom-16 left-2 right-2 rounded-xl border p-2 z-50 space-y-1 backdrop-blur-xl"
                style={{
                  backgroundColor: "var(--glass-surface-elevated)",
                  borderColor: "var(--glass-border)",
                  boxShadow: "var(--glass-shadow)",
                  color: "var(--glass-text-primary)",
                }}
              >
                <div
                  className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider border-b mb-1 flex items-center justify-between"
                  style={{
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-muted)",
                  }}
                >
                  <span>Settings &amp; Connections</span>
                  <button
                    type="button"
                    onClick={() => setSettingsMenuOpen(false)}
                    className="opacity-70 hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Merged Google Calendar Live Connection */}
                <button
                  type="button"
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    onCalToggle();
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium text-left hover:bg-[#4984fd]/10 transition-colors"
                  style={{ color: "var(--glass-text-primary)" }}
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays size={13} className="text-[#4984fd]" />
                    <span>{effectiveCalConnected ? "Google Calendar Live" : "Connect Google Calendar"}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveCalConnected ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                </button>

                {SETTINGS_NAV_ITEMS.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    data-testid={`nav-settings-link-${item.route.replace(/\//g, "")}`}
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      router.push(item.route);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium text-left hover:bg-[#4984fd]/10 transition-colors"
                    style={{ color: "var(--glass-text-primary)" }}
                  >
                    <span className="text-[#4984fd]">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    setAccountModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium text-left border-t mt-1 pt-2 hover:bg-[#4984fd]/10 transition-colors"
                  style={{
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-primary)",
                  }}
                >
                  <User size={13} className="text-[#4984fd]" />
                  <span>Account &amp; Profile</span>
                </button>
              </div>
            )}

            {/* Single Global Theme & Appearance Trigger (ONLY place to change theme) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-testid="nav-theme-palette-trigger"
                onClick={() => setIsAppearanceOpen(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-transparent hover:border-[#4984fd]/40 hover:bg-[#4984fd]/10 transition-all"
                style={{ color: "var(--glass-text-primary)" }}
                title="Appearance, Fonts & Themes"
              >
                <Palette size={15} className="text-[#4984fd]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {accountModalOpen && (
        <UserAccountModal
          user={effectiveUser}
          calConnected={effectiveCalConnected}
          onCalToggle={onCalToggle}
          activeTasksCount={activeTasksCount}
          activeSubtasksCount={activeSubtasksCount}
          onClose={() => setAccountModalOpen(false)}
        />
      )}
      {isAppearanceOpen && (
        <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />
      )}
    </>
  );
}
