import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pgQuery, pgExec, getLivingOsUserId } from "@/lib/livingOsDb";

export type MindsetMode =
  | "recalibration"
  | "accountability_audit"
  | "panic_reset"
  | "pre_market_pep_talk";

const VALID_MODES = new Set<MindsetMode>([
  "recalibration",
  "accountability_audit",
  "panic_reset",
  "pre_market_pep_talk",
]);

export interface OperationalCounselContext {
  sleepAndHealth: {
    metricName: string;
    value: number;
    target: number;
    readinessPct: number;
    status: "OPTIMAL" | "MODERATE" | "DEPLETED";
  };
  nutrition: {
    consumedCalories: number;
    targetCalories: number;
    consumedProtein: number;
    targetProtein: number;
    waterOz: number;
  };
  trading: {
    accountName: string;
    dailyNetPnl: number;
    sessionLossCutoff: number;
    maxDrawdownLimit: number;
    circuitBreakerTripped: boolean;
    copierStatus: string;
  };
  workload: {
    pendingTasksCount: number;
    highPriorityCount: number;
    legacyPendingCount: number;
  };
  clock144: {
    denverTime: string;
    currentBlockIndex: number; // 1..10 (10 blocks x 144 min = 1440 min)
    minutesRemainingInBlock: number;
    entropyHardStopActive: boolean; // >= 19:00 local MDT
  };
}

