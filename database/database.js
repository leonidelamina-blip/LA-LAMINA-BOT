import fs from 'node:fs/promises';
import path from 'node:path';
import initSqlJs from 'sql.js';

let db;
let dbFile;

export async function initDatabase(filePath = './database/sasuke.sqlite') {
  if (db) return databaseApi;

  dbFile = path.resolve(filePath);
  await fs.mkdir(path.dirname(dbFile), { recursive: true });

  const SQL = await initSqlJs();
  try {
    const existing = await fs.readFile(dbFile);
    db = new SQL.Database(existing);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    db = new SQL.Database();
  }

  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      trial_started_at TEXT,
      trial_expires_at TEXT,
      ad_command_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      jid TEXT PRIMARY KEY,
      name TEXT,
      settings_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_jid TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      days INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_jid TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'global',
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(subject_jid, scope)
    );

    CREATE TABLE IF NOT EXISTS command_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_jid TEXT NOT NULL,
      group_jid TEXT,
      command TEXT NOT NULL,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_jid TEXT,
      action TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await persist();
  return databaseApi;
}

async function persist() {
  if (!db || !dbFile) return;
  const data = db.export();
  await fs.writeFile(dbFile, Buffer.from(data));
}

const databaseApi = {
  async run(sql, params = []) {
    if (!db) throw new Error('Base de dados ainda não inicializada.');
    db.run(sql, params);
    await persist();
  },

  get(sql, params = []) {
    if (!db) throw new Error('Base de dados ainda não inicializada.');
    const statement = db.prepare(sql);
    try {
      statement.bind(params);
      return statement.step() ? statement.getAsObject() : null;
    } finally {
      statement.free();
    }
  },

  all(sql, params = []) {
    if (!db) throw new Error('Base de dados ainda não inicializada.');
    const statement = db.prepare(sql);
    const rows = [];
    try {
      statement.bind(params);
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  },

  async close() {
    if (!db) return;
    await persist();
    db.close();
    db = undefined;
  }
};

export { databaseApi };
