"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Ban,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  FileCheck2,
  Flame,
  GraduationCap,
  History,
  Layers,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Unlock,
  Zap,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  CURRICULUM_CLASSES,
  ClassProgressRecord,
  CurriculumClass,
  EDUCATION_BADGES,
  EXECUTIVE_COURSE_OVERVIEW,
  FIVE_CLOSED_PILLARS,
  JARGON_TRANSLATION_MATRIX,
  MASTERY_TIERS,
  MasteryTierId,
  RANK_LEVEL_CURVE,
  SAFELY_EXCLUDED_DOMAINS,
  SPEC_FIRST_LIFECYCLE,
  THREE_ENTERPRISE_LAYERS,
  TOTAL_POSSIBLE_CURRICULUM_XP,
  getNextLevelInfo,
} from "@/lib/educationCurriculum";

type MainViewTab = "academy" | "classroom" | "pillars" | "jargon";
type TierFilter = "all" | MasteryTierId;

interface UserEducationProfile {
  user_id: string;
  xp: number;
  level: number;
  rank_title: string;
  streak_days: number;
  last_studied_at: string;
  unlocked_badges: string[];
  updated_at: string;
}

interface XpLedgerEntry {
  id: string;
  source_type: string;
  source_ref: string;
  xp_delta: number;
  note: string | null;
  created_at: string;
}

const DEFAULT_PROFILE: UserEducationProfile = {
  user_id: "chairman-default",
  xp: 0,
  level: 1,
  rank_title: "Zero-Code Orchestrator",
  streak_days: 1,
  last_studied_at: new Date().toISOString(),
  unlocked_badges: [],
  updated_at: new Date().toISOString(),
};

const TIER_COLORS: Record<MasteryTierId, { hex: string; badgeBg: string; border: string; text: string }> = {
  beginner: {
    hex: "#10b981",
    badgeBg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
  },
  advanced: {
    hex: "#f59e0b",
    badgeBg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-300",
  },
  master: {
    hex: "#8b5cf6",
    badgeBg: "bg-violet-500/15",
    border: "border-violet-500/30",
    text: "text-violet-300",
  },
};

