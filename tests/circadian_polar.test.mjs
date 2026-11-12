import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Canonical Section 4 Polar Coordinate & Cubic Bezier Specification ────────

function hhmmToMinutes(hhmm) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Math.max(0, Math.min(23, parseInt(hStr || "0", 10)));
  const m = Math.max(0, Math.min(59, parseInt(mStr || "0", 10)));
  return h * 60 + m;
}

/**
 * Section 4.1 Angle Translation Formula:
 * 00:00 ->  90° (6 o'clock Midnight Nadir)
 * 06:00 -> 180° (9 o'clock Dawn Emergence)
 * 12:00 -> 270° (12 o'clock High Noon Apex)
 * 18:00 -> 360° (3 o'clock Sunset Dusk)
 */
function minutesToAngleDeg(minutes) {
  return (minutes / 1440) * 360 + 90;
}

function normalizeAngle360(deg) {
  const mod = ((deg % 360) + 360) % 360;
  return mod === 0 && deg >= 360 ? 360 : mod;
}

function minutesToAngleRad(minutes) {
  return (minutesToAngleDeg(minutes) * Math.PI) / 180;
}

function polarToCartesian(cx, cy, radius, angleRad) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function timeToCartesian(cx, cy, radius, minutes) {
  return polarToCartesian(cx, cy, radius, minutesToAngleRad(minutes));
}

function cartesianToMinutes(cx, cy, x, y) {
  const rad = Math.atan2(y - cy, x - cx);
  const deg = (rad * 180) / Math.PI;
  let shifted = (deg - 90) % 360;
  if (shifted < 0) shifted += 360;
  return (shifted / 360) * 1440;
}

function getDurationMinutes(startMinutes, endMinutes) {
  const s = ((startMinutes % 1440) + 1440) % 1440;
  const e = ((endMinutes % 1440) + 1440) % 1440;
  if (Math.abs(endMinutes - startMinutes) >= 1439) return 1439;
  return e > s ? e - s : 1440 - s + e;
}

function getSweepAngleDeg(startMinutes, endMinutes) {
  return (getDurationMinutes(startMinutes, endMinutes) / 1440) * 360;
}

/**
 * Section 4.3 Cubic Bezier Callout Tracer Control Points:
 * C1 projected outward along dial normal vector (+normalOutreach)
 * C2 aligned horizontally with card anchor (+40px on left, -40px on right)
 */
function computeCubicTracerControlPoints(
  dialX,
  dialY,
  thetaRad,
  cardX,
  cardY,
  cardIsOnLeft,
  normalOutreach = 60
) {
  const c1 = {
    x: dialX + Math.cos(thetaRad) * normalOutreach,
    y: dialY + Math.sin(thetaRad) * normalOutreach,
  };
  const c2 = {
    x: cardX + (cardIsOnLeft ? 40 : -40),
    y: cardY,
  };
  const path = `M ${dialX.toFixed(2)},${dialY.toFixed(2)} C ${c1.x.toFixed(2)},${c1.y.toFixed(2)} ${c2.x.toFixed(2)},${c2.y.toFixed(2)} ${cardX.toFixed(2)},${cardY.toFixed(2)}`;
  return { c1, c2, path };
}

// ─── Verification Tests ───────────────────────────────────────────────────────

test("Cardinal solar anchors translate to exact Section 4.1 degrees & Cartesian points", () => {
  const CX = 500;
  const CY = 380;
  const R = 180;
  const EPS = 1e-9;

  // 00:00 -> 90° (Bottom / Midnight Nadir)
  assert.equal(minutesToAngleDeg(hhmmToMinutes("00:00")), 90);
  const p00 = timeToCartesian(CX, CY, R, hhmmToMinutes("00:00"));
  assert.ok(Math.abs(p00.x - CX) < EPS);
  assert.ok(Math.abs(p00.y - (CY + R)) < EPS);

  // 06:00 -> 180° (Left / Western Dawn Horizon)
  assert.equal(minutesToAngleDeg(hhmmToMinutes("06:00")), 180);
  const p06 = timeToCartesian(CX, CY, R, hhmmToMinutes("06:00"));
  assert.ok(Math.abs(p06.x - (CX - R)) < EPS);
  assert.ok(Math.abs(p06.y - CY) < EPS);

  // 12:00 -> 270° (Top / High Noon Solar Apex)
  assert.equal(minutesToAngleDeg(hhmmToMinutes("12:00")), 270);
  const p12 = timeToCartesian(CX, CY, R, hhmmToMinutes("12:00"));
  assert.ok(Math.abs(p12.x - CX) < EPS);
  assert.ok(Math.abs(p12.y - (CY - R)) < EPS);

  // 18:00 -> 360° (Right / Sunset Dusk Horizon)
  assert.equal(minutesToAngleDeg(hhmmToMinutes("18:00")), 360);
  assert.equal(normalizeAngle360(minutesToAngleDeg(hhmmToMinutes("18:00"))), 360);
  const p18 = timeToCartesian(CX, CY, R, hhmmToMinutes("18:00"));
  assert.ok(Math.abs(p18.x - (CX + R)) < EPS);
  assert.ok(Math.abs(p18.y - CY) < EPS);
});

