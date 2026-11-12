"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  PlugZap,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Terminal,
  Database,
  Activity,
  TrendingUp,
  Github,
  Calendar,
  KanbanSquare,
  Landmark,
  Copy,
  Check,
  ArrowRight,
  Layers,
  Zap,
  Video,
  Mic,
  Sparkles,
  Server,
  KeyRound,
  Play,
} from "lucide-react";

interface McpIntegration {
  id: string;
  provider_key: string;
  display_name: string;
  endpoint_url: string | null;
  vault_secret_masked: string | null;
  status: string;
  last_latency_ms: number;
  last_verified_at: string;
  capabilities: string[];
}

interface HandshakeReceipt {
  httpCode: number;
  statusBadge: string;
  dbLatencyMs: number;
  totalLatencyMs: number;
  protocol: string;
  vaultCipher: string;
  diagnosticNote: string;
  verifiedAt: string;
}

const PROVIDER_META: Record<
  string,
  {
    icon: React.ReactNode;
    accent: string;
    category: string;
    onboardingGuide: string[];
  }
> = {
  google_workspace: {
    icon: <Calendar className="w-4 h-4 text-sky-400" />,
    accent: "#38bdf8",
    category: "Circadian & Comms Ingress",
    onboardingGuide: [
      "Enable Google Calendar v3 & Gmail Readonly scopes in GCP Console.",
      "Bind OAuth2 Refresh Token into Supabase AES-GCM-256 Vault.",
      "Execute Handshake Gate to verify <25ms Calendar event delta sync.",
    ],
  },
  clickup_ingestion: {
    icon: <KanbanSquare className="w-4 h-4 text-violet-400" />,
    accent: "#a78bfa",
    category: "Sovereign PMS Migration",
    onboardingGuide: [
      "Generate Personal API Token (pk_...) in ClickUp Settings -> Apps.",
      "Paste token below to seal in Vault and map Workspace -> Sovereign PMS.",
      "Run Handshake Gate to validate Space/List hierarchy pull.",
    ],
  },
  plaid_financial: {
    icon: <Landmark className="w-4 h-4 text-emerald-400" />,
    accent: "#34d399",
    category: "Treasury & Cashflow Stream",
    onboardingGuide: [
      "Select Production environment endpoint in Plaid Dashboard.",
      "Seal Plaid Secret + Access Token inside hardware-backed Vault.",
      "Run Handshake Gate to stream institutional balances & OPEX burn.",
    ],
  },
  garmin_samsung_health: {
    icon: <Activity className="w-4 h-4 text-rose-400" />,
    accent: "#fb7185",
    category: "Biometric & Recovery Telemetry",
    onboardingGuide: [
      "Authorize Garmin Wellness REST webhook or Samsung Health Connect bridge.",
      "Map Sleep Stages, HRV, and Resting HR into Scorecard & Circadian Radar.",
      "Run Handshake Gate to verify live biometric ingestion.",
    ],
  },
  supabase_vault: {
    icon: <Database className="w-4 h-4 text-amber-400" />,
    accent: "#fbbf24",
    category: "Core Sovereign Cryptographic Bus",
    onboardingGuide: [
      "Verify PostgreSQL Pooler & Direct URI with Zero-Trust RLS policies enabled.",
      "Confirm pgsodium / AES-GCM-256 envelope key rotation status.",
      "Run Handshake Gate to benchmark raw <10ms SQL execution roundtrip.",
    ],
  },
  github_repos: {
    icon: <Github className="w-4 h-4 text-zinc-200" />,
    accent: "#e4e4e7",
    category: "Engineering Velocity & CI/CD",
    onboardingGuide: [
      "Create Fine-Grained Personal Access Token scoped to Pristine Designs repos.",
      "Seal token in Vault and point endpoint to GitHub GraphQL v4.",
      "Run Handshake Gate to stream commit velocity & deployment status.",
    ],
  },
  ninjatrader_replikanto: {
    icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
    accent: "#22d3ee",
    category: "Caliber Arc Futures Execution",
    onboardingGuide: [
      "Enable NinjaTrader 8 ATI Socket / Replikanto 20-Account Follower Bridge.",
      "Bind local TCP bridge URI and verify -$250 session loss circuit breaker.",
      "Run Handshake Gate to confirm deterministic fill & flatten telemetry.",
    ],
  },
  local_ide_mcp: {
    icon: <Terminal className="w-4 h-4 text-amber-300" />,
    accent: "#f59e0b",
    category: "Autonomous Agent Swarm Host",
    onboardingGuide: [
      "Copy the Sovereign MCP stdio host snippet into Antigravity / Cursor mcp_config.json.",
      "Grant read/write schema tool scopes to authorized local engineering agents.",
      "Run Handshake Gate to confirm sub-5ms local stdio loop.",
    ],
  },
};

