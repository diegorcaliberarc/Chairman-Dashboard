import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export type PodType = "couple" | "family" | "business_team";

export interface SharedPodRow {
  id: string;
  name: string;
  pod_type: PodType;
  owner_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface PodMembershipRow {
  id: string;
  pod_id: string;
  user_id: string;
  role: "owner" | "partner" | "admin" | "member" | "dependent";
  display_alias: string;
  avatar_url: string | null;
  active_streak_days: number;
  today_completed_tasks_count: number;
  today_workout_completed: boolean;
  current_status: string | null;
  joined_at: string;
}

export interface PodConsentGrantRow {
  id: string;
  pod_id: string;
  grantor_user_id: string;
  grantee_user_id: string;
  share_finances: boolean;
  share_finance_transactions: boolean;
  share_pms_tasks: boolean;
  share_all_tasks: boolean;
  share_calendar_events: boolean;
  share_calendar_details: boolean;
  share_nutrition_macros: boolean;
  share_biometrics_workouts: boolean;
  share_biometrics_health_stats: boolean;
  share_trading_summary: boolean;
  updated_at: string;
}

export interface PodTaskItem {
  id: string;
  pod_type: PodType;
  name: string;
  description: string | null;
  status_category: "unstarted" | "active" | "blocked" | "review" | "closed";
  priority: string;
  assignee: string;
  points: number;
  tags: string[];
}

const CONSENT_FIELDS = [
  "share_finances",
  "share_finance_transactions",
  "share_pms_tasks",
  "share_all_tasks",
  "share_calendar_events",
  "share_calendar_details",
  "share_nutrition_macros",
  "share_biometrics_workouts",
  "share_biometrics_health_stats",
  "share_trading_summary",
] as const;

async function ensureSeededPods(userId: string) {
  const existing = await pgQuery<{ pod_type: PodType }>(
    `SELECT pod_type::text AS pod_type FROM public.shared_pods WHERE owner_id = $1`,
    userId
  );
  const existingTypes = new Set(existing.map((r) => r.pod_type));

  // 1. Tier 1: Couple Pod ("His & Hers" 1:1)
  if (!existingTypes.has("couple")) {
    const coupleRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.shared_pods (name, pod_type, owner_id, max_members)
       VALUES ('His & Hers • Sovereign Sanctuary', 'couple'::public.pod_type_enum, $1, 2)
       RETURNING id`,
      userId
    );
    const coupleId = coupleRows[0].id;

    await pgExec(
      `INSERT INTO public.pod_memberships (
        pod_id, user_id, role, display_alias, active_streak_days,
        today_completed_tasks_count, today_workout_completed, current_status
      ) VALUES
        ($1::uuid, $2, 'owner'::public.pod_member_role, 'Diego (His)', 29, 7, TRUE, 'Deep Work — Sovereign Architecture'),
        ($1::uuid, 'partner-elena', 'partner'::public.pod_member_role, 'Elena (Hers)', 24, 6, TRUE, 'Design Studio & Reformer Pilates')
      ON CONFLICT (pod_id, user_id) DO NOTHING`,
      coupleId,
      userId
    );

    // Outgoing grant: Diego -> Elena
    await pgExec(
      `INSERT INTO public.pod_consent_grants (
        pod_id, grantor_user_id, grantee_user_id,
        share_finances, share_finance_transactions,
        share_pms_tasks, share_all_tasks,
        share_calendar_events, share_calendar_details,
        share_nutrition_macros,
        share_biometrics_workouts, share_biometrics_health_stats,
        share_trading_summary
      ) VALUES (
        $1::uuid, $2, 'partner-elena',
        TRUE, FALSE,
        TRUE, FALSE,
        TRUE, TRUE,
        TRUE,
        TRUE, TRUE,
        TRUE
      )
      ON CONFLICT (pod_id, grantor_user_id, grantee_user_id) DO NOTHING`,
      coupleId,
      userId
    );

    // Incoming grant: Elena -> Diego (starts with share_calendar_details = FALSE to demonstrate live Busy redaction out-of-the-box!)
    await pgExec(
      `INSERT INTO public.pod_consent_grants (
        pod_id, grantor_user_id, grantee_user_id,
        share_finances, share_finance_transactions,
        share_pms_tasks, share_all_tasks,
        share_calendar_events, share_calendar_details,
        share_nutrition_macros,
        share_biometrics_workouts, share_biometrics_health_stats,
        share_trading_summary
      ) VALUES (
        $1::uuid, 'partner-elena', $2,
        TRUE, FALSE,
        TRUE, FALSE,
        TRUE, FALSE,
        TRUE,
        TRUE, FALSE,
        FALSE
      )
      ON CONFLICT (pod_id, grantor_user_id, grantee_user_id) DO NOTHING`,
      coupleId,
      userId
    );
  }

  // 2. Tier 2: Family Pod (Rodriguez Household)
  if (!existingTypes.has("family")) {
    const famRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.shared_pods (name, pod_type, owner_id, max_members)
       VALUES ('Rodriguez Household Collective', 'family'::public.pod_type_enum, $1, 6)
       RETURNING id`,
      userId
    );
    const famId = famRows[0].id;

    await pgExec(
      `INSERT INTO public.pod_memberships (
        pod_id, user_id, role, display_alias, active_streak_days,
        today_completed_tasks_count, today_workout_completed, current_status
      ) VALUES
        ($1::uuid, $2, 'owner'::public.pod_member_role, 'Diego Rodriguez', 29, 7, TRUE, 'Estate Command & Deep Work'),
        ($1::uuid, 'partner-elena', 'partner'::public.pod_member_role, 'Elena Rodriguez', 24, 6, TRUE, 'Household Logistics & Studio'),
        ($1::uuid, 'child-maximiliano', 'dependent'::public.pod_member_role, 'Maximiliano', 18, 5, TRUE, 'School (08:00–15:00) & Soccer')
      ON CONFLICT (pod_id, user_id) DO NOTHING`,
      famId,
      userId
    );

    await pgExec(
      `INSERT INTO public.pod_consent_grants (
        pod_id, grantor_user_id, grantee_user_id,
        share_finances, share_finance_transactions,
        share_pms_tasks, share_all_tasks,
        share_calendar_events, share_calendar_details,
        share_nutrition_macros,
        share_biometrics_workouts, share_biometrics_health_stats,
        share_trading_summary
      ) VALUES (
        $1::uuid, $2, 'family-collective',
        FALSE, FALSE,
        TRUE, FALSE,
        TRUE, TRUE,
        TRUE,
        TRUE, FALSE,
        FALSE
      )
      ON CONFLICT (pod_id, grantor_user_id, grantee_user_id) DO NOTHING`,
      famId,
      userId
    );
  }

