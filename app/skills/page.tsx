"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Zap,
  Plus,
  Search,
  CheckCircle2,
  ListChecks,
  CalendarClock,
  UserPlus,
  Layers,
  MessageSquare,
  Sparkles,
  Trash2,
  Play,
  X,
  Upload,
} from "lucide-react";

interface CustomSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
  enabled: boolean;
  createdByMe: boolean;
  createdAt: string;
  accent: string;
}

const STARTER_SKILLS = [
  {
    id: "tpl-triage",
    name: "Triage Tasks Like Me",
    description: "Prioritizes, tags, and sorts incoming tasks the way you would.",
    category: "Operations",
    accent: "#4984fd",
    icon: <ListChecks size={18} />,
    defaultInstructions:
      "Review incoming tasks, rank P1/P2/P3 by strategic impact, flag blockers, and suggest due dates aligned with weekly priorities.",
  },
  {
    id: "tpl-plan",
    name: "Plan Like Me",
    description: "Structures weekly priorities, sprints, and time blocks in your style.",
    category: "Planning",
    accent: "#10b981",
    icon: <CalendarClock size={18} />,
    defaultInstructions:
      "Break the goal into milestones, map deep-work blocks to morning peak hours, and reserve buffer time for reviews.",
  },
  {
    id: "tpl-delegate",
    name: "Delegate Like Me",
    description: "Assigns and hands off work with crisp context and success criteria.",
    category: "Leadership",
    accent: "#ec4899",
    icon: <UserPlus size={18} />,
    defaultInstructions:
      "Draft a clear handoff brief with objective, definition of done, constraints, and check-in milestone.",
  },
  {
    id: "tpl-scope",
    name: "Scope Like Me",
    description: "Breaks down and sizes new work the way you usually would.",
    category: "Execution",
    accent: "#8b5cf6",
    icon: <Layers size={18} />,
    defaultInstructions:
      "Decompose the initiative into atomic deliverables, estimate effort, identify dependencies, and call out risks.",
  },
  {
    id: "tpl-update",
    name: "Update Like Me",
    description: "Drafts standups and status updates in your voice and tone.",
    category: "Communication",
    accent: "#f59e0b",
    icon: <MessageSquare size={18} />,
    defaultInstructions:
      "Summarize completed wins, active priorities, and blockers in concise executive bullets with zero fluff.",
  },
  {
    id: "tpl-brand",
    name: "Brand Voice",
    description: "Captures your tone, terminology, and audience for every message.",
    category: "Marketing",
    accent: "#06b6d4",
    icon: <Sparkles size={18} />,
    defaultInstructions:
      "Write with calm authority, modern clarity, tight sentences, and zero generic clichés.",
  },
];

const STORAGE_KEY = "chairman-skills-v1";

