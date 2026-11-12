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
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { UserAccountModal } from "./UserAccountModal";
import { useState, useEffect } from "react";
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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  calConnected: boolean;
  onCalToggle: () => void;
  isAppearanceOpen: boolean;
  setIsAppearanceOpen: (open: boolean) => void;
  user: any;
  deepWork: boolean;
  setDeepWork: (val: boolean | ((p: boolean) => boolean)) => void;
  activeTasksCount: number;
  activeSubtasksCount: number;
  tasksLoading: boolean;
}

export function Sidebar({
  activeTab, setActiveTab, calConnected, onCalToggle, 
  isAppearanceOpen, setIsAppearanceOpen, user,
  deepWork, setDeepWork,
  activeTasksCount, activeSubtasksCount, tasksLoading
}: SidebarProps) {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleToggle = () => setNovaOpen(p => !p);
    window.addEventListener("toggleNovaCore", handleToggle);
    return () => window.removeEventListener("toggleNovaCore", handleToggle);
  }, []);

  // Section 23.2: Global Quick-Action Shortcut (Cmd+Shift+M / Ctrl+Shift+M) -> Mindset Massage
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

  const NAV_SECTIONS = [
    {
      heading: "Command Cockpit",
      items: [
        { id: "MASTER", label: "MASTER VIEW", icon: <LayoutDashboard size={16} />, route: "/" },
        { id: "CALENDAR", label: "SOLAR CALENDAR", icon: <CalendarRange size={16} />, route: "/calendar" },
        { id: "EDUCATION", label: "EDUCATION ACADEMY", icon: <GraduationCap size={16} />, route: "/education", badge: "XP" },
        { id: "BUDGET", label: "12M BUDGET LEDGER", icon: <Wallet size={16} />, route: "/budget" },
        { id: "KPI", label: "KPI SCORECARD", icon: <Activity size={16} />, route: "/kpis" },
        { id: "WIDGETS", label: "MOBILE WIDGETS", icon: <Smartphone size={16} />, route: "/widgets" },
        { id: "BUSINESS", label: "BUSINESS", icon: <Briefcase size={16} />, route: "/" },
        { id: "PERSONAL", label: "PERSONAL", icon: <User size={16} />, route: "/" },
      ],
    },
    {
      heading: "Execution & Strategy",
      items: [
        { id: "MARKETING_AGENT", label: "TREND SCRUBBER", icon: <Radar size={16} />, route: "/marketing-agent", badge: "AI" },
        { id: "MACRO_OPS", label: "MACRO OPS", icon: <Utensils size={16} />, route: "/macro-ops" },
        { id: "CALIBER_ARC", label: "CALIBER ARC", icon: <TrendingUp size={16} />, route: "/caliber-arc" },
        { id: "PMS", label: "SOVEREIGN PMS", icon: <KanbanSquare size={16} />, route: "/pms" },
        { id: "HORIZON", label: "HORIZON & ZOOM", icon: <Sunrise size={16} />, route: "/horizon" },
        { id: "EPISTEMIC", label: "EPISTEMIC MATRIX", icon: <ShieldAlert size={16} />, route: "/epistemic" },
      ],
    },
    {
      heading: "Life OS & Collective",
      items: [
        { id: "FAMILY_HUB", label: "5-WHEEL FAMILY HUB", icon: <Dog size={16} />, route: "/family-hub" },
        { id: "PODS", label: "HIS & HERS PODS", icon: <Users size={16} />, route: "/pods" },
        { id: "LIFE_OPS", label: "LIFE OPS & FLEET", icon: <Wrench size={16} />, route: "/life-ops" },
        { id: "VAULT", label: "NEURAL VAULT", icon: <Network size={16} />, route: "/vault" },
        { id: "MINDSET", label: "MINDSET COUNSEL", icon: <Flame size={16} />, route: "/mindset", badge: "⌘⇧M" },
        { id: "INTEGRATIONS", label: "MCP & CONSOLE", icon: <PlugZap size={16} />, route: "/integrations" },
      ],
    },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col liquid-glass-panel bg-white/70 dark:bg-black/55 backdrop-blur-2xl border-r border-zinc-200/60 dark:border-white/[0.12] z-50">
        
        {/* Brand / Header */}
        <div className="px-5 py-4 border-b border-zinc-200/50 dark:border-white/10 flex items-center gap-3">
          <Map size={18} className="text-[color:var(--theme-grad-start)] shrink-0" />
          <h1 className="bg-theme-gradient bg-clip-text text-transparent font-bold" style={{ fontFamily: "Georgia, serif", fontSize: 16, letterSpacing: "0.04em", lineHeight: 1.2 }}>
            Pristine Designs
          </h1>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {NAV_SECTIONS.map((sec, sIdx) => (
            <div key={sec.heading} className={sIdx > 0 ? "mt-3" : ""}>
              <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-zinc-500 dark:text-zinc-500 mb-1 px-2.5">
                {sec.heading}
              </div>
              <div className="flex flex-col gap-0.5">
                {sec.items.map((tab) => {
                  const isActive = tab.route === "/"
                    ? (pathname === "/" && activeTab === tab.id)
                    : pathname === tab.route;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.route === pathname) {
                          if (tab.route === "/") setActiveTab(tab.id);
                        } else {
                          if (tab.route === "/") {
                            setActiveTab(tab.id);
                          }
                          router.push(tab.route);
                        }
                      }}
                      className={`flex items-center justify-between gap-2.5 w-full px-3 py-2 rounded-xl text-[11px] tracking-widest transition-all ${
                        isActive
                          ? "bg-[rgba(var(--theme-grad-start-rgb),0.12)] border border-[color:var(--theme-grad-start)]/30"
                          : "font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                      }`}
                      style={isActive ? { borderColor: "rgba(179,136,235,0.3)" } : {}}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 truncate">
                        <span className={isActive ? "text-themeAccent shrink-0" : "text-zinc-500 dark:text-zinc-400 shrink-0"}>
                          {tab.icon}
                        </span>
                        <span className={isActive ? "bg-theme-gradient bg-clip-text text-transparent font-bold truncate" : "truncate"}>
                          {tab.label}
                        </span>
                      </span>
                      {(tab as any).badge && (
                        <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                          {(tab as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="text-[9px] font-semibold tracking-[0.16em] uppercase text-zinc-500 dark:text-zinc-500 mt-3 mb-1 px-2.5">Systems</div>
          
          <button
            onClick={() => setDeepWork((p) => !p)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-[11px] tracking-widest transition-all ${
              deepWork 
                ? "bg-blue-500/10 text-[color:var(--theme-grad-start)] border border-blue-500/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Brain size={15} />
            DEEP WORK
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new Event("toggleNovaCore"));
            }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-[11px] tracking-widest transition-all ${
              novaOpen 
                ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] text-[color:var(--theme-grad-start)] border border-[color:var(--theme-grad-start)]/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Bot size={15} />
            NOVA CORE
          </button>
          
          <button
            onClick={() => {
              if (pathname !== "/") router.push("/");
              setActiveTab("ARCHIVE");
            }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold text-[11px] tracking-widest transition-all ${
              pathname === "/" && activeTab === "ARCHIVE"
                ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] text-[color:var(--theme-grad-start)] border border-[color:var(--theme-grad-start)]/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Archive size={15} />
            ARCHIVE
          </button>
        </div>

        {/* Telemetry (Mission Progress & Clock) */}
        <div className="px-4 pb-4">
          <button 
            onClick={() => {
              /* Open MissionControlModal logic here via event or state. We can dispatch a custom event for simplicity */
              window.dispatchEvent(new Event("openMissionControl"));
            }}
            className="w-full text-left p-4 rounded-xl bg-zinc-50/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex flex-col gap-4 shadow-inner hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            {/* Progress */}
            {activeTasksCount === 0 && activeSubtasksCount === 0 && !tasksLoading ? (
              <div className="flex flex-col items-center justify-center py-4 gap-2 select-none">
                 <CheckCircle2 className="text-[color:var(--theme-grad-start)]" size={28} />
                 <span className="text-xs font-bold tracking-widest text-[color:var(--theme-grad-start)] uppercase">Inbox Zero</span>
              </div>
            ) : (
              <div className="select-none flex flex-col gap-3">
                <div className="text-[9px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                  {tasksLoading ? "Syncing…" : "Mission Progress"}
                </div>
                
                <div className="flex items-center justify-between border-b border-zinc-200/20 dark:border-white/5 pb-2">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {activeTasksCount} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 tracking-widest uppercase ml-1">Pending Tasks</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {activeSubtasksCount} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 tracking-widest uppercase ml-1">Pending Subtasks</span>
                  </span>
                </div>
              </div>
            )}

            <div style={{ height: 1, backgroundColor: "var(--theme-grad-start)", opacity: 0.15 }} />
            
            {/* Clock */}
            <LiveClock />
          </button>
        </div>

        {/* Bottom / Footer (Discord Style) */}
        <div className="mt-auto p-4 border-t border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2">
            
            {/* User Profile (Discord bottom-left style) */}
            <button 
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-3 flex-1 p-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors text-left"
            >
              {user?.image ? (
                <img src={user.image} alt="User" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold shrink-0">
                  {(user?.name ?? "C")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user?.name?.split(" ")[0] ?? "Chairman"}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Online</div>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onCalToggle}
                className={`p-2 rounded-lg transition-colors ${calConnected ? "text-[color:var(--theme-grad-start)] bg-[rgba(var(--theme-grad-start-rgb),0.1)]" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10"}`}
                title={calConnected ? "Cal Live" : "Connect Calendar"}
              >
                <CalendarDays size={16} />
              </button>
              
              <button
                onClick={() => setIsAppearanceOpen(true)}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors"
                title="Appearance Settings"
              >
                <Palette size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {accountModalOpen && (
        <UserAccountModal user={user || {}} onClose={() => setAccountModalOpen(false)} />
      )}
      {isAppearanceOpen && (
        <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />
      )}
    </>
  );
}
