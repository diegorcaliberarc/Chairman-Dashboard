"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  Circle,
  Crosshair,
  Zap,
  Sparkles,
  Loader2,
  ChevronRight,
  CheckCheck,
  Brain,
  Bot,
  X,
  CalendarDays,
  Sun,
  Moon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "MASTER" | "BUSINESS" | "PERSONAL";

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
  priority:    number;   // 1=HIGH 2=MEDIUM 3=LOW
  dueDate?:    string | null;
  parentId?:   string | null;
}

interface Agent {
  id:    string;
  title: string;
  role:  string;
  color: string;
  tasks: DbTask[];
}


// ─── Agent Metadata (tasks come from Supabase) ────────────────────────────────

const AGENT_META_BUSINESS = [
  { id: "ceo", title: "CEO", role: "Vision & Strategy",      color: "#C9A961" },
  { id: "coo", title: "COO", role: "Ops & Execution",        color: "#7B9EA8" },
  { id: "cmo", title: "CMO", role: "Growth & Sales",         color: "#A87B9E" },
  { id: "cfo", title: "CFO", role: "Finance & Cash",         color: "#8BA87B" },
  { id: "cto", title: "CTO", role: "APIs & Claude Pipelines",color: "#4A90E2" },
  { id: "cpo", title: "CPO", role: "Product & UX",           color: "#F39C12" },
];

const AGENT_META_PERSONAL = [
  { id: "wealth", title: "WEALTH",        role: "Income & Freedom",        color: "#D4AF37" },
  { id: "health", title: "HEALTH",        role: "Training & Energy",       color: "#E05A3A" },
  { id: "relate", title: "RELATIONSHIPS", role: "Legacy & Pack",           color: "#5B8FB9" },
  { id: "joy",    title: "JOY",           role: "Goals & Happiness",       color: "#B388EB" },
];


// ─── Category → Agent Routing (hardcoded, no guessing) ───────────────────────

const CATEGORIES: Record<string, { label: string; color: string; pillar: string; agentId: string }> = {
  CEO:    { label: "CEO",    color: "#C9A961", pillar: "BUSINESS", agentId: "ceo"    },
  COO:    { label: "COO",    color: "#7B9EA8", pillar: "BUSINESS", agentId: "coo"    },
  CMO:    { label: "CMO",    color: "#A87B9E", pillar: "BUSINESS", agentId: "cmo"    },
  CFO:    { label: "CFO",    color: "#8BA87B", pillar: "BUSINESS", agentId: "cfo"    },
  CTO:    { label: "CTO",    color: "#4A90E2", pillar: "BUSINESS", agentId: "cto"    },
  CPO:    { label: "CPO",    color: "#F39C12", pillar: "BUSINESS", agentId: "cpo"    },
  Wealth: { label: "WEALTH", color: "#D4AF37", pillar: "PERSONAL", agentId: "wealth" },
  Health: { label: "HEALTH", color: "#E05A3A", pillar: "PERSONAL", agentId: "health" },
  Relate: { label: "RELATE", color: "#5B8FB9", pillar: "PERSONAL", agentId: "relate" },
  Joy:    { label: "JOY",    color: "#B388EB", pillar: "PERSONAL", agentId: "joy"    },
};



const HIGH_PRIORITY_KEYWORDS = ["urgent","asap","critical","immediately","top priority","high priority","now","emergency","rush"];
const LOW_PRIORITY_KEYWORDS  = ["low priority","whenever","no rush","eventually","someday","low urgency"];

function detectPriority(text: string): number {
  const lower = text.toLowerCase();
  if (HIGH_PRIORITY_KEYWORDS.some((k) => lower.includes(k))) return 1;
  if (LOW_PRIORITY_KEYWORDS.some((k)  => lower.includes(k))) return 3;
  return 2;
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
    0%,100% { box-shadow: 0 -1px 24px rgba(201,169,97,0.03); }
    50%     { box-shadow: 0 -1px 40px rgba(201,169,97,0.08); }
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

// ─── Live Clock ───────────────────────────────────────────────────────────────

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
    <div className="text-right select-none">
      <div className="font-mono text-sm tracking-wider" style={{ color: "#7A8599", fontVariantNumeric: "tabular-nums" }}>{time}</div>
      <div className="text-[10px] tracking-wider mt-0.5" style={{ color: "#2D3242" }}>{date}</div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-widest uppercase shrink-0" style={{ color: "#3B4558" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "#1E1F24" }} />
      {right && <span className="text-[10px] shrink-0" style={{ color: "#1E2030" }}>{right}</span>}
    </div>
  );
}


// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, selected, onClick }: { agent: Agent; selected: boolean; onClick: () => void }) {
  const done  = agent.tasks.filter((t) => t.status === "DONE").length;
  const total = agent.tasks.length;
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-5 transition-all duration-200 focus:outline-none"
      style={{
        backgroundColor: selected ? `${agent.color}0E` : "#0C0D10",
        border:          `1px solid ${selected ? `${agent.color}48` : "#1E1F24"}`,
        boxShadow:        selected ? `0 0 28px ${agent.color}12` : "none",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: selected ? agent.color : "#4A5068", lineHeight: 1.1, transition: "color 0.2s" }}>
            {agent.title}
          </div>
          <div className="text-[10px] tracking-widest uppercase mt-1" style={{ color: "#252836" }}>
            {agent.role}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-sm font-bold" style={{ color: selected ? agent.color : "#3B4558", fontVariantNumeric: "tabular-nums" }}>
            {done}<span className="text-xs font-normal" style={{ color: "#252836" }}>/{total}</span>
          </span>
          <ChevronRight size={12} style={{ color: selected ? agent.color : "#252836", transform: selected ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }} />
        </div>
      </div>
      <div className="h-px rounded-full" style={{ backgroundColor: "#1E1F24" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, backgroundColor: agent.color, opacity: selected ? 0.65 : 0.28 }} />
      </div>
    </button>
  );
}

