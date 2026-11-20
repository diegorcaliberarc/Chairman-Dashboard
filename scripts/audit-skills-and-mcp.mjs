import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const JSON_MODE = process.argv.includes("--json");
const MAX_RULE_BYTES = 24_000;

const EXFIL_PATTERNS = [
  { name: "curl-pipe-shell", regex: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash|pwsh|powershell)\b/i },
  { name: "powershell-iex", regex: /\b(?:Invoke-Expression|iex\s+\(New-Object)\b/i },
  { name: "raw-dotenv-exfil", regex: /\b(?:cat|Get-Content|type)\s+\.env(?:\.local|\.production)?\b/i },
  { name: "service-role-leak", regex: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["']eyJ/i },
];

function walkFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, predicate, acc);
    } else if (predicate(full)) {
      acc.push(full);
    }
  }
  return acc;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const raw = match[1];
  const fields = {};
  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) {
      fields[kv[1]] = kv[2].trim();
    }
  }
  return { raw, fields };
}

const findings = [];
let skillsChecked = 0;
let rulesChecked = 0;
let mcpChecks = 0;

// 1. Ensure legacy duplicate `.agent/` directory does not coexist with `.agents/`
if (fs.existsSync(path.join(ROOT, ".agent"))) {
  findings.push({
    severity: "error",
    file: ".agent",
    message: "Legacy .agent/ folder coexists with canonical .agents/. Consolidate into .agents/.",
  });
}

// 2. Audit all `.agents/skills/**/SKILL.md`
const skillFiles = walkFiles(
  path.join(ROOT, ".agents", "skills"),
  (f) => path.basename(f) === "SKILL.md"
);

for (const file of skillFiles) {
  skillsChecked++;
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontmatter(content);

  if (!fm) {
    findings.push({
      severity: "error",
      file: rel,
      message: "Missing YAML frontmatter block (--- name / description ---).",
    });
  } else {
    if (!fm.fields.name) {
      findings.push({ severity: "error", file: rel, message: "Missing required 'name' frontmatter field." });
    }
    if (!fm.raw.includes("description:")) {
      findings.push({
        severity: "error",
        file: rel,
        message: "Missing required 'description' frontmatter field.",
      });
    }
  }

  for (const pat of EXFIL_PATTERNS) {
    if (pat.regex.test(content)) {
      findings.push({
        severity: "error",
        file: rel,
        message: `Blocked Zenity security pattern '${pat.name}' detected in skill instructions.`,
      });
    }
  }
}

// 3. Audit `.agents/rules/*.md` and root `AGENTS.md`
const ruleFiles = [
  ...walkFiles(path.join(ROOT, ".agents", "rules"), (f) => f.endsWith(".md")),
  ...(fs.existsSync(path.join(ROOT, "AGENTS.md")) ? [path.join(ROOT, "AGENTS.md")] : []),
];

for (const file of ruleFiles) {
  rulesChecked++;
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const stat = fs.statSync(file);
  const content = fs.readFileSync(file, "utf8");

  if (stat.size > MAX_RULE_BYTES) {
    findings.push({
      severity: "error",
      file: rel,
      message: `Rule file size (${stat.size}B) exceeds 24,000B Antigravity context budget cap.`,
    });
  }

  if (rel.startsWith(".agents/rules/")) {
    const fm = parseFrontmatter(content);
    if (!fm || !fm.fields.trigger) {
      findings.push({
        severity: "error",
        file: rel,
        message: "Workspace rule in .agents/rules/ must declare 'trigger: always_on' or 'trigger: model_decision' frontmatter.",
      });
    }
  }

  for (const pat of EXFIL_PATTERNS) {
    if (pat.regex.test(content)) {
      findings.push({
        severity: "error",
        file: rel,
        message: `Blocked Zenity security pattern '${pat.name}' detected in rule file.`,
      });
    }
  }
}

// 4. Audit FastAPI CORS & MCP Sovereign Mesh Manifest + any workspace mcp_config.json
const backendMain = path.join(ROOT, "backend", "main.py");
if (fs.existsSync(backendMain)) {
  mcpChecks++;
  const rawSrc = fs.readFileSync(backendMain, "utf8");
  const codeOnly = rawSrc
    .replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, "")
    .replace(/#.*$/gm, "");
  if (
    /allow_origins\s*=\s*\[\s*["']\*["']\s*\]/.test(codeOnly) &&
    /allow_credentials\s*=\s*True/.test(codeOnly)
  ) {
    findings.push({
      severity: "error",
      file: "backend/main.py",
      message: "Credentialed wildcard CORS (allow_origins=['*'] + allow_credentials=True) is forbidden.",
    });
  }
}

const mcpRouter = path.join(ROOT, "backend", "routers", "copilot_mcp_router.py");
if (fs.existsSync(mcpRouter)) {
  mcpChecks++;
  const src = fs.readFileSync(mcpRouter, "utf8");
  if (!src.includes("input_schema")) {
    findings.push({
      severity: "error",
      file: "backend/routers/copilot_mcp_router.py",
      message: "MCP manifest tools must declare explicit input_schema contracts.",
    });
  }
}

const mcpConfigPath = path.join(ROOT, "mcp_config.json");
if (fs.existsSync(mcpConfigPath)) {
  mcpChecks++;
  const cfg = JSON.parse(fs.readFileSync(mcpConfigPath, "utf8"));
  for (const [serverName, def] of Object.entries(cfg.mcpServers || {})) {
    if (typeof def.url === "string" && def.url.endsWith("/sse")) {
      findings.push({
        severity: "error",
        file: "mcp_config.json",
        message: `MCP server '${serverName}' uses deprecated /sse transport instead of Streamable HTTP.`,
      });
    }
  }
}

const report = {
  ok: findings.length === 0,
  skillsChecked,
  rulesChecked,
  mcpChecks,
  findings,
};

if (JSON_MODE) {
  console.log(JSON.stringify(report));
} else if (report.ok) {
  console.log(
    `[Zenity Audit PASS] ${skillsChecked} skills, ${rulesChecked} rules, ${mcpChecks} MCP surfaces verified (0 findings).`
  );
} else {
  console.error(`[Zenity Audit FAIL] ${findings.length} security/schema finding(s):`);
  for (const f of findings) {
    console.error(`  - [${f.severity.toUpperCase()}] ${f.file}: ${f.message}`);
  }
}

process.exit(report.ok ? 0 : 1);
