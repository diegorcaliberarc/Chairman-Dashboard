export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export type RadarLayerType =
  | "energy_forecast"
  | "activity_density"
  | "posture_biometrics"
  | "metabolic_burn";

const ALL_RADAR_TYPES: RadarLayerType[] = [
  "energy_forecast",
  "activity_density",
  "posture_biometrics",
  "metabolic_burn",
];

const RADAR_META: Record<
  RadarLayerType,
  {
    label: string;
    shortLabel: string;
    unit: string;
    color: string;
    secondaryColor: string;
    description: string;
  }
> = {
  energy_forecast: {
    label: "Energy Forecast",
    shortLabel: "ENERGY",
    unit: "% ATP",
    color: "#38bdf8",
    secondaryColor: "#fbbf24",
    description: "Two-process circadian cognitive alertness & cortisol-melatonin wave",
  },
  activity_density: {
    label: "Activity Heatmap",
    shortLabel: "ACTIVITY",
    unit: "% KINETIC",
    color: "#10b981",
    secondaryColor: "#34d399",
    description: "15-min operational & physical output density across scheduled blocks",
  },
  posture_biometrics: {
    label: "Posture Load",
    shortLabel: "POSTURE",
    unit: "% AXIAL",
    color: "#a855f7",
    secondaryColor: "#ec4899",
    description: "Cumulative spinal/cervical & sympathetic biomechanical load index",
  },
  metabolic_burn: {
    label: "Metabolic Burn",
    shortLabel: "METABOLIC",
    unit: "% THERMO",
    color: "#f97316",
    secondaryColor: "#ef4444",
    description: "Basal + EPOC + dietary thermogenic oxidation trajectory",
  },
};

function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function gaussian(x: number, mean: number, sigma: number, amp: number): number {
  const z = (x - mean) / sigma;
  return amp * Math.exp(-0.5 * z * z);
}

function clamp100(v: number): number {
  return Math.max(4, Math.min(99, Math.round(v)));
}

function dateSeedOffset(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % 997;
  }
  return ((hash % 7) - 3) * 1.2;
}

/**
 * Generates a realistic 96-point (15-min bucket, 00:00..23:45) physiological curve,
 * optionally modulated by live scheduled circadian events on that date.
 */
function build96BucketCurve(
  layerType: RadarLayerType,
  dateStr: string,
  events?: Array<{ domain?: string; startTime?: string; endTime?: string }>
): number[] {
  const delta = dateSeedOffset(dateStr);
  const values: number[] = [];

  for (let b = 0; b < 96; b++) {
    const mins = b * 15; // 0 .. 1425
    const hours = mins / 60; // 0 .. 23.75
    let val = 20;

    if (layerType === "energy_forecast") {
      // Cortisol awakening + mid-morning cognitive zenith + afternoon rebound + melatonin nadir
      val =
        16 +
        gaussian(hours, 9.75, 2.3, 76) +
        gaussian(hours, 16.25, 2.0, 58) -
        gaussian(hours, 14.0, 1.1, 16) +
        gaussian(hours, 6.75, 1.2, 22) +
        delta;
    } else if (layerType === "activity_density") {
      // Gym hypertrophy (06:30-08:00), Deep Engineering (09:00-12:30 & 14:00-17:00), Sunset Pack Walk (17:45)
      val =
        10 +
        gaussian(hours, 7.25, 0.85, 82) +
        gaussian(hours, 10.5, 1.6, 74) +
        gaussian(hours, 15.25, 1.4, 66) +
        gaussian(hours, 18.0, 0.75, 78) +
        delta;
    } else if (layerType === "posture_biometrics") {
      // Supine overnight recovery -> axial barbell spike -> cumulative desk load -> evening walk decompression
      val =
        12 +
        gaussian(hours, 7.25, 0.7, 62) +
        gaussian(hours, 11.5, 1.9, 64) +
        gaussian(hours, 15.75, 1.7, 72) -
        gaussian(hours, 18.25, 0.9, 20) +
        delta;
    } else if (layerType === "metabolic_burn") {
      // BMR overnight -> intense training + EPOC surge -> fasted oxidation -> dinner thermogenesis
      val =
        26 +
        gaussian(hours, 7.35, 1.0, 69) +
        gaussian(hours, 9.5, 1.8, 34) +
        gaussian(hours, 13.0, 1.1, 36) +
        gaussian(hours, 18.1, 0.9, 44) +
        gaussian(hours, 19.5, 1.2, 32) +
        delta;
    }

    // Optional live event modulation when recalibrating from user's schedule
    if (Array.isArray(events) && events.length > 0) {
      for (const ev of events) {
        if (!ev?.startTime || !ev?.endTime) continue;
        const sDate = new Date(ev.startTime);
        const eDate = new Date(ev.endTime);
        const sMin = sDate.getHours() * 60 + sDate.getMinutes();
        const eMin = eDate.getHours() * 60 + eDate.getMinutes();
        const inWindow =
          eMin > sMin
            ? mins >= sMin && mins < eMin
            : mins >= sMin || mins < eMin;
        if (!inWindow) continue;

        if (ev.domain === "physical_training") {
          if (layerType === "activity_density") val = Math.max(val, 91);
          if (layerType === "metabolic_burn") val = Math.max(val, 94);
          if (layerType === "posture_biometrics") val = Math.max(val, 78);
        } else if (ev.domain === "engineering") {
          if (layerType === "energy_forecast") val = Math.max(val, 86);
          if (layerType === "posture_biometrics") val = Math.min(96, val + 12);
          if (layerType === "activity_density") val = Math.max(val, 76);
        } else if (ev.domain === "nutrition" && layerType === "metabolic_burn") {
          val = Math.min(95, val + 14);
        } else if (ev.domain === "family_pets" && layerType === "activity_density") {
          val = Math.max(val, 82);
        }
      }
    }

    values.push(clamp100(val));
  }

  return values;
}

