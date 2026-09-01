import type { Config } from "drizzle-kit";

// "turso" dialect = libSQL, which is what we use at runtime (server/src/db/client.ts)
// to avoid better-sqlite3's native compilation issues. Works fine against a local file.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: `file:${process.env.DB_PATH ?? "./data.db"}`,
  },
} satisfies Config;
