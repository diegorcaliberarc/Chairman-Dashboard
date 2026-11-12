import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

const INSTRUMENT_POINT_VALUE: Record<string, number> = {
  MNQ: 2,
  NQ: 20,
  MES: 5,
  ES: 50,
};

const VALID_INSTRUMENTS = new Set(["MNQ", "NQ", "MES", "ES"]);
const VALID_DIRECTIONS = new Set(["LONG", "SHORT"]);
const MICRO_BUFFER_LOCK_THRESHOLD = 400;

function getTodayIsoDate(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

function makeSessionTimestamp(dateStr: string, hour: number, min: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hour, min, 0).toISOString();
}

function calculateTradePnl(params: {
  instrument: string;
  direction: string;
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  commissions: number;
}) {
  const ptVal = INSTRUMENT_POINT_VALUE[params.instrument] ?? 2;
  const pts =
    params.direction === "SHORT"
      ? params.entryPrice - params.exitPrice
      : params.exitPrice - params.entryPrice;
  const grossPnl = Number((pts * ptVal * params.contracts).toFixed(2));
  const netPnl = Number((grossPnl - params.commissions).toFixed(2));
  return { points: Number(pts.toFixed(2)), grossPnl, netPnl };
}

async function recomputeSessionTotals(sessionId: string) {
  const sums = await pgQuery<{ total_net: number }>(
    `SELECT COALESCE(SUM(net_pnl), 0)::float8 AS total_net
     FROM public.trading_trades
     WHERE session_id = $1::uuid`,
    sessionId
  );

  const sessRows = await pgQuery<{
    starting_balance: number;
    session_loss_cutoff: number;
  }>(
    `SELECT starting_balance::float8 AS starting_balance,
            COALESCE(session_loss_cutoff, 250)::float8 AS session_loss_cutoff
     FROM public.trading_sessions
     WHERE id = $1::uuid`,
    sessionId
  );

  if (sessRows.length === 0) return;

  const dailyNetPnl = Number((sums[0]?.total_net ?? 0).toFixed(2));
  const startingBalance = Number(sessRows[0].starting_balance ?? 50000);
  const lossCutoff = Math.abs(Number(sessRows[0].session_loss_cutoff ?? 250));
  const endingBalance = Number((startingBalance + dailyNetPnl).toFixed(2));
  const tripped = dailyNetPnl <= -lossCutoff;

  await pgExec(
    `UPDATE public.trading_sessions
     SET daily_net_pnl = $2::numeric,
         ending_balance = $3::numeric,
         circuit_breaker_tripped = $4::boolean
     WHERE id = $1::uuid`,
    sessionId,
    dailyNetPnl,
    endingBalance,
    tripped
  );
}

