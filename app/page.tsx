"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
  Archive,
  Bot,
  TrendingDown,
  Minus,
  AlertTriangle,
  X,
  CalendarDays,
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
  status:      string;   // "PENDING" | "DONE"
  isDelegated: boolean;
  createdAt:   string;
}

interface Agent {
  id:    string;
  title: string;
  role:  string;
  color: string;
  tasks: DbTask[];
}

interface RoadmapNode {
  id:     number;
  label:  string;
  status: "completed" | "active" | "next" | "planned" | "target";
  x:      number;
  y:      number;
  color:  string;
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
  { id: "wealth", title: "WEALTH", role: "Income & Freedom",        color: "#D4AF37" },
  { id: "health", title: "HEALTH", role: "Training & Energy",       color: "#E05A3A" },
  { id: "relate", title: "RELATE", role: "Legacy & Pack",           color: "#5B8FB9" },
  { id: "joy",    title: "JOY",    role: "Foundation & Operations", color: "#B388EB" },
];

const ROADMAP_NODES: RoadmapNode[] = [
  { id: 1, label: "FOUNDATION",      status: "completed", x: 10, y: 80, color: "#4A4940" },
  { id: 2, label: "EXECUTIVE AI",    status: "active",    x: 30, y: 40, color: "#00FF88" },
  { id: 3, label: "CALIBER ARC",     status: "next",      x: 50, y: 70, color: "#C9A961" },
  { id: 4, label: "FITNESS & FLEET", status: "planned",   x: 70, y: 30, color: "#5B8FB9" },
  { id: 5, label: "2026 EMPIRE",     status: "target",    x: 90, y: 60, color: "#B388EB" },
];

// ─── KPI Data ─────────────────────────────────────────────────────────────────

const KPI_DATA = [
  { label: "AI Agency CAC",    value: "$342",    sub: "Cost Per Acquisition", trend: "down",   trendLabel: "Trending Down",    color: "#8BA87B" },
  { label: "Caliber Arc Churn",value: "4.2%",    sub: "Monthly Rate",         trend: "stable", trendLabel: "Stable",           color: "#C9A961" },
  { label: "NQ Market Pulse",  value: "VOLATILE",sub: "Range-Bound",          trend: "alert",  trendLabel: "Volatility High",  color: "#E05A3A" },
];

// ─── EA Delegation Classifier ─────────────────────────────────────────────────

const DELEGATE_KEYWORDS = [
  "scrape","email","send","fetch","ping","notify","remind",
  "download","upload","sync","query","search","look up","find","automate",
  "draft","compile","report","pull","push","run","execute","api","webhook",
  "database","message","post","tweet","slack","log","backup","monitor",
];

const SCHEDULE_KEYWORDS = [
  "schedule","add to calendar","block time","set meeting","book meeting",
  "calendar event","meeting at","call at","reminder at","block at",
];

