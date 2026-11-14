import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pgQuery, pgExec, getLivingOsUserId } from "@/lib/livingOsDb";

export interface ToolExecutionRecord {
  id: string;
  conversation_id: string;
  tool_name: string;
  tool_arguments: Record<string, any>;
  tool_result: Record<string, any>;
  execution_duration_ms: number;
  status: string;
  executed_at: string;
}

const SOVEREIGN_TOOL_DECLARATIONS = [
  {
    name: "create_pms_task",
    description:
      "Creates a task directly inside the Chairman's Sovereign PMS PostgreSQL table (public.pms_tasks).",
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description: "Actionable title of the PMS task",
        },
        priority: {
          type: "STRING",
          description: "Task priority: urgent, high, normal, or low",
        },
        status_category: {
          type: "STRING",
          description:
            "Status category enum: open, unstarted, active, review, blocked, or closed",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "log_nutrition_meal",
    description:
      "Logs a meal and updates daily macro consumption in public.nutrition_meals and public.nutrition_daily_logs.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description: "Meal description (e.g., Ribeye Steak & Eggs, Post-Lift Whey)",
        },
        calories: {
          type: "NUMBER",
          description: "Total kilocalories (kcal)",
        },
        protein_g: {
          type: "NUMBER",
          description: "Grams of protein",
        },
        carbs_g: {
          type: "NUMBER",
          description: "Grams of carbohydrates",
        },
        fats_g: {
          type: "NUMBER",
          description: "Grams of dietary fat",
        },
        weight_g: {
          type: "NUMBER",
          description: "Total meal food weight in grams",
        },
      },
      required: ["name", "calories", "protein_g", "carbs_g", "fats_g", "weight_g"],
    },
  },
  {
    name: "create_circadian_block",
    description:
      "Creates a time-blocked event on the 24-Hour Circadian Solar Arc Calendar (public.circadian_events).",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "Title of the circadian block",
        },
        domain: {
          type: "STRING",
          description:
            "Event domain: engineering, physical_training, nutrition, family_pets, or logistics",
        },
        start_hhmm: {
          type: "STRING",
          description: "24-hour start time in HH:MM format (e.g. 09:30 or 14:00)",
        },
        end_hhmm: {
          type: "STRING",
          description: "24-hour end time in HH:MM format (e.g. 11:00 or 15:30)",
        },
      },
      required: ["title", "domain", "start_hhmm", "end_hhmm"],
    },
  },
  {
    name: "log_entity_telemetry",
    description:
      "Logs hydration, nutrition grams, or medication telemetry for a household or canine pack member in public.entity_telemetry_logs.",
    parameters: {
      type: "OBJECT",
      properties: {
        entity_name: {
          type: "STRING",
          description: "Name of the household human or canine entity (e.g. Koda, Balto, Chairman)",
        },
        water_oz: {
          type: "NUMBER",
          description: "Water consumed in fluid ounces",
        },
        food_grams: {
          type: "NUMBER",
          description: "Food consumed in grams",
        },
        medication_administered: {
          type: "BOOLEAN",
          description: "Whether scheduled medication/supplement was administered",
        },
      },
      required: ["entity_name"],
    },
  },
  {
    name: "search_neural_vault",
    description:
      "Searches the Chairman's Obsidian-style Neural Vault knowledge graph (public.vault_nodes) by keyword or tag.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Search phrase, topic, or tag to query in public.vault_nodes",
        },
      },
      required: ["query"],
    },
  },
];

const VALID_PMS_CATEGORIES = new Set([
  "open",
  "unstarted",
  "active",
  "review",
  "blocked",
  "closed",
]);

const VALID_CIRCADIAN_DOMAINS: Record<
  string,
  { domain: string; mediaUrl: string; accentColor: string }
> = {
  engineering: {
    domain: "engineering",
    mediaUrl: "",
    accentColor: "#3b82f6",
  },
  physical_training: {
    domain: "physical_training",
    mediaUrl: "",
    accentColor: "#ef4444",
  },
  nutrition: {
    domain: "nutrition",
    mediaUrl: "",
    accentColor: "#10b981",
  },
  family_pets: {
    domain: "family_pets",
    mediaUrl: "",
    accentColor: "#f59e0b",
  },
  logistics: {
    domain: "logistics",
    mediaUrl: "",
    accentColor: "#8b5cf6",
  },
};

