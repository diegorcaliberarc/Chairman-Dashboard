"use client";

import React, { useState } from "react";
import { ClarifyingQuestion } from "@/lib/synthesisRoadmapTypes";
import { X, Sparkles, Compass, ArrowRight, ArrowLeft, Check, Wand2 } from "lucide-react";

interface DoneWithYouModalProps {
  isOpen: boolean;
  initialGoal?: string;
  onClose: () => void;
  onSubmitAnswers: (answers: Record<string, string>, goal: string) => void;
  isProcessing?: boolean;
}

const DEFAULT_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "q_target",
    question: "What is your primary quantitative target & time horizon?",
    description: "Define the specific, measurable objective directive for this DAG roadmap.",
    placeholder: "e.g., '155 lbs @ 8% body fat in 90 days', or 'Utility sink built & leak tested by Saturday'...",
    suggestedAnswers: [
      "155 lbs @ 8% body fat in 90 days",
      "5 signed equipment rental clients ($25k MRR) in 60 days",
      "Workshop utility sink plumbed & tested by Saturday",
      "Nova & Astro 6-mile pack trotting routine locked",
    ],
  },
  {
    id: "q_inventory",
    question: "What assets, tools, data, or resources do you ALREADY HAVE?",
    description: "These become your Tier 0 [HAVE] baseline cards.",
    placeholder: "e.g., 'DEXA scan report + scale + 20 meal boxes', 'PEX crimper + pipe + SharkBite valves'...",
    suggestedAnswers: [
      "DEXA scan report + scale + 20 meal containers",
      "Next.js codebase + Supabase database + Stripe keys",
      "PEX-B pipe + crimper + SharkBite tees staged",
      "Dual tactical harnesses + hands-free running belt",
    ],
  },
  {
    id: "q_constraints",
    question: "What are your primary constraints, bottlenecks, or risks?",
    description: "These inform your [BLOCKED] audit badge and PACE contingency fallback protocols.",
    placeholder: "e.g., 'Strict evening curfew at 22:00', 'Specialized plumbing adapter delayed'...",
    suggestedAnswers: [
      "Strict evening sleep curfew (22:00) & blue-light fatigue",
      "Pending specialized plumbing adapter shipping from Amazon",
      "High daytime client meetings interrupting deep build blocks",
      "Hot afternoon pavement requiring early morning running",
    ],
  },
];

export function DoneWithYouModal({
  isOpen,
  initialGoal = "",
  onClose,
  onSubmitAnswers,
  isProcessing = false,
}: DoneWithYouModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [goal, setGoal] = useState(initialGoal || "155 lb lean cut @ 8% BF");
  const [answers, setAnswers] = useState<Record<string, string>>({
    q_target: initialGoal || "155 lbs @ 8% body fat in 90 days",
    q_inventory: "Verified tools and baseline equipment staged",
    q_constraints: "Zero known impediments (Clear)",
  });

  if (!isOpen) return null;

  const currentQ = DEFAULT_QUESTIONS[currentStep];
  const isLastStep = currentStep === DEFAULT_QUESTIONS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onSubmitAnswers(answers, goal);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0C101C]/95 border-2 border-amber-400/50 rounded-3xl p-6 shadow-2xl glow-amber flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-lg font-bold">
              <Compass size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                Done With You • Collaborative AI
              </span>
              <h3 className="text-base font-black text-white">Strategic Roadmap Calibration</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {DEFAULT_QUESTIONS.map((q, idx) => (
            <div
              key={q.id}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                idx <= currentStep ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Question Card */}
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>QUESTION {currentStep + 1} OF 3</span>
          </div>

          <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug">
            {currentQ.question}
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{currentQ.description}</p>

          {/* Quick Choice Chips */}
          {currentQ.suggestedAnswers && (
            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] uppercase font-mono text-amber-300/80 font-bold">
                Quick Selection Chips:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentQ.suggestedAnswers.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: sug }));
                      if (currentQ.id === "q_target") setGoal(sug);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition text-left border ${
                      answers[currentQ.id] === sug
                        ? "bg-amber-400/20 text-amber-300 border-amber-400 font-bold"
                        : "bg-white/[0.04] text-zinc-300 border-white/5 hover:bg-white/[0.08]"
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Input */}
          <div className="mt-3">
            <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block mb-1">
              Custom Answer:
            </span>
            <textarea
              rows={3}
              value={answers[currentQ.id] || ""}
              onChange={(e) => {
                const val = e.target.value;
                setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                if (currentQ.id === "q_target") setGoal(val);
              }}
              placeholder={currentQ.placeholder}
              className="w-full bg-[#05070E] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono resize-none"
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-30"
          >
            <ArrowLeft size={13} />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-400/30 hover:brightness-110 active:scale-95 transition"
          >
            <span>{isLastStep ? (isProcessing ? "Synthesizing..." : "Construct Custom DAG") : "Next Question"}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
