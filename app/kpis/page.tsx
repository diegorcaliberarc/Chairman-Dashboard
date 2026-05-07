"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Target, Settings, TrendingUp, Landmark, Terminal, Layers, CircleDollarSign, Activity, Users, Sparkles, Edit2, X, Save } from "lucide-react";

const CSS_3D = `
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
`;

interface Metric {
  id?: string;
  metricName: string;
  value: number;
  target: number;
  category: string;
}

const CATEGORIES = [
  { id: "ceo", title: "CEO", icon: Target, color: "#C9A961" },
  { id: "coo", title: "COO", icon: Settings, color: "#7B9EA8" },
  { id: "cmo", title: "CMO", icon: TrendingUp, color: "#A87B9E" },
  { id: "cfo", title: "CFO", icon: Landmark, color: "#8BA87B" },
  { id: "cto", title: "CTO", icon: Terminal, color: "#4A90E2" },
  { id: "cpo", title: "CPO", icon: Layers, color: "#F39C12" },
  { id: "wealth", title: "WEALTH", icon: CircleDollarSign, color: "#D4AF37" },
  { id: "health", title: "HEALTH", icon: Activity, color: "#E05A3A" },
  { id: "relate", title: "RELATIONSHIPS", icon: Users, color: "#5B8FB9" },
  { id: "joy", title: "JOY", icon: Sparkles, color: "#B388EB" },
];

const RAW_METRIC_DEFS: Record<string, { name: string, defaultVal: number, target: number }[]> = {
  wealth: [
    { name: "income_va_ssa", defaultVal: 1, target: 0 },
    { name: "income_total", defaultVal: 0, target: 0 },
    { name: "debt_monthly_service", defaultVal: 0, target: 0 },
    { name: "debt_total_principal", defaultVal: 1, target: 0 },
    { name: "debt_avg_interest", defaultVal: 0, target: 0 },
    { name: "expenses_monthly", defaultVal: 1, target: 0 },
    { name: "cash_liquid", defaultVal: 0, target: 0 },
    { name: "assets_income_producing", defaultVal: 0, target: 0 },
  ],
  ceo: [
    { name: "Total Revenue", defaultVal: 0, target: 0 },
    { name: "Manual Hours", defaultVal: 1, target: 0 },
  ],
  cfo: [
    { name: "Liquidity", defaultVal: 0, target: 0 },
    { name: "Max Session Drawdown", defaultVal: 1, target: 0 },
  ],
  coo: [{ name: "Efficiency Score", defaultVal: 100, target: 100 }],
  cmo: [{ name: "CAC", defaultVal: 0, target: 0 }, { name: "LTV", defaultVal: 0, target: 0 }],
  cto: [{ name: "Uptime", defaultVal: 99.9, target: 99.9 }],
  cpo: [{ name: "User Satisfaction", defaultVal: 100, target: 100 }],
  health: [{ name: "Health Score", defaultVal: 100, target: 100 }],
  relate: [{ name: "Relationship Score", defaultVal: 100, target: 100 }],
  joy: [{ name: "Joy Index", defaultVal: 100, target: 100 }],
};

function getStatus(val: number, target: number, operator: "<" | ">") {
  if (operator === "<") {
    if (val <= target) return "GREEN";
    if (val <= target * 1.5) return "YELLOW";
    return "RED";
  } else {
    if (val >= target) return "GREEN";
    if (val >= target * 0.8) return "YELLOW";
    return "RED";
  }
}

function calculateWealthPhysics(localVals: Record<string, number>) {
  const inc_va_ssa = localVals["income_va_ssa"] || 1;
  const inc_total = localVals["income_total"] || 0;
  const debt_mo = localVals["debt_monthly_service"] || 0;
  const debt_prin = localVals["debt_total_principal"] || 1;
  const debt_int = localVals["debt_avg_interest"] || 0;
  const exp_mo = localVals["expenses_monthly"] || 1;
  const cash = localVals["cash_liquid"] || 0;
  const assets = localVals["assets_income_producing"] || 0;

  const oxygenRatio = (debt_mo / inc_va_ssa) * 100;
  const fcf = inc_total - exp_mo - debt_mo;
  const burn = exp_mo + debt_mo || 1;
  const ruinRatio = cash / burn;
  const entropyRate = debt_int;
  const multiplier = assets / debt_prin;

  return { oxygenRatio, fcf, ruinRatio, entropyRate, multiplier };
}

