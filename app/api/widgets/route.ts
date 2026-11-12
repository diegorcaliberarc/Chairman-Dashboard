import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function toRoman(index: number): string {
  return ROMAN[index] || `${index + 1}`;
}

function getSolarTelemetry(tzOffsetMinutes?: number) {
  const now = new Date();
  // Apply client timezone offset if provided, else default to Mountain/Local server time
  const localMs =
    typeof tzOffsetMinutes === "number" && !Number.isNaN(tzOffsetMinutes)
      ? now.getTime() - tzOffsetMinutes * 60_000
      : now.getTime();
  const d =
    typeof tzOffsetMinutes === "number" && !Number.isNaN(tzOffsetMinutes)
      ? new Date(localMs)
      : now;

  const hours =
    typeof tzOffsetMinutes === "number" && !Number.isNaN(tzOffsetMinutes)
      ? d.getUTCHours()
      : d.getHours();
  const minutes =
    typeof tzOffsetMinutes === "number" && !Number.isNaN(tzOffsetMinutes)
      ? d.getUTCMinutes()
      : d.getMinutes();

  const totalMinutes = hours * 60 + minutes;
  const progressPct = Math.round((totalMinutes / 1440) * 1000) / 10;

  let phase = "Solar Zenith";
  let phaseTag = "PEAK COGNITIVE THRUST";
  if (hours >= 5 && hours < 9) {
    phase = "Dawn Ignition";
    phaseTag = "CORTISOL & WALK PROTOCOL";
  } else if (hours >= 9 && hours < 13) {
    phase = "Solar Zenith";
    phaseTag = "DEEP ARCHITECTURE BLOCK";
  } else if (hours >= 13 && hours < 17) {
    phase = "Metabolic Execution";
    phaseTag = "13:00–19:00 FEEDING & OPS";
  } else if (hours >= 17 && hours < 21) {
    phase = "Dusk Decompression";
    phaseTag = "19:00 HARD-STOP HORIZON";
  } else {
    phase = "Nocturnal Recovery";
    phaseTag = "CELLULAR SLEEP REPAIR";
  }

  const sunsetMinutes = 19 * 60 + 42;
  const hardStopMinutes = 19 * 60;
  const daylightDiff = Math.max(0, sunsetMinutes - totalMinutes);
  const hardStopDiff = hardStopMinutes - totalMinutes;

  const daylightRemaining =
    daylightDiff > 0
      ? `${Math.floor(daylightDiff / 60)}h ${daylightDiff % 60}m`
      : "Post-Sunset";

  const hardStopCountdown =
    hardStopDiff > 0
      ? `${Math.floor(hardStopDiff / 60)}h ${hardStopDiff % 60}m to 19:00 Stop`
      : "19:00 Hard Stop Active";

  const currentTime24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return {
    phase,
    phaseTag,
    progressPct,
    sunrise: "06:18",
    sunset: "19:42",
    daylightRemaining,
    hardStopCountdown,
    currentTime24,
    totalMinutes,
  };
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 83) return "A-";
  if (score >= 78) return "B+";
  if (score >= 72) return "B";
  if (score >= 65) return "C+";
  if (score >= 58) return "C";
  return "D";
}

