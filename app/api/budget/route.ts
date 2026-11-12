export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";
import {
  BudgetEntryDTO,
  BudgetMonthDTO,
  ConnectedMonthRollupDTO,
  WorkShiftConfigDTO,
} from "@/lib/circadianTypes";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function normalizeDateStr(val: any, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === "string") return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

async function ensureBudgetSchema() {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS budget_months (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      budget_year INTEGER NOT NULL DEFAULT 2026,
      budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
      income_target NUMERIC(12,2) NOT NULL DEFAULT 8500.00,
      expense_cap NUMERIC(12,2) NOT NULL DEFAULT 4200.00,
      savings_target NUMERIC(12,2) NOT NULL DEFAULT 2500.00,
      notes TEXT DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, budget_year, budget_month)
    );
  `);

  await pgExec(`
    CREATE TABLE IF NOT EXISTS budget_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      budget_year INTEGER NOT NULL DEFAULT 2026,
      budget_month INTEGER NOT NULL CHECK (budget_month >= 1 AND budget_month <= 12),
      entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
      entry_type TEXT NOT NULL DEFAULT 'expense',
      category TEXT NOT NULL DEFAULT 'Operations',
      label TEXT NOT NULL,
      planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      actual_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      linked_source TEXT DEFAULT 'manual',
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

async function seedBudgetIfEmpty(userId: string, year: number) {
  // Ensure 12 budget_months exist
  const mCount = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM budget_months WHERE user_id = $1 AND budget_year = $2`,
    userId,
    year
  );

  if ((mCount[0]?.cnt ?? 0) < 12) {
    for (let m = 1; m <= 12; m++) {
      const seasonalIncome = m >= 10 ? 9600 : m >= 6 ? 9000 : 8600;
      const seasonalCap = m === 4 || m === 12 ? 4600 : 4100;
      const seasonalSavings = m >= 10 ? 3000 : 2500;
      await pgExec(
        `INSERT INTO budget_months (user_id, budget_year, budget_month, income_target, expense_cap, savings_target, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, budget_year, budget_month) DO NOTHING`,
        userId,
        year,
        m,
        seasonalIncome,
        seasonalCap,
        seasonalSavings,
        `${MONTH_FULL[m - 1]} connected shift + retainer + life-ops operating plan.`
      );
    }
  }

  // Ensure baseline recurring ledger entries exist for the year
  const eCount = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM budget_entries WHERE user_id = $1 AND budget_year = $2`,
    userId,
    year
  );

  if ((eCount[0]?.cnt ?? 0) === 0) {
    for (let m = 1; m <= 12; m++) {
      const mPad = String(m).padStart(2, "0");
      const baseEntries = [
        {
          date: `${year}-${mPad}-01`,
          type: "income",
          category: "SaaS MRR",
          label: "SaaS Subscriptions & Automation Micro-Tools",
          planned: 1450,
          actual: 1450 + (m % 3) * 120,
          source: "manual",
        },
        {
          date: `${year}-${mPad}-02`,
          type: "expense",
          category: "Housing & Utilities",
          label: "Mortgage / Studio Overhead & Fiber Utilities",
          planned: 2150,
          actual: 2150,
          source: "life_ops",
        },
        {
          date: `${year}-${mPad}-08`,
          type: "expense",
          category: "Nutrition & Health",
          label: "High-Protein Groceries, Electrolytes & Gym",
          planned: 780,
          actual: 745 + (m % 4) * 25,
          source: "life_ops",
        },
        {
          date: `${year}-${mPad}-14`,
          type: "expense",
          category: "Cloud & AI Stack",
          label: "Supabase Pro, Vercel, AI Model Tokens & Infra",
          planned: 310,
          actual: 295 + (m % 2) * 20,
          source: "manual",
        },
        {
          date: `${year}-${mPad}-25`,
          type: "savings",
          category: "Treasury & ETF",
          label: "Automated S&P 500 ETF + High-Yield Cash Reserve",
          planned: 2500,
          actual: m <= new Date().getMonth() + 1 ? 2600 : 2500,
          source: "manual",
        },
      ];

      for (const item of baseEntries) {
        await pgExec(
          `INSERT INTO budget_entries
           (user_id, budget_year, budget_month, entry_date, entry_type, category, label, planned_amount, actual_amount, linked_source)
           VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10)`,
          userId,
          year,
          m,
          item.date,
          item.type,
          item.category,
          item.label,
          item.planned,
          item.actual,
          item.source
        );
      }
    }
  }

  // Ensure work_shift_configs has a default row
  await pgExec(
    `INSERT INTO work_shift_configs (user_id, role_label, pay_per_shift, hourly_rate, hours_per_shift, total_scheduled_days, shifts_per_week)
     VALUES ($1, 'Primary Operations & Engineering Shift', 320.00, 40.00, 8.00, 22, 5.00)
     ON CONFLICT (user_id) DO NOTHING`,
    userId
  );
}

