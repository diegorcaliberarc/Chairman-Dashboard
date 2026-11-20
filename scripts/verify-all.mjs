import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const JSON_MODE = process.argv.includes("--json");
const LOG_DIR = path.resolve("test-results");
const LOG_FILE = path.join(LOG_DIR, "verify-all.log");

fs.mkdirSync(LOG_DIR, { recursive: true });
fs.writeFileSync(LOG_FILE, "", "utf8");

function resolvePythonCommand() {
  for (const candidate of ["python", "python3"]) {
    const check = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (check.status === 0) {
      return candidate;
    }
  }
  return "python3";
}

const PYTHON_BIN = resolvePythonCommand();

/**
 * 7-Stage Deterministic Verification Pipeline (v3.0 Autonomous Software Factory):
 * Captures verbose compiler/linter/bundler output to test-results/verify-all.log
 * and surfaces a compact <1.5 KB machine-readable summary for agent efficiency.
 */
const GATES = [
  {
    id: "typecheck",
    label: "TypeScript Strict Compiler (tsc --noEmit)",
    cmd: process.execPath,
    args: [path.resolve("node_modules/typescript/bin/tsc"), "--noEmit"],
  },
  {
    id: "lint:strict",
    label: "ESLint Strict Modern Layers (0 warnings, noInlineConfig)",
    cmd: process.execPath,
    args: [
      path.resolve("scripts/run-eslint.mjs"),
      "features",
      "shared",
      "services",
      "--max-warnings=0",
    ],
  },
  {
    id: "lint",
    label: "ESLint Full Repository Boundary & Legacy Ratchet (--max-warnings=151)",
    cmd: process.execPath,
    args: [path.resolve("scripts/run-eslint.mjs"), ".", "--max-warnings=151"],
  },
  {
    id: "audit:skills",
    label: "Zenity Skill, Rule & MCP Security Audit",
    cmd: process.execPath,
    args: [path.resolve("scripts/audit-skills-and-mcp.mjs"), "--json"],
  },
  {
    id: "test:unit",
    label: "Vitest Spend-Isolated State Machine & Unit Suite",
    cmd: process.execPath,
    args: [path.resolve("node_modules/vitest/vitest.mjs"), "run"],
  },
  {
    id: "test:backend",
    label: "FastAPI Pydantic & Spend-Isolated Pytest Suite",
    cmd: PYTHON_BIN,
    args: ["-m", "pytest"],
  },
  {
    id: "build",
    label: "Next.js Production Bundle & Static Route Build",
    cmd: process.execPath,
    args: [path.resolve("node_modules/next/dist/bin/next"), "build"],
  },
];

const startedAt = Date.now();
const results = [];
let allOk = true;

for (const gate of GATES) {
  const t0 = Date.now();
  const res = spawnSync(gate.cmd, gate.args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      ESLINT_USE_FLAT_CONFIG: "true",
    },
  });

  const durationMs = Date.now() - t0;
  const combined = `${res.stdout || ""}\n${res.stderr || ""}`.trim();
  fs.appendFileSync(
    LOG_FILE,
    `=== [${gate.id}] exit=${res.status} (${durationMs}ms) ===\n${combined}\n\n`,
    "utf8"
  );

  const ok = res.status === 0;
  const entry = {
    id: gate.id,
    status: ok ? "PASS" : "FAIL",
    durationMs,
  };

  if (gate.id === "lint") {
    const probMatch = combined.match(/✖\s+(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/);
    entry.errors = probMatch ? Number(probMatch[2]) : ok ? 0 : 1;
    entry.warnings = probMatch ? Number(probMatch[3]) : 0;
  }

  if (!ok) {
    allOk = false;
    entry.failureTail = combined
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-18);
    results.push(entry);
    break;
  }

  results.push(entry);
}

const summary = {
  ok: allOk,
  factoryVersion: "3.0.0",
  passedGates: results.filter((r) => r.status === "PASS").length,
  totalGates: GATES.length,
  totalDurationMs: Date.now() - startedAt,
  rawLogPath: "test-results/verify-all.log",
  gates: results,
};

if (JSON_MODE) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  const sec = (summary.totalDurationMs / 1000).toFixed(1);
  console.log(
    `\n[Chairman Factory v3.0] ${allOk ? "PASS" : "FAIL"} (${summary.passedGates}/${summary.totalGates} gates in ${sec}s) — raw log: ${summary.rawLogPath}`
  );
  for (const g of results) {
    const extra =
      g.warnings !== undefined ? ` (${g.errors} errors, ${g.warnings} legacy warnings)` : "";
    console.log(`  ${g.status === "PASS" ? "✓" : "✗"} ${g.id.padEnd(14)} ${(g.durationMs / 1000).toFixed(1).padStart(5)}s${extra}`);
    if (g.failureTail) {
      console.error("\n--- Actionable Failure Tail ---");
      console.error(g.failureTail.join("\n"));
    }
  }
}

process.exit(allOk ? 0 : 1);
