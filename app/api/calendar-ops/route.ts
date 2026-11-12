export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";
import {
  AppointmentCategory,
  CURATED_BLOCK_PALETTE,
  CalendarHabitDTO,
  CalendarHighlightSpanDTO,
  EventDomain,
  NestedSubtaskItem,
  SubtaskListStyle,
  WorkPaySummaryDTO,
  WorkShiftConfigDTO,
  WorkShiftLogDTO,
  YearlyAppointmentDTO,
} from "@/lib/circadianTypes";

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function normalizeDateString(val: any, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === "string") return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function parseSubtasksJson(raw: any): NestedSubtaskItem[] {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item: any, idx: number) => ({
    id: String(item?.id || `sub-${idx + 1}`),
    label: String(item?.label || ""),
    timeWindow: item?.timeWindow ? String(item.timeWindow) : undefined,
    isCompleted: Boolean(item?.isCompleted),
  }));
}

const DEFAULT_MORNING_WORK_SUBTASKS: NestedSubtaskItem[] = [
  {
    id: "work-sub-1",
    label: "Morning shift briefing & system check",
    timeWindow: "07:00–07:15",
    isCompleted: true,
  },
  {
    id: "work-sub-2",
    label: "Equipment & dispatch queue sync",
    timeWindow: "07:15–07:35",
    isCompleted: true,
  },
  {
    id: "work-sub-3",
    label: "Priority ticket triage",
    timeWindow: "07:35–07:50",
    isCompleted: false,
  },
  {
    id: "work-sub-4",
    label: "Lock 08:00 deep execution block",
    timeWindow: "07:50–08:00",
    isCompleted: false,
  },
];

