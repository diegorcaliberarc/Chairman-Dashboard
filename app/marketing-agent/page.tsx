"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Radar,
  Flame,
  Gamepad2,
  Megaphone,
  Star,
  Send,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Play,
  Layers,
  Filter,
  Search,
  Zap,
} from "lucide-react";

interface MarketingIntelItem {
  id: string;
  stream: "marketing" | "gaming";
  title: string;
  platform: string;
  hook_angle: string;
  viral_score: number;
  velocity_tag: string;
  summary: string;
  actionable_playbook: string[];
  source_url: string;
  is_saved: boolean;
  pushed_to_pms: boolean;
  created_at: string;
}

interface GamingTelemetry {
  topFormats: {
    name: string;
    velocity: string;
    avgRetention30s: string;
    bestPlatform: string;
  }[];
  packagingFormulas: string[];
  creatorArchetypes: {
    archetype: string;
    exampleHook: string;
  }[];
}

const DEFAULT_GAMING_TELEMETRY: GamingTelemetry = {
  topFormats: [
    {
      name: "100-Hour Permadeath / High-Stakes Cinema",
      velocity: "+385% 7d",
      avgRetention30s: "74%",
      bestPlatform: "YouTube Long-Form",
    },
    {
      name: "Proximity-Voice Co-Op Horror Chaos Cuts",
      velocity: "+340% 7d",
      avgRetention30s: "81%",
      bestPlatform: "TikTok / Shorts",
    },
    {
      name: "Split-Screen Frame-Data & Patch Mythbusting",
      velocity: "+275% 7d",
      avgRetention30s: "69%",
      bestPlatform: "YouTube / Twitch",
    },
    {
      name: "Zero-Budget Indie Devlog 'Viewer Breaks My Game'",
      velocity: "+230% 7d",
      avgRetention30s: "66%",
      bestPlatform: "YouTube / Reddit",
    },
  ],
  packagingFormulas: [
    "2-Element High-Contrast Thumbnail + Stakes HUD Badge + ≤44 Char Curiosity Title",
    "0–2.6s Climax Cold-Open → 1-Sentence Rule Stake → Audio Riser Hard-Cut",
    "Color-Coded Spatial Subtitles + Seamless End-to-Frame-1 Audio Loop",
  ],
  creatorArchetypes: [
    { archetype: "The Obsessive Challenger", exampleHook: "I survived 100 days with 1 HP..." },
    { archetype: "The Systems Scientist", exampleHook: "We tested 10,000 frames of the new meta..." },
    { archetype: "The Squad Chaos Director", exampleHook: "Proximity voice cut off right as..." },
    { archetype: "The Transparent Builder", exampleHook: "48 hours to fix my indie game's worst review..." },
  ],
};

const QUICK_PRESET_CHIPS: {
  label: string;
  stream: "both" | "marketing" | "gaming";
  query: string;
  niche: string;
}[] = [
  {
    label: "SaaS B2B Hooks",
    stream: "marketing",
    query: "SaaS B2B reverse-demo & funnel teardown hooks",
    niche: "High-ticket B2B & AI SaaS",
  },
  {
    label: "Indie Survival Horror / FPS Formats",
    stream: "gaming",
    query: "Indie survival horror & extraction FPS viral YouTube formats",
    niche: "Steam PC / YouTube Gaming",
  },
  {
    label: "Short-Form 0–3s Retention Edits",
    stream: "both",
    query: "0–3s short-form retention edits & seamless loop hooks",
    niche: "TikTok / YouTube Shorts",
  },
  {
    label: "Zero-Gate Lead Magnets",
    stream: "marketing",
    query: "Interactive micro-calculator & zero-gate VSL funnels",
    niche: "Growth Marketing",
  },
  {
    label: "100-Hour Permadeath Cinema",
    stream: "gaming",
    query: "100 hours permadeath storytelling & live stakes HUD",
    niche: "Long-Form Gaming",
  },
  {
    label: "Reddit & X Contrarian Launches",
    stream: "marketing",
    query: "Build-in-public telemetry receipts & Reddit launch threads",
    niche: "Founder-Led Growth",
  },
];

const SCRUB_STEPS = [
  "Polling Hacker News Algolia & Dev Feeds (4.5s budget)...",
  "Scanning Reddit Hot Threads & Steam Breakout Charts...",
  "Extracting 0–3s Retention Hooks & Packaging Velocity...",
  "Synthesizing 3-Step Executive Playbooks into Vault...",
];

function platformBadgeStyle(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("youtube")) return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  if (p.includes("tiktok") || p.includes("shorts"))
    return "bg-cyan-500/15 text-cyan-300 border-cyan-400/30";
  if (p.includes("twitch")) return "bg-purple-500/15 text-purple-300 border-purple-400/30";
  if (p.includes("reddit")) return "bg-orange-500/15 text-orange-300 border-orange-400/30";
  return "bg-sky-500/15 text-sky-300 border-sky-400/30";
}

