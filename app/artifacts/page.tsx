"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Sparkles,
  Plus,
  Search,
  Megaphone,
  FileBarChart2,
  CalendarRange,
  Globe,
  LayoutGrid,
  Presentation,
  Archive,
  Trash2,
  Eye,
  X,
  Pencil,
  Wand2,
} from "lucide-react";

type ArtifactCategory =
  | "Marketing"
  | "Report & Preview"
  | "Plan & Schedule"
  | "Websites"
  | "Apps & Dashboards"
  | "Guides & Slides";

interface WorkspaceArtifact {
  id: string;
  title: string;
  category: ArtifactCategory;
  summary: string;
  content: string;
  archived: boolean;
  createdAt: string;
  accent: string;
  version?: number;
}

const ARTIFACT_TEMPLATES: Array<{
  id: string;
  title: string;
  category: ArtifactCategory;
  description: string;
  accent: string;
  icon: React.ReactNode;
  starterContent: string;
}> = [
  {
    id: "art-marketing",
    title: "Marketing & Brand Studio",
    category: "Marketing",
    description: "Develop and optimize every facet of your brand, campaigns, and funnels.",
    accent: "#ec4899",
    icon: <Megaphone size={18} />,
    starterContent:
      "# Brand & Campaign Brief\n\n- **Positioning:** Clear, high-trust value proposition\n- **Core Channels:** Organic video, newsletter, direct outreach\n- **Conversion Goal:** Booked calls & qualified leads",
  },
  {
    id: "art-report",
    title: "Report & Preview",
    category: "Report & Preview",
    description: "Executive recaps, financial reviews, KPI snapshots, and live previews.",
    accent: "#4984fd",
    icon: <FileBarChart2 size={18} />,
    starterContent:
      "# Executive Report\n\n- **Key Wins:** \n- **Metrics Snapshot:** \n- **Next 7-Day Priorities:** ",
  },
  {
    id: "art-plan",
    title: "Plan & Schedule",
    category: "Plan & Schedule",
    description: "Launch schedules, sprint calendars, and milestone timelines.",
    accent: "#10b981",
    icon: <CalendarRange size={18} />,
    starterContent:
      "# Launch & Execution Schedule\n\n- **Phase 1 (Foundation):** \n- **Phase 2 (Build & QA):** \n- **Phase 3 (Launch & Review):** ",
  },
  {
    id: "art-websites",
    title: "Track & Manage Websites",
    category: "Websites",
    description: "Track live sites, landing pages, SEO health, and deployment checklists.",
    accent: "#f59e0b",
    icon: <Globe size={18} />,
    starterContent:
      "# Website Portfolio Tracker\n\n- **Primary Domain:** \n- **Landing Pages:** \n- **Performance & Analytics:** ",
  },
  {
    id: "art-apps",
    title: "Apps, Dashboards & Charts",
    category: "Apps & Dashboards",
    description: "Organize and look up apps, custom dashboards, and interactive charts.",
    accent: "#8b5cf6",
    icon: <LayoutGrid size={18} />,
    starterContent:
      "# App & Dashboard Spec\n\n- **Primary Views:** \n- **Live Data Sources:** \n- **Key Charts & KPIs:** ",
  },
  {
    id: "art-slides",
    title: "Guides & Slide Decks",
    category: "Guides & Slides",
    description: "Build structured team playbooks, SOP guides, and pitch presentations.",
    accent: "#06b6d4",
    icon: <Presentation size={18} />,
    starterContent:
      "# Presentation & Guide Outline\n\n1. Executive Summary\n2. Problem & Opportunity\n3. Execution Plan & Timeline",
  },
];