async function buildConnectedBudgetYear(userId: string, year: number) {
  const cfgRows = await pgQuery<any>(
    `SELECT role_label, pay_per_shift, hourly_rate, hours_per_shift, total_scheduled_days, shifts_per_week
     FROM work_shift_configs WHERE user_id = $1`,
    userId
  );
  const cfg = cfgRows[0] || {};
  const shiftConfig: WorkShiftConfigDTO = {
    roleLabel: String(cfg.role_label || "Primary Operations & Engineering Shift"),
    payPerShift: Number(cfg.pay_per_shift ?? 320),
    hourlyRate: Number(cfg.hourly_rate ?? 40),
    hoursPerShift: Number(cfg.hours_per_shift ?? 8),
    totalScheduledDays: Math.max(1, Number(cfg.total_scheduled_days ?? 22)),
    shiftsPerWeek: Math.max(0.5, Number(cfg.shifts_per_week ?? 5)),
  };

  const monthRows = await pgQuery<any>(
    `SELECT id, budget_year, budget_month, income_target, expense_cap, savings_target, notes
     FROM budget_months
     WHERE user_id = $1 AND budget_year = $2
     ORDER BY budget_month ASC`,
    userId,
    year
  );

  const entryRows = await pgQuery<any>(
    `SELECT id, budget_year, budget_month, entry_date, entry_type, category, label, planned_amount, actual_amount, linked_source
     FROM budget_entries
     WHERE user_id = $1 AND budget_year = $2
     ORDER BY budget_month ASC, entry_date ASC, created_at ASC`,
    userId,
    year
  );

  const shiftAggRows = await pgQuery<any>(
    `SELECT EXTRACT(MONTH FROM work_date)::int AS m,
            COUNT(*) FILTER (WHERE status = 'worked')::int AS worked_days,
            COALESCE(SUM(shifts_count) FILTER (WHERE status = 'worked'), 0) AS worked_shifts,
            COALESCE(SUM(anticipated_pay) FILTER (WHERE status = 'worked'), 0) AS ant_pay,
            COALESCE(SUM(actual_pay) FILTER (WHERE status = 'worked'), 0) AS act_pay,
            COALESCE(SUM(daily_expense), 0) AS shift_exp
     FROM work_shift_logs
     WHERE user_id = $1 AND EXTRACT(YEAR FROM work_date) = $2
     GROUP BY EXTRACT(MONTH FROM work_date)`,
    userId,
    year
  );

  const apptAggRows = await pgQuery<any>(
    `SELECT EXTRACT(MONTH FROM appointment_date)::int AS m,
            COUNT(*)::int AS appt_count,
            COALESCE(SUM(anticipated_pay), 0) AS ant_pay,
            COALESCE(SUM(actual_pay), 0) AS act_pay,
            COALESCE(SUM(daily_money_used), 0) AS money_used
     FROM yearly_appointments
     WHERE user_id = $1 AND EXTRACT(YEAR FROM appointment_date) = $2
     GROUP BY EXTRACT(MONTH FROM appointment_date)`,
    userId,
    year
  );

  const entries: BudgetEntryDTO[] = entryRows.map((r) => ({
    id: String(r.id),
    budgetYear: Number(r.budget_year),
    budgetMonth: Number(r.budget_month),
    entryDate: normalizeDateStr(r.entry_date, `${year}-01-01`),
    entryType:
      r.entry_type === "income"
        ? "income"
        : r.entry_type === "savings"
        ? "savings"
        : "expense",
    category: String(r.category || "Operations"),
    label: String(r.label || ""),
    plannedAmount: Number(r.planned_amount ?? 0),
    actualAmount: Number(r.actual_amount ?? 0),
    linkedSource: (["manual", "shift", "appointment", "life_ops"].includes(
      r.linked_source
    )
      ? r.linked_source
      : "manual") as BudgetEntryDTO["linkedSource"],
  }));

  const scheduledShiftMonthlyProjection =
    Math.round(shiftConfig.totalScheduledDays * shiftConfig.payPerShift * 100) /
    100;

  const months: ConnectedMonthRollupDTO[] = Array.from(
    { length: 12 },
    (_, idx) => {
      const m = idx + 1;
      const mRow = monthRows.find((r) => Number(r.budget_month) === m);
      const targets: BudgetMonthDTO = {
        id: mRow?.id ? String(mRow.id) : undefined,
        budgetYear: year,
        budgetMonth: m,
        incomeTarget: Number(mRow?.income_target ?? 8600),
        expenseCap: Number(mRow?.expense_cap ?? 4200),
        savingsTarget: Number(mRow?.savings_target ?? 2500),
        notes: String(mRow?.notes || ""),
      };

      const sRow = shiftAggRows.find((r) => Number(r.m) === m);
      const workedDays = Number(sRow?.worked_days ?? 0);
      const workedShifts = Number(sRow?.worked_shifts ?? 0);

      // If user has logged shifts in month m, use logged actual pay & scheduled projection;
      // for unlogged months in the 12-month horizon, project baseline shift baseline so 12-month comparison chart is complete and realistic
      const hasShiftLogs = workedDays > 0;
      const shiftAnticipatedPay = scheduledShiftMonthlyProjection;
      const shiftActualPay = hasShiftLogs
        ? Number(sRow?.act_pay ?? workedShifts * shiftConfig.payPerShift)
        : Math.round(
            shiftConfig.totalScheduledDays * 0.82 * shiftConfig.payPerShift
          );
      const shiftDailyExpenses = hasShiftLogs
        ? Number(sRow?.shift_exp ?? 0)
        : Math.round(shiftConfig.totalScheduledDays * 0.82 * 16);

      const aRow = apptAggRows.find((r) => Number(r.m) === m);
      const appointmentCount = Number(aRow?.appt_count ?? 0);
      const apptAnticipatedPay = Number(aRow?.ant_pay ?? 0);
      const apptActualPay = Number(aRow?.act_pay ?? 0);
      const apptDailyMoneyUsed = Number(aRow?.money_used ?? 0);

      const mEntries = entries.filter((e) => e.budgetMonth === m);
      const manualPlannedIncome = mEntries
        .filter((e) => e.entryType === "income")
        .reduce((s, e) => s + e.plannedAmount, 0);
      const manualActualIncome = mEntries
        .filter((e) => e.entryType === "income")
        .reduce((s, e) => s + e.actualAmount, 0);

      const manualPlannedExpense = mEntries
        .filter((e) => e.entryType === "expense")
        .reduce((s, e) => s + e.plannedAmount, 0);
      const manualActualExpense = mEntries
        .filter((e) => e.entryType === "expense")
        .reduce((s, e) => s + e.actualAmount, 0);

      const manualPlannedSavings = mEntries
        .filter((e) => e.entryType === "savings")
        .reduce((s, e) => s + e.plannedAmount, 0);
      const manualActualSavings = mEntries
        .filter((e) => e.entryType === "savings")
        .reduce((s, e) => s + e.actualAmount, 0);

      const totalAnticipatedIncome =
        Math.round(
          (shiftAnticipatedPay + apptAnticipatedPay + manualPlannedIncome) * 100
        ) / 100;
      const totalActualIncome =
        Math.round(
          (shiftActualPay + apptActualPay + manualActualIncome) * 100
        ) / 100;
      const totalActualSpend =
        Math.round(
          (manualActualExpense + shiftDailyExpenses + apptDailyMoneyUsed) * 100
        ) / 100;
      const totalSavings = Math.round(manualActualSavings * 100) / 100;
      const netCashFlow =
        Math.round((totalActualIncome - totalActualSpend) * 100) / 100;
      const freeCashFlowAfterSavings =
        Math.round((netCashFlow - totalSavings) * 100) / 100;
      const incomeVariance =
        Math.round((totalActualIncome - totalAnticipatedIncome) * 100) / 100;

      return {
        month: m,
        monthShort: MONTH_SHORT[idx],
        monthLabel: MONTH_FULL[idx],
        targets,
        workedDays: hasShiftLogs
          ? workedDays
          : Math.round(shiftConfig.totalScheduledDays * 0.82),
        workedShifts: hasShiftLogs
          ? workedShifts
          : Math.round(shiftConfig.totalScheduledDays * 0.82),
        scheduledDays: shiftConfig.totalScheduledDays,
        shiftAnticipatedPay,
        shiftActualPay,
        shiftDailyExpenses,
        appointmentCount,
        apptAnticipatedPay,
        apptActualPay,
        apptDailyMoneyUsed,
        manualPlannedIncome,
        manualActualIncome,
        manualPlannedExpense,
        manualActualExpense,
        manualPlannedSavings,
        manualActualSavings,
        totalAnticipatedIncome,
        totalActualIncome,
        totalActualSpend,
        totalSavings,
        netCashFlow,
        freeCashFlowAfterSavings,
        incomeVariance,
      };
    }
  );

  const annualTotals = {
    anticipatedIncome: months.reduce((s, m) => s + m.totalAnticipatedIncome, 0),
    actualIncome: months.reduce((s, m) => s + m.totalActualIncome, 0),
    incomeVariance: months.reduce((s, m) => s + m.incomeVariance, 0),
    totalSpend: months.reduce((s, m) => s + m.totalActualSpend, 0),
    annualExpenseCap: months.reduce((s, m) => s + m.targets.expenseCap, 0),
    totalSavings: months.reduce((s, m) => s + m.totalSavings, 0),
    annualSavingsTarget: months.reduce(
      (s, m) => s + m.targets.savingsTarget,
      0
    ),
    netCashFlow: months.reduce((s, m) => s + m.netCashFlow, 0),
    totalShiftIncome: months.reduce((s, m) => s + m.shiftActualPay, 0),
    totalAppointmentIncome: months.reduce((s, m) => s + m.apptActualPay, 0),
    totalCalendarSpend: months.reduce(
      (s, m) => s + m.shiftDailyExpenses + m.apptDailyMoneyUsed,
      0
    ),
    totalWorkedDays: months.reduce((s, m) => s + m.workedDays, 0),
    totalAppointments: months.reduce((s, m) => s + m.appointmentCount, 0),
  };

  return {
    year,
    shiftConfig,
    months,
    entries,
    annualTotals,
  };
}

