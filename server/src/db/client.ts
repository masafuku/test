import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "node:path";
import * as schema from "./schema";

// libSQL's local-file mode: no native compilation needed (N-API prebuilt binaries),
// unlike better-sqlite3 which can fail to build against a given Node/V8 version.
//
// Default resolves relative to this file (server/data.db), not process.cwd() —
// pm2 launches the compiled server with cwd set to the repo root, not server/,
// so a plain "./data.db" would silently point at the wrong file there while
// `npm run db:push` (cwd = server/) would create the table in a different one.
const dbPath = process.env.DB_PATH ?? path.join(__dirname, "../../data.db");
const client = createClient({ url: `file:${dbPath}` });

export const db = drizzle(client, { schema });
