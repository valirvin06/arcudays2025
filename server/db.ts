import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { log } from './vite';

const DATABASE_URL = process.env.DATABASE_URL;

// Check if database URL is available
if (!DATABASE_URL) {
  log('Database URL not found in environment variables', 'postgres');
  throw new Error('Database URL not found');
}

// Create postgres client
const client = postgres(DATABASE_URL);
log('Connected to PostgreSQL database', 'postgres');

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Initialize the database with tables
export async function initDatabase() {
  try {
    log('Initializing database...', 'postgres');
    
    // Create all tables
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT
      );
      
      CREATE TABLE IF NOT EXISTS event_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category_id INTEGER REFERENCES event_categories(id),
        event_date TIMESTAMP,
        status TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS medals (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id),
        team_id INTEGER NOT NULL REFERENCES teams(id),
        medal_type TEXT NOT NULL,
        points INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS publications (
        id SERIAL PRIMARY KEY,
        published_by TEXT NOT NULL,
        description TEXT,
        medal_count INTEGER NOT NULL,
        published_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS score_settings (
        id SERIAL PRIMARY KEY,
        gold_points INTEGER NOT NULL DEFAULT 10,
        silver_points INTEGER NOT NULL DEFAULT 7,
        bronze_points INTEGER NOT NULL DEFAULT 5,
        non_winner_points INTEGER NOT NULL DEFAULT 1,
        no_entry_points INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        is_published BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS published_medals (
        medal_id INTEGER PRIMARY KEY REFERENCES medals(id),
        published_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    
    await client.unsafe(createTablesSQL);
    log('Database tables created successfully', 'postgres');
    
    // Check if default admin user exists
    const adminUser = await client`SELECT * FROM users WHERE username = 'arcuadmin'`;
    
    if (adminUser.length === 0) {
      // Create default admin user
      await client`
        INSERT INTO users (username, password)
        VALUES ('arcuadmin', 'ArCuAdmin')
      `;
      log('Default admin user created', 'postgres');
    }
    
    // Check if default score settings exist
    const scoreSettings = await client`SELECT * FROM score_settings`;
    
    if (scoreSettings.length === 0) {
      // Create default score settings
      await client`
        INSERT INTO score_settings (
          gold_points, silver_points, bronze_points, non_winner_points, no_entry_points, is_published
        ) VALUES (
          10, 7, 5, 1, 0, true
        )
      `;
      log('Default score settings created', 'postgres');
    }
    
    // Create default categories if they don't exist
    const categories = ['Cultural', 'Literary', 'Performing Arts', 'Visual Arts'];
    
    for (const category of categories) {
      const existingCategory = await client`
        SELECT * FROM event_categories WHERE name = ${category}
      `;
      
      if (existingCategory.length === 0) {
        await client`
          INSERT INTO event_categories (name)
          VALUES (${category})
        `;
        log(`Created category: ${category}`, 'postgres');
      }
    }
    
    log('Database initialization completed', 'postgres');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}