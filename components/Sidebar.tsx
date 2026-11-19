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
  | "health"
  | "wealth"
  | "relationships"
  | "fam"
  | "happiness";

interface NavModuleItem {
  id: string;
  label: string;
  pillar: "health" | "wealth" | "relationships" | "fam" | "happiness" | "all";
  icon: React.ReactNode;
  route: string;
  badge?: string;
  description: string;
}

const ALL_MODULE_ITEMS: NavModuleItem[] = [
  // Operations & Planning Hub (Consolidated: Command, PMS, Roadmap, Topology, Vault, Horizon, Life Ops, Academy)
  {
    id: "COMMAND",
    label: "Operations & Strategy",
    pillar: "all",
    icon: <Compass size={14} />,
    route: "/command",
    badge: "Hub",
    description: "Goals, priorities, vault, horizon & academy",
  },
  {
    id: "PMS",
    label: "Project Management",
    pillar: "all",
    icon: <KanbanSquare size={14} />,
    route: "/pms",
    description: "Projects, tasks & sprint execution",
  },
  {
    id: "ROADMAPS",
    label: "Strategic Roadmap",
    pillar: "all",
    icon: <GitBranch size={14} />,
    route: "/roadmaps",
    badge: "Plan",
    description: "Multi-branch goals & milestone dependencies",
  },
  {
    id: "ORG_CHART",
    label: "Architecture Map",
    pillar: "all",
    icon: <Network size={14} />,
    route: "/org-chart",
    description: "System topology & visual diagrams",
  },

  // Health Hub (Workouts + Nutrition + Circadian Solar)
  {
    id: "WORKOUTS",
    label: "Strength & Training",
    pillar: "health",
    icon: <Dumbbell size={14} />,
    route: "/workouts",
    badge: "Gym",
    description: "Progressive overload, sets & rest timers",
  },
  {
    id: "MACRO_OPS",
    label: "Nutrition & Hydration",
    pillar: "health",
    icon: <Utensils size={14} />,
    route: "/macro-ops",
    badge: "Fuel",
    description: "Voice food log, macros & water intake",
  },
  {
    id: "CALENDAR_HABITS",
    label: "Circadian Solar",
    pillar: "health",
    icon: <CalendarRange size={14} />,
    route: "/calendar",
    badge: "24H",
    description: "24-hour rhythm & synced calendar",
  },

  // Wealth Hub (Budget + Caliber Arc)
  {
    id: "BUDGET",
    label: "Budget & Shift Ledger",
    pillar: "wealth",
    icon: <Wallet size={14} />,
    route: "/budget",
    badge: "$",
    description: "12-month cashflow & shift tracking",
  },
  {
    id: "CALIBER_ARC",
    label: "Caliber Arc",
    pillar: "wealth",
    icon: <TrendingUp size={14} />,
    route: "/caliber-arc",
    badge: "Markets",
    description: "Trading journal & execution review",
  },

  // Relationships (Decoupled from Operations)
  {
    id: "PODS",
    label: "His & Hers Pods",
    pillar: "relationships",
    icon: <Users size={14} />,
    route: "/pods",
    badge: "Shared",
    description: "Shared goals, bucket list & connection",
  },
  {
    id: "MINDSET",
    label: "Mindset & Clarity",
    pillar: "relationships",
    icon: <Flame size={14} />,
    route: "/mindset",
    badge: "⌘⇧M",
    description: "Cognitive framing & daily reflection",
  },

  // Family
  {
    id: "FAMILY_HUB",
    label: "Family Hub",
    pillar: "fam",
    icon: <Dog size={14} />,
    route: "/family-hub",
    badge: "Pack",
    description: "Household & pack care schedules",
  },

  // Joy
  {
    id: "MASTER",
    label: "Home Overview",
    pillar: "happiness",
    icon: <LayoutDashboard size={14} />,
    route: "/",
    description: "Daily focus & calm overview",
  },
  {
    id: "MARKETING_AGENT",
    label: "Trend Intelligence",
    pillar: "happiness",
    icon: <Radar size={14} />,
    route: "/marketing-agent",
    badge: "Research",
    description: "Market signals & creative insights",
  },
];

