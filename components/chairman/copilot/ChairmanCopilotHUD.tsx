"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Square,
  Database,
  Eye,
  Zap,
  Trash2,
} from "lucide-react";

interface CopilotMessage {
  id?: string;
  sender_role: "user" | "assistant" | string;
  content: string;
  audio_transcript?: string | null;
  media_attachments?: any[];
  created_at?: string;
  inlineTools?: ToolExecution[];
}

interface ToolExecution {
  id: string;
  conversation_id: string;
  tool_name: string;
  tool_arguments: Record<string, any>;
  tool_result: Record<string, any>;
  execution_duration_ms: number;
  status: string;
  executed_at: string;
}

interface CapturedFrame {
  mimeType: string;
  base64Data: string;
  dataUrl: string;
  label: string;
  capturedAt: string;
}

const QUICK_TOOL_PROMPTS = [
  {
    label: "+ PMS Task",
    prompt: "Create task Review Q3 Sovereign Treasury Allocation urgent",
  },
  {
    label: "+ Log Meal",
    prompt:
      "Log meal Grass-Fed Ribeye & Eggs 690 kcal 64g protein 6g carbs 44g fat 380g",
  },
  {
    label: "+ Solar Block",
    prompt: "Schedule Deep Architecture Sprint from 10:00 to 11:30",
  },
  {
    label: "+ Pack Telemetry",
    prompt: "Koda 20 oz water 240 grams food medication administered",
  },
  {
    label: "Search Vault",
    prompt: "Search neural vault Caliber Arc execution rules",
  },
];

