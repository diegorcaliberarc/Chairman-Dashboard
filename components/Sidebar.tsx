"use client";

import { Bot, Brain, CalendarDays, Palette, Map, LayoutDashboard, Briefcase, User, BarChart, CalendarRange, Archive, CheckCircle2, Activity } from "lucide-react";
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

  const TABS = [
    { id: "MASTER", label: "MASTER VIEW", icon: <LayoutDashboard size={18} />, route: "/" },
    { id: "BUSINESS", label: "BUSINESS", icon: <Briefcase size={18} />, route: "/" },
    { id: "PERSONAL", label: "PERSONAL", icon: <User size={18} />, route: "/" },
    { id: "KPI", label: "KPIs / VITAL SIGNS", icon: <Activity size={18} />, route: "/kpis" },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-white/80 dark:bg-black/60 backdrop-blur-xl border-r border-zinc-200/50 dark:border-white/10 z-50">
        
        {/* Brand / Header */}
        <div className="p-6 border-b border-zinc-200/50 dark:border-white/10 flex items-center gap-3">
          <Map size={18} className="text-[color:var(--theme-grad-start)] shrink-0" />
          <h1 className="bg-theme-gradient bg-clip-text text-transparent font-bold" style={{ fontFamily: "Georgia, serif", fontSize: 16, letterSpacing: "0.04em", lineHeight: 1.2 }}>
            Pristine Designs
          </h1>
        </div>

        {/* Navigation Tabs (Top) */}
        <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2 px-2">Navigation</div>
          {TABS.map((tab) => {
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
                      // Store tab intent or just go back
                      setActiveTab(tab.id);
                    }
                    router.push(tab.route);
                  }
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs tracking-widest transition-all ${
                  isActive 
                    ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] border border-[color:var(--theme-grad-start)]/30" 
                    : "font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                }`}
                style={isActive ? { borderColor: "rgba(179,136,235,0.3)" } : {}}
              >
                <div className={isActive ? "text-themeAccent" : "text-zinc-500 dark:text-zinc-400"}>
                  {tab.icon}
                </div>
                <span className={isActive ? "bg-theme-gradient bg-clip-text text-transparent font-semibold" : ""}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          <div className="text-[10px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mt-6 mb-2 px-2">Systems</div>
          
          <button
            onClick={() => setDeepWork((p) => !p)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${
              deepWork 
                ? "bg-blue-500/10 text-[color:var(--theme-grad-start)] border border-blue-500/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Brain size={16} />
            DEEP WORK
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new Event("toggleNovaCore"));
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${
              novaOpen 
                ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] text-[color:var(--theme-grad-start)] border border-[color:var(--theme-grad-start)]/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Bot size={16} />
            NOVA CORE
          </button>
          
          <button
            onClick={() => setActiveTab("ARCHIVE")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${
              activeTab === "ARCHIVE"
                ? "bg-[rgba(var(--theme-grad-start-rgb),0.1)] text-[color:var(--theme-grad-start)] border border-[color:var(--theme-grad-start)]/30" 
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
            }`}
          >
            <Archive size={16} />
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