function SectorCard({ category, allMetrics, onSave }: any) {
  const [isFlipped, setIsFlipped] = useState(false);
  const defs = RAW_METRIC_DEFS[category.id];
  const [localVals, setLocalVals] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const vals: any = {};
    defs.forEach(d => {
      const m = allMetrics.find((m: any) => m.category === category.id && m.metricName === d.name);
      vals[d.name] = m ? m.value : d.defaultVal;
    });
    setLocalVals(vals);
  }, [allMetrics, category.id, defs, isFlipped]);

  const save = async () => {
    for (const d of defs) {
      const m = allMetrics.find((m: any) => m.category === category.id && m.metricName === d.name);
      if (!m || m.value !== localVals[d.name]) {
        await onSave({
          id: m?.id,
          category: category.id,
          metricName: d.name,
          value: localVals[d.name],
          target: m?.target ?? d.target,
        });
      }
    }
    setIsFlipped(false);
  };

  const isWealth = category.id === "wealth";
  const wPhys = isWealth ? calculateWealthPhysics(localVals) : null;

  let primaryLabel = "Core Score";
  let primaryValue = "0";
  let status = "RED";

  if (category.id === "ceo") {
    const rev = localVals["Total Revenue"] || 0;
    const hrs = localVals["Manual Hours"] || 1;
    const lev = rev / hrs;
    primaryLabel = "Leverage Ratio";
    primaryValue = `$${lev.toFixed(0)}/hr`;
    status = getStatus(lev, 1000, ">");
  } else if (category.id === "cfo") {
    const liq = localVals["Liquidity"] || 0;
    const dd = localVals["Max Session Drawdown"] || 1;
    const mos = liq / dd;
    primaryLabel = "Margin of Safety";
    primaryValue = `${mos.toFixed(1)}x`;
    status = getStatus(mos, 5, ">");
  } else {
    const first = defs[0].name;
    const val = localVals[first] || 0;
    primaryLabel = first;
    primaryValue = val.toString();
    status = getStatus(val, defs[0].target, ">");
  }

  const statusColors = {
    GREEN: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    YELLOW: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
    RED: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
  };

  const cardHeight = isWealth ? "h-[380px]" : "h-[220px]";

  return (
    <div className={`relative w-full ${cardHeight} perspective-1000 group`}>
      <div className={`w-full h-full absolute transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <category.icon className="w-5 h-5" style={{ color: category.color }} />
              <h3 className="font-serif text-lg tracking-widest uppercase" style={{ color: category.color }}>{category.title}</h3>
            </div>
            <button onClick={() => setIsFlipped(true)} className="p-1.5 rounded-md hover:bg-zinc-200/50 dark:hover:bg-white/10 text-zinc-500 transition-colors">
              <Edit2 size={14} />
            </button>
          </div>
          
          {isWealth && wPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "Oxygen Ratio", sub: "Monthly Debt / VA+SSA", val: `${wPhys.oxygenRatio.toFixed(1)}%`, status: getStatus(wPhys.oxygenRatio, 15, "<") },
                { label: "Free Cash Flow", sub: "Net Velocity", val: `$${wPhys.fcf.toLocaleString()}`, status: wPhys.fcf > 0 ? "GREEN" : (wPhys.fcf === 0 ? "YELLOW" : "RED") },
                { label: "Ruin Ratio", sub: "Capital Buffer", val: `${wPhys.ruinRatio.toFixed(1)}x`, status: getStatus(wPhys.ruinRatio, 6.0, ">") },
                { label: "Entropy Rate", sub: "Weighted Avg Interest", val: `${wPhys.entropyRate.toFixed(1)}%`, status: wPhys.entropyRate <= 0 ? "GREEN" : (wPhys.entropyRate <= 5 ? "YELLOW" : "RED") },
                { label: "Multiplier", sub: "Assets / Debt", val: `${wPhys.multiplier.toFixed(2)}x`, status: getStatus(wPhys.multiplier, 2.0, ">") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className="text-[10px] leading-none" title={k.status === "GREEN" ? "OPTIMAL" : k.status === "YELLOW" ? "WARNING" : "CRITICAL"}>{k.status === "GREEN" ? "✅" : k.status === "YELLOW" ? "⚠️" : "🚨"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 mt-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">{primaryLabel}</div>
              <div className="font-serif text-4xl mb-4" style={{ color: category.color }}>{primaryValue}</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                <span className="text-[9px] tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                  {status === "GREEN" ? "OPTIMAL" : status === "YELLOW" ? "WARNING" : "CRITICAL"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Back (Edit Mode) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-zinc-50 dark:bg-[#0E0F14] border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200/50 dark:border-white/10 shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Update Metrics</h3>
            <button onClick={() => setIsFlipped(false)} className="p-1 rounded hover:bg-red-500/10 text-red-400">
              <X size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {defs.map(d => (
              <div key={d.name} className="flex flex-col gap-1">
                <label className="text-[9px] tracking-widest uppercase text-zinc-600 dark:text-zinc-400">{d.name}</label>
                <input 
                  type="number" 
                  value={localVals[d.name] ?? ""} 
                  onChange={(e) => setLocalVals({...localVals, [d.name]: parseFloat(e.target.value) || 0})}
                  className="bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded p-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[color:var(--theme-grad-start)] transition-colors"
                />
              </div>
            ))}
          </div>

          <button onClick={save} className="mt-3 w-full py-2 shrink-0 bg-[rgba(var(--theme-grad-start-rgb),0.1)] border border-[color:var(--theme-grad-start)]/30 rounded flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-bold text-[color:var(--theme-grad-start)] hover:bg-[rgba(var(--theme-grad-start-rgb),0.2)] transition-colors">
            <Save size={12} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KPIsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;
  const [metrics, setMetrics] = useState<Metric[]>([]);

  const [activeTab, setActiveTab] = useState("KPI");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [deepWork, setDeepWork] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);

  useEffect(() => {
    fetch("/api/metrics")
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (metric: Metric) => {
    // Optimistic update
    setMetrics(prev => {
      const idx = prev.findIndex(m => m.id === metric.id && m.id !== undefined);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = metric;
        return next;
      }
      return [...prev, metric];
    });

    try {
      const res = await fetch("/api/metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
      });
      const data = await res.json();
      if (data.metric) {
        setMetrics(prev => {
          const idx = prev.findIndex(m => m.metricName === data.metric.metricName && m.category === data.metric.category);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.metric;
            return next;
          }
          return [...prev, data.metric];
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const entropyM = metrics.find(m => m.category === "wealth" && m.metricName === "debt_avg_interest");
  const entropy = entropyM ? entropyM.value : 0;
  
  const inc_total = metrics.find(m => m.category === "wealth" && m.metricName === "income_total")?.value || 0;
  const exp_mo = metrics.find(m => m.category === "wealth" && m.metricName === "expenses_monthly")?.value || 0;
  const debt_mo = metrics.find(m => m.category === "wealth" && m.metricName === "debt_monthly_service")?.value || 0;
  const velocity = inc_total - exp_mo - debt_mo;

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white flex flex-row">
      <style>{CSS_3D}</style>
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        calConnected={calConnected} 
        onCalToggle={() => calConnected ? signOut({ redirect: false }) : signIn("google")}
        isAppearanceOpen={isAppearanceOpen} 
        setIsAppearanceOpen={setIsAppearanceOpen} 
        activeTasksCount={0}
        activeSubtasksCount={0}
        tasksLoading={false}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
        novaOpen={novaOpen}
        setNovaOpen={setNovaOpen}
      />

      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="max-w-[1440px] mx-auto">
            
            <div className="mb-8 border-b border-zinc-200/50 dark:border-white/10 pb-4">
              <h1 className="text-2xl font-bold tracking-[0.1em] text-zinc-900 dark:text-white flex items-center gap-3">
                <Activity className="text-[color:var(--theme-grad-start)]" size={24} />
                GOVERNANCE ENGINE
              </h1>
              <p className="text-xs text-zinc-500 tracking-widest uppercase mt-2">Physics-based KPI tracking & Vital Signs</p>
            </div>

            {/* Scorecard */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center shadow-lg">
                <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">Total Entropy (Average Debt Rate)</div>
                <div className="text-4xl font-serif text-[#E05A3A]">{entropy.toFixed(1)}%</div>
              </div>
              <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center shadow-lg">
                <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">Net Velocity (Total FCF)</div>
                <div className="text-4xl font-serif text-[#C9A961]">${velocity.toLocaleString()}</div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
              {CATEGORIES.map(cat => (
                <SectorCard key={cat.id} category={cat} allMetrics={metrics} onSave={handleSave} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