async function fetchOperationalContext(
  userId: string
): Promise<OperationalCounselContext> {
  // 1. Scorecard Health / Sleep baseline
  const scoreRows = await pgQuery<{
    metricName: string;
    value: number;
    target: number;
    category: string;
  }>(
    `SELECT "metricName", value, target, category
     FROM public."Scorecard"
     WHERE category ILIKE '%health%' OR "metricName" ILIKE '%sleep%' OR "metricName" ILIKE '%hrv%' OR "metricName" ILIKE '%recovery%'
     ORDER BY date DESC
     LIMIT 3`
  ).catch(() => []);

  const primaryHealth = scoreRows[0] || {
    metricName: "Sleep & Recovery Baseline",
    value: 7.6,
    target: 8.0,
    category: "Health",
  };
  const readinessPct = Math.min(
    100,
    Math.max(
      15,
      Math.round(
        ((Number(primaryHealth.value) || 7.5) /
          Math.max(1, Number(primaryHealth.target) || 8)) *
          100
      )
    )
  );

  // 2. Nutrition Daily Log
  const macroRows = await pgQuery<{
    consumed_calories: number;
    target_calories: number;
    consumed_protein: number;
    target_protein: number;
    total_water_fl_oz: number;
  }>(
    `SELECT consumed_calories, target_calories, consumed_protein, target_protein, total_water_fl_oz
     FROM public.nutrition_daily_logs
     WHERE user_id = $1
     ORDER BY date DESC
     LIMIT 1`,
    userId
  ).catch(() => []);

  const macro = macroRows[0] || {
    consumed_calories: 0,
    target_calories: 1750,
    consumed_protein: 0,
    target_protein: 180,
    total_water_fl_oz: 0,
  };

  // 3. Trading Session / Circuit Breaker
  const tradeRows = await pgQuery<{
    account_name: string;
    daily_net_pnl: number;
    session_loss_cutoff: number;
    max_drawdown_limit: number;
    circuit_breaker_tripped: boolean;
    copier_status: string;
  }>(
    `SELECT account_name, daily_net_pnl, session_loss_cutoff, max_drawdown_limit,
            circuit_breaker_tripped, copier_status
     FROM public.trading_sessions
     ORDER BY session_date DESC, created_at DESC
     LIMIT 1`
  ).catch(() => []);

  const trade = tradeRows[0] || {
    account_name: "Apex 50K Master (20x Pod)",
    daily_net_pnl: 0,
    session_loss_cutoff: 250,
    max_drawdown_limit: 2000,
    circuit_breaker_tripped: false,
    copier_status: "Replikanto Synced",
  };

  // 4. Pending Tasks across Sovereign PMS + Core Task table
  const [pmsCounts, coreTaskCounts] = await Promise.all([
    pgQuery<{ pending_count: number; high_count: number }>(
      `SELECT COUNT(*)::int AS pending_count,
              COUNT(*) FILTER (WHERE priority IN ('urgent', 'high'))::int AS high_count
       FROM public.pms_tasks
       WHERE is_closed = FALSE`
    ).catch(() => [{ pending_count: 0, high_count: 0 }]),
    pgQuery<{ cnt: number }>(
      `SELECT COUNT(*)::int AS cnt FROM public."Task" WHERE status NOT IN ('DONE', 'Complete', 'Done')`
    ).catch(() => [{ cnt: 0 }]),
  ]);

  // 5. 144 Logic Clock (1,440 minutes/day = ten 144-minute blocks; 19:00 MDT entropy cutoff)
  const now = new Date();
  const denverParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour24 = Number(
    denverParts.find((p) => p.type === "hour")?.value ?? now.getHours()
  ) % 24;
  const minute = Number(
    denverParts.find((p) => p.type === "minute")?.value ?? now.getMinutes()
  );
  const elapsedMinutesToday = hour24 * 60 + minute;
  const currentBlockIndex = Math.min(10, Math.floor(elapsedMinutesToday / 144) + 1);
  const minutesRemainingInBlock = 144 - (elapsedMinutesToday % 144);

  return {
    sleepAndHealth: {
      metricName: primaryHealth.metricName,
      value: Number(primaryHealth.value) || 7.6,
      target: Number(primaryHealth.target) || 8.0,
      readinessPct,
      status:
        readinessPct >= 85
          ? "OPTIMAL"
          : readinessPct >= 65
          ? "MODERATE"
          : "DEPLETED",
    },
    nutrition: {
      consumedCalories: Number(macro.consumed_calories) || 0,
      targetCalories: Number(macro.target_calories) || 1750,
      consumedProtein: Number(macro.consumed_protein) || 0,
      targetProtein: Number(macro.target_protein) || 180,
      waterOz: Number(macro.total_water_fl_oz) || 0,
    },
    trading: {
      accountName: trade.account_name || "Apex 50K Master",
      dailyNetPnl: Number(trade.daily_net_pnl) || 0,
      sessionLossCutoff: Number(trade.session_loss_cutoff) || 250,
      maxDrawdownLimit: Number(trade.max_drawdown_limit) || 2000,
      circuitBreakerTripped: Boolean(trade.circuit_breaker_tripped),
      copierStatus: trade.copier_status || "Replikanto Synced",
    },
    workload: {
      pendingTasksCount:
        (Number(pmsCounts[0]?.pending_count) || 0) +
        (Number(coreTaskCounts[0]?.cnt) || 0),
      highPriorityCount: Number(pmsCounts[0]?.high_count) || 0,
      legacyPendingCount: Number(coreTaskCounts[0]?.cnt) || 0,
    },
    clock144: {
      denverTime: now.toLocaleTimeString("en-US", {
        timeZone: "America/Denver",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      currentBlockIndex,
      minutesRemainingInBlock,
      entropyHardStopActive: hour24 >= 19,
    },
  };
}

function diagnoseFrictionAndFramework(
  mode: MindsetMode,
  userMessage: string,
  protocolCard?: string,
  ctx?: OperationalCounselContext
): { friction: string; framework: string } {
  if (protocolCard) {
    return {
      friction: `Protocol Triggered: ${protocolCard}`,
      framework: `144 Logic · ${protocolCard}`,
    };
  }
  const lower = userMessage.toLowerCase();
  if (
    ctx?.trading.circuitBreakerTripped ||
    /drawdown|revenge|tilt|loss|mnq|nq|stop out|fomo/i.test(lower)
  ) {
    return {
      friction: "Dopaminergic Tilt / Sunk-Cost Recovery Impulse",
      framework: "144 Logic · Neutralize Sunk-Cost & $250 Hard Circuit Lock",
    };
  }
  if (/overwhelm|stuck|paralyz|too many|scattered|procrastinat/i.test(lower)) {
    return {
      friction: "Prefrontal Queue Saturation (Paralysis by Analysis)",
      framework: "144 Logic · Single-Node Binary Decomposition",
    };
  }
  if (
    ctx?.clock144.entropyHardStopActive ||
    /tired|exhausted|burnout|late|night|sleep/i.test(lower)
  ) {
    return {
      friction: "Circadian Depletion / Late-Day Decision Entropy",
      framework: "144 Logic · 19:00 Entropy Hard-Stop Protocol",
    };
  }
  switch (mode) {
    case "accountability_audit":
      return {
        friction: "Execution Drift Between Stated Standard & Output",
        framework: "144 Logic · Zero-Excuse Gap Audit",
      };
    case "panic_reset":
      return {
        friction: "Acute Sympathetic Spike / Amygdala Hijack",
        framework: "144 Logic · Physiological Sigh + 15-Minute Horizon Lock",
      };
    case "pre_market_pep_talk":
      return {
        friction: "Pre-Session Anticipatory Variance",
        framework: "144 Logic · Caliber Arc A+ Execution Oath",
      };
    default:
      return {
        friction: "Cognitive Noise / Context-Switching Drag",
        framework: "144 Logic · Sovereign Block Recalibration",
      };
  }
}

function generate144FallbackCounsel(
  mode: MindsetMode,
  userMessage: string,
  ctx: OperationalCounselContext,
  diagnosis: { friction: string; framework: string }
): string {
  const bioLine = `Biometric & Ops Telemetry Readout: Readiness **${ctx.sleepAndHealth.readinessPct}%** (${ctx.sleepAndHealth.value}/${ctx.sleepAndHealth.target} ${ctx.sleepAndHealth.metricName}) · Fuel **${ctx.nutrition.consumedCalories}/${ctx.nutrition.targetCalories} kcal** (${ctx.nutrition.consumedProtein}g protein) · Backlog **${ctx.workload.pendingTasksCount} open tasks** (${ctx.workload.highPriorityCount} urgent/high) · Block **#${ctx.clock144.currentBlockIndex}/10** (${ctx.clock144.minutesRemainingInBlock}m remaining).`;

  if (mode === "panic_reset") {
    return [
      `### COMMANDER INTERCEPT — LEDGE / PANIC RESET`,
      bioLine,
      ``,
      `**1. Immediate Physiological Override (Next 60 Seconds)**`,
      `Hands off the keyboard and order entry. Execute **3 Double-Inhale Physiological Sighs** right now (deep nasal inhale, sharp top-off inhale, slow 8-second mouth exhale). Your sympathetic nervous system is spiking; we do not negotiate with adrenaline.`,
      ``,
      `**2. First-Principles Reality Check (${diagnosis.framework})**`,
      `• **Diagnosed Friction:** ${diagnosis.friction}`,
      `• **Trading Guardrail:** ${
        ctx.trading.circuitBreakerTripped
          ? `CIRCUIT BREAKER IS TRIPPED (${ctx.trading.dailyNetPnl.toFixed(
              2
            )}). Terminal lock stays ON. Zero exceptions.`
          : `Net PnL is $${ctx.trading.dailyNetPnl.toFixed(
              2
            )} against -$${ctx.trading.sessionLossCutoff} cutoff. Protect capital first.`
      }`,
      `• Nothing catastrophic happens if you pause for 15 minutes. Catastrophe only happens when you act from panic to erase discomfort.`,
      ``,
      `**3. Sovereign Next-15-Minute Directive**`,
      `1. Drink 16 oz of water right now (logged hydration today: ${ctx.nutrition.waterOz} oz).`,
      `2. Close every tab except ONE single physical artifact.`,
      `3. Reply with the **single 15-minute physical action** you are executing next.`,
    ].join("\n");
  }

  if (mode === "accountability_audit") {
    return [
      `### COMMANDER'S BRUTAL ACCOUNTABILITY AUDIT`,
      bioLine,
      ``,
      `**1. Unfiltered Mirror**`,
      `You stated: *"${userMessage.slice(0, 180)}"*`,
      `Let's strip the narrative. You currently carry **${ctx.workload.pendingTasksCount} open tasks** (${ctx.workload.highPriorityCount} high/urgent) and have **${ctx.clock144.minutesRemainingInBlock} minutes** left in Block #${ctx.clock144.currentBlockIndex} of your 10 daily 144-minute blocks.`,
      ``,
      `**2. 144 Logic Gap Diagnosis (${diagnosis.framework})**`,
      `• **Friction Point:** ${diagnosis.friction}`,
      `• Complexity is frequently used as polite camouflage for avoidance. Every minute spent reorganizing or ruminating is a minute stolen from shipping.`,
      `${
        ctx.nutrition.consumedProtein < 60
          ? `• **Metabolic Flag:** Only ${ctx.nutrition.consumedProtein}g/${ctx.nutrition.targetProtein}g protein logged today — under-fueling amplifies executive resistance. Correct fuel immediately after this sprint.`
          : `• **Metabolic Check:** ${ctx.nutrition.consumedProtein}g protein on board — biology is capable; the bottleneck is purely decision commitment.`
      }`,
      ``,
      `**3. Non-Negotiable Execution Contract**`,
      `• Kill every secondary side-quest for the next **${Math.min(
        ctx.clock144.minutesRemainingInBlock,
        90
      )} minutes**.`,
      `• Pick the **#1 highest-leverage deliverable** you have been hesitating on and ship a verifiable increment before Block #${ctx.clock144.currentBlockIndex} closes.`,
    ].join("\n");
  }

  if (mode === "pre_market_pep_talk") {
    return [
      `### PRE-MARKET CALIBER ARC LOCK-IN`,
      bioLine,
      ``,
      `**1. Sovereign Operator Readiness**`,
      `• **Account Pod:** ${ctx.trading.accountName} (${ctx.trading.copierStatus})`,
      `• **Hard Session Loss Cutoff:** -$${ctx.trading.sessionLossCutoff} | **Max Trail Drawdown:** $${ctx.trading.maxDrawdownLimit}`,
      `• **Circuit Breaker State:** ${
        ctx.trading.circuitBreakerTripped
          ? "TRIPPED — DO NOT UNLOCK TODAY"
          : "ARMED & GREEN"
      }`,
      ``,
      `**2. The 144 Logic Execution Oath**`,
      `• You are not paid per click; you are paid to execute **only A+ asymmetric structure** when NYSE \`$ADD\`, Cumulative Volume Delta (\`CVD\`), and Mag-7 Leader alignment converge.`,
      `• Yesterday's PnL is dead data. Zero FOMO on the 09:30 open whipsaw. Let trapped retail liquidity reveal the true sweep first.`,
      `• If session net hits **-$${ctx.trading.sessionLossCutoff}**, Replikanto flattens all 20 accounts and you walk away with honor intact.`,
      ``,
      `**3. Lock-In Command**`,
      `Confirm your exact A+ invalidation level before placing a single bracket order. Calm, surgical, detached.`,
    ].join("\n");
  }

  // Default: recalibration
  return [
    `### 144 LOGIC COGNITIVE RECALIBRATION`,
    bioLine,
    ``,
    `**1. First-Principles Signal Extraction**`,
    `• **Diagnosed Friction:** ${diagnosis.friction}`,
    `• **Framework Engaged:** ${diagnosis.framework}`,
    `${
      ctx.clock144.entropyHardStopActive
        ? `• **19:00 ENTROPY HARD-STOP ACTIVE (${ctx.clock144.denverTime} MDT):** No high-stakes financial, architectural, or emotional negotiations after 19:00. Downshift into recovery, Neural Vault capture, and tomorrow's Block #1 prep.`
        : `• You are in **144-Minute Block #${ctx.clock144.currentBlockIndex} of 10** (${ctx.clock144.minutesRemainingInBlock}m remaining). Treat past blocks today as sunk cost — zero emotional carry-over.`
    }`,
    ``,
    `**2. Binary Decomposition**`,
    `Separate what is within direct motor control in the next 30 minutes from speculative noise:`,
    `1. **Eliminate:** Close low-leverage loops competing for working memory.`,
    `2. **Anchor:** Lock onto 1 concrete outcome from your ${ctx.workload.pendingTasksCount} pending tasks.`,
    `3. **Biological Floor:** Verify water (${ctx.nutrition.waterOz} oz logged) and protein (${ctx.nutrition.consumedProtein}/${ctx.nutrition.targetProtein}g) stay on schedule.`,
    ``,
    `**Commander's Directive:** State the ONE binary deliverable that makes this 144-minute block an undeniable win.`,
  ].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const { searchParams } = new URL(req.url);
    const requestedSessionId = searchParams.get("sessionId");

    const [context, sessions] = await Promise.all([
      fetchOperationalContext(userId),
      pgQuery<{
        id: string;
        user_id: string;
        session_mode: MindsetMode;
        initial_user_state: string;
        diagnosed_friction_point: string | null;
        framework_applied: string | null;
        resolution_status: string;
        created_at: string;
      }>(
        `SELECT id, user_id, session_mode, initial_user_state, diagnosed_friction_point,
                framework_applied, resolution_status, created_at
         FROM public.mindset_sessions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        userId
      ),
    ]);

    const activeSessionId = requestedSessionId || sessions[0]?.id || null;
    const messages = activeSessionId
      ? await pgQuery<{
          id: string;
          session_id: string;
          sender_role: string;
          content: string;
          created_at: string;
        }>(
          `SELECT id, session_id, sender_role, content, created_at
           FROM public.mindset_messages
           WHERE session_id = $1::uuid
           ORDER BY created_at ASC`,
          activeSessionId
        )
      : [];

    return NextResponse.json({
      context,
      sessions,
      activeSessionId,
      messages,
      aiConfigured: Boolean(
        process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ),
    });
  } catch (error: any) {
    console.error("[GET /api/mindset] Error:", error);
    return NextResponse.json(
      { error: "Failed to load Commander's Counsel", detail: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    if (body.action === "update_status" && body.sessionId) {
      const status = String(body.resolutionStatus || "calibrated").slice(0, 32);
      const updated = await pgQuery(
        `UPDATE public.mindset_sessions
         SET resolution_status = $1
         WHERE id = $2::uuid AND user_id = $3
         RETURNING *`,
        status,
        String(body.sessionId),
        userId
      );
      return NextResponse.json({ ok: true, session: updated[0] });
    }

    const rawMode = String(body.sessionMode || "recalibration") as MindsetMode;
    const sessionMode: MindsetMode = VALID_MODES.has(rawMode)
      ? rawMode
      : "recalibration";
    const message = String(body.message || "").trim();
    const protocolCard = body.protocolCard
      ? String(body.protocolCard).trim()
      : undefined;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const context = await fetchOperationalContext(userId);
    const diagnosis = diagnoseFrictionAndFramework(
      sessionMode,
      message,
      protocolCard,
      context
    );

    let sessionId = body.sessionId ? String(body.sessionId) : "";
    if (sessionId) {
      const found = await pgQuery<{ id: string }>(
        `SELECT id FROM public.mindset_sessions WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
        sessionId,
        userId
      ).catch(() => []);
      if (found.length === 0) sessionId = "";
    }

    if (!sessionId) {
      const created = await pgQuery<{ id: string }>(
        `INSERT INTO public.mindset_sessions
          (user_id, session_mode, initial_user_state, diagnosed_friction_point, framework_applied, resolution_status)
         VALUES ($1, $2::public.mindset_session_mode, $3, $4, $5, 'in_counsel')
         RETURNING id`,
        userId,
        sessionMode,
        message.slice(0, 500),
        diagnosis.friction,
        diagnosis.framework
      );
      sessionId = created[0].id;
    } else {
      await pgExec(
        `UPDATE public.mindset_sessions
         SET diagnosed_friction_point = $1,
             framework_applied = $2
         WHERE id = $3::uuid`,
        diagnosis.friction,
        diagnosis.framework,
        sessionId
      );
    }

    // Insert user message
    await pgExec(
      `INSERT INTO public.mindset_messages (session_id, sender_role, content)
       VALUES ($1::uuid, 'user', $2)`,
      sessionId,
      message
    );

    // Load recent conversation history in this session
    const history = await pgQuery<{ sender_role: string; content: string }>(
      `SELECT sender_role, content
       FROM public.mindset_messages
       WHERE session_id = $1::uuid
       ORDER BY created_at ASC
       LIMIT 16`,
      sessionId
    );

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let commanderReply = "";

    const modeDirectives: Record<MindsetMode, string> = {
      recalibration:
        "MODE: COGNITIVE RECALIBRATION. Strip away fog, overwhelm, and multi-threading noise. Diagnose whether friction is biological or cognitive, re-anchor on the current 144-minute block, and give 1 concrete binary objective.",
      accountability_audit:
        "MODE: BRUTAL ACCOUNTABILITY AUDIT. Zero flattery, zero coddling. Contrast the Chairman's stated empire standards against current pending backlog and habits. Expose disguised procrastination and demand immediate verifiable shipping.",
      panic_reset:
        "MODE: LEDGE / PANIC RESET. Acute sympathetic down-regulation. Command immediate physiological sigh breathing, freeze all impulsive financial/trading/communication actions, neutralize sunk-cost panic, and shrink time horizon to the next 15 minutes.",
      pre_market_pep_talk:
        "MODE: PRE-MARKET CALIBER ARC LOCK-IN. Prepare the Chairman for futures execution (MNQ/NQ across 20 prop accounts via Replikanto). Enforce the -$250 session loss circuit breaker, patience for A+ $ADD/CVD/Leader confluence, and complete detachment from outcome.",
    };

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const prompt = `You are "The Commander's Counsel" — the Chairman's sovereign psychological calibration engine built on **The 144 Logic Framework**:
- 1,440 minutes per day = Ten 144-minute sovereign blocks. Past blocks are sunk cost; protect the active block ruthlessly.
- 19:00 MDT Entropy Hard-Stop: Never make high-stakes emotional, architectural, or trading commitments after 19:00 when prefrontal glycogen is depleted.
- Biological-First Diagnosis: Check sleep readiness, hydration, and protein before blaming willpower.
- Zero Sunk-Cost / Zero Revenge Trading: Respect the -$250 session circuit breaker as sacred law.
- Voice & Tone: Direct, commanding, empathetic-yet-unyielding, surgical first-principles clarity. Use concise markdown headings and bullet points.

${modeDirectives[sessionMode]}
${protocolCard ? `ACTIVE 144 LOGIC PROTOCOL CARD: ${protocolCard}` : ""}

=== LIVE POSTGRESQL BIOMETRIC & OPERATIONAL INGRESS ===
- Mountain Time: ${context.clock144.denverTime} (144-Block #${context.clock144.currentBlockIndex}/10, ${context.clock144.minutesRemainingInBlock}m left | 19:00 Entropy Hard-Stop: ${context.clock144.entropyHardStopActive ? "ACTIVE" : "INACTIVE"})
- Sleep/Health Baseline: ${context.sleepAndHealth.metricName}: ${context.sleepAndHealth.value}/${context.sleepAndHealth.target} (${context.sleepAndHealth.readinessPct}% · ${context.sleepAndHealth.status})
- MacroOps Fuel Today: ${context.nutrition.consumedCalories}/${context.nutrition.targetCalories} kcal | ${context.nutrition.consumedProtein}/${context.nutrition.targetProtein}g protein | ${context.nutrition.waterOz} oz water
- Caliber Arc Trading: ${context.trading.accountName} | Net PnL: $${context.trading.dailyNetPnl} | Loss Cutoff: -$${context.trading.sessionLossCutoff} | Circuit Breaker: ${context.trading.circuitBreakerTripped ? "TRIPPED" : "ARMED"} (${context.trading.copierStatus})
- Task Load: ${context.workload.pendingTasksCount} pending tasks (${context.workload.highPriorityCount} urgent/high priority)
- Diagnosed Friction: ${diagnosis.friction}
=======================================================

SESSION TRANSCRIPT:
${history
  .map((m) => `${m.sender_role.toUpperCase()}: ${m.content}`)
  .join("\n\n")}

Deliver the Commander's Counsel now:`;

        for (const modelName of ["gemini-2.5-flash", "gemini-2.0-flash"]) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const res = await model.generateContent(prompt);
            const text = res?.response?.text?.() || "";
            if (text.trim()) {
              commanderReply = text.trim();
              break;
            }
          } catch (innerErr) {
            console.warn(`[Mindset] ${modelName} failed:`, innerErr);
          }
        }
      } catch (err) {
        console.error("[POST /api/mindset] Gemini error, using 144 fallback:", err);
      }
    }

    if (!commanderReply) {
      commanderReply = generate144FallbackCounsel(
        sessionMode,
        message,
        context,
        diagnosis
      );
    }

    // Persist Commander message & mark session calibrated
    await pgExec(
      `INSERT INTO public.mindset_messages (session_id, sender_role, content)
       VALUES ($1::uuid, 'commander', $2)`,
      sessionId,
      commanderReply
    );

    const updatedSessions = await pgQuery(
      `UPDATE public.mindset_sessions
       SET resolution_status = 'calibrated'
       WHERE id = $1::uuid
       RETURNING *`,
      sessionId
    );

    const updatedMessages = await pgQuery(
      `SELECT id, session_id, sender_role, content, created_at
       FROM public.mindset_messages
       WHERE session_id = $1::uuid
       ORDER BY created_at ASC`,
      sessionId
    );

    return NextResponse.json({
      session: updatedSessions[0],
      messages: updatedMessages,
      reply: commanderReply,
      context,
    });
  } catch (error: any) {
    console.error("[POST /api/mindset] Error:", error);
    return NextResponse.json(
      { error: "Failed to process Commander Counsel", detail: error?.message },
      { status: 500 }
    );
  }
}
