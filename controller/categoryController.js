import * as categoryModel from "../model/category.js";

export function listCategories(req, res, next) {
  try {
    const categories = categoryModel.getAllCategories();
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
}

export function getCategory(req, res, next) {
  try {
    const category = categoryModel.getCategoryById(Number(req.params.id));

    if (!category) {
      const err = new Error("Категория не найдена!");
      err.statusCode = 404;
      throw err;
    }

    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}

export function createCategory(req, res, next) {
  try {
    const { name } = req.body;

    if (!name || name.length < 2 || name.length > 100) {
      const err = new Error("Имя категории должно быть от 2 до 100 символов");
      err.statusCode = 400;
      throw err;
    }

    const category = categoryModel.createCategory({ name: name.trim() });
    res.status(201).json({ data: category });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      error.statusCode = 409;
      error.message = "Категория с таким именем уже существует";
    }
    next(error);
  }
}

export function updateCategory(req, res, next) {
  try {
    const { name } = req.body;
    const id = Number(req.params.id);

    if (!name || name.length < 2 || name.length > 100) {
      const err = new Error("Имя категории должно быть от 2 до 100 символов");
      err.statusCode = 400;
      throw err;
    }

    const updated = categoryModel.updateCategory(id, { name: name.trim() });

    if (!updated) {
      const err = new Error("Категория не найдена!");
      err.statusCode = 404;
      throw err;
    }

    res.json({ data: updated });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      error.statusCode = 409;
      error.message = "Категория с таким именем уже существует";
    }
    next(error);
  }
}

export function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = categoryModel.deleteCategory(id);

    if (!deleted) {
      const err = new Error("Категория не найдена!");
      err.statusCode = 404;
      throw err;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
