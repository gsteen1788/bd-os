import Database from "./tauri-sql";

let dbInstance: Database | null = null;

export const DB_NAME = "sqlite:bd_os.db";

export async function getDb(): Promise<Database> {
    if (dbInstance) return dbInstance;
    dbInstance = await Database.load(DB_NAME);
    return dbInstance;
}

export async function initDb() {
    const db = await getDb();
    // TODO: Run migrations here or via Tauri plugin config
    // For alpha, we can execute the schema string if we bundle it, 
    // or rely on Tauri's migration capability in Rust.
    console.log("Database initialized");
    return db;
}
