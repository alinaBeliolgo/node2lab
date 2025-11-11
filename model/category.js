import { exec, get, query } from "../db/db.js";

function mapCategory(row) {
	if (!row) {
		return null;
	}

	return {
		id: row.id,
		name: row.name,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

export function getAllCategories() {
	const rows = query(
		`SELECT id, name, created_at, updated_at
		 FROM categories
		 ORDER BY name ASC`
	);

	return rows.map(mapCategory);
}

export function getCategoryById(id) {
	const row = get(
		`SELECT id, name, created_at, updated_at
		 FROM categories
		 WHERE id = @id`,
		{ id }
	);

	return mapCategory(row);
}

export function createCategory({ name }) {
	const result = exec(
		`INSERT INTO categories (name)
		 VALUES (@name)`,
		{ name }
	);

	return getCategoryById(result.lastInsertRowid);
}

export function updateCategory(id, { name }) {
	const result = exec(
		`UPDATE categories
		 SET name = @name,
				 updated_at = CURRENT_TIMESTAMP
		 WHERE id = @id`,
		{ id, name }
	);

	if (result.changes === 0) {
		return null;
	}

	return getCategoryById(id);
}

export function deleteCategory(id) {
	const result = exec(
		`DELETE FROM categories
		 WHERE id = @id`,
		{ id }
	);

	return result.changes > 0;
}

export function categoryExists(id) {
	const row = get(
		`SELECT id
		 FROM categories
		 WHERE id = @id`,
		{ id }
	);

	return Boolean(row);
}
