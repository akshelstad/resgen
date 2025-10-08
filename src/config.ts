// "dev": "npx tsc && node dist/index.js",

import type { MigrationConfig } from "drizzle-orm/migrator";

type Config = {
  api: APIConfig;
  db: DBConfig;
  jwt: JWTConfig;
  ai: AIConfig;
};

type APIConfig = {
  port: number;
  platform: string;
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type JWTConfig = {
  defaultDuration: number;
  refreshDuration: number;
  secret: string;
  issuer: string;
};

type AIConfig = {
  key: string;
};

process.loadEnvFile();

function envOrThrow(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`environment variable ${key} not set`);
  return v;
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

export const cfg: Config = {
  api: {
    port: Number(envOrThrow("PORT")),
    platform: envOrThrow("PLATFORM"),
  },
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: migrationConfig,
  },
  jwt: {
    defaultDuration: 60 * 60,
    refreshDuration: 60 * 60 * 24 * 60 * 1000,
    secret: envOrThrow("JWT_SECRET"),
    issuer: "resgen",
  },
  ai: {
    key: envOrThrow("OPENAI_KEY"),
  },
};