export function ChairmanCopilotHUD() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"command" | "ledger">("command");

  // Conversation & Ledger State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true);

  // Voice Recognition & Speech Synthesis State
  const [isListening, setIsListening] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Camera / Live Video Inspection Ingress State
  const [cameraActive, setCameraActive] = useState(false);
  const [autoStreamFps, setAutoStreamFps] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<CapturedFrame | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fpsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Hydrate Copilot State
  const loadCopilotState = useCallback(async () => {
    try {
      const res = await fetch("/api/copilot", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.activeConversationId) {
        setConversationId(data.activeConversationId);
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
      if (Array.isArray(data.toolExecutions)) {
        setToolExecutions(data.toolExecutions);
      }
      if (typeof data.aiConfigured === "boolean") {
        setAiConfigured(data.aiConfigured);
      }
    } catch (err) {
      console.error("[CopilotHUD] Failed to load state:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCopilotState();
    }
  }, [isOpen, loadCopilotState]);

  // Global keyboard shortcut: Alt + Space to toggle Sovereign Copilot HUD
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, interimTranscript]);

  // Stop speech synthesis helper
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Speak response helper
  const speakResponse = useCallback(
    (rawText: string) => {
      if (
        !voiceOutputEnabled ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return;
      }
      window.speechSynthesis.cancel();
      const cleanSpeech = rawText
        .replace(/[#*`_~>-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 480);
      if (!cleanSpeech) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = 1.06;
      utterance.pitch = 0.96;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [voiceOutputEnabled]
  );

  // Camera Frame Capture (1–2 FPS or on-demand JPEG/WebP)
  const captureVideoFrame = useCallback(
    (label = "Live Camera Inspection Frame"): CapturedFrame | null => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return null;

      const targetW = Math.min(640, video.videoWidth || 640);
      const scale = targetW / Math.max(1, video.videoWidth || 640);
      const targetH = Math.round((video.videoHeight || 480) * scale);

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.74);
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

      const frame: CapturedFrame = {
        mimeType: "image/jpeg",
        base64Data,
        dataUrl,
        label,
        capturedAt: new Date().toLocaleTimeString(),
      };
      setCapturedFrame(frame);
      return frame;
    },
    []
  );

  // Start / Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
    setAutoStreamFps(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API unavailable in this browser context.");
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      mediaStreamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch (err: any) {
      setCameraError(
        err?.message || "Camera permission denied or no webcam found."
      );
      setCameraActive(false);
    }
  }, []);

  // 1 FPS Auto-Stream Frame Sampling loop
  useEffect(() => {
    if (cameraActive && autoStreamFps) {
      fpsTimerRef.current = setInterval(() => {
        captureVideoFrame("1 FPS Auto-Sampled Stream");
      }, 1000);
      return () => {
        if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);
      };
    } else if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }
  }, [cameraActive, autoStreamFps, captureVideoFrame]);

  // Cleanup camera & speech on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [stopCamera, stopSpeaking]);

  // Send Multimodal Command to /api/copilot
  const sendCommand = useCallback(
    async (
      overrideText?: string,
      opts?: { fromVoice?: boolean; forceSnapLabel?: string }
    ) => {
      const textToSend = (
        overrideText !== undefined ? overrideText : inputText
      ).trim();

      let frameToSend = capturedFrame;
      if (cameraActive && opts?.forceSnapLabel) {
        const fresh = captureVideoFrame(opts.forceSnapLabel);
        if (fresh) frameToSend = fresh;
      } else if (cameraActive && autoStreamFps && !frameToSend) {
        frameToSend = captureVideoFrame("1 FPS Live Ingress");
      }

      if (!textToSend && !frameToSend) return;

      stopSpeaking();
      setSending(true);
      if (overrideText === undefined) setInputText("");

      const optimisticUserMsg: CopilotMessage = {
        sender_role: "user",
        content:
          textToSend || `[Visual Inspection: ${frameToSend?.label || "Frame"}]`,
        media_attachments: frameToSend
          ? [{ type: "camera_frame", label: frameToSend.label }]
          : [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: textToSend,
            audioTranscript: opts?.fromVoice ? textToSend : undefined,
            sessionMode: frameToSend
              ? "multimodal"
              : opts?.fromVoice
              ? "voice"
              : "text",
            imageFrame: frameToSend
              ? {
                  mimeType: frameToSend.mimeType,
                  base64Data: frameToSend.base64Data,
                  label: frameToSend.label,
                }
              : undefined,
          }),
        });

        const data = await res.json();
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        const newExecs: ToolExecution[] = Array.isArray(data.toolExecutions)
          ? data.toolExecutions
          : [];
        if (newExecs.length > 0) {
          setToolExecutions((prev) => [...newExecs, ...prev]);
        }

        const replyText =
          data.reply || data.error || "Command acknowledged by Sovereign Core.";
        setMessages((prev) => [
          ...prev,
          {
            sender_role: "assistant",
            content: replyText,
            created_at: new Date().toISOString(),
            inlineTools: newExecs,
          },
        ]);

        if (opts?.fromVoice || handsFreeMode) {
          speakResponse(replyText);
        }

        if (!autoStreamFps) {
          setCapturedFrame(null);
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            sender_role: "assistant",
            content: `Connection fault: ${err?.message || "Failed to reach /api/copilot"}`,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [
      inputText,
      capturedFrame,
      cameraActive,
      autoStreamFps,
      conversationId,
      handsFreeMode,
      captureVideoFrame,
      speakResponse,
      stopSpeaking,
    ]
  );

  // Toggle Web Speech Recognition (Push-to-Talk & Hands-Free)
  const toggleListening = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    stopSpeaking();
    const SpeechRec =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setMessages((prev) => [
        ...prev,
        {
          sender_role: "assistant",
          content:
            "Web Speech Recognition is not supported in this browser. Use Chrome or Edge for full-duplex voice, or type your command below.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = handsFreeMode;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
      if (finalChunk.trim()) {
        setInterimTranscript("");
        sendCommand(finalChunk.trim(), { fromVoice: true });
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, handsFreeMode, sendCommand, stopSpeaking]);

  const startFreshSession = () => {
    setConversationId(null);
    setMessages([]);
    setCapturedFrame(null);
  };

  return (
    <>
      {/* Hidden Canvas for JPEG/WebP Camera Inspection Frame Encoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Expandable Multimodal Copilot Command Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[70] w-[calc(100vw-3rem)] sm:w-[460px] md:w-[510px] max-h-[82vh] flex flex-col rounded-3xl border border-amber-400/30 bg-[#090d16]/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(6,182,212,0.18)] overflow-hidden text-white">
          {/* Drawer Header */}
          <div className="px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-transparent flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-cyan-400 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-[#090d16] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white">
                    Sovereign Copilot HUD
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    &lt;10ms SQL
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  {aiConfigured
                    ? "Gemini Multimodal + Direct PostgreSQL Tooling"
                    : "Deterministic Local SQL Parser Active"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  title="Interrupt Voice Synthesis"
                  className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-bold flex items-center gap-1 animate-pulse"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  Stop
                </button>
              )}
              <button
                onClick={() => {
                  const next = !voiceOutputEnabled;
                  setVoiceOutputEnabled(next);
                  if (!next) stopSpeaking();
                }}
                title={voiceOutputEnabled ? "Voice Readback ON" : "Muted"}
                className={`p-1.5 rounded-lg border transition ${
                  voiceOutputEnabled
                    ? "bg-cyan-500/15 border-cyan-400/30 text-cyan-300"
                    : "bg-white/5 border-white/10 text-zinc-500"
                }`}
              >
                {voiceOutputEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={startFreshSession}
                title="New Briefing Thread"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize HUD (Alt+Space)"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Drawer Mode Tabs */}
          <div className="px-4 py-2 border-b border-white/[0.07] bg-black/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("command")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "command"
                    ? "bg-amber-500/20 text-amber-200 border border-amber-400/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Multimodal Stream
              </button>
              <button
                onClick={() => setActiveTab("ledger")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activeTab === "ledger"
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Database className="w-3 h-3" />
                SQL Audit Ledger
                <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[9.5px] font-mono">
                  {toolExecutions.length}
                </span>
              </button>
            </div>

            <button
              onClick={() => (cameraActive ? stopCamera() : startCamera())}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider border flex items-center gap-1.5 transition ${
                cameraActive
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                  : "bg-white/5 text-zinc-300 border-white/10 hover:text-white"
              }`}
            >
              {cameraActive ? (
                <>
                  <Video className="w-3 h-3 text-emerald-400" />
                  Cam Live
                </>
              ) : (
                <>
                  <VideoOff className="w-3 h-3" />
                  Vision Ingress
                </>
              )}
            </button>
          </div>

          {/* Live Camera Viewport Panel (when toggled ON) */}
          {cameraActive && activeTab === "command" && (
            <div className="px-4 py-3 bg-black/60 border-b border-white/10 space-y-2.5">
              <div className="relative rounded-xl overflow-hidden border border-cyan-400/30 bg-black aspect-video max-h-44 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-emerald-400/40 text-[9.5px] font-mono text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {autoStreamFps ? "1 FPS AUTO-INGRESS" : "LIVE PREVIEW"}
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    onClick={() => setAutoStreamFps((p) => !p)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md ${
                      autoStreamFps
                        ? "bg-amber-500/30 border-amber-300 text-amber-100"
                        : "bg-black/70 border-white/20 text-zinc-300"
                    }`}
                  >
                    {autoStreamFps ? "1 FPS ON" : "1 FPS Stream"}
                  </button>
                  <button
                    onClick={() => captureVideoFrame("Manual HUD Snap")}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/45 border border-cyan-300/50 text-[10px] font-bold text-white flex items-center gap-1 backdrop-blur-md"
                  >
                    <Camera className="w-3 h-3" />
                    Snap Frame
                  </button>
                </div>
              </div>

              {/* Preset Multimodal Vision Inspection Triggers */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() =>
                    sendCommand(
                      "Scan this meal/pantry frame, estimate calories, protein, carbs, fats, and weight in grams, and log it via log_nutrition_meal.",
                      { forceSnapLabel: "Meal Macro Scan" }
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] font-semibold text-emerald-200 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Pantry / Meal Scan
                </button>
                <button
                  onClick={() =>
                    sendCommand(
                      "Inspect canine posture, hydration bowl, and mobility state from this frame and log telemetry if needed.",
                      { forceSnapLabel: "Canine Mobility Check" }
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-[10px] font-semibold text-amber-200 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Canine Check
                </button>
                <button
                  onClick={() =>
                    sendCommand(
                      "Perform an executive desk entropy audit on this frame and create a PMS task for the top physical improvement.",
                      { forceSnapLabel: "Desk Entropy Audit" }
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-[10px] font-semibold text-cyan-200 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Desk Audit
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="px-4 py-2 bg-rose-500/15 border-b border-rose-500/30 text-[11px] text-rose-200 flex items-center justify-between">
              <span>{cameraError}</span>
              <button onClick={() => setCameraError(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: MULTIMODAL COMMAND STREAM */}
          {activeTab === "command" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[42vh]">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5 text-xs text-zinc-300">
                    <div className="font-bold text-amber-300 uppercase tracking-wider text-[10.5px]">
                      Sovereign Multimodal Command Ready
                    </div>
                    <p className="leading-relaxed text-zinc-400">
                      Issue voice, live camera, or text directives. Native SQL
                      tools commit directly to PostgreSQL in &lt;10ms and seal an
                      audit record in{" "}
                      <code className="text-cyan-300">
                        copilot_tool_executions
                      </code>
                      .
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isUser = msg.sender_role === "user";
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${
                          isUser ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isUser
                              ? "bg-gradient-to-br from-amber-500/25 to-cyan-500/20 border border-amber-400/35 text-white"
                              : "bg-white/[0.05] border border-white/10 text-zinc-100"
                          }`}
                        >
                          {Array.isArray(msg.media_attachments) &&
                            msg.media_attachments.length > 0 && (
                              <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-[10px] font-mono text-cyan-200">
                                <Camera className="w-2.5 h-2.5" />
                                {msg.media_attachments[0]?.label ||
                                  "Vision Frame Attached"}
                              </div>
                            )}
                          <div className="prose prose-invert prose-xs max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>

                        {/* Inline SQL Tool Execution Badges */}
                        {msg.inlineTools && msg.inlineTools.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[92%]">
                            {msg.inlineTools.map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-mono text-emerald-200 flex items-center gap-1"
                              >
                                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                                {t.tool_name} · {t.execution_duration_ms}ms ·{" "}
                                {t.status.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {interimTranscript && (
                  <div className="text-right">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs italic text-amber-200">
                      “{interimTranscript}...”
                    </span>
                  </div>
                )}

                {sending && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Sovereign Tool Router...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Live Voice Waveform Bar when Listening or Speaking */}
              {(isListening || isSpeaking) && (
                <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-amber-500/15 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200">
                      {isListening
                        ? handsFreeMode
                          ? "Hands-Free Duplex Listening"
                          : "Push-To-Talk Active"
                        : "Synthesizing Voice Telemetry"}
                    </span>
                  </div>
                  <div className="flex items-end gap-0.5 h-4">
                    {[40, 85, 55, 100, 70, 90, 45, 80, 60, 95, 50, 75].map(
                      (h, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-gradient-to-t from-amber-400 to-cyan-300 animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 75}ms`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Quick Sovereign Tool Chips */}
              <div className="px-3.5 py-2 border-t border-white/[0.07] bg-black/35 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_TOOL_PROMPTS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendCommand(chip.prompt)}
                    disabled={sending}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-[10px] font-mono text-zinc-200 transition"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Attached Camera Frame Preview Strip */}
              {capturedFrame && (
                <div className="px-4 py-1.5 bg-cyan-950/40 border-t border-cyan-400/25 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={capturedFrame.dataUrl}
                      alt="Captured frame"
                      className="w-9 h-7 rounded object-cover border border-cyan-400/40"
                    />
                    <span className="text-[10.5px] font-mono text-cyan-200 truncate">
                      {capturedFrame.label} ({capturedFrame.capturedAt})
                    </span>
                  </div>
                  <button
                    onClick={() => setCapturedFrame(null)}
                    className="p-1 text-zinc-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Composer + Voice Controls */}
              <div className="p-3 border-t border-white/10 bg-[#070a12] space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleListening}
                    title={
                      isListening ? "Stop Voice Capture" : "Start Voice Command"
                    }
                    className={`p-2.5 rounded-xl border transition shrink-0 ${
                      isListening
                        ? "bg-amber-500/30 border-amber-300 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                        : "bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-zinc-300"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendCommand();
                      }
                    }}
                    placeholder="Speak or type command (tasks, macros, solar arc, vault)..."
                    className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
                  />

                  <button
                    onClick={() => sendCommand()}
                    disabled={sending || (!inputText.trim() && !capturedFrame)}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 text-black font-bold hover:opacity-95 transition disabled:opacity-40 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={handsFreeMode}
                      onChange={(e) => setHandsFreeMode(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span>Hands-Free Continuous Duplex</span>
                  </label>
                  <span className="font-mono">Shortcut: Alt + Space</span>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: LIVE TOOL EXECUTION AUDIT LEDGER */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[58vh]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-cyan-300">
                    Immutable PostgreSQL Tool Audit Ledger
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Live telemetry from{" "}
                    <code className="text-amber-300">
                      public.copilot_tool_executions
                    </code>
                  </p>
                </div>
                <button
                  onClick={loadCopilotState}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-200 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {toolExecutions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-zinc-400">
                  No tool executions recorded yet. Click any quick-chip in the
                  Multimodal Stream tab to execute a live &lt;10ms SQL write!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {toolExecutions.map((exec) => {
                    const isSuccess = exec.status === "success";
                    return (
                      <div
                        key={exec.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-xs font-mono font-bold text-white">
                              {exec.tool_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-200 border border-cyan-400/30">
                              {exec.execution_duration_ms}ms SQL
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase flex items-center gap-1 border ${
                                isSuccess
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                                  : "bg-rose-500/15 text-rose-300 border-rose-500/35"
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : (
                                <AlertCircle className="w-2.5 h-2.5" />
                              )}
                              {exec.status.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-black/50 border border-white/[0.06] p-2 text-[10.5px] font-mono text-zinc-300 overflow-x-auto">
                          <div className="text-zinc-500">args:</div>
                          <div>{JSON.stringify(exec.tool_arguments)}</div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span className="truncate max-w-[260px]">
                            Table: {exec.tool_result?.table || "PostgreSQL"}
                          </span>
                          <span>
                            {exec.executed_at
                              ? new Date(exec.executed_at).toLocaleTimeString()
                              : "Just now"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Global Floating "Chairman Voice Orb" (Fixed Bottom-Right z-[70]) */}
      <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3">
        {!isOpen && (isListening || cameraActive) && (
          <div className="px-3 py-1.5 rounded-full bg-black/85 border border-amber-400/40 backdrop-blur-xl text-[10.5px] font-mono text-amber-200 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {isListening ? "Copilot Listening..." : "Vision Stream Armed"}
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle Sovereign Multimodal AI Copilot"
          className="group relative w-14 h-14 rounded-full flex items-center justify-center focus:outline-none"
        >
          {/* Outer Pulsing Halo */}
          <span
            className={`absolute inset-0 rounded-full transition-all duration-500 ${
              isListening
                ? "bg-amber-400/40 animate-ping"
                : cameraActive
                ? "bg-emerald-400/35 animate-pulse"
                : "bg-gradient-to-tr from-amber-500/30 via-cyan-400/30 to-amber-300/30 group-hover:scale-110 animate-pulse"
            }`}
          />
          {/* Mid Sovereign Conic Ring */}
          <span className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-cyan-400 to-amber-200 p-[2px] shadow-[0_0_30px_rgba(245,158,11,0.45),0_0_50px_rgba(6,182,212,0.3)]">
            <span className="w-full h-full rounded-full bg-[#090d16] flex items-center justify-center">
              {isOpen ? (
                <X className="w-5 h-5 text-amber-200" />
              ) : isListening ? (
                <Mic className="w-5 h-5 text-amber-300 animate-bounce" />
              ) : (
                <Sparkles className="w-5 h-5 text-cyan-200 group-hover:rotate-12 transition-transform" />
              )}
            </span>
          </span>

          {/* Tool Audit Count Pill */}
          {toolExecutions.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-mono font-extrabold shadow">
              {toolExecutions.length}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

export default ChairmanCopilotHUD;
