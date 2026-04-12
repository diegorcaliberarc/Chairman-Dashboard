import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const functionDeclarations = [
  {
    name: "save_roadmap",
    description: "Persists a strategy roadmap flowchart to the database. Use this anytime you generate a map or sequence.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "A short, descriptive title for the roadmap",
        },
        mermaid_syntax: {
          type: "STRING",
          description: "The raw Mermaid.js syntax (e.g. graph TD...)",
        },
      },
      required: ["title", "mermaid_syntax"],
    },
  },
];

// ── Agent system prompts ──────────────────────────────────────────────────────

const AGENT_PROMPTS: Record<string, string> = {
  "Universal Command": `You are the Chairman's Universal Command AI — a direct, sharp executive intelligence with no filler. You have full visibility into the Chairman's tasks, schedule, and priorities across all domains: Business (CEO/COO/CMO/CFO/CTO/CPO) and Personal (Wealth, Health, Relationships, Joy). Synthesize across all pillars. Be decisive, concise, and strategic.`,

  "CEO": `You are the Chairman's CEO Agent — Vision & Strategy. You think in systems, competitive moats, and 10-year horizons. You review the current tasks and calendar to give precise strategic guidance. Cut the noise. Lead with the most important insight first.`,

  "COO": `You are the Chairman's COO Agent — Operations & Execution. You focus on removing friction, sequencing work correctly, and ensuring the machine runs. Review the task backlog and identify what's blocking momentum. Be direct and operational.`,

  "CMO": `You are the Chairman's CMO Agent — Growth & Sales. You think in audiences, positioning, and acquisition loops. Your job is to turn the Chairman's vision into market traction. Review current priorities and give sharp marketing and growth direction.`,

  "CFO": `You are the Chairman's CFO Agent — Finance & Cash. You track leverage, capital allocation, and financial risk. Review current priorities through the lens of ROI and cash. Be precise with numbers and projections.`,

  "CTO": `You are the Chairman's CTO Agent — APIs & Claude Pipelines. You architect the technical stack, manage integrations, and think in systems. Review current tasks for technical dependencies and blockers. Be concrete and implementable.`,

  "CPO": `You are the Chairman's CPO Agent — Product & UX. You obsess over user experience, product loops, and feature prioritization. Review the current roadmap and give sharp product direction. Think in user outcomes, not features.`,

  "Tactical Spotter (Wealth)": `You are the Chairman's Wealth Intelligence Agent. You track income streams, investments, and financial independence milestones. Review current wealth tasks and give precise, actionable financial moves. Think in leverage and compounding.`,

  "Health Coach": `You are the Chairman's Health & Performance Coach. You optimize training, recovery, nutrition, and mental resilience. Review current health tasks and calendar to give sharp, science-backed guidance. No fluff — just the protocol.`,

  "Relationships": `You are the Chairman's Relationships Agent — Legacy & Pack. You track commitments to key relationships, family, and community. Review the current context and identify relationship investments that compound over time. Be human and precise.`,

  "Joy": `You are the Chairman's Joy & Goals Agent. You protect the Chairman's energy, passion, and personal fulfillment. Review current tasks and schedule to ensure space for what matters most. Be direct about what to protect and what to cut.`,
};

// ── Build context string from dashboard state ─────────────────────────────────

function buildContext(tasks: any[], calendarEvents: any[]): string {
  const pending = tasks.filter((t) => t.status !== "DONE");
  const done    = tasks.filter((t) => t.status === "DONE");

  const taskLines = pending
    .sort((a, b) => a.priority - b.priority)
    .map((t) => {
      const p = t.priority === 1 ? "HIGH" : t.priority === 3 ? "LOW" : "MED";
      return `  [${p}] [${t.agentId?.toUpperCase()}] ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`;
    })
    .join("\n");

  const todayStr = new Date().toDateString();
  const todayEvents = calendarEvents
    .filter((ev) => {
      const dt = ev.start?.dateTime ?? ev.start?.date;
      return dt ? new Date(dt).toDateString() === todayStr : false;
    })
    .map((ev) => {
      const dt = ev.start?.dateTime;
      const time = dt
        ? new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        : "All day";
      return `  ${time} — ${ev.summary ?? "Event"}`;
    })
    .join("\n");

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return `
=== DASHBOARD CONTEXT ===
Date: ${dateStr}

PENDING TASKS (${pending.length} active, ${done.length} complete):
${taskLines || "  No pending tasks."}

TODAY'S CALENDAR:
${todayEvents || "  No events today."}
=========================
`.trim();
}

// ── POST /api/chat ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, agentRole, tasks = [], calendarEvents = [] } = body as {
    message:        string;
    agentRole:      string;
    tasks:          any[];
    calendarEvents: any[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const systemPrompt = AGENT_PROMPTS[agentRole] ?? AGENT_PROMPTS["Universal Command"];
  const context      = buildContext(tasks, calendarEvents);

  const fullSystem = `${systemPrompt}\n\n${context}\n\nCRITICAL DIRECTIVE:\nWhen the user asks for a roadmap, sequence, blueprint, or map, you MUST output a Mermaid.js flowchart using graph TD syntax. Enclose the mermaid code strictly in standard markdown mermaid code blocks. If the user asks to map a strategy, you must generate the Mermaid syntax AND use the save_roadmap tool to persist it to the database.\n\nRespond in plain text. Be concise and direct. No markdown headers unless outputting Mermaid blocks. No bullet introductions like "Here are...". Lead with the most important point.`;

  try {
    const model  = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools: [{ functionDeclarations }] });
    const payload = [
      { text: fullSystem },
      { text: message },
    ];
    
    console.log("[API /chat] Triggering Gemini generateContent with payload:", JSON.stringify(payload, null, 2));
    const result = await model.generateContent(payload);
    console.log("[API /chat] Received raw AI result:", JSON.stringify(result, null, 2));
    
    const response = result?.response;
    if (!response) {
      console.log("[API /chat] Response object was undefined or empty.");
      return NextResponse.json({ reply: "I'm sorry, no response was returned by the AI." });
    }
    
    // Safely extract function calls
    let calls = typeof response.functionCalls === "function" ? response.functionCalls() : response.functionCalls;
    if (!calls && response.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      const functionCallPart = parts.find((p: any) => p.functionCall);
      if (functionCallPart) {
        calls = [functionCallPart.functionCall];
      }
    }
    
    const call = calls?.[0] ?? null;

    if (call && call.name === "save_roadmap" && call.args) {
      const title = call.args.title || "Untitled Roadmap";
      const mermaid_syntax = call.args.mermaid_syntax || "";
      
      console.log("[API /chat] Extracted save_roadmap tool call:", call);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("roadmaps").insert([{ title, mermaid_syntax }]);
        console.log("[API /chat] Inserted roadmap to DB successfully.");
      }
      
      const text = `Strategy saved into the Roadmap Vault:\n\n\`\`\`mermaid\n${mermaid_syntax}\n\`\`\``;
      return NextResponse.json({ reply: text });
    }

    // Safely extract text
    let text = "";
    if (typeof response.text === "function") {
      try { text = response.text(); } catch (e) { console.error("Error evaluating text():", e); }
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }
    
    if (!text) {
      console.log("[API /chat] No text found in AI response payload.");
      text = "Received an empty response payload from the AI.";
    }

    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("[API /chat] Gemini API error:", err);
    return NextResponse.json({ error: "AI request failed", detail: err?.message ?? String(err) }, { status: 500 });
  }
}
