"use client";

import React, { useState } from "react";
import { Loader2, Mic, Send, Sparkles } from "lucide-react";

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult:
    | ((event: {
        results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
      }) => void)
    | null;
  start: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

interface PmsAiCommandBarProps {
  onRunCommand: (command: string) => Promise<void>;
  onNotify: (message: string) => void;
}

export function PmsAiCommandBar({
  onRunCommand,
  onNotify,
}: PmsAiCommandBarProps) {
  const [command, setCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const submitCommand = async (raw?: string) => {
    const text = (raw ?? command).trim();
    if (!text || isRunning) return;
    setIsRunning(true);
    try {
      await onRunCommand(text);
      setCommand("");
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleMic = () => {
    if (typeof window === "undefined") return;
    const win = window as WindowWithSpeech;
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) {
      onNotify("Voice input not supported in this browser.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setCommand(transcript);
        void submitCommand(transcript);
      }
    };
    recognition.start();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submitCommand();
      }}
      className="flex items-center gap-2 w-full sm:w-auto"
    >
      <div className="relative flex-1 sm:w-80">
        <Sparkles className="w-3.5 h-3.5 text-[#4984fd] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          data-testid="pms-ai-command-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Ask AI to add task & sync Health / Wealth / Ops..."
          className="w-full pl-8 pr-9 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-[#4984fd] transition"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
            color: "var(--glass-text-primary)",
          }}
        />
        <button
          type="button"
          onClick={handleToggleMic}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition ${
            isListening
              ? "text-rose-500 animate-pulse"
              : "text-zinc-400 hover:text-[#4984fd]"
          }`}
          title="Speak AI command"
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        type="submit"
        disabled={isRunning || !command.trim()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4984fd] hover:bg-blue-500 text-white text-xs font-medium transition disabled:opacity-40"
      >
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">Sync</span>
      </button>
    </form>
  );
}
