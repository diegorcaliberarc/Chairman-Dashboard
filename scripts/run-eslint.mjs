import { spawnSync } from "node:child_process";
import path from "node:path";

const extraArgs = process.argv.slice(2);
const args = extraArgs.length > 0 ? extraArgs : [".", "--max-warnings=999"];
const eslintBin = path.resolve("node_modules", "eslint", "bin", "eslint.js");

const result = spawnSync(process.execPath, [eslintBin, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    ESLINT_USE_FLAT_CONFIG: "true",
  },
});

process.exit(result.status ?? 1);