const SETTINGS_NAV_ITEMS = [
  { label: "Epistemic Matrix", route: "/epistemic", icon: <ShieldAlert size={13} /> },
  { label: "Integrations & Console", route: "/integrations", icon: <PlugZap size={13} /> },
  { label: "Resources & Guides", route: "/resources", icon: <Database size={13} /> },
  { label: "Knowledge Vault", route: "/vault", icon: <Archive size={13} /> },
  { label: "Horizon & Zoom", route: "/horizon", icon: <Sunrise size={13} /> },
  { label: "Life Operations", route: "/life-ops", icon: <Wrench size={13} /> },
  { label: "Learning Academy", route: "/education", icon: <GraduationCap size={13} /> },
];

const PILLARS_CONFIG: Array<{
  id: LifePillarFilter;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}> = [
  {
    id: "all",
    label: "All Spheres",
    shortLabel: "All",
    icon: <Layers size={13} />,
    color: "var(--theme-grad-start, #4984fd)",
    count: ALL_MODULE_ITEMS.length,
  },
  {
    id: "health",
    label: "Health",
    shortLabel: "Health",
    icon: <Activity size={13} />,
    color: "#10B981",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "health").length,
  },
  {
    id: "wealth",
    label: "Wealth",
    shortLabel: "Wealth",
    icon: <CircleDollarSign size={13} />,
    color: "#F59E0B",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "wealth").length,
  },
  {
    id: "relationships",
    label: "Relationships",
    shortLabel: "Relationships",
    icon: <Users size={13} />,
    color: "#4984fd",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "relationships").length,
  },
  {
    id: "fam",
    label: "Family",
    shortLabel: "Family",
    icon: <Dog size={13} />,
    color: "#EC4899",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "fam").length,
  },
  {
    id: "happiness",
    label: "Joy",
    shortLabel: "Joy",
    icon: <Sparkles size={13} />,
    color: "#8B5CF6",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "happiness").length,
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

  // Filtered module items for Column 2 based on Column 1 selection
  const filteredModules = useMemo(() => {
    if (activePillar === "all") return ALL_MODULE_ITEMS;
    return ALL_MODULE_ITEMS.filter((item) => item.pillar === activePillar);
  }, [activePillar]);

  // Active pillar metadata
  const currentPillarMeta = useMemo(() => {
    return PILLARS_CONFIG.find((p) => p.id === activePillar) ?? PILLARS_CONFIG[0];
  }, [activePillar]);

  return (
    <>
      {/* Mobile Top Navigation Bar (iPhone & Android Viewports) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#ffffff]/90 backdrop-blur-xl border-b border-[#d1d6e0] z-40 flex items-center justify-between px-4 text-[#000000]">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((p) => !p)}
          className="p-2 rounded-[12px] bg-[#f9fafb] hover:bg-[#dde2ee]/60 border border-[#d1d6e0] text-[#000000] transition-colors flex items-center gap-2"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span className="text-[13px] font-medium tracking-[-0.13px] text-[#000000]">
            {currentPillarMeta.label}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4984fd]" />
          <span className="text-[14px] font-medium tracking-[-0.13px] text-[#000000]">
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

      {/* Main Dual-Column Sidebar: Slide-over Drawer on Mobile, Compact Theme-Adaptive Rail on Desktop */}
      <aside
        className={`fixed lg:relative left-0 top-0 h-screen shrink-0 flex flex-row border-r z-50 lg:z-30 transition-all duration-300 backdrop-blur-xl ${
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
         * COLUMN 1: LIFE SPHERES (Compact Width)
         * ================================================================== */}
        <div
          className={`h-full flex flex-col border-r transition-all duration-300 ${
            col1Collapsed ? "w-14" : "w-36"
          }`}
          style={{
            backgroundColor: "var(--glass-surface)",
            borderColor: "var(--glass-border)",
          }}
        >
          {/* Brand Header & Col 1 Collapse Toggle */}
          <div className="px-3 py-3.5 border-b border-zinc-200/50 dark:border-white/10 flex items-center justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <Map size={16} className="text-[color:var(--theme-grad-start)] shrink-0" />
              {!col1Collapsed && (
                <span
                  className="font-bold text-xs truncate bg-theme-gradient bg-clip-text text-transparent"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Pillars
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleCol1}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors shrink-0"
              title={col1Collapsed ? "Expand Pillars Column" : "Collapse Pillars Column"}
            >
              <PanelLeftClose
                size={14}
                className={`transition-transform duration-200 ${
                  col1Collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Pillars List */}
          <div className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
            {!col1Collapsed && (
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-zinc-500 dark:text-zinc-500 px-2 py-1">
                Life Spheres
              </div>
            )}

            {PILLARS_CONFIG.map((p) => {
              const isSelected = activePillar === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPillar(p.id)}
                  className="flex items-center justify-between gap-2 px-2 py-2 rounded-xl text-left transition-all border"
                  style={{
                    borderColor: isSelected ? "rgba(73, 132, 253, 0.45)" : "transparent",
                    backgroundColor: isSelected ? "rgba(73, 132, 253, 0.12)" : "transparent",
                    color: isSelected ? "var(--glass-text-primary)" : "var(--glass-text-muted)",
                  }}
                  title={`${p.label} (${p.count} modules)`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 p-1 rounded-lg border"
                      style={{
                        color: p.color,
                        borderColor: `${p.color}35`,
                        backgroundColor: `${p.color}12`,
                      }}
                    >
                      {p.icon}
                    </span>
                    {!col1Collapsed && (
                      <span
                        className="text-[11.5px] font-medium truncate"
                        style={{
                          color: isSelected ? "var(--glass-text-primary)" : "var(--glass-text-muted)",
                        }}
                      >
                        {p.shortLabel}
                      </span>
                    )}
                  </div>
                  {!col1Collapsed && (
                    <span
                      className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-md font-semibold shrink-0"
                      style={{
                        color: p.color,
                        backgroundColor: `${p.color}18`,
                      }}
                    >
                      {p.count}
                    </span>
                  )}
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
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.route === pathname) {
                      if (item.route === "/") setActiveTab(item.id);
                    } else {
                      if (item.route === "/") setActiveTab(item.id);
                      router.push(item.route);
                    }
                  }}
                  className="flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-xl text-left transition-all border"
                  style={{
                    borderColor: isActive ? "rgba(73, 132, 253, 0.48)" : "transparent",
                    backgroundColor: isActive ? "rgba(73, 132, 253, 0.12)" : "transparent",
                    color: isActive ? "var(--glass-text-primary)" : "var(--glass-text-muted)",
                  }}
                  title={item.label}
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
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-2 flex-1 min-w-0 p-1 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors text-left"
              title="Execution & Account Settings"
            >
              {effectiveUser?.image ? (
                <img src={effectiveUser.image} alt="User" className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#0969DA]/40 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#0969DA]/20 border border-[#0969DA]/40 flex items-center justify-center text-[#58A6FF] text-xs font-bold shrink-0">
                  {(effectiveUser?.name ?? "D")[0].toUpperCase()}
                </div>
              )}
              {!col2Collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {effectiveUser?.name?.split(" ")[0] ?? "Diego"}
                  </div>
                  <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{effectiveCalConnected ? "Google Connected" : "Online"}</span>
                  </div>
                </div>
              )}
            </button>

            {/* Settings & System Modules Popover */}
            {settingsMenuOpen && (
              <div
                className="absolute bottom-16 left-2 right-2 rounded-xl border p-2 z-50 space-y-1 backdrop-blur-xl"
                style={{
                  backgroundColor: "var(--glass-surface-elevated)",
                  borderColor: "var(--glass-border)",
                  boxShadow: "var(--glass-shadow)",
                  color: "var(--glass-text-primary)",
                }}
              >
                <div
                  className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider border-b mb-1"
                  style={{
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-muted)",
                  }}
                >
                  Settings &amp; System Tools
                </div>
                {SETTINGS_NAV_ITEMS.map((item) => (
                  <button
                    key={item.route}
                    type="button"
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

            {/* Actions: Settings Gear + Calendar + Palette */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSettingsMenuOpen((p) => !p)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-transparent hover:border-[#4984fd]/30 transition-all"
                style={{
                  color: settingsMenuOpen ? "#4984fd" : "var(--glass-text-muted)",
                  backgroundColor: settingsMenuOpen ? "rgba(73, 132, 253, 0.12)" : "transparent",
                }}
                title="Settings, Epistemic Matrix, Integrations & Resources"
              >
                <Settings size={15} />
              </button>

              <button
                onClick={onCalToggle}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  effectiveCalConnected
                    ? "text-[#58A6FF] bg-[#0969DA]/15 border border-[#0969DA]/30"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10"
                }`}
                title={effectiveCalConnected ? "Google Calendar Live" : "Connect Google Calendar"}
              >
                <CalendarDays size={15} />
              </button>

              <button
                onClick={() => setIsAppearanceOpen(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors"
                title="Appearance, Fonts & Themes"
              >
                <Palette size={15} />
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
