import { Router } from "express";
import { nanoid } from "nanoid";
import { eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { clubs, shotRecords, sessions } from "../db/schema";
import { matchClubFromText, parseShotText } from "../lib/parseShotText";

export const shotsFromTextRouter = Router();

// Headless entry point for a Siri Shortcut (see README's Shortcuts section):
// "Dictate Text" -> POST here with the raw transcript -> this does the same
// club/lie/strength/distance/direction extraction the web form does on blur,
// and creates the shot directly. There's no tap-to-correct UI in this flow,
// so club and distance are required — anything else recognized (or not) is
// best-effort, same as the web form.
shotsFromTextRouter.post("/", async (req, res) => {
  const { text } = req.body ?? {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const activeClubs = await db.select().from(clubs).where(eq(clubs.isActive, true)).all();
  const matchedClub = matchClubFromText(text, activeClubs);
  if (!matchedClub) {
    return res.status(422).json({ error: "クラブを認識できませんでした。もう一度お試しください。" });
  }

  const parsed = parseShotText(text);
  if (parsed.distanceYds == null) {
    return res.status(422).json({ error: "飛距離を認識できませんでした。もう一度お試しください。" });
  }

  const openSessionRows = await db.select().from(sessions).where(isNull(sessions.endedAt)).all();
  const sessionId = openSessionRows.length > 0 ? openSessionRows[0].id : null;

  const now = new Date().toISOString();
  const row = {
    id: nanoid(10),
    clubId: matchedClub.id,
    carryDistanceYds: parsed.distanceYds,
    totalDistanceYds: null,
    direction: parsed.direction ?? "STRAIGHT",
    strength: parsed.strength,
    lie: parsed.lie,
    lateralDeviationYds: parsed.lateralDeviationYds,
    shotShapeNotes: text,
    source: "MANUAL",
    externalId: null,
    recordedAt: now,
    sessionLabel: null,
    sessionId,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(shotRecords).values(row).run();

  res.status(201).json({
    id: row.id,
    clubId: row.clubId,
    clubName: matchedClub.name,
    carryDistanceYds: row.carryDistanceYds,
    direction: row.direction,
    strength: row.strength,
    lie: row.lie,
    lateralDeviationYds: row.lateralDeviationYds,
    summary: `${matchedClub.name}、${row.carryDistanceYds}ヤード${row.direction !== "STRAIGHT" ? "、" + row.direction : ""}を記録しました`,
  });
});
