// Простая миграция для создания таблиц (используется SQLite через better-sqlite3)
import { createTables } from "../utils/create.js";

createTables();

// eslint-disable-next-line no-console
console.log("Database schema ensured (script/migrate.js)");
