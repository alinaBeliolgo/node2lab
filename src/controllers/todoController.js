import { Op } from "sequelize";
import { Todo, Category } from "../models/index.js";

// GET /api/todos  (список с фильтрами, поиском и пагинацией)
const list = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, completed, category_id } = req.query;

        const where = {};
        if (typeof completed !== "undefined") where.completed = completed === "true";
        if (category_id) where.category_id = Number(category_id);
        if (search) where.title = { [Op.iLike]: `%${search}%` };

        const offset = (Number(page) - 1) * Number(limit);

        const { rows, count } = await Todo.findAndCountAll({
            where,
            include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
            order: [["created_at", "DESC"]],
            limit: Number(limit),
            offset,
        });

        res.json({ 
            items: rows, 
            total: count, 
            page: Number(page), 
            limit: Number(limit) });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

// GET /api/todos/:id
const getById = async (req, res) => {
    try {
        const todo = await Todo.findByPk(req.params.id, {
            include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
        });
        if (!todo) return res.status(404).json({ error: "Задача не найдена" });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

// POST /api/todos
const create = async (req, res) => {
    try {
        const { title, category_id, due_date } = req.body;
        const todo = await Todo.create({ title, category_id: category_id ?? null, due_date });
        const withCategory = await Todo.findByPk(todo.id, {
            include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
        });
        res.status(201).json(withCategory);
    } catch (err) {
        if (err.name === "SequelizeValidationError") {
            return res.status(400).json({ error: err.errors.map(e => e.message).join(", ") });
        }
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

// PUT /api/todos/:id
const update = async (req, res) => {
    try {
        const { title, completed, category_id, due_date } = req.body;
        const todo = await Todo.findByPk(req.params.id);
        if (!todo) return res.status(404).json({ error: "Задача не найдена" });

        if (typeof title !== "undefined") todo.title = title;
        if (typeof completed !== "undefined") todo.completed = completed;
        if (typeof category_id !== "undefined") todo.category_id = category_id;
        if (typeof due_date !== "undefined") todo.due_date = due_date;
        await todo.save();

        const withCategory = await Todo.findByPk(todo.id, {
            include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
        });
        res.json(withCategory);
    } catch (err) {
        if (err.name === "SequelizeValidationError") {
            return res.status(400).json({ error: err.errors.map(e => e.message).join(", ") });
        }
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

// PATCH /api/todos/:id/toggle
const toggle = async (req, res) => {
    try {
        const todo = await Todo.findByPk(req.params.id);
        if (!todo) return res.status(404).json({ error: "Задача не найдена" });
        todo.completed = !todo.completed;
        await todo.save();
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

// DELETE /api/todos/:id
const remove = async (req, res) => {
    try {
        const todo = await Todo.findByPk(req.params.id);
        if (!todo) return res.status(404).json({ error: "Задача не найдена" });
        await todo.destroy();
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

export default { list, getById, create, update, toggle, remove };