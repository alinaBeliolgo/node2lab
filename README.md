# Лабораторная работа №2. Работа с базой данных

## Цель

- Спроектировать и реализовать REST API с двумя связанными сущностями: категории и задачи (1:N).
- Использовать PostgreSQL и ORM Sequelize для миграций, моделей, связей и валидации.
- Реализовать CRUD для категорий и задач.
- Возвращать ответы и ошибки только в формате JSON (без HTML).

## Стек и версия окружения

- Node.js + Express
- PostgreSQL
- Sequelize (ORM)
- dotenv для конфигурации

Файлы в репозитории (основные):

- `app.js` — запуск сервера, подключение к БД, регистрация роутов, настройка связей.
- `config/config.js` — конфигурация Sequelize по окружениям из `.env`.
- `models/` — фабрики моделей `Category` и `Todo`, инициализация `sequelize`.
- `migrations/` — миграции для создания таблиц `categories` и `todos`.
- `controllers/` — бизнес-логика и валидации на уровне API.
- `routes/` — REST-маршруты для категорий и задач.

## Схема базы данных

Связь: одна категория имеет много задач (1:N). В таблице `todos` хранится внешний ключ `category_id` на `categories.id`.

Таблица `categories`:

- `id` INTEGER PK, auto-increment
- `name` VARCHAR(100) NOT NULL
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

Таблица `todos`:

- `id` UUID PK, по умолчанию генерируется в БД через `gen_random_uuid()`
- `title` TEXT NOT NULL, валидация длины [2..120]
- `completed` BOOLEAN DEFAULT false
- `category_id` INTEGER NULL, FK → `categories(id)`, ON UPDATE CASCADE, ON DELETE SET NULL
- `due_date` TIMESTAMP NULL
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL

Примечание: генерация UUID в миграции использует `gen_random_uuid()`. Для PostgreSQL требуется расширение `pgcrypto`:

```
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Миграции

Файлы:

- `migrations/20251028090000-create-categories.js`
- `migrations/20251028090500-create-todos.js`

Фрагмент (создание `todos`):

```js
// migrations/20251028090500-create-todos.js
await queryInterface.createTable('todos', {
	id: {
		allowNull: false,
		primaryKey: true,
		type: Sequelize.UUID,
		defaultValue: Sequelize.literal('gen_random_uuid()')
	},
	title: { type: Sequelize.TEXT, allowNull: false },
	completed: { type: Sequelize.BOOLEAN, defaultValue: false },
	category_id: {
		type: Sequelize.INTEGER,
		references: { model: 'categories', key: 'id' },
		onUpdate: 'CASCADE',
		onDelete: 'SET NULL'
	},
	due_date: { type: Sequelize.DATE },
	created_at: { allowNull: false, type: Sequelize.DATE },
	updated_at: { allowNull: false, type: Sequelize.DATE }
});
```

В текущей сборке приложение также выполняет `sequelize.sync()` при старте (см. `app.js`), что создаёт таблицы при их отсутствии.

## Модели и связи

Инициализация в `models/index.js`:

```js
const Category = categoryFactory(sequelize, DataTypes);
const Todo = todoFactory(sequelize, DataTypes);
```

Определение моделей (ключевые поля и валидации):

```js
// models/todo.js
title: {
	type: DataTypes.TEXT,
	allowNull: false,
	validate: { len: { args: [2, 120], msg: 'Длина заголовка задачи должна быть от 2 до 120 символов' } }
}
```

Связи задаются при запуске в `app.js`:

```js
Todo.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Todo, { foreignKey: 'category_id', as: 'todos' });
```

## REST API

Базовый префикс: `/api`.

### Категории

- GET `/api/categories` — список всех категорий. Ответ: 200 + массив категорий.
- GET `/api/categories/:id` — получить категорию по ID. Ответ: 200 / 404.
- POST `/api/categories` — создать категорию. Тело: `{ "name": "string" }`. Ответ: 201.
- PUT `/api/categories/:id` — изменить название категории. Ответ: 200 / 404.
- DELETE `/api/categories/:id` — удалить категорию. Ответ: 204 / 404.

Фрагмент контроллера:

```js
// controllers/categoryController.js
const create = async (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: 'Поле name обязательно' });
	const category = await Category.create({ name });
	res.status(201).json(category);
};
```

### Задачи (todos)

- GET `/api/todos` — список задач (каждая задача содержит вложенный объект `category`). Ответ: объект `{ items, total, page, limit }`, код 200.
- GET `/api/todos/:id` — получить задачу по ID (+вложенная `category`). Ответ: 200 / 404.
- POST `/api/todos` — создать задачу. Тело: `{ title, category_id?, due_date? }`. Ответ: 201.
- PUT `/api/todos/:id` — обновить поля `{ title?, completed?, category_id?, due_date? }`. Ответ: 200 / 404.
- PATCH `/api/todos/:id/toggle` — переключить флаг `completed`. Ответ: 200 / 404.
- DELETE `/api/todos/:id` — удалить задачу. Ответ: 204 / 404.

Пример ответа элемента `todo`:

```json
{
	"id": "2f7c7a9c-9c3b-4f0d-8baf-...",
	"title": "Купить молоко",
	"completed": false,
	"due_date": null,
	"created_at": "2025-10-28T09:00:00.000Z",
	"updated_at": "2025-10-28T09:00:00.000Z",
	"category_id": 3,
	"category": { "id": 3, "name": "Покупки" }
}
```

## Как запустить

0) Node.js должен запускать ES-модули. Убедитесь, что в `package.json` задано `{ "type": "module" }` или используйте соответствующую конфигурацию сборки.

1) Создайте БД PostgreSQL и при необходимости включите расширение `pgcrypto`:

```
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

