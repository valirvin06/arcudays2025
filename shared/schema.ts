import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const medalTypeEnum = pgEnum('medal_type', ['GOLD', 'SILVER', 'BRONZE', 'NON_WINNER', 'NO_ENTRY']);
export const eventStatusEnum = pgEnum('event_status', ['UPCOMING', 'ONGOING', 'COMPLETED']);

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"), // Path to the icon
  color: text("color"), // Color code for the team
});

// Event categories table
export const eventCategories = pgTable("event_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => eventCategories.id),
  eventDate: timestamp("event_date"),
  status: text("status").default('UPCOMING').notNull(),
});

// Medals table
export const medals = pgTable("medals", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  medalType: text("medal_type").notNull(), // GOLD, SILVER, BRONZE, NON_WINNER
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Publication history table
export const publications = pgTable("publications", {
  id: serial("id").primaryKey(),
  publishedBy: text("published_by").notNull(),
  description: text("description"),
  medalCount: integer("medal_count").notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

// Scoreboard settings
export const scoreSettings = pgTable("score_settings", {
  id: serial("id").primaryKey(),
  goldPoints: integer("gold_points").default(10).notNull(),
  silverPoints: integer("silver_points").default(7).notNull(),
  bronzePoints: integer("bronze_points").default(5).notNull(),
  nonWinnerPoints: integer("non_winner_points").default(1).notNull(),
  noEntryPoints: integer("no_entry_points").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isPublished: boolean("is_published").default(false),
});

// Published medals tracking
export const publishedMedals = pgTable("published_medals", {
  medalId: integer("medal_id").primaryKey().references(() => medals.id),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

// Schemas for data insertion
export const insertUserSchema = createInsertSchema(users);

export const insertTeamSchema = createInsertSchema(teams, {
  name: z.string().min(1, "Team name is required"),
  icon: z.string().optional(),
  color: z.string().optional()
});

export const insertEventCategorySchema = createInsertSchema(eventCategories, {
  name: z.string().min(1, "Category name is required")
});

export const insertEventSchema = createInsertSchema(events, {
  name: z.string().min(1, "Event name is required"),
  categoryId: z.number().int().optional(),
  eventDate: z.date().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']).default('UPCOMING')
});

export const insertMedalSchema = createInsertSchema(medals, {
  eventId: z.number().int(),
  teamId: z.number().int(),
  medalType: z.enum(['GOLD', 'SILVER', 'BRONZE', 'NON_WINNER', 'NO_ENTRY']),
  points: z.number().int()
});

export const insertPublicationSchema = createInsertSchema(publications, {
  publishedBy: z.string(),
  description: z.string().optional(),
  medalCount: z.number().int()
});

export const updateScoreSettingsSchema = createInsertSchema(scoreSettings, {
  goldPoints: z.number().int().min(0),
  silverPoints: z.number().int().min(0),
  bronzePoints: z.number().int().min(0),
  nonWinnerPoints: z.number().int().min(0),
  noEntryPoints: z.number().int().min(0),
  isPublished: z.boolean()
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type EventCategory = typeof eventCategories.$inferSelect;
export type InsertEventCategory = z.infer<typeof insertEventCategorySchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Medal = typeof medals.$inferSelect;
export type InsertMedal = z.infer<typeof insertMedalSchema>;

export type Publication = typeof publications.$inferSelect;
export type InsertPublication = z.infer<typeof insertPublicationSchema>;

export type ScoreSettings = typeof scoreSettings.$inferSelect;
export type UpdateScoreSettings = z.infer<typeof updateScoreSettingsSchema>;

export type PublishedMedal = typeof publishedMedals.$inferSelect;

// Type for TeamScore (for the scoreboard)
export type TeamScore = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  totalScore: number;
  rank?: number;
};

// Type for EventResult (for the event summary)
export type EventResult = {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  eventDate?: Date;
  status: string;
  goldTeam?: { id: number; name: string };
  silverTeam?: { id: number; name: string };
  bronzeTeam?: { id: number; name: string };
};

// Type for MedalSummary
export type MedalSummary = {
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  totalMedals: number;
};
