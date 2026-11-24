
import dotenv from "dotenv";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const nodeEnv = process.env.NODE_ENV || "development";

const envFile =
  nodeEnv === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