function classifyTask(text: string): "schedule" | "delegate" | "assign" {
  const lower = text.toLowerCase();
  if (SCHEDULE_KEYWORDS.some((k) => lower.includes(k))) return "schedule";
  if (DELEGATE_KEYWORDS.some((k) => lower.includes(k))) return "delegate";
  return "assign";
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

// ─── Weekly Calendar ──────────────────────────────────────────────────────────

function WeeklyCalendar({
  events,
  calConnected,
  calLoading,
}: {
  events:       CalendarEvent[];
  calConnected: boolean;
  calLoading:   boolean;
}) {
  const days = getWeekDays();

  const statusLabel = calLoading
    ? "Syncing…"
    : calConnected
    ? "Google Calendar — Live"
    : "Google Calendar — connect to sync";

  return (
    <div>
      <SectionLabel right={statusLabel}>Weekly Command View</SectionLabel>
      <div className="overflow-x-auto -mx-1 px-1 mt-3">
        <div className="grid grid-cols-7 gap-2" style={{ minWidth: 420 }}>
          {days.map((d) => {
            const dayEvents = events.filter((ev) => {
              const dt = ev.start?.dateTime ?? ev.start?.date;
              if (!dt) return false;
              return new Date(dt).toDateString() === d.dateString;
            });

            return (
              <div
                key={d.name}
                className="rounded-lg p-3 text-center select-none"
                style={{
                  backgroundColor: d.isToday ? "rgba(201,169,97,0.06)" : "#0C0D10",
                  border:          d.isToday ? "1px solid rgba(201,169,97,0.28)" : "1px solid #1E1F24",
                }}
              >
                <div className="text-[10px] tracking-widest uppercase mb-2"
                  style={{ color: d.isToday ? "#C9A961" : d.isWeekend ? "#222435" : "#191A25" }}>
                  {d.name}
                </div>
                <div className="text-xl font-bold"
                  style={{ color: d.isToday ? "#C9A961" : "#28304A", fontFamily: "Georgia, serif" }}>
                  {d.date}
                </div>
                <div className="text-[9px] tracking-widest uppercase mt-1.5"
                  style={{ color: d.isToday ? "rgba(201,169,97,0.45)" : "#181924" }}>
                  {d.month}
                </div>
                {d.isToday && dayEvents.length === 0 && (
                  <div className="mt-2 flex justify-center">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#C9A961" }} />
                  </div>
                )}
                {dayEvents.length > 0 && (
                  <div className="mt-2 space-y-1 text-left">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[7px] leading-tight px-1 py-0.5 rounded truncate"
                        style={{ backgroundColor: "rgba(201,169,97,0.08)", color: "#C9A961", border: "1px solid rgba(201,169,97,0.18)" }}
                        title={ev.summary ?? "Event"}
                      >
                        {ev.summary ?? "Event"}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[7px]" style={{ color: "#3B4558" }}>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Magic Circle Node ────────────────────────────────────────────────────────

function MagicCircleNode({ node }: { node: RoadmapNode }) {
  const isTarget    = node.status === "target";
  const isActive    = node.status === "active";
  const isCompleted = node.status === "completed";
  const isNext      = node.status === "next";

  const outerR = isTarget ? 54 : isActive ? 38 : isNext ? 30 : 24;
  const midR   = isTarget ? 36 : isActive ? 25 : isNext ? 20 : 15;
  const coreR  = isTarget ? 16 : isActive ? 9  : isNext ? 6  : 4;
  const color  = node.color;

  return (
    <div style={{
      position:  "absolute",
      left:      `${node.x}%`,
      top:       `${node.y}%`,
      width:     0,
      height:    0,
      zIndex:    isTarget ? 20 : isActive ? 15 : 10,
      animation: isTarget
        ? "float-y 3s ease-in-out infinite"
        : isActive ? "float-y 4.5s ease-in-out infinite"
        : "none",
    }}>
      {isTarget && (
        <>
          <div style={{ position: "absolute", borderRadius: "50%", width: 160, height: 160, top: -80, left: -80, border: "1px dashed rgba(179,136,235,0.08)", animation: "spin-cw 30s linear infinite" }} />
          <div style={{ position: "absolute", borderRadius: "50%", width: 120, height: 120, top: -60, left: -60, border: "1px solid rgba(179,136,235,0.06)", animation: "spin-ccw 22s linear infinite" }} />
          <div style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", backgroundColor: "#B388EB", boxShadow: "0 0 8px #B388EB", top: -2, left: -2, transformOrigin: "2px 62px", animation: "spin-cw 8s linear infinite" }} />
        </>
      )}

      <div style={{ position: "absolute", borderRadius: "50%", width: outerR * 2, height: outerR * 2, top: -outerR, left: -outerR, border: `${isTarget ? 2 : 1.5}px dashed ${isCompleted ? "rgba(74,73,64,0.5)" : color}`, opacity: isCompleted ? 0.3 : 0.65, animation: `spin-cw ${isTarget ? "9s" : isActive ? "12s" : isNext ? "15s" : "20s"} linear infinite` }} />

      <div style={{ position: "absolute", borderRadius: "50%", width: midR * 2, height: midR * 2, top: -midR, left: -midR, border: `${isTarget ? 2 : 1}px solid ${isCompleted ? "rgba(74,73,64,0.4)" : color}`, boxShadow: isCompleted ? "none" : `0 0 ${isTarget ? 30 : 14}px ${color}99, inset 0 0 ${isTarget ? 16 : 6}px ${color}22`, opacity: isCompleted ? 0.2 : 0.9, animation: `spin-ccw ${isTarget ? "6s" : isActive ? "8s" : isNext ? "10s" : "13s"} linear infinite` }} />

      <div style={{ position: "absolute", borderRadius: "50%", width: coreR * 2, height: coreR * 2, top: -coreR, left: -coreR, backgroundColor: isCompleted ? "#2A2A22" : color, filter: `blur(${isTarget ? 7 : isActive ? 3 : 2}px)`, boxShadow: isCompleted ? "none" : `0 0 ${isTarget ? 48 : 20}px ${color}`, animation: isTarget ? "domain-expand 2.8s ease-in-out infinite" : isActive ? "pulse-active 2.2s ease-in-out infinite" : "none" }} />

      {!isCompleted && (
        <div style={{ position: "absolute", borderRadius: "50%", width: coreR * 0.7, height: coreR * 0.7, top: -(coreR * 0.35), left: -(coreR * 0.35), backgroundColor: "#FFFFFF", opacity: isTarget ? 0.6 : 0.35 }} />
      )}

      <div style={{ position: "absolute", top: outerR + 10, left: 0, transform: "translateX(-50%)", whiteSpace: "nowrap", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: isTarget ? 8.5 : 7, fontWeight: 700, letterSpacing: "2.5px", color: isCompleted ? "#3A3830" : color, textShadow: isCompleted ? "none" : `0 0 12px ${color}AA`, fontFamily: "monospace", textTransform: "uppercase" }}>
          {node.label}
        </div>
        <div style={{ fontSize: 6, letterSpacing: "1.5px", color: "#252836", marginTop: 3, textTransform: "uppercase" }}>
          {node.status}
        </div>
      </div>
    </div>
  );
}

// ─── Anime 3D Roadmap ─────────────────────────────────────────────────────────

function AnimeRoadmap() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Zap size={12} style={{ color: "#B388EB" }} />
        <SectionLabel right={`${ROADMAP_NODES.length} nodes · ${ROADMAP_NODES.length - 1} edges`}>
          Mission Roadmap — One Step Closer 2026
        </SectionLabel>
      </div>
      <div className="roadmap-outer" style={{ position: "relative", height: 430, overflow: "hidden", borderRadius: 12, border: "1px solid #1E1F24", perspective: "1200px", perspectiveOrigin: "50% 38%", backgroundColor: "#050508" }}>
        <div style={{ position: "absolute", inset: 0, transform: "rotateX(60deg) rotateZ(-30deg) scale(1.05)", transformOrigin: "50% 50%", transformStyle: "preserve-3d", background: "radial-gradient(ellipse 70% 60% at 42% 55%, #0d0624 0%, #060310 45%, #020105 100%)" }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="vGrid" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M44 0 L0 0 0 44" fill="none" stroke="#2A1650" strokeWidth="0.6" />
              </pattern>
              <radialGradient id="gFade" cx="50%" cy="50%" r="50%">
                <stop offset="20%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <mask id="gMask"><rect width="100%" height="100%" fill="url(#gFade)" /></mask>
            </defs>
            <rect width="100%" height="100%" fill="url(#vGrid)" mask="url(#gMask)" />
          </svg>

          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <filter id="edgeGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {ROADMAP_NODES.slice(0, -1).map((n, i) => {
                const nx = ROADMAP_NODES[i + 1];
                return (
                  <linearGradient key={`eg${i}`} id={`eg${i}`} x1={`${n.x}%`} y1={`${n.y}%`} x2={`${nx.x}%`} y2={`${nx.y}%`} gradientUnits="userSpaceOnUse">
                    <stop offset="0%"   stopColor={n.color}  stopOpacity="0.9" />
                    <stop offset="100%" stopColor={nx.color} stopOpacity="0.9" />
                  </linearGradient>
                );
              })}
            </defs>
            {ROADMAP_NODES.slice(0, -1).map((n, i) => {
              const nx  = ROADMAP_NODES[i + 1];
              const dur = `${1.6 + i * 0.28}s`;
              return (
                <g key={`edge${i}`}>
                  <line x1={`${n.x}%`} y1={`${n.y}%`} x2={`${nx.x}%`} y2={`${nx.y}%`} stroke={`url(#eg${i})`} strokeWidth="6" opacity="0.07" filter="url(#edgeGlow)" />
                  <line x1={`${n.x}%`} y1={`${n.y}%`} x2={`${nx.x}%`} y2={`${nx.y}%`} stroke={`url(#eg${i})`} strokeWidth="1" opacity="0.22" />
                  <line x1={`${n.x}%`} y1={`${n.y}%`} x2={`${nx.x}%`} y2={`${nx.y}%`} stroke={`url(#eg${i})`} strokeWidth="1.8" strokeDasharray="9 7" opacity="0.85" filter="url(#softGlow)">
                    <animate attributeName="stroke-dashoffset" from="0" to="-56" dur={dur} repeatCount="indefinite" />
                  </line>
                </g>
              );
            })}
          </svg>

          {ROADMAP_NODES.map((node) => (
            <MagicCircleNode key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mini Agent Grid ──────────────────────────────────────────────────────────

function MiniAgentGrid({ business, personal }: { business: Agent[]; personal: Agent[] }) {
  return (
    <div>
      <SectionLabel>All Agents · Live Status</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mt-3">
        {[...business, ...personal].map((a) => {
          const done  = a.tasks.filter((t) => t.status === "DONE").length;
          const total = a.tasks.length;
          return (
            <div key={a.id} className="rounded-lg p-3" style={{ backgroundColor: "#0C0D10", border: "1px solid #1E1F24" }}>
              <div className="text-[8px] tracking-widest uppercase mb-2" style={{ color: a.color }}>{a.title}</div>
              <div className="text-sm font-bold" style={{ color: a.color, fontVariantNumeric: "tabular-nums" }}>
                {done}<span className="text-xs font-normal" style={{ color: "#252836" }}>/{total}</span>
              </div>
              <div className="mt-2 h-px rounded-full" style={{ backgroundColor: "#1E1F24" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, backgroundColor: a.color, opacity: 0.6 }} />
              </div>
            </div>
          );
        })}
      </div>
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

function TaskPanel({ agent, onToggle }: { agent: Agent; onToggle: (taskId: string) => void }) {
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
          const isDone = task.status === "DONE";
          return (
            <button key={task.id} onClick={() => onToggle(task.id)}
              className="w-full text-left flex items-start gap-3 rounded-lg transition-all duration-150 focus:outline-none"
              style={{ padding: "10px 12px", backgroundColor: isDone ? `${agent.color}0A` : "transparent", border: `1px solid ${isDone ? `${agent.color}22` : "transparent"}` }}
            >
              <div className="shrink-0 mt-0.5" style={{ color: isDone ? agent.color : "#252836" }}>
                {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              </div>
              <div className="shrink-0 text-[10px] font-mono tracking-wider mt-0.5" style={{ color: isDone ? agent.color : "#2A3040" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <span className="text-sm leading-relaxed" style={{ color: isDone ? "#3B4558" : "#7A8599", textDecoration: isDone ? "line-through" : "none", textDecorationColor: agent.color, textDecorationThickness: "1px" }}>
                {task.title}
              </span>
            </button>
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

// ─── KPI Block ────────────────────────────────────────────────────────────────

function KPIBlock({ label, value, sub, trend, trendLabel, color }: typeof KPI_DATA[0]) {
  const Icon = trend === "down" ? TrendingDown : trend === "stable" ? Minus : AlertTriangle;
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "#0C0D10", border: "1px solid #1E1F24", flex: 1 }}>
      <div className="text-[9px] tracking-widest uppercase mb-3" style={{ color: "#3B4558" }}>{label}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1, letterSpacing: "-0.01em" }}>{value}</div>
      <div className="text-[9px] tracking-wider mt-1" style={{ color: "#2D3242" }}>{sub}</div>
      <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #1E1F24" }}>
        <Icon size={11} style={{ color, flexShrink: 0 }} />
        <span className="text-[10px] tracking-wider" style={{ color }}>{trendLabel}</span>
      </div>
    </div>
  );
}

// ─── Business Tab ─────────────────────────────────────────────────────────────

function BusinessTab({ agents, onToggle }: { agents: Agent[]; onToggle: (agentId: string, taskId: string) => void }) {
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
      {active && <TaskPanel agent={active} onToggle={(taskId) => onToggle(active.id, taskId)} />}

      {/* KPI Row */}
      <div>
        <SectionLabel>Market & Acquisition KPIs</SectionLabel>
        <div className="kpi-row flex flex-col sm:flex-row gap-3 mt-3">
          {KPI_DATA.map((k) => <KPIBlock key={k.label} {...k} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Personal Tab ─────────────────────────────────────────────────────────────

function PersonalTab({ agents, onToggle }: { agents: Agent[]; onToggle: (agentId: string, taskId: string) => void }) {
  const [selectedId, setSelectedId] = useState<string>("wealth");
  const active = agents.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-5" style={{ animation: "tab-in 0.22s ease-out" }}>
      <SectionLabel>Tai Lopez · 4-Hour Power Blocks</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} selected={selectedId === a.id}
            onClick={() => setSelectedId(a.id === selectedId ? "" : a.id)} />
        ))}
      </div>
      {active && <TaskPanel agent={active} onToggle={(taskId) => onToggle(active.id, taskId)} />}
    </div>
  );
}

// ─── Master View Tab ──────────────────────────────────────────────────────────

function MasterViewTab({
  business,
  personal,
  calEvents,
  calConnected,
  calLoading,
}: {
  business:     Agent[];
  personal:     Agent[];
  calEvents:    CalendarEvent[];
  calConnected: boolean;
  calLoading:   boolean;
}) {
  return (
    <div className="space-y-8" style={{ animation: "tab-in 0.22s ease-out" }}>
      <WeeklyCalendar events={calEvents} calConnected={calConnected} calLoading={calLoading} />
      <AnimeRoadmap />
      <MiniAgentGrid business={business} personal={personal} />
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

  const [activeTab,    setActiveTab]    = useState<TabId>("MASTER");
  const [deepWork,     setDeepWork]     = useState(false);

  // ── Supabase task state ────────────────────────────────────────────────────
  const [dbTasks,      setDbTasks]      = useState<DbTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Derive agents with live tasks from DB
  const business = useMemo(
    () => AGENT_META_BUSINESS.map((a) => ({ ...a, tasks: dbTasks.filter((t) => t.agentId === a.id) })),
    [dbTasks]
  );
  const personal = useMemo(
    () => AGENT_META_PERSONAL.map((a) => ({ ...a, tasks: dbTasks.filter((t) => t.agentId === a.id) })),
    [dbTasks]
  );

  // Load tasks on mount
  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { if (data.tasks) setDbTasks(data.tasks); })
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, []);

  // ── Google Calendar state ──────────────────────────────────────────────────
  const [calEvents,  setCalEvents]  = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);

  useEffect(() => {
    if (!calConnected) { setCalEvents([]); return; }
    setCalLoading(true);
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => { if (data.events) setCalEvents(data.events); })
      .catch(() => {})
      .finally(() => setCalLoading(false));
  }, [calConnected]);

  // ── Command bar ────────────────────────────────────────────────────────────
  const [cmdValue,      setCmdValue]      = useState("");
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [cmdFocused,    setCmdFocused]    = useState(false);
  const [memoryOn,      setMemoryOn]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toast,    setToast]    = useState<{ msg: string; type: "assign" | "delegate" | "schedule" | "memory" } | null>(null);
  const [memToast, setMemToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!memToast) return;
    const id = setTimeout(() => setMemToast(false), 3800);
    return () => clearTimeout(id);
  }, [memToast]);

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

  const handleDeepWorkComplete = (taskId: string) => toggleTask(taskId);

  // ── Command submit ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const text = cmdValue.trim();
    if (!text || isProcessing) return;

    setCmdValue("");
    setIsProcessing(true);
    setProcessingMsg("Claude Agent EA analyzing task for delegation...");

    const doSubmit = async () => {
      const classification = classifyTask(text);
      const saveToMemory   = memoryOn;

      if (classification === "schedule") {
        if (calConnected) {
          setProcessingMsg("Posting to Google Calendar...");
          const start = new Date();
          start.setMinutes(0, 0, 0);
          start.setHours(start.getHours() + 1);
          const end = new Date(start);
          end.setHours(end.getHours() + 1);
          try {
            await fetch("/api/calendar", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ title: text, start: start.toISOString(), end: end.toISOString() }),
            });
            const res  = await fetch("/api/calendar");
            const data = await res.json();
            if (data.events) setCalEvents(data.events);
            setToast({ msg: "Event added to Google Calendar.", type: "schedule" });
          } catch {
            setToast({ msg: "Calendar sync failed — event queued locally.", type: "assign" });
          }
        } else {
          setToast({ msg: "Connect Google Calendar in the header to auto-schedule.", type: "assign" });
        }

      } else if (classification === "delegate") {
        // Optimistically add as delegated task under CEO
        const tempId = `temp-${Date.now()}`;
        const optimistic: DbTask = {
          id: tempId, title: text, pillar: "BUSINESS", agentId: "ceo",
          status: "PENDING", isDelegated: true, createdAt: new Date().toISOString(),
        };
        setDbTasks((prev) => [...prev, optimistic]);
        setToast({ msg: "Task delegated to Claude Autonomous Agent.", type: "delegate" });
        try {
          const res  = await fetch("/api/tasks", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ title: text, pillar: "BUSINESS", agentId: "ceo", status: "PENDING", isDelegated: true }),
          });
          const data = await res.json();
          if (data.task) setDbTasks((prev) => prev.map((t) => t.id === tempId ? data.task : t));
        } catch {
          setDbTasks((prev) => prev.filter((t) => t.id !== tempId));
        }

      } else {
        // Assign to a random agent in scope
        const bizPool = business.map((a) => ({ agent: a, pool: "biz" as const }));
        const perPool = personal.map((a) => ({ agent: a, pool: "per" as const }));
        const candidates = activeTab === "BUSINESS" ? bizPool
                         : activeTab === "PERSONAL" ? perPool
                         : [...bizPool, ...perPool];

        const pick   = candidates[Math.floor(Math.random() * candidates.length)];
        const pillar = pick.pool === "biz" ? "BUSINESS" : "PERSONAL";
        const tempId = `temp-${Date.now()}`;
        const optimistic: DbTask = {
          id: tempId, title: text, pillar, agentId: pick.agent.id,
          status: "PENDING", isDelegated: false, createdAt: new Date().toISOString(),
        };
        setDbTasks((prev) => [...prev, optimistic]);
        setToast({ msg: `Assigned to ${pick.agent.title} · saving to Supabase…`, type: "assign" });
        try {
          const res  = await fetch("/api/tasks", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ title: text, pillar, agentId: pick.agent.id, status: "PENDING", isDelegated: false }),
          });
          const data = await res.json();
          if (data.task) setDbTasks((prev) => prev.map((t) => t.id === tempId ? data.task : t));
        } catch {
          setDbTasks((prev) => prev.filter((t) => t.id !== tempId));
        }
      }

      if (saveToMemory) setTimeout(() => setMemToast(true), 400);
      setIsProcessing(false);
      setProcessingMsg("");
    };

    setTimeout(() => { doSubmit(); }, 1700);
  }, [cmdValue, isProcessing, memoryOn, activeTab, business, personal, calConnected]);

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
      <main className="main-px max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-8" style={{ paddingBottom: 148 }}>
        {activeTab === "MASTER"   && <MasterViewTab key="master"   business={business} personal={personal} calEvents={calEvents} calConnected={calConnected} calLoading={calLoading} />}
        {activeTab === "BUSINESS" && <BusinessTab   key="business" agents={business}  onToggle={(_, taskId) => toggleTask(taskId)} />}
        {activeTab === "PERSONAL" && <PersonalTab   key="personal" agents={personal}  onToggle={(_, taskId) => toggleTask(taskId)} />}
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

      {/* ── TOAST (memory) ────────────────────────────────────────────────── */}
      {memToast && (
        <div style={{ position: "fixed", top: 80, left: "50%", zIndex: 60, animation: "toast-top 0.28s ease-out", pointerEvents: "none" }}>
          <div style={{ transform: "translateX(-50%)", backgroundColor: "#0E0F14", border: "1px solid rgba(179,136,235,0.35)", borderRadius: 8, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.7)", whiteSpace: "nowrap", animation: "mem-glow 2s ease-in-out infinite" }}>
            <Archive size={12} style={{ color: "#B388EB", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#B388EB", letterSpacing: "0.05em", fontWeight: 600 }}>RAG Vault:</span>
            <span style={{ fontSize: 11, color: "#7A8599" }}>Thought permanently archived in Infinite Memory.</span>
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

            {/* Mode badge */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, backgroundColor: cmdFocused ? "rgba(201,169,97,0.09)" : "rgba(201,169,97,0.04)", border: `1px solid ${cmdFocused ? "rgba(201,169,97,0.22)" : "rgba(201,169,97,0.09)"}`, transition: "all 0.2s" }}>
              <Sparkles size={10} style={{ color: "#C9A961" }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "#C9A961", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {activeTab === "MASTER" ? "AI Array" : activeTab}
              </span>
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

            {/* Infinite Memory toggle */}
            <button
              onClick={() => setMemoryOn((p) => !p)}
              title="Save to Infinite Memory (RAG Vault)"
              style={{
                flexShrink:      0,
                display:         "flex",
                alignItems:      "center",
                gap:             6,
                padding:         "5px 10px",
                borderRadius:    20,
                backgroundColor: memoryOn ? "rgba(179,136,235,0.1)" : "transparent",
                border:          `1px solid ${memoryOn ? "rgba(179,136,235,0.35)" : "#1E1F24"}`,
                cursor:          "pointer",
                transition:      "all 0.2s",
                animation:       memoryOn ? "mem-glow 2.5s ease-in-out infinite" : "none",
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: memoryOn ? "#B388EB" : "#252836", transition: "all 0.2s", boxShadow: memoryOn ? "0 0 6px #B388EB" : "none" }} />
              <Archive size={10} style={{ color: memoryOn ? "#B388EB" : "#252836" }} />
              <span style={{ fontSize: 9, color: memoryOn ? "#B388EB" : "#252836", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                ∞ Memory
              </span>
            </button>

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
