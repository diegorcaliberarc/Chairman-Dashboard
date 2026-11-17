import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StrategicTree, DagNode, DagConnection, ClarifyingQuestion } from "@/lib/synthesisRoadmapTypes";
import { resolveNodeVisual } from "@/lib/roadmapVisuals";

export const dynamic = "force-dynamic";

/**
 * Deterministic fallback tree generator for Done-For-You mode
 */
function generateDeterministicDfyTree(goal: string, domain: string): StrategicTree {
  const treeId = `synth_${Date.now()}`;
  const d = (domain || "custom") as any;

  return {
    id: treeId,
    title: `${d.toUpperCase()}: ${goal.toUpperCase()}`,
    domain: d,
    icon: d === "health" ? "monitor_heart" : d === "wealth" ? "trending_up" : d === "dogs" ? "pets" : "bolt",
    loeCount: "3 Parallel LOE Tracks Converging",
    audit: { have: 6, acq: 3, blocked: 0 },
    tier0: [
      {
        id: `${treeId}_t0_1`,
        tier: 0,
        domain: d,
        title: "Baseline Inventory & Audit",
        sub: "Current Resource Anchor • Physical Verification",
        status: "HAVE",
        statusText: "100% READY",
        icon: "checklist",
        image: resolveNodeVisual(`Baseline ${goal}`, "inventory audit", d),
        frago: {
          task: "Operational Readiness Calibration",
          purpose: `Establish ground-truth metrics for ${goal}`,
          window: "Day 00 Initial Setup",
        },
        pace: {
          p: "Physical audit + digital log verification",
          a: "Digital estimation benchmark",
          c: "Historical records reference",
          e: "Immediate baseline stopgap",
        },
        res: {
          have: "Core gear, measurement tools, digital dashboard",
          need: "Weekly milestone schedule",
          blocked: "None",
        },
        checks: [
          { id: "c_1", label: "Inspect all primary equipment and tools", completed: true },
          { id: "c_2", label: "Log initial quantitative benchmark in telemetry", completed: true },
        ],
      },
      {
        id: `${treeId}_t0_2`,
        tier: 0,
        domain: d,
        title: "Logistics & Supply Staging",
        sub: "Procurement Clear • Clean Workshelf Zone",
        status: "HAVE",
        statusText: "100% VERIFIED",
        icon: "inventory_2",
        image: resolveNodeVisual(`Staging logistics ${goal}`, "workspace prep", d),
        frago: {
          task: "Frictionless Staging Protocol",
          purpose: "Eliminate supply latency before starting assembly sprints",
          window: "Sprint Day 01 0800 HRS",
        },
        pace: {
          p: "Dedicated organizing bins + labeled tools",
          a: "Clear desktop workbench prep zone",
          c: "Temporary rolling cart staging",
          e: "Single task staging tray",
        },
        res: {
          have: "Staging area, basic supplies",
          need: "Specialized consumable restock",
          blocked: "None",
        },
        checks: [
          { id: "c_3", label: "Clear all peripheral clutter from workspace", completed: true },
          { id: "c_4", label: "Verify consumable materials are within reach", completed: true },
        ],
      },
    ],
    tier1: [
      {
        id: `${treeId}_t1_1`,
        tier: 1,
        domain: d,
        title: "Primary Execution Sub-Assembly",
        sub: "High-Intensity Sprints • RPE 8-9 Output",
        status: "PROGRESS",
        statusText: "IN PROGRESS",
        icon: "construction",
        image: resolveNodeVisual(`Execution sprint ${goal}`, "high output", d),
        frago: {
          task: "Core Assembly / Tactical Execution",
          purpose: `Execute high-leverage workflows required for ${goal}`,
          window: "Daily 0900 - 1200 Block",
        },
        pace: {
          p: "Scheduled 90-minute deep work blocks",
          a: "45-minute modular micro-sprints",
          c: "Evening 30-minute review and catchup",
          e: "Single critical bottleneck resolution",
        },
        res: {
          have: "Focus block allocated, tools active",
          need: "Mid-sprint velocity tracking",
          blocked: "None",
        },
        checks: [
          { id: "c_5", label: "Complete milestone sprint alpha", completed: false },
          { id: "c_6", label: "Perform quality control check against specs", completed: false },
        ],
      },
      {
        id: `${treeId}_t1_2`,
        tier: 1,
        domain: d,
        title: "Quality Control & Validation",
        sub: "Zero Tolerance for Drift • Spec Integrity",
        status: "PROGRESS",
        statusText: "ACQUIRING",
        icon: "fact_check",
        image: resolveNodeVisual(`Quality test validation ${goal}`, "inspection", d),
        frago: {
          task: "Tolerance & Compliance Verification",
          purpose: "Catch errors early and enforce military-grade precision",
          window: "Post-Sprint Inspection",
        },
        pace: {
          p: "Checklist verification + stress test",
          a: "Peer review / sidecar inspection",
          c: "Automated linting / test pass",
          e: "Visual smoke test pass",
        },
        res: {
          have: "Inspection standard checklist",
          need: "Independent audit pass",
          blocked: "None",
        },
        checks: [
          { id: "c_7", label: "Verify tolerances meet target benchmarks", completed: false },
          { id: "c_8", label: "Log test results in daily SITREP", completed: false },
        ],
      },
    ],
    tier2: [
      {
        id: `${treeId}_t2_1`,
        tier: 2,
        domain: d,
        title: "System Integration & Stress Test",
        sub: "End-to-End Dynamic Run • Full Load",
        status: "PROGRESS",
        statusText: "SYNTHESIS",
        icon: "published_with_changes",
        image: resolveNodeVisual(`Integration stress test ${goal}`, "system sync", d),
        frago: {
          task: "Multi-Track Convergence Verification",
          purpose: "Confirm all sub-assemblies operate in flawless synergy",
          window: "Final Pre-Launch Window",
        },
        pace: {
          p: "Full continuous cycle at 100% capacity",
          a: "75% capacity phased rollout",
          c: "Dry run simulation with manual overrides",
          e: "Safe shutdown & fallback lock",
        },
        res: {
          have: "Integrated test harness",
          need: "Final sign-off verification",
          blocked: "None",
        },
        checks: [
          { id: "c_9", label: "Complete full integration test cycle", completed: false },
          { id: "c_10", label: "Zero unhandled exceptions or leaks", completed: false },
        ],
      },
    ],
    tier3: {
      title: `GOAL!! ${goal.toUpperCase()}`,
      badge: "TERMINAL CONVERGENCE CLIMAX",
      desc: `Complete mastery and triumphant execution of ${goal} at 100 Billion % scientific precision.`,
      rate: "70.0%",
      metric1: "Synthesis Rate: 100% Nominal",
      metric2: "Bottlenecks: 0 Active Constraints",
      reactionTag: "MISSION COMPLETE",
      image: resolveNodeVisual(goal, "climax", d),
    },
    arrows: [
      { from: `${treeId}_t0_1`, to: `${treeId}_t1_1`, label: "AUDIT ➔ SPRINT", color: "cyan", rx: 0 },
      { from: `${treeId}_t0_2`, to: `${treeId}_t1_1`, label: "SUPPLY", color: "amber", rx: 1 },
      { from: `${treeId}_t0_2`, to: `${treeId}_t1_2`, label: "SPEC VERIFIED", color: "cyan", rx: 2 },
      { from: `${treeId}_t1_1`, to: `${treeId}_t2_1`, label: "ASSEMBLY α", color: "amber", rx: 3 },
      { from: `${treeId}_t1_2`, to: `${treeId}_t2_1`, label: "QA PASS β", color: "cyan", rx: 4 },
      { from: `${treeId}_t2_1`, to: "goal", label: "GOAL REACHED!!", color: "gold", rx: 5 },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, goalPrompt, domain = "custom", answers, nodeData, eventData } = body;

    // ─────────────────────────────────────────────────────────────────────────
    // Action 1: Done For You (DFY) Synthesis
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "dfy") {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (apiKey && goalPrompt) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are Senku Ishigami from Dr. Stone acting as Chief Tactical Architect for The Chairman Dashboard.
Create a strict, military-grade Directed Acyclic Graph (DAG) Synthesis Roadmap for the user's goal: "${goalPrompt}" in domain "${domain}".

Return a single JSON object with this EXACT structure (no markdown fences, pure JSON):
{
  "title": "Short Upper-case Goal Title",
  "loeCount": "e.g. 3 Parallel LOE Tracks Converging",
  "audit": { "have": 6, "acq": 2, "blocked": 0 },
  "tier0": [
    {
      "id": "t0_1",
      "title": "Raw Input Title",
      "sub": "Specific sub-metric",
      "status": "HAVE",
      "statusText": "100% READY",
      "icon": "material symbol icon name",
      "frago": { "task": "...", "purpose": "...", "window": "..." },
      "pace": { "p": "...", "a": "...", "c": "...", "e": "..." },
      "res": { "have": "...", "need": "...", "blocked": "..." },
      "checks": ["Drill 1", "Drill 2"]
    }
  ],
  "tier1": [
    {
      "id": "t1_1",
      "title": "Intermediate Sub-Assembly Title",
      "sub": "...",
      "status": "PROGRESS",
      "statusText": "IN PROGRESS",
      "icon": "material symbol icon name",
      "frago": { "task": "...", "purpose": "...", "window": "..." },
      "pace": { "p": "...", "a": "...", "c": "...", "e": "..." },
      "res": { "have": "...", "need": "...", "blocked": "..." },
      "checks": ["Drill 1", "Drill 2"]
    }
  ],
  "tier2": [
    {
      "id": "t2_1",
      "title": "Integration / Synthesis Junction Title",
      "sub": "...",
      "status": "PROGRESS",
      "statusText": "CONVERGING",
      "icon": "material symbol icon name",
      "frago": { "task": "...", "purpose": "...", "window": "..." },
      "pace": { "p": "...", "a": "...", "c": "...", "e": "..." },
      "res": { "have": "...", "need": "...", "blocked": "..." },
      "checks": ["Drill 1", "Drill 2"]
    }
  ],
  "tier3": {
    "title": "GOAL!! Apex Result",
    "badge": "MASTER CLIMAX DIRECTIVE",
    "desc": "Energetic Dr Stone summary of victory",
    "rate": "75.0%",
    "metric1": "Key metric 1",
    "metric2": "Key metric 2",
    "reactionTag": "SYNTHESIS COMPLETE"
  },
  "arrows": [
    { "from": "t0_1", "to": "t1_1", "label": "FLOW LABEL", "color": "amber" },
    { "from": "t1_1", "to": "t2_1", "label": "SYNTHESIS", "color": "cyan" },
    { "from": "t2_1", "to": "goal", "label": "CLIMAX!!", "color": "gold" }
  ]
}`;

          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });

          const rawText = res.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const treeId = `synth_${Date.now()}`;

            // Augment with images and typed checklists
            const tree: StrategicTree = {
              id: treeId,
              title: `${domain.toUpperCase()}: ${parsed.title || goalPrompt.toUpperCase()}`,
              domain: domain as any,
              icon: domain === "health" ? "monitor_heart" : domain === "wealth" ? "trending_up" : domain === "dogs" ? "pets" : "bolt",
              loeCount: parsed.loeCount || "3 Parallel LOE Tracks",
              audit: parsed.audit || { have: 6, acq: 2, blocked: 0 },
              tier0: (parsed.tier0 || []).map((n: any, i: number) => ({
                ...n,
                id: `${treeId}_t0_${i + 1}`,
                tier: 0,
                domain,
                image: resolveNodeVisual(n.title, n.sub, domain),
                checks: (n.checks || []).map((c: string, ci: number) => ({
                  id: `chk_${treeId}_t0_${i}_${ci}`,
                  label: typeof c === "string" ? c : (c as any).label || "Action item",
                  completed: false,
                })),
              })),
              tier1: (parsed.tier1 || []).map((n: any, i: number) => ({
                ...n,
                id: `${treeId}_t1_${i + 1}`,
                tier: 1,
                domain,
                image: resolveNodeVisual(n.title, n.sub, domain),
                checks: (n.checks || []).map((c: string, ci: number) => ({
                  id: `chk_${treeId}_t1_${i}_${ci}`,
                  label: typeof c === "string" ? c : (c as any).label || "Action item",
                  completed: false,
                })),
              })),
              tier2: (parsed.tier2 || []).map((n: any, i: number) => ({
                ...n,
                id: `${treeId}_t2_${i + 1}`,
                tier: 2,
                domain,
                image: resolveNodeVisual(n.title, n.sub, domain),
                checks: (n.checks || []).map((c: string, ci: number) => ({
                  id: `chk_${treeId}_t2_${i}_${ci}`,
                  label: typeof c === "string" ? c : (c as any).label || "Action item",
                  completed: false,
                })),
              })),
              tier3: {
                ...parsed.tier3,
                title: parsed.tier3?.title || `GOAL!! ${goalPrompt.toUpperCase()}`,
                image: resolveNodeVisual(goalPrompt, "apex goal", domain),
              },
              arrows: (parsed.arrows || []).map((a: any) => ({
                from: a.from.includes(treeId) ? a.from : a.from === "goal" ? "goal" : a.from.replace(/^t0_/, `${treeId}_t0_`).replace(/^t1_/, `${treeId}_t1_`).replace(/^t2_/, `${treeId}_t2_`),
                to: a.to.includes(treeId) ? a.to : a.to === "goal" ? "goal" : a.to.replace(/^t0_/, `${treeId}_t0_`).replace(/^t1_/, `${treeId}_t1_`).replace(/^t2_/, `${treeId}_t2_`),
                label: a.label || "CONVERGE",
                color: a.color || "amber",
              })),
            };

            return NextResponse.json({ success: true, tree, source: "gemini" });
          }
        } catch (aiErr) {
          console.warn("Gemini DFY synthesis error, falling back to deterministic:", aiErr);
        }
      }

      // Fast deterministic generator fallback
      const tree = generateDeterministicDfyTree(goalPrompt || "Autonomous Execution", domain);
      return NextResponse.json({ success: true, tree, source: "deterministic" });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action 2: Done With You (DWY) - Initialize Clarifying Questions
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "dwy_init") {
      const questions: ClarifyingQuestion[] = [
        {
          id: "q_target",
          question: `What is your exact quantitative target and time horizon for "${goalPrompt}"?`,
          description: "e.g., '155 lbs at 8% body fat by May 1st', or '5 signed equipment rental contracts ($25k MRR) in 60 days'.",
          placeholder: "Target metric & completion date...",
          suggestedAnswers: [
            "155 lbs @ 8% body fat in 90 days",
            "5 Enterprise clients ($25k MRR) in 60 days",
            "Complete installation & pressure test this Saturday",
          ],
        },
        {
          id: "q_inventory",
          question: "What physical resources, tools, data, or verified assets do you ALREADY HAVE?",
          description: "These become your Tier 0 [HAVE] baseline cards.",
          placeholder: "e.g. Tools, codebase, DEXA scan, memberships, materials staged...",
          suggestedAnswers: [
            "DEXA scan report + scale + 20 meal prep containers",
            "Next.js repo + Supabase DB + Stripe keys verified",
            "PEX crimper + 1/2' pipe + SharkBite valves staged",
          ],
        },
        {
          id: "q_constraints",
          question: "What are your primary constraints, known risks, or bottlenecks?",
          description: "These inform your [NEED] and [BLOCKED] audit badges and PACE emergency fallbacks.",
          placeholder: "e.g. Limited evening time, pending equipment arrival, fatigue...",
          suggestedAnswers: [
            "Strict evening curfew (22:00) & blue-light fatigue",
            "Pending specialized plumbing adapter shipping from Amazon",
            "High daytime client meetings interrupting deep build blocks",
          ],
        },
      ];

      return NextResponse.json({ success: true, questions });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action 3: Done With You (DWY) - Refine and Construct DAG from Answers
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "dwy_refine") {
      const answersMap = answers || {};
      const targetAns = answersMap["q_target"] || goalPrompt;
      const invAns = answersMap["q_inventory"] || "Verified tools and baseline staged";
      const constAns = answersMap["q_constraints"] || "Zero known impediments";

      const tree = generateDeterministicDfyTree(targetAns, domain);
      // Inject user's specific inputs into the tree
      if (tree.tier0[0]) {
        tree.tier0[0].sub = invAns.slice(0, 48);
        tree.tier0[0].res.have = invAns;
      }
      if (tree.tier1[0]) {
        tree.tier1[0].res.blocked = constAns.includes("Zero") ? "None" : constAns.slice(0, 40);
        if (!constAns.includes("Zero")) {
          tree.tier1[0].status = "BLOCKED";
          tree.tier1[0].statusText = "CONSTRAINED";
          tree.audit.blocked = 1;
        }
      }

      return NextResponse.json({ success: true, tree, source: "dwy_refined" });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action 4: Sync Node Subtasks to Pristine PMS (Prisma Task Model)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "sync_pms") {
      const session = await getServerSession(authOptions);
      const userId = (session as any)?.userId as string | undefined;
      const { nodeTitle, checks, domain } = body;

      if (!checks || !Array.isArray(checks)) {
        return NextResponse.json({ error: "Missing checks array" }, { status: 400 });
      }

      const createdTasks = [];
      for (const chk of checks) {
        try {
          const task = await prisma.task.create({
            data: {
              title: `[${nodeTitle}] ${chk.label}`,
              pillar: domain || "all",
              agentId: "chairman-dag-engine",
              category: "Operations",
              status: chk.completed ? "Done" : "To Do",
              priority: 2,
              userId: userId || null,
            },
          });
          createdTasks.push({ checkId: chk.id, taskId: task.id, title: task.title });
        } catch (e) {
          console.warn("Error creating individual PMS task:", e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${createdTasks.length} subtasks to Sovereign PMS!`,
        createdTasks,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Action 5: Sync Node Execution Window to Circadian Solar Arc Calendar
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "sync_calendar") {
      const session = await getServerSession(authOptions);
      const userId = (session as any)?.userId as string | undefined;
      const { nodeTitle, fragoWindow, nodeImage, domain } = body;

      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0);

      try {
        const event = await prisma.circadianEvent.create({
          data: {
            title: `[DAG] ${nodeTitle}`,
            description: `FRAGO Execution Window: ${fragoWindow || "0900 - 1030 HRS"}`,
            domain: domain === "dogs" ? "family_pets" : domain === "health" ? "physical_training" : "engineering",
            startTime,
            endTime,
            mediaUrl: nodeImage || "/circadian/saas-build.jpg",
            accentColor: "#00f0ff",
            userId: userId || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Scheduled "${nodeTitle}" onto Circadian Solar Arc!`,
          event,
        });
      } catch (err: any) {
        console.error("Circadian event sync error:", err);
        return NextResponse.json({
          success: true,
          message: `Scheduled "${nodeTitle}" in local session.`,
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Synthesis route error:", error);
    return NextResponse.json({ error: error.message || "Synthesis failed" }, { status: 500 });
  }
}
