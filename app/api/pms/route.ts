import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export type PmsStatusCategory =
  | "open"
  | "unstarted"
  | "active"
  | "blocked"
  | "review"
  | "closed";

export interface PmsChecklistRow {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  sort_order: number;
}

export interface PmsListRow {
  id: string;
  user_id: string;
  name: string;
  space_name: string;
  original_clickup_list_id: string | null;
  created_at: string;
}

export interface PmsTaskRow {
  id: string;
  user_id: string;
  list_id: string;
  parent_task_id: string | null;
  original_clickup_id: string | null;
  name: string;
  markdown_description: string | null;
  status: string;
  status_category: PmsStatusCategory;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  time_estimate_minutes: number;
  tags: string[];
  is_shared: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  list_name?: string;
  space_name?: string;
  checklists?: PmsChecklistRow[];
}

const VALID_CATEGORIES: PmsStatusCategory[] = [
  "open",
  "unstarted",
  "active",
  "blocked",
  "review",
  "closed",
];

function translateClickUpStatus(
  rawStatus?: string | null,
  rawType?: string | null
): { status: string; category: PmsStatusCategory; isClosed: boolean } {
  const s = (rawStatus || "to do").trim().toLowerCase();
  const t = (rawType || "").trim().toLowerCase();

  if (
    t === "closed" ||
    t === "done" ||
    s.includes("complete") ||
    s.includes("closed") ||
    s.includes("shipped") ||
    s.includes("verified") ||
    s === "done"
  ) {
    return { status: rawStatus || "closed", category: "closed", isClosed: true };
  }
  if (
    s.includes("block") ||
    s.includes("hold") ||
    s.includes("stuck") ||
    s.includes("wait") ||
    s.includes("depend")
  ) {
    return { status: rawStatus || "blocked", category: "blocked", isClosed: false };
  }
  if (
    s.includes("review") ||
    s.includes("qa") ||
    s.includes("verif") ||
    s.includes("test") ||
    s.includes("stag")
  ) {
    return { status: rawStatus || "in review", category: "review", isClosed: false };
  }
  if (
    s.includes("progress") ||
    s.includes("active") ||
    s.includes("doing") ||
    s.includes("exec") ||
    s.includes("dev") ||
    s.includes("working")
  ) {
    return { status: rawStatus || "in progress", category: "active", isClosed: false };
  }
  if (
    s.includes("ice") ||
    s.includes("idea") ||
    s.includes("backlog") ||
    s === "open" ||
    t === "open"
  ) {
    if (s === "to do" || s.includes("sprint") || s.includes("queue")) {
      return { status: rawStatus || "sprint queue", category: "unstarted", isClosed: false };
    }
    return { status: rawStatus || "ice box", category: "open", isClosed: false };
  }
  return { status: rawStatus || "to do", category: "unstarted", isClosed: false };
}

function translatePriority(rawPriority: any): string {
  if (!rawPriority) return "normal";
  const val =
    typeof rawPriority === "object"
      ? String(rawPriority.priority || rawPriority.id || "").toLowerCase()
      : String(rawPriority).toLowerCase();
  if (val === "1" || val.includes("urgent") || val.includes("crit")) return "urgent";
  if (val === "2" || val.includes("high")) return "high";
  if (val === "4" || val.includes("low")) return "low";
  return "normal";
}

function parseCsvRows(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, "_")
  );
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    return obj;
  });
}

