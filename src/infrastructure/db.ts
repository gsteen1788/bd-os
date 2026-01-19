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

    // Lazy Migrations for Contact fields
    const contactColumns = [
        "location", "marital_status", "children", "hobbies_interests",
        "current_focus", "stories_anecdotes", "other",
        "career_history", "education", "linkedin_url"
    ];
    for (const col of contactColumns) {
        try {
            await db.execute(`ALTER TABLE contacts ADD COLUMN ${col} TEXT;`);
        } catch (e) {
            // Ignore if exists
        }
    }

    // Lazy Migration for Opportunity Currency
    try {
        await db.execute("ALTER TABLE opportunities ADD COLUMN currency TEXT;");
    } catch (e) {
        // Ignore if exists
    }

    // Lazy Migration for Meeting Status
    try {
        await db.execute("ALTER TABLE meetings ADD COLUMN status TEXT DEFAULT 'SCHEDULED';");
    } catch (e) {
        // Ignore if exists
    }

    // Lazy Migration for Meeting Protemoi Link
    try {
        await db.execute("ALTER TABLE meetings ADD COLUMN related_protemoi_id TEXT;");
    } catch (e) {
        // Ignore if exists
    }

    // Lazy Migration for Opportunity extra fields
    try {
        await db.execute("ALTER TABLE opportunities ADD COLUMN primary_sponsor TEXT;");
    } catch (e) { /* Ignore */ }
    try {
        await db.execute("ALTER TABLE opportunities ADD COLUMN obstacle TEXT;");
    } catch (e) { /* Ignore */ }

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

    // Lazy Migration: Create learnings table if not exists
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS learnings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              content TEXT NOT NULL,
              source_file TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Migration: learnings table checked/created.");
    } catch (e) {
        console.error("Migration error for learnings:", e);
    }

    console.log("Database initialized and schema applied.");
    return db;
}
