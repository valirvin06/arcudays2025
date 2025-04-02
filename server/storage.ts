import {
  users,
  teams,
  eventCategories,
  events,
  medals,
  publications,
  scoreSettings,
  publishedMedals,
  type User,
  type InsertUser,
  type Team,
  type InsertTeam,
  type EventCategory,
  type InsertEventCategory,
  type Event,
  type InsertEvent,
  type Medal,
  type InsertMedal,
  type Publication,
  type InsertPublication,
  type ScoreSettings,
  type PublishedMedal,
  type TeamScore,
  type EventResult,
  type MedalSummary
} from "@shared/schema";
import { PgStorage } from "./pg-storage";

// interface for storage methods
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Teams
  getAllTeams(): Promise<Team[]>;
  getTeamById(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Event Categories
  getAllEventCategories(): Promise<EventCategory[]>;
  getCategoryById(id: number): Promise<EventCategory | undefined>;
  createEventCategory(category: InsertEventCategory): Promise<EventCategory>;
  deleteEventCategory(id: number): Promise<boolean>;

  // Events
  getAllEvents(): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEventStatus(id: number, status: string): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Medals
  getAllMedals(): Promise<Medal[]>;
  getMedalById(id: number): Promise<Medal | undefined>;
  getMedalsByEventId(eventId: number): Promise<Medal[]>;
  createMedal(medal: InsertMedal): Promise<Medal>;
  deleteMedal(id: number): Promise<boolean>;

  // Publications
  getAllPublications(): Promise<Publication[]>;
  getLatestPublication(): Promise<Publication | undefined>;
  createPublication(publication: InsertPublication): Promise<Publication>;

  // Score Settings
  getScoreSettings(): Promise<ScoreSettings | undefined>;
  updateScoreSettings(settings: Partial<ScoreSettings>): Promise<ScoreSettings>;
  publishScores(): Promise<ScoreSettings>;

  // Scoreboard Data
  getTeamScores(): Promise<TeamScore[]>;
  getEventResults(): Promise<EventResult[]>;
  getMedalSummary(): Promise<MedalSummary>;
  getUnpublishedChanges(): Promise<Medal[]>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private teamsData: Map<number, Team>;
  private categoriesData: Map<number, EventCategory>;
  private eventsData: Map<number, Event>;
  private medalsData: Map<number, Medal>;
  private publicationsData: Map<number, Publication>;
  private scoreSettingsData: ScoreSettings | undefined;
  private publishedMedalIds: Set<number>; // Track which medals have been published

  private currentUserId: number;
  private currentTeamId: number;
  private currentCategoryId: number;
  private currentEventId: number;
  private currentMedalId: number;
  private currentPublicationId: number;

  constructor() {
    this.usersData = new Map();
    this.teamsData = new Map();
    this.categoriesData = new Map();
    this.eventsData = new Map();
    this.medalsData = new Map();
    this.publicationsData = new Map();
    this.publishedMedalIds = new Set(); // Initialize empty set

    this.currentUserId = 1;
    this.currentTeamId = 1;
    this.currentCategoryId = 1;
    this.currentEventId = 1;
    this.currentMedalId = 1;
    this.currentPublicationId = 1;

    // Initialize with default admin user
    this.createUser({
      username: "arcuadmin",
      password: "ArCuAdmin"
    });

    // Initialize with default score settings
    this.scoreSettingsData = {
      id: 1,
      goldPoints: 10,
      silverPoints: 7,
      bronzePoints: 5,
      nonWinnerPoints: 1,
      noEntryPoints: 0,
      lastUpdated: new Date(),
      isPublished: true
    };

    // Initialize with default categories
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default categories
    const categories = [
      "Cultural",
      "Literary",
      "Performing Arts",
      "Visual Arts"
    ];

    categories.forEach(category => {
      this.createEventCategory({ name: category });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.usersData.set(id, user);
    return user;
  }

  // Teams
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teamsData.values());
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    return this.teamsData.get(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const newTeam: Team = { ...team, id };
    this.teamsData.set(id, newTeam);
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const existingTeam = this.teamsData.get(id);
    if (!existingTeam) return undefined;

    const updatedTeam: Team = { ...existingTeam, ...team };
    this.teamsData.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    // Check if the team has any medals
    const hasTeamMedals = Array.from(this.medalsData.values()).some(
      medal => medal.teamId === id
    );

    if (hasTeamMedals) {
      return false; // Cannot delete team with medals
    }

    return this.teamsData.delete(id);
  }

  // Event Categories
  async getAllEventCategories(): Promise<EventCategory[]> {
    return Array.from(this.categoriesData.values());
  }

  async getCategoryById(id: number): Promise<EventCategory | undefined> {
    return this.categoriesData.get(id);
  }

  async createEventCategory(category: InsertEventCategory): Promise<EventCategory> {
    const id = this.currentCategoryId++;
    const newCategory: EventCategory = { ...category, id };
    this.categoriesData.set(id, newCategory);
    return newCategory;
  }

  async deleteEventCategory(id: number): Promise<boolean> {
    // Check if any events use this category
    const hasEvents = Array.from(this.eventsData.values()).some(
      event => event.categoryId === id
    );

    if (hasEvents) {
      return false; // Cannot delete category with events
    }

    return this.categoriesData.delete(id);
  }

  // Events
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.eventsData.values());
  }

  async getEventById(id: number): Promise<Event | undefined> {
    return this.eventsData.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const newEvent: Event = { ...event, id };
    this.eventsData.set(id, newEvent);
    return newEvent;
  }

  async updateEventStatus(id: number, status: string): Promise<Event | undefined> {
    const existingEvent = this.eventsData.get(id);
    if (!existingEvent) return undefined;

    const updatedEvent: Event = { ...existingEvent, status };
    this.eventsData.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    // Check if the event has any medals
    const hasEventMedals = Array.from(this.medalsData.values()).some(
      medal => medal.eventId === id
    );

    if (hasEventMedals) {
      return false; // Cannot delete event with medals
    }

    return this.eventsData.delete(id);
  }

  // Medals
  async getAllMedals(): Promise<Medal[]> {
    return Array.from(this.medalsData.values());
  }

  async getMedalById(id: number): Promise<Medal | undefined> {
    return this.medalsData.get(id);
  }

  async getMedalsByEventId(eventId: number): Promise<Medal[]> {
    return Array.from(this.medalsData.values()).filter(
      medal => medal.eventId === eventId
    );
  }

  async createMedal(medal: InsertMedal): Promise<Medal> {
    // Make sure we don't duplicate medals for the same team and event
    const existingMedal = Array.from(this.medalsData.values()).find(
      m => m.eventId === medal.eventId && m.teamId === medal.teamId
    );

    if (existingMedal) {
      // If there's an existing medal, update it and return
      // Remove from published set if it was published, as it's now changed
      if (this.publishedMedalIds.has(existingMedal.id)) {
        this.publishedMedalIds.delete(existingMedal.id);
      }
      
      const updatedMedal: Medal = { ...existingMedal, medalType: medal.medalType, points: medal.points };
      this.medalsData.set(existingMedal.id, updatedMedal);
      return updatedMedal;
    }

    const id = this.currentMedalId++;
    const newMedal: Medal = { ...medal, id, createdAt: new Date() };
    this.medalsData.set(id, newMedal);
    // New medals are unpublished by default
    return newMedal;
  }

  async deleteMedal(id: number): Promise<boolean> {
    // Remove from published set if it was published
    if (this.publishedMedalIds.has(id)) {
      this.publishedMedalIds.delete(id);
    }
    
    return this.medalsData.delete(id);
  }

  // Publications
  async getAllPublications(): Promise<Publication[]> {
    return Array.from(this.publicationsData.values()).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  async getLatestPublication(): Promise<Publication | undefined> {
    const publications = await this.getAllPublications();
    return publications.length > 0 ? publications[0] : undefined;
  }

  async createPublication(publication: InsertPublication): Promise<Publication> {
    const id = this.currentPublicationId++;
    const newPublication: Publication = { 
      ...publication, 
      id, 
      publishedAt: new Date() 
    };
    this.publicationsData.set(id, newPublication);
    return newPublication;
  }

  // Score Settings
  async getScoreSettings(): Promise<ScoreSettings | undefined> {
    return this.scoreSettingsData;
  }

  async updateScoreSettings(settings: Partial<ScoreSettings>): Promise<ScoreSettings> {
    this.scoreSettingsData = {
      ...this.scoreSettingsData!,
      ...settings,
      lastUpdated: new Date()
    };
    return this.scoreSettingsData;
  }

  async publishScores(): Promise<ScoreSettings> {
    if (!this.scoreSettingsData) {
      throw new Error("Score settings not initialized");
    }

    const unpublishedMedals = await this.getUnpublishedChanges();
    
    // Mark all medals as published
    for (const medal of unpublishedMedals) {
      this.publishedMedalIds.add(medal.id);
    }
    
    // Create a publication record
    await this.createPublication({
      publishedBy: "arcuadmin",
      description: `Published ${unpublishedMedals.length} medal changes`,
      medalCount: unpublishedMedals.length
    });

    // Update score settings to mark as published
    this.scoreSettingsData = {
      ...this.scoreSettingsData,
      isPublished: true,
      lastUpdated: new Date()
    };

    return this.scoreSettingsData;
  }

  // Scoreboard Data
  async getTeamScores(): Promise<TeamScore[]> {
    const teams = await this.getAllTeams();
    let medals = await this.getAllMedals();
    const settings = await this.getScoreSettings();

    if (!settings) {
      throw new Error("Score settings not initialized");
    }

    // Only use published medals for public display
    medals = medals.filter(medal => this.publishedMedalIds.has(medal.id));

    const teamScores: TeamScore[] = teams.map(team => {
      const teamMedals = medals.filter(medal => medal.teamId === team.id);
      
      const goldCount = teamMedals.filter(medal => medal.medalType === 'GOLD').length;
      const silverCount = teamMedals.filter(medal => medal.medalType === 'SILVER').length;
      const bronzeCount = teamMedals.filter(medal => medal.medalType === 'BRONZE').length;
      
      const totalScore = teamMedals.reduce((sum, medal) => sum + medal.points, 0);

      return {
        id: team.id,
        name: team.name,
        icon: team.icon,
        color: team.color,
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
    const allEvents = await this.getAllEvents();
    const allCategories = await this.getAllEventCategories();
    const allTeams = await this.getAllTeams();
    let allMedals = await this.getAllMedals();
    
    // Only use published medals for public display
    allMedals = allMedals.filter(medal => this.publishedMedalIds.has(medal.id));

    return allEvents.map(event => {
      const category = allCategories.find(c => c.id === event.categoryId);
      const eventMedals = allMedals.filter(medal => medal.eventId === event.id);
      
      const goldMedal = eventMedals.find(medal => medal.medalType === 'GOLD');
      const silverMedal = eventMedals.find(medal => medal.medalType === 'SILVER');
      const bronzeMedal = eventMedals.find(medal => medal.medalType === 'BRONZE');
      
      const goldTeam = goldMedal ? allTeams.find(team => team.id === goldMedal.teamId) : undefined;
      const silverTeam = silverMedal ? allTeams.find(team => team.id === silverMedal.teamId) : undefined;
      const bronzeTeam = bronzeMedal ? allTeams.find(team => team.id === bronzeMedal.teamId) : undefined;

      return {
        id: event.id,
        name: event.name,
        category: category?.name || 'Uncategorized',
        categoryId: category?.id || 0,
        eventDate: event.eventDate,
        status: event.status,
        goldTeam: goldTeam ? { id: goldTeam.id, name: goldTeam.name } : undefined,
        silverTeam: silverTeam ? { id: silverTeam.id, name: silverTeam.name } : undefined,
        bronzeTeam: bronzeTeam ? { id: bronzeTeam.id, name: bronzeTeam.name } : undefined
      };
    });
  }

  async getMedalSummary(): Promise<MedalSummary> {
    let medals = await this.getAllMedals();
    
    // Only use published medals for public display
    medals = medals.filter(medal => this.publishedMedalIds.has(medal.id));
    
    const goldCount = medals.filter(medal => medal.medalType === 'GOLD').length;
    const silverCount = medals.filter(medal => medal.medalType === 'SILVER').length;
    const bronzeCount = medals.filter(medal => medal.medalType === 'BRONZE').length;
    
    return {
      goldCount,
      silverCount,
      bronzeCount,
      totalMedals: goldCount + silverCount + bronzeCount
    };
  }

  async getUnpublishedChanges(): Promise<Medal[]> {
    const allMedals = await this.getAllMedals();
    // Return medals that are not in the publishedMedalIds set
    return allMedals.filter(medal => !this.publishedMedalIds.has(medal.id));
  }
}

// Export PgStorage instance if DATABASE_URL is available, otherwise use MemStorage
export const storage = process.env.DATABASE_URL 
  ? new PgStorage() 
  : new MemStorage();
