const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function createDb(dbPath = './data/quicknotes.db') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  return db;
}
module.exports = { createDb };