const ARCHITECTURE_OPTIONS = [
  {
    id: "A",
    badge: "REJECTED",
    badgeStyle: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    name: "Option A: Disconnected External Chat",
    subtitle: "Browser Tab SaaS LLM (Manual Copy-Paste Loop)",
    latency: "1,800 – 4,500 ms (Manual Human Relay)",
    dbAccess: "None (Zero SQL Write Authority)",
    multimodal: "Static File Upload Only",
    security: "Third-Party Cloud Retention Risk",
    mobilePwa: "Fragmented App Switching",
    score: 28,
    verdict:
      "Fails executive velocity test. High context drift, zero live awareness of Circadian Arc, MacroOps, or Caliber Arc circuit breakers.",
  },
  {
    id: "B",
    badge: "IDE AUXILIARY ONLY",
    badgeStyle: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    name: "Option B: Consumer MCP Desktop Proxy",
    subtitle: "External Desktop Client Tunneling via JSON-RPC",
    latency: "180 – 420 ms (IPC + JSON-RPC Serialization)",
    dbAccess: "Indirect via Local Stdio Proxy",
    multimodal: "Desktop Mic Only · No PWA Camera HUD",
    security: "Local Token Exposure in Plaintext Configs",
    mobilePwa: "Broken Away from Workstation",
    score: 64,
    verdict:
      "Retained strictly as a secondary developer bridge for Antigravity/Cursor IDE workflows (Connector #8), but unsuitable as the Chairman's primary 24/7 mobile + desktop HUD.",
  },
  {
    id: "C",
    badge: "APPROVED SOVEREIGN ARCHITECTURE",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    name: "Option C: Native Embedded Sovereign Copilot",
    subtitle: "In-Process Next.js Route + Direct <10ms PostgreSQL Bus + Full-Duplex HUD",
    latency: "< 10 ms SQL Tool Execution (In-VPC Pool)",
    dbAccess: "Native Direct SQL (pms_tasks, nutrition_meals, circadian_events, vault_nodes)",
    multimodal: "Full-Duplex Web Speech + 1–2 FPS Live Camera Frame Ingress",
    security: "Zero-Trust NextAuth + Supabase AES-GCM-256 Vault + Immutable Audit Ledger",
    mobilePwa: "100% Native Floating Voice Orb Across Desktop & Mobile PWA",
    score: 99,
    verdict:
      "Selected & deployed globally in Living OS. Eliminates IPC hops, enforces deterministic SQL audit logging in public.copilot_tool_executions, and works everywhere.",
  },
];

