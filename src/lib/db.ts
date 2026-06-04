import "dotenv/config";
import { Pool } from "pg";
import type { ShareState, Task, Course, Resource, Message, AppNotification } from "../types";

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("DATABASE_URL or PG_CONNECTION_STRING must be set to use PostgreSQL.");
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      priority TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      star BOOLEAN NOT NULL DEFAULT false,
      subtasks JSONB
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      room TEXT NOT NULL,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender TEXT NOT NULL,
      avatar TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      duration INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      task_ref TEXT,
      type TEXT NOT NULL
    );
  `);
}

export async function loadAppState(): Promise<{ state: ShareState; userSettings: Record<string, any>; focusSessions: any[] }> {
  const [taskResult, courseResult, resourceResult, messageResult, notificationResult, settingsResult, focusSessionResult] = await Promise.all([
    pool.query("SELECT * FROM tasks ORDER BY title"),
    pool.query("SELECT * FROM courses ORDER BY title"),
    pool.query("SELECT * FROM resources ORDER BY timestamp DESC"),
    pool.query("SELECT * FROM messages ORDER BY timestamp ASC"),
    pool.query("SELECT * FROM notifications ORDER BY timestamp DESC"),
    pool.query("SELECT * FROM app_settings"),
    pool.query("SELECT * FROM focus_sessions ORDER BY timestamp DESC"),
  ]);

  const state: ShareState = {
    tasks: taskResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      date: row.date,
      priority: row.priority,
      completed: row.completed,
      star: row.star,
      subTasks: row.subtasks ?? [],
    })),
    courses: courseResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      room: row.room,
      day: row.day,
      startTime: row.start_time,
      endTime: row.end_time,
      color: row.color,
      description: row.description,
    })),
    resources: resourceResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      type: row.type,
      url: row.url,
      timestamp: row.timestamp,
    })),
    messages: messageResult.rows.map((row) => ({
      id: row.id,
      sender: row.sender,
      avatar: row.avatar,
      text: row.text,
      timestamp: row.timestamp,
      role: row.role,
    })),
    notifications: notificationResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      read: row.read,
    })),
    focusedUserCount: 1,
  };

  const userSettings = settingsResult.rows.reduce<Record<string, any>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const focusSessions = focusSessionResult.rows.map((row) => ({
    id: row.id,
    duration: row.duration,
    timestamp: row.timestamp,
    taskRef: row.task_ref,
    type: row.type,
  }));

  return { state, userSettings, focusSessions };
}

export async function insertTask(task: Task): Promise<void> {
  await pool.query(
    `INSERT INTO tasks (id, title, category, date, priority, completed, star, subtasks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, date = EXCLUDED.date, priority = EXCLUDED.priority, completed = EXCLUDED.completed, star = EXCLUDED.star, subtasks = EXCLUDED.subtasks`,
    [task.id, task.title, task.category, task.date, task.priority, task.completed, task.star || false, task.subTasks || null]
  );
}

export async function replaceTasks(tasks: Task[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM tasks");
    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks (id, title, category, date, priority, completed, star, subtasks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [task.id, task.title, task.category, task.date, task.priority, task.completed, task.star || false, task.subTasks || null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function insertCourse(course: Course): Promise<void> {
  await pool.query(
    `INSERT INTO courses (id, title, room, day, start_time, end_time, color, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, room = EXCLUDED.room, day = EXCLUDED.day, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, color = EXCLUDED.color, description = EXCLUDED.description`,
    [course.id, course.title, course.room, course.day, course.startTime, course.endTime, course.color, course.description || null]
  );
}

export async function insertResource(resource: Resource): Promise<void> {
  await pool.query(
    `INSERT INTO resources (id, title, category, type, url, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, type = EXCLUDED.type, url = EXCLUDED.url, timestamp = EXCLUDED.timestamp`,
    [resource.id, resource.title, resource.category, resource.type, resource.url || null, resource.timestamp]
  );
}

export async function insertMessage(message: Message): Promise<void> {
  await pool.query(
    `INSERT INTO messages (id, sender, avatar, text, timestamp, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET sender = EXCLUDED.sender, avatar = EXCLUDED.avatar, text = EXCLUDED.text, timestamp = EXCLUDED.timestamp, role = EXCLUDED.role`,
    [message.id, message.sender, message.avatar, message.text, message.timestamp, message.role || null]
  );
}

export async function insertNotification(notification: AppNotification): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (id, title, content, type, timestamp, read)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, type = EXCLUDED.type, timestamp = EXCLUDED.timestamp, read = EXCLUDED.read`,
    [notification.id, notification.title, notification.content, notification.type, notification.timestamp, notification.read]
  );
}

export async function markNotificationsRead(): Promise<void> {
  await pool.query(`UPDATE notifications SET read = true WHERE read = false`);
}

export async function clearNotifications(): Promise<void> {
  await pool.query(`DELETE FROM notifications`);
}

if (import.meta.url.endsWith("db.ts")) {
  // When executed directly: create database schema.
  initializeDatabase()
    .then(() => {
      console.log("PostgreSQL schema initialized successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Unable to initialize database:", err);
      process.exit(1);
    });
}
