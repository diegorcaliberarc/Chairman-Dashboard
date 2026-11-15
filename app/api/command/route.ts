export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";
import {
  LifeDomain,
  CommandNorthStar,
  CommandPhase,
  CommandFrago,
  CommandAarLog,
  PaceTier,
} from "@/lib/commandTypes";

const DEFAULT_CHAIRMAN_UUID = "00000000-0000-0000-0000-000000000001";

function resolveUuid(id?: string | null): string {
  if (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    return id;
  }
  return DEFAULT_CHAIRMAN_UUID;
}

function formatDateIso(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function getMondayIso(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

// GET /api/command?domain=health (optional domain filter)
export async function GET(req: NextRequest) {
  try {
    const rawUserId = await getLivingOsUserId();
    const userId = resolveUuid(rawUserId);

    const { searchParams } = new URL(req.url);
    const domainFilter = searchParams.get("domain") as LifeDomain | null;
    const weekStart = searchParams.get("weekStart") || getMondayIso();

    // 1. Fetch North Stars
    let northStarSql = `
      SELECT id, user_id, domain, title, vision_statement,
             target_metric_label, target_metric_value, current_metric_value,
             metric_unit, target_date, cover_image_url, created_at, updated_at
      FROM public.command_north_stars
      WHERE user_id = $1::uuid
    `;
    const nsParams: any[] = [userId];

    if (domainFilter) {
      northStarSql += ` AND domain = $2`;
      nsParams.push(domainFilter);
    }
    northStarSql += ` ORDER BY domain ASC`;

    const northStarsRows = await pgQuery<any>(northStarSql, ...nsParams);

    // 2. Fetch Phases for each North Star
    const northStars: CommandNorthStar[] = [];
    for (const ns of northStarsRows) {
      const phaseRows = await pgQuery<any>(
        `SELECT id, user_id, north_star_id, phase_number, title, description,
                status, sequence_type, target_completion_date, reference_strips,
                created_at, updated_at
         FROM public.command_phases
         WHERE north_star_id = $1::uuid AND user_id = $2::uuid
         ORDER BY phase_number ASC`,
        ns.id,
        userId
      );

      const phases: CommandPhase[] = phaseRows.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        north_star_id: p.north_star_id,
        phase_number: Number(p.phase_number),
        title: p.title,
        description: p.description,
        status: p.status,
        sequence_type: p.sequence_type,
        target_completion_date: p.target_completion_date ? formatDateIso(p.target_completion_date) : null,
        reference_strips: Array.isArray(p.reference_strips) ? p.reference_strips : [],
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      northStars.push({
        id: ns.id,
        user_id: ns.user_id,
        domain: ns.domain,
        title: ns.title,
        vision_statement: ns.vision_statement,
        target_metric_label: ns.target_metric_label,
        target_metric_value: Number(ns.target_metric_value),
        current_metric_value: Number(ns.current_metric_value),
        metric_unit: ns.metric_unit,
        target_date: ns.target_date ? formatDateIso(ns.target_date) : null,
        cover_image_url: ns.cover_image_url,
        phases,
        created_at: ns.created_at,
        updated_at: ns.updated_at,
      });
    }

    // 3. Fetch Active FRAGOs for this week
    let fragoSql = `
      SELECT id, user_id, domain, week_start_date, situation, mission,
             execution, sustainment, command_signal, active_pace_tier,
             pace_plans, created_at, updated_at
      FROM public.command_fragos
      WHERE user_id = $1::uuid AND week_start_date = $2::date
    `;
    const fragoRows = await pgQuery<any>(fragoSql, userId, weekStart);

    const fragos: Record<string, CommandFrago> = {};
    for (const f of fragoRows) {
      fragos[f.domain] = {
        id: f.id,
        user_id: f.user_id,
        domain: f.domain,
        week_start_date: formatDateIso(f.week_start_date),
        situation: f.situation || "",
        mission: f.mission || "",
        execution: f.execution || "",
        sustainment: f.sustainment || "",
        command_signal: f.command_signal || "",
        active_pace_tier: f.active_pace_tier || "primary",
        pace_plans: f.pace_plans || { primary: "", alternate: "", contingency: "", emergency: "" },
        created_at: f.created_at,
        updated_at: f.updated_at,
      };
    }

    // 4. Fetch Recent AAR Logs
    const aarRows = await pgQuery<any>(
      `SELECT id, user_id, week_start_date, domain, audited_grade, what_happened,
              what_went_wrong, root_cause, failure_classification, lessons_learned,
              actionable_fix, pms_tasks_created, created_at, updated_at
       FROM public.command_aar_logs
       WHERE user_id = $1::uuid
       ORDER BY week_start_date DESC, created_at DESC
       LIMIT 30`,
      userId
    );

    const aarLogs: CommandAarLog[] = aarRows.map((a) => ({
      id: a.id,
      user_id: a.user_id,
      week_start_date: formatDateIso(a.week_start_date),
      domain: a.domain,
      audited_grade: a.audited_grade,
      what_happened: a.what_happened,
      what_went_wrong: a.what_went_wrong,
      root_cause: a.root_cause,
      failure_classification: a.failure_classification,
      lessons_learned: a.lessons_learned,
      actionable_fix: a.actionable_fix,
      pms_tasks_created: Array.isArray(a.pms_tasks_created) ? a.pms_tasks_created : [],
      created_at: a.created_at,
      updated_at: a.updated_at,
    }));

    return NextResponse.json({
      success: true,
      weekStart,
      northStars,
      fragos,
      aarLogs,
    });
  } catch (error: any) {
    console.error("GET /api/command error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/command - Action Router
export async function POST(req: NextRequest) {
  try {
    const rawUserId = await getLivingOsUserId();
    const userId = resolveUuid(rawUserId);

    const body = await req.json();
    const action = body.action;

    // --- Action: save_north_star ---
    if (action === "save_north_star") {
      const {
        domain,
        title,
        vision_statement,
        target_metric_label,
        target_metric_value,
        current_metric_value,
        metric_unit,
        target_date,
        cover_image_url,
      } = body;

      const rows = await pgQuery<any>(
        `INSERT INTO public.command_north_stars (
          user_id, domain, title, vision_statement, target_metric_label,
          target_metric_value, current_metric_value, metric_unit, target_date, cover_image_url
        ) VALUES (
          $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        ON CONFLICT (user_id, domain) DO UPDATE
        SET title = EXCLUDED.title,
            vision_statement = EXCLUDED.vision_statement,
            target_metric_label = EXCLUDED.target_metric_label,
            target_metric_value = EXCLUDED.target_metric_value,
            current_metric_value = EXCLUDED.current_metric_value,
            metric_unit = EXCLUDED.metric_unit,
            target_date = EXCLUDED.target_date,
            cover_image_url = EXCLUDED.cover_image_url,
            updated_at = NOW()
        RETURNING *;`,
        userId,
        domain,
        title,
        vision_statement || "",
        target_metric_label || "Target",
        Number(target_metric_value || 0),
        Number(current_metric_value || 0),
        metric_unit || "",
        target_date || null,
        cover_image_url || null
      );

      return NextResponse.json({ success: true, northStar: rows[0] });
    }

    // --- Action: save_phase ---
    if (action === "save_phase") {
      const {
        id,
        north_star_id,
        phase_number,
        title,
        description,
        status,
        sequence_type,
        target_completion_date,
        reference_strips,
      } = body;

      if (id) {
        // Update existing
        const rows = await pgQuery<any>(
          `UPDATE public.command_phases
           SET phase_number = COALESCE($1, phase_number),
               title = COALESCE($2, title),
               description = COALESCE($3, description),
               status = COALESCE($4, status),
               sequence_type = COALESCE($5, sequence_type),
               target_completion_date = $6,
               reference_strips = $7::jsonb,
               updated_at = NOW()
           WHERE id = $8::uuid AND user_id = $9::uuid
           RETURNING *;`,
          phase_number,
          title,
          description,
          status,
          sequence_type,
          target_completion_date || null,
          JSON.stringify(reference_strips || []),
          id,
          userId
        );
        return NextResponse.json({ success: true, phase: rows[0] });
      } else {
        // Insert new phase
        const rows = await pgQuery<any>(
          `INSERT INTO public.command_phases (
            user_id, north_star_id, phase_number, title, description,
            status, sequence_type, target_completion_date, reference_strips
          ) VALUES (
            $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9::jsonb
          )
          RETURNING *;`,
          userId,
          north_star_id,
          Number(phase_number || 1),
          title,
          description || "",
          status || "not_started",
          sequence_type || "bottleneck",
          target_completion_date || null,
          JSON.stringify(reference_strips || [])
        );
        return NextResponse.json({ success: true, phase: rows[0] });
      }
    }

    // --- Action: delete_phase ---
    if (action === "delete_phase") {
      const { id } = body;
      await pgExec(
        `DELETE FROM public.command_phases WHERE id = $1::uuid AND user_id = $2::uuid`,
        id,
        userId
      );
      return NextResponse.json({ success: true, message: "Phase deleted" });
    }

    // --- Action: save_frago ---
    if (action === "save_frago") {
      const {
        domain,
        week_start_date,
        situation,
        mission,
        execution,
        sustainment,
        command_signal,
        active_pace_tier,
        pace_plans,
      } = body;

      const rows = await pgQuery<any>(
        `INSERT INTO public.command_fragos (
          user_id, domain, week_start_date, situation, mission,
          execution, sustainment, command_signal, active_pace_tier, pace_plans
        ) VALUES (
          $1::uuid, $2, $3::date, $4, $5, $6, $7, $8, $9, $10::jsonb
        )
        ON CONFLICT (user_id, domain, week_start_date) DO UPDATE
        SET situation = EXCLUDED.situation,
            mission = EXCLUDED.mission,
            execution = EXCLUDED.execution,
            sustainment = EXCLUDED.sustainment,
            command_signal = EXCLUDED.command_signal,
            active_pace_tier = EXCLUDED.active_pace_tier,
            pace_plans = EXCLUDED.pace_plans,
            updated_at = NOW()
        RETURNING *;`,
        userId,
        domain,
        week_start_date,
        situation || "",
        mission || "",
        execution || "",
        sustainment || "",
        command_signal || "",
        active_pace_tier || "primary",
        JSON.stringify(pace_plans || {})
      );

      return NextResponse.json({ success: true, frago: rows[0] });
    }

    // --- Action: switch_pace ---
    if (action === "switch_pace") {
      const { domain, week_start_date, pace_tier } = body;
      const rows = await pgQuery<any>(
        `UPDATE public.command_fragos
         SET active_pace_tier = $1,
             updated_at = NOW()
         WHERE user_id = $2::uuid AND domain = $3 AND week_start_date = $4::date
         RETURNING *;`,
        pace_tier,
        userId,
        domain,
        week_start_date
      );

      // Cross-Module Sync: Insert/Update calendar_events block for the Google Calendar Grid & Circadian Solar Arc
      const todayIso = new Date().toISOString().slice(0, 10);
      const paceColorMap: Record<string, string> = {
        primary: "#10b981",
        alternate: "#38bdf8",
        contingency: "#f59e0b",
        emergency: "#f43f5e",
      };

      try {
        const paceTitle = `[PACE ${String(pace_tier).toUpperCase()}] ${String(domain).toUpperCase()} Re-Route Engaged`;
        const startTime = `${todayIso}T08:00:00Z`;
        const endTime = `${todayIso}T09:00:00Z`;

        await pgExec(
          `INSERT INTO public.calendar_events (
            user_id, title, description, start_time, end_time, all_day,
            category, color_hex
          ) VALUES (
            $1::uuid, $2, $3, $4::timestamptz, $5::timestamptz, false, 'work'::calendar_category_enum, $6
          );`,
          userId,
          paceTitle,
          `Automated PACE Mode Switch from Command Center to Tier: ${String(pace_tier).toUpperCase()}`,
          startTime,
          endTime,
          paceColorMap[pace_tier] || "#f59e0b"
        );
      } catch (calErr) {
        console.warn("Cross-module calendar_events update advisory:", calErr);
      }

      return NextResponse.json({ success: true, updatedFrago: rows[0], pace_tier });
    }

    // --- Action: save_aar ---
    if (action === "save_aar") {
      const {
        week_start_date,
        domain,
        audited_grade,
        what_happened,
        what_went_wrong,
        root_cause,
        failure_classification,
        lessons_learned,
        actionable_fix,
        pms_tasks_created,
      } = body;

      const rows = await pgQuery<any>(
        `INSERT INTO public.command_aar_logs (
          user_id, week_start_date, domain, audited_grade, what_happened,
          what_went_wrong, root_cause, failure_classification, lessons_learned,
          actionable_fix, pms_tasks_created
        ) VALUES (
          $1::uuid, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb
        )
        RETURNING *;`,
        userId,
        week_start_date,
        domain,
        audited_grade || "B",
        what_happened || "",
        what_went_wrong || "",
        root_cause || "",
        failure_classification || "execution",
        lessons_learned || "",
        actionable_fix || "",
        JSON.stringify(pms_tasks_created || [])
      );

      return NextResponse.json({ success: true, aarLog: rows[0] });
    }

    // --- Action: push_frago_to_pms ---
    if (action === "push_frago_to_pms") {
      const { taskTitles, domain, sequenceType = "bottleneck" } = body;
      if (!Array.isArray(taskTitles) || taskTitles.length === 0) {
        return NextResponse.json({ success: false, error: "No tasks provided" }, { status: 400 });
      }

      // Find standard PMS List
      const listRows = await pgQuery<any>(
        `SELECT id FROM public.pms_lists ORDER BY created_at ASC LIMIT 1`
      );
      const defaultListId = listRows.length > 0 ? listRows[0].id : null;

      if (!defaultListId) {
        return NextResponse.json({ success: false, error: "No PMS List available" }, { status: 400 });
      }

      const priority = sequenceType === "bottleneck" ? "urgent" : "normal";
      const tags = [
        sequenceType === "bottleneck" ? "BOTTLENECK" : "TAG-TEAM",
        "COMMAND_FRAGO",
        String(domain).toUpperCase(),
      ];

      const createdTasks: any[] = [];
      for (const tTitle of taskTitles) {
        if (!tTitle || !tTitle.trim()) continue;
        const taskRows = await pgQuery<any>(
          `INSERT INTO public.pms_tasks (
            user_id, list_id, name, markdown_description, status, status_category,
            priority, tags, is_shared, is_closed, created_at, updated_at
          ) VALUES (
            $1, $2::uuid, $3, $4, 'TODO', 'not_started', $5, $6, false, false, NOW(), NOW()
          )
          RETURNING id, name, priority, tags;`,
          rawUserId,
          defaultListId,
          tTitle.trim(),
          `Generated from Command Center FRAGO / AAR (${domain} - ${sequenceType.toUpperCase()})`,
          priority,
          tags
        );
        if (taskRows.length > 0) {
          createdTasks.push(taskRows[0]);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully pushed ${createdTasks.length} tasks to Pristine PMS`,
        createdTasks,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/command error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
