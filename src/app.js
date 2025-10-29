import express from "express";
import dotenv from "dotenv";

import todoRouter from "./routes/todoRouter.js";
import categoriesRouter from "./routes/categoryRouter.js";

import { sequelize, Todo, Category } from "./models/index.js";

dotenv.config();

// Настроим ассоциации
Todo.belongsTo(Category, { foreignKey: "category_id", as: "category" });
Category.hasMany(Todo, { foreignKey: "category_id", as: "todos" });

const app = express();
const port = process.env.PORT || 3000;

// Только JSON API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Роуты API
app.use("/api/todos", todoRouter);
app.use("/api/categories", categoriesRouter);


sequelize
.sync()
.then(() => {
  console.log("Таблицы созданы или уже существуют.");
 })
 .catch((err) => {
    console.log("Ошибка при создании таблиц:", err);
 });
 

app.listen(port, () => {
 console.log(`Server is running on port ${port}`);
});