export default function SkillsPage() {
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "enabled" | "mine">("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Modal Form State
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftCategory, setDraftCategory] = useState("Operations");
  const [draftInstructions, setDraftInstructions] = useState("");
  const [draftAccent, setDraftAccent] = useState("#4984fd");

  // Quick Run Preview State
  const [runningSkill, setRunningSkill] = useState<CustomSkill | null>(null);
  const [runInput, setRunInput] = useState("");
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSkills(parsed);
      }
    } catch {}
  }, []);

  const saveSkills = (next: CustomSkill[]) => {
    setSkills(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const openFromTemplate = (tpl?: (typeof STARTER_SKILLS)[number]) => {
    if (tpl) {
      setDraftName(tpl.name);
      setDraftDesc(tpl.description);
      setDraftCategory(tpl.category);
      setDraftInstructions(tpl.defaultInstructions);
      setDraftAccent(tpl.accent);
    } else {
      setDraftName("");
      setDraftDesc("");
      setDraftCategory("Operations");
      setDraftInstructions("");
      setDraftAccent("#4984fd");
    }
    setModalOpen(true);
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) return;
    const newSkill: CustomSkill = {
      id: `skill_${Date.now()}`,
      name: draftName.trim(),
      description: draftDesc.trim() || "Custom reusable workflow skill",
      category: draftCategory,
      instructions: draftInstructions.trim(),
      enabled: true,
      createdByMe: true,
      createdAt: new Date().toISOString(),
      accent: draftAccent,
    };
    saveSkills([newSkill, ...skills]);
    setModalOpen(false);
  };

  const toggleSkill = (id: string) => {
    saveSkills(skills.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const deleteSkill = (id: string) => {
    saveSkills(skills.filter((s) => s.id !== id));
  };

  const handleRunSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runningSkill || !runInput.trim()) return;
    setIsRunning(true);
    setRunOutput(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Apply the skill "${runningSkill.name}".\nSkill instructions: ${runningSkill.instructions}\n\nUser input:\n${runInput.trim()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRunOutput(data.reply || data.message || data.text || "Skill executed successfully.");
      } else {
        setRunOutput(`Applied "${runningSkill.name}" instructions to your input:\n\n• ${runInput.trim()}\n• Playbook: ${runningSkill.instructions}`);
      }
    } catch {
      setRunOutput(`Applied "${runningSkill.name}" instructions locally:\n\n• Input: ${runInput.trim()}\n• Playbook: ${runningSkill.instructions}`);
    } finally {
      setIsRunning(false);
    }
  };

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      if (activeTab === "enabled" && !s.enabled) return false;
      if (activeTab === "mine" && !s.createdByMe) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [skills, activeTab, search]);

  return (
    <ExecutiveModuleShell
      moduleId="SKILLS"
      eyebrow="Operations & AI"
      title="Skills"
      subtitle="Turn repetitive workflows into reusable skills that work the way you do"
      accentColor="#4984fd"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openFromTemplate()}
            className="cluely-cta text-[13px] px-4 py-1.5"
          >
            <Plus size={14} />
            <span>New Skill</span>
          </button>
        </div>
      }
    >
      {/* 1. Starter Skill Templates Row (ClickUp-inspired) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[19px] font-medium tracking-[-0.38px]">
              Find skills for your workspace
            </h2>
            <p className="text-[13px] opacity-70">
              Pick a blueprint to teach your dashboard how you triage, plan, delegate, and scope work.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STARTER_SKILLS.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-[12px] border p-5 flex flex-col justify-between gap-4 transition-all"
              style={{
                backgroundColor: "var(--glass-surface-elevated)",
                borderColor: "var(--glass-border)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <div className="space-y-3">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center border"
                  style={{
                    backgroundColor: `${tpl.accent}18`,
                    borderColor: `${tpl.accent}40`,
                    color: tpl.accent,
                  }}
                >
                  {tpl.icon}
                </div>
                <div>
                  <h3 className="text-[16px] font-medium tracking-[-0.2px]">
                    {tpl.name}
                  </h3>
                  <p className="text-[13px] leading-[1.55] opacity-75 mt-1">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openFromTemplate(tpl)}
                className="w-full py-2 px-3 rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all hover:border-[#4984fd]"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                  color: "var(--glass-text-primary)",
                }}
              >
                <Plus size={14} className="text-[#4984fd]" />
                <span>Create skill</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Workspace Skills List + Filters */}
      <section className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(
              [
                { id: "all", label: "All Skills" },
                { id: "enabled", label: "Enabled" },
                { id: "mine", label: "Created by me" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className="px-3.5 py-1.5 rounded-[110px] text-[13px] font-medium border transition-all"
                style={{
                  backgroundColor:
                    activeTab === t.id ? "rgba(73, 132, 253, 0.14)" : "var(--glass-surface)",
                  borderColor:
                    activeTab === t.id ? "rgba(73, 132, 253, 0.5)" : "var(--glass-border)",
                  color: "var(--glass-text-primary)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-9 pr-3 py-2 text-[13px] border focus:outline-none focus:border-[#4984fd]"
              style={{
                borderRadius: "0px",
                backgroundColor: "var(--glass-surface-elevated)",
                borderColor: "var(--glass-border)",
                color: "var(--glass-text-primary)",
              }}
            />
          </div>
        </div>

        {filteredSkills.length === 0 ? (
          <div
            className="rounded-[12px] border p-12 text-center space-y-3"
            style={{
              backgroundColor: "var(--glass-surface)",
              borderColor: "var(--glass-border)",
            }}
          >
            <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center bg-[#4984fd]/15 text-[#4984fd]">
              <Zap size={20} />
            </div>
            <h3 className="text-[17px] font-medium">
              Skills teach your dashboard how you work
            </h3>
            <p className="text-[13px] opacity-70 max-w-md mx-auto">
              Turn a repetitive workflow into a reusable skill so you never explain it twice. Pick any template above or create one from scratch.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openFromTemplate()}
                className="cluely-cta text-[13px]"
              >
                <Plus size={14} />
                <span>Create skill</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-[12px] border p-5 flex flex-col justify-between gap-4"
                style={{
                  backgroundColor: "var(--glass-surface-elevated)",
                  borderColor: "var(--glass-border)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: skill.accent }}
                      />
                      <h3 className="text-[16px] font-medium truncate">{skill.name}</h3>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-[6px] border"
                        style={{
                          borderColor: "var(--glass-border)",
                          backgroundColor: "var(--glass-surface)",
                        }}
                      >
                        {skill.category}
                      </span>
                    </div>
                    <p className="text-[13px] opacity-75">{skill.description}</p>
                    {skill.instructions && (
                      <p className="text-[12px] opacity-60 line-clamp-2 pt-1">
                        {skill.instructions}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`px-2.5 py-1 rounded-[110px] text-[11px] font-medium border shrink-0 transition-colors ${
                      skill.enabled
                        ? "bg-[#4984fd]/15 border-[#4984fd]/40 text-[#4984fd]"
                        : "opacity-60 border-current"
                    }`}
                  >
                    {skill.enabled ? "Enabled" : "Paused"}
                  </button>
                </div>

                <div
                  className="pt-3 border-t flex items-center justify-between"
                  style={{ borderColor: "var(--glass-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRunningSkill(skill);
                      setRunInput("");
                      setRunOutput(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4984fd] hover:underline"
                  >
                    <Play size={13} />
                    <span>Run skill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSkill(skill.id)}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-500 transition-all"
                    title="Delete skill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Skill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-[16px] border p-6 space-y-4"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-primary)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[19px] font-medium">Create Skill</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-[12px] opacity-75 mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g., Triage Tasks Like Me"
                  className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd]"
                  style={{
                    borderRadius: "0px",
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-primary)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] opacity-75 mb-1">Category</label>
                  <select
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd]"
                    style={{
                      borderRadius: "0px",
                      backgroundColor: "var(--glass-surface)",
                      borderColor: "var(--glass-border)",
                      color: "var(--glass-text-primary)",
                    }}
                  >
                    <option value="Operations">Operations</option>
                    <option value="Planning">Planning</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Execution">Execution</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] opacity-75 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    placeholder="What this skill automates"
                    className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd]"
                    style={{
                      borderRadius: "0px",
                      backgroundColor: "var(--glass-surface)",
                      borderColor: "var(--glass-border)",
                      color: "var(--glass-text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] opacity-75 mb-1">
                  Instructions / Playbook (How you want it done)
                </label>
                <textarea
                  rows={4}
                  value={draftInstructions}
                  onChange={(e) => setDraftInstructions(e.target.value)}
                  placeholder="Describe the exact rules, tone, and steps for this skill..."
                  className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd] resize-none"
                  style={{
                    borderRadius: "0px",
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-primary)",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-[12px] border text-[13px] font-medium"
                  style={{ borderColor: "var(--glass-border)" }}
                >
                  Cancel
                </button>
                <button type="submit" className="cluely-cta text-[13px]">
                  <CheckCircle2 size={14} />
                  <span>Save Skill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Run Skill Modal */}
      {runningSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-[16px] border p-6 space-y-4"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-primary)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#4984fd]" />
                <h3 className="text-[18px] font-medium">Run: {runningSkill.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRunningSkill(null)}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRunSkill} className="space-y-3">
              <textarea
                rows={3}
                value={runInput}
                onChange={(e) => setRunInput(e.target.value)}
                placeholder="Paste tasks, notes, or context to run this skill on..."
                className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd] resize-none"
                style={{
                  borderRadius: "0px",
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                  color: "var(--glass-text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={isRunning || !runInput.trim()}
                className="cluely-cta w-full text-[13px] disabled:opacity-50"
              >
                <Play size={14} />
                <span>{isRunning ? "Running skill..." : "Execute Skill"}</span>
              </button>
            </form>

            {runOutput && (
              <div
                className="p-4 rounded-[12px] border text-[13px] leading-[1.6] whitespace-pre-wrap max-h-60 overflow-y-auto"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                }}
              >
                {runOutput}
              </div>
            )}
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
