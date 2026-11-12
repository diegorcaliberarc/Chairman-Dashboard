import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export type EpistemicCategory =
  | "known_known"
  | "unknown_known"
  | "unknown_unknown";

export type EpistemicImpact = "tactical" | "operational" | "existential";

export interface EpistemicMatrixRow {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface EpistemicItemRow {
  id: string;
  matrix_id: string;
  category: EpistemicCategory;
  impact: EpistemicImpact;
  claim_statement: string;
  validation_protocol: string | null;
  is_mitigated: boolean;
  sort_order: number;
  created_at: string;
}

interface ExtractedAuditItem {
  category: EpistemicCategory;
  impact: EpistemicImpact;
  claim_statement: string;
  validation_protocol: string;
}

function sanitizeCategory(val: string): EpistemicCategory {
  if (
    val === "known_known" ||
    val === "unknown_known" ||
    val === "unknown_unknown"
  ) {
    return val;
  }
  return "unknown_unknown";
}

function sanitizeImpact(val: string): EpistemicImpact {
  if (val === "tactical" || val === "operational" || val === "existential") {
    return val;
  }
  return "operational";
}

const SEED_MATRICES: Array<{
  entity_id: string;
  entity_type: string;
  title: string;
  summary: string;
  items: Array<{
    category: EpistemicCategory;
    impact: EpistemicImpact;
    claim_statement: string;
    validation_protocol: string;
    is_mitigated?: boolean;
  }>;
}> = [
  {
    entity_id: "equipsynx-v2-launch",
    entity_type: "venture",
    title: "Equipsynx v2 Multi-Tenant Enterprise Launch",
    summary:
      "Pre-deployment epistemic triage across PostgreSQL RLS isolation, heavy-equipment dispatch telemetry ingestion, and enterprise onboarding SLAs.",
    items: [
      {
        category: "known_known",
        impact: "existential",
        claim_statement:
          "PostgreSQL Row-Level Security policies enforce strict tenant_id isolation across all 18 dispatch and asset tables with <8ms p95 query overhead.",
        validation_protocol:
          "Verified via automated cross-tenant penetration suite on staging cluster (0 leakage across 10,000 synthetic JWT mutations).",
        is_mitigated: true,
      },
      {
        category: "known_known",
        impact: "operational",
        claim_statement:
          "NextAuth + Supabase connection pooling sustains 250 concurrent field-operator mobile sessions on current pooler tier.",
        validation_protocol:
          "Load-tested with k6 steady-state burst simulation; PgBouncer transaction mode confirmed active.",
        is_mitigated: false,
      },
      {
        category: "known_known",
        impact: "tactical",
        claim_statement:
          "Offline-first PWA manifest caches active work-order checklists during rural dead-zone equipment inspections.",
        validation_protocol:
          "Field-tested in Airplane Mode with deterministic IndexedDB replay queue upon LTE reconnection.",
        is_mitigated: false,
      },
      {
        category: "unknown_known",
        impact: "operational",
        claim_statement:
          "Chairman Living OS fleet OBD-II maintenance heuristics can be packaged directly as Equipsynx's predictive engine-hour alert upsell.",
        validation_protocol:
          "Extract engine-hour threshold engine into shared @equipsynx/telemetry module and pilot with 2 anchor fleet customers.",
      },
      {
        category: "unknown_known",
        impact: "tactical",
        claim_statement:
          "Historical ClickUp & sovereign PMS dispatch templates already encode an 11-step enterprise onboarding playbook.",
        validation_protocol:
          "Convert internal sovereign PMS checklist JSON into one-click tenant workspace seed template.",
      },
      {
        category: "unknown_known",
        impact: "existential",
        claim_statement:
          "Existing Industrial Yard RFID gate telemetry logs provide proprietary training data that competitors lack for autonomous yard check-in.",
        validation_protocol:
          "Audit 90 days of yard gate timestamps and benchmark automated turnaround accuracy before Q3 pricing lock.",
      },
      {
        category: "unknown_unknown",
        impact: "existential",
        claim_statement:
          "Simultaneous LTE reconnection storms when 80+ field tablets return to yard Wi-Fi at 17:00 shift-end could trigger write-amplification deadlocks.",
        validation_protocol:
          "Implement jittered exponential backoff sync queues (0–45s window) + idempotency keys on all mutation endpoints.",
      },
      {
        category: "unknown_unknown",
        impact: "operational",
        claim_statement:
          "Legacy OEM telematics webhooks (CAT / John Deere AEMP 2.0) may silently mutate schema fields mid-quarter without deprecation notice.",
        validation_protocol:
          "Deploy Zod permissive envelope validation + raw payload quarantine dead-letter table with instant MCP alert.",
      },
      {
        category: "unknown_unknown",
        impact: "existential",
        claim_statement:
          "Enterprise insurance underwriters may mandate SOC2 Type II immutable audit retention before signing 7-figure national fleet rollouts.",
        validation_protocol:
          "Enable append-only WORM cryptographic hash-chaining on audit_logs table now so 6-month observation window starts immediately.",
      },
    ],
  },
  {
    entity_id: "caliber-arc-prop-scale",
    entity_type: "capital",
    title: "Caliber Arc $250K Multi-Account Futures Scaling",
    summary:
      "Rumsfeldian risk triage governing MNQ/NQ execution edge, Replikanto trade-copier synchronization, and CME volatility tail events.",
    items: [
      {
        category: "known_known",
        impact: "existential",
        claim_statement:
          "Hard $250 per-session daily loss circuit breaker mathematically caps worst-case 5-day cold streak at 2.5% of $50K trailing threshold.",
        validation_protocol:
          "Enforced at broker risk-server level + logged daily in public.trading_sessions.",
        is_mitigated: true,
      },
      {
        category: "known_known",
        impact: "operational",
        claim_statement:
          "09:35–10:45 EST NY Opening Drive setups with aligned CVD + Mag7 leader breadth yield 63.4% win rate at 1:2.1 asymmetric R.",
        validation_protocol:
          "Verified across 140 audited MNQ executions in Caliber Arc trade ledger.",
      },
      {
        category: "unknown_known",
        impact: "operational",
        claim_statement:
          "Circadian sleep-debt & HRV telemetry in Living OS already predicts 78% of impulsive afternoon over-trading sessions before market open.",
        validation_protocol:
          "Wire Circadian Readiness < 65% directly to automatic half-size MNQ contract cap prior to 09:30 bell.",
      },
      {
        category: "unknown_known",
        impact: "tactical",
        claim_statement:
          "10Y Treasury auction tail alerts inside Neural Vault macro notes reliably precede Nasdaq afternoon liquidity sweeps by 12–18 minutes.",
        validation_protocol:
          "Add automated 12:55 EST Treasury auction lock banner to trading terminal HUD.",
      },
      {
        category: "unknown_unknown",
        impact: "existential",
        claim_statement:
          "Rithmic / Tradovate API bridge desynchronization during surprise geopolitical headlines can leave follower accounts unflattened while master exits.",
        validation_protocol:
          "Deploy out-of-band server-side position heartbeat diff every 3 seconds with emergency 'Flatten All Accounts' panic webhook.",
      },
      {
        category: "unknown_unknown",
        impact: "operational",
        claim_statement:
          "Prop-firm payout rule amendments on micro-scalping duration (<15s holds) could retroactively disqualify volatile CPI fill clusters.",
        validation_protocol:
          "Enforce minimum 22-second structural swing hold filter & diversify capital across 2 independent clearing ecosystems + personal cash futures.",
      },
    ],
  },
  {
    entity_id: "rodriguez-dynasty-infrastructure",
    entity_type: "infrastructure",
    title: "Rodriguez Estate & Sovereign Fleet Infrastructure",
    summary:
      "Multi-decade physical resilience matrix spanning microgrid energy, water autonomy, senior canine sanctuary ergonomics, and commercial yard ops.",
    items: [
      {
        category: "known_known",
        impact: "operational",
        claim_statement:
          "Dual-inverter LFP solar storage array sizing (45 kWh) covers 72 hours of critical cold-storage, server rack, and HVAC sanctuary load.",
        validation_protocol:
          "Confirmed against summer peak kW draw telemetry and continuous сервер UPS load profile.",
        is_mitigated: true,
      },
      {
        category: "known_known",
        impact: "tactical",
        claim_statement:
          "Senior canine zero-step ramp grades (<7 degrees) and shaded hydro-cooling zones eliminate joint shear stress during summer peaks.",
        validation_protocol:
          "Measured against veterinary orthopedic mobility benchmarks in Senior Canine Longevity Protocol.",
      },
      {
        category: "unknown_known",
        impact: "operational",
        claim_statement:
          "Commercial service-trailer & heavy tow rig depreciation schedules create tax-advantaged cost-segregation synergies with industrial yard acquisition.",
        validation_protocol:
          "Run CPA cost-segregation model combining Section 179 fleet assets with industrial outdoor storage parcel.",
      },
      {
        category: "unknown_known",
        impact: "tactical",
        claim_statement:
          "Existing household batch-provisioning cold-chain vendors can deliver bulk organic canine & human proteins directly on bi-weekly commercial route.",
        validation_protocol:
          "Consolidate vendor SKU manifest inside Household Culinary & Provisioning SOP.",
      },
      {
        category: "unknown_unknown",
        impact: "existential",
        claim_statement:
          "Regional aquifer table drawdown or municipal water-rights re-adjudication over a 15-year horizon could restrict estate irrigation & well output.",
        validation_protocol:
          "Commission hydrogeological static-level log + 15,000-gallon buried potable cistern reserve before final site grading.",
      },
      {
        category: "unknown_unknown",
        impact: "operational",
        claim_statement:
          "Transformer lead-time bottlenecks (36+ weeks) could stall three-phase shop & EV/trailer fast-charging commissioning.",
        validation_protocol:
          "Pre-procure UL-listed pad-mount switchgear and lock utility interconnection engineering sign-off 9 months ahead of build.",
      },
    ],
  },
];

async function seedEpistemicIfEmpty(userId: string): Promise<void> {
  const countRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM public.epistemic_planning_matrices WHERE user_id = $1`,
    userId
  );
  if ((countRows[0]?.cnt ?? 0) > 0) return;

  for (const m of SEED_MATRICES) {
    const inserted = await pgQuery<{ id: string }>(
      `INSERT INTO public.epistemic_planning_matrices (user_id, entity_id, entity_type, title, summary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      userId,
      m.entity_id,
      m.entity_type,
      m.title,
      m.summary
    );
    const matrixId = inserted[0]?.id;
    if (!matrixId) continue;

    for (let idx = 0; idx < m.items.length; idx++) {
      const it = m.items[idx];
      await pgExec(
        `INSERT INTO public.epistemic_matrix_items
          (matrix_id, category, impact, claim_statement, validation_protocol, is_mitigated, sort_order)
         VALUES (
          $1::uuid,
          $2::public.epistemic_category,
          $3::public.epistemic_impact,
          $4,
          $5,
          $6,
          $7
         )`,
        matrixId,
        it.category,
        it.impact,
        it.claim_statement,
        it.validation_protocol,
        Boolean(it.is_mitigated),
        idx
      );
    }
  }
}

