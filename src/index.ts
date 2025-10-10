import express from "express";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { handlerReset } from "./api/dev/reset.js";
import { middlewareErrors } from "#api/middleware/errors.js";
import { middlewareLogResponses } from "#api/middleware/logging.js";
import { router as apiRouter } from "#api/routes.js";
import { cfg } from "#config";
import { asyncHandler } from "#lib/http/asyncHandler.js";

const migrationClient = postgres(cfg.db.url, { max: 1 });
await migrate(drizzle(migrationClient), cfg.db.migrationConfig);

const PORT = cfg.api.port;

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = process.cwd();
const staticDir =
  [
    join(__dirname, "app"),
    join(projectRoot, "public/app"),
    join(projectRoot, "src/app"),
  ].find((candidate) => existsSync(candidate)) ??
  (() => {
    throw new Error("Static assets directory not found");
  })();

app.use(middlewareLogResponses);
app.use(express.json());

app.use("/app", express.static(staticDir));

app.post("/admin/reset", asyncHandler(handlerReset));

app.use("/api", apiRouter);

app.use(middlewareErrors);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