// ─── Task Panel ───────────────────────────────────────────────────────────────

function TaskPanel({
  agent, subtasksMap, onToggle, onDelete, onAddSubtask,
}: {
  agent:          Agent;
  subtasksMap:    Record<string, DbTask[]>;
  onToggle:       (taskId: string) => void;
  onDelete:       (taskId: string) => void;
  onAddSubtask:   (parentId: string, title: string) => void;
}) {
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [subInputs,    setSubInputs]    = useState<Record<string, string>>({});
  const done = agent.tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="rounded-xl" style={{ backgroundColor: "#0C0D10", border: `1px solid ${agent.color}30`, padding: "24px", animation: "fade-up 0.22s ease-out" }}>
      <div className="flex items-center gap-3 mb-5">
        <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: agent.color }}>{agent.title}</span>
        <div className="h-3 w-px" style={{ backgroundColor: "#1E1F24" }} />
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#3B4558" }}>{agent.role}</span>
        <div style={{ flex: 1 }} />
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#252836" }}>{done} of {agent.tasks.length} complete</span>
      </div>
      <div className="space-y-1.5">
        {agent.tasks.map((task, i) => {
          const isDone    = task.status === "DONE";
          const subs      = subtasksMap[task.id] ?? [];
          const isExpanded = expandedId === task.id;
          return (
            <div key={task.id}>
              {/* ── Main task row ── */}
              <div
                className="flex items-start gap-2 rounded-lg transition-all duration-150"
                style={{ padding: "9px 10px", backgroundColor: isDone ? `${agent.color}0A` : "transparent", border: `1px solid ${isDone ? `${agent.color}22` : "transparent"}` }}
              >
                {/* Toggle */}
                <button onClick={() => onToggle(task.id)} className="shrink-0 mt-0.5 focus:outline-none" style={{ color: isDone ? agent.color : "#252836", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </button>
                {/* Index */}
                <div className="shrink-0 text-[10px] font-mono tracking-wider mt-0.5" style={{ color: isDone ? agent.color : "#2A3040", minWidth: 18 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                {/* Title */}
                <span className="text-sm leading-relaxed flex-1" style={{ color: isDone ? "#3B4558" : "#7A8599", textDecoration: isDone ? "line-through" : "none", textDecorationColor: agent.color, textDecorationThickness: "1px" }}>
                  {task.title}
                </span>
                {/* Priority dot */}
                {!isDone && (
                  <div className="shrink-0 self-center" style={{
                    width: 6, height: 6, borderRadius: "50%",
                    backgroundColor: task.priority === 1 ? "#E05A3A" : task.priority === 3 ? "#3B4558" : "#C9A961",
                    opacity: task.priority === 3 ? 0.5 : 0.85,
                    flexShrink: 0,
                  }} />
                )}
                {/* Expand subtasks */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  className="shrink-0 self-center focus:outline-none"
                  title={isExpanded ? "Collapse subtasks" : `${subs.length} subtask${subs.length !== 1 ? "s" : ""} · click to expand`}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 4, color: isExpanded ? agent.color : subs.length > 0 ? "#3B4558" : "#1A1C24", fontSize: 9, display: "flex", alignItems: "center", gap: 2, transition: "color 0.15s" }}
                >
                  {subs.length > 0 && <span style={{ fontVariantNumeric: "tabular-nums" }}>{subs.length}</span>}
                  <ChevronRight size={10} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                </button>
                {/* Delete */}
                <button
                  onClick={() => onDelete(task.id)}
                  className="shrink-0 self-center focus:outline-none"
                  title="Delete task"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", borderRadius: 3, color: "#1A1C24", display: "flex", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E05A3A"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1C24"; }}
                >
                  <X size={11} />
                </button>
              </div>

              {/* ── Subtasks area ── */}
              {isExpanded && (
                <div style={{ marginLeft: 24, marginTop: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                  {subs.map((sub) => (
                    <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, backgroundColor: "#080A0D", border: "1px solid #111318" }}>
                      <button onClick={() => onToggle(sub.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0, color: sub.status === "DONE" ? agent.color : "#252836" }}>
                        {sub.status === "DONE" ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                      </button>
                      <span style={{ flex: 1, fontSize: 11, color: sub.status === "DONE" ? "#3B4558" : "#7A8599", textDecoration: sub.status === "DONE" ? "line-through" : "none", textDecorationColor: agent.color }}>{sub.title}</span>
                      <button onClick={() => onDelete(sub.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#1A1C24", display: "flex", flexShrink: 0, transition: "color 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E05A3A"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1C24"; }}>
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                  {/* Add subtask input */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, backgroundColor: "#080A0D", border: `1px solid ${agent.color}18` }}>
                    <div style={{ width: 11, height: 11, flexShrink: 0 }} />
                    <input
                      value={subInputs[task.id] ?? ""}
                      onChange={(e) => setSubInputs((p) => ({ ...p, [task.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (subInputs[task.id] ?? "").trim();
                          if (val) { onAddSubtask(task.id, val); setSubInputs((p) => ({ ...p, [task.id]: "" })); }
                        }
                        if (e.key === "Escape") setExpandedId(null);
                      }}
                      placeholder="+ Add subtask  ↵"
                      style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 11, color: "#7A8599", fontFamily: "inherit", opacity: 0.7 }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {agent.tasks.length === 0 && (
          <div className="text-center py-6" style={{ color: "#252836", fontSize: 11, letterSpacing: "0.1em" }}>
            No tasks yet — add one via the command bar
          </div>
        )}
      </div>
    </div>
  );
}



// ─── Business Tab ─────────────────────────────────────────────────────────────

function BusinessTab({ agents, subtasksMap, onToggle, onDelete, onAddSubtask }: {
  agents:        Agent[];
  subtasksMap:   Record<string, DbTask[]>;
  onToggle:      (agentId: string, taskId: string) => void;
  onDelete:      (taskId: string) => void;
  onAddSubtask:  (parentId: string, title: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("ceo");
  const active = agents.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-6" style={{ animation: "tab-in 0.22s ease-out" }}>
      <SectionLabel>Executive Suite · 6 Agents Active</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} selected={selectedId === a.id}
            onClick={() => setSelectedId(a.id === selectedId ? "" : a.id)} />
        ))}
      </div>
      {active && (
        <TaskPanel
          agent={active}
          subtasksMap={subtasksMap}
          onToggle={(taskId) => onToggle(active.id, taskId)}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      )}
    </div>
  );
}

// ─── Personal Tab ─────────────────────────────────────────────────────────────

function PersonalTab({ agents, subtasksMap, onToggle, onDelete, onAddSubtask }: {
  agents:        Agent[];
  subtasksMap:   Record<string, DbTask[]>;
  onToggle:      (agentId: string, taskId: string) => void;
  onDelete:      (taskId: string) => void;
  onAddSubtask:  (parentId: string, title: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("wealth");
  const active = agents.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-5" style={{ animation: "tab-in 0.22s ease-out" }}>
      <SectionLabel>Personal Power Blocks · 4 Domains</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} selected={selectedId === a.id}
            onClick={() => setSelectedId(a.id === selectedId ? "" : a.id)} />
        ))}
      </div>
      {active && (
        <TaskPanel
          agent={active}
          subtasksMap={subtasksMap}
          onToggle={(taskId) => onToggle(active.id, taskId)}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      )}
    </div>
  );
}

// ─── Calendar Feed (compact one-pager) ───────────────────────────────────────

function CalendarFeed({ calConnected }: { calConnected: boolean }) {
  const [events,      setEvents]      = useState<CalendarEvent[]>([]);
  const [calLoading,  setCalLoading]  = useState(false);
  const [modalDay,    setModalDay]    = useState<{ name: string; date: number; month: string; dateString: string } | null>(null);

  useEffect(() => {
    if (!calConnected) { setEvents([]); return; }
    setCalLoading(true);
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => { if (data.events) setEvents(data.events); })
      .catch(() => {})
      .finally(() => setCalLoading(false));
  }, [calConnected]);

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
          <CalendarDays size={10} style={{ color: "#C9A961" }} />
          <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "#3B4558" }}>Command Calendar</span>
        </div>
        <span style={{ fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: calLoading ? "#4A90E2" : calConnected ? "#8BA87B" : "#252836" }}>
          {calLoading ? "Syncing…" : calConnected ? "● Live" : "○ Not connected"}
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
                backgroundColor: isToday ? "rgba(201,169,97,0.06)" : "transparent",
                border:          isToday ? "1px solid rgba(201,169,97,0.22)" : "1px solid #111318",
                cursor:          "pointer",
                transition:      "border-color 0.15s, background-color 0.15s",
                background:      "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = isToday ? "rgba(201,169,97,0.45)" : "rgba(74,144,226,0.25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = isToday ? "rgba(201,169,97,0.22)" : "#111318"; }}
            >
              <div style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: isToday ? "#C9A961" : "#1A1C28" }}>{d.name}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: isToday ? "#C9A961" : "#1E2030", marginTop: 2, fontWeight: 700 }}>{d.date}</div>
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
      <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1E2030", marginBottom: 6 }}>
        Today · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>

      {/* Today's events — no inner scroll; parent panel scrolls instead */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {todayEvts.length === 0 ? (
          <div style={{ fontSize: 10, color: "#1C1E2A", letterSpacing: "0.08em", padding: "10px 0" }}>
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
              <div key={ev.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 10px", borderRadius: 6, backgroundColor: "rgba(201,169,97,0.04)", border: "1px solid rgba(201,169,97,0.10)" }}>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#C9A961", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{timeStr}</div>
                  {endStr && <div style={{ fontSize: 8, color: "#3B4558", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{endStr}</div>}
                </div>
                <div style={{ width: 1, height: "100%", minHeight: 24, backgroundColor: "rgba(201,169,97,0.18)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#7A8599", flex: 1, lineHeight: 1.4 }}>{ev.summary ?? "Event"}</span>
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
            style={{ backgroundColor: "#0C0D10", border: "1px solid rgba(201,169,97,0.22)", borderRadius: 14, padding: "28px 32px", minWidth: 380, maxWidth: 520, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", animation: "fade-up 0.18s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#C9A961", lineHeight: 1 }}>
                  {modalDay.name} {modalDay.date}
                </div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3B4558", marginTop: 5 }}>
                  {modalDay.month} · {modalEvts.length} event{modalEvts.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setModalDay(null)}
                style={{ background: "none", border: "1px solid #1E1F24", cursor: "pointer", color: "#3B4558", borderRadius: 6, padding: "5px 8px", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,97,0.35)"; (e.currentTarget as HTMLButtonElement).style.color = "#C9A961"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1F24"; (e.currentTarget as HTMLButtonElement).style.color = "#3B4558"; }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Events list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
              {modalEvts.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 11, color: "#252836", letterSpacing: "0.1em" }}>
                  {calConnected ? "No events on this day." : "Connect Google Calendar to see events."}
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
                    <div key={ev.id} style={{ padding: "12px 16px", borderRadius: 8, backgroundColor: "#080A0D", border: "1px solid rgba(201,169,97,0.10)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: ev.summary ? 6 : 0 }}>
                        <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#C9A961", flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: "#C9A961", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                          {timeStr}{endStr ? ` — ${endStr}` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#C2C8D4", lineHeight: 1.4, paddingLeft: 13 }}>
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
  business, personal, onToggle, onDelete,
}: { business: Agent[]; personal: Agent[]; onToggle: (taskId: string) => void; onDelete: (taskId: string) => void }) {
  const strikes = [...business, ...personal]
    .flatMap((a) => a.tasks.filter((t) => t.status !== "DONE").map((t) => ({ task: t, agent: a })))
    .sort((a, b) => a.task.priority - b.task.priority);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Crosshair size={10} style={{ color: "#E05A3A" }} />
          <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "#3B4558" }}>Priority Strikes</span>
        </div>
        <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "#252836" }}>{strikes.length} pending</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {strikes.slice(0, 14).map(({ task, agent }) => (
          <div
            key={task.id}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 6, backgroundColor: "transparent", border: "1px solid #0F1015", transition: "border-color 0.14s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${agent.color}28`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#0F1015")}
          >
            <button onClick={() => onToggle(task.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0, color: "#252836" }}>
              <Circle size={9} />
            </button>
            <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: agent.color, flexShrink: 0 }} />
            <span style={{ fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: agent.color, flexShrink: 0, width: 28 }}>{agent.title}</span>
            <span style={{ fontSize: 11, color: "#7A8599", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
            <span style={{
              fontSize: 7, letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 5px", borderRadius: 3, flexShrink: 0,
              backgroundColor: task.priority === 1 ? "rgba(224,90,58,0.10)" : task.priority === 3 ? "rgba(59,69,88,0.08)" : "rgba(201,169,97,0.07)",
              border: `1px solid ${task.priority === 1 ? "rgba(224,90,58,0.28)" : task.priority === 3 ? "#1A1C24" : "rgba(201,169,97,0.18)"}`,
              color: task.priority === 1 ? "#E05A3A" : task.priority === 3 ? "#3B4558" : "#C9A961",
            }}>
              {task.priority === 1 ? "HI" : task.priority === 3 ? "LO" : "MD"}
            </span>
            <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#1A1C24", display: "flex", flexShrink: 0, transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E05A3A"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1C24"; }}>
              <X size={9} />
            </button>
          </div>
        ))}
        {strikes.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 10, color: "#1C1E2A", letterSpacing: "0.1em" }}>
            All clear, Chairman.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Personal Life Quadrants ──────────────────────────────────────────────────

function QuadrantHeader({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 8px ${color}77`, flexShrink: 0 }} />
      <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color, letterSpacing: "0.04em" }}>{label}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: "#252836" }}>{sub}</span>
    </div>
  );
}

function SubPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#080A0D", border: "1px solid #111318", borderRadius: 7, padding: "7px 10px" }}>
      {children}
    </div>
  );
}

function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #0C0E14" }}>
      <span style={{ fontSize: 7, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1E2030" }}>{label}</span>
      <span style={{ fontSize: 11, color: color ?? "#5A6070", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function WealthBlock() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <QuadrantHeader label="WEALTH" sub="Income & Freedom" color="#D4AF37" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "#252836", marginBottom: 6 }}>Income Targets</div>
          <DataRow label="Current Income"  value="—" color="#D4AF37" />
          <DataRow label="Target Income"   value="—" color="#8BA87B" />
          <DataRow label="Gap to Target"   value="—" color="#E05A3A" />
        </SubPanel>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "#252836", marginBottom: 5 }}>NQ Session Bias</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#C9A961" }}>RANGE-BOUND</div>
          <div style={{ fontSize: 7, color: "#1C1E26", marginTop: 2 }}>ES / NQ · Watching supply at prior hi</div>
        </SubPanel>
        <SubPanel>
          <DataRow label="Account Buffer" value="—" color="#8BA87B" />
          <DataRow label="Daily P&L"      value="—" color="#8BA87B" />
        </SubPanel>
      </div>
    </div>
  );
}

function HealthBlock() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <QuadrantHeader label="HEALTH" sub="Training & Energy" color="#E05A3A" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "#252836", marginBottom: 6 }}>Body Metrics</div>
          <DataRow label="Current Weight"  value="—" color="#E05A3A" />
          <DataRow label="Activity Level"  value="—" color="#E05A3A" />
          <DataRow label="Sleep Hours"     value="—" />
        </SubPanel>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: "#252836", marginBottom: 5 }}>Today's Session</div>
          <DataRow label="Workout Type"    value="—" color="#E05A3A" />
          <DataRow label="Protein Target"  value="200g" color="#8BA87B" />
          <DataRow label="Calories"        value="2,800 kcal" color="#8BA87B" />
        </SubPanel>
      </div>
    </div>
  );
}

function RelationshipsBlock() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <QuadrantHeader label="RELATIONSHIPS" sub="Legacy & Pack" color="#5B8FB9" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, overflowY: "auto" }}>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5B8FB9", marginBottom: 5, opacity: 0.7 }}>Antonia</div>
          <DataRow label="Last Quality Time" value="—" color="#5B8FB9" />
          <DataRow label="Next Commitment"   value="—" color="#5B8FB9" />
        </SubPanel>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5B8FB9", marginBottom: 5, opacity: 0.7 }}>Maximiliano</div>
          <DataRow label="Last Quality Time" value="—" color="#5B8FB9" />
          <DataRow label="Next Commitment"   value="—" color="#5B8FB9" />
        </SubPanel>
        <SubPanel>
          <div style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5B8FB9", marginBottom: 5, opacity: 0.7 }}>The Pack</div>
          <DataRow label="Nova"   value="—" color="#3B6A8A" />
          <DataRow label="Astro"  value="—" color="#3B6A8A" />
          <DataRow label="Comet"  value="—" color="#3B6A8A" />
        </SubPanel>
      </div>
    </div>
  );
}

function HappinessBlock({ tasks, onToggle, onDelete }: { tasks: DbTask[]; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const pending = tasks.filter((t) => t.status !== "DONE");
  const done    = tasks.filter((t) => t.status === "DONE");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <QuadrantHeader label="JOY" sub="Goals & Happiness" color="#B388EB" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, overflowY: "auto", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
          <span style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase", color: "#252836" }}>Areas of Happiness · Targets</span>
          <span style={{ fontSize: 7, color: "#252836" }}>{done.length}/{tasks.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          {pending.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 5, backgroundColor: "rgba(179,136,235,0.04)", border: "1px solid rgba(179,136,235,0.09)" }}>
              <button onClick={() => onToggle(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#4A3060", flexShrink: 0, display: "flex" }}>
                <Circle size={10} />
              </button>
              <span style={{ flex: 1, fontSize: 10, color: "#7A8599", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
              <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#252836", display: "flex", flexShrink: 0 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E05A3A"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#252836"; }}>
                <X size={9} />
              </button>
            </div>
          ))}
          {done.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 5, opacity: 0.4 }}>
              <button onClick={() => onToggle(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#B388EB", flexShrink: 0, display: "flex" }}>
                <CheckCircle2 size={10} />
              </button>
              <span style={{ flex: 1, fontSize: 10, color: "#3B4558", textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
              <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#252836", display: "flex", flexShrink: 0 }}>
                <X size={9} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div style={{ fontSize: 9, color: "#1C1E2A", padding: "8px 0", letterSpacing: "0.08em" }}>
              Add goals via Joy category in the command bar.
            </div>
          )}
        </div>
        <SubPanel>
          <DataRow label="Daily Anchor" value='"One step closer."' color="#B388EB" />
        </SubPanel>
      </div>
    </div>
  );
}

// ─── C-Suite Command Card ─────────────────────────────────────────────────────

function CSuiteCard({
  agent, onToggle, onDelete,
}: { agent: Agent; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const pending   = agent.tasks.filter((t) => t.status !== "DONE");
  const done      = agent.tasks.filter((t) => t.status === "DONE").length;
  const total     = agent.tasks.length;
  const pct       = total > 0 ? (done / total) * 100 : 0;
  const previewTasks = pending.slice(0, 3);

  return (
    <>
      {/* ── Card (clickable) ── */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          height: "100%", width: "100%", textAlign: "left",
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: agent.color, lineHeight: 1 }}>{agent.title}</div>
            <div style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: "#252836", marginTop: 3 }}>{agent.role}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 16, color: agent.color, fontVariantNumeric: "tabular-nums", fontFamily: "Georgia, serif" }}>{done}</span>
            <span style={{ fontSize: 9, color: "#252836" }}>/{total}</span>
          </div>
        </div>
        <div style={{ height: 1.5, backgroundColor: "#1E1F24", borderRadius: 2, marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: agent.color, borderRadius: 2, opacity: 0.65, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 3 }}>
          {previewTasks.length > 0 ? previewTasks.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 5, backgroundColor: "#080A0D", border: `1px solid ${agent.color}10` }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: t.priority === 1 ? "#E05A3A" : t.priority === 3 ? "#3B4558" : "#C9A961", flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "#7A8599", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t.title}</span>
            </div>
          )) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
              <span style={{ fontSize: 9, color: "#1A1C28", letterSpacing: "0.1em" }}>All clear</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E2030" }}>
          {pending.length} pending · {pct.toFixed(0)}% done
        </div>
      </button>

      {/* ── Task Modal ── */}
      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.72)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{ backgroundColor: "#0C0D10", border: `1px solid ${agent.color}30`, borderRadius: 14, padding: "28px 32px", minWidth: 420, maxWidth: 560, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", animation: "fade-up 0.18s ease-out", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: agent.color, lineHeight: 1 }}>{agent.title}</div>
                <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#3B4558", marginTop: 5 }}>{agent.role} · {total} task{total !== 1 ? "s" : ""}</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "1px solid #1E1F24", cursor: "pointer", color: "#3B4558", borderRadius: 6, padding: "5px 8px", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${agent.color}55`; (e.currentTarget as HTMLButtonElement).style.color = agent.color; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1F24"; (e.currentTarget as HTMLButtonElement).style.color = "#3B4558"; }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, backgroundColor: "#1E1F24", borderRadius: 2, marginBottom: 20, flexShrink: 0 }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: agent.color, borderRadius: 2, opacity: 0.7, transition: "width 0.6s ease" }} />
            </div>

            {/* All tasks */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {agent.tasks.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", fontSize: 11, color: "#252836", letterSpacing: "0.1em" }}>
                  No tasks assigned. Add one via the command bar.
                </div>
              ) : (
                agent.tasks.map((t) => {
                  const isDone = t.status === "DONE";
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, backgroundColor: isDone ? `${agent.color}08` : "#080A0D", border: `1px solid ${isDone ? `${agent.color}20` : "#111318"}` }}>
                      <button onClick={() => onToggle(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0, color: isDone ? agent.color : "#252836" }}>
                        {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </button>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: t.priority === 1 ? "#E05A3A" : t.priority === 3 ? "#3B4558" : "#C9A961", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: isDone ? "#3B4558" : "#C2C8D4", textDecoration: isDone ? "line-through" : "none", textDecorationColor: agent.color, lineHeight: 1.4 }}>
                        {t.title}
                      </span>
                      <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#1A1C24", display: "flex", flexShrink: 0, transition: "color 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E05A3A"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1C24"; }}>
                        <X size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 16, flexShrink: 0, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E2030", textAlign: "right" }}>
              {done}/{total} complete · {pct.toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Master View Tab (One-Pager Command Center) ───────────────────────────────

function MasterViewTab({
  business, personal, calConnected, onToggle, onDelete,
}: {
  business:     Agent[];
  personal:     Agent[];
  calConnected: boolean;
  onToggle:     (taskId: string) => void;
  onDelete:     (taskId: string) => void;
}) {
  const joyTasks = personal.find((a) => a.id === "joy")?.tasks ?? [];

  const PANEL: React.CSSProperties = {
    backgroundColor: "#0C0D10",
    border:          "1px solid #1E1F24",
    borderRadius:    10,
    padding:         "14px 16px",
    overflow:        "hidden",
    minHeight:       0,
    minWidth:        0,
  };
  // Calendar panel scrolls at panel level so events aren't trapped in a tiny inner div
  const CAL_PANEL: React.CSSProperties = { ...PANEL, overflowY: "auto" };

  // Row proportions: Feeds 38% · Personal 38% · C-Suite 24%
  return (
    <div style={{
      display:             "grid",
      gridTemplateRows:    "38fr 38fr 24fr",
      gridTemplateColumns: "100%",
      gap:                 10,
      flex:                1,
      minHeight:           0,
      overflow:            "hidden",
    }}>
      {/* ── Row 1: Calendar + Priority Strikes ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10, minHeight: 0, overflow: "hidden" }}>
        <div style={CAL_PANEL}><CalendarFeed calConnected={calConnected} /></div>
        <div style={PANEL}><PriorityStrikes business={business} personal={personal} onToggle={onToggle} onDelete={onDelete} /></div>
      </div>

      {/* ── Row 2: Personal Quadrants ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, minHeight: 0, overflow: "hidden" }}>
        <div style={PANEL}><WealthBlock /></div>
        <div style={PANEL}><HealthBlock /></div>
        <div style={PANEL}><RelationshipsBlock /></div>
        <div style={PANEL}><HappinessBlock tasks={joyTasks} onToggle={onToggle} onDelete={onDelete} /></div>
      </div>

      {/* ── Row 3: Business C-Suite (all 6) ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, minHeight: 0, overflow: "hidden" }}>
        {business.map((a) => (
          <div key={a.id} style={PANEL}>
            <CSuiteCard agent={a} onToggle={onToggle} onDelete={onDelete} />
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
      backgroundColor: "#000000",
      zIndex:          200,
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         40,
      animation:       "deep-enter 0.4s ease-out",
    }}>
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
        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#C9A961", animation: "deep-cursor 1.2s ease-in-out infinite" }} />
        <span style={{ fontSize: 10, letterSpacing: "0.35em", color: "#333", textTransform: "uppercase" }}>
          Deep Work · Dopamine Detox Active
        </span>
      </div>

      {priority ? (
        <div style={{ maxWidth: 780, width: "100%", textAlign: "center" }}>
          {/* Agent label */}
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#2A2A2A", textTransform: "uppercase", marginBottom: 20 }}>
            {priority.agent.title} · {priority.agent.role} · Current Priority
          </div>

          {/* THE TASK — massive */}
          <div className="deep-work-title" style={{
            fontFamily:    "Georgia, serif",
            fontSize:      "clamp(28px, 5vw, 56px)",
            fontWeight:    700,
            color:         "#FFFFFF",
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
          <div style={{ marginTop: 32, fontSize: 10, letterSpacing: "0.15em", color: "#1A1A1A", textTransform: "uppercase" }}>
            {business.concat(personal).reduce((s, a) => s + a.tasks.filter(t => t.status !== "DONE").length, 0)} tasks remaining across all agents
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 36, color: "#C9A961", marginBottom: 16 }}>
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ChairmanDashboard() {
  const { data: session } = useSession();
  const calConnected = !!(session as any)?.accessToken;
  const { resolvedTheme, setTheme } = useTheme();
  const user = session?.user;

  const [activeTab,    setActiveTab]    = useState<TabId>("MASTER");
  const [deepWork,     setDeepWork]     = useState(false);

  // ── Supabase task state ────────────────────────────────────────────────────
  const [dbTasks,      setDbTasks]      = useState<DbTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Top-level tasks only (parentId is null/undefined) for agent task lists
  const business = useMemo(
    () => AGENT_META_BUSINESS.map((a) => ({ ...a, tasks: dbTasks.filter((t) => t.agentId === a.id && !t.parentId) })),
    [dbTasks]
  );
  const personal = useMemo(
    () => AGENT_META_PERSONAL.map((a) => ({ ...a, tasks: dbTasks.filter((t) => t.agentId === a.id && !t.parentId) })),
    [dbTasks]
  );

  // Subtasks map: parentId → subtask[]
  const subtasksMap = useMemo(() => {
    const map: Record<string, DbTask[]> = {};
    dbTasks.filter((t) => t.parentId).forEach((t) => {
      if (!map[t.parentId!]) map[t.parentId!] = [];
      map[t.parentId!].push(t);
    });
    return map;
  }, [dbTasks]);

  // Load tasks on mount
  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { if (data.tasks) setDbTasks(data.tasks); })
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
  const totalTasks = dbTasks.length;
  const doneTasks  = dbTasks.filter((t) => t.status === "DONE").length;
  const overallPct = totalTasks > 0 ? doneTasks / totalTasks : 0;

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

  const deleteTask = useCallback(async (taskId: string) => {
    // Optimistically remove task + its subtasks from state
    setDbTasks((prev) => prev.filter((t) => t.id !== taskId && t.parentId !== taskId));
    try {
      await fetch("/api/tasks", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: taskId }),
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
            category: selectedCategory, status: "PENDING", isDelegated: false, priority: taskPriority,
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#08090C", color: "#7A8599" }}>
      <style>{KEYFRAMES}</style>

      {/* ── DEEP WORK OVERLAY ─────────────────────────────────────────────── */}
      {deepWork && (
        <DeepWorkMode
          business={business}
          personal={personal}
          onComplete={handleDeepWorkComplete}
          onExit={() => setDeepWork(false)}
        />
      )}

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, backgroundColor: "#0C0D10", borderBottom: "1px solid #1E1F24" }}>
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex flex-wrap items-center justify-between gap-y-3 py-4">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <Crosshair size={15} style={{ color: "#C9A961" }} />
              <div>
                <h1 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "#C2C8D4", letterSpacing: "0.04em" }}>
                  Pristine Designs
                </h1>
                <div className="text-[9px] tracking-widest uppercase" style={{ color: "#252836" }}>
                  Executive Command · Claude Agent Stack · V6 · Supabase
                </div>
              </div>
              <div className="header-divider-ea" style={{ width: 1, height: 24, backgroundColor: "#1E1F24", marginLeft: 4 }} />
              <div className="header-ea-badge flex items-center gap-1.5">
                <Bot size={11} style={{ color: "#4A90E2" }} />
                <span className="text-[9px] tracking-widest uppercase" style={{ color: "#4A90E2" }}>EA Buffer Active</span>
              </div>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-6">
              {/* Google Calendar connect/disconnect */}
              <button
                onClick={() => calConnected ? signOut({ redirect: false }) : signIn("google")}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  gap:             6,
                  padding:         "7px 14px",
                  borderRadius:    6,
                  backgroundColor: calConnected ? "rgba(74,144,226,0.1)" : "transparent",
                  border:          `1px solid ${calConnected ? "rgba(74,144,226,0.4)" : "#1E1F24"}`,
                  color:           calConnected ? "#4A90E2" : "#3B4558",
                  fontSize:        9,
                  fontWeight:      700,
                  letterSpacing:   "0.18em",
                  cursor:          "pointer",
                  transition:      "all 0.2s ease",
                  textTransform:   "uppercase",
                  whiteSpace:      "nowrap",
                }}
              >
                <CalendarDays size={11} />
                {calConnected ? "Cal · Live" : "Connect Cal"}
              </button>

              <div style={{ width: 1, height: 28, backgroundColor: "#1E1F24" }} />

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                title="Toggle theme"
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  width:           30,
                  height:          30,
                  borderRadius:    6,
                  backgroundColor: "transparent",
                  border:          "1px solid #1E1F24",
                  color:           "#3B4558",
                  cursor:          "pointer",
                  transition:      "all 0.2s ease",
                  flexShrink:      0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,97,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.color       = "#C9A961";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1F24";
                  (e.currentTarget as HTMLButtonElement).style.color       = "#3B4558";
                }}
              >
                {resolvedTheme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              </button>

              {/* User avatar / sign-in */}
              {user ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  title={`Signed in as ${user.email ?? user.name} · Click to sign out`}
                  style={{
                    flexShrink:      0,
                    display:         "flex",
                    alignItems:      "center",
                    gap:             7,
                    padding:         "4px 10px 4px 4px",
                    borderRadius:    20,
                    backgroundColor: "transparent",
                    border:          "1px solid #1E1F24",
                    cursor:          "pointer",
                    transition:      "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,97,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1F24";
                  }}
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name ?? "User"}
                      width={22}
                      height={22}
                      style={{ borderRadius: "50%", display: "block" }}
                    />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(201,169,97,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, color: "#C9A961", fontWeight: 700 }}>
                        {(user.name ?? "C")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: 9, color: "#3B4558", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {user.name?.split(" ")[0] ?? "Chairman"}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  style={{
                    flexShrink:      0,
                    display:         "flex",
                    alignItems:      "center",
                    gap:             6,
                    padding:         "6px 12px",
                    borderRadius:    6,
                    backgroundColor: "transparent",
                    border:          "1px solid #1E1F24",
                    color:           "#3B4558",
                    fontSize:        9,
                    fontWeight:      700,
                    letterSpacing:   "0.18em",
                    textTransform:   "uppercase",
                    cursor:          "pointer",
                    transition:      "all 0.2s ease",
                    whiteSpace:      "nowrap",
                  }}
                >
                  Sign In
                </button>
              )}

              <div style={{ width: 1, height: 28, backgroundColor: "#1E1F24" }} />

              {/* Deep Work toggle */}
              <button
                onClick={() => setDeepWork((p) => !p)}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  gap:             6,
                  padding:         "7px 14px",
                  borderRadius:    6,
                  backgroundColor: deepWork ? "rgba(201,169,97,0.14)" : "transparent",
                  border:          `1px solid ${deepWork ? "rgba(201,169,97,0.45)" : "#1E1F24"}`,
                  color:           deepWork ? "#C9A961" : "#3B4558",
                  fontSize:        9,
                  fontWeight:      700,
                  letterSpacing:   "0.2em",
                  cursor:          "pointer",
                  transition:      "all 0.2s ease",
                  textTransform:   "uppercase",
                  whiteSpace:      "nowrap",
                }}
              >
                <Brain size={11} />
                Deep Work {deepWork ? "· ON" : "· OFF"}
              </button>

              <div style={{ width: 1, height: 28, backgroundColor: "#1E1F24" }} />

              {/* Progress */}
              <div className="text-right select-none">
                <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: "#252836" }}>
                  {tasksLoading ? "Syncing…" : "Mission Progress"}
                </div>
                <div className="text-lg font-bold" style={{ color: "#C9A961", fontVariantNumeric: "tabular-nums" }}>
                  {doneTasks}<span className="text-xs font-normal" style={{ color: "#3B4558" }}>/{totalTasks}</span>
                </div>
                <div className="header-progress-bar mt-1.5 rounded-full" style={{ width: 64, height: 2, backgroundColor: "#1E1F24", marginLeft: "auto" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallPct * 100}%`, backgroundColor: "#C9A961", opacity: 0.7 }} />
                </div>
              </div>

              <div className="header-divider-clock" style={{ width: 1, height: 28, backgroundColor: "#1E1F24" }} />
              <div className="header-clock"><LiveClock /></div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="focus:outline-none"
                  style={{
                    padding:         "9px 20px",
                    borderRadius:    "8px 8px 0 0",
                    backgroundColor: isActive ? "#08090C" : "transparent",
                    border:          isActive ? "1px solid #1E1F24" : "1px solid transparent",
                    borderBottom:    isActive ? "1px solid #08090C" : "1px solid transparent",
                    marginBottom:    isActive ? -1 : 0,
                    color:           isActive ? "#C9A961" : "#3B4558",
                    fontSize:        10,
                    fontWeight:      700,
                    letterSpacing:   "0.18em",
                    transition:      "all 0.18s ease",
                    cursor:          "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main
        className="main-px max-w-[1440px] mx-auto"
        style={activeTab === "MASTER" ? {
          paddingLeft:    32,
          paddingRight:   32,
          paddingTop:     10,
          paddingBottom:  66,
          height:         "calc(100vh - 112px)",
          display:        "flex",
          flexDirection:  "column",
          overflow:       "hidden",
          boxSizing:      "border-box" as const,
        } : {
          paddingLeft:   32,
          paddingRight:  32,
          paddingTop:    24,
          paddingBottom: 148,
        }}
      >
        {activeTab === "MASTER"   && <MasterViewTab key="master"   business={business} personal={personal} calConnected={calConnected} onToggle={toggleTask} onDelete={deleteTask} />}
        {activeTab === "BUSINESS" && <BusinessTab   key="business" agents={business}  subtasksMap={subtasksMap} onToggle={(_, taskId) => toggleTask(taskId)} onDelete={deleteTask} onAddSubtask={addSubtask} />}
        {activeTab === "PERSONAL" && <PersonalTab   key="personal" agents={personal}  subtasksMap={subtasksMap} onToggle={(_, taskId) => toggleTask(taskId)} onDelete={deleteTask} onAddSubtask={addSubtask} />}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #111218" }}>
        <div className="max-w-[1440px] mx-auto px-8 py-3 flex items-center justify-between">
          <span className="text-[9px] tracking-widest uppercase" style={{ color: "#111218" }}>Pristine Designs · Executive Command · V6 · Claude Agent Stack · Supabase</span>
          <span className="text-[9px] tracking-widest uppercase" style={{ color: "#111218" }}>One Step Closer · 2026</span>
        </div>
      </div>

      {/* ── TOAST (primary) ───────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 96, left: "50%", zIndex: 60, animation: "toast-slide 0.28s ease-out", pointerEvents: "none" }}>
          <div style={{ transform: "translateX(-50%)", backgroundColor: "#0E0F14", border: `1px solid ${toast.type === "delegate" || toast.type === "schedule" ? "rgba(74,144,226,0.35)" : "rgba(201,169,97,0.32)"}`, borderRadius: 8, padding: "11px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.7)", whiteSpace: "nowrap" }}>
            {toast.type === "delegate" || toast.type === "schedule"
              ? <CalendarDays size={13} style={{ color: "#4A90E2", flexShrink: 0 }} />
              : <CheckCheck size={13} style={{ color: "#C9A961", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 11, color: toast.type === "delegate" || toast.type === "schedule" ? "#4A90E2" : "#C9A961", letterSpacing: "0.05em", fontWeight: 600 }}>
              {toast.type === "delegate" ? "Claude Agent:" : toast.type === "schedule" ? "Google Calendar:" : "Task processed:"}
            </span>
            <span style={{ fontSize: 11, color: "#7A8599", letterSpacing: "0.02em" }}>
              {toast.msg}
            </span>
          </div>
        </div>
      )}

      {/* ── COGNITIVE COMMAND BAR ─────────────────────────────────────────── */}
      <div style={{
        position:        "fixed",
        bottom:          0,
        left:            0,
        right:           0,
        zIndex:          50,
        backgroundColor: "#0a0b0e",
        borderTop:       `1px solid ${cmdFocused ? "rgba(201,169,97,0.32)" : "#1A1B22"}`,
        boxShadow:       cmdFocused ? "0 -4px 40px rgba(201,169,97,0.09)" : "none",
        transition:      "border-color 0.25s, box-shadow 0.25s",
        animation:       !cmdFocused ? "cmd-breathe 5s ease-in-out infinite" : "none",
      }}>
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
                    style={{
                      padding:         "4px 9px",
                      borderRadius:    5,
                      fontSize:        8,
                      fontWeight:      700,
                      letterSpacing:   "0.16em",
                      textTransform:   "uppercase",
                      cursor:          "pointer",
                      border:          `1px solid ${active ? `${meta.color}55` : "#1A1B22"}`,
                      backgroundColor: active ? `${meta.color}14` : "transparent",
                      color:           active ? meta.color : "#2A3040",
                      transition:      "all 0.15s",
                      whiteSpace:      "nowrap",
                    }}
                    onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = `${meta.color}33`; (e.currentTarget as HTMLButtonElement).style.color = `${meta.color}99`; } }}
                    onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A1B22"; (e.currentTarget as HTMLButtonElement).style.color = "#2A3040"; } }}
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
                color:           "#9CA3AF",
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
                <Loader2 size={13} style={{ color: "#4A90E2" }} className="animate-spin" />
                <span className="cmd-bar-msg" style={{ fontSize: 10, letterSpacing: "0.12em", color: "#4A90E2", textTransform: "uppercase", whiteSpace: "nowrap" }}>
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
                  backgroundColor: cmdValue.trim() ? "rgba(201,169,97,0.1)"  : "transparent",
                  border:          `1px solid ${cmdValue.trim() ? "rgba(201,169,97,0.3)" : "#1E1F24"}`,
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

            <span style={{ fontSize: 10, color: "#14151C", flexShrink: 0, letterSpacing: "0.06em" }}>↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
