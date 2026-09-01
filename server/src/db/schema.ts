import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// Mirrors the field shapes of the old Amplify Club/ShotRecord models 1:1 so
// client/src/types/models.ts didn't need to change during the AWS→SQLite
// migration (see the golf-app migration plan).

export const clubs = sqliteTable("clubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // ClubCategory union, see client/src/types/models.ts
  loftDegrees: real("loft_degrees"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const shotRecords = sqliteTable("shot_records", {
  id: text("id").primaryKey(),
  clubId: text("club_id").notNull(),
  carryDistanceYds: real("carry_distance_yds"),
  totalDistanceYds: real("total_distance_yds"),
  direction: text("direction"), // ShotDirection union, see client/src/types/models.ts
  strength: text("strength"), // ShotStrength union, see client/src/types/models.ts
  lateralDeviationYds: real("lateral_deviation_yds"),
  shotShapeNotes: text("shot_shape_notes"),
  source: text("source").notNull(), // ShotSource union, always 'MANUAL' today
  externalId: text("external_id"), // reserved for future CSV/launch-monitor import, unused today
  recordedAt: text("recorded_at").notNull(),
  sessionLabel: text("session_label"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
