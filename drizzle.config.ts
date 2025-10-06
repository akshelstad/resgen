import { defineConfig } from "drizzle-kit";
import { cfg } from "./src/config.ts";

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: cfg.db.url,
  },
});
