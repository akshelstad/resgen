import { cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const candidateSources = [
  join(projectRoot, "public", "app"),
  join(projectRoot, "src", "app"),
];
const sourceDir = candidateSources.find((dir) => existsSync(dir));
const destDir = join(projectRoot, "dist", "app");

if (!sourceDir) {
  process.exit(0);
}

await cp(sourceDir, destDir, { recursive: true });
