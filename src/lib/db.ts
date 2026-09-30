import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

type SqliteDb = InstanceType<typeof DatabaseSync>;

function openDatabase(filename: string): SqliteDb {
  const getter = (process as unknown as { getBuiltinModule?: (name: string) => { DatabaseSync: new (path: string) => SqliteDb } })
    .getBuiltinModule;
  if (!getter) throw new Error("This server needs Node.js 22 or newer for SQLite.");
  const sqlite = getter("node:sqlite");
  return new sqlite.DatabaseSync(filename);
}

const globalForDb = globalThis as unknown as { rundownDb?: SqliteDb };

function silenceSqliteWarning(): void {
  const original = process.emitWarning.bind(process);
  process.emitWarning = ((warning: unknown, ...args: unknown[]) => {
    const message = typeof warning === "string" ? warning : (warning as { message?: string })?.message;
    if (message?.includes("SQLite is an experimental feature")) return;
    return Reflect.apply(original, process, [warning, ...args]);
  }) as typeof process.emitWarning;
}

function databaseFile(): string {
  const configured = process.env.DATA_DIR;
  const dir = configured
    ? path.resolve(configured)
    : process.env.VERCEL
      ? path.join("/tmp", "rundown")
      : path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "rundown.db");
}

export function getDb(): SqliteDb {
  if (globalForDb.rundownDb) return globalForDb.rundownDb;
  silenceSqliteWarning();
  const db = openDatabase(databaseFile());
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      city TEXT,
      region TEXT,
      country TEXT,
      lat REAL,
      lon REAL,
      location_mode TEXT NOT NULL,
      topics TEXT NOT NULL,
      sources TEXT NOT NULL,
      favorites TEXT NOT NULL,
      theme TEXT NOT NULL,
      loop_playlist INTEGER NOT NULL,
      alerts INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  globalForDb.rundownDb = db;
  return db;
}
