import { Router } from "express";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { clubs } from "../db/schema";

export const clubsRouter = Router();

function toDto(r: typeof clubs.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    loftDegrees: r.loftDegrees,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

clubsRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(clubs).all();
  res.json(rows.map(toDto));
});

clubsRouter.post("/", async (req, res) => {
  const { name, category, loftDegrees, isActive } = req.body ?? {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }
  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "category is required" });
  }
  const now = new Date().toISOString();
  const row = {
    id: nanoid(10),
    name,
    category,
    loftDegrees: typeof loftDegrees === "number" ? loftDegrees : null,
    isActive: isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(clubs).values(row).run();
  res.status(201).json(toDto(row as typeof clubs.$inferSelect));
});

clubsRouter.patch("/:id", async (req, res) => {
  const { name, category, loftDegrees, isActive } = req.body ?? {};
  const changes: Partial<typeof clubs.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (name !== undefined) changes.name = name;
  if (category !== undefined) changes.category = category;
  if (loftDegrees !== undefined) changes.loftDegrees = loftDegrees;
  if (isActive !== undefined) changes.isActive = isActive;

  await db.update(clubs).set(changes).where(eq(clubs.id, req.params.id)).run();
  const rows = await db.select().from(clubs).where(eq(clubs.id, req.params.id)).all();
  if (rows.length === 0) return res.status(404).json({ error: "club not found" });
  res.json(toDto(rows[0]));
});
