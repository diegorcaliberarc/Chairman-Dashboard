import { spawnSync } from "node:child_process";

function git(args) {
  const res = spawnSync("git", args, { encoding: "utf8" });
  return {
    ok: res.status === 0,
    stdout: (res.stdout || "").trim(),
    stderr: (res.stderr || "").trim(),
  };
}

const args = process.argv.slice(2);
const verifyOnly = args.includes("--verify");
const label = args.find((a) => !a.startsWith("--")) || "pre-refactor";

const head = git(["rev-parse", "--short", "HEAD"]);
const status = git(["status", "--porcelain"]);
const dirtyCount = status.stdout ? status.stdout.split(/\r?\n/).filter(Boolean).length : 0;

if (verifyOnly) {
  console.log(
    JSON.stringify({
      ok: dirtyCount === 0,
      head: head.stdout,
      dirtyFiles: dirtyCount,
      hint:
        dirtyCount === 0
          ? "Working tree is at a clean atomic git checkpoint."
          : "Commit or stash dirty files before starting a multi-file refactor (`npm run checkpoint \"label\"`).",
    })
  );
  process.exit(dirtyCount === 0 ? 0 : 1);
}

if (dirtyCount === 0) {
  console.log(
    JSON.stringify({
      ok: true,
      action: "noop-clean",
      checkpointSha: head.stdout,
      message: "Working tree already clean at atomic checkpoint.",
    })
  );
  process.exit(0);
}

git(["add", "-A"]);
const commitRes = git(["commit", "-m", `chore(checkpoint): ${label}`]);
if (!commitRes.ok) {
  console.error(JSON.stringify({ ok: false, error: commitRes.stderr || commitRes.stdout }));
  process.exit(1);
}
const nextSha = git(["rev-parse", "--short", "HEAD"]);
console.log(
  JSON.stringify({
    ok: true,
    action: "committed",
    checkpointSha: nextSha.stdout,
    label,
  })
);
