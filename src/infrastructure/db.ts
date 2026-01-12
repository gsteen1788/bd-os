import Database from "./tauri-sql";

let dbInstance: Database | null = null;

export const DB_NAME = "sqlite:bd_os.db";

export async function getDb(): Promise<Database> {
    if (dbInstance) return dbInstance;
    dbInstance = await Database.load(DB_NAME);
    return dbInstance;
}

import { SCHEMA_SQL } from "./schema_definitions";

export async function initDb() {
    const db = await getDb();

    // Simple migration runner: split by semicolon and execute
    // This is naive but works for standard SQL dumps without complex triggers/procedures containing semicolons
    const statements = SCHEMA_SQL.split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

    for (const sql of statements) {
        try {
            await db.execute(sql);
        } catch (e) {
            console.error("Migration error on statement:", sql, e);
        }
    }

    // Lazy Migration for is_internal
    try {
        await db.execute("ALTER TABLE protemoi_entries ADD COLUMN is_internal INTEGER DEFAULT 0;");
    } catch (e) {
        // Ignore "column already exists" error
    }

    // Lazy Migration for logo_url in organizations
    try {
        await db.execute("ALTER TABLE organizations ADD COLUMN logo_url TEXT;");
    } catch (e) {
        // Ignore "column already exists" error
    }

    // Lazy Migrations for MIT fields in tasks
    const taskColumns = ["big_impact_description", "in_control_description", "growth_oriented_description"];
    for (const col of taskColumns) {
        try {
            await db.execute(`ALTER TABLE tasks ADD COLUMN ${col} TEXT;`);
        } catch (e) {
            // Ignore if exists
        }
    }

    // Lazy Migration: Create task_links if not exists
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS task_links (
              id TEXT PRIMARY KEY,
              task_id TEXT NOT NULL,
              entity_type TEXT NOT NULL,
              entity_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
        `);
        console.log("Migration: task_links table checked/created.");
    } catch (e) {
        console.error("Migration error for task_links:", e);
    }

    console.log("Database initialized and schema applied.");
    return db;
}
