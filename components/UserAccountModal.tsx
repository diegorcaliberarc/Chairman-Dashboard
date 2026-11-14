"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Shield,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Activity,
  Settings,
  RefreshCw,
  LogOut,
  FolderKanban,
  Check,
  Zap,
} from "lucide-react";
import { signOut, signIn, useSession } from "next-auth/react";

interface UserAccountModalProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  calConnected?: boolean;
  onCalToggle?: () => void;
  activeTasksCount?: number;
  activeSubtasksCount?: number;
  onClose: () => void;
}

export function UserAccountModal({
  user,
  calConnected = false,
  onCalToggle,
  activeTasksCount = 0,
  activeSubtasksCount = 0,
  onClose,
}: UserAccountModalProps) {
  const { data: session } = useSession();
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/calendar/google-sync")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.connected || d?.success) setDbConnected(true);
      })
      .catch(() => {});
  }, []);

  const effectiveUser = {
    name: user?.name || session?.user?.name || "Diego Rodriguez",
    email: user?.email || session?.user?.email || "diegoforodriguez@gmail.com",
    image: user?.image || session?.user?.image || null,
  };
  const isCalConnected = calConnected || dbConnected || Boolean((session as any)?.accessToken);

  const [activeTab, setActiveTab] = useState<"profile" | "mission" | "integrations" | "pms">("profile");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [autoRollForward, setAutoRollForward] = useState(true);
  const [defaultSpace, setDefaultSpace] = useState("Equipsyncs");
  const [defaultView, setDefaultView] = useState("Board");
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncNow = async () => {
    setSyncingNow(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/calendar/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysForward: 14 }),
      });
      const data = await res.json();
      if (res.ok && data.synced) {
        setSyncMessage(`✓ Synced ${data.eventsUpserted ?? 0} events from Google Calendar.`);
      } else {
        setSyncMessage(data.error || "Sync completed.");
      }
    } catch (err: any) {
      setSyncMessage(err.message || "Failed to trigger sync");
    } finally {
      setSyncingNow(false);
    }
  };

  // Session timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSessionTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#090A0F] border border-[#1A1D24] rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/4 w-96 h-28 bg-[#0969DA]/20 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1D24] bg-[#111214]/80 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0969DA]/15 border border-[#0969DA]/30 flex items-center justify-center text-[#58A6FF]">
              <Settings size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-zinc-100">
                Execution & Account Settings
              </h2>
              <p className="text-[10.5px] text-zinc-400 font-mono">
                Chairman OS Sovereign Identity & Dispatch Center
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Tabs Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1A1D24] bg-[#0E1015]/60 text-xs font-mono">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === "profile"
                ? "border-[#0969DA] text-[#58A6FF]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Profile & Identity
          </button>
          <button
            onClick={() => setActiveTab("mission")}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === "mission"
                ? "border-[#0969DA] text-[#58A6FF]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Mission Telemetry
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-3 py-2 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "integrations"
                ? "border-[#0969DA] text-[#58A6FF]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Google OAuth 2.0</span>
            {calConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab("pms")}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === "pms"
                ? "border-[#0969DA] text-[#58A6FF]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            PMS Workspace
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#111214] border border-[#1A1D24]">
                {effectiveUser.image ? (
                  <img
                    src={effectiveUser.image}
                    alt="Chairman"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#0969DA]/40 shadow-xl"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0969DA] to-[#58A6FF] flex items-center justify-center text-white text-2xl font-extrabold shadow-xl">
                    {(effectiveUser.name ?? "D")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-100 truncate">
                      {effectiveUser.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#0969DA]/20 border border-[#0969DA]/40 text-[#58A6FF] text-[9.5px] font-mono font-bold tracking-wider uppercase">
                      SOVEREIGN_ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                    {effectiveUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Session Online · Obsidian Kernel Locked</span>
                  </div>
                </div>
              </div>

              {/* Security & Access */}
              <div className="p-4 rounded-2xl bg-[#111214] border border-[#1A1D24] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Authentication Provider</span>
                  <span className="font-mono text-zinc-200 font-semibold">Google OAuth 2.0 PKCE</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Row-Level Security (RLS)</span>
                  <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Strict Postgres Enforced
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Database Partition</span>
                  <span className="font-mono text-zinc-200">Supabase AWS Oregon (us-west-2)</span>
                </div>
              </div>

              {/* Google Account Authentication Card */}
              <div className="p-4 rounded-2xl bg-[#111214] border border-[#1A1D24] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-200">
                    {session?.user ? "Google Account Authenticated" : "Google Account Integration"}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    {session?.user?.email ?? effectiveUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: typeof window !== "undefined" ? window.location.href : "/calendar" })}
                  className="px-3 py-1.5 rounded-xl bg-[#0969DA]/20 hover:bg-[#0969DA]/30 border border-[#0969DA]/40 text-[#58A6FF] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <ExternalLink size={12} />
                  <span>{session?.user ? "Switch / Re-Auth" : "Sign In with Google"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MISSION PROGRESS & TELEMETRY */}
          {activeTab === "mission" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24]">
                  <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                    Active Tasks in Flight
                  </div>
                  <div className="mt-2 text-3xl font-extrabold font-mono text-[#58A6FF]">
                    {activeTasksCount}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                    {activeSubtasksCount} subtasks in queue
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24]">
                  <div className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                    Current Session Elapsed
                  </div>
                  <div className="mt-2 text-3xl font-extrabold font-mono text-amber-400">
                    {formatSessionTime(sessionSeconds)}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                    Live operational telemetry
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111214] border border-[#1A1D24] space-y-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <Activity size={14} className="text-[#58A6FF]" />
                  <span>Sovereign Performance Velocity</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Mission Progress and live session metrics have been consolidated into this dedicated executive view, keeping the left navigation rail uncluttered and ultra-fast.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE CALENDAR OAUTH 2.0 INTEGRATION */}
          {activeTab === "integrations" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#111214] border border-[#1A1D24] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#58A6FF]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">
                        Google Calendar 2-Way Sync
                      </h4>
                      <p className="text-[11px] font-mono text-zinc-400">
                        OAuth 2.0 (calendar.events + calendar.readonly)
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                      isCalConnected
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {isCalConnected ? "CONNECTED" : "NOT CONNECTED"}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Connect your Google Calendar to synchronize scheduled meetings, appointments, and shifts directly into the 24-hour Circadian Solar Dial and 5-mode Traditional Calendar.
                </p>

                {syncMessage && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
                    {syncMessage}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {isCalConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncNow}
                        disabled={syncingNow}
                        className="px-4 py-2 rounded-xl bg-[#0969DA] hover:bg-[#0854ad] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#0969DA]/20 cursor-pointer"
                      >
                        <RefreshCw size={13} className={syncingNow ? "animate-spin" : ""} />
                        <span>{syncingNow ? "Syncing Calendar..." : "Sync Now (2-Way)"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: typeof window !== "undefined" ? window.location.href : "/calendar" })}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink size={12} />
                        <span>Re-authenticate / Switch Account</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onCalToggle) {
                          onCalToggle();
                        } else {
                          signIn("google", { callbackUrl: typeof window !== "undefined" ? window.location.href : "/calendar" });
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#0969DA] hover:bg-[#0854ad] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#0969DA]/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      Connect Google Calendar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PMS WORKSPACE SETTINGS */}
          {activeTab === "pms" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#111214] border border-[#1A1D24] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Default PMS Space</span>
                  <select
                    value={defaultSpace}
                    onChange={(e) => setDefaultSpace(e.target.value)}
                    className="bg-[#141720] border border-[#1A1D24] text-xs font-mono text-zinc-100 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0969DA]"
                  >
                    <option value="Equipsyncs">Equipsyncs</option>
                    <option value="Health List">Health List</option>
                    <option value="Planning">Planning</option>
                    <option value="2026 Goals and Targets">2026 Goals and Targets</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Default View Mode</span>
                  <select
                    value={defaultView}
                    onChange={(e) => setDefaultView(e.target.value)}
                    className="bg-[#141720] border border-[#1A1D24] text-xs font-mono text-zinc-100 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0969DA]"
                  >
                    <option value="Board">Kanban Board</option>
                    <option value="List">List View</option>
                    <option value="Overview">Overview</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1A1D24]">
                  <div>
                    <div className="text-zinc-200 font-semibold">Automated Sprint Due-Date Roll Forward</div>
                    <div className="text-[10.5px] text-zinc-500 font-mono">Automatically push uncompleted tasks at midnight</div>
                  </div>
                  <button
                    onClick={() => setAutoRollForward((v) => !v)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      autoRollForward ? "bg-[#0969DA]" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        autoRollForward ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-4 border-t border-[#1A1D24] bg-[#111214] flex items-center justify-between">
          <button
            onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors"
          >
            <LogOut size={13} />
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0969DA] hover:bg-[#0854ad] text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