function buildFallbackBudget(year: number) {
  const shiftConfig: WorkShiftConfigDTO = {
    roleLabel: "Primary Operations & Engineering Shift",
    payPerShift: 320,
    hourlyRate: 40,
    hoursPerShift: 8,
    totalScheduledDays: 22,
    shiftsPerWeek: 5,
  };

  const months: ConnectedMonthRollupDTO[] = MONTH_SHORT.map((short, idx) => {
    const m = idx + 1;
    const shiftAnt = 7040;
    const shiftAct = 5760 + (m % 3) * 320;
    const apptAnt = 1800 + (m % 4) * 400;
    const apptAct = apptAnt + (m % 2 === 0 ? 150 : 0);
    const manualInc = 1450;
    const totalAnt = shiftAnt + apptAnt + manualInc;
    const totalAct = shiftAct + apptAct + manualInc;
    const spend = 3650 + (m % 3) * 140;
    const sav = 2500;
    return {
      month: m,
      monthShort: short,
      monthLabel: MONTH_FULL[idx],
      targets: {
        budgetYear: year,
        budgetMonth: m,
        incomeTarget: 9200,
        expenseCap: 4200,
        savingsTarget: 2500,
        notes: `${MONTH_FULL[idx]} connected budget plan.`,
      },
      workedDays: 18,
      workedShifts: 18,
      scheduledDays: 22,
      shiftAnticipatedPay: shiftAnt,
      shiftActualPay: shiftAct,
      shiftDailyExpenses: 280,
      appointmentCount: 2,
      apptAnticipatedPay: apptAnt,
      apptActualPay: apptAct,
      apptDailyMoneyUsed: 85,
      manualPlannedIncome: manualInc,
      manualActualIncome: manualInc,
      manualPlannedExpense: 3240,
      manualActualExpense: spend - 365,
      manualPlannedSavings: sav,
      manualActualSavings: sav,
      totalAnticipatedIncome: totalAnt,
      totalActualIncome: totalAct,
      totalActualSpend: spend,
      totalSavings: sav,
      netCashFlow: totalAct - spend,
      freeCashFlowAfterSavings: totalAct - spend - sav,
      incomeVariance: totalAct - totalAnt,
    };
  });

  return {
    year,
    shiftConfig,
    months,
    entries: [],
    annualTotals: {
      anticipatedIncome: months.reduce((s, m) => s + m.totalAnticipatedIncome, 0),
      actualIncome: months.reduce((s, m) => s + m.totalActualIncome, 0),
      incomeVariance: months.reduce((s, m) => s + m.incomeVariance, 0),
      totalSpend: months.reduce((s, m) => s + m.totalActualSpend, 0),
      annualExpenseCap: months.reduce((s, m) => s + m.targets.expenseCap, 0),
      totalSavings: months.reduce((s, m) => s + m.totalSavings, 0),
      annualSavingsTarget: months.reduce(
        (s, m) => s + m.targets.savingsTarget,
        0
      ),
      netCashFlow: months.reduce((s, m) => s + m.netCashFlow, 0),
      totalShiftIncome: months.reduce((s, m) => s + m.shiftActualPay, 0),
      totalAppointmentIncome: months.reduce((s, m) => s + m.apptActualPay, 0),
      totalCalendarSpend: months.reduce(
        (s, m) => s + m.shiftDailyExpenses + m.apptDailyMoneyUsed,
        0
      ),
      totalWorkedDays: months.reduce((s, m) => s + m.workedDays, 0),
      totalAppointments: months.reduce((s, m) => s + m.appointmentCount, 0),
    },
    fallback: true,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsedYear = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
    10
  );
  const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;

  try {
    const userId = await getLivingOsUserId();
    await ensureBudgetSchema();
    await seedBudgetIfEmpty(userId, year);
    const payload = await buildConnectedBudgetYear(userId, year);
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("budget GET fallback:", err?.message ?? err);
    return NextResponse.json(buildFallbackBudget(year));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const parsedYear = parseInt(
      String(body.year || new Date().getFullYear()),
      10
    );
    const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
    const userId = await getLivingOsUserId();

    await ensureBudgetSchema();

    if (action === "update_month_targets") {
      const month = Math.max(1, Math.min(12, Number(body.month || 1)));
      await pgExec(
        `INSERT INTO budget_months (user_id, budget_year, budget_month, income_target, expense_cap, savings_target, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id, budget_year, budget_month) DO UPDATE SET
           income_target = EXCLUDED.income_target,
           expense_cap = EXCLUDED.expense_cap,
           savings_target = EXCLUDED.savings_target,
           notes = EXCLUDED.notes,
           updated_at = NOW()`,
        userId,
        year,
        month,
        Math.max(0, Number(body.incomeTarget ?? 8600)),
        Math.max(0, Number(body.expenseCap ?? 4200)),
        Math.max(0, Number(body.savingsTarget ?? 2500)),
        String(body.notes || "")
      );
    } else if (action === "create_entry" && body.label) {
      const month = Math.max(1, Math.min(12, Number(body.month || 1)));
      const defaultDate = `${year}-${String(month).padStart(2, "0")}-01`;
      await pgExec(
        `INSERT INTO budget_entries
         (user_id, budget_year, budget_month, entry_date, entry_type, category, label, planned_amount, actual_amount, linked_source)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10)`,
        userId,
        year,
        month,
        String(body.entryDate || defaultDate).slice(0, 10),
        body.entryType === "income"
          ? "income"
          : body.entryType === "savings"
          ? "savings"
          : "expense",
        String(body.category || "Operations").slice(0, 60),
        String(body.label).slice(0, 140),
        Math.max(0, Number(body.plannedAmount ?? 0)),
        Math.max(0, Number(body.actualAmount ?? 0)),
        String(body.linkedSource || "manual")
      );
    } else if (action === "update_entry" && body.id) {
      await pgExec(
        `UPDATE budget_entries
         SET label = COALESCE($3, label),
             category = COALESCE($4, category),
             planned_amount = COALESCE($5, planned_amount),
             actual_amount = COALESCE($6, actual_amount)
         WHERE id = $1::uuid AND user_id = $2`,
        body.id,
        userId,
        body.label !== undefined ? String(body.label) : null,
        body.category !== undefined ? String(body.category) : null,
        body.plannedAmount !== undefined ? Number(body.plannedAmount) : null,
        body.actualAmount !== undefined ? Number(body.actualAmount) : null
      );
    } else if (action === "delete_entry" && body.id) {
      await pgExec(
        `DELETE FROM budget_entries WHERE id = $1::uuid AND user_id = $2`,
        body.id,
        userId
      );
    }

    const payload = await buildConnectedBudgetYear(userId, year);
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("budget POST error:", err);
    return NextResponse.json(
      { error: "Failed to process budget update", detail: err?.message },
      { status: 500 }
    );
  }
}
