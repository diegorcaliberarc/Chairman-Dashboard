"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/MermaidDiagram";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { Palette } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MissionControlModal } from "@/components/MissionControlModal";
import {
  CheckCircle2,
  Circle,
  Crosshair,
  Zap,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronDown,
  CheckCheck,
  Brain,
  Bot,
  X,
  Flag,
  CalendarDays,
  Sun,
  Moon,
  Send,
  Target,
  Settings,
  TrendingUp,
  Landmark,
  Terminal,
  Layers,
  CircleDollarSign,
  Activity,
  Users,
  BadgeDollarSign,
  ShieldCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "MASTER" | "BUSINESS" | "PERSONAL" | "KPI" | "ARCHIVE";

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?:   { dateTime?: string; date?: string };
}

interface DbTask {
  id:          string;
  title:       string;
  pillar:      string;   // "BUSINESS" | "PERSONAL"
  agentId:     string;
  category?:   string;   // Wealth | Health | Relate | Joy | CEO | COO | CFO | CTO | CMO | CPO
  status:      string;   // "PENDING" | "DONE"
  isDelegated: boolean;
  createdAt:   string;
  priority:    string;   // "Urgent" | "High" | "Normal" | "Low" | "None"
  startDate?:  string | null;
  dueDate?:    string | null;
  timeTracked?: number;
  parentId?:   string | null;
  completed?:  boolean;
}

interface Agent {
  id:    string;
  title: string;
  role:  string;
  color: string;
  icon?: React.ReactNode;
  tasks: DbTask[];
}


// ─── Agent Metadata (tasks come from Supabase) ────────────────────────────────

const AGENT_META_BUSINESS = [
  { id: "ceo", title: "CEO", role: "Vision & Strategy",      color: "var(--theme-grad-start)", icon: <Target className="w-4 h-4 opacity-70" /> },
  { id: "coo", title: "COO", role: "Ops & Execution",        color: "var(--theme-grad-start)", icon: <Settings className="w-4 h-4 opacity-70" /> },
  { id: "cmo", title: "CMO", role: "Growth & Sales",         color: "var(--theme-grad-start)", icon: <TrendingUp className="w-4 h-4 opacity-70" /> },
  { id: "cfo", title: "CFO", role: "Finance & Cash",         color: "var(--theme-grad-start)", icon: <Landmark className="w-4 h-4 opacity-70" /> },
  { id: "cto", title: "CTO", role: "APIs & Automation Pipelines",color: "var(--theme-grad-start)", icon: <Terminal className="w-4 h-4 opacity-70" /> },
  { id: "cpo", title: "CPO", role: "Product & UX",           color: "var(--theme-grad-start)", icon: <Layers className="w-4 h-4 opacity-70" /> },
  { id: "cro", title: "CRO", role: "Revenue & Conversion",   color: "var(--theme-grad-start)", icon: <BadgeDollarSign className="w-4 h-4 opacity-70" /> },
  { id: "cho", title: "CHO", role: "Talent & Culture",       color: "var(--theme-grad-start)", icon: <ShieldCheck className="w-4 h-4 opacity-70" /> },
];

const AGENT_META_PERSONAL = [
  { id: "wealth", title: "WEALTH",        role: "Income & Freedom",        color: "var(--theme-grad-start)", icon: <CircleDollarSign className="w-4 h-4 opacity-70" /> },
  { id: "health", title: "HEALTH",        role: "Training & Energy",       color: "var(--theme-grad-start)", icon: <Activity className="w-4 h-4 opacity-70" /> },
  { id: "relate", title: "RELATIONSHIPS", role: "Legacy & Pack",           color: "var(--theme-grad-start)", icon: <Users className="w-4 h-4 opacity-70" /> },
  { id: "joy",    title: "JOY",           role: "Goals & Happiness",       color: "var(--theme-grad-start)", icon: <Sparkles className="w-4 h-4 opacity-70" /> },
];


// ─── Category → Agent Routing (hardcoded, no guessing) ───────────────────────

