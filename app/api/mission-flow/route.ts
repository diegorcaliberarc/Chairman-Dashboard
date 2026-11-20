export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

async function ensureMissionFlowSchema() {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS mission_flows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'master',
      title TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS aar_lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      mission_title TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'master',
      what_worked TEXT NOT NULL,
      what_broke TEXT NOT NULL,
      rule_change TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    await ensureMissionFlowSchema();

    const missions = await pgQuery<any>(
      `SELECT id, domain, title, payload, status, created_at, updated_at
       FROM mission_flows
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 20`,
      userId
    );

    const lessons = await pgQuery<any>(
      `SELECT id, mission_title, domain, what_worked, what_broke, rule_change, created_at
       FROM aar_lessons
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      userId
    );

    return NextResponse.json({
      success: true,
      missions: missions.map((m) => ({
        id: m.id,
        domain: m.domain,
        title: m.title,
        payload: m.payload,
        status: m.status,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
      lessons: lessons.map((l) => ({
        id: l.id,
        missionTitle: l.mission_title,
        domain: l.domain,
        whatWorked: l.what_worked,
        whatBroke: l.what_broke,
        ruleChange: l.rule_change,
        createdAt: l.created_at,
      })),
    });
  } catch (err: any) {
    console.error("mission-flow GET error:", err);
    return NextResponse.json(
      { error: "Failed to load mission flows", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    await ensureMissionFlowSchema();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "save_mission" || action === "deploy_mission") {
      const draft = body.draft;
      if (!draft?.endState?.title) {
        return NextResponse.json({ error: "Mission title is required" }, { status: 400 });
      }

      const deployedAt = action === "deploy_mission" ? new Date().toISOString() : draft.deployedAt || null;
      const savedPayload = { ...draft, deployedAt };

      const inserted = await pgQuery<{ id: string }>(
        `INSERT INTO mission_flows (user_id, domain, title, payload, status, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
         RETURNING id`,
        userId,
        String(draft.endState.domain || "master"),
        String(draft.endState.title).slice(0, 140),
        JSON.stringify(savedPayload),
        action === "deploy_mission" ? "deployed" : "draft"
      );

      let pmsSynced = 0;
      let calendarSynced = 0;

      // On Deploy Mission: push tasks into Pristine PMS AND time-blocked windows onto Calendar!
      if (action === "deploy_mission" && Array.isArray(draft.nodes)) {
        // 1. Push into Pristine PMS (if a list exists for this user)
        try {
          const listRows = await pgQuery<{ id: string; space_id: string }>(
            `SELECT l.id, l.space_id FROM pms_lists l
             JOIN pms_spaces s ON s.id = l.space_id
             WHERE s.user_id = $1
             ORDER BY l.created_at ASC LIMIT 1`,
            userId
          );
          if (listRows[0]) {
            const statusRows = await pgQuery<{ id: string }>(
              `SELECT id FROM pms_statuses WHERE space_id = $1 ORDER BY sort_order ASC LIMIT 1`,
              listRows[0].space_id
            );
            const statusId = statusRows[0]?.id || null;
            for (const node of draft.nodes) {
              await pgExec(
                `INSERT INTO pms_tasks (list_id, status_id, name, description, priority, time_estimate_minutes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                listRows[0].id,
                statusId,
                `[${draft.endState.title.slice(0, 24)}] ${node.title}`.slice(0, 160),
                `${node.deliverable} | Exit: ${node.exitCriteria}`,
                node.bomStatus === "BLOCKED" ? "urgent" : "high",
                Number(node.durationMins || 30)
              );
              pmsSynced++;
            }
          }
        } catch (pmsErr) {
          console.warn("PMS sync skipped:", pmsErr);
        }

        // 2. Push time-blocked windows onto Calendar (yearly_appointments)
        try {
          const todayIso = new Date().toISOString().slice(0, 10);
          let cursorMins = 9 * 60; // Start scheduling from 09:00
          for (const node of draft.nodes) {
            const dur = Math.max(15, Number(node.durationMins || 30));
            const sh = String(Math.floor(cursorMins / 60) % 24).padStart(2, "0");
            const sm = String(cursorMins % 60).padStart(2, "0");
            const endM = cursorMins + dur;
            const eh = String(Math.floor(endM / 60) % 24).padStart(2, "0");
            const em = String(endM % 60).padStart(2, "0");
            cursorMins = endM + 10;

            await pgExec(
              `INSERT INTO yearly_appointments (user_id, title, category, appointment_date, start_time, end_time, accent_color, notes)
               VALUES ($1, $2, 'mission', $3::date, $4, $5, '#f59e0b', $6)`,
              userId,
              `Mission: ${node.title}`.slice(0, 120),
              todayIso,
              `${sh}:${sm}`,
              `${eh}:${em}`,
              `${node.loe} · Mode: ${node.workMode} · Exit: ${node.exitCriteria}`
            );
            calendarSynced++;
          }
        } catch (calErr) {
          console.warn("Calendar sync skipped:", calErr);
        }
      }

      return NextResponse.json({
        success: true,
        id: inserted[0]?.id,
        deployedAt,
        pmsSynced,
        calendarSynced,
      });
    }

    if (action === "create_acquisition_task") {
      const itemLabel = String(body.label || "Acquire Missing Resource").slice(0, 160);
      try {
        const listRows = await pgQuery<{ id: string; space_id: string }>(
          `SELECT l.id, l.space_id FROM pms_lists l
           JOIN pms_spaces s ON s.id = l.space_id
           WHERE s.user_id = $1
           ORDER BY l.created_at ASC LIMIT 1`,
          userId
        );
        if (listRows[0]) {
          const statusRows = await pgQuery<{ id: string }>(
            `SELECT id FROM pms_statuses WHERE space_id = $1 ORDER BY sort_order ASC LIMIT 1`,
            listRows[0].space_id
          );
          await pgExec(
            `INSERT INTO pms_tasks (list_id, status_id, name, description, priority)
             VALUES ($1, $2, $3, 'Created via Mission Flow BOM Readiness Audit (NEED queue)', 'high')`,
            listRows[0].id,
            statusRows[0]?.id || null,
            `[ACQUIRE] ${itemLabel}`
          );
        }
      } catch (err) {
        console.warn("Acquisition PMS task skipped:", err);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "save_aar_lesson") {
      const missionTitle = String(body.missionTitle || "Mission").slice(0, 140);
      const domain = String(body.domain || "master");
      const whatWorked = String(body.whatWorked || "").trim();
      const whatBroke = String(body.whatBroke || "").trim();
      const ruleChange = String(body.ruleChange || "").trim();

      const rows = await pgQuery<any>(
        `INSERT INTO aar_lessons (user_id, mission_title, domain, what_worked, what_broke, rule_change)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, mission_title, domain, what_worked, what_broke, rule_change, created_at`,
        userId,
        missionTitle,
        domain,
        whatWorked,
        whatBroke,
        ruleChange
      );
      const r = rows[0];
      return NextResponse.json({
        success: true,
        lesson: {
          id: r.id,
          missionTitle: r.mission_title,
          domain: r.domain,
          whatWorked: r.what_worked,
          whatBroke: r.what_broke,
          ruleChange: r.rule_change,
          createdAt: r.created_at,
        },
      });
    }

    return NextResponse.json({ error: "Unknown mission-flow action" }, { status: 400 });
  } catch (err: any) {
    console.error("mission-flow POST error:", err);
    return NextResponse.json(
      { error: "Mission Flow API error", detail: err?.message },
      { status: 500 }
    );
  }
}
