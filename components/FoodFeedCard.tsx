"use client";

import React, { useState } from "react";
import Image from "next/image";
import { resolveFoodImage } from "@/lib/foodImages";
import { Trash2, Edit2, Check, X, Clock, Droplets, AlertCircle } from "lucide-react";

export interface FoodEntry {
  id: string;
  log_date: string;
  meal_window?: string;
  raw_input?: string;
  name: string;
  quantity_grams: number;
  weight_lbs: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  cholesterol_mg: number;
  water_oz: number;
  image_key: string;
  is_estimated: boolean;
  logged_at?: string;
}

interface FoodFeedCardProps {
  entries: FoodEntry[];
  onEntryUpdated: () => Promise<void>;
  onEntryDeleted: () => Promise<void>;
}

export function FoodFeedCard({
  entries,
  onEntryUpdated,
  onEntryDeleted,
}: FoodFeedCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGrams, setEditGrams] = useState(100);
  const [editCalories, setEditCalories] = useState(100);
  const [editProtein, setEditProtein] = useState(10);
  const [editCarbs, setEditCarbs] = useState(0);
  const [editFat, setEditFat] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (entry: FoodEntry) => {
    setEditingId(entry.id);
    setEditName(entry.name);
    setEditGrams(Number(entry.quantity_grams));
    setEditCalories(Number(entry.calories));
    setEditProtein(Number(entry.protein_g));
    setEditCarbs(Number(entry.carbs_g));
    setEditFat(Number(entry.fat_g));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          quantity_grams: editGrams,
          calories: editCalories,
          protein_g: editProtein,
          carbs_g: editCarbs,
          fat_g: editFat,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await onEntryUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteEntry = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/nutrition?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await onEntryDeleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl bg-[#141418] border border-[#1E1E24] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Visual Food Log Feed
          </h2>
          <p className="text-[11px] text-zinc-500 font-mono">
            {entries.length} Items Logged Today • Matched Photography
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400">
          Total Mass: {entries.reduce((acc, e) => acc + Number(e.weight_lbs || 0), 0).toFixed(2)} lbs
        </span>
      </div>

      {/* Feed List */}
      {entries.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] text-zinc-500 text-xs font-mono">
          No food items logged yet today. Use the AI input bar above to log your first meal!
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => {
            const imgMeta = resolveFoodImage(entry.image_key);
            const isEditing = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className="p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Thumbnail & Food Info */}
                <div className="flex items-center gap-3.5">
                  {/* Photo Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm bg-zinc-900">
                    <img
                      src={imgMeta.url}
                      alt={entry.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {entry.is_estimated && (
                      <span
                        title="Portion Estimated (no exact grams given)"
                        className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-amber-500 text-black text-[8px] font-bold font-mono tracking-tighter"
                      >
                        EST
                      </span>
                    )}
                  </div>

                  {/* Details or Edit Form */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-[#141418] border border-zinc-700 text-xs font-mono text-zinc-100"
                      />
                      <input
                        type="number"
                        value={editGrams}
                        onChange={(e) => setEditGrams(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg bg-[#141418] border border-zinc-700 text-xs font-mono text-zinc-100"
                        placeholder="g"
                      />
                      <input
                        type="number"
                        value={editCalories}
                        onChange={(e) => setEditCalories(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg bg-[#141418] border border-zinc-700 text-xs font-mono text-zinc-100"
                        placeholder="cal"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={editProtein}
                        onChange={(e) => setEditProtein(Number(e.target.value))}
                        className="w-14 px-2 py-1 rounded-lg bg-[#141418] border border-zinc-700 text-xs font-mono text-zinc-100"
                        placeholder="P"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-zinc-100">
                          {entry.name}
                        </span>
                        {entry.meal_window && (
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#1E1E24] text-zinc-400 font-mono">
                            {entry.meal_window === "pre_fast" ? "Pre-Fast" : entry.meal_window === "post_fast" ? "Post-Fast" : "General"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-400 flex-wrap">
                        <span className="text-emerald-400 font-bold">{entry.calories} kcal</span>
                        <span>•</span>
                        <span className="text-zinc-200">{Number(entry.protein_g).toFixed(1)}g P</span>
                        <span>•</span>
                        <span>{Number(entry.carbs_g).toFixed(1)}g C</span>
                        <span>•</span>
                        <span>{Number(entry.fat_g).toFixed(1)}g F</span>
                        {Number(entry.cholesterol_mg) > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400/90">{entry.cholesterol_mg}mg chol</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Grams/Lbs Badge & Edit/Delete Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1E1E24]">
                  {!isEditing && (
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-xs font-bold text-zinc-200">
                        {Number(entry.quantity_grams).toFixed(0)}g
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {Number(entry.weight_lbs).toFixed(2)} lbs
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(entry.id)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#1E1E24] transition-colors"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

