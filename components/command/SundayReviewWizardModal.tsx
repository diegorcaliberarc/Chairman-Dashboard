"use client";

import React, { useState } from "react";
import {
  DomainScorecardItem,
  LifeDomain,
  ScorecardGrade,
  FailureClassification,
} from "@/lib/commandTypes";
import {
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Send,
  ShieldAlert,
  Save,
  Check,
  Trophy,
} from "lucide-react";

interface SundayReviewWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scorecards: DomainScorecardItem[];
  weekStartDate: string;
  onComplete: () => void;
}

export function SundayReviewWizardModal({
  isOpen,
  onClose,
  scorecards,
  weekStartDate,
  onComplete,
}: SundayReviewWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDomain, setSelectedDomain] = useState<LifeDomain>("health");
  const [auditedGrade, setAuditedGrade] = useState<ScorecardGrade>("B");

  // AAR Form state
  const [whatHappened, setWhatHappened] = useState("");
  const [whatWentWrong, setWhatWentWrong] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [failureClass, setFailureClass] = useState<FailureClassification>("execution");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [actionableFix, setActionableFix] = useState("");

  // Step 3 PMS tasks
  const [tasksToPush, setTasksToPush] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pmsSuccess, setPmsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveAar = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_aar",
          week_start_date: weekStartDate,
          domain: selectedDomain,
          audited_grade: auditedGrade,
          what_happened: whatHappened.trim(),
          what_went_wrong: whatWentWrong.trim(),
          root_cause: rootCause.trim(),
          failure_classification: failureClass,
          lessons_learned: lessonsLearned.trim(),
          actionable_fix: actionableFix.trim(),
          pms_tasks_created: [],
        }),
      });

      if (!res.ok) throw new Error("Failed to save AAR entry");
      // Auto populate step 3 tasks with the actionable fix
      if (actionableFix.trim() && !tasksToPush.trim()) {
        setTasksToPush(actionableFix.trim());
      }
      setCurrentStep(3);
    } catch (e) {
      console.error("AAR save error:", e);
      alert("Error saving AAR. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePushPmsTasks = async () => {
    setIsSubmitting(true);
    try {
      const taskLines = tasksToPush
        .split("\n")
        .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter((l) => l.length > 2);

      if (taskLines.length > 0) {
        await fetch("/api/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "push_frago_to_pms",
            domain: selectedDomain,
            sequenceType: "bottleneck",
            taskTitles: taskLines,
          }),
        });
      }

      setPmsSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    } catch (e) {
      console.error("Push tasks error:", e);
      alert("Error pushing tasks to PMS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-mono">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Sunday Review & AAR Wizard
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Week of {weekStartDate} | Step {currentStep} of 3:{" "}
              {currentStep === 1
                ? "Grade Audit"
                : currentStep === 2
                ? "After-Action Review (AAR)"
                : "1-Click Push FRAGO Tasks to PMS"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: GRADE AUDIT */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 font-sans">
              Review live adherence metrics across all 4 life pillars. Select which domain you want to audit for this week&apos;s AAR debrief:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {scorecards.map((sc) => {
                const isChosen = selectedDomain === sc.domain;
                return (
                  <div
                    key={sc.domain}
                    onClick={() => {
                      setSelectedDomain(sc.domain);
                      setAuditedGrade(sc.grade);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isChosen
                        ? "bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40"
                        : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold uppercase">{sc.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {sc.leadKpiValue} ({sc.leadKpiAdherencePct}%)
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-sm font-black">
                      {sc.grade}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-1">
                Audited Grade for {selectedDomain.toUpperCase()}
              </label>
              <div className="flex gap-2">
                {(["A", "B", "C", "D", "F"] as ScorecardGrade[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setAuditedGrade(g)}
                    className={`flex-1 py-1.5 rounded-xl border text-sm font-bold transition ${
                      auditedGrade === g
                        ? "bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-lg"
                        : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
              >
                <span>Proceed to AAR Entry</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AFTER-ACTION REVIEW (AAR ENTRY) */}
        {currentStep === 2 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                  1. What Happened vs What Was Planned?
                </label>
                <textarea
                  rows={2}
                  placeholder="Planned 7/7 deficit days, hit 5/7..."
                  value={whatHappened}
                  onChange={(e) => setWhatHappened(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-sans focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                  2. What Went Wrong & Root Cause?
                </label>
                <textarea
                  rows={2}
                  placeholder="Late night snacking after long coding sprint..."
                  value={whatWentWrong}
                  onChange={(e) => setWhatWentWrong(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-sans focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                3. Failure Classification
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(
                  [
                    "planning",
                    "execution",
                    "adversity",
                    "drift",
                    "unforeseen",
                  ] as FailureClassification[]
                ).map((fc) => (
                  <button
                    key={fc}
                    type="button"
                    onClick={() => setFailureClass(fc)}
                    className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold uppercase transition ${
                      failureClass === fc
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {fc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                  4. Lessons Learned (Permanent Rule)
                </label>
                <textarea
                  rows={2}
                  placeholder="Never keep snacks in immediate desk reach..."
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-sans focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                  5. Actionable Fix (Next Week Task)
                </label>
                <textarea
                  rows={2}
                  placeholder="Prep evening protein shake beforehand..."
                  value={actionableFix}
                  onChange={(e) => setActionableFix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-sans focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAar}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
              >
                <Save size={13} />
                <span>{isSubmitting ? "SAVING AAR..." : "SAVE AAR & PUSH TO PMS"}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 1-CLICK PUSH FRAGO TASKS TO PMS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>AAR Successfully Saved to Lesson Vault!</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 font-sans">
                Review and push the following tasks into Pristine PMS. They will be automatically tagged with{" "}
                <span className="text-rose-400 font-bold">BOTTLENECK</span> priority to ensure immediate execution.
              </p>
            </div>

            <div>
              <label className="text-[10px] uppercase text-zinc-400 block mb-1">
                Tasks to Dispatch to Pristine PMS (1 task per line)
              </label>
              <textarea
                rows={4}
                value={tasksToPush}
                onChange={(e) => setTasksToPush(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                placeholder="• Prep evening macro shake&#10;• Clear desk food clutter&#10;• Lock in 10k steps before 6 PM"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handlePushPmsTasks}
                disabled={isSubmitting || pmsSuccess}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-xs tracking-wider shadow-xl active:scale-95 transition disabled:opacity-50"
              >
                {pmsSuccess ? (
                  <>
                    <Check size={14} />
                    <span>TASKS DISPATCHED!</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{isSubmitting ? "DISPATCHING..." : "DISPATCH TASKS TO PMS"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
