import { Router } from "express";
import { nanoid } from "nanoid";
import { eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { shotRecords, sessions } from "../db/schema";

export const shotsRouter = Router();

function toDto(r: typeof shotRecords.$inferSelect) {
  return {
    id: r.id,
    clubId: r.clubId,
    carryDistanceYds: r.carryDistanceYds,
    totalDistanceYds: r.totalDistanceYds,
    direction: r.direction,
    strength: r.strength,
    lie: r.lie,
    lateralDeviationYds: r.lateralDeviationYds,
    shotShapeNotes: r.shotShapeNotes,
    source: r.source,
    externalId: r.externalId,
    recordedAt: r.recordedAt,
    sessionLabel: r.sessionLabel,
    sessionId: r.sessionId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** Whatever session is currently open (endedAt IS NULL), if any — see routes/sessions.ts. */
async function currentSessionId(): Promise<string | null> {
  const rows = await db.select().from(sessions).where(isNull(sessions.endedAt)).all();
  return rows.length > 0 ? rows[0].id : null;
}

shotsRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(shotRecords).all();
  res.json(rows.map(toDto));
});

shotsRouter.post("/", async (req, res) => {
  const {
    clubId,
    carryDistanceYds,
    totalDistanceYds,
    direction,
    strength,
    lie,
    lateralDeviationYds,
    shotShapeNotes,
    sessionLabel,
    recordedAt,
    source,
  } = req.body ?? {};

  if (!clubId || typeof clubId !== "string") {
    return res.status(400).json({ error: "clubId is required" });
  }

  const now = new Date().toISOString();
  const row = {
    id: nanoid(10),
    clubId,
    carryDistanceYds: typeof carryDistanceYds === "number" ? carryDistanceYds : null,
    totalDistanceYds: typeof totalDistanceYds === "number" ? totalDistanceYds : null,
    direction: direction ?? null,
    strength: strength ?? null,
    lie: lie ?? null,
    lateralDeviationYds: typeof lateralDeviationYds === "number" ? lateralDeviationYds : null,
    shotShapeNotes: shotShapeNotes ?? null,
    source: source ?? "MANUAL",
    externalId: null,
    recordedAt: recordedAt ?? now,
    sessionLabel: sessionLabel ?? null,
    // Always server-decided (see currentSessionId) — never trust a client-supplied value.
    sessionId: await currentSessionId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(shotRecords).values(row).run();
  res.status(201).json(toDto(row as typeof shotRecords.$inferSelect));
});

shotsRouter.delete("/:id", async (req, res) => {
  await db.delete(shotRecords).where(eq(shotRecords.id, req.params.id)).run();
  res.status(204).end();
});