const STORAGE_KEY = "chairman-artifacts-v1";

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<WorkspaceArtifact[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "archived" | "templates">("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<WorkspaceArtifact | null>(null);

  // Form State
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState<ArtifactCategory>("Marketing");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftAccent, setDraftAccent] = useState("#4984fd");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const cacheLocal = (next: WorkspaceArtifact[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    let active = true;
    async function hydrateArtifacts() {
      try {
        const res = await fetch("/api/artifacts");
        if (res.ok) {
          const data = (await res.json()) as { artifacts?: WorkspaceArtifact[] };
          if (active && Array.isArray(data.artifacts)) {
            setArtifacts(data.artifacts);
            cacheLocal(data.artifacts);
            return;
          }
        }
      } catch {}
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setArtifacts(parsed);
        }
      } catch {}
    }
    void hydrateArtifacts();
    return () => {
      active = false;
    };
  }, []);

  const openBuilder = (tpl?: (typeof ARTIFACT_TEMPLATES)[number]) => {
    setEditingArtifactId(null);
    if (tpl) {
      setDraftTitle(tpl.title);
      setDraftCategory(tpl.category);
      setDraftSummary(tpl.description);
      setDraftContent(tpl.starterContent);
      setDraftAccent(tpl.accent);
    } else {
      setDraftTitle("");
      setDraftCategory("Marketing");
      setDraftSummary("");
      setDraftContent("");
      setDraftAccent("#4984fd");
    }
    setModalOpen(true);
  };

  const openEditArtifact = (item: WorkspaceArtifact) => {
    setEditingArtifactId(item.id);
    setDraftTitle(item.title);
    setDraftCategory(item.category);
    setDraftSummary(item.summary);
    setDraftContent(item.content);
    setDraftAccent(item.accent);
    setModalOpen(true);
  };

  const handleGenerateAiDraft = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_ai",
          title: draftTitle.trim() || `${draftCategory} Deliverable`,
          category: draftCategory,
          summary: draftSummary.trim(),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: string };
        if (data.content) setDraftContent(data.content);
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        id: editingArtifactId || undefined,
        title: draftTitle.trim(),
        category: draftCategory,
        summary: draftSummary.trim() || `${draftCategory} deliverable`,
        content: draftContent.trim(),
        accent: draftAccent,
      };
      const res = await fetch("/api/artifacts", {
        method: editingArtifactId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { artifact?: WorkspaceArtifact };
        if (data.artifact) {
          const saved = data.artifact;
          const next = editingArtifactId
            ? artifacts.map((a) => (a.id === editingArtifactId ? saved : a))
            : [saved, ...artifacts];
          setArtifacts(next);
          cacheLocal(next);
          setModalOpen(false);
          setEditingArtifactId(null);
          setActiveTab("all");
          return;
        }
      }
      const existing = artifacts.find((a) => a.id === editingArtifactId);
      const fallback: WorkspaceArtifact = {
        id: editingArtifactId || `art_${Date.now()}`,
        title: payload.title,
        category: payload.category,
        summary: payload.summary,
        content: payload.content,
        archived: existing?.archived ?? false,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        accent: payload.accent,
        version: (existing?.version || 0) + 1,
      };
      const next = editingArtifactId
        ? artifacts.map((a) => (a.id === editingArtifactId ? fallback : a))
        : [fallback, ...artifacts];
      setArtifacts(next);
      cacheLocal(next);
      setModalOpen(false);
      setEditingArtifactId(null);
      setActiveTab("all");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArchive = async (id: string) => {
    const target = artifacts.find((a) => a.id === id);
    if (!target) return;
    const nextArchived = !target.archived;
    const next = artifacts.map((a) => (a.id === id ? { ...a, archived: nextArchived } : a));
    setArtifacts(next);
    cacheLocal(next);
    try {
      await fetch("/api/artifacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archived: nextArchived }),
      });
    } catch {}
  };

  const deleteArtifact = async (id: string) => {
    const next = artifacts.filter((a) => a.id !== id);
    setArtifacts(next);
    cacheLocal(next);
    if (previewArtifact?.id === id) setPreviewArtifact(null);
    try {
      await fetch(`/api/artifacts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {}
  };

  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((a) => {
      if (activeTab === "archived" && !a.archived) return false;
      if ((activeTab === "all" || activeTab === "mine") && a.archived) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [artifacts, activeTab, search]);

  return (
    <ExecutiveModuleShell
      moduleId="ARTIFACTS"
      eyebrow="Operations & Creation"
      title="Artifacts"
      subtitle="Build anything your workspace needs: apps, websites, dashboards, reports, guides, charts, and slides"
      accentColor="#4984fd"
      headerActions={
        <button
          type="button"
          onClick={() => openBuilder()}
          className="cluely-cta text-[13px] px-4 py-1.5"
        >
          <Plus size={14} />
          <span>New Artifact</span>
        </button>
      }
    >
      {/* 1. Artifact Category Templates (Marketing, Reports, Plans, Websites, Apps/Dashboards, Slides) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[19px] font-medium tracking-[-0.38px]">
            Build together from any blueprint
          </h2>
          <p className="text-[13px] opacity-70">
            Create living deliverables—marketing hubs, live reports, websites, dashboards, charts, and slide decks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARTIFACT_TEMPLATES.map((tpl) => (
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
                    {tpl.title}
                  </h3>
                  <p className="text-[13px] leading-[1.55] opacity-75 mt-1">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openBuilder(tpl)}
                className="w-full py-2 px-3 rounded-[10px] border text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all hover:border-[#4984fd]"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                  color: "var(--glass-text-primary)",
                }}
              >
                <Plus size={14} className="text-[#4984fd]" />
                <span>Build artifact</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Workspace Artifacts Library */}
      <section className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: "All Artifacts" },
                { id: "mine", label: "Created by me" },
                { id: "archived", label: "Archived" },
                { id: "templates", label: "Templates" },
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
              placeholder="Search artifacts..."
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

        {activeTab === "templates" ? (
          <div className="text-[13px] opacity-75 p-6 rounded-[12px] border" style={{ borderColor: "var(--glass-border)" }}>
            All 6 core artifact blueprints (Marketing, Reports, Plans, Websites, Apps/Dashboards, Guides &amp; Slides) are displayed above—click any card to generate a new artifact.
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div
            className="rounded-[12px] border p-12 text-center space-y-3"
            style={{
              backgroundColor: "var(--glass-surface)",
              borderColor: "var(--glass-border)",
            }}
          >
            <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center bg-[#4984fd]/15 text-[#4984fd]">
              <Sparkles size={20} />
            </div>
            <h3 className="text-[17px] font-medium">No artifacts built yet</h3>
            <p className="text-[13px] opacity-70 max-w-md mx-auto">
              Artifacts are the concrete deliverables your workspace builds—apps, websites, reports, dashboards, guides, and slides. Click any blueprint above to create your first one.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openBuilder()}
                className="cluely-cta text-[13px]"
              >
                <Plus size={14} />
                <span>New Artifact</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArtifacts.map((item) => (
              <div
                key={item.id}
                className="rounded-[12px] border p-5 flex flex-col justify-between gap-4"
                style={{
                  backgroundColor: "var(--glass-surface-elevated)",
                  borderColor: "var(--glass-border)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-[6px] border font-medium"
                      style={{
                        borderColor: `${item.accent}45`,
                        backgroundColor: `${item.accent}15`,
                        color: item.accent,
                      }}
                    >
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 opacity-75">
                        v{item.version || 1}
                      </span>
                      <span className="text-[11px] opacity-55">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-[16px] font-medium">{item.title}</h3>
                  <p className="text-[13px] opacity-75 line-clamp-2">{item.summary}</p>
                </div>

                <div
                  className="pt-3 border-t flex items-center justify-between"
                  style={{ borderColor: "var(--glass-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewArtifact(item)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4984fd] hover:underline"
                  >
                    <Eye size={13} />
                    <span>Open preview</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditArtifact(item)}
                      className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-[#4984fd]"
                      title="Edit artifact"
                      data-testid={`artifact-edit-${item.id}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleArchive(item.id)}
                      className="p-1.5 rounded-lg opacity-60 hover:opacity-100"
                      title={item.archived ? "Unarchive" : "Archive"}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteArtifact(item.id)}
                      className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Artifact Modal */}
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
              <h3 className="text-[19px] font-medium">
                {editingArtifactId ? "Edit Artifact" : "Create Artifact"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingArtifactId(null);
                }}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveArtifact} className="space-y-4">
              <div>
                <label className="block text-[12px] opacity-75 mb-1">Artifact Title</label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g., Q4 Brand Launch Deck"
                  className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd]"
                  style={{
                    borderRadius: "0px",
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-[12px] opacity-75 mb-1">Category</label>
                <select
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value as ArtifactCategory)}
                  className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd]"
                  style={{
                    borderRadius: "0px",
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-primary)",
                  }}
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Report & Preview">Report &amp; Preview</option>
                  <option value="Plan & Schedule">Plan &amp; Schedule</option>
                  <option value="Websites">Websites</option>
                  <option value="Apps & Dashboards">Apps &amp; Dashboards</option>
                  <option value="Guides & Slides">Guides &amp; Slides</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] opacity-75 mb-1">Summary</label>
                <input
                  type="text"
                  value={draftSummary}
                  onChange={(e) => setDraftSummary(e.target.value)}
                  placeholder="Short description of this deliverable"
                  className="w-full px-3 py-2 text-[14px] border focus:outline-none focus:border-[#4984fd]"
                  style={{
                    borderRadius: "0px",
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                    color: "var(--glass-text-primary)",
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] opacity-75">
                    Content / Spec (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDraft}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#4984fd]/40 bg-[#4984fd]/15 text-[#4984fd] hover:bg-[#4984fd]/25 disabled:opacity-50"
                    data-testid="artifact-ai-generate"
                  >
                    <Wand2 size={12} />
                    <span>{isGeneratingAi ? "Generating..." : "AI Draft"}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Write or paste your report, website spec, dashboard plan, or slide outline..."
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
                  <Sparkles size={14} />
                  <span>Save Artifact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Artifact Preview Modal */}
      {previewArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-[16px] border p-6 space-y-4"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-primary)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--glass-border)" }}>
              <div>
                <span className="text-[11px] opacity-65">{previewArtifact.category}</span>
                <h3 className="text-[20px] font-medium">{previewArtifact.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArtifact(null)}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="p-4 rounded-[12px] border text-[14px] leading-[1.65] max-h-[60vh] overflow-y-auto prose prose-invert prose-sm max-w-none"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewArtifact.content || previewArtifact.summary}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
