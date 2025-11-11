import db, { exec } from "../db/db.js";

export function createTables() {
	db.exec("PRAGMA foreign_keys = ON");

	exec(
		`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(100) NOT NULL UNIQUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
	);

	exec(
		`CREATE TABLE IF NOT EXISTS todos (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 120),
			completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
			category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
			due_date TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
	);

	exec(
		`CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category_id)`
	);

	exec(
		`CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)`
	);
}

if (process.argv[1] && process.argv[1].endsWith("create.js")) {
	createTables();
	// eslint-disable-next-line no-console
	console.log("Database schema ensured");
}
