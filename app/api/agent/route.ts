import { NextRequest, NextResponse } from "next/server";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentRequest {
  agentId: string;
  context?: Record<string, unknown>;
}

interface AgentResponse {
  briefing: string;
  tasks: string[];
}

// ─── Simulated Briefings per Agent ───────────────────────────────────────────

const MOCK_RESPONSES: Record<string, AgentResponse> = {
  ceo: {
    briefing:
      "Pristine Designs is tracking 14% above Q2 projections. Three strategic partnerships are pending signature. Board alignment on the product roadmap is strong — recommend a focused push on the enterprise vertical this week.",
    tasks: [
      "Review and sign the Apex Media partnership proposal by EOD",
      "Prep talking points for Thursday's investor update call",
      "Delegate Q3 OKR review to COO and set checkpoint for Friday",
    ],
  },
  coo: {
    briefing:
      "Operations are running at 94% efficiency. The onboarding pipeline has a 3-day backlog due to resource allocation. Sprint velocity is steady; no blockers reported from engineering.",
    tasks: [
      "Resolve onboarding backlog — identify two engineers to redirect",
      "Confirm vendor SLA renewal for the cloud infrastructure contract",
      "Run the weekly ops standup and flag capacity concerns to CEO",
    ],
  },
  cmo: {
    briefing:
      "Brand visibility is up 22% MoM from the recent campaign. The LinkedIn content series is outperforming benchmarks. Email open rates dipped slightly — A/B test subject lines are recommended for next send.",
    tasks: [
      "Approve the May content calendar before end of week",
      "Analyze the dip in email open rates and propose subject line variants",
      "Brief the design team on the Q3 brand refresh mood board",
    ],
  },
  cfo: {
    briefing:
      "Cash runway remains healthy at 18 months. AR aging shows two overdue invoices totaling $47K. OPEX is 6% under budget — headroom exists to accelerate one strategic hire.",
    tasks: [
      "Follow up on the two overdue invoices from Meridian and NovaTech",
      "Prepare the updated burn rate chart for the board deck",
      "Model the financial impact of the senior hire on Q4 runway",
    ],
  },
  wealth: {
    briefing:
      "Portfolio performance is up 8.3% YTD, outpacing the benchmark index by 2.1%. Three rebalancing opportunities have been identified in the tech allocation. Real estate holdings remain stable.",
    tasks: [
      "Review the rebalancing proposal from your wealth advisor",
      "Set up automatic contribution increase for the SEP-IRA",
      "Schedule quarterly review with financial planner for next month",
    ],
  },
  health: {
    briefing:
      "Movement consistency is strong — 5 of 7 days this week. Sleep quality has improved since adjusting the evening protocol. Recommend focusing on recovery this week given recent travel.",
    tasks: [
      "Schedule the annual physical and bloodwork panel",
      "Log meals for 3 consecutive days to identify energy patterns",
      "Block 30 minutes daily for movement — protect this time on the calendar",
    ],
  },
  relate: {
    briefing:
      "Key relationships are in good standing. One mentorship conversation is overdue by 2 weeks. Family commitments are well-protected in the current schedule. Two new networking connections warrant a follow-up.",
    tasks: [
      "Reach out to Marcus for the overdue mentorship check-in",
      "Plan a date night this weekend — protect it from work bleed",
      "Send a genuine follow-up to the two new contacts from last week's event",
    ],
  },
  joy: {
    briefing:
      "Creative energy is reported high. Two personal projects remain in backlog — the photography project and the side book list. Recommend protecting at least one joy block this week to avoid burnout.",
    tasks: [
      "Block Sunday morning for the photography drive — no phones",
      "Read at least 20 pages from the current book this week",
      "Identify one new experience or adventure to plan for the month",
    ],
  },
};

const FALLBACK_RESPONSE: AgentResponse = {
  briefing:
    "Agent is standing by. No specific briefing available for this context. The Gemini integration will provide live intelligence once connected.",
  tasks: [
    "Configure the Gemini API key in environment variables",
    "Define agent-specific context and memory in the Brain layer",
  ],
};

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AgentRequest = await request.json();

    if (!body.agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    // Simulate network latency (will be replaced by actual Gemini call)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const response =
      MOCK_RESPONSES[body.agentId.toLowerCase()] ?? FALLBACK_RESPONSE;

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process agent request" },
      { status: 500 }
    );
  }
}