export default function IntegrationsAndArchitecturePage() {
  const [integrations, setIntegrations] = useState<McpIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"mesh" | "wizard" | "architecture">("mesh");

  // Per-card editable fields & handshake states
  const [endpointDrafts, setEndpointDrafts] = useState<Record<string, string>>({});
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [receipts, setReceipts] = useState<Record<string, HandshakeReceipt>>({});

  // Onboarding wizard state
  const [wizardProvider, setWizardProvider] = useState<string>("local_ide_mcp");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Section 19 interactive comparison
  const [selectedArch, setSelectedArch] = useState<string>("C");

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
        const epMap: Record<string, string> = {};
        data.integrations.forEach((row: McpIntegration) => {
          epMap[row.provider_key] = row.endpoint_url || "";
        });
        setEndpointDrafts(epMap);
      }
    } catch (err) {
      console.error("Failed to fetch MCP integrations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const runHandshakeGate = async (providerKey: string) => {
    setTestingKey(providerKey);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "handshake",
          provider_key: providerKey,
          endpoint_url: endpointDrafts[providerKey],
          api_key: secretDrafts[providerKey] || undefined,
        }),
      });
      const data = await res.json();
      if (data.integration) {
        setIntegrations((prev) =>
          prev.map((item) =>
            item.provider_key === providerKey ? data.integration : item
          )
        );
        setSecretDrafts((prev) => ({ ...prev, [providerKey]: "" }));
      }
      if (data.handshake) {
        setReceipts((prev) => ({ ...prev, [providerKey]: data.handshake }));
      }
    } catch (err) {
      console.error("Handshake error:", err);
    } finally {
      setTestingKey(null);
    }
  };

  const runAllHandshakes = async () => {
    setTestingAll(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "handshake_all" }),
      });
      const data = await res.json();
      if (Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
      }
    } catch (err) {
      console.error("Full mesh handshake failed:", err);
    } finally {
      setTestingAll(false);
    }
  };

  const connectedCount = integrations.filter(
    (i) => i.status === "200 OK" || i.status === "connected"
  ).length;
  const avgLatency =
    integrations.length > 0
      ? Math.round(
          integrations.reduce((s, i) => s + (Number(i.last_latency_ms) || 0), 0) /
            integrations.length
        )
      : 0;

  const selectedWizardRow =
    integrations.find((i) => i.provider_key === wizardProvider) || integrations[0];

  const mcpHostJson = JSON.stringify(
    {
      mcpServers: {
        "chairman-living-os": {
          command: "npx",
          args: ["-y", "@pristine/chairman-mcp-host", "--transport", "stdio"],
          env: {
            SUPABASE_VAULT_ENVELOPE: "AES-GCM-256",
            LIVING_OS_DIRECT_SQL: "true",
          },
        },
      },
    },
    null,
    2
  );

  const copyMcpConfig = () => {
    navigator.clipboard.writeText(mcpHostJson);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <ExecutiveModuleShell
      moduleId="INTEGRATIONS"
      eyebrow="Sections 11 & 19 · Sovereign Mesh"
      title="Autonomous MCP Mesh & Architecture Console"
      subtitle="Self-Testing AES-GCM-256 Vault Connectors, Guided MCP Onboarding & Dual-Tier Copilot Architecture Matrix"
      accentColor="#06b6d4"
      headerActions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={runAllHandshakes}
            disabled={testingAll || loading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${testingAll ? "animate-spin" : ""}`}
            />
            {testingAll ? "Probing 8 Nodes..." : "Sweep All 8 Handshake Gates"}
          </button>
        </div>
      }
    >
      {/* Top Sovereign Mesh Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            <span>Mesh Gate Health</span>
            <PlugZap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">
              {connectedCount}/{integrations.length || 8}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              200 OK VERIFIED
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Live PostgreSQL `public.mcp_integrations` registry
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            <span>Mean Handshake RTT</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-cyan-300">
              {avgLatency} ms
            </span>
            <span className="text-[11px] text-zinc-400">sub-35ms SLA</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Measured server-to-gateway + SQL Vault commit
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            <span>Cryptographic Envelope</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-mono font-bold text-amber-300">
              AES-GCM-256
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Zero-plaintext secret masking + Supabase RLS
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] backdrop-blur-xl p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
            <span>Section 19 Ruling</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-white">
              Option C · Sovereign HUD
            </span>
          </div>
          <p className="text-[11px] text-emerald-200/70 mt-1">
            &lt;10ms SQL Tool Execution + Live Voice/Camera Orb
          </p>
        </div>
      </div>

      {/* Navigation Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 w-fit">
        <button
          onClick={() => setActiveView("mesh")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeView === "mesh"
              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <PlugZap className="w-3.5 h-3.5" />
          1. MCP Connector Mesh & Handshake Gate
        </button>
        <button
          onClick={() => setActiveView("wizard")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeView === "wizard"
              ? "bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          2. Self-Guiding Onboarding Wizard
        </button>
        <button
          onClick={() => setActiveView("architecture")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeView === "architecture"
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shadow-lg"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          3. Section 19 Architecture Matrix & Dual-Tier Diagram
        </button>
      </div>

      {/* VIEW 1: 8-NODE MCP CONNECTOR MESH */}
      {activeView === "mesh" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse"
                />
              ))
            : integrations.map((item) => {
                const meta = PROVIDER_META[item.provider_key] || {
                  icon: <Server className="w-4 h-4 text-cyan-400" />,
                  accent: "#06b6d4",
                  category: "MCP Sovereign Node",
                  onboardingGuide: [],
                };
                const isOk =
                  item.status === "200 OK" || item.status === "connected";
                const isTesting = testingKey === item.provider_key;
                const receipt = receipts[item.provider_key];
                const caps = Array.isArray(item.capabilities)
                  ? item.capabilities
                  : [];

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#0d121d]/90 backdrop-blur-xl p-5 flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04]"
                            style={{ boxShadow: `0 0 20px ${meta.accent}22` }}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                              {meta.category}
                            </div>
                            <h3 className="text-sm font-bold text-white">
                              {item.display_name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                              isOk
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/35"
                            }`}
                          >
                            {isOk ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            )}
                            {item.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300">
                            RTT: {item.last_latency_ms}ms
                          </span>
                        </div>
                      </div>

                      {/* Capabilities Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {caps.map((cap, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.07] text-zinc-300"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>

                      {/* Editable Endpoint & Vault Masked Key */}
                      <div className="mt-4 space-y-2.5">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-semibold">
                            Endpoint URI / Transport Socket
                          </label>
                          <input
                            type="text"
                            value={endpointDrafts[item.provider_key] ?? ""}
                            onChange={(e) =>
                              setEndpointDrafts((prev) => ({
                                ...prev,
                                [item.provider_key]: e.target.value,
                              }))
                            }
                            placeholder="https://... or stdio://..."
                            className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-400/60"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                            <span className="uppercase tracking-wider font-semibold">
                              AES-GCM-256 Vault Secret
                            </span>
                            <span className="font-mono text-amber-300/90">
                              Sealed: {item.vault_secret_masked || "aes256:••••"}
                            </span>
                          </div>
                          <input
                            type="password"
                            value={secretDrafts[item.provider_key] ?? ""}
                            onChange={(e) =>
                              setSecretDrafts((prev) => ({
                                ...prev,
                                [item.provider_key]: e.target.value,
                              }))
                            }
                            placeholder="Enter new API key / OAuth secret to rotate Vault envelope..."
                            className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/60"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Handshake Receipt & Action Footer */}
                    <div className="pt-3 border-t border-white/[0.07] space-y-2.5">
                      {receipt && (
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[11px] text-emerald-200 flex items-center justify-between gap-2">
                          <span className="truncate">
                            <strong>{receipt.statusBadge}</strong> ·{" "}
                            {receipt.protocol} · {receipt.diagnosticNote}
                          </span>
                          <span className="font-mono font-bold shrink-0 text-emerald-300">
                            {receipt.totalLatencyMs}ms
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Verified:{" "}
                          {item.last_verified_at
                            ? new Date(item.last_verified_at).toLocaleTimeString()
                            : "Never"}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setWizardProvider(item.provider_key);
                              setWizardStep(1);
                              setActiveView("wizard");
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition"
                          >
                            Setup Guide
                          </button>

                          <button
                            onClick={() => runHandshakeGate(item.provider_key)}
                            disabled={isTesting}
                            className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500/25 to-emerald-500/25 hover:from-cyan-500/35 hover:to-emerald-500/35 text-cyan-100 border border-cyan-400/40 flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <Play
                              className={`w-3 h-3 ${
                                isTesting ? "animate-ping" : ""
                              }`}
                            />
                            {isTesting
                              ? "Handshaking..."
                              : "Run Handshake Gate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* VIEW 2: SELF-GUIDING ONBOARDING WIZARD */}
      {activeView === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Provider Picker */}
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d121d]/90 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400 px-2 pb-1">
              Select Mesh Node to Provision
            </div>
            {integrations.map((item) => {
              const meta = PROVIDER_META[item.provider_key];
              const active = wizardProvider === item.provider_key;
              return (
                <button
                  key={item.provider_key}
                  onClick={() => {
                    setWizardProvider(item.provider_key);
                    setWizardStep(1);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    active
                      ? "bg-amber-500/15 border-amber-400/40 text-white"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {meta?.icon}
                    <span className="text-xs font-semibold truncate">
                      {item.display_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 shrink-0">
                    {item.last_latency_ms}ms
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right 3-Step Self-Guiding Wizard */}
          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#0d121d]/90 p-6 space-y-6">
            {selectedWizardRow && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                      Self-Guiding Sovereign Onboarding Wizard
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      {selectedWizardRow.display_name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((stepNum) => (
                      <button
                        key={stepNum}
                        onClick={() => setWizardStep(stepNum as 1 | 2 | 3)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                          wizardStep === stepNum
                            ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                            : "bg-white/[0.03] border-white/10 text-zinc-500"
                        }`}
                      >
                        Step {stepNum}
                      </button>
                    ))}
                  </div>
                </div>

                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                      Step 1 · Scope Provisioning & Least-Privilege Checklist
                    </h3>
                    <div className="space-y-2.5">
                      {(
                        PROVIDER_META[selectedWizardRow.provider_key]
                          ?.onboardingGuide || []
                      ).map((instruction, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07]"
                        >
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-zinc-200 leading-relaxed">
                            {instruction}
                          </p>
                        </div>
                      ))}
                    </div>

                    {selectedWizardRow.provider_key === "local_ide_mcp" && (
                      <div className="rounded-xl bg-black/60 border border-white/10 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono text-amber-300">
                            mcp_config.json (Antigravity / Cursor Host)
                          </span>
                          <button
                            onClick={copyMcpConfig}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-white flex items-center gap-1.5"
                          >
                            {copiedSnippet ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Config
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-cyan-200 overflow-x-auto">
                          {mcpHostJson}
                        </pre>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="px-4 py-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/40 text-xs font-bold text-cyan-100 flex items-center gap-2"
                      >
                        Proceed to Vault Envelope Sealing
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                      Step 2 · Configure Transport Endpoint & Seal Secret in AES-GCM-256 Vault
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          Provider Endpoint / Bridge Socket URI
                        </label>
                        <input
                          type="text"
                          value={
                            endpointDrafts[selectedWizardRow.provider_key] ?? ""
                          }
                          onChange={(e) =>
                            setEndpointDrafts((prev) => ({
                              ...prev,
                              [selectedWizardRow.provider_key]: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          API Key / OAuth Refresh Token (Masked Automatically Before Persistence)
                        </label>
                        <input
                          type="password"
                          value={
                            secretDrafts[selectedWizardRow.provider_key] ?? ""
                          }
                          onChange={(e) =>
                            setSecretDrafts((prev) => ({
                              ...prev,
                              [selectedWizardRow.provider_key]: e.target.value,
                            }))
                          }
                          placeholder="Paste secret token to seal with AES-GCM-256..."
                          className="w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] text-xs text-zinc-300"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setWizardStep(3)}
                        className="px-4 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/40 text-xs font-bold text-amber-100 flex items-center gap-2"
                      >
                        Proceed to Live Handshake Gate
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                      Step 3 · Execute Live Handshake Gate & Persist to PostgreSQL
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Clicking <strong>Run Handshake Gate</strong> triggers{" "}
                      <code className="text-cyan-300">POST /api/integrations</code>,
                      verifies the transport endpoint + PostgreSQL Vault write
                      roundtrip, records exact latency in milliseconds, and flips
                      the node badge to{" "}
                      <span className="text-emerald-300 font-mono font-bold">
                        200 OK
                      </span>
                      .
                    </p>

                    <button
                      onClick={() =>
                        runHandshakeGate(selectedWizardRow.provider_key)
                      }
                      disabled={testingKey === selectedWizardRow.provider_key}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 hover:from-emerald-500/40 hover:to-cyan-500/40 border border-emerald-400/50 text-xs font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-emerald-300" />
                      {testingKey === selectedWizardRow.provider_key
                        ? "Executing Live Handshake Probe..."
                        : `Run Handshake Gate for ${selectedWizardRow.display_name}`}
                    </button>

                    {receipts[selectedWizardRow.provider_key] && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-300">
                          <span>
                            GATE PASSED · HTTP{" "}
                            {receipts[selectedWizardRow.provider_key].httpCode}{" "}
                            ({receipts[selectedWizardRow.provider_key].statusBadge})
                          </span>
                          <span className="font-mono">
                            Total:{" "}
                            {
                              receipts[selectedWizardRow.provider_key]
                                .totalLatencyMs
                            }
                            ms (SQL:{" "}
                            {
                              receipts[selectedWizardRow.provider_key]
                                .dbLatencyMs
                            }
                            ms)
                          </span>
                        </div>
                        <div className="text-zinc-200">
                          {
                            receipts[selectedWizardRow.provider_key]
                              .diagnosticNote
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SECTION 19 ARCHITECTURE EVALUATION MATRIX & DUAL-TIER EXECUTION DIAGRAM */}
      {activeView === "architecture" && (
        <div className="space-y-6">
          {/* Option Cards A vs B vs C */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {ARCHITECTURE_OPTIONS.map((opt) => {
              const isSelected = selectedArch === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedArch(opt.id)}
                  className={`cursor-pointer rounded-2xl p-5 border transition flex flex-col justify-between gap-4 ${
                    opt.id === "C"
                      ? "bg-emerald-950/20 border-emerald-400/45 shadow-[0_0_35px_rgba(16,185,129,0.12)]"
                      : isSelected
                      ? "bg-white/[0.05] border-cyan-400/40"
                      : "bg-[#0d121d]/85 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${opt.badgeStyle}`}
                      >
                        {opt.badge}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-300">
                        Score: {opt.score}/100
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">
                        {opt.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {opt.subtitle}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 text-xs">
                      <div className="flex justify-between gap-2 border-b border-white/[0.06] pb-1.5">
                        <span className="text-zinc-500">Execution Latency</span>
                        <span className="font-mono text-right text-zinc-200">
                          {opt.latency}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-white/[0.06] pb-1.5">
                        <span className="text-zinc-500">PostgreSQL Authority</span>
                        <span className="text-right text-zinc-200">
                          {opt.dbAccess}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-white/[0.06] pb-1.5">
                        <span className="text-zinc-500">Multimodal Ingress</span>
                        <span className="text-right text-zinc-200">
                          {opt.multimodal}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 pb-1">
                        <span className="text-zinc-500">Mobile PWA Parity</span>
                        <span className="text-right text-zinc-200">
                          {opt.mobilePwa}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.07] text-[11px] text-zinc-300 leading-relaxed">
                    {opt.verdict}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Dual-Tier Sovereign Execution Diagram */}
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0b101b]/95 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                  Section 19.4 · Approved Dual-Tier Execution Topology
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Option C Native Sovereign Copilot + Auxiliary IDE MCP Mesh
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-200 border border-cyan-400/30">
                ACTIVE IN PRODUCTION HUD (BOTTOM-RIGHT ORB)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
              {/* Tier 1: Multimodal Edge Ingress */}
              <div className="lg:col-span-3 rounded-xl border border-amber-400/30 bg-amber-500/[0.05] p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Tier 1 · Multimodal HUD Ingress
                </div>
                <div className="space-y-2 text-xs text-zinc-200">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Full-Duplex Web Speech PTT + Hands-Free Synthesis
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      1–2 FPS Live WebRTC Camera JPEG/WebP Frame Capture
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>
                      Auxiliary IDE Stdio MCP Host (Antigravity / Cursor)
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="lg:col-span-1 flex items-center justify-center">
                <div className="flex lg:flex-col items-center gap-1 text-cyan-400 font-mono text-[10px]">
                  <span>HTTPS</span>
                  <ArrowRight className="w-5 h-5" />
                  <span>inlineData</span>
                </div>
              </div>

              {/* Router Core */}
              <div className="lg:col-span-3 rounded-xl border border-cyan-400/40 bg-cyan-500/[0.07] p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Sovereign Neural + Deterministic Router
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <code className="text-cyan-200">/api/copilot</code> orchestrates{" "}
                  <strong>Gemini 2.5 Flash</strong> native function declarations
                  with an automatic local deterministic SQL command parser
                  fallback so operations never stall.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30">
                    create_pms_task
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30">
                    log_nutrition_meal
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30">
                    create_circadian_block
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30">
                    log_entity_telemetry
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-emerald-500/30">
                    search_neural_vault
                  </span>
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="lg:col-span-1 flex items-center justify-center">
                <div className="flex lg:flex-col items-center gap-1 text-emerald-400 font-mono text-[10px]">
                  <span>&lt;10ms</span>
                  <ArrowRight className="w-5 h-5" />
                  <span>Raw SQL</span>
                </div>
              </div>

              {/* Tier 2: Sovereign PostgreSQL & Audit Ledger */}
              <div className="lg:col-span-3 rounded-xl border border-emerald-400/40 bg-emerald-500/[0.06] p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Tier 2 · PostgreSQL Bus & Audit Ledger
                </div>
                <div className="space-y-2 text-xs text-zinc-200">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                    Direct <code className="text-emerald-300">pgQuery</code> /{" "}
                    <code className="text-emerald-300">pgExec</code> mutations
                    with zero external proxy overhead.
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                    Every tool call timed & sealed into{" "}
                    <code className="text-amber-300">
                      public.copilot_tool_executions
                    </code>{" "}
                    with millisecond precision.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