async function ensureSchema() {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS calendar_habits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT 'Weight-loss daily walk target',
      unit TEXT NOT NULL DEFAULT 'steps',
      target_value NUMERIC(12,2) NOT NULL DEFAULT 10000,
      ring_color TEXT NOT NULL DEFAULT '#10b981',
      icon_name TEXT NOT NULL DEFAULT 'footprints',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS calendar_habit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      habit_id UUID NOT NULL REFERENCES calendar_habits(id) ON DELETE CASCADE,
      log_date DATE NOT NULL,
      current_value NUMERIC(12,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(habit_id, log_date)
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS calendar_highlight_spans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      span_type TEXT NOT NULL DEFAULT 'hours',
      start_minute INTEGER NOT NULL DEFAULT 420,
      end_minute INTEGER NOT NULL DEFAULT 900,
      start_date DATE,
      end_date DATE,
      color TEXT NOT NULL DEFAULT '#f59e0b',
      opacity NUMERIC(4,2) NOT NULL DEFAULT 0.22,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS work_shift_configs (
      user_id TEXT PRIMARY KEY,
      role_label TEXT NOT NULL DEFAULT 'Primary Shift / Contract Ops',
      pay_per_shift NUMERIC(12,2) NOT NULL DEFAULT 320.00,
      hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 40.00,
      hours_per_shift NUMERIC(6,2) NOT NULL DEFAULT 8.00,
      total_scheduled_days INTEGER NOT NULL DEFAULT 22,
      shifts_per_week NUMERIC(6,2) NOT NULL DEFAULT 5.00,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS work_shift_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      work_date DATE NOT NULL,
      shifts_count NUMERIC(6,2) NOT NULL DEFAULT 1.00,
      pay_rate_override NUMERIC(12,2),
      anticipated_pay NUMERIC(12,2) NOT NULL DEFAULT 320.00,
      actual_pay NUMERIC(12,2) NOT NULL DEFAULT 320.00,
      daily_expense NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      status TEXT NOT NULL DEFAULT 'worked',
      notes TEXT DEFAULT '',
      subtask_style TEXT NOT NULL DEFAULT 'roman',
      subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, work_date)
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS yearly_appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'work',
      appointment_date DATE NOT NULL,
      start_time TEXT NOT NULL DEFAULT '07:00',
      end_time TEXT NOT NULL DEFAULT '08:00',
      accent_color TEXT NOT NULL DEFAULT '#38bdf8',
      daily_money_used NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      anticipated_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      actual_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      subtask_style TEXT NOT NULL DEFAULT 'roman',
      subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function seedIfEmpty(
  userId: string,
  prismaUserId: string | null,
  dateStr: string,
  year: number
) {
  // 1. Seed Full-Circle 360° Habits
  const habitCountRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM calendar_habits WHERE user_id = $1`,
    userId
  );
  if ((habitCountRows[0]?.cnt ?? 0) === 0) {
    const seededHabits = [
      {
        title: "Weight-Loss Daily Walk",
        subtitle: "3.5 miles · Fat-burn full 360° ring closure",
        unit: "steps",
        target: 10000,
        initial: 7500,
        color: "#10b981",
        icon: "footprints",
        sort: 0,
      },
      {
        title: "Hydration Protocol",
        subtitle: "Electrolyte + spring water daily intake",
        unit: "oz",
        target: 100,
        initial: 80,
        color: "#38bdf8",
        icon: "droplets",
        sort: 1,
      },
      {
        title: "Deep Focus Hours",
        subtitle: "Zero-distraction architectural build time",
        unit: "hrs",
        target: 4,
        initial: 3,
        color: "#f59e0b",
        icon: "zap",
        sort: 2,
      },
    ];

    for (const h of seededHabits) {
      const inserted = await pgQuery<{ id: string }>(
        `INSERT INTO calendar_habits (user_id, title, subtitle, unit, target_value, ring_color, icon_name, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        userId,
        h.title,
        h.subtitle,
        h.unit,
        h.target,
        h.color,
        h.icon,
        h.sort
      );
      if (inserted[0]?.id) {
        await pgExec(
          `INSERT INTO calendar_habit_logs (user_id, habit_id, log_date, current_value)
           VALUES ($1, $2::uuid, $3::date, $4)
           ON CONFLICT (habit_id, log_date) DO NOTHING`,
          userId,
          inserted[0].id,
          dateStr,
          h.initial
        );
      }
    }
  }

  // 2. Seed Long-Period Highlight Spans
  const spanCountRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM calendar_highlight_spans WHERE user_id = $1`,
    userId
  );
  if ((spanCountRows[0]?.cnt ?? 0) === 0) {
    const dt = parseYMD(dateStr);
    const dayOfWeek = dt.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 4);

    await pgExec(
      `INSERT INTO calendar_highlight_spans (user_id, label, span_type, start_minute, end_minute, start_date, end_date, color, opacity, is_active)
       VALUES
       ($1, '07:00 – 15:00 Deep Shift Window', 'hours', 420, 900, NULL, NULL, '#38bdf8', 0.20, TRUE),
       ($1, '17:30 – 19:30 Walk & Metabolic Lock', 'hours', 1050, 1170, NULL, NULL, '#10b981', 0.18, TRUE),
       ($1, 'Multi-Day Executive Sprint Week', 'multi_day', 420, 1020, $2::date, $3::date, '#f59e0b', 0.14, TRUE)`,
      userId,
      formatYMD(weekStart),
      formatYMD(weekEnd)
    );
  }

  // 3. Seed Work Shift Config & Monthly Shift Logs
  const cfgRows = await pgQuery<{ user_id: string }>(
    `SELECT user_id FROM work_shift_configs WHERE user_id = $1`,
    userId
  );
  if (cfgRows.length === 0) {
    await pgExec(
      `INSERT INTO work_shift_configs (user_id, role_label, pay_per_shift, hourly_rate, hours_per_shift, total_scheduled_days, shifts_per_week)
       VALUES ($1, 'Primary Operations & Engineering Shift', 320.00, 40.00, 8.00, 22, 5.00)
       ON CONFLICT (user_id) DO NOTHING`,
      userId
    );
  }

  const dt = parseYMD(dateStr);
  const monthStart = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEndDay = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  const monthEnd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;

  const shiftCountRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM work_shift_logs WHERE user_id = $1 AND work_date >= $2::date AND work_date <= $3::date`,
    userId,
    monthStart,
    monthEnd
  );
  if ((shiftCountRows[0]?.cnt ?? 0) === 0) {
    // Seed 16 worked weekdays across the month (including selectedDate) so 16/22 Days Worked & Weekly/BiWeekly/Monthly totals are rich immediately
    let seededDays = 0;
    for (let day = 1; day <= monthEndDay && seededDays < 15; day++) {
      const candidate = new Date(dt.getFullYear(), dt.getMonth(), day, 12, 0, 0);
      const ymd = formatYMD(candidate);
      if (ymd === dateStr) continue;
      const dow = candidate.getDay();
      if (dow === 0 || dow === 6) continue;
      seededDays++;
      const isBonus = seededDays % 5 === 0;
      await pgExec(
        `INSERT INTO work_shift_logs (user_id, work_date, shifts_count, anticipated_pay, actual_pay, daily_expense, status, notes, subtask_style, subtasks)
         VALUES ($1, $2::date, 1.00, 320.00, $3, $4, 'worked', 'Completed scheduled shift block', 'roman', $5::jsonb)
         ON CONFLICT (user_id, work_date) DO NOTHING`,
        userId,
        ymd,
        isBonus ? 350.0 : 320.0,
        18.5,
        JSON.stringify(DEFAULT_MORNING_WORK_SUBTASKS)
      );
    }

    // Ensure selectedDate itself is logged as worked (#16)
    await pgExec(
      `INSERT INTO work_shift_logs (user_id, work_date, shifts_count, anticipated_pay, actual_pay, daily_expense, status, notes, subtask_style, subtasks)
       VALUES ($1, $2::date, 1.00, 320.00, 320.00, 24.50, 'worked', '07:00 Go to Work — Primary shift logged', 'roman', $3::jsonb)
       ON CONFLICT (user_id, work_date) DO NOTHING`,
      userId,
      dateStr,
      JSON.stringify(DEFAULT_MORNING_WORK_SUBTASKS)
    );
  }

  // 4. Seed Full-Year Appointments across Jan-Dec + Today's 07:00 Go to Work
  const apptCountRows = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM yearly_appointments WHERE user_id = $1 AND EXTRACT(YEAR FROM appointment_date) = $2`,
    userId,
    year
  );
  if ((apptCountRows[0]?.cnt ?? 0) === 0) {
    const annualSeeds: Array<{
      title: string;
      category: AppointmentCategory;
      date: string;
      start: string;
      end: string;
      color: string;
      spent: number;
      anticipated: number;
      actual: number;
      style: SubtaskListStyle;
      subtasks: NestedSubtaskItem[];
      notes: string;
    }> = [
      {
        title: "Go to Work — Primary Shift & 07:00–08:00 Launch",
        category: "work",
        date: dateStr,
        start: "07:00",
        end: "15:00",
        color: "#38bdf8",
        spent: 24.5,
        anticipated: 320.0,
        actual: 340.0,
        style: "roman",
        subtasks: DEFAULT_MORNING_WORK_SUBTASKS,
        notes: "07:00–08:00 opening hour structured in Roman numerals I–IV + shift differential bonus.",
      },
      {
        title: "Q1 Capital Allocation & Treasury Kickoff",
        category: "financial",
        date: `${year}-01-15`,
        start: "09:00",
        end: "10:30",
        color: "#10b981",
        spent: 0,
        anticipated: 1850.0,
        actual: 1920.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "Reconcile annual tax reserve buckets", timeWindow: "09:00–09:30", isCompleted: true },
          { id: "s2", label: "Lock 12-month savings & ETF auto-draft", timeWindow: "09:30–10:30", isCompleted: true },
        ],
        notes: "January dividend + retainer settlement.",
      },
      {
        title: "SaaS Architecture Retainer Deliverable",
        category: "client",
        date: `${year}-02-18`,
        start: "11:00",
        end: "13:00",
        color: "#8b5cf6",
        spent: 45.0,
        anticipated: 2400.0,
        actual: 2400.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "System architecture diagram sign-off", timeWindow: "11:00–12:00", isCompleted: true },
          { id: "s2", label: "Production Supabase & API deployment", timeWindow: "12:00–13:00", isCompleted: true },
        ],
        notes: "Client milestone invoice settled in full.",
      },
      {
        title: "Executive Biometric Labs & Dental Prophylaxis",
        category: "medical",
        date: `${year}-03-11`,
        start: "08:30",
        end: "10:00",
        color: "#06b6d4",
        spent: 165.0,
        anticipated: 0,
        actual: 0,
        style: "bullets",
        subtasks: [
          { id: "s1", label: "Fasting lipid & ApoB blood panel", isCompleted: true },
          { id: "s2", label: "6-month dental cleaning & scan", isCompleted: true },
        ],
        notes: "HSA health investment.",
      },
      {
        title: "Q1 Federal & State Estimated Tax Filing",
        category: "financial",
        date: `${year}-04-15`,
        start: "10:00",
        end: "11:30",
        color: "#f59e0b",
        spent: 680.0,
        anticipated: 1500.0,
        actual: 1650.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "CPA ledger review & deduction audit", timeWindow: "10:00–10:45", isCompleted: true },
          { id: "s2", label: "Transmit EFTPS voucher + client advisory payout", timeWindow: "10:45–11:30", isCompleted: true },
        ],
        notes: "Spring tax checkpoint + advisory payout.",
      },
      {
        title: "Enterprise Platform Sprint Payout",
        category: "client",
        date: `${year}-05-21`,
        start: "13:00",
        end: "15:00",
        color: "#2563eb",
        spent: 38.0,
        anticipated: 2800.0,
        actual: 2950.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "Executive dashboard demo & QA", timeWindow: "13:00–14:00", isCompleted: true },
          { id: "s2", label: "Performance bonus scope sign-off", timeWindow: "14:00–15:00", isCompleted: true },
        ],
        notes: "Includes +$150 early delivery bonus.",
      },
      {
        title: "Nova & Astro Annual Veterinary Wellness",
        category: "personal",
        date: `${year}-06-12`,
        start: "15:30",
        end: "17:00",
        color: "#ec4899",
        spent: 240.0,
        anticipated: 0,
        actual: 0,
        style: "bullets",
        subtasks: [
          { id: "s1", label: "Husky vaccinations & orthopedic check", isCompleted: true },
          { id: "s2", label: "Restock 90-day joint & coat nutrition", isCompleted: false },
        ],
        notes: "Pack health care.",
      },
      {
        title: "Mid-Year SaaS MRR & Contract Renewal",
        category: "client",
        date: `${year}-07-16`,
        start: "09:30",
        end: "11:00",
        color: "#10b981",
        spent: 32.0,
        anticipated: 3200.0,
        actual: 3200.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "Q3 SLA uptime & latency report", timeWindow: "09:30–10:15", isCompleted: false },
          { id: "s2", label: "Execute H2 retainer renewal", timeWindow: "10:15–11:00", isCompleted: false },
        ],
        notes: "H2 contract anchor.",
      },
      {
        title: "Strategic Partner Product Workshop",
        category: "client",
        date: `${year}-08-20`,
        start: "10:00",
        end: "14:00",
        color: "#f97316",
        spent: 95.0,
        anticipated: 2200.0,
        actual: 2350.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "Zero-code AI workflow architecture", timeWindow: "10:00–12:00", isCompleted: false },
          { id: "s2", label: "Live prototype handoff", timeWindow: "12:00–14:00", isCompleted: false },
        ],
        notes: "Full-day partner build session.",
      },
      {
        title: "Q3 Tax & Portfolio Rebalance",
        category: "financial",
        date: `${year}-09-15`,
        start: "09:00",
        end: "10:00",
        color: "#eab308",
        spent: 420.0,
        anticipated: 1400.0,
        actual: 1400.0,
        style: "bullets",
        subtasks: [
          { id: "s1", label: "Quarterly treasury dividend sweep", isCompleted: false },
          { id: "s2", label: "Q3 estimated voucher check", isCompleted: false },
        ],
        notes: "Q3 fiscal discipline.",
      },
      {
        title: "Q4 Peak Shift & Overtime Expansion",
        category: "work",
        date: `${year}-10-14`,
        start: "07:00",
        end: "16:00",
        color: "#38bdf8",
        spent: 28.0,
        anticipated: 640.0,
        actual: 680.0,
        style: "roman",
        subtasks: DEFAULT_MORNING_WORK_SUBTASKS,
        notes: "Double-shift high-demand window.",
      },
      {
        title: "Black Friday SaaS Release & Consulting",
        category: "client",
        date: `${year}-11-19`,
        start: "09:00",
        end: "12:00",
        color: "#8b5cf6",
        spent: 54.0,
        anticipated: 3500.0,
        actual: 3750.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "Load test & edge cache verification", timeWindow: "09:00–10:30", isCompleted: false },
          { id: "s2", label: "Launch telemetry room & client sign-off", timeWindow: "10:30–12:00", isCompleted: false },
        ],
        notes: "Peak Q4 product release.",
      },
      {
        title: "Year-End Board Review & Bonus Closeout",
        category: "financial",
        date: `${year}-12-18`,
        start: "14:00",
        end: "16:00",
        color: "#10b981",
        spent: 110.0,
        anticipated: 4000.0,
        actual: 4200.0,
        style: "roman",
        subtasks: [
          { id: "s1", label: "12-month net cashflow & savings audit", timeWindow: "14:00–15:00", isCompleted: false },
          { id: "s2", label: "Set next-year shift & retainer targets", timeWindow: "15:00–16:00", isCompleted: false },
        ],
        notes: "Annual treasury close.",
      },
    ];

    for (const a of annualSeeds) {
      await pgExec(
        `INSERT INTO yearly_appointments
         (user_id, title, category, appointment_date, start_time, end_time, accent_color, daily_money_used, anticipated_pay, actual_pay, subtask_style, subtasks, notes)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)`,
        userId,
        a.title,
        a.category,
        a.date,
        a.start,
        a.end,
        a.color,
        a.spent,
        a.anticipated,
        a.actual,
        a.style,
        JSON.stringify(a.subtasks),
        a.notes
      );
    }
  }

  // 5. Ensure "Go to Work" 07:00–08:20 opening block exists on CircadianEvent so it renders on the Solar Dial & Agenda
  try {
    const whereClause = prismaUserId ? { userId: prismaUserId } : { userId: null };
    const existingEvents = await prisma.circadianEvent.findMany({
      where: whereClause,
      select: { id: true, title: true },
    });
    const hasGoToWork = existingEvents.some((e) =>
      e.title.toLowerCase().includes("go to work")
    );
    if (existingEvents.length > 0 && !hasGoToWork) {
      const base = parseYMD(dateStr);
      const start = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        7,
        0,
        0,
        0
      );
      const end = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        8,
        20,
        0,
        0
      );
      await prisma.circadianEvent.create({
        data: {
          userId: prismaUserId,
          title: "Go to Work",
          description:
            "07:00–08:00 structured opening shift hour with Roman-numeral execution subtasks.",
          domain: "engineering",
          startTime: start,
          endTime: end,
          isRecurring: true,
          recurrenceRule: "FREQ=DAILY",
          mediaUrl: "/circadian/saas-build.jpg",
          mediaType: "image",
          mediaAspectRatio: "16:9",
          accentColor: "#38bdf8",
          telemetrySource: "clickup",
          checklists: {
            create: DEFAULT_MORNING_WORK_SUBTASKS.map((s, idx) => ({
              label: `${s.label} (${s.timeWindow})`,
              isCompleted: s.isCompleted,
              sortOrder: idx,
            })),
          },
        },
      });
    }
  } catch {
    // Non-fatal if circadian_events isn't initialized yet
  }
}

async function buildFullState(userId: string, dateStr: string, year: number) {
  // 1. Habits + today's logs
  const habitRows = await pgQuery<any>(
    `SELECT h.id, h.title, h.subtitle, h.unit, h.target_value, h.ring_color, h.icon_name, h.sort_order,
            COALESCE(l.current_value, 0) AS current_value
     FROM calendar_habits h
     LEFT JOIN calendar_habit_logs l
       ON l.habit_id = h.id AND l.log_date = $2::date
     WHERE h.user_id = $1
     ORDER BY h.sort_order ASC, h.created_at ASC`,
    userId,
    dateStr
  );

  const habits: CalendarHabitDTO[] = habitRows.map((r) => {
    const target = Math.max(0.01, Number(r.target_value || 1));
    const current = Math.max(0, Number(r.current_value || 0));
    const pct = Math.min(100, Math.round((current / target) * 1000) / 10);
    return {
      id: String(r.id),
      title: String(r.title),
      subtitle: String(r.subtitle || ""),
      unit: String(r.unit || "steps"),
      targetValue: target,
      currentValue: current,
      pct,
      ringColor: String(r.ring_color || "#10b981"),
      iconName: String(r.icon_name || "footprints"),
      sortOrder: Number(r.sort_order || 0),
    };
  });

  // 2. Highlight spans
  const spanRows = await pgQuery<any>(
    `SELECT id, label, span_type, start_minute, end_minute, start_date, end_date, color, opacity, is_active
     FROM calendar_highlight_spans
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    userId
  );

  const highlightSpans: CalendarHighlightSpanDTO[] = spanRows.map((r) => ({
    id: String(r.id),
    label: String(r.label),
    spanType: r.span_type === "multi_day" ? "multi_day" : "hours",
    startMinute: Number(r.start_minute ?? 420),
    endMinute: Number(r.end_minute ?? 900),
    startDate: r.start_date ? normalizeDateString(r.start_date, dateStr) : null,
    endDate: r.end_date ? normalizeDateString(r.end_date, dateStr) : null,
    color: String(r.color || "#38bdf8"),
    opacity: Number(r.opacity ?? 0.2),
    isActive: Boolean(r.is_active),
  }));

  // 3. Work Shift Config + Logs + 4-Horizon Shift × Pay Summary
  const cfgRows = await pgQuery<any>(
    `SELECT role_label, pay_per_shift, hourly_rate, hours_per_shift, total_scheduled_days, shifts_per_week
     FROM work_shift_configs
     WHERE user_id = $1`,
    userId
  );
  const cfgRow = cfgRows[0] || {};
  const shiftConfig: WorkShiftConfigDTO = {
    roleLabel: String(cfgRow.role_label || "Primary Operations & Engineering Shift"),
    payPerShift: Number(cfgRow.pay_per_shift ?? 320),
    hourlyRate: Number(cfgRow.hourly_rate ?? 40),
    hoursPerShift: Number(cfgRow.hours_per_shift ?? 8),
    totalScheduledDays: Math.max(1, Number(cfgRow.total_scheduled_days ?? 22)),
    shiftsPerWeek: Math.max(0.5, Number(cfgRow.shifts_per_week ?? 5)),
  };

  const dt = parseYMD(dateStr);
  const monthStart = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEndDay = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  const monthEnd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;

  // Fetch logs spanning 20 days before monthStart through monthEnd so weekly/biweekly windows across month boundaries are exact
  const windowStart = formatYMD(
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 21)
  );
  const windowEnd = monthEnd > dateStr ? monthEnd : dateStr;

  const logRows = await pgQuery<any>(
    `SELECT id, work_date, shifts_count, pay_rate_override, anticipated_pay, actual_pay, daily_expense, status, notes, subtask_style, subtasks
     FROM work_shift_logs
     WHERE user_id = $1 AND work_date >= $2::date AND work_date <= $3::date
     ORDER BY work_date DESC`,
    userId,
    windowStart < monthStart ? windowStart : monthStart,
    windowEnd
  );

  const shiftLogs: WorkShiftLogDTO[] = logRows.map((r) => ({
    id: String(r.id),
    workDate: normalizeDateString(r.work_date, dateStr),
    shiftsCount: Number(r.shifts_count ?? 1),
    payRateOverride:
      r.pay_rate_override !== null && r.pay_rate_override !== undefined
        ? Number(r.pay_rate_override)
        : null,
    anticipatedPay: Number(r.anticipated_pay ?? shiftConfig.payPerShift),
    actualPay: Number(r.actual_pay ?? shiftConfig.payPerShift),
    dailyExpense: Number(r.daily_expense ?? 0),
    status:
      r.status === "off"
        ? "off"
        : r.status === "scheduled"
        ? "scheduled"
        : "worked",
    notes: String(r.notes || ""),
    subtaskStyle: r.subtask_style === "bullets" ? "bullets" : "roman",
    subtasks: parseSubtasksJson(r.subtasks),
  }));

  // Compute Daily, Weekly, Bi-Weekly, Monthly Shift × Pay
  const payRate = shiftConfig.payPerShift;
  const dow = dt.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStartStr = formatYMD(
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + mondayOffset)
  );
  const weekEndStr = formatYMD(
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + mondayOffset + 6)
  );
  const biWeekStartStr = formatYMD(
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + mondayOffset - 7)
  );

  const workedLogs = shiftLogs.filter((l) => l.status === "worked");
  const todayLog = workedLogs.find((l) => l.workDate === dateStr);
  const monthWorkedLogs = workedLogs.filter(
    (l) => l.workDate >= monthStart && l.workDate <= monthEnd
  );
  const weekWorkedLogs = workedLogs.filter(
    (l) => l.workDate >= weekStartStr && l.workDate <= weekEndStr
  );
  const biWeekWorkedLogs = workedLogs.filter(
    (l) => l.workDate >= biWeekStartStr && l.workDate <= weekEndStr
  );

  const dailyShifts = todayLog ? todayLog.shiftsCount : 0;
  const weeklyShifts = weekWorkedLogs.reduce((acc, l) => acc + l.shiftsCount, 0);
  const biWeeklyShifts = biWeekWorkedLogs.reduce(
    (acc, l) => acc + l.shiftsCount,
    0
  );
  const monthlyShifts = monthWorkedLogs.reduce(
    (acc, l) => acc + l.shiftsCount,
    0
  );
  const daysWorked = monthWorkedLogs.length;

  const paySummary: WorkPaySummaryDTO = {
    payRate,
    daysWorked,
    totalScheduledDays: shiftConfig.totalScheduledDays,
    workedPct:
      Math.round(
        (daysWorked / Math.max(1, shiftConfig.totalScheduledDays)) * 1000
      ) / 10,
    todayLogged: Boolean(todayLog),
    dailyShifts,
    dailyPay: Math.round(dailyShifts * payRate * 100) / 100,
    dailyExpense: todayLog ? todayLog.dailyExpense : 0,
    weeklyShifts,
    weeklyPay: Math.round(weeklyShifts * payRate * 100) / 100,
    weeklyTargetPay:
      Math.round(shiftConfig.shiftsPerWeek * payRate * 100) / 100,
    biWeeklyShifts,
    biWeeklyPay: Math.round(biWeeklyShifts * payRate * 100) / 100,
    biWeeklyTargetPay:
      Math.round(shiftConfig.shiftsPerWeek * 2 * payRate * 100) / 100,
    monthlyShifts,
    monthlyPay: Math.round(monthlyShifts * payRate * 100) / 100,
    monthlyActualPaid:
      Math.round(
        monthWorkedLogs.reduce((acc, l) => acc + l.actualPay, 0) * 100
      ) / 100,
    scheduledMonthlyTotal:
      Math.round(shiftConfig.totalScheduledDays * payRate * 100) / 100,
    monthlyExpenseTotal:
      Math.round(
        monthWorkedLogs.reduce((acc, l) => acc + l.dailyExpense, 0) * 100
      ) / 100,
  };

  // 4. Full-Year Appointments
  const apptRows = await pgQuery<any>(
    `SELECT id, title, category, appointment_date, start_time, end_time, accent_color,
            daily_money_used, anticipated_pay, actual_pay, subtask_style, subtasks, notes
     FROM yearly_appointments
     WHERE user_id = $1 AND EXTRACT(YEAR FROM appointment_date) = $2
     ORDER BY appointment_date ASC, start_time ASC`,
    userId,
    year
  );

  const appointments: YearlyAppointmentDTO[] = apptRows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    category: (["work", "client", "medical", "personal", "financial"].includes(
      r.category
    )
      ? r.category
      : "work") as AppointmentCategory,
    appointmentDate: normalizeDateString(r.appointment_date, dateStr),
    startTime: String(r.start_time || "07:00"),
    endTime: String(r.end_time || "08:00"),
    accentColor: String(r.accent_color || "#38bdf8"),
    dailyMoneyUsed: Number(r.daily_money_used ?? 0),
    anticipatedPay: Number(r.anticipated_pay ?? 0),
    actualPay: Number(r.actual_pay ?? 0),
    subtaskStyle: r.subtask_style === "bullets" ? "bullets" : "roman",
    subtasks: parseSubtasksJson(r.subtasks),
    notes: String(r.notes || ""),
  }));

  return {
    habits,
    highlightSpans,
    shiftConfig,
    shiftLogs,
    paySummary,
    appointments,
  };
}

