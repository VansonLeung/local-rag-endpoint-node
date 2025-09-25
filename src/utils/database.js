const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../db/rag.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  // Documents table
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      content_preview TEXT,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Embeddings table (vectors stored as BLOB)
  db.run(`
    CREATE TABLE IF NOT EXISTS embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER,
      vector BLOB,
      FOREIGN KEY (doc_id) REFERENCES documents (id)
    )
  `);

  console.log('Database tables initialized.');
});

// Load sqlite-vec extension
const loadVecExtension = () => {
  try {
    db.loadExtension(path.join(__dirname, '../../db/vec0.dylib'));
    console.log('sqlite-vec extension loaded successfully.');
  } catch (err) {
    console.error('Failed to load sqlite-vec extension:', err.message);
  }
};

loadVecExtension();

module.exports = db;