test("Full 24-hour polar sweep & 96-bucket (15-min) round-trip precision", () => {
  const CX = 500;
  const CY = 380;
  const R = 204;
  const EPS = 1e-7;

  // Verify every integer hour 00:00..23:00 advances by exactly 15°/hour
  for (let hour = 0; hour < 24; hour++) {
    const mins = hour * 60;
    const expectedRawDeg = 90 + hour * 15;
    const actualRawDeg = minutesToAngleDeg(mins);
    assert.ok(
      Math.abs(actualRawDeg - expectedRawDeg) < EPS,
      `Hour ${hour}:00 expected ${expectedRawDeg}°, got ${actualRawDeg}°`
    );

    const pt = timeToCartesian(CX, CY, R, mins);
    const radialDist = Math.hypot(pt.x - CX, pt.y - CY);
    assert.ok(
      Math.abs(radialDist - R) < EPS,
      `Hour ${hour}:00 radial distance drift: ${radialDist} vs ${R}`
    );

    const recoveredMins = cartesianToMinutes(CX, CY, pt.x, pt.y);
    assert.ok(
      Math.abs(recoveredMins - mins) < 1e-6,
      `Hour ${hour}:00 inverse lookup drift: ${recoveredMins} vs ${mins}`
    );
  }

  // Verify all 96 15-minute radar buckets (3.75° per bucket)
  for (let bucket = 0; bucket < 96; bucket++) {
    const mins = bucket * 15;
    const pt = timeToCartesian(CX, CY, R, mins);
    const recoveredMins = cartesianToMinutes(CX, CY, pt.x, pt.y);
    assert.ok(
      Math.abs(recoveredMins - mins) < 1e-6,
      `Bucket ${bucket} (${mins}m) round-trip failed: got ${recoveredMins}`
    );
  }
});

test("Segment sweep angles compute exact angular spans including midnight wrap-around", () => {
  // 1 hour = 15°
  assert.equal(getSweepAngleDeg(hhmmToMinutes("09:00"), hhmmToMinutes("10:00")), 15);
  // 90 minutes = 22.5°
  assert.equal(getSweepAngleDeg(hhmmToMinutes("06:30"), hhmmToMinutes("08:00")), 22.5);
  // 3 hours = 45°
  assert.equal(getSweepAngleDeg(hhmmToMinutes("09:00"), hhmmToMinutes("12:00")), 45);
  // 8 hours overnight sleep (22:30 -> 06:30) = 480 mins = 120°
  assert.equal(getSweepAngleDeg(hhmmToMinutes("22:30"), hhmmToMinutes("06:30")), 120);
});

test("Cubic Bezier tracer control points project orthogonally from dial rim and horizontally into card anchor", () => {
  const CX = 500;
  const CY = 380;
  const R_OUTER = 290;

  // Test 1: 06:00 AM (180° = π rad, Left Hemisphere) tethered to Top-Left Card (242, 165)
  const thetaDawn = minutesToAngleRad(360); // π
  const dialDawn = polarToCartesian(CX, CY, R_OUTER, thetaDawn); // (210, 380)
  const leftTracer = computeCubicTracerControlPoints(
    dialDawn.x,
    dialDawn.y,
    thetaDawn,
    242,
    165,
    true,
    60
  );

  // Outward normal at 180° is (-1, 0) -> c1.x = 210 - 60 = 150, c1.y = 380
  assert.ok(Math.abs(leftTracer.c1.x - 150) < 1e-6);
  assert.ok(Math.abs(leftTracer.c1.y - 380) < 1e-6);
  // Left card horizontal approach -> c2.x = 242 + 40 = 282, c2.y = 165
  assert.equal(leftTracer.c2.x, 282);
  assert.equal(leftTracer.c2.y, 165);
  assert.equal(
    leftTracer.path,
    "M 210.00,380.00 C 150.00,380.00 282.00,165.00 242.00,165.00"
  );

  // Test 2: 18:00 PM (360° = 2π rad, Right Hemisphere) tethered to Bottom-Right Card (758, 585)
  const thetaDusk = minutesToAngleRad(1080); // 2π
  const dialDusk = polarToCartesian(CX, CY, R_OUTER, thetaDusk); // (790, 380)
  const rightTracer = computeCubicTracerControlPoints(
    dialDusk.x,
    dialDusk.y,
    thetaDusk,
    758,
    585,
    false,
    60
  );

  // Outward normal at 360° is (+1, 0) -> c1.x = 790 + 60 = 850, c1.y = 380
  assert.ok(Math.abs(rightTracer.c1.x - 850) < 1e-6);
  assert.ok(Math.abs(rightTracer.c1.y - 380) < 1e-6);
  // Right card horizontal approach -> c2.x = 758 - 40 = 718, c2.y = 585
  assert.equal(rightTracer.c2.x, 718);
  assert.equal(rightTracer.c2.y, 585);
});

test("Source parity check: lib/circadianMath.ts preserves exact Section 4 formulas", () => {
  const mathSrcPath = path.resolve(__dirname, "../lib/circadianMath.ts");
  const src = fs.readFileSync(mathSrcPath, "utf8");
  assert.ok(
    src.includes("f * 360 + 90"),
    "lib/circadianMath.ts must retain f * 360 + 90 angle offset"
  );
  assert.ok(
    src.includes("cardIsOnLeft ? 40 : -40"),
    "lib/circadianMath.ts must retain ±40px horizontal Bezier C2 anchor offset"
  );
});
