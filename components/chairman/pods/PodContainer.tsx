"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Heart,
  Home,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { HisAndHersDualWheel } from "./HisAndHersDualWheel";
import {
  ConsentGrantRecord,
  ConsentPermissionModal,
} from "./ConsentPermissionModal";
import {
  MemberAccountabilityCard,
  PodMemberInfo,
} from "./MemberAccountabilityCard";
import { ChoreItem, SharedChoreKanban } from "./SharedChoreKanban";

type PodTierType = "couple" | "family";

interface SharedPod {
  id: string;
  name: string;
  pod_type: PodTierType;
  max_members: number;
}

const TIER_TABS: Array<{
  type: PodTierType;
  tierBadge: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  activeClass: string;
}> = [
  {
    type: "couple",
    tierBadge: "Tier 1 • 1:1 Intimate",
    label: 'Couple Pod ("His & Hers")',
    sub: "Dual Circadian Overlap & Mutual Sanctuary",
    icon: <Heart size={15} className="text-pink-400" />,
    activeClass:
      "border-pink-400/50 bg-pink-500/15 text-white shadow-lg shadow-pink-500/10",
  },
  {
    type: "family",
    tierBadge: "Tier 2 • Household",
    label: "Family Pod (Rodriguez Household)",
    sub: "Multi-Member Accountability & Chore Board",
    icon: <Home size={15} className="text-emerald-400" />,
    activeClass:
      "border-emerald-400/50 bg-emerald-500/15 text-white shadow-lg shadow-emerald-500/10",
  },
];