function parseHhmmToTodayIso(hhmm: string, fallbackHour: number): Date {
  const now = new Date();
  const match = String(hhmm || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  const hours = match ? Math.min(23, Math.max(0, Number(match[1]))) : fallbackHour;
  const mins = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  const d = new Date(now);
  d.setHours(hours, mins, 0, 0);
  return d;
}

async function executeSovereignTool(
  userId: string,
  conversationId: string,
  toolName: string,
  rawArgs: Record<string, any>
): Promise<ToolExecutionRecord> {
  const args = rawArgs || {};
  let resultPayload: Record<string, any> = {};
  let status = "success";
  let sqlElapsedMs = 1;

  try {
    if (toolName === "create_pms_task") {
      const name = String(args.name || "Untitled Sovereign Task").slice(0, 250);
      const priority = ["urgent", "high", "normal", "low"].includes(
        String(args.priority || "").toLowerCase()
      )
        ? String(args.priority).toLowerCase()
        : "high";
      const rawCat = String(args.status_category || "unstarted").toLowerCase();
      const statusCategory = VALID_PMS_CATEGORIES.has(rawCat)
        ? rawCat
        : "unstarted";
      const statusLabel =
        statusCategory === "active"
          ? "in progress"
          : statusCategory === "closed"
          ? "complete"
          : statusCategory === "review"
          ? "review"
          : "to do";

      const t0 = performance.now();
      let lists = await pgQuery<{ id: string }>(
        `SELECT id FROM public.pms_lists WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
        userId
      );
      if (lists.length === 0) {
        lists = await pgQuery<{ id: string }>(
          `INSERT INTO public.pms_lists (user_id, name, space_name)
           VALUES ($1, 'Sovereign Copilot Dispatch', 'Executive Operations')
           RETURNING id`,
          userId
        );
      }
      const listId = lists[0].id;

      const inserted = await pgQuery<{
        id: string;
        name: string;
        priority: string;
        status_category: string;
      }>(
        `INSERT INTO public.pms_tasks
          (user_id, list_id, name, status, status_category, priority, is_closed)
         VALUES ($1, $2::uuid, $3, $4, $5::public.pms_status_category, $6, $7)
         RETURNING id, name, priority, status_category`,
        userId,
        listId,
        name,
        statusLabel,
        statusCategory,
        priority,
        statusCategory === "closed"
      );
      sqlElapsedMs = Math.max(1, Math.round(performance.now() - t0));

      resultPayload = {
        task: inserted[0],
        table: "public.pms_tasks",
        message: `Task "${name}" committed (${priority.toUpperCase()} · ${statusCategory}).`,
      };
    } else if (toolName === "log_nutrition_meal") {
      const name = String(args.name || "Logged Meal").slice(0, 95);
      const calories = Math.max(0, Math.round(Number(args.calories) || 450));
      const protein_g = Math.max(0, Number(args.protein_g) || 40);
      const carbs_g = Math.max(0, Number(args.carbs_g) || 25);
      const fats_g = Math.max(0, Number(args.fats_g) || 16);
      const weight_g = Math.max(1, Number(args.weight_g) || 320);

      const t0 = performance.now();
      const dailyRows = await pgQuery<{ id: string }>(
        `INSERT INTO public.nutrition_daily_logs (user_id, date)
         VALUES ($1, CURRENT_DATE)
         ON CONFLICT (user_id, date) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id`,
        userId
      );
      const dailyLogId = dailyRows[0].id;

      const mealRows = await pgQuery<{ id: string; logged_at: string }>(
        `INSERT INTO public.nutrition_meals
          (daily_log_id, name, meal_slot, calories, protein_g, carbs_g, fats_g, weight_g)
         VALUES ($1::uuid, $2, 'Copilot Ingress', $3, $4, $5, $6, $7)
         RETURNING id, logged_at`,
        dailyLogId,
        name,
        calories,
        protein_g,
        carbs_g,
        fats_g,
        weight_g
      );

      const updatedDaily = await pgQuery<{
        consumed_calories: number;
        target_calories: number;
        consumed_protein: number;
        target_protein: number;
      }>(
        `UPDATE public.nutrition_daily_logs
         SET consumed_calories = COALESCE(consumed_calories, 0) + $2,
             consumed_protein = COALESCE(consumed_protein, 0) + $3,
             consumed_carbs = COALESCE(consumed_carbs, 0) + $4,
             consumed_fats = COALESCE(consumed_fats, 0) + $5,
             total_weight_consumed_lbs = COALESCE(total_weight_consumed_lbs, 0) + ROUND(($6::numeric / 453.592), 2)
         WHERE id = $1::uuid
         RETURNING consumed_calories, target_calories, consumed_protein, target_protein`,
        dailyLogId,
        calories,
        Math.round(protein_g),
        Math.round(carbs_g),
        Math.round(fats_g),
        weight_g
      );
      sqlElapsedMs = Math.max(1, Math.round(performance.now() - t0));

      resultPayload = {
        mealId: mealRows[0]?.id,
        name,
        calories,
        protein_g,
        carbs_g,
        fats_g,
        weight_g,
        dailyTotals: updatedDaily[0],
        table: "public.nutrition_meals",
      };
    } else if (toolName === "create_circadian_block") {
      const title = String(args.title || "Sovereign Focus Block").slice(0, 118);
      const rawDomain = String(args.domain || "engineering").toLowerCase();
      const domainSpec =
        VALID_CIRCADIAN_DOMAINS[rawDomain] ||
        VALID_CIRCADIAN_DOMAINS.engineering;

      const startDt = parseHhmmToTodayIso(args.start_hhmm, 9);
      let endDt = parseHhmmToTodayIso(args.end_hhmm, 10);
      if (endDt.getTime() <= startDt.getTime()) {
        endDt = new Date(startDt.getTime() + 60 * 60 * 1000);
      }

      const t0 = performance.now();
      // public.circadian_events has FK user_id -> public."User"(id); verify user exists or pass NULL
      const validUsers = await pgQuery<{ id: string }>(
        `SELECT id FROM public."User" WHERE id = $1 LIMIT 1`,
        userId
      );
      const safeCircadianUserId = validUsers.length > 0 ? validUsers[0].id : null;

      const inserted = await pgQuery<{
        id: string;
        title: string;
        domain: string;
        start_time: string;
        end_time: string;
      }>(
        `INSERT INTO public.circadian_events
          (user_id, title, description, domain, start_time, end_time, media_url, media_type, accent_color, telemetry_source)
         VALUES ($1, $2, $3, $4::public.event_domain, $5::timestamptz, $6::timestamptz, $7, 'image'::public.media_type_enum, $8, 'copilot_hud')
         RETURNING id, title, domain, start_time, end_time`,
        safeCircadianUserId,
        title,
        "Scheduled via Sovereign Multimodal Copilot",
        domainSpec.domain,
        startDt.toISOString(),
        endDt.toISOString(),
        domainSpec.mediaUrl,
        domainSpec.accentColor
      );
      sqlElapsedMs = Math.max(1, Math.round(performance.now() - t0));

      resultPayload = {
        event: inserted[0],
        table: "public.circadian_events",
      };
    } else if (toolName === "log_entity_telemetry") {
      const entityName = String(args.entity_name || "Koda").trim().slice(0, 60);
      const waterOz = Math.max(0, Number(args.water_oz) || 0);
      const foodGrams = Math.max(0, Number(args.food_grams) || 0);
      const medAdministered = Boolean(args.medication_administered);

      const t0 = performance.now();
      let entities = await pgQuery<{ id: string; name: string; entity_type: string }>(
        `SELECT id, name, entity_type
         FROM public.household_entities
         WHERE LOWER(name) LIKE LOWER($1)
         ORDER BY CASE WHEN user_id = $2 THEN 0 ELSE 1 END
         LIMIT 1`,
        `%${entityName}%`,
        userId
      );

      if (entities.length === 0) {
        const lower = entityName.toLowerCase();
        const inferredType =
          lower.includes("koda") ||
          lower.includes("balto") ||
          lower.includes("husky") ||
          lower.includes("dog") ||
          lower.includes("pup")
            ? "canine_adult"
            : "human_adult";

        entities = await pgQuery<{ id: string; name: string; entity_type: string }>(
          `INSERT INTO public.household_entities (user_id, name, entity_type, accent_color)
           VALUES ($1, $2, $3::public.entity_type_enum, '#f59e0b')
           RETURNING id, name, entity_type`,
          userId,
          entityName,
          inferredType
        );
      }

      const entity = entities[0];
      const logRows = await pgQuery<{ id: string; logged_at: string }>(
        `INSERT INTO public.entity_telemetry_logs
          (entity_id, log_date, water_consumed_oz, food_consumed_grams, medication_administered, notes)
         VALUES ($1::uuid, CURRENT_DATE, $2, $3, $4, 'Logged via Sovereign Copilot')
         RETURNING id, logged_at`,
        entity.id,
        waterOz,
        foodGrams,
        medAdministered
      );
      sqlElapsedMs = Math.max(1, Math.round(performance.now() - t0));

      resultPayload = {
        logId: logRows[0]?.id,
        entity: entity.name,
        entityType: entity.entity_type,
        water_oz: waterOz,
        food_grams: foodGrams,
        medication_administered: medAdministered,
        table: "public.entity_telemetry_logs",
      };
    } else if (toolName === "search_neural_vault") {
      const query = String(args.query || "").trim();
      const pattern = `%${query}%`;

      const t0 = performance.now();
      let nodes = await pgQuery<{
        id: string;
        title: string;
        slug: string;
        domain: string;
        tags: string[];
        content_markdown: string;
      }>(
        `SELECT id, title, slug, domain, tags, LEFT(content_markdown, 260) AS content_markdown
         FROM public.vault_nodes
         WHERE is_archived = FALSE
           AND (title ILIKE $1 OR content_markdown ILIKE $1 OR $2 = ANY(tags))
         ORDER BY is_pinned DESC, updated_at DESC
         LIMIT 5`,
        pattern,
        query.toLowerCase()
      );

      if (nodes.length === 0) {
        nodes = await pgQuery(
          `SELECT id, title, slug, domain, tags, LEFT(content_markdown, 220) AS content_markdown
           FROM public.vault_nodes
           WHERE is_archived = FALSE
           ORDER BY is_pinned DESC, updated_at DESC
           LIMIT 3`
        );
      }
      sqlElapsedMs = Math.max(1, Math.round(performance.now() - t0));

      resultPayload = {
        query,
        matchCount: nodes.length,
        nodes,
        table: "public.vault_nodes",
      };
    } else {
      status = "unsupported_tool";
      resultPayload = { error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    status = "error";
    resultPayload = { error: err?.message || String(err) };
  }

  const auditRows = await pgQuery<ToolExecutionRecord>(
    `INSERT INTO public.copilot_tool_executions
      (conversation_id, tool_name, tool_arguments, tool_result, execution_duration_ms, status)
     VALUES ($1::uuid, $2, $3::jsonb, $4::jsonb, $5, $6)
     RETURNING id, conversation_id, tool_name, tool_arguments, tool_result, execution_duration_ms, status, executed_at`,
    conversationId,
    toolName,
    JSON.stringify(args),
    JSON.stringify(resultPayload),
    sqlElapsedMs,
    status
  );

  return auditRows[0];
}

async function runDeterministicCommandFallback(
  userId: string,
  conversationId: string,
  message: string,
  hasImageFrame: boolean,
  imageLabel?: string
): Promise<{ reply: string; executions: ToolExecutionRecord[] }> {
  const lower = message.toLowerCase().trim();
  const executions: ToolExecutionRecord[] = [];

  // 1. PMS Task creation intent
  if (
    /\b(create task|add task|new task|pms task|todo:|task:)\b/i.test(message)
  ) {
    const cleaned = message
      .replace(
        /^.*?\b(create task|add task|new task|pms task|todo:|task:)\b[:\-\s]*/i,
        ""
      )
      .trim();
    const priority = /\burgent\b/i.test(message)
      ? "urgent"
      : /\bhigh\b/i.test(message)
      ? "high"
      : /\blow\b/i.test(message)
      ? "low"
      : "high";
    const status_category = /\bactive|in progress|start\b/i.test(message)
      ? "active"
      : "unstarted";
    const exec = await executeSovereignTool(
      userId,
      conversationId,
      "create_pms_task",
      {
        name: cleaned || message.slice(0, 120),
        priority,
        status_category,
      }
    );
    executions.push(exec);
  }

  // 2. Nutrition meal logging intent
  if (/\b(log meal|ate |calories|kcal|protein|meal:)\b/i.test(message)) {
    const calMatch = message.match(/(\d{2,4})\s*(?:kcal|cal|calories)/i);
    const proMatch = message.match(/(\d{1,3}(?:\.\d+)?)\s*g?\s*protein/i);
    const carbMatch = message.match(/(\d{1,3}(?:\.\d+)?)\s*g?\s*carb/i);
    const fatMatch = message.match(/(\d{1,3}(?:\.\d+)?)\s*g?\s*fat/i);
    const weightMatch = message.match(/(\d{2,4})\s*g(?:rams)?\b/i);

    const nameClean = message
      .replace(/\b(log meal|ate|meal:)\b/gi, "")
      .split(/with|\d+\s*(?:kcal|cal)/i)[0]
      .trim();

    const exec = await executeSovereignTool(
      userId,
      conversationId,
      "log_nutrition_meal",
      {
        name: nameClean || (hasImageFrame ? "Visual Meal Scan" : "Executive Macro Meal"),
        calories: calMatch ? Number(calMatch[1]) : 620,
        protein_g: proMatch ? Number(proMatch[1]) : 58,
        carbs_g: carbMatch ? Number(carbMatch[1]) : 32,
        fats_g: fatMatch ? Number(fatMatch[1]) : 24,
        weight_g: weightMatch ? Number(weightMatch[1]) : 380,
      }
    );
    executions.push(exec);
  }

  // 3. Circadian calendar block intent
  if (
    /\b(schedule|circadian|time block|block from|solar arc)\b/i.test(message)
  ) {
    const times = Array.from(message.matchAll(/\b(\d{1,2}:\d{2})\b/g)).map(
      (m) => m[1]
    );
    const start_hhmm = times[0] || "10:00";
    const end_hhmm = times[1] || "11:30";
    const domain = /\bgym|workout|lift|run|train/i.test(message)
      ? "physical_training"
      : /\bmeal|eat|steak|nutrition/i.test(message)
      ? "nutrition"
      : /\bhusky|koda|balto|dog|walk|family/i.test(message)
      ? "family_pets"
      : /\berrand|fleet|clean|logistics/i.test(message)
      ? "logistics"
      : "engineering";

    const titleClean = message
      .replace(/\b(schedule|create circadian block|circadian block|time block)\b/gi, "")
      .replace(/\bfrom\s+\d{1,2}:\d{2}\s*(to|-)\s*\d{1,2}:\d{2}\b/gi, "")
      .trim();

    const exec = await executeSovereignTool(
      userId,
      conversationId,
      "create_circadian_block",
      {
        title: titleClean || "Deep Architecture Sprint",
        domain,
        start_hhmm,
        end_hhmm,
      }
    );
    executions.push(exec);
  }

  // 4. Household / Canine entity telemetry intent
  if (
    /\b(koda|balto|husky|canine|water_oz|telemetry|gave .* water|fed )\b/i.test(
      message
    )
  ) {
    const entityMatch = message.match(/\b(Koda|Balto|Chairman|Partner)\b/i);
    const ozMatch = message.match(/(\d{1,3}(?:\.\d+)?)\s*(?:oz|fl oz)/i);
    const gramsMatch = message.match(/(\d{2,4}(?:\.\d+)?)\s*(?:g|grams)/i);
    const meds = /\b(med|medication|pill|supplement|dose)\b/i.test(message);

    const exec = await executeSovereignTool(
      userId,
      conversationId,
      "log_entity_telemetry",
      {
        entity_name: entityMatch ? entityMatch[1] : "Koda",
        water_oz: ozMatch ? Number(ozMatch[1]) : 16,
        food_grams: gramsMatch ? Number(gramsMatch[1]) : 220,
        medication_administered: meds,
      }
    );
    executions.push(exec);
  }

  // 5. Neural Vault search intent
  if (/\b(search|vault|find note|knowledge|lookup)\b/i.test(lower)) {
    const q = message
      .replace(/^.*?\b(search neural vault|search vault|vault|find note|lookup)\b[:\s]*/i, "")
      .trim();
    const exec = await executeSovereignTool(
      userId,
      conversationId,
      "search_neural_vault",
      {
        query: q || "architecture",
      }
    );
    executions.push(exec);
  }

  if (executions.length > 0) {
    const lines = executions.map(
      (e) =>
        `• **${e.tool_name}** executed in **${e.execution_duration_ms}ms** → \`${JSON.stringify(
          e.tool_result
        ).slice(0, 160)}\``
    );
    return {
      reply: `Sovereign Local Command Engine executed ${executions.length} direct PostgreSQL mutation(s):\n\n${lines.join(
        "\n"
      )}`,
      executions,
    };
  }

  if (hasImageFrame) {
    return {
      reply: `Visual frame captured (${imageLabel || "Live Camera Ingress"}). Local Deterministic Vision Router active — configure \`GEMINI_API_KEY\` for neural pixel inference, or issue a direct voice/text command (e.g., *"Log meal 650 kcal 55g protein 30g carbs 22g fat 380g"* or *"Create task Audit desk cable routing urgent"*) for immediate <10ms PostgreSQL execution.`,
      executions,
    };
  }

  return {
    reply:
      `Sovereign Deterministic Parser standing by. Direct <10ms SQL tools armed:\n` +
      `• **Task**: *"Create task Finalize Q3 Prop Allocation urgent"*\n` +
      `• **MacroOps**: *"Log meal Ribeye & Eggs 680 kcal 62g protein 8g carbs 42g fat 360g"*\n` +
      `• **Solar Arc**: *"Schedule Deep Engineering Sprint from 09:30 to 11:30"*\n` +
      `• **5-Wheel Pack**: *"Koda 20 oz water 250 grams food medication"*\n` +
      `• **Neural Vault**: *"Search vault Caliber Arc"*`,
    executions,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const { searchParams } = new URL(req.url);
    const requestedConvoId = searchParams.get("conversationId");

    const conversations = await pgQuery<{
      id: string;
      title: string;
      session_mode: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, title, session_mode, created_at, updated_at
       FROM public.copilot_conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 15`,
      userId
    );

    const activeConvoId = requestedConvoId || conversations[0]?.id || null;

    const messages = activeConvoId
      ? await pgQuery<{
          id: string;
          conversation_id: string;
          sender_role: string;
          content: string;
          audio_transcript: string | null;
          media_attachments: any[];
          created_at: string;
        }>(
          `SELECT id, conversation_id, sender_role, content, audio_transcript, media_attachments, created_at
           FROM public.copilot_messages
           WHERE conversation_id = $1::uuid
           ORDER BY created_at ASC
           LIMIT 80`,
          activeConvoId
        )
      : [];

    const toolExecutions = await pgQuery<ToolExecutionRecord>(
      `SELECT e.id, e.conversation_id, e.tool_name, e.tool_arguments, e.tool_result,
              e.execution_duration_ms, e.status, e.executed_at
       FROM public.copilot_tool_executions e
       JOIN public.copilot_conversations c ON c.id = e.conversation_id
       WHERE c.user_id = $1
       ORDER BY e.executed_at DESC
       LIMIT 35`,
      userId
    );

    return NextResponse.json({
      conversations,
      activeConversationId: activeConvoId,
      messages,
      toolExecutions,
      aiConfigured: Boolean(
        process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ),
    });
  } catch (error: any) {
    console.error("[GET /api/copilot] Error:", error);
    return NextResponse.json(
      { error: "Failed to load Copilot HUD state", detail: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    const messageText = String(body.message || "").trim();
    const audioTranscript = body.audioTranscript
      ? String(body.audioTranscript)
      : null;
    const sessionMode = String(body.sessionMode || "text").slice(0, 32);
    const imageFrame =
      body.imageFrame &&
      typeof body.imageFrame.base64Data === "string" &&
      body.imageFrame.base64Data.length > 0
        ? {
            mimeType: String(body.imageFrame.mimeType || "image/jpeg"),
            base64Data: String(body.imageFrame.base64Data).replace(
              /^data:[^;]+;base64,/,
              ""
            ),
            label: String(body.imageFrame.label || "Camera Inspection Frame"),
          }
        : null;

    if (!messageText && !imageFrame) {
      return NextResponse.json(
        { error: "Message or camera inspection frame is required" },
        { status: 400 }
      );
    }

    const effectiveUserPrompt =
      messageText ||
      "Inspect this live camera frame for the Chairman Dashboard. Identify actionable nutrition macros, canine posture/hydration cues, or workspace tasks.";

    // 1. Resolve or create conversation
    let conversationId = body.conversationId
      ? String(body.conversationId)
      : "";
    if (conversationId) {
      const existing = await pgQuery<{ id: string }>(
        `SELECT id FROM public.copilot_conversations WHERE id = $1::uuid LIMIT 1`,
        conversationId
      ).catch(() => []);
      if (existing.length === 0) conversationId = "";
    }

    if (!conversationId) {
      const titleSeed = effectiveUserPrompt.slice(0, 72) || "Sovereign Briefing";
      const created = await pgQuery<{ id: string }>(
        `INSERT INTO public.copilot_conversations (user_id, title, session_mode)
         VALUES ($1, $2, $3)
         RETURNING id`,
        userId,
        titleSeed,
        imageFrame ? "multimodal" : sessionMode
      );
      conversationId = created[0].id;
    }

    // 2. Persist user message
    const mediaMeta = imageFrame
      ? [
          {
            type: "camera_frame",
            mimeType: imageFrame.mimeType,
            label: imageFrame.label,
            byteEstimate: Math.round((imageFrame.base64Data.length * 3) / 4),
            capturedAt: new Date().toISOString(),
          },
        ]
      : [];

    await pgExec(
      `INSERT INTO public.copilot_messages
        (conversation_id, sender_role, content, audio_transcript, media_attachments)
       VALUES ($1::uuid, 'user', $2, $3, $4::jsonb)`,
      conversationId,
      effectiveUserPrompt,
      audioTranscript,
      JSON.stringify(mediaMeta)
    );

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let finalReply = "";
    let toolExecutions: ToolExecutionRecord[] = [];
    let engineSource = "deterministic-local";

    // 3. Gather brief operational context from PostgreSQL
    const [pmsCountRows, macroRows] = await Promise.all([
      pgQuery<{ cnt: number }>(
        `SELECT COUNT(*)::int AS cnt FROM public.pms_tasks WHERE is_closed = FALSE`
      ).catch(() => [{ cnt: 0 }]),
      pgQuery<{
        consumed_calories: number;
        target_calories: number;
        consumed_protein: number;
        target_protein: number;
      }>(
        `SELECT consumed_calories, target_calories, consumed_protein, target_protein
         FROM public.nutrition_daily_logs
         WHERE user_id = $1 AND date = CURRENT_DATE
         LIMIT 1`,
        userId
      ).catch(() => []),
    ]);

    const macroSnap = macroRows[0];
    const systemInstruction = `You are the Chairman's Sovereign Multimodal AI Copilot embedded natively inside the Living OS.
You have direct <10ms PostgreSQL write & search authority via 5 native tools:
1. create_pms_task(name, priority, status_category)
2. log_nutrition_meal(name, calories, protein_g, carbs_g, fats_g, weight_g)
3. create_circadian_block(title, domain, start_hhmm, end_hhmm)
4. log_entity_telemetry(entity_name, water_oz, food_grams, medication_administered)
5. search_neural_vault(query)

Live State:
- Open PMS Tasks: ${pmsCountRows[0]?.cnt ?? 0}
- Today's MacroOps: ${
      macroSnap
        ? `${macroSnap.consumed_calories}/${macroSnap.target_calories} kcal, ${macroSnap.consumed_protein}/${macroSnap.target_protein}g protein`
        : "No meals logged yet today"
    }
- Current Time (America/Denver): ${new Date().toLocaleString("en-US", {
      timeZone: "America/Denver",
    })}

Directives:
- Whenever the Chairman asks to add/create a task, log food/macros (including from a camera meal photo!), schedule a time block, log pet/human hydration/food/meds, or search the vault, IMMEDIATELY invoke the matching function tool(s).
- If a camera image frame is provided (e.g. pantry/plate scan, canine mobility check, or desk audit), analyze the visual details concretely and invoke relevant tools if requested.
- Keep responses crisp, executive, high-signal, and suitable for both HUD reading and voice synthesis.`;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let responseObj: any = null;

        const userParts: any[] = [{ text: `${systemInstruction}\n\nChairman Command: ${effectiveUserPrompt}` }];
        if (imageFrame) {
          userParts.push({
            inlineData: {
              mimeType: imageFrame.mimeType,
              data: imageFrame.base64Data,
            },
          });
        }

        for (const modelName of modelNames) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              tools: [{ functionDeclarations: SOVEREIGN_TOOL_DECLARATIONS as any }],
            });
            const result = await model.generateContent(userParts);
            responseObj = result?.response;
            if (responseObj) {
              engineSource = modelName;
              break;
            }
          } catch (modelErr) {
            console.warn(`[Copilot] Model ${modelName} attempt failed:`, modelErr);
          }
        }

        if (responseObj) {
          let calls =
            typeof responseObj.functionCalls === "function"
              ? responseObj.functionCalls()
              : responseObj.functionCalls;

          if ((!calls || calls.length === 0) && responseObj.candidates?.[0]?.content?.parts) {
            calls = responseObj.candidates[0].content.parts
              .filter((p: any) => p.functionCall)
              .map((p: any) => p.functionCall);
          }

          if (calls && calls.length > 0) {
            for (const call of calls) {
              const record = await executeSovereignTool(
                userId,
                conversationId,
                call.name,
                (call.args as Record<string, any>) || {}
              );
              toolExecutions.push(record);
            }
          }

          let extractedText = "";
          if (typeof responseObj.text === "function") {
            try {
              extractedText = responseObj.text();
            } catch {
              extractedText = "";
            }
          }
          if (!extractedText && responseObj.candidates?.[0]?.content?.parts) {
            extractedText = responseObj.candidates[0].content.parts
              .map((p: any) => p.text || "")
              .join("\n")
              .trim();
          }

          if (toolExecutions.length > 0 && !extractedText) {
            const summaryLines = toolExecutions.map(
              (t) =>
                `Committed **${t.tool_name}** in **${t.execution_duration_ms}ms** (${t.status.toUpperCase()}).`
            );
            finalReply = `${summaryLines.join(" ")} Audit ledger updated.`;
          } else {
            finalReply =
              extractedText ||
              "Command processed by Sovereign Copilot.";
          }
        }
      } catch (aiError) {
        console.error("[POST /api/copilot] Gemini error, engaging fallback:", aiError);
      }
    }

    if (!finalReply) {
      const fallback = await runDeterministicCommandFallback(
        userId,
        conversationId,
        effectiveUserPrompt,
        Boolean(imageFrame),
        imageFrame?.label
      );
      finalReply = fallback.reply;
      toolExecutions = [...toolExecutions, ...fallback.executions];
      engineSource = "sovereign-deterministic-sql";
    }

    // 4. Persist assistant reply & bump conversation timestamp
    await pgExec(
      `INSERT INTO public.copilot_messages (conversation_id, sender_role, content)
       VALUES ($1::uuid, 'assistant', $2)`,
      conversationId,
      finalReply
    );
    await pgExec(
      `UPDATE public.copilot_conversations SET updated_at = NOW() WHERE id = $1::uuid`,
      conversationId
    );

    return NextResponse.json({
      conversationId,
      reply: finalReply,
      toolExecutions,
      engineSource,
    });
  } catch (error: any) {
    console.error("[POST /api/copilot] Error:", error);
    return NextResponse.json(
      { error: "Copilot command failed", detail: error?.message },
      { status: 500 }
    );
  }
}
