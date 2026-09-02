import { Router } from "express";
import { nanoid } from "nanoid";
import { desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema";

export const sessionsRouter = Router();

function toDto(r: typeof sessions.$inferSelect) {
  return {
    id: r.id,
    type: r.type,
    label: r.label,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
  };
}

sessionsRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(sessions).orderBy(desc(sessions.startedAt)).all();
  res.json(rows.map(toDto));
});

// Mounted before "/:id/end" would otherwise be ambiguous — Express matches
// this literal path before the ":id" param route below, so no shadowing risk.
sessionsRouter.get("/current", async (_req, res) => {
  const rows = await db.select().from(sessions).where(isNull(sessions.endedAt)).all();
  res.json(rows.length > 0 ? toDto(rows[0]) : null);
});

sessionsRouter.post("/", async (req, res) => {
  const { type, label } = req.body ?? {};
  if (type !== "RANGE" && type !== "COURSE") {
    return res.status(400).json({ error: "type must be RANGE or COURSE" });
  }

  const now = new Date().toISOString();
  // Auto-close any still-open session rather than rejecting — avoids a
  // confirmation dialog for a forgotten "end" tap (see plan's session design).
  await db.update(sessions).set({ endedAt: now }).where(isNull(sessions.endedAt)).run();

  const row = {
    id: nanoid(10),
    type,
    label: typeof label === "string" && label.trim() ? label.trim() : null,
    startedAt: now,
    endedAt: null,
  };
  await db.insert(sessions).values(row).run();
  res.status(201).json(toDto(row as typeof sessions.$inferSelect));
});

sessionsRouter.patch("/:id/end", async (req, res) => {
  const now = new Date().toISOString();
  await db.update(sessions).set({ endedAt: now }).where(eq(sessions.id, req.params.id)).run();
  const rows = await db.select().from(sessions).where(eq(sessions.id, req.params.id)).all();
  if (rows.length === 0) return res.status(404).json({ error: "session not found" });
  res.json(toDto(rows[0]));
});