async function ensureSeededAndFetch(userId: string) {
  const existingCount = await pgQuery<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM public.trading_sessions WHERE user_id = $1`,
    userId
  );

  const today = getTodayIsoDate();

  if ((existingCount[0]?.cnt ?? 0) === 0) {
    // 1. Lucid Sim #1
    const lucidRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.trading_sessions (
         user_id, session_date, account_name, starting_balance, ending_balance,
         daily_net_pnl, max_drawdown_limit, session_loss_cutoff, circuit_breaker_tripped, copier_status
       ) VALUES ($1, $2::date, $3, 50000.00, 50000.00, 0, 2000.00, 250.00, false, 'Replikanto Synced')
       RETURNING id`,
      userId,
      today,
      "Lucid Sim #1"
    );

    if (lucidRows[0]?.id) {
      const sid = lucidRows[0].id;
      const seedTrades = [
        {
          inst: "MNQ",
          dir: "LONG",
          qty: 3,
          entry: 20410.25,
          exit: 20442.75,
          sl: 200,
          tp: 400,
          t1: makeSessionTimestamp(today, 9, 34),
          t2: makeSessionTimestamp(today, 9, 46),
          comm: 5.4,
          setup: "Opening Drive",
          add: 890,
          cvd: "Bullish",
          leaders: "NVDA ▲ · AAPL ▲ · MSFT ▲",
          notes: "Clean 5m ORB expansion above overnight high with Bookmap bid stacking.",
        },
        {
          inst: "MNQ",
          dir: "SHORT",
          qty: 2,
          entry: 20468.0,
          exit: 20489.5,
          sl: 200,
          tp: 400,
          t1: makeSessionTimestamp(today, 10, 12),
          t2: makeSessionTimestamp(today, 10, 19),
          comm: 3.6,
          setup: "Retest Short",
          add: 410,
          cvd: "Bear Div",
          leaders: "NVDA ▲ · AAPL ▬ · MSFT ▼",
          notes: "NVDA relative strength invalidated breakdown; cut cleanly inside 200-tick stop.",
        },
        {
          inst: "NQ",
          dir: "SHORT",
          qty: 1,
          entry: 20482.5,
          exit: 20461.0,
          sl: 200,
          tp: 400,
          t1: makeSessionTimestamp(today, 10, 48),
          t2: makeSessionTimestamp(today, 10, 59),
          comm: 4.8,
          setup: "Breakdown Flush",
          add: -640,
          cvd: "Bearish",
          leaders: "NVDA ▼ · AAPL ▼ · MSFT ▼",
          notes: "Synchronized mega-cap flush through session VWAP into Resting Liquidity.",
        },
        {
          inst: "MES",
          dir: "LONG",
          qty: 4,
          entry: 5862.25,
          exit: 5871.5,
          sl: 200,
          tp: 400,
          t1: makeSessionTimestamp(today, 11, 22),
          t2: makeSessionTimestamp(today, 11, 41),
          comm: 5.0,
          setup: "VWAP Reclaim",
          add: 325,
          cvd: "Bull Div",
          leaders: "NVDA ▲ · AAPL ▲ · MSFT ▬",
          notes: "Seller exhaustion absorption on CVD; scaled out into mid-day VWAP upper band.",
        },
      ];

      for (const tr of seedTrades) {
        const pnl = calculateTradePnl({
          instrument: tr.inst,
          direction: tr.dir,
          contracts: tr.qty,
          entryPrice: tr.entry,
          exitPrice: tr.exit,
          commissions: tr.comm,
        });
        await pgExec(
          `INSERT INTO public.trading_trades (
             session_id, instrument, direction, contracts, entry_price, exit_price,
             stop_loss_ticks, take_profit_ticks, entry_time, exit_time,
             gross_pnl, commissions, net_pnl, setup_name, market_add_at_entry,
             cvd_direction, leader_alignment, notes
           ) VALUES (
             $1::uuid, $2::public.trade_instrument, $3::public.trade_direction,
             $4::int, $5::numeric, $6::numeric, $7::int, $8::int,
             $9::timestamptz, $10::timestamptz, $11::numeric, $12::numeric, $13::numeric,
             $14, $15::numeric, $16, $17, $18
           )`,
          sid,
          tr.inst,
          tr.dir,
          tr.qty,
          tr.entry,
          tr.exit,
          tr.sl,
          tr.tp,
          tr.t1,
          tr.t2,
          pnl.grossPnl,
          tr.comm,
          pnl.netPnl,
          tr.setup,
          tr.add,
          tr.cvd,
          tr.leaders,
          tr.notes
        );
      }
      await recomputeSessionTotals(sid);
    }

    // 2. Apex 25k
    const apexRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.trading_sessions (
         user_id, session_date, account_name, starting_balance, ending_balance,
         daily_net_pnl, max_drawdown_limit, session_loss_cutoff, circuit_breaker_tripped, copier_status
       ) VALUES ($1, $2::date, $3, 25000.00, 25000.00, 0, 1500.00, 200.00, false, 'Replikanto Synced')
       RETURNING id`,
      userId,
      today,
      "Apex 25k"
    );

    if (apexRows[0]?.id) {
      const sid = apexRows[0].id;
      const pnl1 = calculateTradePnl({
        instrument: "MNQ",
        direction: "LONG",
        contracts: 2,
        entryPrice: 20411.0,
        exitPrice: 20454.5,
        commissions: 3.6,
      });
      await pgExec(
        `INSERT INTO public.trading_trades (
           session_id, instrument, direction, contracts, entry_price, exit_price,
           stop_loss_ticks, take_profit_ticks, entry_time, exit_time,
           gross_pnl, commissions, net_pnl, setup_name, market_add_at_entry,
           cvd_direction, leader_alignment, notes
         ) VALUES (
           $1::uuid, 'MNQ'::public.trade_instrument, 'LONG'::public.trade_direction,
           2, 20411.00, 20454.50, 200, 400, $2::timestamptz, $3::timestamptz,
           $4::numeric, 3.60, $5::numeric, 'VWAP Reclaim', 780.0, 'Bullish',
           'NVDA ▲ · AAPL ▲ · MSFT ▲', 'Copier mirrored cleanly from Lucid master feed.'
         )`,
        sid,
        makeSessionTimestamp(today, 9, 36),
        makeSessionTimestamp(today, 9, 51),
        pnl1.grossPnl,
        pnl1.netPnl
      );
      await recomputeSessionTotals(sid);
    }

    // 3. Personal Live (tight drawdown buffer < $400 to showcase Micro-Only lock readiness)
    const liveRows = await pgQuery<{ id: string }>(
      `INSERT INTO public.trading_sessions (
         user_id, session_date, account_name, starting_balance, ending_balance,
         daily_net_pnl, max_drawdown_limit, session_loss_cutoff, circuit_breaker_tripped, copier_status
       ) VALUES ($1, $2::date, $3, 15000.00, 15000.00, 0, 450.00, 250.00, false, 'NinjaTrader 8')
       RETURNING id`,
      userId,
      today,
      "Personal Live"
    );

    if (liveRows[0]?.id) {
      const sid = liveRows[0].id;
      const pnlLive = calculateTradePnl({
        instrument: "MNQ",
        direction: "SHORT",
        contracts: 2,
        entryPrice: 20465.0,
        exitPrice: 20492.5,
        commissions: 3.6,
      });
      await pgExec(
        `INSERT INTO public.trading_trades (
           session_id, instrument, direction, contracts, entry_price, exit_price,
           stop_loss_ticks, take_profit_ticks, entry_time, exit_time,
           gross_pnl, commissions, net_pnl, setup_name, market_add_at_entry,
           cvd_direction, leader_alignment, notes
         ) VALUES (
           $1::uuid, 'MNQ'::public.trade_instrument, 'SHORT'::public.trade_direction,
           2, 20465.00, 20492.50, 200, 400, $2::timestamptz, $3::timestamptz,
           $4::numeric, 3.60, $5::numeric, 'Retest Short', 210.0, 'Bear Div',
           'NVDA ▲ · AAPL ▬ · MSFT ▼', 'Buffer now under $400 — Micro-Only sizing guard engaged.'
         )`,
        sid,
        makeSessionTimestamp(today, 10, 15),
        makeSessionTimestamp(today, 10, 24),
        pnlLive.grossPnl,
        pnlLive.netPnl
      );
      await recomputeSessionTotals(sid);
    }
  }

  const sessions = await pgQuery<any>(
    `SELECT *, session_date::text AS session_date_str
     FROM public.trading_sessions
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    userId
  );

  const sessionIds = sessions.map((s) => s.id);
  let trades: any[] = [];
  if (sessionIds.length > 0) {
    trades = await pgQuery<any>(
      `SELECT t.*
       FROM public.trading_trades t
       JOIN public.trading_sessions s ON s.id = t.session_id
       WHERE s.user_id = $1
       ORDER BY t.entry_time ASC`,
      userId
    );
  }

  return {
    sessions: sessions.map((s) => ({
      ...s,
      session_date: s.session_date_str || today,
    })),
    trades,
    pointValues: INSTRUMENT_POINT_VALUE,
    microLockThreshold: MICRO_BUFFER_LOCK_THRESHOLD,
  };
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    const payload = await ensureSeededAndFetch(userId);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("[API /api/trading GET]", error);
    return NextResponse.json(
      {
        sessions: [
          {
            id: "fallback-lucid",
            session_date: getTodayIsoDate(),
            account_name: "Lucid Sim #1",
            starting_balance: 50000,
            ending_balance: 50000,
            daily_net_pnl: 0,
            max_drawdown_limit: 2000,
            session_loss_cutoff: 250,
            circuit_breaker_tripped: false,
            copier_status: "Replikanto Synced",
          },
        ],
        trades: [],
        pointValues: INSTRUMENT_POINT_VALUE,
        microLockThreshold: MICRO_BUFFER_LOCK_THRESHOLD,
        warning: error?.message || "Fallback active",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "log_trade") {
      const sessionId = String(body.sessionId || "");
      const sessRows = await pgQuery<any>(
        `SELECT * FROM public.trading_sessions WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
        sessionId,
        userId
      );
      if (sessRows.length === 0) {
        return NextResponse.json({ error: "Trading session not found" }, { status: 404 });
      }
      const sess = sessRows[0];

      const startingBal = Number(sess.starting_balance || 50000);
      const dailyNet = Number(sess.daily_net_pnl || 0);
      const currentBal = Number(sess.ending_balance ?? startingBal + dailyNet);
      const maxDd = Number(sess.max_drawdown_limit || 2000);
      const remainingBuffer = currentBal - (startingBal - maxDd);

      let instrument = String(body.instrument || "MNQ").toUpperCase();
      if (!VALID_INSTRUMENTS.has(instrument)) instrument = "MNQ";

      if (remainingBuffer < MICRO_BUFFER_LOCK_THRESHOLD && (instrument === "NQ" || instrument === "ES")) {
        return NextResponse.json(
          {
            error: `Capital Preservation Lock Active (Buffer $${remainingBuffer.toFixed(
              2
            )} < $${MICRO_BUFFER_LOCK_THRESHOLD}): Full-size ${instrument} blocked. Use MNQ or MES only.`,
          },
          { status: 400 }
        );
      }

      const direction = VALID_DIRECTIONS.has(String(body.direction || "LONG").toUpperCase())
        ? String(body.direction).toUpperCase()
        : "LONG";
      const contracts = Math.max(1, Math.round(Number(body.contracts || 1)));
      const entryPrice = Number(Number(body.entryPrice || 0).toFixed(2));
      const exitPrice = Number(Number(body.exitPrice || 0).toFixed(2));
      const stopLossTicks = Math.max(1, Math.round(Number(body.stopLossTicks ?? 200)));
      const takeProfitTicks = Math.max(1, Math.round(Number(body.takeProfitTicks ?? 400)));
      const commissions = Math.max(0, Number(Number(body.commissions ?? 4.0).toFixed(2)));
      const setupName = String(body.setupName || "VWAP Reclaim").trim().slice(0, 64);
      const rawAdd = body.marketAddAtEntry !== "" && body.marketAddAtEntry !== null && body.marketAddAtEntry !== undefined
        ? Math.max(-9999, Math.min(9999, Number(Number(body.marketAddAtEntry).toFixed(1))))
        : null;
      const cvdDirection = String(body.cvdDirection || "Bullish").trim().slice(0, 16);
      const leaderAlignment = String(body.leaderAlignment || "NVDA ▲ · AAPL ▲ · MSFT ▲")
        .trim()
        .slice(0, 64);
      const notes = body.notes ? String(body.notes).trim() : null;
      const entryTime = body.entryTime
        ? new Date(body.entryTime).toISOString()
        : new Date().toISOString();
      const exitTime = body.exitTime
        ? new Date(body.exitTime).toISOString()
        : new Date().toISOString();

      const pnl = calculateTradePnl({
        instrument,
        direction,
        contracts,
        entryPrice,
        exitPrice,
        commissions,
      });

      await pgExec(
        `INSERT INTO public.trading_trades (
           session_id, instrument, direction, contracts, entry_price, exit_price,
           stop_loss_ticks, take_profit_ticks, entry_time, exit_time,
           gross_pnl, commissions, net_pnl, setup_name, market_add_at_entry,
           cvd_direction, leader_alignment, notes
         ) VALUES (
           $1::uuid, $2::public.trade_instrument, $3::public.trade_direction,
           $4::int, $5::numeric, $6::numeric, $7::int, $8::int,
           $9::timestamptz, $10::timestamptz, $11::numeric, $12::numeric, $13::numeric,
           $14, $15::numeric, $16, $17, $18
         )`,
        sessionId,
        instrument,
        direction,
        contracts,
        entryPrice,
        exitPrice,
        stopLossTicks,
        takeProfitTicks,
        entryTime,
        exitTime,
        pnl.grossPnl,
        commissions,
        pnl.netPnl,
        setupName,
        rawAdd,
        cvdDirection,
        leaderAlignment,
        notes
      );

      await recomputeSessionTotals(sessionId);
    } else if (action === "update_session") {
      const sessionId = String(body.sessionId || "");
      const sessRows = await pgQuery<any>(
        `SELECT * FROM public.trading_sessions WHERE id = $1::uuid AND user_id = $2 LIMIT 1`,
        sessionId,
        userId
      );
      if (sessRows.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      const existing = sessRows[0];
      const maxDd =
        body.maxDrawdownLimit !== undefined
          ? Math.max(50, Number(body.maxDrawdownLimit))
          : Number(existing.max_drawdown_limit);
      const lossCutoff =
        body.sessionLossCutoff !== undefined
          ? Math.max(25, Number(body.sessionLossCutoff))
          : Number(existing.session_loss_cutoff);
      const startingBal =
        body.startingBalance !== undefined
          ? Math.max(100, Number(body.startingBalance))
          : Number(existing.starting_balance);
      const copierStatus =
        body.copierStatus !== undefined
          ? String(body.copierStatus).slice(0, 32)
          : String(existing.copier_status || "Replikanto Synced");

      await pgExec(
        `UPDATE public.trading_sessions
         SET starting_balance = $2::numeric,
             max_drawdown_limit = $3::numeric,
             session_loss_cutoff = $4::numeric,
             copier_status = $5
         WHERE id = $1::uuid`,
        sessionId,
        startingBal,
        maxDd,
        lossCutoff,
        copierStatus
      );

      await recomputeSessionTotals(sessionId);
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const updated = await ensureSeededAndFetch(userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API /api/trading POST]", error);
    return NextResponse.json(
      { error: error?.message || "Trading mutation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const tradeId = req.nextUrl.searchParams.get("tradeId");
    if (!tradeId) {
      return NextResponse.json({ error: "Missing tradeId" }, { status: 400 });
    }

    const rows = await pgQuery<{ session_id: string }>(
      `SELECT t.session_id
       FROM public.trading_trades t
       JOIN public.trading_sessions s ON s.id = t.session_id
       WHERE t.id = $1::uuid AND s.user_id = $2
       LIMIT 1`,
      tradeId,
      userId
    );

    if (rows.length > 0) {
      await pgExec(`DELETE FROM public.trading_trades WHERE id = $1::uuid`, tradeId);
      await recomputeSessionTotals(rows[0].session_id);
    }

    const updated = await ensureSeededAndFetch(userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API /api/trading DELETE]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete trade" },
      { status: 500 }
    );
  }
}
