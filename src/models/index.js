import dotenv from "dotenv";
import { Sequelize, DataTypes } from "sequelize";
import configLoader from "../config/config.js";

import categoryFactory from "./category.js";
import todoFactory from "./todo.js";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const cfg = configLoader[env];

// Инициализируем Sequelize из config.js (или переменной окружения)
const sequelize = cfg.use_env_variable
	? new Sequelize(process.env[cfg.use_env_variable], cfg)
	: new Sequelize(cfg.database, cfg.username, cfg.password, cfg);

// Инициализируем модели через фабрики
const Category = categoryFactory(sequelize, DataTypes);
const Todo = todoFactory(sequelize, DataTypes);

export { sequelize, Category, Todo };