async function fetchEpistemicState(userId: string) {
  const matrices = await pgQuery<EpistemicMatrixRow>(
    `SELECT id, user_id, entity_id, entity_type, title, summary, created_at, updated_at
     FROM public.epistemic_planning_matrices
     WHERE user_id = $1
     ORDER BY updated_at DESC, created_at ASC`,
    userId
  );

  const items = await pgQuery<EpistemicItemRow>(
    `SELECT i.id, i.matrix_id, i.category::text AS category, i.impact::text AS impact,
            i.claim_statement, i.validation_protocol, i.is_mitigated, i.sort_order, i.created_at
     FROM public.epistemic_matrix_items i
     INNER JOIN public.epistemic_planning_matrices m ON m.id = i.matrix_id
     WHERE m.user_id = $1
     ORDER BY
       CASE i.impact
         WHEN 'existential' THEN 0
         WHEN 'operational' THEN 1
         ELSE 2
       END ASC,
       i.sort_order ASC,
       i.created_at DESC`,
    userId
  );

  return { matrices, items };
}

function runDeterministicHeuristicAudit(briefText: string): {
  auditSummary: string;
  items: ExtractedAuditItem[];
} {
  const clean = briefText.replace(/\s+/g, " ").trim();
  const sentences = briefText
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.replace(/^[-*#>\d.)\s]+/, "").trim())
    .filter((s) => s.length >= 24);

  // Extract domain keywords from the brief to anchor deterministic findings
  const keyTokens = Array.from(
    new Set(
      (
        clean.match(
          /\b(?:API|RLS|PostgreSQL|Supabase|Redis|Kafka|Stripe|OAuth|JWT|Webhook|AI|LLM|Gemini|MCP|Mobile|PWA|SLA|Latency|Margin|Drawdown|Fleet|Solar|Tenant|Enterprise|SOC2|Schema|Cache|Queue)\b/gi
        ) || []
      ).map((w) => w.toUpperCase())
    )
  ).slice(0, 6);

  const subjectHint =
    sentences[0]?.slice(0, 72) || "Submitted Architecture & Sprint Brief";
  const tokenBadge =
    keyTokens.length > 0 ? keyTokens.join(", ") : "Core System Stack";

  const knownCandidates = sentences.filter((s) =>
    /\b(\d+|must|will|uses|built|postgresql|supabase|next|api|target|latency|sla|verified|confirmed|deployed)\b/i.test(
      s
    )
  );
  const leverageCandidates = sentences.filter((s) =>
    /\b(existing|shared|reuse|telemetry|cache|automation|agent|template|historical|data|integration|pipeline)\b/i.test(
      s
    )
  );
  const hazardCandidates = sentences.filter((s) =>
    /\b(third-party|external|concurrent|scale|spike|migration|offline|timeout|rate|limit|security|compliance|fallback|risk|cost)\b/i.test(
      s
    )
  );

  const items: ExtractedAuditItem[] = [
    {
      category: "known_known",
      impact: "operational",
      claim_statement:
        knownCandidates[0] ||
        `Baseline specification establishes concrete scope around: "${subjectHint}".`,
      validation_protocol: `Lock acceptance criteria in automated CI integration tests covering [${tokenBadge}] before sprint kickoff.`,
    },
    {
      category: "known_known",
      impact: "tactical",
      claim_statement:
        knownCandidates[1] ||
        `Primary execution surface and state boundaries (${tokenBadge}) are explicitly declared in the architecture brief.`,
      validation_protocol:
        "Verify schema invariants and endpoint contract types via strict TypeScript + SQL migration assertions.",
    },
    {
      category: "unknown_known",
      impact: "operational",
      claim_statement:
        leverageCandidates[0]
          ? `Untapped internal leverage detected in brief: "${leverageCandidates[0]}" — can be productized across adjacent Living OS modules.`
          : `Existing Chairman Living OS telemetry, auth session context, and PostgreSQL helpers already solve ~35% of [${tokenBadge}] scaffolding.`,
      validation_protocol:
        "Audit shared @/lib utilities and Neural Vault SOPs to reuse battle-tested primitives instead of rebuilding from scratch.",
    },
    {
      category: "unknown_known",
      impact: "tactical",
      claim_statement:
        leverageCandidates[1]
          ? `Dormant compounding asset: "${leverageCandidates[1]}".`
          : `Operational audit logs generated by this workflow create high-signal training & KPI telemetry for executive scorecards.`,
      validation_protocol:
        "Expose structured event counters directly to Executive Vital Signs & Epistemic readiness telemetry.",
    },
    {
      category: "unknown_unknown",
      impact: "existential",
      claim_statement:
        hazardCandidates[0]
          ? `Emergent tail-risk vector around "${hazardCandidates[0]}" under 10x burst concurrency or upstream provider brownout.`
          : `Cascading retry storms or silent upstream timeout degradation across [${tokenBadge}] during peak load transitions.`,
      validation_protocol:
        "Enforce circuit-breaker timeouts, idempotency keys, and deterministic graceful degradation fallback with zero data loss.",
    },
    {
      category: "unknown_unknown",
      impact: "operational",
      claim_statement:
        hazardCandidates[1]
          ? `Latent boundary vulnerability: "${hazardCandidates[1]}" if external payloads drift or partial writes occur.`
          : `Schema drift, permission boundary edge-cases, or unindexed query plans emerging once production row volume scales 50x.`,
      validation_protocol:
        "Run EXPLAIN ANALYZE on critical joins, enforce strict runtime payload validation, and wire dead-letter alerting.",
    },
  ];

  return {
    auditSummary: `Deterministic Heuristic Epistemic Analyzer dissected ${sentences.length || 1} operational clauses (${tokenBadge}), extracting 2 Verified Realities, 2 Tacit Leverage Assets, and 2 Latent Tail-Risk Vectors.`,
    items,
  };
}

async function runAiEpistemicAudit(briefText: string): Promise<{
  engineUsed: "gemini" | "heuristic-fallback";
  auditSummary: string;
  items: ExtractedAuditItem[];
}> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    const fallback = runDeterministicHeuristicAudit(briefText);
    return { engineUsed: "heuristic-fallback", ...fallback };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.25,
      },
    });

    const prompt = `You are the Chairman's Chief Epistemic Risk & Leverage Officer.
Perform a rigorous Rumsfeldian Epistemic Audit on the following PRD, sprint plan, or strategic architecture brief.

Extract 6 to 9 high-signal epistemic items distributed across all three categories:
1. "known_known": Verified operational facts, concrete constraints, proven stack capabilities, or explicit measurable commitments in the brief.
2. "unknown_known": Tacit internal assets, underutilized capabilities, reusable data flywheels, or hidden moats implied by the brief that the Chairman already possesses but hasn't fully exploited.
3. "unknown_unknown": Latent vulnerabilities, emergent second-order failure modes, concurrency/latency/regulatory/vendor tail risks, or unstated assumptions that could blindside execution.

Return STRICT JSON matching this exact schema:
{
  "auditSummary": "2-sentence razor-sharp executive synthesis of epistemic posture and primary blindspot.",
  "items": [
    {
      "category": "known_known" | "unknown_known" | "unknown_unknown",
      "impact": "tactical" | "operational" | "existential",
      "claim_statement": "Crisp, specific operational claim or risk vector anchored to the brief.",
      "validation_protocol": "Concrete engineering, financial, or operational verification / mitigation protocol."
    }
  ]
}

BRIEF TO AUDIT:
"""
${briefText.slice(0, 12000)}
"""`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

    if (!Array.isArray(parsed?.items) || parsed.items.length === 0) {
      throw new Error("Empty items array from Gemini");
    }

    const normalized: ExtractedAuditItem[] = parsed.items
      .slice(0, 12)
      .map((it: any) => ({
        category: sanitizeCategory(String(it.category || "")),
        impact: sanitizeImpact(String(it.impact || "")),
        claim_statement: String(it.claim_statement || "").trim(),
        validation_protocol: String(
          it.validation_protocol ||
            "Define deterministic verification telemetry and sign-off gate."
        ).trim(),
      }))
      .filter((it: ExtractedAuditItem) => it.claim_statement.length > 5);

    if (normalized.length === 0) {
      throw new Error("No valid epistemic items parsed");
    }

    return {
      engineUsed: "gemini",
      auditSummary:
        String(parsed.auditSummary || "").trim() ||
        `Gemini Epistemic Gate extracted ${normalized.length} strategic claims and blindspot vectors.`,
      items: normalized,
    };
  } catch (err) {
    console.warn(
      "[API /epistemic] Gemini audit unavailable, engaging deterministic heuristic analyzer:",
      err
    );
    const fallback = runDeterministicHeuristicAudit(briefText);
    return { engineUsed: "heuristic-fallback", ...fallback };
  }
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await seedEpistemicIfEmpty(userId);
    const state = await fetchEpistemicState(userId);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error("[API /epistemic GET] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load Epistemic Planning Matrices",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "create_item");

    if (action === "create_matrix") {
      const title = String(body.title || "Untitled Strategic Matrix").trim();
      const entityType = String(body.entity_type || "project").trim();
      const entityId =
        String(body.entity_id || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-") ||
        `matrix-${Date.now().toString(36)}`;
      const summary = body.summary ? String(body.summary).trim() : null;

      const inserted = await pgQuery<EpistemicMatrixRow>(
        `INSERT INTO public.epistemic_planning_matrices (user_id, entity_id, entity_type, title, summary)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, entity_id, entity_type, title, summary, created_at, updated_at`,
        userId,
        entityId,
        entityType,
        title,
        summary
      );

      const state = await fetchEpistemicState(userId);
      return NextResponse.json(
        { matrix: inserted[0], ...state },
        { status: 201 }
      );
    }

    if (action === "ai_audit") {
      const briefText = String(body.briefText || "").trim();
      if (!briefText) {
        return NextResponse.json(
          { error: "briefText is required for AI Epistemic Audit" },
          { status: 400 }
        );
      }

      let targetMatrixId = body.matrixId ? String(body.matrixId) : "";

      if (!targetMatrixId || body.createNewMatrixTitle) {
        const newTitle = String(
          body.createNewMatrixTitle || "AI Audited Architecture Matrix"
        ).trim();
        const created = await pgQuery<{ id: string }>(
          `INSERT INTO public.epistemic_planning_matrices (user_id, entity_id, entity_type, title, summary)
           VALUES ($1, $2, 'audit', $3, $4)
           RETURNING id`,
          userId,
          `audit-${Date.now().toString(36)}`,
          newTitle,
          "Generated via Automated AI Epistemic Audit Gate"
        );
        targetMatrixId = created[0]?.id || "";
      }

      if (!targetMatrixId) {
        return NextResponse.json(
          { error: "Valid matrixId is required" },
          { status: 400 }
        );
      }

      const auditResult = await runAiEpistemicAudit(briefText);
      const insertedIds: string[] = [];

      for (let i = 0; i < auditResult.items.length; i++) {
        const item = auditResult.items[i];
        const rows = await pgQuery<{ id: string }>(
          `INSERT INTO public.epistemic_matrix_items
            (matrix_id, category, impact, claim_statement, validation_protocol, is_mitigated, sort_order)
           VALUES (
            $1::uuid,
            $2::public.epistemic_category,
            $3::public.epistemic_impact,
            $4,
            $5,
            FALSE,
            $6
           )
           RETURNING id`,
          targetMatrixId,
          item.category,
          item.impact,
          item.claim_statement,
          item.validation_protocol,
          i
        );
        if (rows[0]?.id) insertedIds.push(rows[0].id);
      }

      await pgExec(
        `UPDATE public.epistemic_planning_matrices
         SET updated_at = NOW(),
             summary = COALESCE($1, summary)
         WHERE id = $2::uuid AND user_id = $3`,
        auditResult.auditSummary,
        targetMatrixId,
        userId
      );

      const state = await fetchEpistemicState(userId);
      return NextResponse.json({
        engineUsed: auditResult.engineUsed,
        auditSummary: auditResult.auditSummary,
        insertedIds,
        matrixId: targetMatrixId,
        ...state,
      });
    }

    // Default: create_item
    const matrixId = String(body.matrix_id || body.matrixId || "");
    if (!matrixId) {
      return NextResponse.json(
        { error: "matrix_id is required" },
        { status: 400 }
      );
    }

    const category = sanitizeCategory(String(body.category || "known_known"));
    const impact = sanitizeImpact(String(body.impact || "operational"));
    const claimStatement = String(body.claim_statement || "").trim();
    const validationProtocol = body.validation_protocol
      ? String(body.validation_protocol).trim()
      : "Define empirical validation test & sign-off gate.";

    if (!claimStatement) {
      return NextResponse.json(
        { error: "claim_statement is required" },
        { status: 400 }
      );
    }

    const inserted = await pgQuery<EpistemicItemRow>(
      `INSERT INTO public.epistemic_matrix_items
        (matrix_id, category, impact, claim_statement, validation_protocol, is_mitigated, sort_order)
       VALUES (
        $1::uuid,
        $2::public.epistemic_category,
        $3::public.epistemic_impact,
        $4,
        $5,
        $6,
        0
       )
       RETURNING id, matrix_id, category::text AS category, impact::text AS impact,
                 claim_statement, validation_protocol, is_mitigated, sort_order, created_at`,
      matrixId,
      category,
      impact,
      claimStatement,
      validationProtocol,
      Boolean(body.is_mitigated)
    );

    await pgExec(
      `UPDATE public.epistemic_planning_matrices SET updated_at = NOW() WHERE id = $1::uuid AND user_id = $2`,
      matrixId,
      userId
    );

    const state = await fetchEpistemicState(userId);
    return NextResponse.json({ item: inserted[0], ...state }, { status: 201 });
  } catch (error: any) {
    console.error("[API /epistemic POST] Error:", error);
    return NextResponse.json(
      {
        error: "Failed epistemic mutation",
        detail: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    if (body.action === "promote_to_known_known" && body.itemId) {
      const existingRows = await pgQuery<{
        validation_protocol: string | null;
        matrix_id: string;
      }>(
        `SELECT i.validation_protocol, i.matrix_id
         FROM public.epistemic_matrix_items i
         INNER JOIN public.epistemic_planning_matrices m ON m.id = i.matrix_id
         WHERE i.id = $1::uuid AND m.user_id = $2`,
        body.itemId,
        userId
      );

      if (!existingRows[0]) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const stamp = new Date().toISOString().slice(0, 10);
      const customNote = body.resolutionNote
        ? String(body.resolutionNote).trim()
        : "";
      const prevProto = existingRows[0].validation_protocol || "";
      const updatedProtocol = customNote
        ? `${prevProto ? `${prevProto} — ` : ""}[MITIGATED & PROMOTED ${stamp}]: ${customNote}`
        : `${prevProto}${prevProto.includes("[MITIGATED") ? "" : ` [MITIGATED & VERIFIED ${stamp}]`}`.trim();

      await pgExec(
        `UPDATE public.epistemic_matrix_items
         SET category = 'known_known'::public.epistemic_category,
             is_mitigated = TRUE,
             validation_protocol = $1
         WHERE id = $2::uuid`,
        updatedProtocol,
        body.itemId
      );

      await pgExec(
        `UPDATE public.epistemic_planning_matrices SET updated_at = NOW() WHERE id = $1::uuid AND user_id = $2`,
        existingRows[0].matrix_id,
        userId
      );

      const state = await fetchEpistemicState(userId);
      return NextResponse.json({ promotedId: body.itemId, ...state });
    }

    if (body.action === "update_item" && body.itemId) {
      const rows = await pgQuery<EpistemicItemRow>(
        `SELECT i.id, i.matrix_id, i.category::text AS category, i.impact::text AS impact,
                i.claim_statement, i.validation_protocol, i.is_mitigated
         FROM public.epistemic_matrix_items i
         INNER JOIN public.epistemic_planning_matrices m ON m.id = i.matrix_id
         WHERE i.id = $1::uuid AND m.user_id = $2`,
        body.itemId,
        userId
      );
      const current = rows[0];
      if (!current) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const nextCat = body.category
        ? sanitizeCategory(String(body.category))
        : current.category;
      const nextImp = body.impact
        ? sanitizeImpact(String(body.impact))
        : current.impact;
      const nextClaim =
        body.claim_statement !== undefined
          ? String(body.claim_statement).trim()
          : current.claim_statement;
      const nextProto =
        body.validation_protocol !== undefined
          ? String(body.validation_protocol).trim()
          : current.validation_protocol;
      const nextMitigated =
        body.is_mitigated !== undefined
          ? Boolean(body.is_mitigated)
          : current.is_mitigated;

      await pgExec(
        `UPDATE public.epistemic_matrix_items
         SET category = $1::public.epistemic_category,
             impact = $2::public.epistemic_impact,
             claim_statement = $3,
             validation_protocol = $4,
             is_mitigated = $5
         WHERE id = $6::uuid`,
        nextCat,
        nextImp,
        nextClaim,
        nextProto,
        nextMitigated,
        body.itemId
      );

      const state = await fetchEpistemicState(userId);
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: "Unsupported PATCH action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API /epistemic PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update epistemic item", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const matrixId = searchParams.get("matrixId");

    if (itemId) {
      await pgExec(
        `DELETE FROM public.epistemic_matrix_items
         WHERE id = $1::uuid
           AND matrix_id IN (SELECT id FROM public.epistemic_planning_matrices WHERE user_id = $2)`,
        itemId,
        userId
      );
    } else if (matrixId) {
      await pgExec(
        `DELETE FROM public.epistemic_planning_matrices WHERE id = $1::uuid AND user_id = $2`,
        matrixId,
        userId
      );
    } else {
      return NextResponse.json(
        { error: "itemId or matrixId is required" },
        { status: 400 }
      );
    }

    const state = await fetchEpistemicState(userId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error: any) {
    console.error("[API /epistemic DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete epistemic record", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
