import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { insertTeamSchema, insertEventSchema, insertEventCategorySchema, insertMedalSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const MemoryStoreSession = MemoryStore(session);

// File upload configuration
const storage_dir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, storage_dir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 1024 * 1024 // 1MB
  },
  fileFilter: function(req, file, cb) {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and SVG files are allowed'));
    }
  }
});

// Middleware to check if user is logged in
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'arcu-days-2025-secret'
  }));

  // Static file serving for uploads
  app.use('/uploads', express.static(storage_dir));

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      
      return res.json({ 
        success: true, 
        user: { id: user.id, username: user.username } 
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  });

  app.get('/api/auth/session', (req, res) => {
    if (req.session.userId) {
      return res.json({ 
        authenticated: true, 
        user: { id: req.session.userId, username: req.session.username } 
      });
    }
    return res.json({ authenticated: false });
  });

  // Teams routes
  app.get('/api/teams', async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams" });
    }
  });

  app.post('/api/teams', isAuthenticated, upload.single('icon'), async (req, res) => {
    try {
      const teamData = JSON.parse(req.body.data || '{}');
      
      // Add file path if uploaded
      if (req.file) {
        teamData.icon = `/uploads/${req.file.filename}`;
      }
      
      const validatedData = insertTeamSchema.parse(teamData);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating team" });
    }
  });

  app.delete('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeam(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Team could not be deleted. It may have associated medals." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting team" });
    }
  });

  // Event Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllEventCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEventCategorySchema.parse(req.body);
      const category = await storage.createEventCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating category" });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEventCategory(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Category could not be deleted. It may have associated events." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // Events routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.get('/api/events/results', async (req, res) => {
    try {
      const results = await storage.getEventResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event results" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req, res) => {
    try {
      // Handle date conversion from string to Date if needed
      const eventData = {...req.body};
      if (eventData.eventDate && typeof eventData.eventDate === 'string') {
        eventData.eventDate = new Date(eventData.eventDate);
      }
      
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Event creation error:", error);
      res.status(500).json({ message: "Error creating event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEvent(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Event could not be deleted. It may have associated medals." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // Medals routes
  app.get('/api/medals', async (req, res) => {
    try {
      const medals = await storage.getAllMedals();
      res.json(medals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medals" });
    }
  });

  app.get('/api/medals/event/:eventId', async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const medals = await storage.getMedalsByEventId(eventId);
      res.json(medals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching medals by event" });
    }
  });

  app.post('/api/medals', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedalSchema.parse(req.body);
      const medal = await storage.createMedal(validatedData);
      res.status(201).json(medal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medal data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating medal" });
    }
  });

  app.delete('/api/medals/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMedal(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Medal could not be deleted." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting medal" });
    }
  });

  // Scoreboard routes
  app.get('/api/scoreboard', async (req, res) => {
    try {
      const teamScores = await storage.getTeamScores();
      const medalSummary = await storage.getMedalSummary();
      const scoreSettings = await storage.getScoreSettings();
      
      res.json({
        teamScores,
        medalSummary,
        lastUpdated: scoreSettings?.lastUpdated || new Date()
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching scoreboard data" });
    }
  });

  // Publications routes
  app.get('/api/publications', async (req, res) => {
    try {
      const publications = await storage.getAllPublications();
      res.json(publications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching publications" });
    }
  });

  app.get('/api/publications/latest', async (req, res) => {
    try {
      const publication = await storage.getLatestPublication();
      res.json(publication);
    } catch (error) {
      res.status(500).json({ message: "Error fetching latest publication" });
    }
  });

  // Score settings routes
  app.get('/api/score-settings', async (req, res) => {
    try {
      const settings = await storage.getScoreSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching score settings" });
    }
  });

  app.put('/api/score-settings', isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.updateScoreSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error updating score settings" });
    }
  });

  // Publish scores
  app.post('/api/publish-scores', isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.publishScores();
      res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ message: "Error publishing scores" });
    }
  });

  // Get unpublished changes
  app.get('/api/unpublished-changes', isAuthenticated, async (req, res) => {
    try {
      const changes = await storage.getUnpublishedChanges();
      res.json(changes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching unpublished changes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