function computeExtremaTimestamps(dateStr: string, values: number[]) {
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[maxIdx]) maxIdx = i;
    if (values[i] < values[minIdx]) minIdx = i;
  }

  const bucketToIso = (bucketIdx: number, addMinutes = 0): string => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const totalMin = bucketIdx * 15 + addMinutes;
    const dt = new Date(
      y,
      (m || 1) - 1,
      d || 1,
      Math.floor(totalMin / 60),
      totalMin % 60,
      0,
      0
    );
    return dt.toISOString();
  };

  return {
    peakStartTime: bucketToIso(maxIdx, 0),
    peakEndTime: bucketToIso(maxIdx, 45),
    troughStartTime: bucketToIso(minIdx, 0),
    troughEndTime: bucketToIso(minIdx, 45),
    peakBucket: maxIdx,
    troughBucket: minIdx,
    peakValue: values[maxIdx] ?? 0,
    troughValue: values[minIdx] ?? 0,
  };
}

function normalizeBucketArray(raw: any, layerType: RadarLayerType, dateStr: string): number[] {
  let parsed = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    const nums = parsed.map((item: any) =>
      typeof item === "number"
        ? clamp100(item)
        : typeof item?.value === "number"
        ? clamp100(item.value)
        : 50
    );
    if (nums.length === 96) return nums;
  }
  return build96BucketCurve(layerType, dateStr);
}

function formatLayerResponse(
  row: {
    id?: string;
    layer_type: RadarLayerType;
    time_bucket_minutes?: number;
    bucket_values: any;
    peak_start_time?: string | null;
    peak_end_time?: string | null;
    trough_start_time?: string | null;
    trough_end_time?: string | null;
  },
  dateStr: string
) {
  const layerType = row.layer_type;
  const values = normalizeBucketArray(row.bucket_values, layerType, dateStr);
  const extrema = computeExtremaTimestamps(dateStr, values);
  const avg = Math.round(
    values.reduce((acc, v) => acc + v, 0) / Math.max(1, values.length)
  );
  const meta = RADAR_META[layerType];

  return {
    id: row.id || `radar-${layerType}-${dateStr}`,
    layerType,
    label: meta.label,
    shortLabel: meta.shortLabel,
    unit: meta.unit,
    color: meta.color,
    secondaryColor: meta.secondaryColor,
    description: meta.description,
    timeBucketMinutes: row.time_bucket_minutes || 15,
    bucketValues: values,
    points: values.map((v, idx) => {
      const totalMins = idx * 15;
      const hh = String(Math.floor(totalMins / 60)).padStart(2, "0");
      const mm = String(totalMins % 60).padStart(2, "0");
      return {
        bucket: idx,
        minute: totalMins,
        hhmm: `${hh}:${mm}`,
        value: v,
      };
    }),
    peakStartTime: row.peak_start_time || extrema.peakStartTime,
    peakEndTime: row.peak_end_time || extrema.peakEndTime,
    troughStartTime: row.trough_start_time || extrema.troughStartTime,
    troughEndTime: row.trough_end_time || extrema.troughEndTime,
    peakBucket: extrema.peakBucket,
    troughBucket: extrema.troughBucket,
    peakValue: extrema.peakValue,
    troughValue: extrema.troughValue,
    averageValue: avg,
  };
}

