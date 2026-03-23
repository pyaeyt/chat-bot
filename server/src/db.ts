/**
 * Uses Node.js built-in SQLite (node:sqlite) — no native addons.
 * Requires Node.js 22.5+ (recommended: current LTS).
 */
import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash, randomBytes } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { runMigrations } from "./migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(__dirname, "../data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, "app.sqlite");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'professor', 'admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_threads_professor ON threads(professor_id);
  CREATE INDEX IF NOT EXISTS idx_threads_student ON threads(student_id);

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
`);

runMigrations(db);

export type Role = "student" | "professor" | "admin";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: Role;
  created_at: string;
  office_hours: string;
  title: string;
}

const selectUserByEmail = db.prepare(
  `SELECT id, email, password_hash, display_name, role, created_at, office_hours, title FROM users WHERE email = ?`
);
const selectUserById = db.prepare(
  `SELECT id, email, password_hash, display_name, role, created_at, office_hours, title FROM users WHERE id = ?`
);
const insertUser = db.prepare(
  `INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)`
);

export function findUserByEmail(email: string): UserRow | undefined {
  return selectUserByEmail.get(email.trim().toLowerCase()) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  return selectUserById.get(id) as UserRow | undefined;
}

export function createUser(
  email: string,
  plainPassword: string,
  displayName: string,
  role: Role
): UserRow {
  const id = randomUUID();
  const password_hash = bcrypt.hashSync(plainPassword, 12);
  insertUser.run(
    id,
    email.trim().toLowerCase(),
    password_hash,
    displayName.trim() || email.split("@")[0] || "User",
    role
  );
  const u = findUserById(id);
  if (!u) throw new Error("Failed to create user");
  return u;
}

export function verifyPassword(user: UserRow, plain: string): boolean {
  return bcrypt.compareSync(plain, user.password_hash);
}

function seedIfEmpty(): void {
  const row = db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number };
  if (row.c > 0) return;

  const demoPass = process.env.DEMO_PASSWORD ?? "demo1234";
  createUser("professor@edu.local", demoPass, "Dr. Demo Professor", "professor");
  createUser("student@edu.local", demoPass, "Alex Student", "student");
  createUser("admin@edu.local", demoPass, "Site Admin", "admin");
  db.prepare(
    `UPDATE users SET title = ?, office_hours = ? WHERE email = ?`
  ).run(
    "Professor (Demo)",
    "Mon & Wed 2:00–4:00 PM — Room 101 or by appointment",
    "professor@edu.local"
  );
  console.log(
    "[db] Seeded demo users: professor@edu.local, student@edu.local, admin@edu.local (password: DEMO_PASSWORD or demo1234)"
  );
}

seedIfEmpty();

const insertThread = db.prepare(
  `INSERT INTO threads (id, student_id, professor_id, subject) VALUES (?, ?, ?, ?)`
);
const insertMessage = db.prepare(
  `INSERT INTO messages (id, thread_id, from_user_id, body) VALUES (?, ?, ?, ?)`
);
const bumpThread = db.prepare(`UPDATE threads SET updated_at = datetime('now') WHERE id = ?`);

export function createThreadWithMessage(
  studentId: string,
  professorId: string,
  subject: string,
  body: string
): { threadId: string } {
  const threadId = randomUUID();
  const msgId = randomUUID();
  db.exec("BEGIN IMMEDIATE;");
  try {
    insertThread.run(threadId, studentId, professorId, subject.trim() || "Message");
    insertMessage.run(msgId, threadId, studentId, body.trim());
    bumpThread.run(threadId);
    db.exec("COMMIT;");
  } catch (e) {
    db.exec("ROLLBACK;");
    throw e;
  }
  return { threadId };
}

export interface ThreadSummary {
  id: string;
  studentName: string;
  studentId: string;
  professorName: string;
  professorId: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  messageCount: number;
}

const listForProfessor = db.prepare(`
  SELECT t.id, t.subject, t.created_at, t.updated_at, t.student_id, t.professor_id,
         s.display_name AS student_name,
         p.display_name AS professor_name,
         (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) AS message_count,
         (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_body
  FROM threads t
  JOIN users s ON s.id = t.student_id
  JOIN users p ON p.id = t.professor_id
  WHERE t.professor_id = ?
  ORDER BY t.updated_at DESC
`);

const listAllThreadsStmt = db.prepare(`
  SELECT t.id, t.subject, t.created_at, t.updated_at, t.student_id, t.professor_id,
         s.display_name AS student_name,
         p.display_name AS professor_name,
         (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) AS message_count,
         (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_body
  FROM threads t
  JOIN users s ON s.id = t.student_id
  JOIN users p ON p.id = t.professor_id
  ORDER BY t.updated_at DESC
`);

export function listAllThreads(): ThreadSummary[] {
  const rows = listAllThreadsStmt.all() as Array<{
    id: string;
    subject: string;
    created_at: string;
    updated_at: string;
    student_id: string;
    professor_id: string;
    student_name: string;
    professor_name: string;
    message_count: number;
    last_body: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    studentName: r.student_name,
    studentId: r.student_id,
    professorName: r.professor_name,
    professorId: r.professor_id,
    subject: r.subject,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    lastMessage: r.last_body ?? "",
    messageCount: r.message_count,
  }));
}

export function listThreadsForProfessor(professorId: string): ThreadSummary[] {
  const rows = listForProfessor.all(professorId) as Array<{
    id: string;
    subject: string;
    created_at: string;
    updated_at: string;
    student_id: string;
    professor_id: string;
    student_name: string;
    professor_name: string;
    message_count: number;
    last_body: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    studentName: r.student_name,
    studentId: r.student_id,
    professorName: r.professor_name,
    professorId: r.professor_id,
    subject: r.subject,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    lastMessage: r.last_body ?? "",
    messageCount: r.message_count,
  }));
}

const listForStudent = db.prepare(`
  SELECT t.id, t.subject, t.created_at, t.updated_at, t.student_id, t.professor_id,
         s.display_name AS student_name,
         p.display_name AS professor_name,
         (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) AS message_count,
         (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_body
  FROM threads t
  JOIN users s ON s.id = t.student_id
  JOIN users p ON p.id = t.professor_id
  WHERE t.student_id = ?
  ORDER BY t.updated_at DESC
`);

export function listThreadsForStudent(studentId: string): ThreadSummary[] {
  const rows = listForStudent.all(studentId) as Array<{
    id: string;
    subject: string;
    created_at: string;
    updated_at: string;
    student_id: string;
    professor_id: string;
    student_name: string;
    professor_name: string;
    message_count: number;
    last_body: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    studentName: r.student_name,
    studentId: r.student_id,
    professorName: r.professor_name,
    professorId: r.professor_id,
    subject: r.subject,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    lastMessage: r.last_body ?? "",
    messageCount: r.message_count,
  }));
}

const getThreadRow = db.prepare(`
  SELECT t.id, t.subject, t.student_id, t.professor_id, t.created_at,
         s.display_name AS student_name,
         p.display_name AS professor_name
  FROM threads t
  JOIN users s ON s.id = t.student_id
  JOIN users p ON p.id = t.professor_id
  WHERE t.id = ?
`);

export interface ThreadAccess {
  id: string;
  subject: string;
  studentId: string;
  professorId: string;
  studentName: string;
  professorName: string;
  createdAt: string;
}

export function getThreadMeta(threadId: string): ThreadAccess | undefined {
  const r = getThreadRow.get(threadId) as
    | {
        id: string;
        subject: string;
        student_id: string;
        professor_id: string;
        created_at: string;
        student_name: string;
        professor_name: string;
      }
    | undefined;
  if (!r) return undefined;
  return {
    id: r.id,
    subject: r.subject,
    studentId: r.student_id,
    professorId: r.professor_id,
    studentName: r.student_name,
    professorName: r.professor_name,
    createdAt: r.created_at,
  };
}

const listMessages = db.prepare(`
  SELECT m.id, m.body, m.created_at, m.from_user_id,
         u.role AS from_role
  FROM messages m
  JOIN users u ON u.id = m.from_user_id
  WHERE m.thread_id = ?
  ORDER BY m.created_at ASC
`);

export interface MessageRow {
  id: string;
  body: string;
  createdAt: string;
  fromUserId: string;
  fromRole: Role;
}

export function getThreadMessages(threadId: string): MessageRow[] {
  const rows = listMessages.all(threadId) as Array<{
    id: string;
    body: string;
    created_at: string;
    from_user_id: string;
    from_role: Role;
  }>;
  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    fromUserId: m.from_user_id,
    fromRole: m.from_role,
  }));
}

export function addMessageToThread(
  threadId: string,
  fromUserId: string,
  body: string
): MessageRow | undefined {
  const meta = getThreadMeta(threadId);
  if (!meta) return undefined;
  const msgId = randomUUID();
  insertMessage.run(msgId, threadId, fromUserId, body.trim());
  bumpThread.run(threadId);
  const msgs = getThreadMessages(threadId);
  return msgs.find((m) => m.id === msgId);
}

const listProfessorsStmt = db.prepare(
  `SELECT id, email, display_name, title, office_hours FROM users WHERE role = 'professor' ORDER BY display_name`
);

export function listProfessorDirectory(): Array<{
  id: string;
  email: string;
  displayName: string;
  title: string;
  officeHours: string;
}> {
  const rows = listProfessorsStmt.all() as Array<{
    id: string;
    email: string;
    display_name: string;
    title: string;
    office_hours: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    title: r.title ?? "",
    officeHours: r.office_hours ?? "",
  }));
}

const updatePasswordStmt = db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`);

export function updateUserPassword(userId: string, plainPassword: string): void {
  const password_hash = bcrypt.hashSync(plainPassword, 12);
  updatePasswordStmt.run(password_hash, userId);
}

const updateProfileStmt = db.prepare(
  `UPDATE users SET office_hours = ?, title = ? WHERE id = ?`
);

export function updateProfessorProfile(
  userId: string,
  officeHours: string,
  title: string
): void {
  updateProfileStmt.run(officeHours.trim(), title.trim(), userId);
}

const insertResetStmt = db.prepare(
  `INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+1 hour'))`
);
const invalidateResetsStmt = db.prepare(
  `UPDATE password_resets SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL`
);
const findResetStmt = db.prepare(`
  SELECT id, user_id FROM password_resets
  WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
`);
const markResetUsedStmt = db.prepare(
  `UPDATE password_resets SET used_at = datetime('now') WHERE id = ?`
);

function hashResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Returns plaintext token to send by email (or dev-only to client). */
export function createPasswordResetForEmail(email: string): { token: string; userId: string } | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  invalidateResetsStmt.run(user.id);
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const token_hash = hashResetToken(token);
  insertResetStmt.run(id, user.id, token_hash);
  return { token, userId: user.id };
}

export function resetPasswordWithToken(plainToken: string, newPassword: string): boolean {
  if (newPassword.length < 8) return false;
  const token_hash = hashResetToken(plainToken);
  const row = findResetStmt.get(token_hash) as { id: string; user_id: string } | undefined;
  if (!row) return false;
  db.exec("BEGIN IMMEDIATE;");
  try {
    updateUserPassword(row.user_id, newPassword);
    markResetUsedStmt.run(row.id);
    db.exec("COMMIT;");
  } catch (e) {
    db.exec("ROLLBACK;");
    throw e;
  }
  return true;
}
