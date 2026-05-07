"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface NovaMessage {
  role: "user" | "assistant";
  content: string;
}

export function NovaPanel({
  open, onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [agent, setAgent] = useState("Universal Command");
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: NovaMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Fetch fresh tasks and calendar here if needed, or omit if you just want chat
      const [tasksRes, calRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/calendar")
      ]);
      const tasksData = await tasksRes.json();
      const calData = await calRes.json();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          agentRole: agent, 
          tasks: tasksData.tasks || [], 
          calendarEvents: calData.events || [] 
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.error ?? "No response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — could not reach Nova." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Agent accent color
  const agentColor = (() => {
    const map: Record<string, string> = {
      "Universal Command": "#C9A961", CEO: "#C9A961", COO: "#7B9EA8", CMO: "#A87B9E",
      CFO: "#8BA87B", CTO: "#4A90E2", CPO: "#F39C12",
      "Tactical Spotter (Wealth)": "#D4AF37", "Health Coach": "#E05A3A",
      "Relationships": "#5B8FB9", "Joy": "#B388EB",
    };
    return map[agent] ?? "#C9A961";
  })();

  return (
    <div
      style={{
        position:        "fixed",
        top:             0,
        right:           0,
        bottom:          0,
        width:           380,
        zIndex:          200,
        display:         "flex",
        flexDirection:   "column",
        borderLeft:      `1px solid ${agentColor}33`,
        boxShadow:       "-12px 0 60px rgba(0,0,0,0.7)",
        animation:       "nova-slide-in 0.22s ease-out",
      }}
      className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${agentColor}22`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={14} style={{ color: agentColor }} />
            <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: agentColor, fontWeight: 700 }}>
              Nova Logic Core
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "1px solid #1E1F24", cursor: "pointer", color: "var(--theme-grad-start)", borderRadius: 6, padding: "4px 7px", display: "flex", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${agentColor}55`; (e.currentTarget as HTMLButtonElement).style.color = agentColor; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E1F24"; (e.currentTarget as HTMLButtonElement).style.color = "#3B4558"; }}
          >
            <X size={12} />
          </button>
        </div>
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          style={{ width: "100%", padding: "6px 8px", fontSize: 11, letterSpacing: "0.04em", borderRadius: 6, background: "rgba(0,0,0,0.2)", border: `1px solid ${agentColor}22`, color: agentColor, outline: "none", cursor: "pointer" }}
        >
          <option value="Universal Command">Universal Command</option>
          <option value="CEO">CEO (Vision & Strategy)</option>
          <option value="COO">COO (Ops & Execution)</option>
          <option value="CMO">CMO (Growth & Sales)</option>
          <option value="CFO">CFO (Finance & Cash)</option>
          <option value="CTO">CTO (APIs & Automation)</option>
          <option value="CPO">CPO (Product & UX)</option>
          <option value="Tactical Spotter (Wealth)">Tactical Spotter (Wealth)</option>
          <option value="Health Coach">Health Coach</option>
          <option value="Relationships">Relationships</option>
          <option value="Joy">Joy</option>
        </select>
      </div>

      {/* ── Chat List ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Bot size={24} style={{ color: `${agentColor}40`, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 10, color: "var(--theme-grad-start)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Awaiting directive</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: msg.role === "user" ? `${agentColor}15` : "rgba(0,0,0,0.3)",
                border: `1px solid ${msg.role === "user" ? `${agentColor}33` : "rgba(255,255,255,0.05)"}`,
                color: msg.role === "user" ? agentColor : "#E2E8F0",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {msg.role === "user" ? msg.content : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ margin: "0 0 8px 0", lastChild: { marginBottom: 0 } }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: agentColor }}>{children}</strong>,
                    ul: ({ children }) => <ul style={{ margin: "0 0 8px 0", paddingLeft: 20 }}>{children}</ul>,
                    li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                    code: ({ inline, children }) => {
                      if (inline) {
                        return <code style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "2px 4px", borderRadius: 4, fontSize: 11, color: "#C9A961" }}>{children}</code>;
                      }
                      return <pre style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: 10, borderRadius: 6, fontSize: 10, overflowX: "auto", margin: "8px 0", border: "1px solid rgba(255,255,255,0.05)" }}><code>{children}</code></pre>;
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
            {msg.role === "assistant" && (
              <span style={{ fontSize: 8, color: "var(--theme-grad-start)", marginTop: 3, letterSpacing: "0.12em", textTransform: "uppercase" }}>{agent}</span>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
            <span style={{ fontSize: 10, color: "var(--theme-grad-start)", letterSpacing: "0.1em" }}>Processing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${agentColor}18`, flexShrink: 0 }} className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10">
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 12px", transition: "border-color 0.15s" }}
             className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10"
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = `${agentColor}44`)}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#1E1F24")}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={loading}
            placeholder={`Message ${agent}…`}
            style={{
              flex:            1,
              background:      "none",
              border:          "none",
              outline:         "none",
              fontSize:        12,
              letterSpacing:   "0.02em",
              fontFamily:      "inherit",
              opacity:         loading ? 0.4 : 1,
            }}
            className="text-zinc-600 dark:text-[#C2C8D4]"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              flexShrink:      0,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           28,
              height:          28,
              borderRadius:    6,
              backgroundColor: input.trim() && !loading ? agentColor : "transparent",
              border:          `1px solid ${input.trim() && !loading ? agentColor : "#1E1F24"}`,
              color:           input.trim() && !loading ? "#08090C" : "#252836",
              cursor:          input.trim() && !loading ? "pointer" : "default",
              transition:      "all 0.15s",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
