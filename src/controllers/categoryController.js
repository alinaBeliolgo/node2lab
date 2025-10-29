import { Category } from "../models/index.js";


const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

const getById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Категория не найдена" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

const create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Поле name обязательно" });
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

const update = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Категория не найдена" });
    category.name = name;
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

const remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Категория не найдена" });
    await category.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export default { getAll, getById, create, update, remove };
