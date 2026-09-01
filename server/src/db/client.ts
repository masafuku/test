import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// libSQL's local-file mode: no native compilation needed (N-API prebuilt binaries),
// unlike better-sqlite3 which can fail to build against a given Node/V8 version.
const dbPath = process.env.DB_PATH ?? "./data.db";
const client = createClient({ url: `file:${dbPath}` });

export const db = drizzle(client, { schema });