export async function GET(req: NextRequest) {
  const userId = await getLivingOsUserId();
  const { searchParams } = new URL(req.url);
  const rawDate = searchParams.get("date");
  const dateStr =
    rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : getTodayDateStr();

  try {
    let rows = await pgQuery<{
      id: string;
      user_id: string;
      layer_type: RadarLayerType;
      time_bucket_minutes: number;
      bucket_values: any;
      peak_start_time: string | null;
      peak_end_time: string | null;
      trough_start_time: string | null;
      trough_end_time: string | null;
    }>(
      `SELECT
         id::text AS id,
         user_id,
         layer_type::text AS layer_type,
         time_bucket_minutes,
         bucket_values,
         peak_start_time,
         peak_end_time,
         trough_start_time,
         trough_end_time
       FROM public.circadian_radar_layers
       WHERE user_id = $1 AND date = $2::date`,
      userId,
      dateStr
    );

    const existingTypes = new Set(rows.map((r) => r.layer_type));

    // Seed any missing radar layer among the 4 canonical 96-point layers
    if (existingTypes.size < ALL_RADAR_TYPES.length) {
      for (const layerType of ALL_RADAR_TYPES) {
        if (existingTypes.has(layerType)) continue;
        const values = build96BucketCurve(layerType, dateStr);
        const extrema = computeExtremaTimestamps(dateStr, values);

        await pgExec(
          `INSERT INTO public.circadian_radar_layers (
             user_id,
             date,
             layer_type,
             time_bucket_minutes,
             bucket_values,
             peak_start_time,
             peak_end_time,
             trough_start_time,
             trough_end_time
           ) VALUES (
             $1,
             $2::date,
             $3::public.radar_layer_type,
             15,
             $4::jsonb,
             $5::timestamptz,
             $6::timestamptz,
             $7::timestamptz,
             $8::timestamptz
           )
           ON CONFLICT (user_id, date, layer_type) DO NOTHING`,
          userId,
          dateStr,
          layerType,
          JSON.stringify(values),
          extrema.peakStartTime,
          extrema.peakEndTime,
          extrema.troughStartTime,
          extrema.troughEndTime
        );
      }

      rows = await pgQuery(
        `SELECT
           id::text AS id,
           user_id,
           layer_type::text AS layer_type,
           time_bucket_minutes,
           bucket_values,
           peak_start_time,
           peak_end_time,
           trough_start_time,
           trough_end_time
         FROM public.circadian_radar_layers
         WHERE user_id = $1 AND date = $2::date`,
        userId,
        dateStr
      );
    }

    const ordered = ALL_RADAR_TYPES.map((lt) => {
      const found = rows.find((r) => r.layer_type === lt);
      return formatLayerResponse(
        found || {
          layer_type: lt,
          bucket_values: build96BucketCurve(lt, dateStr),
        },
        dateStr
      );
    });

    return NextResponse.json({
      date: dateStr,
      userId,
      bucketCount: 96,
      layers: ordered,
    });
  } catch (err: any) {
    console.error("Circadian Radar GET fallback:", err?.message ?? err);
    const fallbackLayers = ALL_RADAR_TYPES.map((lt) =>
      formatLayerResponse(
        {
          layer_type: lt,
          bucket_values: build96BucketCurve(lt, dateStr),
        },
        dateStr
      )
    );
    return NextResponse.json({
      date: dateStr,
      userId,
      bucketCount: 96,
      layers: fallbackLayers,
      fallback: true,
    });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getLivingOsUserId();

  try {
    const body = await req.json();
    const rawDate = body?.date;
    const dateStr =
      typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? rawDate
        : getTodayDateStr();

    const targetTypes: RadarLayerType[] =
      body?.layerType && ALL_RADAR_TYPES.includes(body.layerType)
        ? [body.layerType]
        : ALL_RADAR_TYPES;

    const updatedLayers = [];

    for (const layerType of targetTypes) {
      const customBuckets =
        targetTypes.length === 1 &&
        Array.isArray(body?.bucketValues) &&
        body.bucketValues.length === 96
          ? body.bucketValues.map((v: any) => clamp100(Number(v) || 0))
          : build96BucketCurve(layerType, dateStr, body?.events);

      const extrema = computeExtremaTimestamps(dateStr, customBuckets);

      try {
        await pgExec(
          `INSERT INTO public.circadian_radar_layers (
             user_id,
             date,
             layer_type,
             time_bucket_minutes,
             bucket_values,
             peak_start_time,
             peak_end_time,
             trough_start_time,
             trough_end_time
           ) VALUES (
             $1,
             $2::date,
             $3::public.radar_layer_type,
             15,
             $4::jsonb,
             $5::timestamptz,
             $6::timestamptz,
             $7::timestamptz,
             $8::timestamptz
           )
           ON CONFLICT (user_id, date, layer_type) DO UPDATE SET
             bucket_values = EXCLUDED.bucket_values,
             peak_start_time = EXCLUDED.peak_start_time,
             peak_end_time = EXCLUDED.peak_end_time,
             trough_start_time = EXCLUDED.trough_start_time,
             trough_end_time = EXCLUDED.trough_end_time`,
          userId,
          dateStr,
          layerType,
          JSON.stringify(customBuckets),
          extrema.peakStartTime,
          extrema.peakEndTime,
          extrema.troughStartTime,
          extrema.troughEndTime
        );
      } catch (dbErr: any) {
        console.warn("Circadian Radar POST DB upsert fallback:", dbErr?.message);
      }

      updatedLayers.push(
        formatLayerResponse(
          {
            layer_type: layerType,
            bucket_values: customBuckets,
            peak_start_time: extrema.peakStartTime,
            peak_end_time: extrema.peakEndTime,
            trough_start_time: extrema.troughStartTime,
            trough_end_time: extrema.troughEndTime,
          },
          dateStr
        )
      );
    }

    return NextResponse.json({
      ok: true,
      date: dateStr,
      userId,
      layers: updatedLayers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update circadian radar layers", detail: err?.message },
      { status: 500 }
    );
  }
}