async function ensureSeededPms(userId: string) {
  const existing = await pgQuery<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM public.pms_lists WHERE user_id = $1`,
    userId
  );
  if ((existing[0]?.count ?? 0) > 0) return;

  const userSuffix = userId.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "x");

  const listSpecs = [
    {
      name: "Living OS Sovereign Core",
      space: "Pristine Designs Engineering",
      cuId: `cu_lst_core_${userSuffix}`,
    },
    {
      name: "Caliber Arc Quantitative Ops",
      space: "Capital & Futures Desk",
      cuId: `cu_lst_quant_${userSuffix}`,
    },
    {
      name: "Executive LifeOps & Estate",
      space: "Rodriguez Household",
      cuId: `cu_lst_estate_${userSuffix}`,
    },
  ];

  const listIds: string[] = [];
  for (const ls of listSpecs) {
    const rows = await pgQuery<{ id: string }>(
      `INSERT INTO public.pms_lists (user_id, name, space_name, original_clickup_list_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (original_clickup_list_id)
       DO UPDATE SET name = EXCLUDED.name, space_name = EXCLUDED.space_name
       RETURNING id`,
      userId,
      ls.name,
      ls.space,
      ls.cuId
    );
    listIds.push(rows[0].id);
  }

  const [coreListId, quantListId, estateListId] = listIds;
  const now = Date.now();
  const dayMs = 86400000;

  const seedTasks: Array<{
    key: string;
    listId: string;
    cuId: string;
    name: string;
    desc: string;
    status: string;
    category: PmsStatusCategory;
    priority: string;
    dueOffsetDays: number;
    estimate: number;
    tags: string[];
    isShared?: boolean;
    parentKey?: string;
    checklists?: Array<{ name: string; done: boolean }>;
  }> = [
    {
      key: "t_ice_1",
      listId: coreListId,
      cuId: `cu_868a101_${userSuffix}`,
      name: "WebGPU Spatial Shader Pipeline for 80-Year Horizon Zoom",
      desc: "Evaluate custom instanced WebGL2/WebGPU post-processing bloom passes for low-power laptop battery mode.",
      status: "ice box",
      category: "open",
      priority: "low",
      dueOffsetDays: 14,
      estimate: 180,
      tags: ["r&d", "graphics", "horizon"],
      checklists: [
        { name: "Benchmark 60fps budget on integrated GPU", done: true },
        { name: "Prototype Catmull-Rom spline camera rail", done: false },
      ],
    },
    {
      key: "t_sprint_1",
      listId: coreListId,
      cuId: `cu_868a102_${userSuffix}`,
      name: "Decommission Legacy ClickUp SaaS Webhooks & Cut Over to Sovereign PMS",
      desc: "Complete full idempotent ingestion of historical ClickUp spaces, archive external API webhooks, and lock local RLS policies.",
      status: "sprint queue",
      category: "unstarted",
      priority: "high",
      dueOffsetDays: 2,
      estimate: 90,
      tags: ["sovereignty", "clickup-exit", "postgres"],
      checklists: [
        { name: "Verify ON CONFLICT (original_clickup_id) upsert integrity", done: true },
        { name: "Export final ClickUp workspace JSON snapshot", done: false },
        { name: "Revoke legacy SaaS webhook tokens", done: false },
      ],
    },
    {
      key: "t_sprint_1_sub1",
      parentKey: "t_sprint_1",
      listId: coreListId,
      cuId: `cu_868a102s1_${userSuffix}`,
      name: "Audit subtask parent_task_id foreign-key tree resolution",
      desc: "Ensure multi-level ClickUp subtasks preserve hierarchy after batch import.",
      status: "sprint queue",
      category: "unstarted",
      priority: "normal",
      dueOffsetDays: 2,
      estimate: 35,
      tags: ["schema", "qa"],
    },
    {
      key: "t_active_1",
      listId: coreListId,
      cuId: `cu_868a103_${userSuffix}`,
      name: "Zero-Trust RLS Consent Enforcement for His & Hers Pod",
      desc: "Enforce field-level redaction when share_calendar_details or share_finances is revoked in pod_consent_grants.",
      status: "active execution",
      category: "active",
      priority: "urgent",
      dueOffsetDays: 0,
      estimate: 120,
      tags: ["security", "rls", "pods"],
      isShared: true,
      checklists: [
        { name: "Wire pod_consent_grants live toggle matrix", done: true },
        { name: "Mask partner events as anonymous Busy arcs when details=false", done: true },
        { name: "Verify zero personal biometric leakage in Business Pod", done: false },
      ],
    },
    {
      key: "t_active_1_sub1",
      parentKey: "t_active_1",
      listId: coreListId,
      cuId: `cu_868a103s1_${userSuffix}`,
      name: "Build Dual Concentric + Side-by-Side 24h Solar SVG Dials",
      desc: "Synchronize real-time solar needle and highlight partner free-time overlap windows.",
      status: "active execution",
      category: "active",
      priority: "high",
      dueOffsetDays: 0,
      estimate: 45,
      tags: ["svg", "circadian"],
    },
    {
      key: "t_active_1_sub2",
      parentKey: "t_active_1",
      listId: coreListId,
      cuId: `cu_868a103s2_${userSuffix}`,
      name: "Verify instant redaction state transition without page reload",
      desc: "Optimistic UI + PostgreSQL roundtrip verification.",
      status: "in review",
      category: "review",
      priority: "normal",
      dueOffsetDays: 1,
      estimate: 25,
      tags: ["ux", "privacy"],
    },
    {
      key: "t_blocked_1",
      listId: quantListId,
      cuId: `cu_868a201_${userSuffix}`,
      name: "Rithmic / Replikanto Prop Account #4 API Key Rotation",
      desc: "Waiting on broker compliance reset window after CME weekend maintenance before re-arming automated copier.",
      status: "dependency hold",
      category: "blocked",
      priority: "high",
      dueOffsetDays: 1,
      estimate: 40,
      tags: ["mnq", "replikanto", "broker"],
      checklists: [
        { name: "Confirm $250 session loss circuit breaker stays locked", done: true },
        { name: "Paste rotated Rithmic gateway token into MCP Vault", done: false },
      ],
    },
    {
      key: "t_review_1",
      listId: estateListId,
      cuId: `cu_868a301_${userSuffix}`,
      name: "Comet IVDD Parachute Sling & Crash-Cart q12h Dosing Audit",
      desc: "Cross-check Gabapentin (07:00/19:00), Methocarbamol (07:00/19:00), and Rimadyl GI protective meal spacing.",
      status: "verification gate",
      category: "review",
      priority: "urgent",
      dueOffsetDays: 0,
      estimate: 30,
      tags: ["comet-ivdd", "canine-care", "veterinary"],
      isShared: true,
      checklists: [
        { name: "Stage parachute sling at back patio door", done: true },
        { name: "Pre-portion 7-day AM/PM Gabapentin + Methocarbamol pill organizer", done: true },
        { name: "Confirm Rimadyl given strictly after 120g wet food base", done: true },
      ],
    },
    {
      key: "t_closed_1",
      listId: quantListId,
      cuId: `cu_868a202_${userSuffix}`,
      name: "Caliber Arc Pre-Market CVD & Market ADD Telemetry Schema",
      desc: "Deployed PostgreSQL trading_sessions and trading_trades ledger with automatic net PnL & commission deduction.",
      status: "verified",
      category: "closed",
      priority: "normal",
      dueOffsetDays: -1,
      estimate: 75,
      tags: ["caliber-arc", "completed"],
      checklists: [
        { name: "Deploy trading_sessions migration", done: true },
        { name: "Verify MNQ tick value calculations", done: true },
      ],
    },
  ];

  const keyToUuid: Record<string, string> = {};

  for (const item of seedTasks) {
    const parentUuid = item.parentKey ? keyToUuid[item.parentKey] ?? null : null;
    const dueIso = new Date(now + item.dueOffsetDays * dayMs).toISOString();
    const startIso = new Date(now - dayMs).toISOString();
    const isClosed = item.category === "closed";

    const inserted = await pgQuery<{ id: string }>(
      `INSERT INTO public.pms_tasks (
        user_id, list_id, parent_task_id, original_clickup_id, name,
        markdown_description, status, status_category, priority,
        start_date, due_date, time_estimate_minutes, tags, is_shared, is_closed
      ) VALUES (
        $1, $2::uuid, $3::uuid, $4, $5,
        $6, $7, $8::public.pms_status_category, $9,
        $10::timestamptz, $11::timestamptz, $12,
        ARRAY(SELECT jsonb_array_elements_text($13::jsonb)),
        $14, $15
      )
      ON CONFLICT (original_clickup_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        status_category = EXCLUDED.status_category,
        updated_at = NOW()
      RETURNING id`,
      userId,
      item.listId,
      parentUuid,
      item.cuId,
      item.name,
      item.desc,
      item.status,
      item.category,
      item.priority,
      startIso,
      dueIso,
      item.estimate,
      JSON.stringify(item.tags),
      item.isShared ?? false,
      isClosed
    );

    const taskId = inserted[0].id;
    keyToUuid[item.key] = taskId;

    if (item.checklists && item.checklists.length > 0) {
      await pgExec(`DELETE FROM public.pms_task_checklists WHERE task_id = $1::uuid`, taskId);
      for (let idx = 0; idx < item.checklists.length; idx++) {
        const cl = item.checklists[idx];
        await pgExec(
          `INSERT INTO public.pms_task_checklists (task_id, name, is_completed, sort_order)
           VALUES ($1::uuid, $2, $3, $4)`,
          taskId,
          cl.name,
          cl.done,
          idx
        );
      }
    }
  }
}

interface NormalizedImportTask {
  clickupId: string;
  parentClickupId?: string | null;
  listName: string;
  listClickupId: string;
  spaceName: string;
  name: string;
  description: string;
  status: string;
  statusType?: string;
  priority: string;
  dueDateIso: string | null;
  estimateMinutes: number;
  tags: string[];
  checklists: Array<{ name: string; done: boolean }>;
}

async function upsertNormalizedClickUpTasks(
  userId: string,
  items: NormalizedImportTask[]
) {
  const listCache = new Map<string, string>();
  let importedLists = 0;
  let upsertedTasks = 0;

  for (const item of items) {
    if (!listCache.has(item.listClickupId)) {
      const listRows = await pgQuery<{ id: string }>(
        `INSERT INTO public.pms_lists (user_id, name, space_name, original_clickup_list_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (original_clickup_list_id)
         DO UPDATE SET
           name = EXCLUDED.name,
           space_name = EXCLUDED.space_name
         RETURNING id`,
        userId,
        item.listName,
        item.spaceName,
        item.listClickupId
      );
      listCache.set(item.listClickupId, listRows[0].id);
      importedLists++;
    }
  }

  const clickupToDbTaskId = new Map<string, string>();

  // Pass 1: Upsert all tasks cleanly via ON CONFLICT (original_clickup_id) DO UPDATE
  for (const item of items) {
    const listId = listCache.get(item.listClickupId)!;
    const translated = translateClickUpStatus(item.status, item.statusType);

    const rows = await pgQuery<{ id: string }>(
      `INSERT INTO public.pms_tasks (
        user_id, list_id, original_clickup_id, name, markdown_description,
        status, status_category, priority, due_date,
        time_estimate_minutes, tags, is_closed, updated_at
      ) VALUES (
        $1, $2::uuid, $3, $4, $5,
        $6, $7::public.pms_status_category, $8, $9::timestamptz,
        $10, ARRAY(SELECT jsonb_array_elements_text($11::jsonb)), $12, NOW()
      )
      ON CONFLICT (original_clickup_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        list_id = EXCLUDED.list_id,
        name = EXCLUDED.name,
        markdown_description = EXCLUDED.markdown_description,
        status = EXCLUDED.status,
        status_category = EXCLUDED.status_category,
        priority = EXCLUDED.priority,
        due_date = COALESCE(EXCLUDED.due_date, public.pms_tasks.due_date),
        time_estimate_minutes = EXCLUDED.time_estimate_minutes,
        tags = EXCLUDED.tags,
        is_closed = EXCLUDED.is_closed,
        updated_at = NOW()
      RETURNING id`,
      userId,
      listId,
      item.clickupId,
      item.name,
      item.description,
      translated.status,
      translated.category,
      item.priority,
      item.dueDateIso,
      item.estimateMinutes,
      JSON.stringify(item.tags),
      translated.isClosed
    );

    const dbTaskId = rows[0].id;
    clickupToDbTaskId.set(item.clickupId, dbTaskId);
    upsertedTasks++;

    if (item.checklists.length > 0) {
      await pgExec(`DELETE FROM public.pms_task_checklists WHERE task_id = $1::uuid`, dbTaskId);
      for (let i = 0; i < item.checklists.length; i++) {
        await pgExec(
          `INSERT INTO public.pms_task_checklists (task_id, name, is_completed, sort_order)
           VALUES ($1::uuid, $2, $3, $4)`,
          dbTaskId,
          item.checklists[i].name,
          item.checklists[i].done,
          i
        );
      }
    }
  }

  // Pass 2: Wire parent_task_id relationships for subtasks
  let linkedSubtasks = 0;
  for (const item of items) {
    if (!item.parentClickupId) continue;
    const childDbId = clickupToDbTaskId.get(item.clickupId);
    let parentDbId = clickupToDbTaskId.get(item.parentClickupId);

    if (!parentDbId) {
      const lookup = await pgQuery<{ id: string }>(
        `SELECT id FROM public.pms_tasks WHERE original_clickup_id = $1 LIMIT 1`,
        item.parentClickupId
      );
      parentDbId = lookup[0]?.id;
    }

    if (childDbId && parentDbId && childDbId !== parentDbId) {
      await pgExec(
        `UPDATE public.pms_tasks SET parent_task_id = $1::uuid WHERE id = $2::uuid`,
        parentDbId,
        childDbId
      );
      linkedSubtasks++;
    }
  }

  return { importedLists, upsertedTasks, linkedSubtasks };
}

function buildSampleClickUpItems(userId: string): NormalizedImportTask[] {
  const sfx = userId.slice(0, 6).replace(/[^a-zA-Z0-9]/g, "u");
  const now = Date.now();
  return [
    {
      clickupId: `cu_sim_901_${sfx}`,
      listClickupId: `cu_sim_list_eng_${sfx}`,
      listName: "ClickUp Migrated — Platform Sprint 42",
      spaceName: "Pristine Tech Workspace",
      name: "Migrate Multi-Agent MCP Tool Execution Telemetry to Supabase",
      description: "Imported from ClickUp Workspace • Preserves full audit trail and tool latency histograms.",
      status: "in progress",
      priority: "urgent",
      dueDateIso: new Date(now + 86400000).toISOString(),
      estimateMinutes: 110,
      tags: ["clickup-import", "mcp-mesh", "telemetry"],
      checklists: [
        { name: "Map copilot_tool_executions JSONB schema", done: true },
        { name: "Validate sub-25ms pgQuery pool response", done: false },
      ],
    },
    {
      clickupId: `cu_sim_901_sub1_${sfx}`,
      parentClickupId: `cu_sim_901_${sfx}`,
      listClickupId: `cu_sim_list_eng_${sfx}`,
      listName: "ClickUp Migrated — Platform Sprint 42",
      spaceName: "Pristine Tech Workspace",
      name: "Add exponential backoff retry wrapper for rate-limited webhooks",
      description: "Subtask automatically linked via ClickUp parent task ID.",
      status: "to do",
      priority: "high",
      dueDateIso: new Date(now + 86400000).toISOString(),
      estimateMinutes: 45,
      tags: ["clickup-import", "subtask"],
      checklists: [],
    },
    {
      clickupId: `cu_sim_902_${sfx}`,
      listClickupId: `cu_sim_list_eng_${sfx}`,
      listName: "ClickUp Migrated — Platform Sprint 42",
      spaceName: "Pristine Tech Workspace",
      name: "QA Verification: Obsidian Neural Vault Bidirectional Wikilinks",
      description: "Verify [[Node]] parser creates reciprocal vault_links entries cleanly.",
      status: "qa review",
      priority: "high",
      dueDateIso: new Date(now + 2 * 86400000).toISOString(),
      estimateMinutes: 60,
      tags: ["clickup-import", "neural-vault", "qa"],
      checklists: [
        { name: "Test orphan node graph rendering", done: true },
        { name: "Confirm markdown preview sanitization", done: true },
      ],
    },
    {
      clickupId: `cu_sim_903_${sfx}`,
      listClickupId: `cu_sim_list_ops_${sfx}`,
      listName: "ClickUp Migrated — Ops & Capital",
      spaceName: "Executive Operations",
      name: "Quarterly CPA Tax Reserve Reconciliation & Entity Ledger Export",
      description: "Blocked pending final monthly brokerage statement PDF generation.",
      status: "on hold - blocked",
      priority: "normal",
      dueDateIso: new Date(now + 5 * 86400000).toISOString(),
      estimateMinutes: 95,
      tags: ["clickup-import", "finance", "cpa"],
      checklists: [
        { name: "Export Apex/Rithmic payout ledger", done: true },
        { name: "Reconcile Delaware LLC operating account", done: false },
      ],
    },
    {
      clickupId: `cu_sim_904_${sfx}`,
      listClickupId: `cu_sim_list_ops_${sfx}`,
      listName: "ClickUp Migrated — Ops & Capital",
      spaceName: "Executive Operations",
      name: "Voice-First Morning Briefing Prompt Compression Experiment",
      description: "Icebox R&D concept from ClickUp backlog.",
      status: "icebox",
      priority: "low",
      dueDateIso: new Date(now + 12 * 86400000).toISOString(),
      estimateMinutes: 50,
      tags: ["clickup-import", "voice-ai"],
      checklists: [],
    },
  ];
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await ensureSeededPms(userId);

    const lists = await pgQuery<PmsListRow>(
      `SELECT id, user_id, name, space_name, original_clickup_list_id, created_at
       FROM public.pms_lists
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      userId
    );

    const tasks = await pgQuery<PmsTaskRow>(
      `SELECT
         t.id, t.user_id, t.list_id, t.parent_task_id, t.original_clickup_id,
         t.name, t.markdown_description, t.status,
         t.status_category::text AS status_category,
         t.priority, t.start_date, t.due_date, t.time_estimate_minutes,
         COALESCE(t.tags, ARRAY[]::text[]) AS tags,
         t.is_shared, t.is_closed, t.created_at, t.updated_at,
         l.name AS list_name, l.space_name AS space_name
       FROM public.pms_tasks t
       JOIN public.pms_lists l ON l.id = t.list_id
       WHERE t.user_id = $1
       ORDER BY
         CASE t.priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'normal' THEN 3
           ELSE 4
         END ASC,
         t.created_at DESC`,
      userId
    );

    const taskIds = tasks.map((t) => t.id);
    let checklists: PmsChecklistRow[] = [];
    if (taskIds.length > 0) {
      checklists = await pgQuery<PmsChecklistRow>(
        `SELECT id, task_id, name, is_completed, sort_order
         FROM public.pms_task_checklists
         WHERE task_id IN (
           SELECT (jsonb_array_elements_text($1::jsonb))::uuid
         )
         ORDER BY sort_order ASC, id ASC`,
        JSON.stringify(taskIds)
      );
    }

    const clMap = new Map<string, PmsChecklistRow[]>();
    for (const cl of checklists) {
      const arr = clMap.get(cl.task_id) || [];
      arr.push(cl);
      clMap.set(cl.task_id, arr);
    }

    const hydratedTasks = tasks.map((t) => ({
      ...t,
      checklists: clMap.get(t.id) || [],
    }));

    return NextResponse.json({
      lists,
      tasks: hydratedTasks,
    });
  } catch (error: any) {
    console.error("[GET /api/pms] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load Sovereign PMS" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = body?.action as string;

    if (action === "create_list") {
      const name = String(body.name || "").trim();
      const spaceName = String(body.space_name || "Executive Operations").trim();
      if (!name) {
        return NextResponse.json({ error: "List name required" }, { status: 400 });
      }
      const rows = await pgQuery<PmsListRow>(
        `INSERT INTO public.pms_lists (user_id, name, space_name)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, name, space_name, original_clickup_list_id, created_at`,
        userId,
        name,
        spaceName
      );
      return NextResponse.json({ list: rows[0] });
    }

    if (action === "create_task") {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Task name required" }, { status: 400 });
      }

      let listId = body.list_id as string | undefined;
      if (!listId) {
        const existingLists = await pgQuery<{ id: string }>(
          `SELECT id FROM public.pms_lists WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
          userId
        );
        if (existingLists[0]?.id) {
          listId = existingLists[0].id;
        } else {
          const created = await pgQuery<{ id: string }>(
            `INSERT INTO public.pms_lists (user_id, name, space_name)
             VALUES ($1, 'Sovereign Operations', 'Executive Operations')
             RETURNING id`,
            userId
          );
          listId = created[0].id;
        }
      }

      const category: PmsStatusCategory = VALID_CATEGORIES.includes(body.status_category)
        ? body.status_category
        : "unstarted";
      const priority = ["urgent", "high", "normal", "low"].includes(body.priority)
        ? body.priority
        : "normal";
      const parentTaskId = body.parent_task_id ? String(body.parent_task_id) : null;
      const estimate = Math.max(0, Number(body.time_estimate_minutes || 0));
      const tags: string[] = Array.isArray(body.tags)
        ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
        : [];
      const dueDate = body.due_date ? new Date(body.due_date).toISOString() : null;
      const isShared = Boolean(body.is_shared);
      const isClosed = category === "closed";

      const inserted = await pgQuery<{ id: string }>(
        `INSERT INTO public.pms_tasks (
          user_id, list_id, parent_task_id, name, markdown_description,
          status, status_category, priority, due_date,
          time_estimate_minutes, tags, is_shared, is_closed
        ) VALUES (
          $1, $2::uuid, $3::uuid, $4, $5,
          $6, $7::public.pms_status_category, $8, $9::timestamptz,
          $10, ARRAY(SELECT jsonb_array_elements_text($11::jsonb)), $12, $13
        )
        RETURNING id`,
        userId,
        listId,
        parentTaskId,
        name,
        body.markdown_description ? String(body.markdown_description) : null,
        body.status ? String(body.status) : category,
        category,
        priority,
        dueDate,
        estimate,
        JSON.stringify(tags),
        isShared,
        isClosed
      );

      const newTaskId = inserted[0].id;
      if (Array.isArray(body.checklists)) {
        for (let i = 0; i < body.checklists.length; i++) {
          const itemLabel = String(body.checklists[i] || "").trim();
          if (!itemLabel) continue;
          await pgExec(
            `INSERT INTO public.pms_task_checklists (task_id, name, is_completed, sort_order)
             VALUES ($1::uuid, $2, FALSE, $3)`,
            newTaskId,
            itemLabel,
            i
          );
        }
      }

      return NextResponse.json({ ok: true, id: newTaskId });
    }

    if (action === "add_checklist") {
      const taskId = String(body.task_id || "");
      const name = String(body.name || "").trim();
      if (!taskId || !name) {
        return NextResponse.json({ error: "task_id and name required" }, { status: 400 });
      }
      const rows = await pgQuery<PmsChecklistRow>(
        `INSERT INTO public.pms_task_checklists (task_id, name, is_completed, sort_order)
         VALUES (
           $1::uuid,
           $2,
           FALSE,
           COALESCE((SELECT MAX(sort_order) + 1 FROM public.pms_task_checklists WHERE task_id = $1::uuid), 0)
         )
         RETURNING id, task_id, name, is_completed, sort_order`,
        taskId,
        name
      );
      return NextResponse.json({ checklist: rows[0] });
    }

    if (action === "ingest_clickup_token") {
      const apiToken = String(body.apiToken || "").trim();
      if (!apiToken) {
        return NextResponse.json(
          { error: "ClickUp Personal API Token (pk_...) is required" },
          { status: 400 }
        );
      }

      const headers = {
        Authorization: apiToken,
        "Content-Type": "application/json",
      };

      const teamRes = await fetch("https://api.clickup.com/api/v2/team", {
        headers,
        cache: "no-store",
      });
      if (!teamRes.ok) {
        const errText = await teamRes.text();
        return NextResponse.json(
          {
            error: `ClickUp API authentication failed (${teamRes.status}): ${errText.slice(0, 180)}`,
          },
          { status: 400 }
        );
      }
      const teamData = await teamRes.json();
      const teams = Array.isArray(teamData?.teams) ? teamData.teams : [];
      const normalized: NormalizedImportTask[] = [];

      for (const team of teams.slice(0, 2)) {
        const spacesRes = await fetch(
          `https://api.clickup.com/api/v2/team/${team.id}/space?archived=false`,
          { headers, cache: "no-store" }
        );
        if (!spacesRes.ok) continue;
        const spacesData = await spacesRes.json();
        const spaces = Array.isArray(spacesData?.spaces) ? spacesData.spaces : [];

        for (const space of spaces.slice(0, 5)) {
          const allLists: any[] = [];

          const folderlessRes = await fetch(
            `https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`,
            { headers, cache: "no-store" }
          );
          if (folderlessRes.ok) {
            const flData = await folderlessRes.json();
            if (Array.isArray(flData?.lists)) allLists.push(...flData.lists);
          }

          const foldersRes = await fetch(
            `https://api.clickup.com/api/v2/space/${space.id}/folder?archived=false`,
            { headers, cache: "no-store" }
          );
          if (foldersRes.ok) {
            const fData = await foldersRes.json();
            for (const folder of Array.isArray(fData?.folders) ? fData.folders : []) {
              if (Array.isArray(folder?.lists)) {
                allLists.push(...folder.lists);
              }
            }
          }

          for (const lst of allLists.slice(0, 8)) {
            const tasksRes = await fetch(
              `https://api.clickup.com/api/v2/list/${lst.id}/task?subtasks=true&include_closed=true`,
              { headers, cache: "no-store" }
            );
            if (!tasksRes.ok) continue;
            const tData = await tasksRes.json();
            const rawTasks = Array.isArray(tData?.tasks) ? tData.tasks : [];

            for (const rt of rawTasks) {
              const clItems: Array<{ name: string; done: boolean }> = [];
              if (Array.isArray(rt.checklists)) {
                for (const clGroup of rt.checklists) {
                  for (const item of Array.isArray(clGroup?.items) ? clGroup.items : []) {
                    if (item?.name) {
                      clItems.push({
                        name: String(item.name),
                        done: Boolean(item.resolved),
                      });
                    }
                  }
                }
              }

              normalized.push({
                clickupId: `cu_${rt.id}`,
                parentClickupId: rt.parent ? `cu_${rt.parent}` : null,
                listClickupId: `cu_lst_${lst.id}`,
                listName: String(lst.name || "Imported List"),
                spaceName: String(space.name || team.name || "ClickUp Space"),
                name: String(rt.name || "Untitled ClickUp Task").slice(0, 250),
                description: String(rt.markdown_description || rt.description || ""),
                status: String(rt.status?.status || "to do"),
                statusType: String(rt.status?.type || ""),
                priority: translatePriority(rt.priority),
                dueDateIso: rt.due_date
                  ? new Date(Number(rt.due_date)).toISOString()
                  : null,
                estimateMinutes: rt.time_estimate
                  ? Math.round(Number(rt.time_estimate) / 60000)
                  : 0,
                tags: Array.isArray(rt.tags)
                  ? rt.tags.map((tg: any) => String(tg?.name || tg)).filter(Boolean)
                  : [],
                checklists: clItems,
              });
            }
          }
        }
      }

      const result = await upsertNormalizedClickUpTasks(userId, normalized);
      return NextResponse.json({
        ok: true,
        mode: "live_token",
        ...result,
      });
    }

    if (action === "ingest_clickup_payload") {
      const format = String(body.format || "sample");
      const sfx = userId.slice(0, 6).replace(/[^a-zA-Z0-9]/g, "u");

      if (format === "sample") {
        const sampleItems = buildSampleClickUpItems(userId);
        const result = await upsertNormalizedClickUpTasks(userId, sampleItems);
        return NextResponse.json({
          ok: true,
          mode: "sample",
          ...result,
        });
      }

      const rawPayload = String(body.rawPayload || "").trim();
      if (!rawPayload) {
        return NextResponse.json(
          { error: "Paste or upload a ClickUp JSON or CSV export first." },
          { status: 400 }
        );
      }

      const normalized: NormalizedImportTask[] = [];

      if (format === "json") {
        let parsed: any;
        try {
          parsed = JSON.parse(rawPayload);
        } catch {
          return NextResponse.json(
            { error: "Invalid JSON payload. Expected ClickUp JSON array or { tasks: [...] }." },
            { status: 400 }
          );
        }
        const arr = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.tasks)
          ? parsed.tasks
          : [];

        arr.forEach((rt: any, idx: number) => {
          const rawId = String(rt.id || rt.task_id || rt.original_clickup_id || `json_${idx}`);
          const listName = String(
            rt.list?.name || rt.list_name || "ClickUp JSON Import"
          );
          const spaceName = String(
            rt.space?.name || rt.space_name || "Imported ClickUp Space"
          );
          const listCuId = `cu_json_lst_${listName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .slice(0, 32)}_${sfx}`;

          const clItems: Array<{ name: string; done: boolean }> = [];
          if (Array.isArray(rt.checklists)) {
            for (const cg of rt.checklists) {
              if (typeof cg === "string") {
                clItems.push({ name: cg, done: false });
              } else if (Array.isArray(cg?.items)) {
                for (const ci of cg.items) {
                  if (ci?.name) clItems.push({ name: String(ci.name), done: Boolean(ci.resolved || ci.is_completed) });
                }
              } else if (cg?.name) {
                clItems.push({ name: String(cg.name), done: Boolean(cg.done || cg.is_completed) });
              }
            }
          }

          normalized.push({
            clickupId: rawId.startsWith("cu_") ? `${rawId}_${sfx}` : `cu_${rawId}_${sfx}`,
            parentClickupId: rt.parent
              ? String(rt.parent).startsWith("cu_")
                ? `${rt.parent}_${sfx}`
                : `cu_${rt.parent}_${sfx}`
              : null,
            listClickupId: listCuId,
            listName,
            spaceName,
            name: String(rt.name || rt.title || `Imported Task #${idx + 1}`).slice(0, 250),
            description: String(rt.markdown_description || rt.description || ""),
            status: String(
              typeof rt.status === "object" ? rt.status?.status : rt.status || "to do"
            ),
            statusType:
              typeof rt.status === "object" ? String(rt.status?.type || "") : "",
            priority: translatePriority(rt.priority),
            dueDateIso: rt.due_date
              ? isNaN(Number(rt.due_date))
                ? new Date(rt.due_date).toISOString()
                : new Date(Number(rt.due_date)).toISOString()
              : null,
            estimateMinutes: rt.time_estimate_minutes
              ? Number(rt.time_estimate_minutes)
              : rt.time_estimate
              ? Math.round(Number(rt.time_estimate) / 60000)
              : 0,
            tags: Array.isArray(rt.tags)
              ? rt.tags.map((tg: any) => String(tg?.name || tg)).filter(Boolean)
              : [],
            checklists: clItems,
          });
        });
      } else {
        const rows = parseCsvRows(rawPayload);
        rows.forEach((r, idx) => {
          const rawId =
            r.task_id || r.id || r.clickup_id || `csv_${idx + 1}`;
          const listName = r.list_name || r.list || "ClickUp CSV Import";
          const spaceName = r.space_name || r.space || "Imported ClickUp Space";
          const listCuId = `cu_csv_lst_${listName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .slice(0, 32)}_${sfx}`;
          const parentRaw = r.parent_id || r.parent_task_id || "";
          const rawTags = r.tags
            ? r.tags
                .replace(/^\[|\]$/g, "")
                .split(/[;|,]/)
                .map((x) => x.trim())
                .filter(Boolean)
            : [];

          normalized.push({
            clickupId: `cu_${rawId}_${sfx}`,
            parentClickupId: parentRaw ? `cu_${parentRaw}_${sfx}` : null,
            listClickupId: listCuId,
            listName,
            spaceName,
            name: (r.task_name || r.name || r.title || `CSV Task #${idx + 1}`).slice(
              0,
              250
            ),
            description: r.task_content || r.description || "",
            status: r.status || "to do",
            priority: translatePriority(r.priority),
            dueDateIso:
              r.due_date && !isNaN(Date.parse(r.due_date))
                ? new Date(r.due_date).toISOString()
                : null,
            estimateMinutes: Number(r.time_estimate_minutes || r.time_estimate || 0) || 0,
            tags: rawTags,
            checklists: [],
          });
        });
      }

      if (normalized.length === 0) {
        return NextResponse.json(
          { error: "No valid ClickUp tasks discovered in the provided payload." },
          { status: 400 }
        );
      }

      const result = await upsertNormalizedClickUpTasks(userId, normalized);
      return NextResponse.json({
        ok: true,
        mode: format,
        ...result,
      });
    }

    return NextResponse.json({ error: "Unsupported PMS action" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/pms] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute PMS mutation" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = body?.action as string;

    if (action === "move_status") {
      const taskId = String(body.task_id || "");
      const category = body.status_category as PmsStatusCategory;
      if (!taskId || !VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: "Valid task_id and status_category required" },
          { status: 400 }
        );
      }
      const statusLabelMap: Record<PmsStatusCategory, string> = {
        open: "ice box",
        unstarted: "sprint queue",
        active: "active execution",
        blocked: "dependency hold",
        review: "verification gate",
        closed: "verified",
      };
      const isClosed = category === "closed";

      await pgExec(
        `UPDATE public.pms_tasks
         SET status_category = $1::public.pms_status_category,
             status = $2,
             is_closed = $3,
             updated_at = NOW()
         WHERE id = $4::uuid AND user_id = $5`,
        category,
        statusLabelMap[category],
        isClosed,
        taskId,
        userId
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_checklist") {
      const checklistId = String(body.checklist_id || "");
      const isCompleted = Boolean(body.is_completed);
      if (!checklistId) {
        return NextResponse.json({ error: "checklist_id required" }, { status: 400 });
      }
      await pgExec(
        `UPDATE public.pms_task_checklists
         SET is_completed = $1
         WHERE id = $2::uuid`,
        isCompleted,
        checklistId
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "update_task") {
      const taskId = String(body.task_id || "");
      if (!taskId) {
        return NextResponse.json({ error: "task_id required" }, { status: 400 });
      }
      const priority = ["urgent", "high", "normal", "low"].includes(body.priority)
        ? body.priority
        : "normal";
      const isShared = Boolean(body.is_shared);

      await pgExec(
        `UPDATE public.pms_tasks
         SET priority = $1,
             is_shared = $2,
             updated_at = NOW()
         WHERE id = $3::uuid AND user_id = $4`,
        priority,
        isShared,
        taskId,
        userId
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported PATCH action" }, { status: 400 });
  } catch (error: any) {
    console.error("[PATCH /api/pms] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update PMS item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const checklistId = searchParams.get("checklistId");

    if (checklistId) {
      await pgExec(
        `DELETE FROM public.pms_task_checklists WHERE id = $1::uuid`,
        checklistId
      );
      return NextResponse.json({ ok: true });
    }

    if (taskId) {
      await pgExec(
        `DELETE FROM public.pms_tasks WHERE id = $1::uuid AND user_id = $2`,
        taskId,
        userId
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Nothing specified to delete" }, { status: 400 });
  } catch (error: any) {
    console.error("[DELETE /api/pms] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete PMS item" },
      { status: 500 }
    );
  }
}
