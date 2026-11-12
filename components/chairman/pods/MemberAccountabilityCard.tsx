"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  DollarSign,
  Dumbbell,
  Flame,
  Lock,
  TrendingUp,
  Utensils,
} from "lucide-react";
import type { ConsentGrantRecord } from "./ConsentPermissionModal";

export interface PodMemberInfo {
  id: string;
  pod_id: string;
  user_id: string;
  role: string;
  display_alias: string;
  active_streak_days: number;
  today_completed_tasks_count: number;
  today_workout_completed: boolean;
  current_status: string | null;
}

interface MemberAccountabilityCardProps {
  member: PodMemberInfo;
  consent: ConsentGrantRecord | null;
  podType: "couple" | "family" | "business_team";
  isSelf: boolean;
  onToggleWorkout?: (membershipId: string, nextVal: boolean) => void;
}

const SAMPLE_MEMBER_METRICS: Record<
  string,
  {
    hrv: string;
    sleepScore: string;
    macros: string;
    liquidity: string;
    tradingPnl: string;
  }
> = {
  owner: {
    hrv: "74 ms HRV • 51 bpm RHR",
    sleepScore: "89% Sleep Score",
    macros: "1,740 / 1,750 kcal • 184g P",
    liquidity: "$42,850 Joint Vault • On Budget",
    tradingPnl: "+$1,140.00 MNQ (NY Session)",
  },
  partner: {
    hrv: "81 ms HRV • 56 bpm RHR",
    sleepScore: "92% Sleep Score",
    macros: "1,620 kcal • 128g P • Matcha",
    liquidity: "$42,850 Joint Vault • Studio +$3.4k",
    tradingPnl: "Passive Treasury Allocation",
  },
  dependent: {
    hrv: "Youth Recovery Optimal",
    sleepScore: "9.5h Sleep Verified",
    macros: "2,150 kcal • Balanced Growth",
    liquidity: "Youth Allowance Ledger: $145",
    tradingPnl: "Custodial UTMA Index",
  },
};

export function MemberAccountabilityCard({
  member,
  consent,
  podType,
  isSelf,
  onToggleWorkout,
}: MemberAccountabilityCardProps) {
  const sample =
    SAMPLE_MEMBER_METRICS[member.role] || SAMPLE_MEMBER_METRICS.owner;

  const canSeeWorkouts =
    podType !== "business_team" && (consent?.share_biometrics_workouts ?? true);
  const canSeeHealth =
    podType !== "business_team" &&
    (consent?.share_biometrics_health_stats ?? false);
  const canSeeMacros =
    podType !== "business_team" && (consent?.share_nutrition_macros ?? false);
  const canSeeFinances =
    podType !== "business_team" && (consent?.share_finances ?? false);
  const canSeeTrading =
    podType !== "business_team" && (consent?.share_trading_summary ?? false);
  const canSeeTasks = consent?.share_pms_tasks ?? true;

  const initials = member.display_alias
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d111a]/90 p-4 space-y-3.5 shadow-lg">
      {/* Top Identity Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/25 to-purple-500/25 border border-white/15 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white truncate">
                {member.display_alias}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] uppercase tracking-wider font-bold bg-white/[0.06] text-zinc-300 border border-white/10">
                {member.role}
              </span>
              {isSelf && (
                <span className="text-[9.5px] text-blue-400 font-semibold">
                  (Outgoing Preview)
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {member.current_status || "Online"}
            </p>
          </div>
        </div>

        {/* Streak Pill */}
        <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 shrink-0">
          <Flame size={13} className="text-amber-400" />
          {member.active_streak_days}d
        </div>
      </div>

      {/* Core Accountability Strip: Workout + Chores/Tasks */}
      <div className="grid grid-cols-2 gap-2.5">
        {canSeeWorkouts ? (
          <button
            type="button"
            onClick={() =>
              onToggleWorkout?.(member.id, !member.today_workout_completed)
            }
            className={`rounded-xl border px-3 py-2 text-left transition-all ${
              member.today_workout_completed
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-white/[0.03] border-white/10 text-zinc-400"
            }`}
          >
            <div className="text-[9.5px] uppercase tracking-wider opacity-75 flex items-center gap-1">
              <Dumbbell size={11} /> Daily Training
            </div>
            <div className="text-xs font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={12} />
              {member.today_workout_completed ? "Workout Verified" : "Pending"}
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2 text-zinc-500">
            <div className="text-[9.5px] uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} /> Training
            </div>
            <div className="text-xs font-mono mt-0.5">REDACTED</div>
          </div>
        )}

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <div className="text-[9.5px] uppercase tracking-wider text-zinc-400">
            Completed Today
          </div>
          <div className="text-xs font-bold text-white mt-0.5 font-mono">
            {canSeeTasks
              ? `${member.today_completed_tasks_count} Tasks / Chores`
              : "REDACTED"}
          </div>
        </div>
      </div>

      {/* Consent-Gated Biometrics / Macros / Finance / Trading Telemetry */}
      {podType !== "business_team" && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.07] text-[11px]">
          <div className="rounded-lg bg-black/35 border border-white/[0.06] p-2">
            <div className="text-[9.5px] text-zinc-400 flex items-center gap-1">
              <Activity size={10} className="text-rose-400" /> Biometrics
            </div>
            {canSeeHealth ? (
              <div className="text-zinc-200 font-medium mt-0.5 truncate">
                {sample.hrv}
              </div>
            ) : (
              <div className="text-zinc-500 font-mono text-[10px] mt-0.5 flex items-center gap-1">
                <Lock size={9} /> Consent Redacted
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/35 border border-white/[0.06] p-2">
            <div className="text-[9.5px] text-zinc-400 flex items-center gap-1">
              <Utensils size={10} className="text-teal-400" /> MacroOps
            </div>
            {canSeeMacros ? (
              <div className="text-zinc-200 font-medium mt-0.5 truncate">
                {sample.macros}
              </div>
            ) : (
              <div className="text-zinc-500 font-mono text-[10px] mt-0.5 flex items-center gap-1">
                <Lock size={9} /> Consent Redacted
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/35 border border-white/[0.06] p-2">
            <div className="text-[9.5px] text-zinc-400 flex items-center gap-1">
              <DollarSign size={10} className="text-emerald-400" /> Finances
            </div>
            {canSeeFinances ? (
              <div className="text-emerald-300 font-medium mt-0.5 truncate">
                {sample.liquidity}
              </div>
            ) : (
              <div className="text-zinc-500 font-mono text-[10px] mt-0.5 flex items-center gap-1">
                <Lock size={9} /> Consent Redacted
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/35 border border-white/[0.06] p-2">
            <div className="text-[9.5px] text-zinc-400 flex items-center gap-1">
              <TrendingUp size={10} className="text-purple-400" /> Futures Desk
            </div>
            {canSeeTrading ? (
              <div className="text-purple-300 font-medium mt-0.5 truncate">
                {sample.tradingPnl}
              </div>
            ) : (
              <div className="text-zinc-500 font-mono text-[10px] mt-0.5 flex items-center gap-1">
                <Lock size={9} /> Consent Redacted
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
