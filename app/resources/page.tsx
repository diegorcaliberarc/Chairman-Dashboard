"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Database,
  Layers,
  ShieldCheck,
  Server,
  FileCode2,
  BookOpen,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Network,
  Cpu,
  Lock,
  GitBranch,
  Terminal,
  Activity,
} from "lucide-react";

interface ArchitectureModule {
  id: string;
  name: string;
  route: string;
  pillar: string;
  databaseTables: string[];
  inputs: string;
  outputs: string;
  status: "ONLINE" | "SYNCED" | "ACTIVE";
  accentColor: string;
}

const ARCHITECTURE_MODULES: ArchitectureModule[] = [
  {
    id: "calendar",
    name: "Circadian Solar Dial & Calendar",
    route: "/calendar",
    pillar: "Operations & Execution",
    databaseTables: ["public.calendar_events", "public.user_integrations"],
    inputs: "User schedule, Google Calendar OAuth 2.0, PMS task dates",
    outputs: "24-hour circadian solar arc, month/week/day grids, financial daily telemetry",
    status: "SYNCED",
    accentColor: "#0969DA",
  },
  {
    id: "pms",
    name: "Pristine PMS Engine",
    route: "/pms",
    pillar: "Operations & Execution",
    databaseTables: [
      "public.pms_workspaces",
      "public.pms_spaces",
      "public.pms_folders",
      "public.pms_lists_v2",
      "public.pms_tasks_v2",
      "public.pms_task_assignees",
      "public.pms_custom_fields",
      "public.pms_task_custom_field_values",
      "public.pms_task_dependencies",
      "public.pms_time_entries",
      "public.pms_automations",
    ],
    inputs: "User tasks, ClickUp JSON exports, subtasks, stopwatch timers",
    outputs: "Multi-view List/Board/Gantt/Table, dependency graph, logged hours",
    status: "ONLINE",
    accentColor: "#0969DA",
  },
  {
    id: "workouts",
    name: "Titan Bodybuilding Engine",
    route: "/workouts",
    pillar: "Health & Performance",
    databaseTables: [
      "public.titan_exercises",
      "public.titan_workout_templates",
      "public.titan_workout_sessions",
      "public.titan_set_logs",
    ],
    inputs: "Weight/Reps steppers, active split presets, rest interval triggers",
    outputs: "Progressive overload benchmarks, 1RM estimation, volume tonnage",
    status: "ACTIVE",
    accentColor: "#F59E0B",
  },
  {
    id: "macro-ops",
    name: "Continuous Daily Macro Ops",
    route: "/macro-ops",
    pillar: "Health & Performance",
    databaseTables: ["public.daily_macro_logs", "public.user_macro_targets", "public.daily_logs", "public.food_entries"],
    inputs: "Food intake, fast timers, barcode/staples quick-add",
    outputs: "Calorie and protein target variance, remaining daily budget, fasting status",
    status: "ONLINE",
    accentColor: "#10B981",
  },
  {
    id: "education",
    name: "Master Curriculum & Epistemic Vault",
    route: "/education",
    pillar: "Epistemic & Mindset",
    databaseTables: ["public.epistemic_nodes", "public.user_progress"],
    inputs: "Module completions, quiz submissions, study hours",
    outputs: "Gamified XP progression, tier level, skill mastery tree",
    status: "ONLINE",
    accentColor: "#8B5CF6",
  },
  {
    id: "budget",
    name: "Yearly Budget & Capital Ledger",
    route: "/budget",
    pillar: "Wealth & Enterprise",
    databaseTables: ["public.financial_transactions", "public.yearly_budgets"],
    inputs: "Plaid bank feeds, recurring expenses, revenue receipts",
    outputs: "Monthly burn rate, runway calculator, category breakdown",
    status: "SYNCED",
    accentColor: "#10B981",
  },
  {
    id: "topology",
    name: "Interactive System Topology",
    route: "/org-chart",
    pillar: "Architecture & Systems",
    databaseTables: ["Client XYFlow Nodes & Edges"],
    inputs: "System routing metadata, active module health indicators",
    outputs: "Visual node-and-edge graph with click-to-dispatch routing",
    status: "ONLINE",
    accentColor: "#38BDF8",
  },
];