2) Создайте `.env` в корне `src/` проекта со значениями для окружения `development`:

```
PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_HOST=localhost
```

3) Установите зависимости и запустите сервер.

Вариант А (через node):

```
node app.js
```

При старте выполнится `sequelize.sync()` и при отсутствии таблиц они будут созданы.

4) Тестовые запросы (PowerShell):

```
curl -Method GET http://localhost:3000/api/categories
curl -Method POST http://localhost:3000/api/categories -ContentType 'application/json' -Body '{"name":"Покупки"}'
curl -Method POST http://localhost:3000/api/todos -ContentType 'application/json' -Body '{"title":"Купить молоко","category_id":1}'
curl -Method GET http://localhost:3000/api/todos
```

Примечание: если используем sequelize-cli для миграций, предварительно выполните миграции, затем запускайте сервер. В текущем проекте миграции присутствуют, но запуск возможен и без них за счёт `sync()`.


## Контрольные вопросы
1) Что такое реляционная база данных и какие преимущества она предоставляет?
Это база, где данные лежат в таблицах (строки/столбцы), а таблицы связаны ключами.
Плюсы:
  - Понятная структура и типы данных.
  - Целостность: внешние ключи не дают сломать связи.
  - SQL удобный язык запросов.
  - Индексы ускоряют поиск.
  - Нормализация уменьшает дублирование и ошибки.

2) Какие типы связей между таблицами существуют в реляционных базах данных?
- 1:1 один к одному (пользователь - паспортные данные).
- 1:N один ко многим (категория - много товаров/задач).
- M:N многие ко многим (студенты - курсы) через промежуточную таблицу.

3) Что такое RESTful API и для чего он используется?
RESTful API-- это способ организации взаимодействия между клиентом и сервером через интернет. Он используется, чтобы разные приложения могли обмениваться данными.
REST строится на обычных HTTP-запросах:
- GET - получить данные
- POST - добавить
- PUT/PATCH - обновить
- DELETE - удалить
- Идеи: stateless, понятные коды ответов (200, 201, 404, 500), обычно JSON

4) Что такое SQL-инъекция и как защититься от неё?
SQL-инъекция -- это тип атаки, при котором злоумышленник вставляет вредный SQL-код во ввод пользователя, чтобы изменить или получить доступ к данным в базе. Такая атака ломает логику работы приложения и может привести к утечке информации.
Защита:
  - Использовать параметризованные запросы (prepared statements, плейсхолдеры)
  - Не хранить пароли в открытом виде (использовать хэширование)
  - Делать валидацию и ограничения на ввод (тип, длина, формат)
  - Назначать минимально необходимые права пользователю базы данных
  - Вести логи и мониторинг подозрительной активности

5) В чем разница между ORM и сырыми SQL-запросами? Какие преимущества и недостатки у каждого подхода?
ORM (Object-Relational Mapping) -- это технология, которая позволяет работать с базой данных через объекты и методы, без написания SQL вручную.
- Преимущества ORM:
   - Упрощает работу с базой данных
   - Код становится чище и понятнее
   - Меньше ошибок при работе с запросами

- Недостатки ORM:
   - Может работать медленнее при сложных запросах
   - Не всегда позволяет реализовать очень специфичные SQL-операции


Сырые SQL-запросы -- это прямое написание SQL-кода вручную.
- Преимущества сырых запросов:
   - Полный контроль над логикой и структурой запросов
   - Более высокая производительность в некоторых случаях

- Недостатки сырых запросов:
   - Боьше кода и выше риск ошибок
   - Нужно самому заботиться о защите от SQL-инъекций
   - Код становится менее гибким и сложнее поддерживать