const CATEGORIES: Record<string, { label: string; color: string; pillar: string; agentId: string }> = {
  CEO:    { label: "CEO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "ceo"    },
  COO:    { label: "COO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "coo"    },
  CMO:    { label: "CMO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "cmo"    },
  CFO:    { label: "CFO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "cfo"    },
  CTO:    { label: "CTO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "cto"    },
  CPO:    { label: "CPO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "cpo"    },
  CRO:    { label: "CRO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "cro"    },
  CHO:    { label: "CHO",    color: "var(--theme-grad-start)", pillar: "BUSINESS", agentId: "cho"    },
  Wealth: { label: "WEALTH", color: "var(--theme-grad-start)", pillar: "PERSONAL", agentId: "wealth" },
  Health: { label: "HEALTH", color: "var(--theme-grad-start)", pillar: "PERSONAL", agentId: "health" },
  Relate: { label: "RELATE", color: "var(--theme-grad-start)", pillar: "PERSONAL", agentId: "relate" },
  Joy:    { label: "JOY",    color: "var(--theme-grad-start)", pillar: "PERSONAL", agentId: "joy"    },
};



const HIGH_PRIORITY_KEYWORDS = ["urgent","asap","critical","immediately","top priority","high priority","now","emergency","rush"];
const LOW_PRIORITY_KEYWORDS  = ["low priority","whenever","no rush","eventually","someday","low urgency"];

function detectPriority(text: string): string {
  const lower = text.toLowerCase();
  if (HIGH_PRIORITY_KEYWORDS.some((k) => lower.includes(k))) return "High";
  if (LOW_PRIORITY_KEYWORDS.some((k)  => lower.includes(k))) return "Low";
  return "Normal";
}

function getHighestPriorityTask(
  business: Agent[],
  personal: Agent[]
): { task: DbTask; agent: Agent; isBiz: boolean } | null {
  for (const agent of business) {
    const t = agent.tasks.find((t) => t.status !== "DONE");
    if (t) return { task: t, agent, isBiz: true };
  }
  for (const agent of personal) {
    const t = agent.tasks.find((t) => t.status !== "DONE");
    if (t) return { task: t, agent, isBiz: false };
  }
  return null;
}

// ─── CSS Keyframes ────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes spin-cw  { to { transform: rotate(360deg);  } }
  @keyframes spin-ccw { to { transform: rotate(-360deg); } }

  /* ── Mobile responsive overrides ─────────────────────── */
  @media (max-width: 767px) {
    .cmd-bar-msg { display: none; }
    .header-clock { display: none !important; }
    .header-divider-clock { display: none !important; }
    .header-progress-bar { display: none !important; }
    .kpi-row { flex-direction: column !important; }
    .roadmap-scene { height: 300px !important; }
    .roadmap-outer { height: 300px !important; }
    .main-px { padding-left: 16px !important; padding-right: 16px !important; }
  }
  @media (max-width: 640px) {
    .header-ea-badge { display: none !important; }
    .header-divider-ea { display: none !important; }
    .deep-work-title { font-size: clamp(24px, 7vw, 40px) !important; }
  }

  @keyframes float-y {
    0%,100% { transform: translateY(0px);  }
    50%     { transform: translateY(-7px); }
  }

  @keyframes pulse-active {
    0%,100% {
      filter: blur(3px);
      box-shadow: 0 0 18px #00FF88, 0 0 36px rgba(0,255,136,0.3);
    }
    50% {
      filter: blur(5px);
      box-shadow: 0 0 34px #00FF88, 0 0 68px rgba(0,255,136,0.55);
    }
  }

  @keyframes domain-expand {
    0%,100% {
      filter: blur(7px);
      box-shadow: 0 0 50px #B388EB, 0 0 100px rgba(179,136,235,0.35), 0 0 160px rgba(179,136,235,0.15);
    }
    50% {
      filter: blur(10px);
      box-shadow: 0 0 90px #B388EB, 0 0 180px rgba(179,136,235,0.6), 0 0 280px rgba(179,136,235,0.25);
    }
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  @keyframes tab-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes toast-slide {
    from { opacity: 0; transform: translateX(-50%) translateY(14px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
  }

  @keyframes toast-top {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0);      }
  }

  @keyframes cmd-breathe {
    0%,100% { box-shadow: 0 -1px 24px rgba(59,130,246,0.03); }
    50%     { box-shadow: 0 -1px 40px rgba(59,130,246,0.08); }
  }

  @keyframes ea-scan {
    0%   { background-position: -200% 0; }
    100% { background-position: 200%  0; }
  }

  @keyframes deep-cursor {
    0%,100% { opacity: 1; }
    50%     { opacity: 0; }
  }

  @keyframes deep-enter {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1);    }
  }

  @keyframes mem-glow {
    0%,100% { box-shadow: 0 0 0 1px rgba(179,136,235,0.2); }
    50%     { box-shadow: 0 0 12px rgba(179,136,235,0.4); }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays() {
  const today = new Date();
  const dow   = today.getDay();
  const off   = dow === 0 ? -6 : 1 - dow;
  const mon   = new Date(today);
  mon.setDate(today.getDate() + off);
  const NAMES = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return {
      name:       NAMES[i],
      date:       d.getDate(),
      month:      d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      isToday:    d.toDateString() === today.toDateString(),
      isWeekend:  i >= 5,
      dateString: d.toDateString(),
    };
  });
}



// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-widest uppercase shrink-0 text-zinc-900 dark:text-white">
        {children}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "#1E1F24" }} />
      {right && <span className="text-[10px] shrink-0 text-zinc-900 dark:text-white">{right}</span>}
    </div>
  );
}


// ─── Business Tab ─────────────────────────────────────────────────────────────

function BusinessTab({ agents, onToggle, onDelete, onTaskClick, subtasksMap, onToggleSubtask }: {
  agents:        Agent[];
  onToggle:      (agentId: string, taskId: string) => void;
  onDelete:      (taskId: string) => void;
  onTaskClick:   (task: DbTask, color: string) => void;
  subtasksMap?:  any;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}) {
  const PANEL_CLASS = "bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:shadow-[0_0_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.04)] transition-shadow duration-500";
  const PANEL: React.CSSProperties = { borderRadius: 10, padding: "14px 16px", overflow: "hidden", minHeight: 0, minWidth: 0 };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[calc(100vh-6rem)] space-y-6" style={{ animation: "tab-in 0.22s ease-out" }}>
      <SectionLabel>Executive Suite · 8 Agents Active</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 h-full pb-6">
        {agents.map((a) => (
          <div key={a.id} style={PANEL} className={`${PANEL_CLASS} h-full flex flex-col`}>
            <CSuiteCard agent={a} onToggle={(taskId) => onToggle(a.id, taskId)} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Personal Tab ─────────────────────────────────────────────────────────────

function PersonalTab({ agents, onToggle, onDelete, onTaskClick, subtasksMap, onToggleSubtask }: {
  agents:        Agent[];
  onToggle:      (agentId: string, taskId: string) => void;
  onDelete:      (taskId: string) => void;
  onTaskClick:   (task: DbTask, color: string) => void;
  subtasksMap?:  any;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}) {
  const PANEL_CLASS = "bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:shadow-[0_0_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.04)] transition-shadow duration-500";
  const PANEL: React.CSSProperties = { borderRadius: 10, padding: "14px 16px", overflow: "hidden", minHeight: 0, minWidth: 0 };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[calc(100vh-6rem)] space-y-5" style={{ animation: "tab-in 0.22s ease-out" }}>
      <SectionLabel>Personal Power Blocks · 4 Domains</SectionLabel>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 h-full pb-6">
        {agents.map((a) => (
          <div key={a.id} style={PANEL} className={`${PANEL_CLASS} h-full flex flex-col`}>
            <DomainBlock label={a.title} sub={a.role} tasks={a.tasks} color={a.color} icon={a.icon} onToggle={(taskId) => onToggle(a.id, taskId)} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar Feed (compact one-pager) ───────────────────────────────────────

function CalendarFeed({
  calConnected, events, calLoading, calError,
}: {
  calConnected: boolean;
  events:       CalendarEvent[];
  calLoading:   boolean;
  calError:     string | null;
}) {
  const [modalDay, setModalDay] = useState<{ name: string; date: number; month: string; dateString: string } | null>(null);

  const days     = getWeekDays();
  const todayStr = new Date().toDateString();

  const eventsForDay = (dateString: string) =>
    events
      .filter((ev) => {
        const dt = ev.start?.dateTime ?? ev.start?.date;
        return dt ? new Date(dt).toDateString() === dateString : false;
      })
      .sort((a, b) => {
        const ta = a.start?.dateTime ?? a.start?.date ?? "";
        const tb = b.start?.dateTime ?? b.start?.date ?? "";
        return ta.localeCompare(tb);
      });

  const todayEvts = eventsForDay(todayStr);
  const modalEvts = modalDay ? eventsForDay(modalDay.dateString) : [];

  // Outer panel (CAL_PANEL) handles overflow — no height constraints inside
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarDays size={10} className="text-zinc-500 dark:text-white" />
          <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase" }} className="text-zinc-500 dark:text-zinc-400">Command Calendar</span>
        </div>
        <span style={{ fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: calLoading ? "#4A90E2" : calError ? "#E05A3A" : calConnected ? "#8BA87B" : "#252836" }}>
          {calLoading ? "Syncing…" : calError ? "● Auth error" : calConnected ? "● Live" : "○ Not connected"}
        </span>
      </div>

      {/* Week strip — each day is clickable */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 8 }}>
        {days.map((d) => {
          const dayEvts = eventsForDay(d.dateString);
          const isToday = d.isToday;
          return (
            <button
              key={d.name}
              onClick={() => setModalDay(d)}
              style={{
                borderRadius:    5,
                padding:         "5px 2px",
                textAlign:       "center",
                backgroundColor: isToday ? "rgba(59,130,246,0.06)" : "transparent",
                border:          isToday ? "1px solid rgba(59,130,246,0.22)" : "1px solid #111318",
                cursor:          "pointer",
                transition:      "border-color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = isToday ? "rgba(59,130,246,0.45)" : "rgba(74,144,226,0.25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = isToday ? "rgba(59,130,246,0.22)" : "#111318"; }}
            >
              <div style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: isToday ? "var(--color-primary-dark, #C9A961)" : undefined }} className={isToday ? "" : "text-zinc-600 dark:text-[#1A1C28]"}>{d.name}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: isToday ? "var(--color-primary-dark, #C9A961)" : undefined, marginTop: 2, fontWeight: 700 }} className={isToday ? "" : "text-zinc-800 dark:text-[#1E2030]"}>{d.date}</div>
              {dayEvts.length > 0 && (
                <div style={{ marginTop: 3, display: "flex", justifyContent: "center", gap: 2 }}>
                  {Array.from({ length: Math.min(3, dayEvts.length) }).map((_, i) => (
                    <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: isToday ? "#C9A961" : "#3B4558" }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Today label */}
      <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }} className="text-zinc-600 dark:text-[#1E2030]">
        Today · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>

      {/* Today's events — no inner scroll; parent panel scrolls instead */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {calError ? (
          <div style={{ padding: "10px 12px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }} className="bg-red-50 dark:bg-[#E05A3A]/10 border border-red-200 dark:border-[#E05A3A]/20">
            <span style={{ fontSize: 10, letterSpacing: "0.06em" }} className="text-red-600 dark:text-zinc-900 dark:text-white">Google session expired — reconnect to restore events.</span>
            <a href="/api/auth/signin" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", flexShrink: 0, padding: "3px 8px", borderRadius: 4 }} className="text-zinc-700 dark:text-white border border-zinc-200 dark:border-transparent [background:linear-gradient(var(--bg-white/80 dark:bg-black/60 backdrop-blur-xl),var(--bg-white/80 dark:bg-black/60 backdrop-blur-xl))_padding-box,linear-gradient(to_right,var(--theme-grad-start),var(--theme-grad-end))_border-box]/30">Reconnect</a>
          </div>
        ) : todayEvts.length === 0 ? (
          <div style={{ fontSize: 10, letterSpacing: "0.08em", padding: "10px 0" }} className="text-zinc-500 dark:text-[#1C1E2A]">
            {calConnected ? "No events scheduled today." : "Connect Google Calendar to see your schedule."}
          </div>
        ) : (
          todayEvts.map((ev) => {
            const dt      = ev.start?.dateTime;
            const endDt   = ev.end?.dateTime;
            const timeStr = dt
              ? new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
              : "All day";
            const endStr = endDt
              ? new Date(endDt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
              : null;
            return (
              <div key={ev.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 10px", borderRadius: 6 }} className="bg-slate-50 dark:bg-theme-gradient/5 border border-slate-200 dark:border-transparent [background:linear-gradient(var(--bg-white/80 dark:bg-black/60 backdrop-blur-xl),var(--bg-white/80 dark:bg-black/60 backdrop-blur-xl))_padding-box,linear-gradient(to_right,var(--theme-grad-start),var(--theme-grad-end))_border-box]/10">
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 9, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} className="text-zinc-700 dark:text-white">{timeStr}</div>
                  {endStr && <div style={{ fontSize: 8, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} className="text-zinc-500 dark:text-zinc-400">{endStr}</div>}
                </div>
                <div style={{ width: 1, height: "100%", minHeight: 24, flexShrink: 0 }} className="bg-slate-200 dark:bg-theme-gradient/20" />
                <span style={{ fontSize: 11, flex: 1, lineHeight: 1.4 }} className="text-zinc-900 dark:text-white">{ev.summary ?? "Event"}</span>
              </div>
            );
          })
        )}
      </div>

      {/* ── Day Modal ─────────────────────────────────────────────────────── */}
      {modalDay && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.72)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setModalDay(null)}
        >
          <div
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(24px)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: 14, padding: "28px 32px", minWidth: 380, maxWidth: 520, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", animation: "fade-up 0.18s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "var(--theme-grad-start)", lineHeight: 1 }}>
                  {modalDay.name} {modalDay.date}
                </div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--theme-grad-start)", marginTop: 5 }}>
                  {modalDay.month} · {modalEvts.length} event{modalEvts.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setModalDay(null)}
                style={{ background: "none", border: "1px solid #1E1F24", cursor: "pointer", color: "var(--theme-grad-start)", borderRadius: 6, padding: "5px 8px", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.35)"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A961"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1F24"; (e.currentTarget as HTMLButtonElement).style.color = "#3B4558"; }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Events list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
              {modalEvts.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 11, color: "var(--theme-grad-start)", letterSpacing: "0.1em" }}>
                  {calError ? "Session expired — reconnect Google Calendar." : calConnected ? "No events on this day." : "Connect Google Calendar to see events."}
                </div>
              ) : (
                modalEvts.map((ev) => {
                  const startDt  = ev.start?.dateTime;
                  const endDt    = ev.end?.dateTime;
                  const timeStr  = startDt
                    ? new Date(startDt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                    : "All day";
                  const endStr   = endDt
                    ? new Date(endDt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                    : null;
                  return (
                    <div key={ev.id} style={{ padding: "12px 16px", borderRadius: 8, backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(59,130,246,0.10)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: ev.summary ? 6 : 0 }}>
                        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundImage: 'linear-gradient(to right, var(--theme-grad-start), var(--theme-grad-end))', flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: "var(--theme-grad-start)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                          {timeStr}{endStr ? ` — ${endStr}` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--theme-grad-start)", lineHeight: 1.4, paddingLeft: 13 }}>
                        {ev.summary ?? "Untitled Event"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Priority Strikes ─────────────────────────────────────────────────────────

function PriorityStrikes({
  business, personal, onToggle, onDelete, onTaskClick, subtasksMap, onToggleSubtask
}: { business: Agent[]; personal: Agent[]; onToggle: (taskId: string) => void; onDelete: (taskId: string) => void; onTaskClick: (task: DbTask, color: string) => void; subtasksMap?: any; onToggleSubtask?: (taskId: string, subtaskId: string) => void; }) {
  const allTasks = [...business, ...personal].flatMap((a) => a.tasks.map((t) => ({ task: t, agent: a })));
  const strikes = allTasks.filter(x => x.task.status !== "DONE");
  
  const pMap: Record<string, number> = { "Urgent": 1, "High": 2, "Normal": 3, "Low": 4, "None": 5 };
  strikes.sort((a, b) => {
    return (pMap[a.task.priority || "Normal"] ?? 3) - (pMap[b.task.priority || "Normal"] ?? 3);
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Crosshair size={10} className="text-zinc-900 dark:text-white" />
          <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase" }} className="text-zinc-500 dark:text-zinc-400">Priority Strikes</span>
        </div>
        <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "var(--theme-grad-start)" }}>{strikes.length} pending</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {strikes.slice(0, 14).map(({ task, agent }) => (
          <div
            key={task.id}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 6, transition: "border-color 0.14s" }}
            className="bg-transparent border border-zinc-200 dark:border-[#0F1015]"
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${agent.color}28`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#0F1015")}
          >
            <button onClick={() => onToggle(task.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0, color: "var(--theme-grad-start)" }}>
              <Circle size={9} />
            </button>
            <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: agent.color, flexShrink: 0 }} />
            <span style={{ fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: agent.color, flexShrink: 0, width: 28 }}>{agent.title}</span>
            <span className="text-[11px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:underline text-zinc-900 dark:text-white flex items-center justify-between" onClick={() => onTaskClick(task, agent.color)}>
              <span className="flex items-center gap-1.5 truncate">
                {task.title}
                {task.priority && task.priority !== "None" && (
                  <Flag size={9} color={task.priority === "Urgent" ? "#E05A3A" : task.priority === "High" ? "#EAB308" : task.priority === "Normal" ? "#3B82F6" : "#9CA3AF"} />
                )}
              </span>
              {task.dueDate && (
                <span className="text-[9px] text-zinc-500 shrink-0 ml-2">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              )}
            </span>
            <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--theme-grad-start)", display: "flex", flexShrink: 0, transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E05A3A"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1C24"; }}>
              <X size={9} />
            </button>
          </div>
        ))}
        {strikes.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 10, color: "var(--theme-grad-start)", letterSpacing: "0.1em" }}>
            All clear, Chairman.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Personal Life Quadrants ──────────────────────────────────────────────────

function DomainBlock({
  label, sub, tasks, color, icon, onToggle, onDelete, onTaskClick, subtasksMap, onToggleSubtask
}: { label: string; sub: string; tasks: DbTask[]; color: string; icon?: React.ReactNode; onToggle: (id: string) => void; onDelete: (id: string) => void; onTaskClick: (task: DbTask, color: string) => void; subtasksMap?: any; onToggleSubtask?: (taskId: string, subtaskId: string) => void; }) {
  const doneCount = tasks.filter((t) => t.status === "DONE" || (t as any).completed).length;
  const total     = tasks.length;
  const pct       = total > 0 ? (doneCount / total) * 100 : 0;
  
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-serif text-[12px] text-themeAccent tracking-[0.04em]">{label}</span>
        <div className="flex-1" />
        <span className="text-[7px] tracking-[0.16em] uppercase text-zinc-400 dark:text-[#252836]">{sub}</span>
      </div>
      
      {/* Domain Progress Bar */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="text-[7px] tracking-[0.18em] uppercase text-themeAccent">Tasks</span>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 10, color: color, fontVariantNumeric: "tabular-nums", fontFamily: "Georgia, serif" }}>{doneCount}</span>
          <span style={{ fontSize: 7, color: "var(--theme-grad-start)" }}>/{total}</span>
        </div>
      </div>
      <div style={{ height: 1.5, backgroundColor: "#1E1F24", borderRadius: 2, marginBottom: 8, flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 2, opacity: 0.65, transition: "width 0.6s ease" }} />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 min-h-0">
          {tasks.map((t) => (
            <div key={t.id} className={`flex items-center gap-1.5 p-1.5 rounded-md border ${t.status === "DONE" || (t as any).completed ? "opacity-40 border-transparent" : "bg-zinc-100/10 dark:bg-black/20 border-zinc-200/20 dark:border-white/5"}`}>
              <button onClick={(e) => { e.stopPropagation(); onToggle(t.id); }} className="bg-none border-none cursor-pointer p-0 text-themeAccent shrink-0 flex">
                {t.status === "DONE" || (t as any).completed ? <CheckCircle2 size={10} /> : <Circle size={10} />}
              </button>
              <span className={`flex-1 text-[10px] text-themeAccent overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:underline flex items-center justify-between ${t.status === "DONE" || (t as any).completed ? "line-through" : ""}`} onClick={() => onTaskClick(t, color)}>
                <span className="flex items-center gap-1.5 truncate">
                  {t.title}
                  {t.priority && t.priority !== "None" && (
                    <Flag size={8} color={t.priority === "Urgent" ? "#E05A3A" : t.priority === "High" ? "#EAB308" : t.priority === "Normal" ? "#3B82F6" : "#9CA3AF"} />
                  )}
                </span>
                {t.dueDate && (
                  <span className="text-[8px] text-zinc-500 shrink-0 ml-2 opacity-70">{new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                )}
              </span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="bg-none border-none cursor-pointer p-0 text-themeAccent flex shrink-0 hover:text-[#E05A3A]">
                <X size={9} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-[9px] text-themeAccent py-2 tracking-[0.08em]">
              All clear.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── C-Suite Command Card ─────────────────────────────────────────────────────

function CSuiteCard({
  agent, onToggle, onDelete, onTaskClick, subtasksMap, onToggleSubtask, onDeleteSubtask
}: {
  agent: Agent;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: DbTask, color: string) => void;
  subtasksMap?: Record<string, DbTask[]>;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask?: (id: string) => void;
}) {
  const done      = agent.tasks.filter((t) => t.status === "DONE" || (t as any).completed).length;
  const total     = agent.tasks.length;
  const pct       = total > 0 ? (done / total) * 100 : 0;
  
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full w-full text-left flex flex-col overflow-hidden">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div className="flex items-center gap-2">
            {agent.icon}
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: agent.color, lineHeight: 1 }}>{agent.title}</div>
          </div>
          <div style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--theme-grad-start)", marginTop: 3 }}>{agent.role}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 16, color: agent.color, fontVariantNumeric: "tabular-nums", fontFamily: "Georgia, serif" }}>{done}</span>
          <span style={{ fontSize: 9, color: "var(--theme-grad-start)" }}>/{total}</span>
        </div>
      </div>
      <div style={{ height: 1.5, backgroundColor: "#1E1F24", borderRadius: 2, marginBottom: 8, flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: agent.color, borderRadius: 2, opacity: 0.65, transition: "width 0.6s ease" }} />
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 mt-2 pr-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {agent.tasks.length > 0 ? agent.tasks.map((t) => {
          const subs = subtasksMap ? subtasksMap[t.id] ?? [] : [];
          const isExpanded = !!expandedIds[t.id];
          return (
            <div key={t.id} className="flex flex-col mb-2 w-full">
              {/* Parent Task Row */}
              <div className="flex flex-row items-start gap-2 w-full bg-white/5 dark:bg-black/20 border border-zinc-200/20 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-colors p-1.5 rounded cursor-pointer" onClick={() => onTaskClick(t, agent.color)}>
                {/* Uncrushable Chevron Box */}
                <div className="w-6 min-w-[24px] flex items-center justify-center shrink-0 pt-0.5">
                  {subtasksMap && subtasksMap[t.id] && subtasksMap[t.id].length > 0 ? (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleExpand(t.id); }}
                      className="p-1 hover:bg-zinc-500/20 rounded text-zinc-400 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                
                {/* Checkbox & Title */}
                <div className="shrink-0 pt-1">
                  <button onClick={(e) => { e.stopPropagation(); onToggle(t.id); }} className="text-zinc-500 hover:text-[color:var(--theme-grad-start)] transition-colors p-0 border-none bg-none flex shrink-0">
                    {t.status === "DONE" || (t as any).completed ? <CheckCircle2 size={12} className="text-themeAccent" /> : <Circle size={12} />}
                  </button>
                </div>
                <div className="shrink-0 pt-[6px] hidden">
                </div>
                <span className={`flex-1 text-sm leading-tight pt-[3px] flex items-center justify-between ${t.status === "DONE" || (t as any).completed ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>
                  <span className="flex items-center gap-2 truncate">
                    {t.title}
                    {t.priority && t.priority !== "None" && (
                      <Flag size={10} color={t.priority === "Urgent" ? "#E05A3A" : t.priority === "High" ? "#EAB308" : t.priority === "Normal" ? "#3B82F6" : "#9CA3AF"} />
                    )}
                  </span>
                  {t.dueDate && (
                    <span className="text-xs text-zinc-500 shrink-0 ml-2">{new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  )}
                </span>
              </div>

              {/* Nested Subtasks */}
              {isExpanded && subtasksMap && subtasksMap[t.id] && subtasksMap[t.id].length > 0 && (
                <div className="ml-8 pl-4 border-l border-zinc-500/30 flex flex-col gap-2 mt-2">
                  {subtasksMap[t.id].map(sub => (
                    <div key={sub.id} className="flex flex-row items-start gap-2 group p-1">
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          if (onToggleSubtask) onToggleSubtask(t.id, sub.id); 
                        }} 
                        className="shrink-0 pt-0.5 cursor-pointer flex items-center justify-center hover:opacity-70 transition-opacity"
                      >
                        {sub.status === "DONE" ? <CheckCircle2 className="w-4 h-4 text-themeAccent" /> : <Circle className="w-4 h-4 text-zinc-500" />}
                      </button>
                      <span className={`text-sm flex-1 pt-0.5 leading-tight ${sub.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-400"}`}>{sub.title}</span>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteSubtask && onDeleteSubtask(sub.id); }} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all shrink-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <span style={{ fontSize: 9, color: "var(--theme-grad-start)", letterSpacing: "0.1em" }}>All clear</span>
          </div>
        )}
      </div>
      <div style={{ marginTop: 6, fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--theme-grad-start)", flexShrink: 0 }}>
        {agent.tasks.length - done} pending · {pct.toFixed(0)}% done
      </div>
    </div>
  );
}

// ─── KPI Tab ──────────────────────────────────────────────────────────────────

function KPITab() {
  const PANEL_CLASS = "bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:shadow-[0_0_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.04)] transition-shadow duration-500";
  const PANEL: React.CSSProperties = { borderRadius: 10, padding: "24px", overflow: "hidden", minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[calc(100vh-6rem)] gap-4" style={{ animation: "tab-in 0.22s ease-out" }}>
      <SectionLabel>Key Performance Indicators</SectionLabel>
      <div style={PANEL} className={`${PANEL_CLASS} flex-1`}>
        <div className="flex items-center justify-center h-full">
          <span className="text-sm tracking-widest text-zinc-500 uppercase">KPI Dashboard Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

// ─── Master View Tab (One-Pager Command Center) ───────────────────────────────

function MasterViewTab({
  business, personal, calConnected, calendarEvents, calLoading, calError, onToggle, onDelete, onTaskClick, subtasksMap, onToggleSubtask, isArchive
}: {
  business:       Agent[];
  personal:       Agent[];
  calConnected:   boolean;
  calendarEvents: CalendarEvent[];
  calLoading:     boolean;
  calError:       string | null;
  onToggle:       (taskId: string) => void;
  onDelete:       (taskId: string) => void;
  onTaskClick:    (task: DbTask, color: string) => void;
  subtasksMap?:   any;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  isArchive?:     boolean;
}) {
  const wealthTasks = personal.find((a) => a.id === "wealth")?.tasks ?? [];
  const healthTasks = personal.find((a) => a.id === "health")?.tasks ?? [];
  const relateTasks = personal.find((a) => a.id === "relate")?.tasks ?? [];
  const joyTasks    = personal.find((a) => a.id === "joy")?.tasks ?? [];

  const PANEL_CLASS = "bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:shadow-[0_0_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.04)] transition-shadow duration-500";
  const PANEL: React.CSSProperties = {
    borderRadius:    10,
    padding:         "14px 16px",
    overflow:        "hidden",
    minHeight:       0,
    minWidth:        0,
  };
  const CAL_PANEL: React.CSSProperties = { ...PANEL, overflowY: "auto" };

  return (
    <div className={`flex flex-col ${isArchive ? '' : 'lg:flex-row'} gap-6 w-full min-h-max`}>
      {/* ── Left Column ──────────────────────────────────────────────────── */}
      <div className={`flex flex-col w-full ${isArchive ? '' : 'lg:w-1/3'} min-h-full gap-4 pb-6 pr-1`}>
        <div style={{ ...PANEL, maxHeight: isArchive ? "none" : "250px", overflowY: "auto", flexShrink: 0 }} className={PANEL_CLASS}>
          <PriorityStrikes business={business} personal={personal} onToggle={onToggle} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} />
        </div>
        {!isArchive && (
          <div style={{ ...CAL_PANEL, minHeight: 0 }} className={`${PANEL_CLASS} flex-1 min-h-[500px] flex flex-col`}>
            <CalendarFeed calConnected={calConnected} events={calendarEvents} calLoading={calLoading} calError={calError} />
          </div>
        )}
      </div>

      {/* ── Right Column / Grid ────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 ${isArchive ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-4 w-full ${isArchive ? '' : 'lg:w-2/3'} pb-8 grid-rows-[repeat(5,minmax(220px,auto))] pr-1`}>
        {/* Domain Cards */}
        <div style={PANEL} className={`${PANEL_CLASS} h-full w-full flex flex-col`}><DomainBlock label="WEALTH" sub="Income & Freedom" tasks={wealthTasks} color={personal.find(a => a.id === "wealth")?.color || "#C9A961"} icon={personal.find(a => a.id === "wealth")?.icon} onToggle={onToggle} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} /></div>
        <div style={PANEL} className={`${PANEL_CLASS} h-full w-full flex flex-col`}><DomainBlock label="HEALTH" sub="Training & Energy" tasks={healthTasks} color={personal.find(a => a.id === "health")?.color || "#C9A961"} icon={personal.find(a => a.id === "health")?.icon} onToggle={onToggle} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} /></div>
        <div style={PANEL} className={`${PANEL_CLASS} h-full w-full flex flex-col`}><DomainBlock label="RELATIONSHIPS" sub="Legacy & Pack" tasks={relateTasks} color={personal.find(a => a.id === "relate")?.color || "#C9A961"} icon={personal.find(a => a.id === "relate")?.icon} onToggle={onToggle} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} /></div>
        <div style={PANEL} className={`${PANEL_CLASS} h-full w-full flex flex-col`}><DomainBlock label="JOY" sub="Goals & Happiness" tasks={joyTasks} color={personal.find(a => a.id === "joy")?.color || "#C9A961"} icon={personal.find(a => a.id === "joy")?.icon} onToggle={onToggle} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} /></div>

        {/* Executive Suite */}
        {business.map((a) => (
          <div key={a.id} style={PANEL} className={`${PANEL_CLASS} h-full w-full flex flex-col`}>
            <CSuiteCard agent={a} onToggle={onToggle} onDelete={onDelete} onTaskClick={onTaskClick} subtasksMap={subtasksMap} onToggleSubtask={onToggleSubtask} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deep Work Mode ───────────────────────────────────────────────────────────

function DeepWorkMode({
  business,
  personal,
  onComplete,
  onExit,
}: {
  business:   Agent[];
  personal:   Agent[];
  onComplete: (taskId: string) => void;
  onExit:     () => void;
}) {
  const priority = getHighestPriorityTask(business, personal);

  return (
    <div style={{
      position:        "fixed",
      inset:           0,
      zIndex:          200,
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         40,
      animation:       "deep-enter 0.4s ease-out",
    }} className="bg-slate-50 dark:bg-[#000000]">
      {/* Exit */}
      <button
        onClick={onExit}
        style={{ position: "absolute", top: 28, right: 32, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, backgroundColor: "transparent", border: "1px solid #1A1A1A", color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", transition: "all 0.2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#666"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A1A1A"; (e.currentTarget as HTMLButtonElement).style.color = "#333"; }}
      >
        <X size={11} /> EXIT DEEP WORK
      </button>

      {/* Header badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 56 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundImage: 'linear-gradient(to right, var(--theme-grad-start), var(--theme-grad-end))', animation: "deep-cursor 1.2s ease-in-out infinite" }} />
        <span style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase" }} className="text-zinc-600 dark:text-[#333]">
          Deep Work · Dopamine Detox Active
        </span>
      </div>

      {priority ? (
        <div style={{ maxWidth: 780, width: "100%", textAlign: "center" }}>
          {/* Agent label */}
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--theme-grad-start)", textTransform: "uppercase", marginBottom: 20 }}>
            {priority.agent.title} · {priority.agent.role} · Current Priority
          </div>

          {/* THE TASK — massive */}
          <div className="deep-work-title" style={{
            fontFamily:    "Georgia, serif",
            fontSize:      "clamp(28px, 5vw, 56px)",
            fontWeight:    700,
            color: "var(--theme-grad-start)",
            lineHeight:    1.25,
            letterSpacing: "-0.01em",
            marginBottom:  56,
          }}>
            {priority.task.title}
            <span style={{ animation: "deep-cursor 1s step-end infinite", color: priority.agent.color }}>_</span>
          </div>

          {/* Complete button */}
          <button
            onClick={() => onComplete(priority.task.id)}
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             10,
              padding:         "16px 36px",
              borderRadius:    8,
              backgroundColor: "transparent",
              border:          `1px solid ${priority.agent.color}60`,
              color:           priority.agent.color,
              fontSize:        12,
              fontWeight:      700,
              letterSpacing:   "0.22em",
              cursor:          "pointer",
              transition:      "all 0.2s",
              textTransform:   "uppercase",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.backgroundColor = `${priority.agent.color}15`;
              b.style.borderColor = priority.agent.color;
              b.style.boxShadow = `0 0 32px ${priority.agent.color}30`;
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.backgroundColor = "transparent";
              b.style.borderColor = `${priority.agent.color}60`;
              b.style.boxShadow = "none";
            }}
          >
            <CheckCheck size={16} />
            Complete Task
          </button>

          {/* Task position */}
          <div style={{ marginTop: 32, fontSize: 10, letterSpacing: "0.15em", color: "var(--theme-grad-start)", textTransform: "uppercase" }}>
            {business.concat(personal).reduce((s, a) => s + a.tasks.filter(t => t.status !== "DONE").length, 0)} tasks remaining across all agents
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 36, color: "var(--theme-grad-start)", marginBottom: 16 }}>
            All tasks complete.
          </div>
          <div style={{ fontSize: 12, color: "#333", letterSpacing: "0.1em" }}>
            Excellent work, Chairman.
          </div>
          <button onClick={onExit} style={{ marginTop: 40, padding: "12px 28px", borderRadius: 6, border: "1px solid #333", backgroundColor: "transparent", color: "#666", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer" }}>
            RETURN TO COMMAND
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle theme"
      className="flex items-center justify-center w-[30px] h-[30px] rounded-md bg-transparent border border-zinc-200 dark:border-[#1E1F24] text-zinc-600 dark:text-[#3B4558] hover:border-zinc-400 dark:hover:border-transparent [background:linear-gradient(var(--bg-white/80 dark:bg-black/60 backdrop-blur-xl),var(--bg-white/80 dark:bg-black/60 backdrop-blur-xl))_padding-box,linear-gradient(to_right,var(--theme-grad-start),var(--theme-grad-end))_border-box]/35 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white bg-clip-text bg-theme-gradient transition-all duration-200 shrink-0"
    >
      {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  );
}

// ─── Archive View ─────────────────────────────────────────────────────────────

function ArchiveViewTab({ archivedBusiness, archivedPersonal, subtasksMap, onToggle, onDelete, onTaskClick, onToggleSubtask, onPurge }: any) {
  return (
    <div className="flex flex-col gap-6 h-full w-full">
      <div className="text-center pb-4 border-b border-zinc-200/20 dark:border-white/10 mb-2 mt-4 relative">
        <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-zinc-500">ARCHIVED MISSIONS</h2>
        <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest">COMPLETED LOG</p>
        <button 
          onClick={() => onPurge()}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Clear Archive
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MasterViewTab 
          business={archivedBusiness} 
          personal={archivedPersonal} 
          calConnected={false} 
          calendarEvents={[]} 
          calLoading={false} 
          calError={null} 
          onToggle={onToggle} 
          onDelete={onDelete} 
          onTaskClick={onTaskClick} 
          subtasksMap={subtasksMap} 
          onToggleSubtask={onToggleSubtask} 
          isArchive={true}
        />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ChairmanDashboard() {
  const { data: session } = useSession();
  const calConnected = !!(session as any)?.accessToken;
  const { theme, setTheme } = useTheme();
  const user = session?.user;

  const [mounted,      setMounted]      = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeTab,    setActiveTab]    = useState<TabId>("MASTER");
  const [deepWork,     setDeepWork]     = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ task: DbTask; color: string } | null>(null);

  // ── Calendar state ─────────────────────────────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calLoading,     setCalLoading]     = useState(false);
  const [calError,       setCalError]       = useState<string | null>(null);

  useEffect(() => {
    if (!calConnected) { setCalendarEvents([]); setCalError(null); return; }
    setCalLoading(true);
    setCalError(null);
    fetch("/api/calendar")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log("Fetched Calendar Data:", data);
        if (data.error) throw new Error(data.error);
        setCalendarEvents(data.events ?? []);
      })
      .catch((err) => {
        console.error("Calendar fetch error:", err);
        setCalError(err?.message ?? "Calendar fetch failed");
      })
      .finally(() => setCalLoading(false));
  }, [calConnected]);

  // ── Supabase task state ────────────────────────────────────────────────────
  const [dbTasks,      setDbTasks]      = useState<DbTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsMissionControlOpen(true);
    window.addEventListener("openMissionControl", handleOpen);
    return () => window.removeEventListener("openMissionControl", handleOpen);
  }, []);

  // Split tasks into active and archived streams
  const normalizedTasks = useMemo(() => (dbTasks || []).map(t => ({
    ...t,
    completed: (t as any).completed || t.status === 'DONE' || t.status === 'ARCHIVED'
  })), [dbTasks]);

  const activeTasks = useMemo(() => (normalizedTasks || []).filter((t) => !t.completed), [normalizedTasks]);
  const archivedTasks = useMemo(() => (normalizedTasks || []).filter((t) => t.completed), [normalizedTasks]);

  // Top-level tasks only (parentId is null/undefined) for agent task lists
  const business = useMemo(
    () => AGENT_META_BUSINESS.map((a) => ({ ...a, tasks: activeTasks.filter((t) => (t.agentId?.toUpperCase() === a.id.toUpperCase() || t.category?.toUpperCase() === a.id.toUpperCase()) && !t.parentId) })),
    [activeTasks]
  );
  const personal = useMemo(
    () => AGENT_META_PERSONAL.map((a) => ({ ...a, tasks: activeTasks.filter((t) => (t.agentId?.toUpperCase() === a.id.toUpperCase() || t.pillar?.toUpperCase() === a.id.toUpperCase() || t.category?.toUpperCase() === a.id.toUpperCase()) && !t.parentId) })),
    [activeTasks]
  );
  
  const archivedBusiness = useMemo(
    () => AGENT_META_BUSINESS.map((a) => ({ ...a, tasks: archivedTasks.filter((t) => (t.agentId?.toUpperCase() === a.id.toUpperCase() || t.category?.toUpperCase() === a.id.toUpperCase()) && !t.parentId) })),
    [archivedTasks]
  );
  const archivedPersonal = useMemo(
    () => AGENT_META_PERSONAL.map((a) => ({ ...a, tasks: archivedTasks.filter((t) => (t.agentId?.toUpperCase() === a.id.toUpperCase() || t.pillar?.toUpperCase() === a.id.toUpperCase() || t.category?.toUpperCase() === a.id.toUpperCase()) && !t.parentId) })),
    [archivedTasks]
  );

  // Subtasks map: parentId → subtask[]
  const subtasksMap = useMemo(() => {
    const map: Record<string, DbTask[]> = {};
    activeTasks.filter((t) => t.parentId).forEach((t) => {
      if (!map[t.parentId!]) map[t.parentId!] = [];
      map[t.parentId!].push(t);
    });
    return map;
  }, [activeTasks]);
  
  const archivedSubtasksMap = useMemo(() => {
    const map: Record<string, DbTask[]> = {};
    archivedTasks.filter((t) => t.parentId).forEach((t) => {
      if (!map[t.parentId!]) map[t.parentId!] = [];
      map[t.parentId!].push(t);
    });
    return map;
  }, [archivedTasks]);

  // Load tasks on mount
  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { 
        if (data.tasks) {
          const fetchedTasks = data.tasks;
          const parent = fetchedTasks.find((t: DbTask) => t.title.toLowerCase().includes("getting the second plan")) || fetchedTasks[0];
          if (parent) {
            // Inject mock subtasks for demonstration
            fetchedTasks.push(
              { id: 'mock-s1', title: 'Review Q3 metrics', pillar: parent.pillar, agentId: parent.agentId, category: parent.category, status: 'PENDING', isDelegated: false, createdAt: new Date().toISOString(), priority: "Normal", timeTracked: 0, parentId: parent.id },
              { id: 'mock-s2', title: 'Draft email', pillar: parent.pillar, agentId: parent.agentId, category: parent.category, status: 'PENDING', isDelegated: false, createdAt: new Date().toISOString(), priority: "Normal", timeTracked: 0, parentId: parent.id }
            );
          }
          setDbTasks(fetchedTasks);
        }
      })
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, []);

  // ── Command bar ────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>("CEO");
  const [cmdValue,      setCmdValue]      = useState("");
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [cmdFocused,    setCmdFocused]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: "assign" | "delegate" | "schedule" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  // ── Progress ───────────────────────────────────────────────────────────────
  const parentTasks = dbTasks.filter((t) => !t.parentId);
  const subTasks = dbTasks.filter((t) => t.parentId);
  const totalTasks = parentTasks.length;
  const doneTasks  = parentTasks.filter((t) => t.status === "DONE").length;
  const overallPct = totalTasks > 0 ? doneTasks / totalTasks : 0;

  const totalSubtasks = subTasks.length;
  const doneSubtasks = subTasks.filter((t) => t.status === "DONE").length;
  const subtasksPct = totalSubtasks > 0 ? doneSubtasks / totalSubtasks : 0;

  // ── Toggle task via PATCH ──────────────────────────────────────────────────
  const toggleTask = useCallback(async (taskId: string) => {
    const task = dbTasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "DONE" ? "PENDING" : "DONE";

    // Optimistic update
    setDbTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch("/api/tasks", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: taskId, status: newStatus }),
      });
    } catch {
      // Revert on failure
      setDbTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }, [dbTasks]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    return toggleTask(subtaskId);
  }, [toggleTask]);

  const deleteTask = useCallback(async (taskId?: string, bulkArchive?: boolean) => {
    if (bulkArchive) {
      setDbTasks((prev) => prev.filter((t) => !t.completed && t.status !== "DONE" && t.status !== "ARCHIVED"));
      try {
        await fetch("/api/tasks?deleteAllArchived=true", { method: "DELETE" });
      } catch {}
      return;
    }
    if (!taskId) return;
    
    // Optimistically remove task + its subtasks from state
    setDbTasks((prev) => prev.filter((t) => t.id !== taskId && t.parentId !== taskId));
    try {
      await fetch(`/api/tasks?id=${taskId}`, {
        method:  "DELETE",
      });
    } catch {
      // Silent failure — task already removed from UI
    }
  }, []);

  const addSubtask = useCallback(async (parentId: string, title: string) => {
    const parent = dbTasks.find((t) => t.id === parentId);
    if (!parent) return;
    const taskPriority = detectPriority(title);
    const tempId       = `temp-sub-${Date.now()}`;
    const optimistic: DbTask = {
      id: tempId, title, pillar: parent.pillar, agentId: parent.agentId,
      category: parent.category, status: "PENDING", isDelegated: false,
      createdAt: new Date().toISOString(), priority: taskPriority, parentId,
      timeTracked: 0,
    };
    setDbTasks((prev) => [...prev, optimistic]);
    try {
      const res  = await fetch("/api/tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title, pillar: parent.pillar, agentId: parent.agentId,
          category: parent.category, status: "PENDING", isDelegated: false,
          priority: taskPriority, parentId,
        }),
      });
      const data = await res.json();
      if (data.task) setDbTasks((prev) => prev.map((t) => t.id === tempId ? data.task : t));
    } catch {
      setDbTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }, [dbTasks]);

  const handleDeepWorkComplete = (taskId: string) => toggleTask(taskId);

  const handleTaskSave = async (id: string, updates: any) => {
    setDbTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch {}
  };

  const handleTaskClick = useCallback((task: DbTask, color: string) => {
    setSelectedTask({ task, color });
  }, []);

  // ── Command submit (DB-first: render only after server confirms) ───────────
  const handleSubmit = useCallback(() => {
    const text = cmdValue.trim();
    if (!text || isProcessing) return;

    setCmdValue("");
    setIsProcessing(true);

    const cat = CATEGORIES[selectedCategory];
    setProcessingMsg(`Saving to ${cat.label}…`);

    const doSubmit = async () => {
      const taskPriority = detectPriority(text);
      try {
        const res  = await fetch("/api/tasks", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            title: text, pillar: cat.pillar, agentId: cat.agentId,
            category: selectedCategory, status: "PENDING", isDelegated: false, priority: taskPriority, parentId: null,
          }),
        });
        const data = await res.json();
        if (data.task) {
          setDbTasks((prev) => [...prev, data.task]);
          setToast({ msg: `Saved to ${cat.label}`, type: "assign" });
        } else {
          const errMsg = data.detail ? `${data.error}: ${data.detail}` : (data.error ?? "Save failed — check Vercel logs.");
          setToast({ msg: errMsg, type: "schedule" });
        }
      } catch (fetchErr) {
        console.error("Task POST fetch error:", fetchErr);
        setToast({ msg: "Network error — task not saved.", type: "schedule" });
      }
      setIsProcessing(false);
      setProcessingMsg("");
    };

    doSubmit();
  }, [cmdValue, isProcessing, selectedCategory]);

  const TABS: { id: TabId; label: string }[] = [
    { id: "MASTER",   label: "MASTER VIEW" },
    { id: "BUSINESS", label: "BUSINESS" },
    { id: "PERSONAL", label: "PERSONAL" },
  ];

  const pendingSubtasksCount = (activeTasks || []).reduce((total, task) => {
    const taskSubtasks = (subtasksMap && subtasksMap[task.id]) ? subtasksMap[task.id] : [];
    const activeTaskSubtasks = taskSubtasks.filter(st => !st.completed && st.status !== 'DONE' && st.status !== 'ARCHIVED');
    return total + activeTaskSubtasks.length;
  }, 0);

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white flex flex-row">
      <style>{KEYFRAMES}</style>

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        calConnected={calConnected} 
        onCalToggle={() => calConnected ? signOut({ redirect: false }) : signIn("google")}
        isAppearanceOpen={isAppearanceOpen} 
        setIsAppearanceOpen={setIsAppearanceOpen} 
        activeTasksCount={(activeTasks || []).filter(t => !t.parentId).length}
        activeSubtasksCount={pendingSubtasksCount}
        tasksLoading={tasksLoading}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
      />

      <div className="flex-1 flex flex-col ml-64 min-w-0">

      {/* ── DEEP WORK OVERLAY ─────────────────────────────────────────────── */}
      {deepWork && (
        <DeepWorkMode
          business={business}
          personal={personal}
          onComplete={handleDeepWorkComplete}
          onExit={() => setDeepWork(false)}
        />
      )}



      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main
        className="main-px flex-1 h-screen overflow-y-auto overflow-x-hidden relative"
        style={(activeTab === "MASTER" || activeTab === "ARCHIVE") ? {
          paddingLeft:    32,
          paddingRight:   32,
          paddingTop:     10,
          paddingBottom:  66,
          display:        "flex",
          flexDirection:  "column",
          boxSizing:      "border-box" as const,
        } : {
          paddingLeft:   32,
          paddingRight:  32,
          paddingTop:    24,
          paddingBottom: 148,
        }}
      >
        {activeTab === "MASTER"   && <MasterViewTab key="master"   business={business} personal={personal} calConnected={calConnected} calendarEvents={calendarEvents} calLoading={calLoading} calError={calError} onToggle={toggleTask} onDelete={deleteTask} onTaskClick={handleTaskClick} subtasksMap={subtasksMap} onToggleSubtask={toggleSubtask} />}
        {activeTab === "ARCHIVE"  && <ArchiveViewTab key="archive" archivedBusiness={archivedBusiness} archivedPersonal={archivedPersonal} subtasksMap={archivedSubtasksMap} onToggle={toggleTask} onDelete={deleteTask} onTaskClick={handleTaskClick} onToggleSubtask={toggleSubtask} onPurge={() => deleteTask(undefined, true)} />}
        {activeTab === "BUSINESS" && <BusinessTab   key="business" agents={business} onToggle={(_, taskId) => toggleTask(taskId)} onDelete={deleteTask} onTaskClick={handleTaskClick} subtasksMap={subtasksMap} onToggleSubtask={toggleSubtask} />}
        {activeTab === "PERSONAL" && <PersonalTab   key="personal" agents={personal} onToggle={(_, taskId) => toggleTask(taskId)} onDelete={deleteTask} onTaskClick={handleTaskClick} subtasksMap={subtasksMap} onToggleSubtask={toggleSubtask} />}
        {activeTab === "KPI"      && <KPITab        key="kpi" />}
      </main>

      {/* ── TASK DETAIL MODAL ─────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask.task}
          agentColor={selectedTask.color}
          onClose={() => setSelectedTask(null)}
          onSave={handleTaskSave}
          onToggleSubtask={toggleTask}
          onDeleteSubtask={deleteTask}
          onAddSubtask={addSubtask}
          subtasks={subtasksMap[selectedTask.task.id] ?? []}
        />
      )}

      {/* ── TOAST (primary) ───────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 96, left: "50%", zIndex: 60, animation: "toast-slide 0.28s ease-out", pointerEvents: "none" }}>
          <div style={{ transform: "translateX(-50%)", backgroundColor: "#0E0F14", border: `1px solid ${toast.type === "delegate" || toast.type === "schedule" ? "rgba(74,144,226,0.35)" : "rgba(59,130,246,0.32)"}`, borderRadius: 8, padding: "11px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.7)", whiteSpace: "nowrap" }}>
            {toast.type === "delegate" || toast.type === "schedule"
              ? <CalendarDays size={13} style={{ color: "var(--theme-grad-start)", flexShrink: 0 }} />
              : <CheckCheck size={13} style={{ color: "var(--theme-grad-start)", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 11, color: toast.type === "delegate" || toast.type === "schedule" ? "#4A90E2" : "#C9A961", letterSpacing: "0.05em", fontWeight: 600 }}>
              {toast.type === "delegate" ? "Claude Agent:" : toast.type === "schedule" ? "Google Calendar:" : "Task processed:"}
            </span>
            <span style={{ fontSize: 11, letterSpacing: "0.02em" }} className="text-zinc-500 dark:text-zinc-400">
              {toast.msg}
            </span>
          </div>
        </div>
      )}


      {/* ── COGNITIVE COMMAND BAR ─────────────────────────────────────────── */}
      <div style={{
        position:        "fixed",
        bottom:          0,
        left:            "16rem",
        right:           0,
        zIndex:          50,
        borderTop:       `1px solid ${cmdFocused ? "rgba(59,130,246,0.32)" : "transparent"}`,
        boxShadow:       cmdFocused ? "0 -4px 40px rgba(59,130,246,0.09)" : "none",
        transition:      "border-color 0.25s, box-shadow 0.25s",
        animation:       !cmdFocused ? "cmd-breathe 5s ease-in-out infinite" : "none",
      }} className={`bg-zinc-50/70 dark:bg-black/40 backdrop-blur-xl ${!cmdFocused ? "border-t border-zinc-200 dark:border-[#1A1B22]" : ""}`}>
        <div className="max-w-[1440px] mx-auto px-8" style={{ paddingTop: 11, paddingBottom: 13 }}>
          <div className="flex items-center gap-4">

            {/* Category selector */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
              {Object.entries(CATEGORIES).map(([key, meta]) => {
                const active = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className="border rounded-md"
                    style={{
                      padding:         "4px 9px",
                      fontSize:        8,
                      fontWeight:      700,
                      letterSpacing:   "0.16em",
                      textTransform:   "uppercase",
                      cursor:          "pointer",
                      backgroundColor: active ? `${meta.color}14` : "transparent",
                      color:           active ? meta.color : "#2A3040",
                      borderColor:     active ? meta.color : "transparent",
                      boxShadow:       active ? `0 0 12px ${meta.color}80, inset 0 0 4px ${meta.color}40` : "none",
                      transition:      "all 0.3s ease-in-out",
                      whiteSpace:      "nowrap",
                    }}
                    onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = `${meta.color}33`; (e.currentTarget as HTMLButtonElement).style.color = `${meta.color}99`; } }}
                    onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#2A3040"; } }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div style={{ width: 1, height: 18, backgroundColor: "#1E1F24", flexShrink: 0 }} />

            {/* Input */}
            <input
              ref={inputRef}
              value={cmdValue}
              onChange={(e) => setCmdValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              onFocus={() => setCmdFocused(true)}
              onBlur={() => setCmdFocused(false)}
              disabled={isProcessing}
              placeholder="Feed raw data to the AI array (Tasks, thoughts, calendar events)..."
              style={{
                flex:            1,
                backgroundColor: "transparent",
                border:          "none",
                outline:         "none",
                color: "#F4F4F5",
                fontSize:        13,
                letterSpacing:   "0.02em",
                fontFamily:      "inherit",
                opacity:         isProcessing ? 0.3 : 1,
                transition:      "opacity 0.2s",
              }}
            />

            {/* Processing or Deploy */}
            {isProcessing ? (
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={13} className="text-zinc-900 dark:text-white animate-spin" />
                <span className="cmd-bar-msg text-zinc-500 dark:text-zinc-400" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {processingMsg}
                </span>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!cmdValue.trim()}
                style={{
                  flexShrink:      0,
                  display:         "flex",
                  alignItems:      "center",
                  gap:             6,
                  padding:         "7px 14px",
                  borderRadius:    6,
                  backgroundColor: cmdValue.trim() ? "rgba(59,130,246,0.1)"  : "transparent",
                  border:          `1px solid ${cmdValue.trim() ? "rgba(59,130,246,0.3)" : "#1E1F24"}`,
                  color:           cmdValue.trim() ? "#C9A961" : "#252836",
                  fontSize:        10,
                  fontWeight:      700,
                  letterSpacing:   "0.18em",
                  cursor:          cmdValue.trim() ? "pointer" : "default",
                  transition:      "all 0.2s",
                  whiteSpace:      "nowrap",
                }}
              >
                <Zap size={11} /> DEPLOY
              </button>
            )}

            <span className="text-zinc-500 dark:text-zinc-400" style={{ fontSize: 10, flexShrink: 0, letterSpacing: "0.06em" }}>↵</span>
          </div>
        </div>
      </div>
        {isMissionControlOpen && (
          <MissionControlModal 
            tasks={parentTasks} 
            subtasksMap={subtasksMap} 
            onClose={() => setIsMissionControlOpen(false)} 
            onToggle={toggleTask} 
          />
        )}
      </div>
    </div>
  );
}
