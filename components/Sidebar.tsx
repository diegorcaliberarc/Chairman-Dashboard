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
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
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
  // Health
  {
    id: "WORKOUTS",
    label: "TITAN WORKOUTS",
    pillar: "health",
    icon: <Dumbbell size={15} />,
    route: "/workouts",
    badge: "Gym",
    description: "Bodybuilding logger, sets, rest timer & 1RM",
  },
  {
    id: "CALENDAR_HABITS",
    label: "CIRCADIAN SOLAR ARC",
    pillar: "health",
    icon: <CalendarRange size={15} />,
    route: "/calendar",
    badge: "24H",
    description: "24-Hour solar calendar & time-lapse wheel",
  },
  {
    id: "MACRO_OPS",
    label: "MACRO OPS",
    pillar: "health",
    icon: <Utensils size={15} />,
    route: "/macro-ops",
    badge: "Nutrition",
    description: "Portion weighing & metabolic curves",
  },

  // Wealth
  {
    id: "CALIBER_ARC",
    label: "CALIBER ARC",
    pillar: "wealth",
    icon: <TrendingUp size={15} />,
    route: "/caliber-arc",
    badge: "Futures",
    description: "Futures trading cockpit & execution review",
  },
  {
    id: "BUDGET",
    label: "12M BUDGET LEDGER",
    pillar: "wealth",
    icon: <Wallet size={15} />,
    route: "/budget",
    badge: "$",
    description: "Connected 12-month budget & shift pay",
  },
  {
    id: "MARKETING_AGENT",
    label: "TREND SCRUBBER",
    pillar: "wealth",
    icon: <Radar size={15} />,
    route: "/marketing-agent",
    badge: "AI",
    description: "Viral marketing & gaming ideas",
  },
  {
    id: "EDUCATION",
    label: "EDUCATION ACADEMY",
    pillar: "wealth",
    icon: <GraduationCap size={15} />,
    route: "/education",
    badge: "XP",
    description: "Systems Architecture master blueprint",
  },
  {
    id: "PMS",
    label: "SOVEREIGN PMS",
    pillar: "wealth",
    icon: <KanbanSquare size={15} />,
    route: "/pms",
    description: "ClickUp PMS & sprint velocity",
  },

  // Relationships
  {
    id: "PODS",
    label: "HIS & HERS PODS",
    pillar: "relationships",
    icon: <Users size={15} />,
    route: "/pods",
    badge: "Shared",
    description: "Shared goals, bucket list & connection",
  },
  {
    id: "MINDSET",
    label: "MINDSET COUNSEL",
    pillar: "relationships",
    icon: <Flame size={15} />,
    route: "/mindset",
    badge: "⌘⇧M",
    description: "Cognitive frame & anchor counsel",
  },

  // Fam
  {
    id: "FAMILY_HUB",
    label: "5-WHEEL FAMILY HUB",
    pillar: "fam",
    icon: <Dog size={15} />,
    route: "/family-hub",
    badge: "Dogs",
    description: "Nova, Astro & Comet recovery telemetry",
  },
  {
    id: "LIFE_OPS",
    label: "LIFE OPS & FLEET",
    pillar: "fam",
    icon: <Wrench size={15} />,
    route: "/life-ops",
    description: "Maintenance protocols & home logistics",
  },

  // Happiness / Joy
  {
    id: "MASTER",
    label: "MASTER COCKPIT",
    pillar: "happiness",
    icon: <LayoutDashboard size={15} />,
    route: "/",
    description: "Centralized one-pager command view",
  },
  {
    id: "HORIZON",
    label: "HORIZON & ZOOM",
    pillar: "happiness",
    icon: <Sunrise size={15} />,
    route: "/horizon",
    description: "Strategic time horizons & vision zoom",
  },
  {
    id: "VAULT",
    label: "NEURAL VAULT",
    pillar: "happiness",
    icon: <Network size={15} />,
    route: "/vault",
    description: "Second brain knowledge graph",
  },
  {
    id: "EPISTEMIC",
    label: "EPISTEMIC MATRIX",
    pillar: "happiness",
    icon: <ShieldAlert size={15} />,
    route: "/epistemic",
    description: "Risk mitigation & anti-fragility",
  },
  {
    id: "INTEGRATIONS",
    label: "MCP & CONSOLE",
    pillar: "happiness",
    icon: <PlugZap size={15} />,
    route: "/integrations",
    description: "Tools, connections & credentials",
  },
  {
    id: "ORG_CHART",
    label: "TOPOLOGY MAP",
    pillar: "happiness",
    icon: <Network size={15} />,
    route: "/org-chart",
    description: "System architecture node tree",
  },
  {
    id: "RESOURCES",
    label: "RESOURCES & SOPS",
    pillar: "happiness",
    icon: <Database size={15} />,
    route: "/resources",
    description: "Architecture matrix & operational SOPs",
  },
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
    label: "All Pillars",
    shortLabel: "ALL",
    icon: <Layers size={13} />,
    color: "var(--theme-grad-start)",
    count: ALL_MODULE_ITEMS.length,
  },
  {
    id: "health",
    label: "Health",
    shortLabel: "HEALTH",
    icon: <Activity size={13} />,
    color: "#10B981",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "health").length,
  },
  {
    id: "wealth",
    label: "Wealth",
    shortLabel: "WEALTH",
    icon: <CircleDollarSign size={13} />,
    color: "#F59E0B",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "wealth").length,
  },
  {
    id: "relationships",
    label: "Relationships",
    shortLabel: "RELATE",
    icon: <Users size={13} />,
    color: "#60A5FA",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "relationships").length,
  },
  {
    id: "fam",
    label: "Family & Pack",
    shortLabel: "FAM",
    icon: <Dog size={13} />,
    color: "#EC4899",
    count: ALL_MODULE_ITEMS.filter((i) => i.pillar === "fam").length,
  },
  {
    id: "happiness",
    label: "Happiness & Joy",
    shortLabel: "JOY",
    icon: <Sparkles size={13} />,
    color: "#A855F7",
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
  const [novaOpen, setNovaOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#070911]/90 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-4 text-white">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((p) => !p)}
          className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-zinc-200 transition-colors flex items-center gap-2"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">
            {currentPillarMeta.label}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#0969DA" }} />
          <span className="text-xs font-bold tracking-[0.16em] uppercase text-zinc-100">
            PRISTINE DESIGNS
          </span>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Dual-Column Sidebar: Slide-over Drawer on Mobile, Fixed Rail on Desktop */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-row liquid-glass-panel bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-2xl border-r border-zinc-200/60 dark:border-white/[0.12] z-50 transition-transform duration-300 shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* ====================================================================
         * COLUMN 1: LIFE PILLARS SELECTOR (Health, Wealth, Relate, Fam, Joy & All)
         * ================================================================== */}
        <div
          className={`h-full flex flex-col border-r border-zinc-200/50 dark:border-white/10 transition-all duration-300 ${
            col1Collapsed ? "w-16" : "w-44"
          }`}
          style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
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
                  className={`flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-white dark:bg-white/10 border shadow-sm text-zinc-900 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 border border-transparent"
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: `${p.color}55`,
                          backgroundColor: `${p.color}15`,
                        }
                      : undefined
                  }
                  title={`${p.label} (${p.count} modules)`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="shrink-0 p-1.5 rounded-lg border"
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
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "font-bold text-zinc-900 dark:text-white" : ""
                        }`}
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
         * COLUMN 2: PILLAR MODULES & SYSTEMS (Lines up items for selected pillar)
         * ================================================================== */}
        <div
          className={`h-full flex flex-col transition-all duration-300 ${
            col2Collapsed ? "w-14" : "w-60"
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
                  className={`flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-white/80 dark:bg-white/10 border shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 border border-transparent"
                  }`}
                  style={
                    isActive
                      ? {
                          borderColor: `${currentPillarMeta.color}55`,
                        }
                      : undefined
                  }
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 ${
                        isActive
                          ? "text-themeAccent font-bold"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!col2Collapsed && (
                      <div className="min-w-0 truncate">
                        <div
                          className={`text-[11px] truncate tracking-wider ${
                            isActive
                              ? "font-bold text-zinc-900 dark:text-white"
                              : "font-semibold"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate">
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
              {user?.image ? (
                <img src={user.image} alt="User" className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#0969DA]/40 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#0969DA]/20 border border-[#0969DA]/40 flex items-center justify-center text-[#58A6FF] text-xs font-bold shrink-0">
                  {(user?.name ?? "C")[0].toUpperCase()}
                </div>
              )}
              {!col2Collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {user?.name?.split(" ")[0] ?? "Chairman"}
                  </div>
                  <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
              )}
            </button>

            {/* Actions: Settings Gear (32px × 32px) + Calendar + Palette */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
                title="Execution & Account Settings"
              >
                <Settings size={15} />
              </button>

              <button
                onClick={onCalToggle}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  calConnected
                    ? "text-[#58A6FF] bg-[#0969DA]/15 border border-[#0969DA]/30"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10"
                }`}
                title={calConnected ? "Google Calendar Live" : "Connect Google Calendar"}
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
          user={user || {}}
          calConnected={calConnected}
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