  // 3. Tier 3: Business & Team Pod (Pristine Tech Team)
  if (!existingTypes.has("business_team")) {
    const bizRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.shared_pods (name, pod_type, owner_id, max_members)
       VALUES ('Pristine Tech Team', 'business_team'::public.pod_type_enum, $1, 12)
       RETURNING id`,
      userId
    );
    const bizId = bizRows[0].id;

    await pgExec(
      `INSERT INTO public.pod_memberships (
        pod_id, user_id, role, display_alias, active_streak_days,
        today_completed_tasks_count, today_workout_completed, current_status
      ) VALUES
        ($1::uuid, $2, 'owner'::public.pod_member_role, 'Diego • Principal Architect', 29, 8, FALSE, 'Shipping Living OS Architecture'),
        ($1::uuid, 'team-marcus', 'admin'::public.pod_member_role, 'Marcus Vance • Systems Lead', 19, 6, FALSE, 'PostgreSQL RLS & Edge API'),
        ($1::uuid, 'team-aria', 'member'::public.pod_member_role, 'Aria Chen • UI/Spatial Eng', 22, 5, FALSE, 'Circadian SVG & ShaderPolish'),
        ($1::uuid, 'team-devon', 'member'::public.pod_member_role, 'Devon Brooks • QA & Infra', 15, 4, FALSE, 'ClickUp Migration Verification')
      ON CONFLICT (pod_id, user_id) DO NOTHING`,
      bizId,
      userId
    );

    // Zero personal biometrics/finances exposed in Business Team Pod
    await pgExec(
      `INSERT INTO public.pod_consent_grants (
        pod_id, grantor_user_id, grantee_user_id,
        share_finances, share_finance_transactions,
        share_pms_tasks, share_all_tasks,
        share_calendar_events, share_calendar_details,
        share_nutrition_macros,
        share_biometrics_workouts, share_biometrics_health_stats,
        share_trading_summary
      ) VALUES (
        $1::uuid, $2, 'pristine-tech-team',
        FALSE, FALSE,
        TRUE, FALSE,
        TRUE, FALSE,
        FALSE,
        FALSE, FALSE,
        FALSE
      )
      ON CONFLICT (pod_id, grantor_user_id, grantee_user_id) DO NOTHING`,
      bizId,
      userId
    );
  }

  // Seed Pod Chores & Business Sprint Tasks into pms_lists / pms_tasks if missing
  const sfx = userId.slice(0, 6).replace(/[^a-zA-Z0-9]/g, "p");
  const podListCuId = `pod_collective_board_${sfx}`;
  const existingPodList = await pgQuery<{ id: string }>(
    `SELECT id FROM public.pms_lists WHERE original_clickup_list_id = $1 LIMIT 1`,
    podListCuId
  );

  if (!existingPodList[0]) {
    const listInserted = await pgQuery<{ id: string }>(
      `INSERT INTO public.pms_lists (user_id, name, space_name, original_clickup_list_id)
       VALUES ($1, 'Shared Pod Chores & Team Sprint', 'Collective Pods', $2)
       RETURNING id`,
      userId,
      podListCuId
    );
    const podListId = listInserted[0].id;

    const initialPodTasks: Array<{
      cuId: string;
      name: string;
      desc: string;
      cat: "unstarted" | "active" | "blocked" | "review" | "closed";
      priority: string;
      tags: string[];
    }> = [
      // Household / Couple Chores
      {
        cuId: `pod_chore_1_${sfx}`,
        name: "Prep Weekly MacroOps Containers & Organic Produce Wash",
        desc: "Portion lean bison, jasmine rice, and Max's school lunch boxes.",
        cat: "active",
        priority: "high",
        tags: ["pod:family", "pod:couple", "assignee:Diego", "points:3", "culinary"],
      },
      {
        cuId: `pod_chore_2_${sfx}`,
        name: "Sanitize Canine Orthopedic Bedding & Restock Comet Crash Cart",
        desc: "Wash crate liners on allergen cycle and verify 14-day Gabapentin count.",
        cat: "unstarted",
        priority: "urgent",
        tags: ["pod:family", "pod:couple", "assignee:Elena", "points:3", "canine-care"],
      },
      {
        cuId: `pod_chore_3_${sfx}`,
        name: "Organize Soccer Gear Bag & Complete 30m Math Practice",
        desc: "Pack cleats, shin guards, and refill 32oz insulated water bottle.",
        cat: "active",
        priority: "normal",
        tags: ["pod:family", "assignee:Maximiliano", "points:2", "school"],
      },
      {
        cuId: `pod_chore_4_${sfx}`,
        name: "Evening Patio Reset & Husky Brush-Out Session",
        desc: "Undercoat rake for Nova & Astro + lock garage gym perimeter.",
        cat: "closed",
        priority: "normal",
        tags: ["pod:family", "pod:couple", "assignee:Diego", "points:2", "estate"],
      },
      {
        cuId: `pod_chore_5_${sfx}`,
        name: "Friday Date-Night Reservation & Babysitter Sync",
        desc: "Aligned with 19:30 post-Comet medication window.",
        cat: "unstarted",
        priority: "high",
        tags: ["pod:couple", "assignee:Elena", "points:2", "sanctuary"],
      },
      // Business Team Sprint Tasks (Pristine Tech Team)
      {
        cuId: `pod_biz_1_${sfx}`,
        name: "Enforce Zero-Trust Pod Consent RLS Policies Across API Routes",
        desc: "Ensure business_team pod strips all personal biometrics, nutrition, and private ledgers.",
        cat: "active",
        priority: "urgent",
        tags: [
          "pod:business_team",
          "assignee:Diego • Principal Architect",
          "points:8",
          "security",
        ],
      },
      {
        cuId: `pod_biz_2_${sfx}`,
        name: "Optimize pgQuery Connection Pooling Under Concurrent SSR Load",
        desc: "Benchmark PgBouncer transaction pooling latency < 18ms p95.",
        cat: "review",
        priority: "high",
        tags: [
          "pod:business_team",
          "assignee:Marcus Vance • Systems Lead",
          "points:5",
          "postgres",
        ],
      },
      {
        cuId: `pod_biz_3_${sfx}`,
        name: "Waiting on Third-Party OAuth Production Callback Whitelist",
        desc: "External DNS TXT verification propagating before production cutover.",
        cat: "blocked",
        priority: "high",
        tags: [
          "pod:business_team",
          "assignee:Devon Brooks • QA & Infra",
          "points:3",
          "infra-blocker",
        ],
      },
      {
        cuId: `pod_biz_4_${sfx}`,
        name: "Ship Concentric Circadian SVG Arc Renderer & Solar Needle",
        desc: "Zero-dependency vector dial supporting midnight wrap-around.",
        cat: "closed",
        priority: "normal",
        tags: [
          "pod:business_team",
          "assignee:Aria Chen • UI/Spatial Eng",
          "points:5",
          "ui",
        ],
      },
    ];

    for (const pt of initialPodTasks) {
      await pgExec(
        `INSERT INTO public.pms_tasks (
          user_id, list_id, original_clickup_id, name, markdown_description,
          status, status_category, priority, time_estimate_minutes,
          tags, is_shared, is_closed
        ) VALUES (
          $1, $2::uuid, $3, $4, $5,
          $6, $7::public.pms_status_category, $8, 45,
          ARRAY(SELECT jsonb_array_elements_text($9::jsonb)),
          TRUE, $10
        )
        ON CONFLICT (original_clickup_id) DO NOTHING`,
        userId,
        podListId,
        pt.cuId,
        pt.name,
        pt.desc,
        pt.cat,
        pt.cat,
        pt.priority,
        JSON.stringify(pt.tags),
        pt.cat === "closed"
      );
    }
  }
}

function parsePodTask(row: any): PodTaskItem {
  const tags: string[] = Array.isArray(row.tags) ? row.tags : [];
  const assigneeTag = tags.find((t) => t.startsWith("assignee:"));
  const pointsTag = tags.find((t) => t.startsWith("points:"));
  const isBiz = tags.includes("pod:business_team");
  const isCoupleOnly =
    tags.includes("pod:couple") && !tags.includes("pod:family");

  return {
    id: row.id,
    pod_type: isBiz ? "business_team" : isCoupleOnly ? "couple" : "family",
    name: row.name,
    description: row.markdown_description,
    status_category: row.status_category,
    priority: row.priority || "normal",
    assignee: assigneeTag ? assigneeTag.replace("assignee:", "") : "Unassigned",
    points: pointsTag ? Number(pointsTag.replace("points:", "")) || 2 : 2,
    tags,
  };
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await ensureSeededPods(userId);

    const pods = await pgQuery<SharedPodRow>(
      `SELECT
         id, name, pod_type::text AS pod_type,
         owner_id, max_members, created_at, updated_at
       FROM public.shared_pods
       WHERE owner_id = $1
       ORDER BY
         CASE pod_type::text
           WHEN 'couple' THEN 1
           WHEN 'family' THEN 2
           WHEN 'business_team' THEN 3
           ELSE 4
         END ASC`,
      userId
    );

    const podIds = pods.map((p) => p.id);
    let memberships: PodMembershipRow[] = [];
    let consents: PodConsentGrantRow[] = [];

    if (podIds.length > 0) {
      memberships = await pgQuery<PodMembershipRow>(
        `SELECT
           id, pod_id, user_id, role::text AS role,
           display_alias, avatar_url, active_streak_days,
           today_completed_tasks_count, today_workout_completed,
           current_status, joined_at
         FROM public.pod_memberships
         WHERE pod_id IN (
           SELECT (jsonb_array_elements_text($1::jsonb))::uuid
         )
         ORDER BY joined_at ASC`,
        JSON.stringify(podIds)
      );

      consents = await pgQuery<PodConsentGrantRow>(
        `SELECT
           id, pod_id, grantor_user_id, grantee_user_id,
           share_finances, share_finance_transactions,
           share_pms_tasks, share_all_tasks,
           share_calendar_events, share_calendar_details,
           share_nutrition_macros,
           share_biometrics_workouts, share_biometrics_health_stats,
           share_trading_summary, updated_at
         FROM public.pod_consent_grants
         WHERE pod_id IN (
           SELECT (jsonb_array_elements_text($1::jsonb))::uuid
         )
         ORDER BY updated_at DESC`,
        JSON.stringify(podIds)
      );
    }

    const rawPodTasks = await pgQuery<any>(
      `SELECT
         id, name, markdown_description,
         status_category::text AS status_category,
         priority, COALESCE(tags, ARRAY[]::text[]) AS tags
       FROM public.pms_tasks
       WHERE user_id = $1 AND is_shared = TRUE
       ORDER BY created_at DESC`,
      userId
    );

    return NextResponse.json({
      currentUserId: userId,
      pods,
      memberships,
      consents,
      podTasks: rawPodTasks.map(parsePodTask),
    });
  } catch (error: any) {
    console.error("[GET /api/pods] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load Shared Pod Engine" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "update_consent") {
      const consentId = String(body.consent_id || "");
      const updates = body.updates as Record<string, boolean> | undefined;
      if (!consentId || !updates) {
        return NextResponse.json(
          { error: "consent_id and updates object required" },
          { status: 400 }
        );
      }

      // Verify pod belongs to user
      const check = await pgQuery<{ id: string; pod_type: string }>(
        `SELECT c.id, p.pod_type::text AS pod_type
         FROM public.pod_consent_grants c
         JOIN public.shared_pods p ON p.id = c.pod_id
         WHERE c.id = $1::uuid AND p.owner_id = $2
         LIMIT 1`,
        consentId,
        userId
      );
      if (!check[0]) {
        return NextResponse.json({ error: "Consent record not found" }, { status: 404 });
      }

      // Enforce hard Zero-Trust boundary on business_team: personal health/finance/trading can never be enabled
      const isBusinessPod = check[0].pod_type === "business_team";
      const blockedInBusiness = new Set([
        "share_finances",
        "share_finance_transactions",
        "share_nutrition_macros",
        "share_biometrics_workouts",
        "share_biometrics_health_stats",
        "share_trading_summary",
      ]);

      for (const field of CONSENT_FIELDS) {
        if (typeof updates[field] === "boolean") {
          const safeVal =
            isBusinessPod && blockedInBusiness.has(field) ? false : updates[field];
          await pgExec(
            `UPDATE public.pod_consent_grants
             SET ${field} = $1, updated_at = NOW()
             WHERE id = $2::uuid`,
            safeVal,
            consentId
          );
        }
      }

      const refreshed = await pgQuery<PodConsentGrantRow>(
        `SELECT
           id, pod_id, grantor_user_id, grantee_user_id,
           share_finances, share_finance_transactions,
           share_pms_tasks, share_all_tasks,
           share_calendar_events, share_calendar_details,
           share_nutrition_macros,
           share_biometrics_workouts, share_biometrics_health_stats,
           share_trading_summary, updated_at
         FROM public.pod_consent_grants
         WHERE id = $1::uuid`,
        consentId
      );

      return NextResponse.json({ ok: true, consent: refreshed[0] });
    }

    if (action === "update_pod_task") {
      const taskId = String(body.task_id || "");
      if (!taskId) {
        return NextResponse.json({ error: "task_id required" }, { status: 400 });
      }

      if (body.status_category) {
        const cat = String(body.status_category);
        await pgExec(
          `UPDATE public.pms_tasks
           SET status_category = $1::public.pms_status_category,
               status = $1,
               is_closed = ($1 = 'closed'),
               updated_at = NOW()
           WHERE id = $2::uuid AND user_id = $3`,
          cat,
          taskId,
          userId
        );
      }

      if (body.assignee) {
        const existing = await pgQuery<{ tags: string[] }>(
          `SELECT COALESCE(tags, ARRAY[]::text[]) AS tags
           FROM public.pms_tasks
           WHERE id = $1::uuid AND user_id = $2`,
          taskId,
          userId
        );
        const filtered = (existing[0]?.tags || []).filter(
          (t) => !t.startsWith("assignee:")
        );
        filtered.push(`assignee:${String(body.assignee)}`);
        await pgExec(
          `UPDATE public.pms_tasks
           SET tags = ARRAY(SELECT jsonb_array_elements_text($1::jsonb)),
               updated_at = NOW()
           WHERE id = $2::uuid AND user_id = $3`,
          JSON.stringify(filtered),
          taskId,
          userId
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_member_workout") {
      const membershipId = String(body.membership_id || "");
      const completed = Boolean(body.completed);
      if (!membershipId) {
        return NextResponse.json({ error: "membership_id required" }, { status: 400 });
      }
      await pgExec(
        `UPDATE public.pod_memberships
         SET today_workout_completed = $1
         WHERE id = $2::uuid`,
        completed,
        membershipId
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported PATCH action" }, { status: 400 });
  } catch (error: any) {
    console.error("[PATCH /api/pods] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update Pod state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create_pod_task") {
      const name = String(body.name || "").trim();
      const podType = (body.pod_type as PodType) || "family";
      const assignee = String(body.assignee || "Diego").trim();
      const priority = String(body.priority || "normal");
      const points = Number(body.points || 3);

      if (!name) {
        return NextResponse.json({ error: "Task title required" }, { status: 400 });
      }

      const sfx = userId.slice(0, 6).replace(/[^a-zA-Z0-9]/g, "p");
      const podListCuId = `pod_collective_board_${sfx}`;
      const listRows = await pgQuery<{ id: string }>(
        `INSERT INTO public.pms_lists (user_id, name, space_name, original_clickup_list_id)
         VALUES ($1, 'Shared Pod Chores & Team Sprint', 'Collective Pods', $2)
         ON CONFLICT (original_clickup_list_id)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        userId,
        podListCuId
      );
      const listId = listRows[0].id;

      const tags = [
        `pod:${podType}`,
        ...(podType === "couple" ? ["pod:family"] : []),
        `assignee:${assignee}`,
        `points:${points}`,
      ];

      const inserted = await pgQuery<any>(
        `INSERT INTO public.pms_tasks (
          user_id, list_id, name, markdown_description,
          status, status_category, priority, time_estimate_minutes,
          tags, is_shared, is_closed
        ) VALUES (
          $1, $2::uuid, $3, $4,
          'unstarted', 'unstarted'::public.pms_status_category, $5, 30,
          ARRAY(SELECT jsonb_array_elements_text($6::jsonb)),
          TRUE, FALSE
        )
        RETURNING
          id, name, markdown_description,
          status_category::text AS status_category,
          priority, COALESCE(tags, ARRAY[]::text[]) AS tags`,
        userId,
        listId,
        name,
        body.description ? String(body.description) : null,
        priority,
        JSON.stringify(tags)
      );

      return NextResponse.json({
        ok: true,
        podTask: parsePodTask(inserted[0]),
      });
    }

    return NextResponse.json({ error: "Unsupported POST action" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/pods] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Pod item" },
      { status: 500 }
    );
  }
}