export default function EducationAcademyPage() {
  const [activeView, setActiveView] = useState<MainViewTab>("academy");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [selectedClassSlug, setSelectedClassSlug] = useState<string>(
    CURRICULUM_CLASSES[0].slug
  );

  const [profile, setProfile] = useState<UserEducationProfile>(DEFAULT_PROFILE);
  const [progressRows, setProgressRows] = useState<ClassProgressRecord[]>([]);
  const [ledger, setLedger] = useState<XpLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [degradedMode, setDegradedMode] = useState<boolean>(false);

  // Classroom interactive state
  const [diagramMode, setDiagramMode] = useState<"macro" | "micro">("macro");
  const [quizSelections, setQuizSelections] = useState<Record<string, number>>({});
  const [quizSubmittedForSlug, setQuizSubmittedForSlug] = useState<Record<string, boolean>>({});
  const [adrDrafts, setAdrDrafts] = useState<Record<string, string>>({});
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean[]>>({});

  // Search & modals/drawers
  const [jargonQuery, setJargonQuery] = useState<string>("");
  const [jargonPillarFilter, setJargonPillarFilter] = useState<number | "all">("all");
  const [showOverviewDrawer, setShowOverviewDrawer] = useState<boolean>(false);
  const [showLedgerPanel, setShowLedgerPanel] = useState<boolean>(false);

  // XP Celebration Banner
  const [celebration, setCelebration] = useState<{
    xpAwarded: number;
    message: string;
    leveledUpTo?: { level: number; rankTitle: string };
  } | null>(null);

  const progressBySlug = useMemo(() => {
    const map = new Map<string, ClassProgressRecord>();
    for (const row of progressRows) {
      map.set(row.class_slug, row);
    }
    return map;
  }, [progressRows]);

  const activeClass: CurriculumClass = useMemo(() => {
    return (
      CURRICULUM_CLASSES.find((c) => c.slug === selectedClassSlug) ||
      CURRICULUM_CLASSES[0]
    );
  }, [selectedClassSlug]);

  const loadEducationState = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/education", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.progress)) {
          setProgressRows(data.progress);
          setAdrDrafts((prev) => {
            const next = { ...prev };
            for (const row of data.progress as ClassProgressRecord[]) {
              if (row.adr_notes && !next[row.class_slug]) {
                next[row.class_slug] = row.adr_notes;
              }
            }
            return next;
          });
        }
        if (Array.isArray(data.ledger)) setLedger(data.ledger);
        setDegradedMode(Boolean(data.degradedFallback));
      }
    } catch {
      setDegradedMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEducationState();
  }, [loadEducationState]);

  // Initialize ADR starter template when opening a class if empty
  useEffect(() => {
    setDiagramMode("macro");
    const saved = progressBySlug.get(activeClass.slug)?.adr_notes;
    setAdrDrafts((prev) => {
      if (prev[activeClass.slug] !== undefined) return prev;
      return {
        ...prev,
        [activeClass.slug]: saved || activeClass.adrLab.starterTemplate,
      };
    });
    setCheckedCriteria((prev) => {
      if (prev[activeClass.slug]) return prev;
      const isDone = Boolean(progressBySlug.get(activeClass.slug)?.lab_completed);
      return {
        ...prev,
        [activeClass.slug]: activeClass.adrLab.evaluationChecklist.map(() => isDone),
      };
    });
  }, [activeClass, progressBySlug]);

  const triggerCelebration = useCallback(
    (
      xpAwarded: number,
      message: string,
      prevLevel: number,
      nextProfile?: UserEducationProfile
    ) => {
      const leveledUp =
        nextProfile && nextProfile.level > prevLevel
          ? { level: nextProfile.level, rankTitle: nextProfile.rank_title }
          : undefined;

      setCelebration({ xpAwarded, message, leveledUpTo: leveledUp });
      setTimeout(() => {
        setCelebration((curr) => (curr?.message === message ? null : curr));
      }, 6000);
    },
    []
  );

  const runGamifiedAction = async (
    actionKey: string,
    payload: Record<string, unknown>
  ) => {
    const prevLevel = profile.level;
    try {
      setSubmittingAction(actionKey);
      const res = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.ok) {
        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.progress)) setProgressRows(data.progress);
        if (Array.isArray(data.ledger)) setLedger(data.ledger);
        setDegradedMode(Boolean(data.degradedFallback));

        triggerCelebration(
          Number(data.xpAwarded || 0),
          data.message || "Progress updated!",
          prevLevel,
          data.profile
        );
      } else if (data?.error) {
        triggerCelebration(0, data.error, prevLevel);
      }
    } catch {
      triggerCelebration(0, "Network error while saving progress.", prevLevel);
    } finally {
      setSubmittingAction(null);
    }
  };

  const openClassInClassroom = (cls: CurriculumClass) => {
    setSelectedClassSlug(cls.slug);
    setActiveView("classroom");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Computed HUD Metrics
  const levelInfo = useMemo(() => getNextLevelInfo(profile.xp), [profile.xp]);

  const curriculumStats = useMemo(() => {
    let completedLessons = 0;
    let passedQuizzes = 0;
    let completedLabs = 0;
    let fullyMasteredClasses = 0;

    for (const cls of CURRICULUM_CLASSES) {
      const row = progressBySlug.get(cls.slug);
      if (!row) continue;
      if (row.is_completed) completedLessons++;
      if (row.quiz_score >= 2) passedQuizzes++;
      if (row.lab_completed) completedLabs++;
      if (row.is_completed && row.quiz_score >= 2 && row.lab_completed) {
        fullyMasteredClasses++;
      }
    }

    const totalMilestones = CURRICULUM_CLASSES.length * 3; // 30 milestones across 10 classes
    const earnedMilestones = completedLessons + passedQuizzes + completedLabs;
    const masterCompletionPct = Math.min(
      100,
      Math.round((earnedMilestones / totalMilestones) * 100)
    );

    return {
      completedLessons,
      passedQuizzes,
      completedLabs,
      fullyMasteredClasses,
      earnedMilestones,
      totalMilestones,
      masterCompletionPct,
    };
  }, [progressBySlug]);

  const filteredClasses = useMemo(() => {
    if (tierFilter === "all") return CURRICULUM_CLASSES;
    return CURRICULUM_CLASSES.filter((c) => c.tier === tierFilter);
  }, [tierFilter]);

  const filteredJargon = useMemo(() => {
    const q = jargonQuery.trim().toLowerCase();
    return JARGON_TRANSLATION_MATRIX.filter((row) => {
      const matchesPillar =
        jargonPillarFilter === "all" || row.pillarId === jargonPillarFilter;
      if (!matchesPillar) return false;
      if (!q) return true;
      return (
        row.buzzwords.toLowerCase().includes(q) ||
        row.whatItActuallyIs.toLowerCase().includes(q) ||
        row.associatedClassLabel.toLowerCase().includes(q)
      );
    });
  }, [jargonQuery, jargonPillarFilter]);

  // Quiz submission handler
  const handleQuizSubmit = async () => {
    let correct = 0;
    for (const q of activeClass.quiz) {
      if (quizSelections[q.id] === q.correctIndex) {
        correct++;
      }
    }
    setQuizSubmittedForSlug((prev) => ({ ...prev, [activeClass.slug]: true }));
    await runGamifiedAction("submit_quiz", {
      action: "submit_quiz",
      classSlug: activeClass.slug,
      quizScore: correct,
      quizTotal: activeClass.quiz.length,
    });
  };

  const handleLabSubmit = async () => {
    const draft = adrDrafts[activeClass.slug] || "";
    await runGamifiedAction("submit_lab", {
      action: "submit_lab",
      classSlug: activeClass.slug,
      adrNotes: draft,
    });
  };

  const activeProgress = progressBySlug.get(activeClass.slug);
  const activeTierStyle = TIER_COLORS[activeClass.tier];
  const activePillar = FIVE_CLOSED_PILLARS.find((p) => p.id === activeClass.pillarId);

  // Radial Level Ring SVG math
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset =
    ringCircumference - (levelInfo.progressPct / 100) * ringCircumference;

  return (
    <ExecutiveModuleShell
      moduleId="EDUCATION"
      eyebrow="Education Department • Master Blueprint"
      title="Systems Engineering & Enterprise Architecture Academy"
      subtitle="Gamified progression from Zero-Code Orchestration to $250k+ Staff Platform Architect"
      accentColor="#8b5cf6"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOverviewDrawer((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showOverviewDrawer ? "Hide Blueprint Brief" : "Executive Overview"}
          </button>
          <button
            type="button"
            onClick={() => setShowLedgerPanel((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] transition flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            XP Ledger ({ledger.length})
          </button>
          <button
            type="button"
            onClick={loadEducationState}
            disabled={loading}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
            title="Sync Academy Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
    >
      {/* +XP Celebration Toast Banner */}
      {celebration && (
        <div className="rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-950/90 via-indigo-950/90 to-emerald-950/80 px-5 py-3.5 shadow-[0_0_35px_rgba(139,92,246,0.28)] flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/25 border border-violet-400/40 flex items-center justify-center text-violet-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {celebration.xpAwarded > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    +{celebration.xpAwarded} XP
                  </span>
                )}
                {celebration.leveledUpTo && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                    RANK UP → LVL {celebration.leveledUpTo.level}: {celebration.leveledUpTo.rankTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-200 mt-0.5">{celebration.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCelebration(null)}
            className="text-[11px] text-zinc-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP GAMIFICATION HUD */}
      <section className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#121526]/95 via-[#0d101b]/95 to-[#130f24]/95 backdrop-blur-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center relative z-10">
          {/* Level Ring + Current Rank Title */}
          <div className="xl:col-span-5 flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  stroke="#8b5cf6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  fill="transparent"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase tracking-widest text-violet-300 font-bold">
                  LVL
                </span>
                <span className="text-xl font-black text-white leading-none">
                  {profile.level}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Current Authority Rank
                </span>
                {degradedMode && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Local Resilient Cache
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight mt-1 truncate">
                {profile.rank_title}
              </h2>

              {/* Animated XP Progress Bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-violet-200">
                    {profile.xp.toLocaleString()} XP{" "}
                    <span className="text-zinc-500 font-normal">
                      /{" "}
                      {levelInfo.next
                        ? `${levelInfo.next.minXp.toLocaleString()} XP`
                        : `${TOTAL_POSSIBLE_CURRICULUM_XP.toLocaleString()} Max XP`}
                    </span>
                  </span>
                  <span className="text-zinc-400">
                    {levelInfo.next
                      ? `${levelInfo.xpNeededForNext.toLocaleString()} XP to ${levelInfo.next.rankTitle}`
                      : "Max Staff Authority Unlocked"}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/[0.07] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.max(3, levelInfo.progressPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Streak + Curriculum Completion Metrics */}
          <div className="xl:col-span-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
                  Study Streak
                </span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {profile.streak_days}{" "}
                <span className="text-xs font-semibold text-amber-200/80">
                  {profile.streak_days === 1 ? "day" : "days"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Daily Spec-First cadence
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
                  Mastery
                </span>
                <GraduationCap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {curriculumStats.masterCompletionPct}%
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {curriculumStats.earnedMilestones}/{curriculumStats.totalMilestones} gates cleared
              </p>
            </div>
          </div>

          {/* Unlocked Badges Shelf */}
          <div className="xl:col-span-4 rounded-xl border border-white/[0.08] bg-black/30 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Authority Seals & Badges ({profile.unlocked_badges.length}/
                {EDUCATION_BADGES.length})
              </span>
              <span className="text-[10px] text-zinc-500">
                {curriculumStats.completedLabs}/10 ADRs • {curriculumStats.passedQuizzes}/10 Quizzes
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-3 gap-1.5">
              {EDUCATION_BADGES.map((badge) => {
                const isUnlocked = profile.unlocked_badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    title={`${badge.title}: ${badge.description}`}
                    className={`rounded-lg px-2 py-1.5 border text-[10px] flex items-center gap-1.5 transition ${
                      isUnlocked
                        ? "border-white/20 bg-white/[0.08] text-white shadow-sm"
                        : "border-white/[0.05] bg-white/[0.02] text-zinc-500 opacity-60"
                    }`}
                  >
                    <Award
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: isUnlocked ? badge.accentHex : "#52525b" }}
                    />
                    <span className="truncate font-semibold">{badge.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spec-First Lifecycle Bar */}
        <div className="mt-4 pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300 mr-1">
              Spec-First Law:
            </span>
            {SPEC_FIRST_LIFECYCLE.map((item, idx) => (
              <React.Fragment key={item.step}>
                <div
                  title={item.detail}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-200 flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded-full bg-violet-500/25 text-violet-300 text-[10px] font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <span className="font-semibold">{item.phase}</span>
                </div>
                {idx < SPEC_FIRST_LIFECYCLE.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-[11px] text-zinc-400">
            Target Authority:{" "}
            <span className="text-emerald-300 font-bold">
              $250,000+ Staff / Principal Platform Architect
            </span>
          </div>
        </div>
      </section>

      {/* Collapsible Executive Course Overview */}
      {showOverviewDrawer && (
        <section className="rounded-2xl border border-violet-500/30 bg-[#101322]/95 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                Executive Course Overview • Master Blueprint
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {EXECUTIVE_COURSE_OVERVIEW.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                runGamifiedAction("reset_progress", { action: "reset_progress" })
              }
              disabled={submittingAction === "reset_progress"}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Replay Progress
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
              <div className="font-bold text-violet-300 mb-1">1. This Is The Course</div>
              <p className="text-zinc-300 leading-relaxed">
                {EXECUTIVE_COURSE_OVERVIEW.thisIsTheCourse}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
              <div className="font-bold text-emerald-300 mb-1">
                2. Used Directly In Your Platforms
              </div>
              <p className="text-zinc-300 leading-relaxed">
                {EXECUTIVE_COURSE_OVERVIEW.whereUsed}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
              <div className="font-bold text-amber-300 mb-1">3. Why It Commands $250k+</div>
              <p className="text-zinc-300 leading-relaxed">
                {EXECUTIVE_COURSE_OVERVIEW.whyImportant}
              </p>
            </div>
          </div>

          {/* 7-Level Rank Curve Strip */}
          <div className="pt-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              7-Tier Authority Progression Curve
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {RANK_LEVEL_CURVE.map((rk) => {
                const achieved = profile.xp >= rk.minXp;
                return (
                  <div
                    key={rk.level}
                    className={`rounded-xl p-2.5 border text-[11px] ${
                      achieved
                        ? "border-violet-400/40 bg-violet-500/15 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>LVL {rk.level}</span>
                      <span className="text-[10px] text-violet-300">
                        {rk.minXp.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="font-semibold mt-1 leading-snug">{rk.rankTitle}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Collapsible XP Ledger Feed */}
      {showLedgerPanel && (
        <section className="rounded-2xl border border-white/10 bg-[#0d101b]/95 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Immutable XP Audit Ledger (`education_xp_ledger`)
            </h3>
            <button
              type="button"
              onClick={() => setShowLedgerPanel(false)}
              className="text-[11px] text-zinc-400 hover:text-white"
            >
              Close
            </button>
          </div>
          {ledger.length === 0 ? (
            <p className="text-xs text-zinc-400">
              No XP events logged yet. Complete Class 1 briefing, quiz, or Spec-First ADR lab to mint your first ledger entry!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {ledger.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-200 truncate">
                      {item.note || item.source_ref}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] shrink-0">
                    +{item.xp_delta} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4 NAVIGATION VIEW TABS */}
      <nav className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        {[
          {
            id: "academy" as MainViewTab,
            label: "1. Skill Tree & 10-Class Academy",
            icon: Layers,
            badge: `${curriculumStats.fullyMasteredClasses}/10 Mastered`,
          },
          {
            id: "classroom" as MainViewTab,
            label: "2. Interactive Classroom & ADR Lab",
            icon: Terminal,
            badge: `Class ${activeClass.classNumber}`,
          },
          {
            id: "pillars" as MainViewTab,
            label: "3. 5 Closed Pillars & 3 Enterprise Layers",
            icon: ShieldCheck,
            badge: "Sec 11–12",
          },
          {
            id: "jargon" as MainViewTab,
            label: "4. 40-Jargon Decoder & Exclusions",
            icon: Search,
            badge: "Sec 13",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                active
                  ? "bg-violet-600/25 border-violet-400/50 text-white shadow-[0_0_20px_rgba(139,92,246,0.22)]"
                  : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="w-4 h-4 text-violet-300" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  active
                    ? "bg-violet-500/30 text-violet-100"
                    : "bg-white/[0.06] text-zinc-400"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ===================================================================== */}
      {/* TAB 1: SKILL TREE & 10-CLASS ACADEMY                                  */}
      {/* ===================================================================== */}
      {activeView === "academy" && (
        <div className="space-y-6">
          {/* Tier Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all" as TierFilter, label: "All 10 Classes (4,500 XP)" },
                { id: "beginner" as TierFilter, label: "Beginner Tier (Classes 1–3)" },
                { id: "advanced" as TierFilter, label: "Advanced Tier (Classes 4–7)" },
                { id: "master" as TierFilter, label: "Master Tier (Classes 8–10)" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTierFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    tierFilter === f.id
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Click any node to launch its Architecture Diagram, Quiz & Spec-First ADR Lab
            </div>
          </div>

          {/* Tier Sections & Interactive Skill Nodes */}
          {MASTERY_TIERS.filter(
            (t) => tierFilter === "all" || t.id === tierFilter
          ).map((tierMeta) => {
            const classesInTier = filteredClasses.filter(
              (c) => c.tier === tierMeta.id
            );
            const tierStyle = TIER_COLORS[tierMeta.id];
            const tierEarnedXp = classesInTier.reduce(
              (sum, c) => sum + (progressBySlug.get(c.slug)?.xp_earned || 0),
              0
            );
            const tierMaxXp = classesInTier.length * 450;

            return (
              <section
                key={tierMeta.id}
                className="rounded-2xl border border-white/[0.08] bg-[#0e111d]/90 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase border ${tierStyle.badgeBg} ${tierStyle.border} ${tierStyle.text}`}
                      >
                        {tierMeta.label} • {tierMeta.classRange}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {tierMeta.badgeTitle}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{tierMeta.subtitle}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-zinc-200">
                      {tierEarnedXp.toLocaleString()} / {tierMaxXp.toLocaleString()} XP
                    </div>
                    <div className="w-36 h-1.5 rounded-full bg-white/[0.07] mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((tierEarnedXp / tierMaxXp) * 100)}%`,
                          backgroundColor: tierMeta.accentHex,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Class Skill Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {classesInTier.map((cls) => {
                    const prog = progressBySlug.get(cls.slug);
                    const prevClass = CURRICULUM_CLASSES.find(
                      (c) => c.classNumber === cls.classNumber - 1
                    );
                    const prevDone =
                      !prevClass ||
                      Boolean(progressBySlug.get(prevClass.slug)?.is_completed);
                    const isMastered = Boolean(
                      prog?.is_completed &&
                        (prog?.quiz_score ?? 0) >= 2 &&
                        prog?.lab_completed
                    );
                    const earnedXp = prog?.xp_earned ?? 0;
                    const maxXp = cls.lessonXp + cls.quizXp + cls.labXp;
                    const pillar = FIVE_CLOSED_PILLARS.find(
                      (p) => p.id === cls.pillarId
                    );

                    return (
                      <div
                        key={cls.slug}
                        onClick={() => openClassInClassroom(cls)}
                        className={`group cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                          isMastered
                            ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/25 to-[#101422] hover:border-emerald-400/60"
                            : prevDone
                            ? "border-white/[0.11] bg-[#121626]/90 hover:border-violet-400/50 hover:bg-[#161b2e]"
                            : "border-white/[0.06] bg-[#0c0f1a]/80 hover:border-white/20"
                        }`}
                      >
                        <div>
                          {/* Top Row: Class Number + Status + XP */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border"
                                style={{
                                  borderColor: `${tierMeta.accentHex}55`,
                                  backgroundColor: `${tierMeta.accentHex}18`,
                                  color: tierMeta.accentHex,
                                }}
                              >
                                {cls.classNumber}
                              </span>
                              {isMastered ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  MASTERED
                                </span>
                              ) : prevDone ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                                  <Unlock className="w-3 h-3" />
                                  ACTIVE NODE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-zinc-400 border border-white/10 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  OPEN PREVIEW
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-extrabold text-amber-300">
                              {earnedXp}/{maxXp} XP
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition leading-snug">
                            {cls.title}
                          </h3>

                          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">
                            {cls.whatItTeaches}
                          </p>

                          {/* Enterprise Risk Neutralized Tag */}
                          <div className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/[0.07] px-2.5 py-1.5 flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="text-[11px]">
                              <span className="text-rose-300 font-bold">
                                Risk Neutralized:{" "}
                              </span>
                              <span className="text-zinc-200">
                                {cls.enterpriseRiskNeutralized}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Milestone Chips */}
                        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>Impact: {cls.primaryProjectImpact}</span>
                            {pillar && (
                              <span style={{ color: pillar.accentHex }}>
                                {pillar.name}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <div
                              className={`rounded px-2 py-1 text-center font-semibold border ${
                                prog?.is_completed
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-white/[0.03] border-white/[0.07] text-zinc-400"
                              }`}
                            >
                              Brief +100
                            </div>
                            <div
                              className={`rounded px-2 py-1 text-center font-semibold border ${
                                (prog?.quiz_score ?? 0) >= 2
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-white/[0.03] border-white/[0.07] text-zinc-400"
                              }`}
                            >
                              Quiz {prog ? `${prog.quiz_score}/${prog.quiz_total}` : "+150"}
                            </div>
                            <div
                              className={`rounded px-2 py-1 text-center font-semibold border ${
                                prog?.lab_completed
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-white/[0.03] border-white/[0.07] text-zinc-400"
                              }`}
                            >
                              ADR +200
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* 10-Class Master Summary Roadmap Matrix (PDF Page 14) */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0d101b]/95 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                  Executive Blueprint Reference
                </span>
                <h3 className="text-sm font-bold text-white">
                  10-Class Master Summary Roadmap
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Click any row to enter Interactive Classroom
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Primary Project Impact</th>
                    <th className="py-2.5 px-3">Enterprise Risk Neutralized</th>
                    <th className="py-2.5 px-3 text-right">XP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {CURRICULUM_CLASSES.map((cls) => {
                    const prog = progressBySlug.get(cls.slug);
                    const tColor = TIER_COLORS[cls.tier];
                    return (
                      <tr
                        key={cls.slug}
                        onClick={() => openClassInClassroom(cls)}
                        className="hover:bg-white/[0.04] cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                          <span className={tColor.text}>Class {cls.classNumber}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {cls.shortTitle}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300">
                          {cls.primaryProjectImpact}
                        </td>
                        <td className="py-2.5 px-3 text-rose-300">
                          {cls.enterpriseRiskNeutralized}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-300 whitespace-nowrap">
                          {prog?.xp_earned ?? 0} / 450 XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: INTERACTIVE CLASSROOM & ADR LAB                                */}
      {/* ===================================================================== */}
      {activeView === "classroom" && (
        <div className="space-y-5">
          {/* Quick Class Selector Strip (Classes 1..10) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CURRICULUM_CLASSES.map((cls) => {
              const selected = cls.slug === activeClass.slug;
              const prog = progressBySlug.get(cls.slug);
              const done = Boolean(
                prog?.is_completed &&
                  (prog?.quiz_score ?? 0) >= 2 &&
                  prog?.lab_completed
              );
              return (
                <button
                  key={cls.slug}
                  type="button"
                  onClick={() => setSelectedClassSlug(cls.slug)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition flex items-center gap-1.5 ${
                    selected
                      ? "bg-violet-600/30 border-violet-400 text-white shadow"
                      : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>C{cls.classNumber}</span>
                  <span className="hidden md:inline text-[11px] font-medium">
                    • {cls.shortTitle}
                  </span>
                  {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Classroom Header Banner */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#13172b] to-[#0f1220] p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${activeTierStyle.badgeBg} ${activeTierStyle.border} ${activeTierStyle.text}`}
                >
                  {activeClass.tier.toUpperCase()} TIER • CLASS {activeClass.classNumber} OF 10
                </span>
                {activePillar && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      color: activePillar.accentHex,
                      borderColor: `${activePillar.accentHex}44`,
                      backgroundColor: `${activePillar.accentHex}15`,
                    }}
                  >
                    Pillar {activePillar.name}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Neutralizes: {activeClass.enterpriseRiskNeutralized}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-2">
                Class {activeClass.classNumber}: {activeClass.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Primary Platform Target:{" "}
                <span className="text-zinc-200 font-semibold">
                  {activeClass.primaryProjectImpact}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                  Class Mastery XP
                </div>
                <div className="text-lg font-black text-amber-300">
                  {activeProgress?.xp_earned ?? 0} / 450 XP
                </div>
              </div>
              <button
                type="button"
                disabled={
                  submittingAction === "complete_lesson" ||
                  Boolean(activeProgress?.is_completed)
                }
                onClick={() =>
                  runGamifiedAction("complete_lesson", {
                    action: "complete_lesson",
                    classSlug: activeClass.slug,
                  })
                }
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                  activeProgress?.is_completed
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 cursor-default"
                    : "bg-violet-600 hover:bg-violet-500 border-violet-400 text-white shadow-lg"
                }`}
              >
                {activeProgress?.is_completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Briefing Complete (+100 XP Claimed)
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Complete Briefing (+100 XP)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SPLIT VIEW: Left = Briefing & Micro/Macro Diagram | Right = 3-Q Quiz & Spec-First ADR Lab */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (7 cols): Briefing + Architecture Diagram */}
            <div className="xl:col-span-7 space-y-5">
              {/* 4 Structured Briefing Cards */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0e111d]/95 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Executive Briefing & Architectural Mechanics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 mb-1">
                      What It Teaches
                    </div>
                    <p className="text-zinc-200 leading-relaxed">
                      {activeClass.whatItTeaches}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1">
                      Where It&apos;s Used In Project
                    </div>
                    <p className="text-zinc-200 leading-relaxed">
                      {activeClass.whereUsedInProject}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                      How That Stuff Works
                    </div>
                    <p className="text-zinc-200 leading-relaxed">
                      {activeClass.howItWorks}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300 mb-1">
                      Why It&apos;s Mission-Critical
                    </div>
                    <p className="text-zinc-200 leading-relaxed">
                      {activeClass.whyImportant}
                    </p>
                  </div>
                </div>

                {/* Core Concepts Pills */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Core Architectural Primitives
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeClass.coreConcepts.map((concept) => (
                      <span
                        key={concept}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-500/10 text-violet-200 border border-violet-500/25"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Micro-to-Macro Architecture Diagram Viewer */}
              <div className="rounded-2xl border border-emerald-500/25 bg-[#070a12] p-5 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                      Architecture Diagram (Micro to Macro Blueprint)
                    </span>
                  </div>

                  {activeClass.microDiagram && (
                    <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => setDiagramMode("macro")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                          diagramMode === "macro"
                            ? "bg-emerald-500/25 text-emerald-200"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        MACRO TOPOLOGY
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiagramMode("micro")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                          diagramMode === "micro"
                            ? "bg-emerald-500/25 text-emerald-200"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        MICRO INDEX ENGINE
                      </button>
                    </div>
                  )}
                </div>

                <pre className="text-[11px] md:text-xs font-mono leading-relaxed text-emerald-300/95 overflow-x-auto p-4 rounded-xl bg-black/70 border border-emerald-500/20">
                  {diagramMode === "micro" && activeClass.microDiagram
                    ? activeClass.microDiagram
                    : activeClass.asciiDiagram}
                </pre>
              </div>
            </div>

            {/* RIGHT COLUMN (5 cols): 3-Q Staff Quiz + Spec-First ADR Lab */}
            <div className="xl:col-span-5 space-y-5">
              {/* Interactive 3-Question Architecture Quiz */}
              <div className="rounded-2xl border border-white/[0.09] bg-[#0e111d]/95 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      Verification Gate • +150 XP
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Staff-Architect Scenario Quiz (3 Questions)
                    </h3>
                  </div>
                  {activeProgress && activeProgress.quiz_score > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Best: {activeProgress.quiz_score}/{activeProgress.quiz_total}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {activeClass.quiz.map((q, qIdx) => {
                    const selectedIdx = quizSelections[q.id];
                    const showFeedback = Boolean(
                      quizSubmittedForSlug[activeClass.slug]
                    );
                    return (
                      <div
                        key={q.id}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 space-y-2.5"
                      >
                        <div className="text-xs font-semibold text-zinc-100 leading-relaxed">
                          <span className="text-violet-400 font-bold mr-1.5">
                            Q{qIdx + 1}.
                          </span>
                          {q.scenario}
                        </div>

                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isPicked = selectedIdx === optIdx;
                            const isCorrect = optIdx === q.correctIndex;

                            let optionStyle =
                              "border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]";
                            if (showFeedback) {
                              if (isCorrect) {
                                optionStyle =
                                  "border-emerald-400/60 bg-emerald-500/15 text-emerald-100";
                              } else if (isPicked && !isCorrect) {
                                optionStyle =
                                  "border-rose-400/60 bg-rose-500/15 text-rose-200";
                              }
                            } else if (isPicked) {
                              optionStyle =
                                "border-violet-400 bg-violet-500/20 text-white";
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() =>
                                  setQuizSelections((prev) => ({
                                    ...prev,
                                    [q.id]: optIdx,
                                  }))
                                }
                                className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] leading-snug transition flex items-start gap-2 ${optionStyle}`}
                              >
                                <span className="font-bold text-zinc-400 shrink-0">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {showFeedback && (
                          <div className="rounded-lg bg-indigo-950/50 border border-indigo-400/30 p-2.5 text-[11px] text-indigo-100 leading-relaxed">
                            <span className="font-bold text-indigo-300">
                              Staff Defense Rationale:{" "}
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  {quizSubmittedForSlug[activeClass.slug] ? (
                    <button
                      type="button"
                      onClick={() =>
                        setQuizSubmittedForSlug((prev) => ({
                          ...prev,
                          [activeClass.slug]: false,
                        }))
                      }
                      className="text-xs text-zinc-400 hover:text-white underline"
                    >
                      Hide Rationales / Re-attempt
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-400">
                      Select answers for all 3 scenarios to verify
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={
                      submittingAction === "submit_quiz" ||
                      activeClass.quiz.some(
                        (q) => quizSelections[q.id] === undefined
                      )
                    }
                    onClick={handleQuizSubmit}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black transition flex items-center gap-1.5"
                  >
                    <Target className="w-3.5 h-3.5" />
                    {submittingAction === "submit_quiz"
                      ? "Grading..."
                      : "Verify Quiz Answers (+150 XP)"}
                  </button>
                </div>
              </div>

              {/* Spec-First ADR Defense Lab Editor */}
              <div className="rounded-2xl border border-violet-500/30 bg-[#101223]/95 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300 flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Spec-First Architecture Defense Lab • +200 XP
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {activeClass.adrLab.title}
                    </h3>
                  </div>

                  {activeProgress?.lab_completed && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      DEFENDED ✓
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.03] border border-white/[0.07] rounded-xl p-3">
                  {activeClass.adrLab.missionPrompt}
                </p>

                {/* Self-Audit Evaluation Checklist */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Executive Verification Rubric (Check as you specify):
                  </div>
                  {activeClass.adrLab.evaluationChecklist.map((item, idx) => {
                    const list = checkedCriteria[activeClass.slug] || [];
                    const checked = Boolean(list[idx]);
                    return (
                      <label
                        key={idx}
                        className="flex items-start gap-2 text-[11px] text-zinc-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = [...list];
                            next[idx] = !checked;
                            setCheckedCriteria((prev) => ({
                              ...prev,
                              [activeClass.slug]: next,
                            }));
                          }}
                          className="mt-0.5 rounded border-white/20 bg-black/50 text-violet-500 focus:ring-violet-500"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Markdown / Monospace ADR Editor */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Persisted to PostgreSQL (`education_class_progress.adr_notes`)</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAdrDrafts((prev) => ({
                          ...prev,
                          [activeClass.slug]: activeClass.adrLab.starterTemplate,
                        }))
                      }
                      className="text-violet-300 hover:text-violet-200 underline"
                    >
                      Reset Starter Template
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={adrDrafts[activeClass.slug] ?? ""}
                    onChange={(e) =>
                      setAdrDrafts((prev) => ({
                        ...prev,
                        [activeClass.slug]: e.target.value,
                      }))
                    }
                    placeholder="Write your Spec-First Architecture Decision Record..."
                    className="w-full rounded-xl bg-black/60 border border-white/15 focus:border-violet-400 focus:outline-none p-3 text-xs font-mono text-zinc-100 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-zinc-500">
                    {(adrDrafts[activeClass.slug] || "").length} chars
                  </span>
                  <button
                    type="button"
                    disabled={submittingAction === "submit_lab"}
                    onClick={handleLabSubmit}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/50 shadow-lg transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {submittingAction === "submit_lab"
                      ? "Persisting ADR..."
                      : activeProgress?.lab_completed
                      ? "Update Saved ADR Notes"
                      : "Commit & Defend ADR (+200 XP)"}
                  </button>
                </div>
              </div>

              {/* Next Class Navigation Button */}
              {activeClass.classNumber < 10 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextCls = CURRICULUM_CLASSES.find(
                      (c) => c.classNumber === activeClass.classNumber + 1
                    );
                    if (nextCls) openClassInClassroom(nextCls);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-zinc-200 flex items-center justify-between transition"
                >
                  <span>
                    Proceed to Class {activeClass.classNumber + 1}:{" "}
                    {
                      CURRICULUM_CLASSES.find(
                        (c) => c.classNumber === activeClass.classNumber + 1
                      )?.shortTitle
                    }
                  </span>
                  <ChevronRight className="w-4 h-4 text-violet-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: 5 CLOSED PILLARS & 3 OPERATIONAL ENTERPRISE LAYERS (SEC 11–12) */}
      {/* ===================================================================== */}
      {activeView === "pillars" && (
        <div className="space-y-6">
          {/* Section 11: The 5 Closed Pillars of Systems Engineering */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0e111d]/95 p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                Section 11 • The Universal Boundary
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5">
                The 5 Closed Pillars of Systems Engineering
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                There are not dozens of hidden concepts. The absolute ceiling of cloud and platform systems engineering is strictly bounded by these five universal pillars.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {FIVE_CLOSED_PILLARS.map((pillar) => {
                const linkedClasses = CURRICULUM_CLASSES.filter((c) =>
                  pillar.classNumbers.includes(c.classNumber)
                );
                const earned = linkedClasses.reduce(
                  (s, c) => s + (progressBySlug.get(c.slug)?.xp_earned || 0),
                  0
                );
                const max = linkedClasses.length * 450;
                const pct = max > 0 ? Math.round((earned / max) * 100) : 0;

                return (
                  <div
                    key={pillar.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                          style={{
                            backgroundColor: `${pillar.accentHex}20`,
                            color: pillar.accentHex,
                          }}
                        >
                          {pillar.domain}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-300">
                          {pct}%
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-2">
                        {pillar.name}
                      </h3>

                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        {pillar.coreResponsibility}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="text-[10px] text-zinc-400 font-semibold">
                        {pillar.coveredClasses}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedClasses.map((cls) => (
                          <button
                            key={cls.slug}
                            type="button"
                            onClick={() => openClassInClassroom(cls)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/[0.06] hover:bg-violet-500/25 text-zinc-200 border border-white/10 transition"
                          >
                            Open Class {cls.classNumber} →
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 12: The 3 Operational Enterprise Layers */}
          <section className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Section 12 • Executive Production Governance
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5">
                The 3 Operational Enterprise Layers
              </h2>
              <p className="text-xs text-zinc-400">
                These operational disciplines separate a junior code builder from a $250k+ Staff Platform Architect.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {THREE_ENTERPRISE_LAYERS.map((layer) => (
                <div
                  key={layer.id}
                  className="rounded-2xl border border-white/[0.09] bg-[#0e111d]/95 p-5 space-y-4"
                >
                  <div className="border-b border-white/[0.07] pb-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
                      style={{
                        backgroundColor: `${layer.accentHex}22`,
                        color: layer.accentHex,
                      }}
                    >
                      {layer.code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-2">
                      {layer.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{layer.subtitle}</p>
                  </div>

                  <div className="space-y-3">
                    {layer.disciplines.map((d) => (
                      <div
                        key={d.name}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">
                            {d.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                            style={{
                              backgroundColor: `${layer.accentHex}18`,
                              color: layer.accentHex,
                            }}
                          >
                            {d.standards}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                          {d.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: 40-JARGON DECODER & SAFELY EXCLUDED DOMAINS (SECTION 13)       */}
      {/* ===================================================================== */}
      {activeView === "jargon" && (
        <div className="space-y-6">
          {/* Jargon Translation Matrix */}
          <section className="rounded-2xl border border-white/[0.09] bg-[#0e111d]/95 p-5 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                  Section 13 • Buzzword Deconstruction Engine
                </span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">
                  Demystifying the &ldquo;40 Things&rdquo;: Industry Jargon vs. Core Foundations
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Every intimidating vendor buzzword reduces directly to one of the 10 Master Classes and 5 Closed Pillars.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={jargonQuery}
                  onChange={(e) => setJargonQuery(e.target.value)}
                  placeholder="Search Kafka, Kubernetes, GraphQL, Citus..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>

            {/* Pillar Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setJargonPillarFilter("all")}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition ${
                  jargonPillarFilter === "all"
                    ? "bg-violet-500/25 border-violet-400/50 text-white"
                    : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-white"
                }`}
              >
                All Pillars ({JARGON_TRANSLATION_MATRIX.length})
              </button>
              {FIVE_CLOSED_PILLARS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setJargonPillarFilter(p.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition ${
                    jargonPillarFilter === p.id
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-white"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Matrix Cards / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredJargon.map((row) => {
                const pillar = FIVE_CLOSED_PILLARS.find(
                  (p) => p.id === row.pillarId
                );
                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {row.individualTerms.map((term) => (
                          <span
                            key={term}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-500/15 text-violet-200 border border-violet-500/25"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-zinc-200 font-medium leading-relaxed">
                        <span className="text-emerald-300 font-bold">
                          What It Actually Is:{" "}
                        </span>
                        {row.whatItActuallyIs}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: pillar?.accentHex || "#a1a1aa" }}
                      >
                        {row.associatedClassLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {row.associatedClassNumbers.map((num) => {
                          const target = CURRICULUM_CLASSES.find(
                            (c) => c.classNumber === num
                          );
                          if (!target) return null;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => openClassInClassroom(target)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/[0.06] hover:bg-violet-500/25 text-white border border-white/10 transition"
                            >
                              Study Class {num} →
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5 Domains Safely Excluded from Cloud Platform Architecture */}
          <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#16120b] to-[#0e111d] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Executive Focus Guardrail • Zero Low-ROI Distractions
                </span>
                <h2 className="text-base font-extrabold text-white">
                  5 Domains Safely Excluded from Cloud Platform Architecture
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ignore these rabbit holes completely—they are unnecessary for building, scaling, or defending $250k+ enterprise cloud SaaS platforms.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {SAFELY_EXCLUDED_DOMAINS.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-xl border border-white/[0.08] bg-black/35 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      Excluded #{ex.id}
                    </span>
                    <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">
                    {ex.title}
                  </h3>
                  <div className="text-[10px] font-mono text-amber-200/80">
                    {ex.technologies}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {ex.rationale}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
