"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Utensils,
  Check,
  Plus,
  Mic,
  MicOff,
  Flame,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FOOD_IMAGES, CanonicalFoodImageKey } from "@/lib/foodImages";

interface QuickMealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSaved: () => void;
  autoStartVoice?: boolean;
}

export function QuickMealLogModal({
  isOpen,
  onClose,
  selectedDate,
  onSaved,
  autoStartVoice = false,
}: QuickMealLogModalProps) {
  const [activeMode, setActiveMode] = useState<"ai" | "manual">("ai");
  const [naturalText, setNaturalText] = useState("");
  const [name, setName] = useState("");
  const [mealWindow, setMealWindow] = useState("lunch");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successItems, setSuccessItems] = useState<any[] | null>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and check SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Cleanup speech recognition on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Auto-start voice if requested when modal opens
  useEffect(() => {
    if (isOpen && autoStartVoice && speechSupported) {
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoStartVoice, speechSupported]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setError(null);
    setVoiceFeedback(null);
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please type your meal.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback("Listening... describe your meal (e.g. '160g chicken breast and a handful of potatoes')");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        const cleaned = transcript.trim();
        if (cleaned) {
          setNaturalText(cleaned);
          setVoiceFeedback(`Heard: "${cleaned}"`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone permission was denied. Please allow microphone access or type below.");
        } else if (event.error !== "no-speech") {
          setError(`Voice input notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      setError("Could not activate microphone. Please type your food description.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    if (isListening) {
      stopListening();
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessItems(null);

    try {
      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: naturalText.trim(),
          rawText: naturalText.trim(),
          log_date: selectedDate,
          meal_window: mealWindow,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse food");
      }

      const items = data.entries || data.items || [];
      if (items.length > 0) {
        // If DB insertion was not completed on the server, insert entries client-side
        if (!data.inserted) {
          for (const item of items) {
            await fetch("/api/nutrition", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create_entry",
                log_date: selectedDate,
                meal_window: item.meal_window || mealWindow,
                name: item.name,
                raw_input: naturalText,
                quantity_grams: item.quantity_grams || 150,
                weight_lbs: item.weight_lbs || 0.33,
                calories: item.calories,
                protein_g: item.protein_g,
                carbs_g: item.carbs_g,
                fat_g: item.fat_g,
                cholesterol_mg: item.cholesterol_mg || 0,
                water_oz: item.water_oz || 0,
                image_key: item.image_key || "default_food",
                is_estimated: Boolean(item.is_estimated),
              }),
            });
          }
        }

        setSuccessItems(items);
        onSaved();

        // Brief delay to showcase the parsed items with images
        setTimeout(() => {
          onClose();
          setSuccessItems(null);
          setNaturalText("");
        }, 1200);
      } else {
        setError("Could not parse macros. Please enter manually.");
        setActiveMode("manual");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse meal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_entry",
          log_date: selectedDate,
          meal_window: mealWindow,
          name: name.trim(),
          raw_input: `${name.trim()} (${mealWindow})`,
          quantity_grams: 300,
          weight_lbs: 0.66,
          calories: parseInt(calories || "0", 10),
          protein_g: parseFloat(proteinG || "0"),
          carbs_g: parseFloat(carbsG || "0"),
          fat_g: parseFloat(fatG || "0"),
          is_estimated: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to save entry");
      onSaved();
      onClose();
      setName("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
    } catch (err: any) {
      setError(err.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
        style={{
          backgroundColor: "var(--glass-surface, #0d1120)",
          backdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
          WebkitBackdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
          borderColor: "var(--glass-border, rgba(255,255,255,0.12))",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated, #13182b)",
            borderColor: "var(--glass-border, rgba(255,255,255,0.1))",
          }}
        >
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-cyan-400" />
            <h3 className="font-mono font-bold text-sm text-zinc-100 uppercase tracking-wider">
              Log Nutritional Intake // Fuel OS
            </h3>
          </div>
          <button
            onClick={() => {
              if (isListening) stopListening();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div
          className="flex border-b p-2 gap-2 text-xs font-mono transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated, #13182b)",
            borderColor: "var(--glass-border, rgba(255,255,255,0.1))",
          }}
        >
          <button
            onClick={() => setActiveMode("ai")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 font-bold ${
              activeMode === "ai"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} className={activeMode === "ai" ? "text-cyan-400" : ""} />
            <span>AI Natural Voice & Text</span>
          </button>
          <button
            onClick={() => {
              if (isListening) stopListening();
              setActiveMode("manual");
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 font-bold ${
              activeMode === "manual"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Plus size={14} />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successItems && successItems.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold uppercase">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                <span>Logged {successItems.length} Food Item(s) to Ledger!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {successItems.map((item, idx) => {
                  const img = FOOD_IMAGES[item.image_key as CanonicalFoodImageKey] || FOOD_IMAGES.default_food;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5"
                    >
                      <img
                        src={img?.url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                        alt={item.name}
                        className="w-8 h-8 rounded-md object-cover shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {item.calories} kcal · {item.protein_g}P
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMode === "ai" ? (
            <form onSubmit={handleAiParse} className="space-y-4">
              {/* Voice Listening Waveform / Mic Dock */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isListening
                    ? "bg-cyan-950/40 border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        isListening
                          ? "bg-cyan-500 text-zinc-950 shadow-[0_0_20px_#00f0ff] animate-pulse"
                          : "bg-white/10 text-cyan-300 hover:bg-white/20 border border-white/10"
                      }`}
                      title={isListening ? "Stop listening" : "Click to speak your meal"}
                    >
                      {isListening ? <Mic size={22} className="animate-bounce" /> : <Mic size={20} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          Voice Bio-Logger
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                            isListening
                              ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 animate-pulse"
                              : "bg-white/5 border-white/10 text-zinc-400"
                          }`}
                        >
                          {isListening ? "● Listening" : "Tap Mic to Speak"}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {voiceFeedback || "Speak naturally: e.g. '160g chicken breast and a handful of potatoes'"}
                      </p>
                    </div>
                  </div>

                  {/* Audio Waveform visualization */}
                  {isListening && (
                    <div className="flex items-center gap-1 shrink-0 px-2 py-1">
                      <div className="w-1 bg-cyan-400 rounded-full h-4 animate-pulse [animation-delay:100ms]" />
                      <div className="w-1 bg-cyan-300 rounded-full h-6 animate-pulse [animation-delay:250ms]" />
                      <div className="w-1 bg-cyan-400 rounded-full h-8 animate-pulse [animation-delay:400ms]" />
                      <div className="w-1 bg-cyan-300 rounded-full h-5 animate-pulse [animation-delay:150ms]" />
                      <div className="w-1 bg-cyan-400 rounded-full h-3 animate-pulse [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Natural Text Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-mono text-xs text-zinc-400 uppercase">
                    Food Telemetry Description:
                  </label>
                  {naturalText && (
                    <button
                      type="button"
                      onClick={() => setNaturalText("")}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    value={naturalText}
                    onChange={(e) => setNaturalText(e.target.value)}
                    rows={3}
                    placeholder="e.g. 160g chicken breast and a handful of potatoes, 1 cup rice, 1 scoop whey"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 resize-none pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute bottom-3 right-3 p-1.5 rounded-lg transition ${
                      isListening
                        ? "text-cyan-400 bg-cyan-500/20"
                        : "text-zinc-400 hover:text-cyan-300 hover:bg-white/5"
                    }`}
                    title={isListening ? "Stop listening" : "Speak into input"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Target Feeding Window:
                </label>
                <select
                  value={mealWindow}
                  onChange={(e) => setMealWindow(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-cyan-400/50"
                >
                  <option value="lunch">Morning Window / Lunch (Pre-Fast)</option>
                  <option value="dinner">Evening Window / Dinner (Post-Fast)</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="pre_workout">Pre-Workout Fuel</option>
                  <option value="snack">Midday Fuel / Snack</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !naturalText.trim()}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-40 disabled:hover:from-cyan-500 disabled:hover:to-teal-400 text-zinc-950 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-zinc-950" />
                    <span>Parsing Macros & Assigning Images...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Parse & Log Meal to Ledger</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Meal Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 160g Chicken Breast & Potatoes"
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-400/50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Calories (kcal):
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="350"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Protein (g):
                  </label>
                  <input
                    type="number"
                    value={proteinG}
                    onChange={(e) => setProteinG(e.target.value)}
                    placeholder="50"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Carbs (g):
                  </label>
                  <input
                    type="number"
                    value={carbsG}
                    onChange={(e) => setCarbsG(e.target.value)}
                    placeholder="25"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Fat (g):
                  </label>
                  <input
                    type="number"
                    value={fatG}
                    onChange={(e) => setFatG(e.target.value)}
                    placeholder="5"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Feeding Window:
                </label>
                <select
                  value={mealWindow}
                  onChange={(e) => setMealWindow(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 font-mono text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="lunch">Morning Window / Lunch</option>
                  <option value="dinner">Evening Window / Dinner</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="pre_workout">Pre-Workout</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 text-zinc-950 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95"
              >
                <Check size={15} />
                <span>Save to Fuel Ledger</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
