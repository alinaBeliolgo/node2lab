import * as categoryModel from "../model/category.js";
import * as todoModel from "../model/todo.js";

export function listTodos(req, res, next) {
  try {
    console.log("listTodos called with query:", req.query);
    const {
      category,
      search,
      page = 1,
      limit = 10,
      sort = "created_at:desc",
    } = req.query;

    const [sortBy, sortOrder] = sort.split(":");

    const filters = {
      categoryId: category ? Number(category) : undefined,
      search,
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
    };

    const { rows, total } = todoModel.listTodos(filters);
    const totalPages = total > 0 ? Math.ceil(total / filters.limit) : 0;

    res.json({
      data: rows,
      meta: {
        total,
        count: rows.length,
        limit: filters.limit,
        pages: totalPages,
        currentPage: filters.page,
      },
    });
  } catch (error) {
    next(error);
  }
}

export function getTodo(req, res, next) {
  try {
    const todo = todoModel.getTodoById(req.params.id);

    if (!todo) {
      const err = new Error("Todo not found");
      err.statusCode = 404;
      throw err;
    }

    res.json({ data: todo });
  } catch (error) {
    next(error);
  }
}

export function createTodo(req, res, next) {
  try {
    const { title } = req.body;
    const categoryId =
      req.body.category_id !== undefined ? Number(req.body.category_id) : req.body.categoryId;
    const dueDate = req.body.due_date ?? req.body.dueDate;

    if (categoryId !== undefined && categoryId !== null) {
      const exists = categoryModel.categoryExists(Number(categoryId));
      if (!exists) {
        const err = new Error("Category not found");
        err.statusCode = 404;
        throw err;
      }
    }

    const todo = todoModel.createTodo({
      title: title.trim(),
      categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      dueDate,
    });

    res.status(201).json({ data: todo });
  } catch (error) {
    next(error);
  }
}

export function updateTodo(req, res, next) {
  try {
    const title = req.body.title;
    const completed = req.body.completed;
    const categoryId =
      req.body.category_id !== undefined ? Number(req.body.category_id) : req.body.categoryId;
    const dueDate = req.body.due_date ?? req.body.dueDate;

    if (
      title === undefined &&
      completed === undefined &&
      categoryId === undefined &&
      dueDate === undefined
    ) {
      const err = new Error("Nothing to update");
      err.statusCode = 400;
      throw err;
    }

    if (categoryId !== undefined && categoryId !== null) {
      const exists = categoryModel.categoryExists(Number(categoryId));
      if (!exists) {
        const err = new Error("Category not found");
        err.statusCode = 404;
        throw err;
      }
    }

    const updated = todoModel.updateTodo(req.params.id, {
      title: title !== undefined ? title.trim() : undefined,
      completed,
      categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      dueDate,
    });

    if (!updated) {
      const err = new Error("Todo not found");
      err.statusCode = 404;
      throw err;
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export function toggleTodo(req, res, next) {
  try {
    const updated = todoModel.toggleTodo(req.params.id);

    if (!updated) {
      const err = new Error("Todo not found");
      err.statusCode = 404;
      throw err;
    }

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export function deleteTodo(req, res, next) {
  try {
    const deleted = todoModel.deleteTodo(req.params.id);

    if (!deleted) {
      const err = new Error("Todo not found");
      err.statusCode = 404;
      throw err;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