export default function MarketingAgentPage() {
  const [items, setItems] = useState<MarketingIntelItem[]>([]);
  const [gamingTelemetry, setGamingTelemetry] = useState<GamingTelemetry>(DEFAULT_GAMING_TELEMETRY);
  const [loading, setLoading] = useState(true);

  // Scrubber Command State
  const [scrubStream, setScrubStream] = useState<"both" | "marketing" | "gaming">("both");
  const [queryInput, setQueryInput] = useState("");
  const [nicheInput, setNicheInput] = useState("");
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubStepIdx, setScrubStepIdx] = useState(0);
  const [lastScrubBanner, setLastScrubBanner] = useState<string | null>(null);

  // View Filter State
  const [viewFilter, setViewFilter] = useState<"all" | "marketing" | "gaming" | "saved">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [pushingId, setPushingId] = useState<string | null>(null);

  const loadIntel = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing-agent", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) setItems(data.items);
        if (data.gamingTelemetry) setGamingTelemetry(data.gamingTelemetry);
      }
    } catch (e) {
      console.error("Failed to load marketing intel:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntel();
  }, [loadIntel]);

  useEffect(() => {
    if (!isScrubbing) {
      setScrubStepIdx(0);
      return;
    }
    const iv = setInterval(() => {
      setScrubStepIdx((prev) => (prev + 1) % SCRUB_STEPS.length);
    }, 950);
    return () => clearInterval(iv);
  }, [isScrubbing]);

  const handleRunScrub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isScrubbing) return;

    setIsScrubbing(true);
    setLastScrubBanner(null);

    try {
      const res = await fetch("/api/marketing-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scrub",
          stream: scrubStream,
          query:
            queryInput.trim() ||
            (scrubStream === "gaming"
              ? "Indie horror & high-stakes gaming viral formats"
              : scrubStream === "marketing"
              ? "High-converting SaaS B2B & VSL marketing hooks"
              : "Breakout marketing funnels & viral gaming video hooks"),
          niche: nicheInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (Array.isArray(data.items)) setItems(data.items);
        const count = Array.isArray(data.newlyCreated) ? data.newlyCreated.length : 0;
        const sources = Array.isArray(data.scrubMeta?.sourcesReached)
          ? data.scrubMeta.sourcesReached.join(" · ")
          : "Live Signal Mesh";
        setLastScrubBanner(
          `Captured ${count} fresh intelligence playbooks via ${sources}${
            data.scrubMeta?.aiEnriched ? " + Gemini Synthesis" : ""
          }`
        );
      }
    } catch (err) {
      console.error("Scrub failed:", err);
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleToggleSave = async (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_saved: !it.is_saved } : it))
    );
    try {
      await fetch("/api/marketing-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_save", id }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePushToPms = async (id: string) => {
    setPushingId(id);
    try {
      const res = await fetch("/api/marketing-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "push_to_pms", id }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, pushed_to_pms: true } : it))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPushingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (viewFilter === "marketing" && item.stream !== "marketing") return false;
      if (viewFilter === "gaming" && item.stream !== "gaming") return false;
      if (viewFilter === "saved" && !item.is_saved) return false;
      if (platformFilter !== "All") {
        const p = item.platform.toLowerCase();
        const f = platformFilter.toLowerCase();
        if (f === "tiktok/shorts") {
          if (!p.includes("tiktok") && !p.includes("shorts")) return false;
        } else if (!p.includes(f)) {
          return false;
        }
      }
      return true;
    });
  }, [items, viewFilter, platformFilter]);

  const stats = useMemo(() => {
    const mktCount = items.filter((i) => i.stream === "marketing").length;
    const gamCount = items.filter((i) => i.stream === "gaming").length;
    const savedCount = items.filter((i) => i.is_saved).length;
    const avgScore =
      items.length > 0
        ? Math.round(items.reduce((acc, i) => acc + i.viral_score, 0) / items.length)
        : 92;
    return { mktCount, gamCount, savedCount, avgScore };
  }, [items]);

  return (
    <ExecutiveModuleShell
      moduleId="MARKETING_AGENT"
      eyebrow="Autonomous Signal Scrubber"
      title="Marketing & Gaming Trend Intelligence Agent"
      subtitle="Scrubs the internet for high-converting marketing ideas, viral hooks, and breakout gaming video trends"
      accentColor="#ec4899"
      headerActions={
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200">
            {stats.mktCount} Marketing · {stats.gamCount} Gaming
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
            Avg Viral Score {stats.avgScore}/100
          </span>
        </div>
      }
    >
      {/* ─── 1. Live Scrubber Command Bar ─────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-pink-500/[0.08] via-[#0d111d] to-purple-500/[0.07] border border-pink-400/25 p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/35 flex items-center justify-center text-pink-300">
              <Radar className={`w-5 h-5 ${isScrubbing ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-[0.14em] text-white">
                Live Internet Trend Scrubber Command Bar
              </h2>
              <p className="text-[11px] text-zinc-400">
                Queries HN Algolia, Reddit Hot Feeds, Steam Charts & Dev Pulse + synthesizes 3-step playbooks
              </p>
            </div>
          </div>

          {/* Stream Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-black/45 p-1 rounded-xl border border-white/10">
            {[
              { id: "both", label: "All Signals", icon: Sparkles },
              { id: "marketing", label: "Marketing & Growth Ideas", icon: Megaphone },
              { id: "gaming", label: "Gaming Videos & Viral Trends", icon: Gamepad2 },
            ].map((s) => {
              const Icon = s.icon;
              const active = scrubStream === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScrubStream(s.id as "both" | "marketing" | "gaming")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? "bg-pink-500/25 text-pink-200 border border-pink-400/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Topic & Niche Inputs + Run Internet Scrub Button */}
        <form onSubmit={handleRunScrub} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder='Topic / Hook Query (e.g., "SaaS B2B hooks", "Indie survival horror viral YouTube formats")'
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/12 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
            />
          </div>

          <div className="lg:col-span-3">
            <input
              type="text"
              value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              placeholder="Optional Niche / Audience (e.g., FPS, FinTech)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/12 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
            />
          </div>

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={isScrubbing}
              className="w-full h-full min-h-[42px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 disabled:opacity-60 text-xs font-extrabold uppercase tracking-[0.14em] text-white flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(236,72,153,0.35)] transition-all"
            >
              <Zap className={`w-4 h-4 ${isScrubbing ? "animate-bounce" : ""}`} />
              <span>{isScrubbing ? "Scrubbing Web..." : "Run Internet Scrub"}</span>
            </button>
          </div>
        </form>

        {/* Quick Preset Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-1">
            Presets:
          </span>
          {QUICK_PRESET_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setScrubStream(chip.stream);
                setQueryInput(chip.query);
                setNicheInput(chip.niche);
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-pink-500/15 border border-white/10 hover:border-pink-400/35 text-[11px] text-zinc-300 hover:text-pink-200 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Live Radar Progress Indicator */}
        {isScrubbing && (
          <div className="rounded-2xl bg-pink-500/10 border border-pink-400/30 p-3.5 flex items-center gap-3.5">
            <div className="relative w-9 h-9 rounded-full border border-pink-400/50 flex items-center justify-center shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_65%,rgba(236,72,153,0.65)_100%)] animate-spin" />
              <div className="w-2 h-2 rounded-full bg-pink-300 relative z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-pink-200">{SCRUB_STEPS[scrubStepIdx]}</div>
              <div className="w-full h-1.5 rounded-full bg-black/50 mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${((scrubStepIdx + 1) / SCRUB_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {lastScrubBanner && !isScrubbing && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3.5 py-2 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastScrubBanner}</span>
          </div>
        )}
      </section>

      {/* ─── 2. Gaming Viral Video & Trend Telemetry Panel ───────────────────── */}
      <section className="rounded-3xl bg-white/[0.025] border border-white/10 p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-[0.14em] text-white">
                Gaming Viral Video & Trend Telemetry Panel
              </h2>
              <p className="text-[11px] text-zinc-400">
                Breakout YouTube/Shorts/Twitch video formats, title/thumbnail packaging formulas & 0–3s retention hooks
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-[10px] font-mono font-bold uppercase text-purple-200">
            Click Any Format to Load Scrubber
          </span>
        </div>

        {/* Breakout Gaming Video Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {gamingTelemetry.topFormats.map((fmt) => (
            <button
              key={fmt.name}
              type="button"
              onClick={() => {
                setScrubStream("gaming");
                setQueryInput(fmt.name);
                setNicheInput(fmt.bestPlatform);
              }}
              className="text-left rounded-2xl bg-black/35 hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-400/35 p-3.5 transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono font-bold text-emerald-300">
                  {fmt.velocity}
                </span>
                <span className="text-[10px] font-mono text-purple-300">
                  30s Hold: {fmt.avgRetention30s}
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-purple-200 leading-snug">
                {fmt.name}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                <span>{fmt.bestPlatform}</span>
                <Play className="w-3 h-3 text-purple-400 opacity-70 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>

        {/* Packaging Formulas + Creator Trend Archetypes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 rounded-2xl bg-black/30 border border-white/[0.07] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-pink-300">
              <Layers className="w-3.5 h-3.5" />
              <span>Title, Thumbnail & 0–3s Retention Formulas</span>
            </div>
            <div className="space-y-2">
              {gamingTelemetry.packagingFormulas.map((formula, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-zinc-300 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.05]"
                >
                  <span className="font-serif font-bold text-pink-400 shrink-0">
                    {["I.", "II.", "III."][idx] || "•"}
                  </span>
                  <span>{formula}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-black/30 border border-white/[0.07] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Creator Trend Archetypes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {gamingTelemetry.creatorArchetypes.map((arch) => (
                <button
                  key={arch.archetype}
                  type="button"
                  onClick={() => {
                    setScrubStream("gaming");
                    setQueryInput(`${arch.archetype}: ${arch.exampleHook}`);
                  }}
                  className="text-left rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.05] hover:border-cyan-400/30 p-2.5 transition-colors"
                >
                  <div className="text-xs font-bold text-white">{arch.archetype}</div>
                  <div className="text-[10.5px] text-zinc-400 italic mt-0.5 truncate">
                    &ldquo;{arch.exampleHook}&rdquo;
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Filter Bar + Marketing & Gaming Idea Cards ───────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
          {[
            { id: "all", label: `All Cards (${items.length})` },
            { id: "marketing", label: `Marketing (${stats.mktCount})` },
            { id: "gaming", label: `Gaming (${stats.gamCount})` },
            { id: "saved", label: `Bookmarked (${stats.savedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id as "all" | "marketing" | "gaming" | "saved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewFilter === tab.id
                  ? "bg-pink-500/25 text-pink-200 border border-pink-400/35"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-500 mr-1" />
          {["All", "YouTube", "TikTok/Shorts", "X", "Twitch", "Reddit"].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                platformFilter === plat
                  ? "bg-white/15 text-white border-white/25"
                  : "bg-black/30 text-zinc-400 border-white/[0.06] hover:text-zinc-200"
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-12 text-center text-xs font-mono text-zinc-400">
          Loading scrubbed marketing & gaming intelligence vault...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-12 text-center space-y-2">
          <div className="text-sm font-bold text-white">No matching intelligence cards in this filter</div>
          <p className="text-xs text-zinc-400">
            Switch filter tabs or click &ldquo;Run Internet Scrub&rdquo; above to pull fresh ideas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl bg-white/[0.03] hover:bg-white/[0.045] border border-white/10 p-5 flex flex-col justify-between gap-4 transition-all shadow-[0_14px_38px_rgba(0,0,0,0.35)]"
            >
              <div className="space-y-3.5">
                {/* Top Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        item.stream === "gaming"
                          ? "bg-purple-500/15 text-purple-300 border-purple-400/30"
                          : "bg-pink-500/15 text-pink-300 border-pink-400/30"
                      }`}
                    >
                      {item.stream === "gaming" ? "🎮 Gaming Trend" : "📈 Marketing Funnel"}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${platformBadgeStyle(
                        item.platform
                      )}`}
                    >
                      {item.platform}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {item.velocity_tag}
                    </span>
                  </div>

                  {/* Viral Score Pill + Bookmark Star */}
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-xl bg-black/50 border border-white/10 text-xs font-mono font-extrabold text-amber-300">
                      Viral {item.viral_score}/100
                    </div>

                    <button
                      onClick={() => handleToggleSave(item.id)}
                      title={item.is_saved ? "Remove Bookmark" : "Bookmark Idea"}
                      className={`p-2 rounded-xl border transition-colors ${
                        item.is_saved
                          ? "bg-amber-400/20 border-amber-400/40 text-amber-300"
                          : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-amber-200"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.is_saved ? "fill-amber-300" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>

                {/* Hook Angle Callout */}
                <div className="rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-400/25 p-3">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-pink-300 mb-1">
                    Viral Hook Angle (0–3s Pattern)
                  </div>
                  <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                    {item.hook_angle}
                  </p>
                </div>

                {/* Summary */}
                <p className="text-xs text-zinc-300 leading-relaxed">{item.summary}</p>

                {/* 3-Step Actionable Playbook */}
                <div className="rounded-2xl bg-black/35 border border-white/[0.07] p-3.5 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">
                    3-Step Actionable Playbook
                  </div>
                  <ol className="space-y-1.5">
                    {(item.actionable_playbook || []).slice(0, 3).map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-200">
                        <span className="font-serif font-bold text-sky-400 w-5 shrink-0">
                          {["I.", "II.", "III."][i] || `${i + 1}.`}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Card Footer: Source Link + 1-Click Push to Task Engine */}
              <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
                {item.source_url ? (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-zinc-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Signal Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] font-mono text-zinc-500">Synthesized Playbook</span>
                )}

                {item.pushed_to_pms ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pushed to Task Engine</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handlePushToPms(item.id)}
                    disabled={pushingId === item.id}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-xs font-bold text-pink-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {pushingId === item.id ? "Pushing..." : "1-Click Push to Task Engine"}
                    </span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