function buildOfflineFallback(dateStr: string, year: number) {
  const habits: CalendarHabitDTO[] = [
    {
      id: "fallback-walk",
      title: "Weight-Loss Daily Walk",
      subtitle: "3.5 miles · Fat-burn full 360° ring closure",
      unit: "steps",
      targetValue: 10000,
      currentValue: 7500,
      pct: 75,
      ringColor: "#10b981",
      iconName: "footprints",
      sortOrder: 0,
    },
    {
      id: "fallback-water",
      title: "Hydration Protocol",
      subtitle: "Electrolyte + spring water daily intake",
      unit: "oz",
      targetValue: 100,
      currentValue: 80,
      pct: 80,
      ringColor: "#38bdf8",
      iconName: "droplets",
      sortOrder: 1,
    },
    {
      id: "fallback-focus",
      title: "Deep Focus Hours",
      subtitle: "Zero-distraction architectural build time",
      unit: "hrs",
      targetValue: 4,
      currentValue: 3,
      pct: 75,
      ringColor: "#f59e0b",
      iconName: "zap",
      sortOrder: 2,
    },
  ];

  const highlightSpans: CalendarHighlightSpanDTO[] = [
    {
      id: "fallback-span-1",
      label: "07:00 – 15:00 Deep Shift Window",
      spanType: "hours",
      startMinute: 420,
      endMinute: 900,
      color: "#38bdf8",
      opacity: 0.2,
      isActive: true,
    },
    {
      id: "fallback-span-2",
      label: "17:30 – 19:30 Walk & Metabolic Lock",
      spanType: "hours",
      startMinute: 1050,
      endMinute: 1170,
      color: "#10b981",
      opacity: 0.18,
      isActive: true,
    },
  ];

  const shiftConfig: WorkShiftConfigDTO = {
    roleLabel: "Primary Operations & Engineering Shift",
    payPerShift: 320,
    hourlyRate: 40,
    hoursPerShift: 8,
    totalScheduledDays: 22,
    shiftsPerWeek: 5,
  };

  const paySummary: WorkPaySummaryDTO = {
    payRate: 320,
    daysWorked: 16,
    totalScheduledDays: 22,
    workedPct: 72.7,
    todayLogged: true,
    dailyShifts: 1,
    dailyPay: 320,
    dailyExpense: 24.5,
    weeklyShifts: 5,
    weeklyPay: 1600,
    weeklyTargetPay: 1600,
    biWeeklyShifts: 10,
    biWeeklyPay: 3200,
    biWeeklyTargetPay: 3200,
    monthlyShifts: 16,
    monthlyPay: 5120,
    monthlyActualPaid: 5180,
    scheduledMonthlyTotal: 7040,
    monthlyExpenseTotal: 302,
  };

  const appointments: YearlyAppointmentDTO[] = [
    {
      id: "fallback-appt-today",
      title: "Go to Work — Primary Shift & 07:00–08:00 Launch",
      category: "work",
      appointmentDate: dateStr,
      startTime: "07:00",
      endTime: "15:00",
      accentColor: "#38bdf8",
      dailyMoneyUsed: 24.5,
      anticipatedPay: 320,
      actualPay: 340,
      subtaskStyle: "roman",
      subtasks: DEFAULT_MORNING_WORK_SUBTASKS,
      notes: "07:00–08:00 structured opening hour.",
    },
    {
      id: "fallback-appt-q2",
      title: "Enterprise SaaS Architecture Retainer",
      category: "client",
      appointmentDate: `${year}-05-21`,
      startTime: "13:00",
      endTime: "15:00",
      accentColor: "#8b5cf6",
      dailyMoneyUsed: 38,
      anticipatedPay: 2800,
      actualPay: 2950,
      subtaskStyle: "roman",
      subtasks: [
        { id: "s1", label: "System architecture sign-off", timeWindow: "13:00–14:00", isCompleted: true },
        { id: "s2", label: "Production telemetry deployment", timeWindow: "14:00–15:00", isCompleted: false },
      ],
      notes: "",
    },
  ];

  return {
    habits,
    highlightSpans,
    shiftConfig,
    shiftLogs: [],
    paySummary,
    appointments,
    fallback: true,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const todayStr = formatYMD(new Date());
  const dateStr = searchParams.get("date") || todayStr;
  const parsedYear = parseInt(
    searchParams.get("year") || dateStr.slice(0, 4),
    10
  );
  const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;

  try {
    const userId = await getLivingOsUserId();
    const session = await getServerSession(authOptions).catch(() => null);
    const prismaUserId = ((session as any)?.userId as string | undefined) ?? null;

    await ensureSchema();
    await seedIfEmpty(userId, prismaUserId, dateStr, year);
    const state = await buildFullState(userId, dateStr, year);

    return NextResponse.json(state);
  } catch (err: any) {
    console.error("calendar-ops GET fallback:", err?.message ?? err);
    return NextResponse.json(buildOfflineFallback(dateStr, year));
  }
}

export async function POST(req: NextRequest) {
  const todayStr = formatYMD(new Date());

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const dateStr = String(body.date || body.workDate || body.appointmentDate || todayStr).slice(0, 10);
    const parsedYear = parseInt(String(body.year || dateStr.slice(0, 4)), 10);
    const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;

    const userId = await getLivingOsUserId();
    const session = await getServerSession(authOptions).catch(() => null);
    const prismaUserId = ((session as any)?.userId as string | undefined) ?? null;

    await ensureSchema();

    // ── 1. Habit Ring Actions ────────────────────────────────────────────────
    if (action === "log_habit" && body.habitId) {
      if (typeof body.value === "number") {
        const nextVal = Math.max(0, body.value);
        await pgExec(
          `INSERT INTO calendar_habit_logs (user_id, habit_id, log_date, current_value, updated_at)
           VALUES ($1, $2::uuid, $3::date, $4, NOW())
           ON CONFLICT (habit_id, log_date)
           DO UPDATE SET current_value = EXCLUDED.current_value, updated_at = NOW()`,
          userId,
          body.habitId,
          dateStr,
          nextVal
        );
      } else {
        const delta = Number(body.delta ?? 1000);
        await pgExec(
          `INSERT INTO calendar_habit_logs (user_id, habit_id, log_date, current_value, updated_at)
           VALUES ($1, $2::uuid, $3::date, GREATEST(0, $4), NOW())
           ON CONFLICT (habit_id, log_date)
           DO UPDATE SET current_value = GREATEST(0, calendar_habit_logs.current_value + $4), updated_at = NOW()`,
          userId,
          body.habitId,
          dateStr,
          delta
        );
      }
    } else if (action === "create_habit" && body.title) {
      const inserted = await pgQuery<{ id: string }>(
        `INSERT INTO calendar_habits (user_id, title, subtitle, unit, target_value, ring_color, icon_name, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 99)
         RETURNING id`,
        userId,
        String(body.title).slice(0, 80),
        String(body.subtitle || "Daily full-circle 360° target").slice(0, 140),
        String(body.unit || "steps").slice(0, 24),
        Math.max(1, Number(body.targetValue || 10000)),
        String(body.ringColor || "#10b981"),
        String(body.iconName || "footprints")
      );
      if (inserted[0]?.id && Number(body.initialValue) > 0) {
        await pgExec(
          `INSERT INTO calendar_habit_logs (user_id, habit_id, log_date, current_value)
           VALUES ($1, $2::uuid, $3::date, $4)
           ON CONFLICT (habit_id, log_date) DO NOTHING`,
          userId,
          inserted[0].id,
          dateStr,
          Number(body.initialValue)
        );
      }
    } else if (action === "delete_habit" && body.habitId) {
      await pgExec(
        `DELETE FROM calendar_habits WHERE id = $1::uuid AND user_id = $2`,
        body.habitId,
        userId
      );
    }

    // ── 2. Long-Period Highlight Span Actions ────────────────────────────────
    else if (action === "create_highlight_span" && body.label) {
      const spanType = body.spanType === "multi_day" ? "multi_day" : "hours";
      await pgExec(
        `INSERT INTO calendar_highlight_spans
         (user_id, label, span_type, start_minute, end_minute, start_date, end_date, color, opacity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, TRUE)`,
        userId,
        String(body.label).slice(0, 90),
        spanType,
        Math.max(0, Math.min(1439, Number(body.startMinute ?? 420))),
        Math.max(0, Math.min(1439, Number(body.endMinute ?? 900))),
        body.startDate || null,
        body.endDate || null,
        String(body.color || "#f59e0b"),
        Math.max(0.06, Math.min(0.55, Number(body.opacity ?? 0.22)))
      );
    } else if (action === "toggle_highlight_span" && body.spanId) {
      await pgExec(
        `UPDATE calendar_highlight_spans
         SET is_active = $3
         WHERE id = $1::uuid AND user_id = $2`,
        body.spanId,
        userId,
        Boolean(body.isActive)
      );
    } else if (action === "delete_highlight_span" && body.spanId) {
      await pgExec(
        `DELETE FROM calendar_highlight_spans WHERE id = $1::uuid AND user_id = $2`,
        body.spanId,
        userId
      );
    }

    // ── 3. Work Shift & Pay Calculator Actions ───────────────────────────────
    else if (action === "update_shift_config") {
      const hourlyRate = Math.max(0, Number(body.hourlyRate ?? 40));
      const hoursPerShift = Math.max(0.5, Number(body.hoursPerShift ?? 8));
      const payPerShift =
        body.payPerShift !== undefined
          ? Math.max(0, Number(body.payPerShift))
          : Math.round(hourlyRate * hoursPerShift * 100) / 100;
      const totalScheduledDays = Math.max(
        1,
        Math.round(Number(body.totalScheduledDays ?? 22))
      );
      const shiftsPerWeek = Math.max(0.5, Number(body.shiftsPerWeek ?? 5));

      await pgExec(
        `INSERT INTO work_shift_configs
         (user_id, role_label, pay_per_shift, hourly_rate, hours_per_shift, total_scheduled_days, shifts_per_week, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           role_label = EXCLUDED.role_label,
           pay_per_shift = EXCLUDED.pay_per_shift,
           hourly_rate = EXCLUDED.hourly_rate,
           hours_per_shift = EXCLUDED.hours_per_shift,
           total_scheduled_days = EXCLUDED.total_scheduled_days,
           shifts_per_week = EXCLUDED.shifts_per_week,
           updated_at = NOW()`,
        userId,
        String(body.roleLabel || "Primary Operations & Engineering Shift").slice(0, 100),
        payPerShift,
        hourlyRate,
        hoursPerShift,
        totalScheduledDays,
        shiftsPerWeek
      );
    } else if (action === "toggle_today_shift") {
      const existing = await pgQuery<{ id: string; status: string }>(
        `SELECT id, status FROM work_shift_logs WHERE user_id = $1 AND work_date = $2::date`,
        userId,
        dateStr
      );
      const cfg = await pgQuery<{ pay_per_shift: number }>(
        `SELECT pay_per_shift FROM work_shift_configs WHERE user_id = $1`,
        userId
      );
      const rate = Number(cfg[0]?.pay_per_shift ?? 320);

      if (existing[0]?.status === "worked") {
        await pgExec(
          `UPDATE work_shift_logs SET status = 'off', shifts_count = 0, actual_pay = 0 WHERE id = $1::uuid`,
          existing[0].id
        );
      } else {
        const shiftsCount = Number(body.shiftsCount ?? 1);
        const pay = Math.round(shiftsCount * rate * 100) / 100;
        await pgExec(
          `INSERT INTO work_shift_logs
           (user_id, work_date, shifts_count, anticipated_pay, actual_pay, daily_expense, status, notes, subtask_style, subtasks)
           VALUES ($1, $2::date, $3, $4, $4, $5, 'worked', 'Logged via Shift Calculator', 'roman', $6::jsonb)
           ON CONFLICT (user_id, work_date) DO UPDATE SET
             status = 'worked',
             shifts_count = EXCLUDED.shifts_count,
             anticipated_pay = EXCLUDED.anticipated_pay,
             actual_pay = EXCLUDED.actual_pay`,
          userId,
          dateStr,
          shiftsCount,
          pay,
          Number(body.dailyExpense ?? 20),
          JSON.stringify(DEFAULT_MORNING_WORK_SUBTASKS)
        );
      }
    } else if (action === "log_work_shift") {
      const cfg = await pgQuery<{ pay_per_shift: number }>(
        `SELECT pay_per_shift FROM work_shift_configs WHERE user_id = $1`,
        userId
      );
      const rate = Number(cfg[0]?.pay_per_shift ?? 320);
      const shiftsCount = Math.max(0, Number(body.shiftsCount ?? 1));
      const anticipatedPay =
        body.anticipatedPay !== undefined
          ? Number(body.anticipatedPay)
          : Math.round(shiftsCount * rate * 100) / 100;
      const actualPay =
        body.actualPay !== undefined ? Number(body.actualPay) : anticipatedPay;

      await pgExec(
        `INSERT INTO work_shift_logs
         (user_id, work_date, shifts_count, anticipated_pay, actual_pay, daily_expense, status, notes, subtask_style, subtasks)
         VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
         ON CONFLICT (user_id, work_date) DO UPDATE SET
           shifts_count = EXCLUDED.shifts_count,
           anticipated_pay = EXCLUDED.anticipated_pay,
           actual_pay = EXCLUDED.actual_pay,
           daily_expense = EXCLUDED.daily_expense,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           subtask_style = EXCLUDED.subtask_style,
           subtasks = EXCLUDED.subtasks`,
        userId,
        dateStr,
        shiftsCount,
        anticipatedPay,
        actualPay,
        Math.max(0, Number(body.dailyExpense ?? 0)),
        body.status === "off"
          ? "off"
          : body.status === "scheduled"
          ? "scheduled"
          : "worked",
        String(body.notes || ""),
        body.subtaskStyle === "bullets" ? "bullets" : "roman",
        JSON.stringify(
          Array.isArray(body.subtasks)
            ? body.subtasks
            : DEFAULT_MORNING_WORK_SUBTASKS
        )
      );
    }

    // ── 4. Full-Year Appointments + Financials + Roman/Bullet Subtasks ──────
    else if (action === "create_appointment" && body.title) {
      const subtasks = Array.isArray(body.subtasks) ? body.subtasks : [];
      await pgExec(
        `INSERT INTO yearly_appointments
         (user_id, title, category, appointment_date, start_time, end_time, accent_color, daily_money_used, anticipated_pay, actual_pay, subtask_style, subtasks, notes)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)`,
        userId,
        String(body.title).slice(0, 120),
        String(body.category || "work"),
        String(body.appointmentDate || dateStr).slice(0, 10),
        String(body.startTime || "09:00"),
        String(body.endTime || "10:00"),
        String(body.accentColor || "#38bdf8"),
        Math.max(0, Number(body.dailyMoneyUsed ?? 0)),
        Math.max(0, Number(body.anticipatedPay ?? 0)),
        Math.max(0, Number(body.actualPay ?? 0)),
        body.subtaskStyle === "bullets" ? "bullets" : "roman",
        JSON.stringify(subtasks),
        String(body.notes || "")
      );
    } else if (action === "update_appointment" && body.id) {
      const current = await pgQuery<any>(
        `SELECT * FROM yearly_appointments WHERE id = $1::uuid AND user_id = $2`,
        body.id,
        userId
      );
      if (current[0]) {
        const c = current[0];
        const nextTitle = body.title !== undefined ? String(body.title) : c.title;
        const nextCategory = body.category !== undefined ? String(body.category) : c.category;
        const nextStart = body.startTime !== undefined ? String(body.startTime) : c.start_time;
        const nextEnd = body.endTime !== undefined ? String(body.endTime) : c.end_time;
        const nextColor = body.accentColor !== undefined ? String(body.accentColor) : c.accent_color;
        const nextMoney =
          body.dailyMoneyUsed !== undefined
            ? Math.max(0, Number(body.dailyMoneyUsed))
            : Number(c.daily_money_used ?? 0);
        const nextAnticipated =
          body.anticipatedPay !== undefined
            ? Math.max(0, Number(body.anticipatedPay))
            : Number(c.anticipated_pay ?? 0);
        const nextActual =
          body.actualPay !== undefined
            ? Math.max(0, Number(body.actualPay))
            : Number(c.actual_pay ?? 0);
        const nextStyle =
          body.subtaskStyle !== undefined
            ? body.subtaskStyle === "bullets"
              ? "bullets"
              : "roman"
            : c.subtask_style;
        const nextSubtasks =
          body.subtasks !== undefined
            ? JSON.stringify(body.subtasks)
            : JSON.stringify(parseSubtasksJson(c.subtasks));
        const nextNotes = body.notes !== undefined ? String(body.notes) : String(c.notes || "");

        await pgExec(
          `UPDATE yearly_appointments
           SET title = $3,
               category = $4,
               start_time = $5,
               end_time = $6,
               accent_color = $7,
               daily_money_used = $8,
               anticipated_pay = $9,
               actual_pay = $10,
               subtask_style = $11,
               subtasks = $12::jsonb,
               notes = $13
           WHERE id = $1::uuid AND user_id = $2`,
          body.id,
          userId,
          nextTitle,
          nextCategory,
          nextStart,
          nextEnd,
          nextColor,
          nextMoney,
          nextAnticipated,
          nextActual,
          nextStyle,
          nextSubtasks,
          nextNotes
        );
      }
    } else if (action === "delete_appointment" && body.id) {
      await pgExec(
        `DELETE FROM yearly_appointments WHERE id = $1::uuid AND user_id = $2`,
        body.id,
        userId
      );
    }

    // ── 5. Auto-Batch Pending Tasks into Time-Batched Calendar Blocks ───────
    else if (action === "auto_batch_tasks") {
      const pendingTasks = await prisma.task
        .findMany({
          where: {
            ...(prismaUserId ? { userId: prismaUserId } : {}),
            status: { notIn: ["DONE", "Done", "Completed", "ARCHIVED"] },
          },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          take: 18,
        })
        .catch(() => []);

      type BatchGroup = {
        key: string;
        title: string;
        domain: EventDomain;
        startHour: number;
        startMin: number;
        endHour: number;
        endMin: number;
        color: string;
        mediaUrl: string;
        items: string[];
      };

      const groups: Record<string, BatchGroup> = {
        ceo: {
          key: "ceo",
          title: "Executive & Capital Task Batch",
          domain: "engineering",
          startHour: 10,
          startMin: 15,
          endHour: 11,
          endMin: 45,
          color: "#f59e0b",
          mediaUrl: "/circadian/saas-build.jpg",
          items: [],
        },
        eng: {
          key: "eng",
          title: "Engineering & Systems Sprint Batch",
          domain: "engineering",
          startHour: 14,
          startMin: 0,
          endHour: 16,
          endMin: 0,
          color: "#8b5cf6",
          mediaUrl: "/circadian/saas-build.jpg",
          items: [],
        },
        life: {
          key: "life",
          title: "Personal, Health & Pack Logistics Batch",
          domain: "family_pets",
          startHour: 16,
          startMin: 15,
          endHour: 17,
          endMin: 20,
          color: "#10b981",
          mediaUrl: "/circadian/huskies-walk.jpg",
          items: [],
        },
      };

      if (pendingTasks.length > 0) {
        for (const t of pendingTasks) {
          const cat = `${t.category || ""} ${t.pillar || ""}`.toLowerCase();
          if (
            cat.includes("ceo") ||
            cat.includes("cfo") ||
            cat.includes("cmo") ||
            cat.includes("wealth") ||
            cat.includes("finance")
          ) {
            groups.ceo.items.push(t.title);
          } else if (
            cat.includes("health") ||
            cat.includes("relate") ||
            cat.includes("joy") ||
            cat.includes("personal")
          ) {
            groups.life.items.push(t.title);
          } else {
            groups.eng.items.push(t.title);
          }
        }
      } else {
        // Fallback smart executive queue batches when Task table has 0 open items
        groups.ceo.items = [
          "Review weekly cashflow & shift variance ledger",
          "Approve Q4 client retainer scope & pricing",
          "Clear priority executive inbox & partner replies",
        ];
        groups.eng.items = [
          "Ship connected calendar + budget telemetry sync",
          "Audit Supabase indexes & API response latency",
          "Lock next-day automated deployment checklist",
        ];
        groups.life.items = [
          "Prep evening high-protein meal & electrolytes",
          "Confirm Husky pack walk & recovery gear",
        ];
      }

      const base = parseYMD(dateStr);
      let createdCount = 0;

      for (const g of Object.values(groups)) {
        if (g.items.length === 0) continue;
        const sTime = new Date(
          base.getFullYear(),
          base.getMonth(),
          base.getDate(),
          g.startHour,
          g.startMin,
          0,
          0
        );
        const eTime = new Date(
          base.getFullYear(),
          base.getMonth(),
          base.getDate(),
          g.endHour,
          g.endMin,
          0,
          0
        );

        await prisma.circadianEvent
          .create({
            data: {
              userId: prismaUserId,
              title: `${g.title} (${g.items.length})`,
              description: `Auto-batched ${g.items.length} pending tasks by domain for zero-context-switching execution on ${dateStr}.`,
              domain: g.domain,
              startTime: sTime,
              endTime: eTime,
              isRecurring: false,
              mediaUrl: g.mediaUrl,
              mediaType: "image",
              mediaAspectRatio: "16:9",
              accentColor: g.color,
              telemetrySource: "clickup",
              checklists: {
                create: g.items.slice(0, 6).map((label, idx) => ({
                  label,
                  isCompleted: false,
                  sortOrder: idx,
                })),
              },
            },
          })
          .then(() => {
            createdCount++;
          })
          .catch(() => {});
      }

      const state = await buildFullState(userId, dateStr, year);
      return NextResponse.json({
        ...state,
        batchedBlocksCreated: createdCount,
        batchedTaskCount: pendingTasks.length || 8,
      });
    }

    // ── 6. Randomize Block Colors / Recolor Specific Block ──────────────────
    else if (action === "randomize_colors") {
      const shuffled = [...CURATED_BLOCK_PALETTE].sort(
        () => Math.random() - 0.5
      );
      const colorMap: Record<string, string> = {};

      const whereClause = prismaUserId ? { userId: prismaUserId } : { userId: null };
      const events = await prisma.circadianEvent
        .findMany({ where: whereClause, orderBy: { startTime: "asc" } })
        .catch(() => []);

      for (let i = 0; i < events.length; i++) {
        const hex = shuffled[i % shuffled.length].hex;
        colorMap[events[i].id] = hex;
        await prisma.circadianEvent
          .update({
            where: { id: events[i].id },
            data: { accentColor: hex },
          })
          .catch(() => {});
      }

      // Also randomize appointments on selectedDate for unified harmony
      const todaysAppts = await pgQuery<{ id: string }>(
        `SELECT id FROM yearly_appointments WHERE user_id = $1 AND appointment_date = $2::date`,
        userId,
        dateStr
      );
      for (let j = 0; j < todaysAppts.length; j++) {
        const hex = shuffled[(events.length + j) % shuffled.length].hex;
        await pgExec(
          `UPDATE yearly_appointments SET accent_color = $3 WHERE id = $1::uuid AND user_id = $2`,
          todaysAppts[j].id,
          userId,
          hex
        );
      }

      const state = await buildFullState(userId, dateStr, year);
      return NextResponse.json({ ...state, colorMap });
    } else if (action === "recolor_event" && body.eventId && body.accentColor) {
      const hex = String(body.accentColor).slice(0, 9);
      if (!String(body.eventId).startsWith("default-") && !String(body.eventId).startsWith("local-")) {
        await prisma.circadianEvent
          .update({
            where: { id: String(body.eventId) },
            data: { accentColor: hex },
          })
          .catch(() => {});
      }
    }

    const state = await buildFullState(userId, dateStr, year);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("calendar-ops POST error:", err);
    return NextResponse.json(
      { error: "Failed to process calendar-ops action", detail: err?.message },
      { status: 500 }
    );
  }
}