export function PodContainer() {
  const [currentUserId, setCurrentUserId] = useState<string>("chairman-default");
  const [pods, setPods] = useState<SharedPod[]>([]);
  const [memberships, setMemberships] = useState<PodMemberInfo[]>([]);
  const [consents, setConsents] = useState<ConsentGrantRecord[]>([]);
  const [podTasks, setPodTasks] = useState<ChoreItem[]>([]);
  const [activeTier, setActiveTier] = useState<PodTierType>("couple");
  const [loading, setLoading] = useState(true);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  const loadPods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pods", { cache: "no-store" });
      const data = await res.json();
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
      if (Array.isArray(data.pods)) setPods(data.pods);
      if (Array.isArray(data.memberships)) setMemberships(data.memberships);
      if (Array.isArray(data.consents)) setConsents(data.consents);
      if (Array.isArray(data.podTasks)) setPodTasks(data.podTasks);
    } catch (err) {
      console.error("Failed to fetch Pods:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPods();
  }, [loadPods]);

  const activePod = useMemo(
    () => pods.find((p) => p.pod_type === activeTier) || null,
    [pods, activeTier]
  );

  const activeMembers = useMemo(
    () =>
      activePod
        ? memberships.filter((m) => m.pod_id === activePod.id)
        : [],
    [memberships, activePod]
  );

  const activeConsents = useMemo(
    () =>
      activePod ? consents.filter((c) => c.pod_id === activePod.id) : [],
    [consents, activePod]
  );

  const partnerIncomingConsent = useMemo(
    () =>
      activeConsents.find((c) => c.grantor_user_id !== currentUserId) ||
      activeConsents[0] ||
      null,
    [activeConsents, currentUserId]
  );

  const outgoingSelfConsent = useMemo(
    () =>
      activeConsents.find((c) => c.grantor_user_id === currentUserId) ||
      activeConsents[0] ||
      null,
    [activeConsents, currentUserId]
  );

  const updateConsent = async (
    consentId: string,
    updates: Partial<ConsentGrantRecord>
  ) => {
    setConsents((prev) =>
      prev.map((c) => (c.id === consentId ? { ...c, ...updates } : c))
    );
    const res = await fetch("/api/pods", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_consent",
        consent_id: consentId,
        updates,
      }),
    });
    const data = await res.json();
    if (data.consent) {
      setConsents((prev) =>
        prev.map((c) => (c.id === consentId ? data.consent : c))
      );
    }
  };

  const toggleMemberWorkout = async (
    membershipId: string,
    nextVal: boolean
  ) => {
    setMemberships((prev) =>
      prev.map((m) =>
        m.id === membershipId ? { ...m, today_workout_completed: nextVal } : m
      )
    );
    await fetch("/api/pods", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_member_workout",
        membership_id: membershipId,
        completed: nextVal,
      }),
    });
  };

  const createPodTask = async (payload: {
    name: string;
    assignee: string;
    priority: string;
    points?: number;
  }) => {
    const res = await fetch("/api/pods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_pod_task",
        pod_type: activeTier,
        ...payload,
      }),
    });
    const data = await res.json();
    if (data.podTask) {
      setPodTasks((prev) => [data.podTask, ...prev]);
    }
  };

  const updatePodTask = async (
    taskId: string,
    updates: { status_category?: string; assignee?: string }
  ) => {
    setPodTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...(updates.status_category
                ? {
                    status_category:
                      updates.status_category as ChoreItem["status_category"],
                  }
                : {}),
              ...(updates.assignee ? { assignee: updates.assignee } : {}),
            }
          : t
      )
    );
    await fetch("/api/pods", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_pod_task",
        task_id: taskId,
        ...updates,
      }),
    });
  };

  if (loading && pods.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 size={28} className="animate-spin text-pink-400" />
        <span className="text-xs uppercase tracking-widest">
          Initializing Multi-Tiered Zero-Trust Pod Engine...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Multi-Tiered Pod Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {TIER_TABS.map((tab) => {
          const isActive = activeTier === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTier(tab.type)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? tab.activeClass
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {tab.tierBadge}
                </span>
                {tab.icon}
              </div>
              <div className="text-sm font-bold mt-1.5">{tab.label}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">{tab.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Active Pod RLS Status Bar */}
      {activePod && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1019] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-white">
              Active Pod: {activePod.name}
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 font-mono">
              {activeMembers.length}/{activePod.max_members} Seats Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setConsentModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <SlidersHorizontal size={13} />
              Configure 6-Category Consent Matrix
            </button>
            <button
              onClick={loadPods}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-300"
              title="Refresh Pod State"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}

      {/* TIER 1: COUPLE POD ("HIS & HERS" 1:1) */}
      {activeTier === "couple" && (
        <div className="space-y-6">
          <HisAndHersDualWheel
            partnerConsent={partnerIncomingConsent}
            onQuickTogglePartnerDetails={async (nextVal) => {
              if (partnerIncomingConsent) {
                await updateConsent(partnerIncomingConsent.id, {
                  share_calendar_details: nextVal,
                });
              }
            }}
            onOpenConsentModal={() => setConsentModalOpen(true)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMembers.map((m) => {
              const isSelf = m.user_id === currentUserId;
              return (
                <MemberAccountabilityCard
                  key={m.id}
                  member={m}
                  consent={isSelf ? outgoingSelfConsent : partnerIncomingConsent}
                  podType="couple"
                  isSelf={isSelf}
                  onToggleWorkout={toggleMemberWorkout}
                />
              );
            })}
          </div>

          <SharedChoreKanban
            podType="couple"
            chores={podTasks}
            memberNames={["Diego", "Elena"]}
            onCreateChore={createPodTask}
            onUpdateChore={updatePodTask}
          />
        </div>
      )}

      {/* TIER 2: FAMILY POD (RODRIGUEZ HOUSEHOLD) */}
      {activeTier === "family" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeMembers.map((m) => (
              <MemberAccountabilityCard
                key={m.id}
                member={m}
                consent={outgoingSelfConsent}
                podType="family"
                isSelf={m.user_id === currentUserId}
                onToggleWorkout={toggleMemberWorkout}
              />
            ))}
          </div>

          <SharedChoreKanban
            podType="family"
            chores={podTasks}
            memberNames={["Diego", "Elena", "Maximiliano"]}
            onCreateChore={createPodTask}
            onUpdateChore={updatePodTask}
          />
        </div>
      )}

      {/* Granular 6-Category Consent Modal */}
      {activePod && (
        <ConsentPermissionModal
          isOpen={consentModalOpen}
          onClose={() => setConsentModalOpen(false)}
          podName={activePod.name}
          podType={activePod.pod_type}
          consents={activeConsents}
          currentUserId={currentUserId}
          onUpdateConsent={updateConsent}
        />
      )}
    </div>
  );
}
