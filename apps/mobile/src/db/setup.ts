/**
 * Database setup and initialization
 * Инициализация expo-sqlite и drizzle-orm
 */

import { Platform } from 'react-native';
import * as schema from './schema';

// Database name
const DB_NAME = 'babki.db';

let drizzle: any;
let openDatabaseSync: any;

// Only import native modules on native platforms
if (Platform.OS !== 'web') {
  try {
    drizzle = require('drizzle-orm/expo-sqlite').drizzle;
    openDatabaseSync = require('expo-sqlite').openDatabaseSync;
  } catch (e) {
    console.warn('SQLite setup failed:', e);
  }
}

// Create database connection
let db: any = null;

/**
 * Получает или создаёт подключение к базе данных
 */
export function getDatabase() {
  if (Platform.OS === 'web') return null; // No SQLite on Web
  if (db) return db;

  if (openDatabaseSync && drizzle) {
    const sqlite = openDatabaseSync(DB_NAME);
    db = drizzle(sqlite, { schema });
  }

  return db;
}

/**
 * Инициализирует схему базы данных
 */
export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') return; // No init on Web

  if (!openDatabaseSync || !drizzle) return;

  const sqlite = openDatabaseSync(DB_NAME);

  // Create tables if not exist
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS obligations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_day INTEGER NOT NULL,
      category TEXT NOT NULL,
      is_paid INTEGER NOT NULL DEFAULT 0,
      last_paid_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS plan_actions (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      priority INTEGER NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0,
      week_start TEXT,
      plan_instance_id TEXT,
      obligation_id TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plan_instances (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      saved_amount REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS plan_rules (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      plan_instance_id TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations (idempotent)
  try {
    sqlite.execSync('ALTER TABLE plan_actions ADD COLUMN plan_instance_id TEXT;');
  } catch (e) { /* ignore if exists */ }

  try {
    sqlite.execSync('ALTER TABLE plan_actions ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;');
  } catch (e) { /* ignore if exists */ }

  // Initialize drizzle
  db = drizzle(sqlite, { schema });
}

/**
 * Удаляет все данные (для Settings > Удалить данные)
 */
export async function clearAllData(): Promise<void> {
  if (Platform.OS === 'web') return;

  if (!openDatabaseSync) return;

  const sqlite = openDatabaseSync(DB_NAME);

  sqlite.execSync(`
    DELETE FROM obligations;
    DELETE FROM plan_actions;
    DELETE FROM settings;
  `);
}

/**
 * Экспортирует тип базы данных для использования в репозиториях
 */
export type AppDatabase = any; 
