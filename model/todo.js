import crypto from "node:crypto";
import { exec, get, query } from "../db/db.js";

function normalizeDueDate(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw Object.assign(new Error("Invalid due date"), { statusCode: 400 });
	}

	return date.toISOString();
}

function mapTodo(row) {
	if (!row) {
		return null;
	}

	return {
		id: row.id,
		title: row.title,
		completed: Boolean(row.completed),
		due_date: row.due_date,
		created_at: row.created_at,
		updated_at: row.updated_at,
		category: row.category_id
			? { id: row.category_id, name: row.category_name ?? null }
			: null,
	};
}

export function getTodoById(id) {
	const row = get(
		`SELECT t.id,
						t.title,
						t.completed,
						t.category_id,
						t.due_date,
						t.created_at,
						t.updated_at,
						c.name AS category_name
			 FROM todos t
			 LEFT JOIN categories c ON c.id = t.category_id
			WHERE t.id = @id`,
		{ id }
	);

	return mapTodo(row);
}

export function listTodos({
	categoryId,
	search,
	page = 1,
	limit = 10,
	sortBy = "created_at",
	sortOrder = "desc",
}) {
	const allowedSortColumns = {
		created_at: "t.created_at",
		due_date: "t.due_date",
		title: "t.title",
	};

	const normalizedSortColumn = allowedSortColumns[sortBy] || allowedSortColumns.created_at;
	const normalizedSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

	const filters = [];
	const params = {};

	if (categoryId !== undefined) {
		filters.push("t.category_id = @categoryId");
		params.categoryId = categoryId;
	}

	if (search) {
		filters.push("LOWER(t.title) LIKE @search");
		params.search = `%${search.toLowerCase()}%`;
	}

	const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
	const offset = (page - 1) * limit;

	const rows = query(
		`SELECT t.id,
						t.title,
						t.completed,
						t.category_id,
						t.due_date,
						t.created_at,
						t.updated_at,
						c.name AS category_name
			 FROM todos t
			 LEFT JOIN categories c ON c.id = t.category_id
			${whereClause}
			ORDER BY ${normalizedSortColumn} ${normalizedSortOrder}
			LIMIT @limit OFFSET @offset`,
		{ ...params, limit, offset }
	);

	const countRow = get(
		`SELECT COUNT(*) AS total
			 FROM todos t
			 ${whereClause}`,
		params
	);

	return {
		rows: rows.map(mapTodo),
		total: countRow?.total || 0,
	};
}

export function createTodo({ title, categoryId, dueDate }) {
	const id = crypto.randomUUID();
	const normalizedDueDate = normalizeDueDate(dueDate);

	exec(
		`INSERT INTO todos (id, title, completed, category_id, due_date)
		 VALUES (@id, @title, 0, @categoryId, @dueDate)`,
		{
			id,
			title,
			categoryId: categoryId ?? null,
			dueDate: normalizedDueDate,
		}
	);

	return getTodoById(id);
}

export function updateTodo(id, { title, completed, categoryId, dueDate }) {
	const assignments = [];
	const params = { id };

	if (title !== undefined) {
		assignments.push("title = @title");
		params.title = title;
	}

	if (completed !== undefined) {
		assignments.push("completed = @completed");
		params.completed = completed ? 1 : 0;
	}

	if (categoryId !== undefined) {
		assignments.push("category_id = @categoryId");
		params.categoryId = categoryId ?? null;
	}

	if (dueDate !== undefined) {
		assignments.push("due_date = @dueDate");
		params.dueDate = normalizeDueDate(dueDate);
	}

	if (assignments.length === 0) {
		return getTodoById(id);
	}

	assignments.push("updated_at = CURRENT_TIMESTAMP");

	const result = exec(
		`UPDATE todos
		 SET ${assignments.join(", ")}
		 WHERE id = @id`,
		params
	);

	if (result.changes === 0) {
		return null;
	}

	return getTodoById(id);
}

export function deleteTodo(id) {
	const result = exec(
		`DELETE FROM todos
		 WHERE id = @id`,
		{ id }
	);

	return result.changes > 0;
}

export function toggleTodo(id) {
	const todo = getTodoById(id);
	if (!todo) {
		return null;
	}

	return updateTodo(id, { completed: !todo.completed });
}
