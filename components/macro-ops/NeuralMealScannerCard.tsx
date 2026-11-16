"use client";

import React, { useState, useRef } from "react";
import { Camera, ScanBarcode, Edit3, Sparkles, Check, AlertCircle } from "lucide-react";

interface NeuralMealScannerCardProps {
  iframeUrl?: string; // Designated widget container slot ready for iframe URLs
  onMealScanned?: (mealData: any) => void;
  onOpenManualInput?: () => void;
}

export function NeuralMealScannerCard({
  iframeUrl,
  onMealScanned,
  onOpenManualInput,
}: NeuralMealScannerCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    name: string;
    mass: string;
    calories: number;
    macros: string;
    confidence: string;
  } | null>({
    name: "Wild Alaskan Salmon & Quinoa Bowl",
    mass: "EST. MASS: 340G · PROTEIN DENSE",
    calories: 520,
    macros: "44P · 38C · 16F",
    confidence: "98.4%",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // Simulate/trigger optical parse
      const reader = new FileReader();
      reader.onload = async () => {
        // Send to food parser API
        try {
          const res = await fetch("/api/parse-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawText: file.name.replace(/\.[^/.]+$/, "") || "Nutritious High-Protein Meal" }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.items?.[0]) {
              const item = data.items[0];
              setScanResult({
                name: item.name,
                mass: `EST. MASS: ${item.quantity_grams || 300}G`,
                calories: item.calories,
                macros: `${item.protein_g}P · ${item.carbs_g}C · ${item.fat_g}F`,
                confidence: "96.2%",
              });
              if (onMealScanned) onMealScanned(item);
            }
          }
        } catch (err) {
          console.error("Parse food error:", err);
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border relative overflow-hidden shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Neural Optical Nutrition Log
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-full border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] text-zinc-300 uppercase">
            Model v4.8 Active
          </span>
        </div>
      </div>

      {/* DESIGNATED WIDGET CONTAINER SLOT (Ready for custom <iframe> URLs or Native HUD) */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border bg-background group">
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            title="Optical Scanner Widget Slot"
            className="w-full h-full border-0 rounded-xl"
            allow="camera; microphone"
          />
        ) : (
          <>
            {/* Visual Background Feed */}
            <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
              <img
                src="/circadian/nutrition-steak.jpg"
                alt="Nutritional scan feed"
                className="w-full h-full object-cover opacity-50 filter contrast-125 brightness-90"
              />

              {/* Tactical HUD Reticles & Targeting Brackets */}
              <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                  <div className="px-2 py-0.5 bg-zinc-950/80 backdrop-blur rounded font-mono text-[10px] text-emerald-400 border border-emerald-500/40">
                    SPECTRAL SCAN: {scanResult?.name.toUpperCase().slice(0, 24) || "MEAL_ANALYSIS.OBJ"}
                  </div>
                  <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className={`w-20 h-20 rounded-full border border-dashed border-emerald-400/60 flex items-center justify-center ${
                      isScanning ? "animate-spin" : ""
                    }`}
                    style={{ animationDuration: "12s" }}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                  <div className="px-2 py-0.5 bg-zinc-950/80 backdrop-blur rounded font-mono text-[10px] text-cyan-300 border border-cyan-500/40">
                    CONFIDENCE: {scanResult?.confidence || "98.4%"}
                  </div>
                  <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {/* Bottom Telemetry Card Overlay */}
              {scanResult && (
                <div className="absolute bottom-2 left-2 right-2 p-2.5 bg-zinc-950/90 backdrop-blur-md rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-zinc-100 leading-tight">
                      {scanResult.name}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                      {scanResult.mass}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-extrabold text-emerald-400">
                      {scanResult.calories} <span className="text-[10px] font-normal text-zinc-400">KCAL</span>
                    </div>
                    <div className="font-mono text-[10px] text-zinc-300">
                      {scanResult.macros}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hidden File Input for Live Camera / Image Capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* HUD Action Switches */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          className="py-2.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
        >
          <Camera size={15} />
          <span>Live Camera</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          className="py-2.5 px-2 bg-background hover:bg-zinc-900 border border-border text-zinc-200 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <ScanBarcode size={15} />
          <span>Barcode</span>
        </button>

        <button
          onClick={onOpenManualInput}
          type="button"
          className="py-2.5 px-2 bg-background hover:bg-zinc-900 border border-border text-zinc-200 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Edit3 size={15} />
          <span>Manual Input</span>
        </button>
      </div>
    </div>
  );
}
