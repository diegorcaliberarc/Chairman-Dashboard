"use client";

import React, { useState } from "react";
import { X, Plus, Sparkles, FolderPlus } from "lucide-react";
import { DiagramSpace } from "@/lib/architectureRegistry";

interface NewSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSpace: (space: DiagramSpace) => void;
}

export function NewSpaceModal({ isOpen, onClose, onCreateSpace }: NewSpaceModalProps) {
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("Custom Space");
  const [description, setDescription] = useState("");
  const [direction, setDirection] = useState<"TD" | "LR">("TD");
  const [template, setTemplate] = useState<"blank" | "microservices" | "data_pipeline">("microservices");

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let initialMermaid = "";
    if (template === "microservices") {
      initialMermaid = `flowchart ${direction}
  classDef serviceNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
  classDef dbNode fill:#1f1338,stroke:#a855f7,stroke-width:2px,color:#f3e8ff;

  subgraph API["🌐 GATEWAY & INGRESS"]
    GATEWAY["API Gateway<br/><code>/api/*</code>"]:::serviceNode
  end

  subgraph SERVICES["⚙️ MICROSERVICES"]
    AUTH_SVC["Auth Service"]:::serviceNode
    BIZ_SVC["Core Engine"]:::serviceNode
    NOTIF_SVC["Dispatch Engine"]:::serviceNode
  end

  subgraph PERSISTENCE["💾 DATA STORE"]
    MAIN_DB[("PostgreSQL DB")]:::dbNode
  end

  GATEWAY --> AUTH_SVC
  GATEWAY --> BIZ_SVC
  GATEWAY --> NOTIF_SVC
  AUTH_SVC --> MAIN_DB
  BIZ_SVC --> MAIN_DB`;
    } else if (template === "data_pipeline") {
      initialMermaid = `flowchart ${direction}
  classDef ingestNode fill:#06241b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;
  classDef procNode fill:#2d1b06,stroke:#f59e0b,stroke-width:2px,color:#fef3c7;
  classDef sinkNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;

  INGEST["Telemetry Ingestion"]:::ingestNode --> QUEUE["Event Buffer"]:::procNode
  QUEUE --> WORKER["Stream Processor"]:::procNode
  WORKER --> DB[("Analytics DB")]:::sinkNode`;
    } else {
      initialMermaid = `flowchart ${direction}
  classDef defaultNode fill:#091e3a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;

  A["Start Node"]:::defaultNode --> B["Next Node"]:::defaultNode`;
    }

    const newSpace: DiagramSpace = {
      id: `space-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "Custom architectural whiteboard space.",
      badge: badge.trim() || "Custom",
      direction,
      mermaidCode: initialMermaid,
      updatedAt: new Date().toISOString(),
    };

    onCreateSpace(newSpace);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#090D18] border border-white/10 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Create New Diagram Space</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-zinc-300">Space Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Supabase Schema & Auth Flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-zinc-300">Tab Badge</label>
              <input
                type="text"
                placeholder="e.g. DB Schema"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-zinc-300">Layout Direction</label>
              <div className="flex rounded-xl bg-black/50 border border-white/10 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDirection("TD")}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition ${
                    direction === "TD"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Top-Down
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("LR")}
                  className={`flex-1 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition ${
                    direction === "LR"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Left-Right
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-zinc-300">Description</label>
            <input
              type="text"
              placeholder="What this diagram workspace covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-zinc-300">Starter Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50"
            >
              <option value="microservices">Microservices & API Architecture</option>
              <option value="data_pipeline">Data & Telemetry Pipeline</option>
              <option value="blank">Blank Canvas</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition active:scale-[0.98]"
            >
              Create Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