export async function GET(req: NextRequest) {
  const userId = await getLivingOsUserId();
  const tzParam = req.nextUrl.searchParams.get("tzOffset");
  const tzOffset = tzParam !== null ? Number(tzParam) : undefined;
  const solar = getSolarTelemetry(tzOffset);
  const todayIso = new Date().toISOString().slice(0, 10);

  // 1. Active / Next Calendar Block + Roman Numeral Subtasks (I, II, III)
  let activeBlock: {
    id: string;
    source: "yearly_appointment" | "circadian_event" | "fallback";
    title: string;
    timeRange: string;
    category: string;
    accentColor: string;
    isLive: boolean;
    subtasks: { id: string; roman: string; label: string; done: boolean }[];
  } = {
    id: "default-exec-block",
    source: "fallback",
    title: "Executive Deep-Work & Mobile Telemetry",
    timeRange: "09:00 – 12:00",
    category: "engineering",
    accentColor: "#38bdf8",
    isLive: true,
    subtasks: [
      { id: "s1", roman: "I", label: "Audit Caliber Arc NQ/MNQ Risk Guardrails", done: true },
      { id: "s2", roman: "II", label: "Sync Weight-Loss Walk & Shift Pay Ledger", done: false },
      { id: "s3", roman: "III", label: "Review CMO Viral Hooks & Gaming Signals", done: false },
    ],
  };

  try {
    const appts = await pgQuery<any>(
      `SELECT id, title, category, start_time, end_time, accent_color, subtasks, daily_money_used
       FROM yearly_appointments
       WHERE user_id = $1 AND appointment_date >= CURRENT_DATE
       ORDER BY appointment_date ASC, start_time ASC
       LIMIT 3`,
      userId
    );

    if (appts.length > 0) {
      const a = appts[0];
      const rawSubs = Array.isArray(a.subtasks) ? a.subtasks : [];
      const mappedSubs =
        rawSubs.length > 0
          ? rawSubs.slice(0, 4).map((s: any, idx: number) => ({
              id: String(s.id ?? `sub-${idx}`),
              roman: toRoman(idx),
              label: String(s.label ?? s.title ?? s.text ?? `Directive ${toRoman(idx)}`),
              done: Boolean(s.done ?? s.completed ?? s.isCompleted ?? false),
            }))
          : activeBlock.subtasks;

      activeBlock = {
        id: String(a.id),
        source: "yearly_appointment",
        title: String(a.title),
        timeRange: `${a.start_time || "09:00"} – ${a.end_time || "10:30"}`,
        category: String(a.category || "work"),
        accentColor: String(a.accent_color || "#38bdf8"),
        isLive: true,
        subtasks: mappedSubs,
      };
    } else {
      // Check circadian_events + circadian_event_checklists
      const ceRows = await pgQuery<any>(
        `SELECT id, title, domain, start_time, end_time, accent_color
         FROM circadian_events
         WHERE user_id = $1 OR user_id IS NULL
         ORDER BY start_time ASC
         LIMIT 3`,
        userId
      );

      if (ceRows.length > 0) {
        const ev = ceRows[0];
        let checklistRows: any[] = [];
        try {
          checklistRows = await pgQuery<any>(
            `SELECT id, label, is_completed, sort_order
             FROM circadian_event_checklists
             WHERE event_id = $1::uuid
             ORDER BY sort_order ASC
             LIMIT 4`,
            ev.id
          );
        } catch {
          checklistRows = [];
        }

        const fmtTime = (iso: string) => {
          try {
            const dt = new Date(iso);
            return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
          } catch {
            return "09:00";
          }
        };

        activeBlock = {
          id: String(ev.id),
          source: "circadian_event",
          title: String(ev.title),
          timeRange: `${fmtTime(ev.start_time)} – ${fmtTime(ev.end_time)}`,
          category: String(ev.domain || "engineering"),
          accentColor: String(ev.accent_color || "#38bdf8"),
          isLive: true,
          subtasks:
            checklistRows.length > 0
              ? checklistRows.map((c: any, idx: number) => ({
                  id: String(c.id),
                  roman: toRoman(idx),
                  label: String(c.label),
                  done: Boolean(c.is_completed),
                }))
              : activeBlock.subtasks,
        };
      }
    }
  } catch {
    // Keep clean fallback activeBlock
  }

  // 2. Full-Circle Habit Progress (Weight-Loss Walk 360° Ring + Secondary Rings)
  let primaryHabit = {
    id: "default-walk-habit",
    title: "Weight-Loss Daily Walk",
    subtitle: "Zone-2 Fat Oxidation Ring",
    unit: "steps",
    current: 7840,
    target: 10000,
    pct: 78.4,
    ringColor: "#10b981",
  };

  let habitRings = [
    primaryHabit,
    {
      id: "ring-protein",
      title: "Protein Payload",
      subtitle: "180g Lean Target",
      unit: "g",
      current: 148,
      target: 180,
      pct: 82.2,
      ringColor: "#38bdf8",
    },
    {
      id: "ring-focus",
      title: "Deep Work Blocks",
      subtitle: "Zero-Entropy Hours",
      unit: "hrs",
      current: 3.5,
      target: 4,
      pct: 87.5,
      ringColor: "#a855f7",
    },
  ];

  try {
    const habits = await pgQuery<any>(
      `SELECT h.id, h.title, h.subtitle, h.unit, h.target_value, h.ring_color,
              COALESCE(l.current_value, 0) AS current_value
       FROM calendar_habits h
       LEFT JOIN calendar_habit_logs l
         ON l.habit_id = h.id AND l.log_date = CURRENT_DATE
       WHERE h.user_id = $1
       ORDER BY h.sort_order ASC, h.created_at ASC
       LIMIT 4`,
      userId
    );

    if (habits.length > 0) {
      const mapped = habits.map((h: any) => {
        const target = Math.max(1, Number(h.target_value || 10000));
        const current = Number(h.current_value || 0);
        const pct = Math.min(100, Math.round((current / target) * 1000) / 10);
        return {
          id: String(h.id),
          title: String(h.title),
          subtitle: String(h.subtitle || "Daily target"),
          unit: String(h.unit || "steps"),
          current,
          target,
          pct,
          ringColor: String(h.ring_color || "#10b981"),
        };
      });
      primaryHabit = mapped[0];
      if (mapped.length >= 2) {
        habitRings = mapped.slice(0, 3);
      } else {
        habitRings = [primaryHabit, habitRings[1], habitRings[2]];
      }
    }
  } catch {
    // Keep default habit telemetry
  }

  // 3. Shift × Pay Snapshot (Today's Pay, Weekly Pay, Monthly Pay, Days Worked / Total, Daily Money Used)
  let shiftPay = {
    roleLabel: "Primary Shift / Executive Ops",
    payPerShift: 320,
    todayPay: 320,
    weeklyPay: 1600,
    monthlyPay: 5760,
    daysWorked: 18,
    totalScheduledDays: 22,
    dailyMoneyUsed: 44.5,
    netToday: 275.5,
    todayStatus: "worked" as "worked" | "scheduled" | "off",
  };

  try {
    const cfgRows = await pgQuery<any>(
      `SELECT role_label, pay_per_shift, total_scheduled_days, shifts_per_week
       FROM work_shift_configs
       WHERE user_id = $1
       LIMIT 1`,
      userId
    );

    const payPerShift = cfgRows[0] ? Number(cfgRows[0].pay_per_shift || 320) : 320;
    const totalScheduledDays = cfgRows[0] ? Number(cfgRows[0].total_scheduled_days || 22) : 22;
    const roleLabel = cfgRows[0]
      ? String(cfgRows[0].role_label || "Primary Shift / Contract Ops")
      : "Primary Shift / Contract Ops";

    const monthLogs = await pgQuery<any>(
      `SELECT work_date, actual_pay, anticipated_pay, daily_expense, status
       FROM work_shift_logs
       WHERE user_id = $1
         AND work_date >= date_trunc('month', CURRENT_DATE)::date
       ORDER BY work_date DESC`,
      userId
    );

    let apptSpendToday = 0;
    try {
      const spendRows = await pgQuery<any>(
        `SELECT COALESCE(SUM(daily_money_used), 0) AS spent
         FROM yearly_appointments
         WHERE user_id = $1 AND appointment_date = CURRENT_DATE`,
        userId
      );
      apptSpendToday = Number(spendRows[0]?.spent || 0);
    } catch {
      apptSpendToday = 0;
    }

    if (monthLogs.length > 0) {
      const nowMs = Date.now();
      const sevenDaysMs = 7 * 86_400_000;

      const todayRow = monthLogs.find((r: any) => String(r.work_date).slice(0, 10) === todayIso);
      const workedRows = monthLogs.filter((r: any) => r.status === "worked");
      const weeklyRows = workedRows.filter((r: any) => {
        const dMs = new Date(r.work_date).getTime();
        return nowMs - dMs <= sevenDaysMs && nowMs - dMs >= -86_400_000;
      });

      const todayPay = todayRow
        ? todayRow.status === "off"
          ? 0
          : Number(todayRow.actual_pay || todayRow.anticipated_pay || payPerShift)
        : payPerShift;

      const weeklyPay =
        weeklyRows.length > 0
          ? weeklyRows.reduce((acc: number, r: any) => acc + Number(r.actual_pay || payPerShift), 0)
          : payPerShift * 5;

      const monthlyPay =
        workedRows.length > 0
          ? workedRows.reduce((acc: number, r: any) => acc + Number(r.actual_pay || payPerShift), 0)
          : payPerShift * 16;

      const dailyMoneyUsed =
        (todayRow ? Number(todayRow.daily_expense || 0) : 0) + apptSpendToday;

      shiftPay = {
        roleLabel,
        payPerShift,
        todayPay: Math.round(todayPay * 100) / 100,
        weeklyPay: Math.round(weeklyPay * 100) / 100,
        monthlyPay: Math.round(monthlyPay * 100) / 100,
        daysWorked: workedRows.length || 16,
        totalScheduledDays,
        dailyMoneyUsed: Math.round(dailyMoneyUsed * 100) / 100,
        netToday: Math.round((todayPay - dailyMoneyUsed) * 100) / 100,
        todayStatus: (todayRow?.status as "worked" | "scheduled" | "off") || "worked",
      };
    } else if (cfgRows[0]) {
      shiftPay = {
        ...shiftPay,
        roleLabel,
        payPerShift,
        todayPay: payPerShift,
        weeklyPay: payPerShift * Number(cfgRows[0].shifts_per_week || 5),
        monthlyPay: payPerShift * Math.min(16, totalScheduledDays),
        totalScheduledDays,
        dailyMoneyUsed: apptSpendToday || 38.0,
        netToday: payPerShift - (apptSpendToday || 38.0),
      };
    }
  } catch {
    // Keep clean shiftPay defaults
  }

  // 4. Executive KPI Health Score + Ditto & Gengar Connection Mood
  let kpi = {
    score: 88,
    grade: "A",
    greenCount: 44,
    yellowCount: 11,
    redCount: 5,
    totalKpis: 60,
  };

  try {
    const snapRows = await pgQuery<any>(
      `SELECT overall_score, grade, green_count, yellow_count, red_count
       FROM kpi_scorecard_snapshots
       WHERE user_id = $1
       ORDER BY snapshot_date DESC, created_at DESC
       LIMIT 1`,
      userId
    );
    if (snapRows.length > 0) {
      const s = snapRows[0];
      const sc = Number(s.overall_score || 88);
      kpi = {
        score: sc,
        grade: String(s.grade || scoreToGrade(sc)),
        greenCount: Number(s.green_count || 44),
        yellowCount: Number(s.yellow_count || 11),
        redCount: Number(s.red_count || 5),
        totalKpis: 60,
      };
    }
  } catch {
    // Keep clean KPI defaults
  }

  const bondScore = Math.min(
    100,
    Math.round(kpi.score * 0.55 + primaryHabit.pct * 0.3 + (shiftPay.netToday > 0 ? 15 : 8))
  );

  let palsMood = "Hyper-Synced";
  let palsHeadline = "Ditto & Gengar Locked In";
  let dittoState = "Happy Blob · Synced";
  let gengarState = "Shadow Grin · Guarding";

  if (solar.totalMinutes >= 21 * 60 || solar.totalMinutes < 5 * 60) {
    palsMood = "Night Watch";
    palsHeadline = "Gengar On Night Patrol · Ditto Resting";
    dittoState = "Cozy Nap · Restoring";
    gengarState = "Lunar Sentinel · Alert";
  } else if (bondScore >= 85) {
    palsMood = "Hyper-Synced";
    palsHeadline = "Ditto & Gengar Co-Op Boost";
  } else if (bondScore >= 70) {
    palsMood = "Steady Groove";
    palsHeadline = "Ditto & Gengar Pacing Target";
    dittoState = "Focused · Bouncing";
    gengarState = "Ready · Watching Steps";
  } else {
    palsMood = "Rally Call";
    palsHeadline = "Pals Requesting Walk + Check-In";
    dittoState = "Waving · Nudge";
    gengarState = "Hypnosis Focus Cue";
  }

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    todayDate: todayIso,
    solar,
    activeBlock,
    habits: {
      primary: primaryHabit,
      rings: habitRings,
    },
    shiftPay,
    kpi,
    pals: {
      mood: palsMood,
      headline: palsHeadline,
      bondScore,
      dittoState,
      gengarState,
      statusNote: `Walk ${Math.round(primaryHabit.pct)}% · Net +$${Math.round(shiftPay.netToday)} · KPI ${kpi.grade}`,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "increment_steps") {
      const delta = Number(body.delta ?? 1000);
      // Ensure primary walk habit exists
      let habits = await pgQuery<any>(
        `SELECT id, target_value FROM calendar_habits WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC LIMIT 1`,
        userId
      );

      let habitId: string;
      if (habits.length === 0) {
        const created = await pgQuery<any>(
          `INSERT INTO calendar_habits (user_id, title, subtitle, unit, target_value, ring_color, icon_name, sort_order)
           VALUES ($1, 'Weight-Loss Daily Walk', 'Zone-2 Fat Oxidation Ring', 'steps', 10000, '#10b981', 'footprints', 0)
           RETURNING id`,
          userId
        );
        habitId = String(created[0].id);
        // Seed log at 7840 + delta so first tap feels continuous with default display
        const initialVal = Math.max(0, 7840 + delta);
        await pgExec(
          `INSERT INTO calendar_habit_logs (user_id, habit_id, log_date, current_value, updated_at)
           VALUES ($1, $2::uuid, CURRENT_DATE, $3, NOW())
           ON CONFLICT (habit_id, log_date)
           DO UPDATE SET current_value = GREATEST(0, calendar_habit_logs.current_value + $4), updated_at = NOW()`,
          userId,
          habitId,
          initialVal,
          delta
        );
      } else {
        habitId = String(habits[0].id);
        await pgExec(
          `INSERT INTO calendar_habit_logs (user_id, habit_id, log_date, current_value, updated_at)
           VALUES ($1, $2::uuid, CURRENT_DATE, GREATEST(0, $3), NOW())
           ON CONFLICT (habit_id, log_date)
           DO UPDATE SET current_value = GREATEST(0, calendar_habit_logs.current_value + $3), updated_at = NOW()`,
          userId,
          habitId,
          delta
        );
      }

      return NextResponse.json({ ok: true, habitId });
    }

    if (action === "toggle_subtask") {
      const source = String(body.source || "fallback");
      const blockId = String(body.blockId || "");
      const subtaskIndex = Number(body.subtaskIndex ?? 0);

      if (source === "yearly_appointment" && blockId) {
        const rows = await pgQuery<any>(
          `SELECT subtasks FROM yearly_appointments WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
          blockId,
          userId
        );
        if (rows.length > 0) {
          const subs = Array.isArray(rows[0].subtasks) ? [...rows[0].subtasks] : [];
          if (subs[subtaskIndex]) {
            const cur = Boolean(subs[subtaskIndex].done ?? subs[subtaskIndex].completed);
            subs[subtaskIndex] = { ...subs[subtaskIndex], done: !cur, completed: !cur };
            await pgExec(
              `UPDATE yearly_appointments SET subtasks = $1::jsonb WHERE id = $2::uuid AND user_id = $3`,
              JSON.stringify(subs),
              blockId,
              userId
            );
          }
        }
      } else if (source === "circadian_event") {
        const subtaskId = String(body.subtaskId || "");
        if (subtaskId && subtaskId.length > 10) {
          await pgExec(
            `UPDATE circadian_event_checklists SET is_completed = NOT is_completed WHERE id = $1::uuid`,
            subtaskId
          );
        }
      } else {
        // Materialize fallback block into yearly_appointments for today so quick-checks persist!
        const defaultSubs = [
          { id: "s1", label: "Audit Caliber Arc NQ/MNQ Risk Guardrails", done: true },
          { id: "s2", label: "Sync Weight-Loss Walk & Shift Pay Ledger", done: false },
          { id: "s3", label: "Review CMO Viral Hooks & Gaming Signals", done: false },
        ];
        if (defaultSubs[subtaskIndex]) {
          defaultSubs[subtaskIndex].done = !defaultSubs[subtaskIndex].done;
        }
        await pgExec(
          `INSERT INTO yearly_appointments (user_id, title, category, appointment_date, start_time, end_time, accent_color, subtask_style, subtasks)
           VALUES ($1, 'Executive Deep-Work & Mobile Telemetry', 'work', CURRENT_DATE, '09:00', '12:00', '#38bdf8', 'roman', $2::jsonb)`,
          userId,
          JSON.stringify(defaultSubs)
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_shift_today") {
      const cfgRows = await pgQuery<any>(
        `SELECT pay_per_shift FROM work_shift_configs WHERE user_id = $1 LIMIT 1`,
        userId
      );
      const pay = cfgRows[0] ? Number(cfgRows[0].pay_per_shift || 320) : 320;

      const existing = await pgQuery<any>(
        `SELECT id, status FROM work_shift_logs WHERE user_id = $1 AND work_date = CURRENT_DATE LIMIT 1`,
        userId
      );

      if (existing.length > 0) {
        const nextStatus = existing[0].status === "worked" ? "scheduled" : "worked";
        await pgExec(
          `UPDATE work_shift_logs SET status = $1, actual_pay = $2 WHERE id = $3::uuid`,
          nextStatus,
          nextStatus === "worked" ? pay : 0,
          existing[0].id
        );
      } else {
        await pgExec(
          `INSERT INTO work_shift_logs (user_id, work_date, shifts_count, anticipated_pay, actual_pay, daily_expense, status)
           VALUES ($1, CURRENT_DATE, 1, $2, $2, 38.00, 'worked')`,
          userId,
          pay
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported widget action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/widgets error:", error);
    return NextResponse.json({ error: error.message || "Widget mutation failed" }, { status: 500 });
  }
}
