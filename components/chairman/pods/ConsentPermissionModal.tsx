"use client";

import React, { useState } from "react";
import {
  Activity,
  Calendar,
  CheckSquare,
  DollarSign,
  Loader2,
  Lock,
  ShieldCheck,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";

export interface ConsentGrantRecord {
  id: string;
  pod_id: string;
  grantor_user_id: string;
  grantee_user_id: string;
  share_finances: boolean;
  share_finance_transactions: boolean;
  share_pms_tasks: boolean;
  share_all_tasks: boolean;
  share_calendar_events: boolean;
  share_calendar_details: boolean;
  share_nutrition_macros: boolean;
  share_biometrics_workouts: boolean;
  share_biometrics_health_stats: boolean;
  share_trading_summary: boolean;
}

interface ConsentPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  podName: string;
  podType: "couple" | "family" | "business_team";
  consents: ConsentGrantRecord[];
  currentUserId: string;
  onUpdateConsent: (
    consentId: string,
    updates: Partial<ConsentGrantRecord>
  ) => Promise<void>;
}

const SIX_CATEGORIES: Array<{
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  businessLocked?: boolean;
  fields: Array<{
    key: keyof Omit<
      ConsentGrantRecord,
      "id" | "pod_id" | "grantor_user_id" | "grantee_user_id"
    >;
    label: string;
    redactPreview: string;
  }>;
}> = [
  {
    id: "finances",
    title: "1. Finances & Ledgers",
    description: "Net liquidity, shared household budget & itemized transactions.",
    icon: <DollarSign size={15} className="text-emerald-400" />,
    businessLocked: true,
    fields: [
      {
        key: "share_finances",
        label: "Share High-Level Account Balances & Joint Budget",
        redactPreview: "Masks Net Liquidity & Shared Reserve cards",
      },
      {
        key: "share_finance_transactions",
        label: "Share Granular Merchant Transaction Line-Items",
        redactPreview: "Redacts individual card swipes & memos",
      },
    ],
  },
  {
    id: "pms",
    title: "2. PMS & Life Tasks",
    description: "Shared household chores, sprint queues & private Sovereign tasks.",
    icon: <CheckSquare size={15} className="text-blue-400" />,
    fields: [
      {
        key: "share_pms_tasks",
        label: "Share Pod-Tagged Tasks & Accountability Count",
        redactPreview: "Hides task completion count on member card",
      },
      {
        key: "share_all_tasks",
        label: "Share Private Non-Pod Sovereign PMS Backlog",
        redactPreview: "Keeps personal icebox & private notes strictly local",
      },
    ],
  },
  {
    id: "calendar",
    title: "3. Circadian Calendar",
    description: "24-hour solar dial availability vs. full event titles & notes.",
    icon: <Calendar size={15} className="text-amber-400" />,
    fields: [
      {
        key: "share_calendar_events",
        label: "Share 24-Hour Free / Busy Circadian Blocks",
        redactPreview: "Enables overlap detection on Dual Wheel",
      },
      {
        key: "share_calendar_details",
        label: "Share Full Event Titles, Locations & Notes",
        redactPreview: 'When OFF, events render as anonymous grey "Busy" arcs!',
      },
    ],
  },
  {
    id: "nutrition",
    title: "4. Nutrition & Macros",
    description: "Daily MacroOps calorie targets, protein/carb/fat split & hydration.",
    icon: <Utensils size={15} className="text-teal-400" />,
    businessLocked: true,
    fields: [
      {
        key: "share_nutrition_macros",
        label: "Share Daily Calorie & Protein MacroOps Telemetry",
        redactPreview: "Masks 1,750 kcal / 180g P nutrition readout",
      },
    ],
  },
  {
    id: "biometrics",
    title: "5. Biometrics & Health",
    description: "Workout completion badges vs. clinical HRV, sleep score & RHR.",
    icon: <Activity size={15} className="text-rose-400" />,
    businessLocked: true,
    fields: [
      {
        key: "share_biometrics_workouts",
        label: "Share Daily Workout Completion & Streak Ring",
        redactPreview: "Masks Garage Gym / Pilates completion badge",
      },
      {
        key: "share_biometrics_health_stats",
        label: "Share Clinical Biometrics (HRV, Resting HR, Sleep)",
        redactPreview: "Redacts HRV ms & Resting HR telemetry",
      },
    ],
  },
  {
    id: "trading",
    title: "6. Futures Trading",
    description: "Caliber Arc MNQ/NQ daily net PnL, win-rate & drawdown state.",
    icon: <TrendingUp size={15} className="text-purple-400" />,
    businessLocked: true,
    fields: [
      {
        key: "share_trading_summary",
        label: "Share Caliber Arc Session Net PnL & Circuit Status",
        redactPreview: "Redacts futures desk PnL on accountability card",
      },
    ],
  },
];

