"use client";

import React, { useState } from "react";
import { X, Folder, Dumbbell, Cpu, Calendar, Trophy, Zap, Shield, Target } from "lucide-react";

interface NewSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSpace: (name: string, colorHex: string, icon: string) => Promise<void>;
}

const COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
];

const ICONS = [
  { id: "folder", icon: Folder, label: "Folder" },
  { id: "dumbbell", icon: Dumbbell, label: "Health" },
  { id: "cpu", icon: Cpu, label: "Tech" },
  { id: "calendar", icon: Calendar, label: "Planning" },
  { id: "trophy", icon: Trophy, label: "Goals" },
  { id: "zap", icon: Zap, label: "Sprint" },
  { id: "shield", icon: Shield, label: "Security" },
  { id: "target", icon: Target, label: "Targets" },
];

export function NewSpaceModal({ isOpen, onClose, onCreateSpace }: NewSpaceModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateSpace(name.trim(), selectedColor, selectedIcon);
      setName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#11131C] border border-[#222635] rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-semibold text-white mb-1">Create New Space</h3>
        <p className="text-xs text-zinc-400 mb-5">
          Organize projects, epics, and tasks within your Sovereign workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Space Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sovereign Operations"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0D0F17] border border-[#222635] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === color
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#11131C]"
                      : "opacity-75 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-[#0D0F17] border-[#222635] text-zinc-400 hover:text-zinc-200 hover:bg-[#161924]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-[#1E2230] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? "Creating..." : "Create Space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