const SOPS = [
  {
    id: "sop-morning",
    pillar: "Daily Operational Cadence",
    title: "Morning Initialization & Tactical Dispatch",
    steps: [
      "Review Circadian Solar Dial at 06:00 to verify 24-hour orbital commitments.",
      "Check Active Macro Ops for daily baseline targets (Calories: 1,700 kcal, Protein: 180g).",
      "Launch scheduled Titan Workout split (Push, Pull, Legs, or Upper) and initialize session timer.",
      "Inspect Pristine PMS Sprint Queue to prioritize high-leverage architectural tasks.",
    ],
  },
  {
    id: "sop-dev",
    pillar: "Engineering Architecture",
    title: "Database Migration & Zero Dummy Data Protocol",
    steps: [
      "Strict Rule: No mock JSON arrays or static fallbacks in production views.",
      "All persistent state MUST hydrate exclusively from Supabase PostgreSQL via Row-Level Security.",
      "Verify foreign key cascades on user deletion (`ON DELETE CASCADE`).",
      "Ensure all timestamps are stored in UTC (`TIMESTAMPTZ`) and rendered in user local time.",
    ],
  },
  {
    id: "sop-evening",
    pillar: "Review & Reconciliation",
    title: "Nightly Ledger Seal & Horizon Roll-Forward",
    steps: [
      "Confirm all completed workout sets and log session finish in Titan Workouts.",
      "Close out daily food logs and review fasting timer countdown.",
      "Execute automated due-date roll-forward on incomplete PMS sprint tasks.",
      "Inspect financial transactions against daily money used allocations.",
    ],
  },
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<"matrix" | "sops" | "database">("matrix");

  return (
    <ExecutiveModuleShell
      moduleId="RESOURCES"
      eyebrow="Architecture & Operating System"
      title="System Resources Hub"
      subtitle="Complete Architecture Specification, Database Schema Registry & Operational SOPs"
      accentColor="#38BDF8"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1A1D24] pb-3">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "matrix"
                ? "bg-[#0969DA] text-white shadow-lg shadow-[#0969DA]/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers size={14} />
            <span>Architecture Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("sops")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "sops"
                ? "bg-[#0969DA] text-white shadow-lg shadow-[#0969DA]/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen size={14} />
            <span>Standard Operating Procedures</span>
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "database"
                ? "bg-[#0969DA] text-white shadow-lg shadow-[#0969DA]/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Database size={14} />
            <span>Database & RLS Topology</span>
          </button>
        </div>

        {/* TAB 1: ARCHITECTURE MATRIX */}
        {activeTab === "matrix" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
              <span>{ARCHITECTURE_MODULES.length} Registered Executive Modules</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={13} />
                All Endpoints Active & RLS Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ARCHITECTURE_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-2xl p-5 bg-[#111214] border border-[#1A1D24] shadow-xl hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: mod.accentColor }}
                      />
                      <h3 className="text-sm font-bold text-zinc-100 truncate">
                        {mod.name}
                      </h3>
                      <span
                        className="text-[9.5px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold"
                        style={{
                          backgroundColor: `${mod.accentColor}15`,
                          borderColor: `${mod.accentColor}40`,
                          color: mod.accentColor,
                        }}
                      >
                        {mod.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 font-mono">
                      Pillar: <span className="text-zinc-200">{mod.pillar}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {mod.databaseTables.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#141720] border border-[#1A1D24] text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-zinc-400 font-mono">
                      <div>
                        <span className="text-zinc-500">Inputs:</span> {mod.inputs}
                      </div>
                      <div>
                        <span className="text-zinc-500">Outputs:</span> {mod.outputs}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={mod.route}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>Launch</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SOPS */}
        {activeTab === "sops" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOPS.map((sop) => (
              <div
                key={sop.id}
                className="rounded-2xl p-6 bg-[#111214] border border-[#1A1D24] shadow-xl flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#58A6FF]">
                    {sop.pillar}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-100 mt-1">
                    {sop.title}
                  </h3>

                  <ol className="mt-4 space-y-2.5 text-xs text-zinc-400 list-decimal pl-4">
                    {sop.steps.map((st, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {st}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-3 border-t border-[#1A1D24] flex items-center justify-between text-[10.5px] font-mono text-zinc-500">
                  <span>Standard Operating Protocol</span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: DATABASE TOPOLOGY */}
        {activeTab === "database" && (
          <div className="rounded-2xl p-6 bg-[#111214] border border-[#1A1D24] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1D24]">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <Database className="w-4 h-4 text-[#0969DA]" />
                <span>Supabase PostgreSQL Schema & RLS Policies</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Lock size={12} /> Row-Level Security Enabled
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-300">
              <p className="text-zinc-400 leading-relaxed">
                All 20 schema tables created in Phase 1 are protected with strict Postgres Row-Level Security (RLS) bound to <code className="text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded">auth.uid() = user_id</code>. Zero unauthorized cross-tenant data leakage is permitted.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: "calendar_events", desc: "Circadian events & Google Sync", rls: "Enforced" },
                  { name: "user_integrations", desc: "OAuth tokens & credentials", rls: "Enforced" },
                  { name: "titan_exercises", desc: "Movement catalog & equipment", rls: "Enforced" },
                  { name: "titan_workout_sessions", desc: "Daily training sessions", rls: "Enforced" },
                  { name: "titan_set_logs", desc: "Weight, reps & completion", rls: "Enforced" },
                  { name: "daily_macro_logs", desc: "Nutrient telemetry & totals", rls: "Enforced" },
                  { name: "pms_workspaces", desc: "Top-level enterprise tenant", rls: "Enforced" },
                  { name: "pms_tasks_v2", desc: "Sovereign execution tasks", rls: "Enforced" },
                  { name: "pms_custom_fields", desc: "Dynamic metadata schema", rls: "Enforced" },
                  { name: "pms_time_entries", desc: "Live stopwatch & billable logs", rls: "Enforced" },
                  { name: "pms_task_dependencies", desc: "Gantt predecessor blocks", rls: "Enforced" },
                  { name: "pms_automations", desc: "Due-date roll forward triggers", rls: "Enforced" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl bg-[#141720] border border-[#1A1D24] space-y-1"
                  >
                    <div className="font-bold text-zinc-100">{item.name}</div>
                    <div className="text-[10.5px] text-zinc-500">{item.desc}</div>
                    <div className="text-[10px] text-emerald-400 pt-1 flex items-center gap-1">
                      <Lock size={10} /> RLS {item.rls}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ExecutiveModuleShell>
  );
}

