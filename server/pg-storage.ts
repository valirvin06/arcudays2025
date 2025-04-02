import { type IStorage } from './storage';
import {
  type User, type InsertUser,
  type Team, type InsertTeam,
  type EventCategory, type InsertEventCategory,
  type Event, type InsertEvent,
  type Medal, type InsertMedal,
  type Publication, type InsertPublication,
  type ScoreSettings,
  type PublishedMedal,
  type TeamScore,
  type EventResult,
  type MedalSummary
} from '../shared/schema';
import { db } from './db';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { log } from './vite';

export class PgStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users.length > 0 ? users[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users.length > 0 ? users[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  // Teams
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(schema.teams);
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const teams = await db.select().from(schema.teams).where(eq(schema.teams.id, id));
    return teams.length > 0 ? teams[0] : undefined;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(schema.teams).values(team).returning();
    return result[0];
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const result = await db.update(schema.teams)
      .set(team)
      .where(eq(schema.teams.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    // Check if the team has any medals
    const teamMedals = await db.select().from(schema.medals).where(eq(schema.medals.teamId, id));
    
    if (teamMedals.length > 0) {
      return false; // Cannot delete team with medals
    }
    
    const result = await db.delete(schema.teams).where(eq(schema.teams.id, id)).returning();
    return result.length > 0;
  }

  // Event Categories
  async getAllEventCategories(): Promise<EventCategory[]> {
    return await db.select().from(schema.eventCategories);
  }

  async getCategoryById(id: number): Promise<EventCategory | undefined> {
    const categories = await db.select().from(schema.eventCategories).where(eq(schema.eventCategories.id, id));
    return categories.length > 0 ? categories[0] : undefined;
  }

  async createEventCategory(category: InsertEventCategory): Promise<EventCategory> {
    const result = await db.insert(schema.eventCategories).values(category).returning();
    return result[0];
  }

  async deleteEventCategory(id: number): Promise<boolean> {
    // Check if any events use this category
    const events = await db.select().from(schema.events).where(eq(schema.events.categoryId, id));
    
    if (events.length > 0) {
      return false; // Cannot delete category with events
    }
    
    const result = await db.delete(schema.eventCategories).where(eq(schema.eventCategories.id, id)).returning();
    return result.length > 0;
  }

  // Events
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(schema.events);
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const events = await db.select().from(schema.events).where(eq(schema.events.id, id));
    return events.length > 0 ? events[0] : undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(schema.events).values(event).returning();
    return result[0];
  }

  async updateEventStatus(id: number, status: string): Promise<Event | undefined> {
    const result = await db.update(schema.events)
      .set({ status })
      .where(eq(schema.events.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    // Check if the event has any medals
    const eventMedals = await db.select().from(schema.medals).where(eq(schema.medals.eventId, id));
    
    if (eventMedals.length > 0) {
      return false; // Cannot delete event with medals
    }
    
    const result = await db.delete(schema.events).where(eq(schema.events.id, id)).returning();
    return result.length > 0;
  }

  // Medals
  async getAllMedals(): Promise<Medal[]> {
    return await db.select().from(schema.medals);
  }

  async getMedalById(id: number): Promise<Medal | undefined> {
    const medals = await db.select().from(schema.medals).where(eq(schema.medals.id, id));
    return medals.length > 0 ? medals[0] : undefined;
  }

  async getMedalsByEventId(eventId: number): Promise<Medal[]> {
    return await db.select().from(schema.medals).where(eq(schema.medals.eventId, eventId));
  }

  async createMedal(medal: InsertMedal): Promise<Medal> {
    // Check if medal for this team and event already exists
    const existingMedals = await db.select()
      .from(schema.medals)
      .where(
        and(
          eq(schema.medals.eventId, medal.eventId),
          eq(schema.medals.teamId, medal.teamId)
        )
      );
    
    if (existingMedals.length > 0) {
      // Update existing medal
      const existingMedal = existingMedals[0];
      
      // Remove from published medals if it was published (since it's now changed)
      await db.delete(schema.publishedMedals)
        .where(eq(schema.publishedMedals.medalId, existingMedal.id));
      
      // Update the medal
      const result = await db.update(schema.medals)
        .set({
          medalType: medal.medalType,
          points: medal.points
        })
        .where(eq(schema.medals.id, existingMedal.id))
        .returning();
      
      return result[0];
    }
    
    // Create new medal
    const result = await db.insert(schema.medals)
      .values({
        ...medal,
        createdAt: new Date()
      })
      .returning();
    
    // New medals are unpublished by default
    return result[0];
  }

  async deleteMedal(id: number): Promise<boolean> {
    // Remove from published medals if it was published
    await db.delete(schema.publishedMedals)
      .where(eq(schema.publishedMedals.medalId, id));
    
    // Delete the medal
    const result = await db.delete(schema.medals)
      .where(eq(schema.medals.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Publications
  async getAllPublications(): Promise<Publication[]> {
    return await db.select()
      .from(schema.publications)
      .orderBy(desc(schema.publications.publishedAt));
  }

  async getLatestPublication(): Promise<Publication | undefined> {
    const publications = await db.select()
      .from(schema.publications)
      .orderBy(desc(schema.publications.publishedAt))
      .limit(1);
    
    return publications.length > 0 ? publications[0] : undefined;
  }

  async createPublication(publication: InsertPublication): Promise<Publication> {
    const result = await db.insert(schema.publications)
      .values({
        ...publication,
        publishedAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  // Score Settings
  async getScoreSettings(): Promise<ScoreSettings | undefined> {
    const settings = await db.select().from(schema.scoreSettings).limit(1);
    return settings.length > 0 ? settings[0] : undefined;
  }

  async updateScoreSettings(settings: Partial<ScoreSettings>): Promise<ScoreSettings> {
    const currentSettings = await this.getScoreSettings();
    
    if (!currentSettings) {
      // Create settings if they don't exist
      const result = await db.insert(schema.scoreSettings)
        .values({
          goldPoints: settings.goldPoints || 10,
          silverPoints: settings.silverPoints || 7,
          bronzePoints: settings.bronzePoints || 5,
          nonWinnerPoints: settings.nonWinnerPoints || 1,
          noEntryPoints: settings.noEntryPoints || 0,
          lastUpdated: new Date(),
          isPublished: settings.isPublished || true
        })
        .returning();
      
      return result[0];
    }
    
    // Update existing settings
    const result = await db.update(schema.scoreSettings)
      .set({
        ...settings,
        lastUpdated: new Date()
      })
      .where(eq(schema.scoreSettings.id, currentSettings.id))
      .returning();
    
    return result[0];
  }

  async publishScores(): Promise<ScoreSettings> {
    const unpublishedMedals = await this.getUnpublishedChanges();
    
    // Create publication record
    await this.createPublication({
      publishedBy: "arcuadmin",
      description: `Published ${unpublishedMedals.length} medal changes`,
      medalCount: unpublishedMedals.length
    });
    
    // Mark all medals as published
    for (const medal of unpublishedMedals) {
      await db.insert(schema.publishedMedals)
        .values({
          medalId: medal.id,
          publishedAt: new Date()
        })
        .onConflictDoNothing();
    }
    
    // Update score settings
    return await this.updateScoreSettings({
      isPublished: true,
      lastUpdated: new Date()
    });
  }

  // Scoreboard Data
  async getTeamScores(): Promise<TeamScore[]> {
    const teams = await this.getAllTeams();
    const publishedMedals = await this.getPublishedMedals();
    const settings = await this.getScoreSettings();
    
    if (!settings) {
      throw new Error("Score settings not initialized");
    }
    
    const teamScores: TeamScore[] = teams.map(team => {
      const teamMedals = publishedMedals.filter(medal => medal.teamId === team.id);
      
      const goldCount = teamMedals.filter(medal => medal.medalType === 'GOLD').length;
      const silverCount = teamMedals.filter(medal => medal.medalType === 'SILVER').length;
      const bronzeCount = teamMedals.filter(medal => medal.medalType === 'BRONZE').length;
      
      const totalScore = teamMedals.reduce((sum, medal) => sum + medal.points, 0);
      
      return {
        id: team.id,
        name: team.name,
        icon: team.icon || undefined,
        color: team.color || undefined,
        goldCount,
        silverCount,
        bronzeCount,
        totalScore
      };
    });
    
    // Sort by total score
    teamScores.sort((a, b) => {
      // First compare total score
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // If tie, compare gold medals
      if (b.goldCount !== a.goldCount) {
        return b.goldCount - a.goldCount;
      }
      // If still tie, compare silver medals
      if (b.silverCount !== a.silverCount) {
        return b.silverCount - a.silverCount;
      }
      // If still tie, compare bronze medals
      return b.bronzeCount - a.bronzeCount;
    });
    
    // Add rank
    return teamScores.map((team, index) => ({
      ...team,
      rank: index + 1
    }));
  }

  async getEventResults(): Promise<EventResult[]> {
    const events = await this.getAllEvents();
    const categories = await this.getAllEventCategories();
    const teams = await this.getAllTeams();
    const publishedMedals = await this.getPublishedMedals();
    
    return events.map(event => {
      const category = categories.find(c => c.id === event.categoryId);
      const eventMedals = publishedMedals.filter(medal => medal.eventId === event.id);
      
      const goldMedal = eventMedals.find(medal => medal.medalType === 'GOLD');
      const silverMedal = eventMedals.find(medal => medal.medalType === 'SILVER');
      const bronzeMedal = eventMedals.find(medal => medal.medalType === 'BRONZE');
      
      const goldTeam = goldMedal ? teams.find(team => team.id === goldMedal.teamId) : undefined;
      const silverTeam = silverMedal ? teams.find(team => team.id === silverMedal.teamId) : undefined;
      const bronzeTeam = bronzeMedal ? teams.find(team => team.id === bronzeMedal.teamId) : undefined;
      
      return {
        id: event.id,
        name: event.name,
        category: category?.name || 'Uncategorized',
        categoryId: category?.id || 0,
        eventDate: event.eventDate || undefined,
        status: event.status,
        goldTeam: goldTeam ? { id: goldTeam.id, name: goldTeam.name } : undefined,
        silverTeam: silverTeam ? { id: silverTeam.id, name: silverTeam.name } : undefined,
        bronzeTeam: bronzeTeam ? { id: bronzeTeam.id, name: bronzeTeam.name } : undefined
      };
    });
  }

  async getMedalSummary(): Promise<MedalSummary> {
    const publishedMedals = await this.getPublishedMedals();
    
    const goldCount = publishedMedals.filter(medal => medal.medalType === 'GOLD').length;
    const silverCount = publishedMedals.filter(medal => medal.medalType === 'SILVER').length;
    const bronzeCount = publishedMedals.filter(medal => medal.medalType === 'BRONZE').length;
    
    return {
      goldCount,
      silverCount,
      bronzeCount,
      totalMedals: goldCount + silverCount + bronzeCount
    };
  }

  async getUnpublishedChanges(): Promise<Medal[]> {
    // Get all medals
    const allMedals = await db.select().from(schema.medals);
    
    // Get all published medal IDs
    const publishedMedalRows = await db.select().from(schema.publishedMedals);
    const publishedMedalIds = new Set(publishedMedalRows.map(row => row.medalId));
    
    // Filter out medals that are already published
    return allMedals.filter(medal => !publishedMedalIds.has(medal.id));
  }

  // Helper method to get published medals
  private async getPublishedMedals(): Promise<Medal[]> {
    // Join medals with published_medals to get only published medals
    const publishedMedals = await db
      .select()
      .from(schema.medals)
      .innerJoin(
        schema.publishedMedals,
        eq(schema.medals.id, schema.publishedMedals.medalId)
      );
    
    // Map joined results to Medal type
    return publishedMedals.map(joined => joined.medals);
  }
}