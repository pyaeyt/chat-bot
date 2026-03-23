import type { DatabaseSync } from "node:sqlite";

function tryAlter(db: DatabaseSync, sql: string): void {
  try {
    db.exec(sql);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column|already exists/i.test(msg)) {
      throw e;
    }
  }
}

/** Run additive migrations after base schema. */
export function runMigrations(db: DatabaseSync): void {
  tryAlter(db, `ALTER TABLE users ADD COLUMN office_hours TEXT NOT NULL DEFAULT '';`);
  tryAlter(db, `ALTER TABLE users ADD COLUMN title TEXT NOT NULL DEFAULT '';`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
  `);
}