export function ConsentPermissionModal({
  isOpen,
  onClose,
  podName,
  podType,
  consents,
  currentUserId,
  onUpdateConsent,
}: ConsentPermissionModalProps) {
  const [selectedDirection, setSelectedDirection] = useState<"outgoing" | "incoming">(
    podType === "couple" ? "incoming" : "outgoing"
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const outgoingGrant =
    consents.find((c) => c.grantor_user_id === currentUserId) || consents[0];
  const incomingGrant =
    consents.find((c) => c.grantor_user_id !== currentUserId) || outgoingGrant;

  const activeGrant =
    podType === "couple" && selectedDirection === "incoming"
      ? incomingGrant
      : outgoingGrant;

  const handleToggle = async (
    fieldKey: keyof Omit<
      ConsentGrantRecord,
      "id" | "pod_id" | "grantor_user_id" | "grantee_user_id"
    >
  ) => {
    if (!activeGrant) return;
    const nextVal = !activeGrant[fieldKey];
    setSavingKey(fieldKey);
    try {
      await onUpdateConsent(activeGrant.id, { [fieldKey]: nextVal });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b0f19] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Zero-Trust Granular Consent Matrix — {podName}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Every toggle writes directly to <code className="text-emerald-300">public.pod_consent_grants</code> and enforces immediate field-level UI redaction.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Direction Selector for Couple Pod */}
        {podType === "couple" && incomingGrant && outgoingGrant && (
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDirection("incoming")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedDirection === "incoming"
                  ? "bg-pink-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Partner → Chairman (Elena&apos;s Grants • Test Live Redaction on Wheel &amp; Card)
            </button>
            <button
              onClick={() => setSelectedDirection("outgoing")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedDirection === "outgoing"
                  ? "bg-blue-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Chairman → Partner (Diego&apos;s Outgoing Grants to Elena)
            </button>
          </div>
        )}

        {podType === "business_team" && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center gap-2.5">
            <Lock size={16} className="text-amber-400 shrink-0" />
            <span>
              <strong>Strict Corporate Firewall Active:</strong> Personal Finances, Nutrition, Biometrics, and Futures Trading are hardware-locked to <code>FALSE</code> in Business Pods.
            </span>
          </div>
        )}

        {/* 6 Category Cards */}
        {activeGrant && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {SIX_CATEGORIES.map((cat) => {
              const hardLocked =
                podType === "business_team" && Boolean(cat.businessLocked);
              return (
                <div
                  key={cat.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    hardLocked
                      ? "border-white/[0.05] bg-black/40 opacity-60"
                      : "border-white/10 bg-white/[0.025]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        {cat.icon}
                        {cat.title}
                      </div>
                      {hardLocked && (
                        <span className="text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Blocked in Biz Pod
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {cat.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    {cat.fields.map((f) => {
                      const enabled = Boolean(activeGrant[f.key]);
                      const isSaving = savingKey === f.key;
                      return (
                        <div
                          key={f.key}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-[11.5px] font-medium text-zinc-200">
                              {f.label}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {f.redactPreview}
                            </div>
                          </div>

                          <button
                            disabled={hardLocked || isSaving}
                            onClick={() => handleToggle(f.key)}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                              enabled && !hardLocked
                                ? "bg-emerald-500 justify-end"
                                : "bg-zinc-700 justify-start"
                            } disabled:cursor-not-allowed`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                              {isSaving && (
                                <Loader2
                                  size={11}
                                  className="animate-spin text-zinc-800"
                                />
                              )}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
          >
            Done — Return to Live Pod Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
