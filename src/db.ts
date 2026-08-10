import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "agent.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  due_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export interface Task {
  id: number;
  title: string;
  done: number;
  due_at: string | null;
  created_at: string;
}

export function addTask(title: string, dueAt?: string | null): Task {
  const info = db
    .prepare("INSERT INTO tasks (title, due_at) VALUES (?, ?)")
    .run(title, dueAt ?? null);
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid) as Task;
}

export function listTasks(filter: "all" | "pending" | "done" = "all"): Task[] {
  if (filter === "pending") {
    return db
      .prepare("SELECT * FROM tasks WHERE done = 0 ORDER BY due_at IS NULL, due_at, id")
      .all() as Task[];
  }
  if (filter === "done") {
    return db.prepare("SELECT * FROM tasks WHERE done = 1 ORDER BY id DESC").all() as Task[];
  }
  return db
    .prepare("SELECT * FROM tasks ORDER BY done, due_at IS NULL, due_at, id")
    .all() as Task[];
}

export function completeTask(id: number): Task | null {
  db.prepare("UPDATE tasks SET done = 1 WHERE id = ?").run(id);
  return (db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined) ?? null;
}

export function deleteTask(id: number): boolean {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return info.changes > 0;
}
