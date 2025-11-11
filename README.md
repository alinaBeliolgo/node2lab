# Лабораторная работа №2. Работа с базой данных

## Цель работы

- Спроектировать и реализовать REST API с двумя связанными сущностями: категории и задачи (1:N).
- Использовать SQLite в качестве СУБД с библиотекой better-sqlite3 для работы с базой данных.
- Реализовать полноценный CRUD для категорий и задач с валидацией данных.
- Добавить документацию API с помощью Swagger.
- Обеспечить возврат ответов только в формате JSON.

## Технологический стек

- **Backend**: Node.js + Express.js
- **База данных**: SQLite
- **Библиотека для работы с БД**: better-sqlite3
- **Документация API**: Swagger UI Express + swagger-jsdoc
- **Конфигурация**: dotenv

## Структура проекта

```
├── app.js                 - главный файл приложения, запуск сервера
├── package.json          - зависимости и скрипты проекта
├── db/
│   ├── db.js            - подключение и функции для работы с SQLite
│   └── db.sqlite        - файл базы данных SQLite
├── model/
│   ├── category.js      - модель категорий с функциями CRUD
│   └── todo.js          - модель задач с функциями CRUD
├── controller/
│   ├── categoryController.js - контроллеры для категорий
│   └── todoController.js     - контроллеры для задач
├── router/
│   ├── categoryRouter.js - маршруты для категорий
│   ├── todoRouter.js     - маршруты для задач
│   └── swaggerD.js       - документация Swagger
├── utils/
│   └── create.js         - создание таблиц БД
├── swagger/
│   └── swagger.js        - конфигурация Swagger
└── script/
    └── migrate.js        - скрипт миграций
```

## Проектирование базы данных

Реализована связь один-ко-многим (1:N): одна категория может содержать множество задач. В таблице `todos` хранится внешний ключ `category_id`, ссылающийся на `categories.id`.

### Таблица `categories`

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица `todos`

```sql
CREATE TABLE todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 120),
    completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


**Особенности реализации:**
- Первичный ключ `id` в таблице `todos` представляет собой текстовую строку (генерируется с помощью crypto.randomUUID())
- Поле `completed` хранится как INTEGER (0/1) вместо BOOLEAN для совместимости с SQLite
- Установлена проверочная constraint для длины заголовка задачи (2-120 символов)
- При удалении категории связанные задачи не удаляются, а поле `category_id` устанавливается в NULL

## Инициализация базы данных

Создание таблиц происходит автоматически при запуске приложения через функцию `createTables()` в файле `utils/create.js`:

```javascript
export function createTables() {
    db.exec("PRAGMA foreign_keys = ON");

    exec(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    exec(`CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL CHECK (length(title) BETWEEN 2 AND 120),
        completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Создание индексов для оптимизации запросов
    exec(`CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category_id)`);
    exec(`CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)`);
}
```

**Ключевые особенности:**
- Включение поддержки внешних ключей: `PRAGMA foreign_keys = ON`
- Использование `IF NOT EXISTS` для безопасного создания таблиц
- Автоматическое создание индексов для часто используемых полей

## Архитектура приложения

### Модели данных

Приложение использует модульную архитектуру с разделением на слои:

**Модель категории (`model/category.js`):**
```javascript
// Основные функции для работы с категориями
export function getAllCategories()        // Получить все категории
export function getCategoryById(id)       // Получить категорию по ID
export function createCategory({ name })   // Создать новую категорию
export function updateCategory(id, data)  // Обновить категорию
export function deleteCategory(id)        // Удалить категорию
```

**Модель задач (`model/todo.js`):**
```javascript
// Основные функции для работы с задачами
export function getTodoById(id)           // Получить задачу по ID
export function listTodos(filters)        // Получить список задач с фильтрацией
export function createTodo(data)          // Создать новую задачу
export function updateTodo(id, data)      // Обновить задачу
export function deleteTodo(id)           // Удалить задачу
export function toggleTodoCompletion(id)  // Переключить статус выполнения
```

### Валидация данных

Валидация происходит на нескольких уровнях:

1. **Уровень БД**: CHECK constraints в SQLite
2. **Уровень моделей**: функция `normalizeDueDate()` для валидации дат
3. **Уровень контроллеров**: проверка обязательных полей и бизнес-логики

```javascript
// Пример валидации даты
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
```

## REST API

Все эндпоинты используют базовый префикс `/api` и возвращают данные в формате JSON.

### Основной эндпоинт

- **GET `/api`** — информация о API и доступных эндпоинтах

```json
{
  "status": "ok",
  "message": "Todo API",
  "docs": "/api-docs",
  "endpoints": {
    "categories": "/api/categories",
    "todos": "/api/todos"
  }
}
```

### API категорий

| Метод | Эндпоинт | Описание | Тело запроса |
|-------|----------|----------|--------------|
| GET | `/api/categories` | Получить все категории | - |
| GET | `/api/categories/:id` | Получить категорию по ID | - |
| POST | `/api/categories` | Создать категорию | `{"name": "string"}` |
| PUT | `/api/categories/:id` | Обновить категорию | `{"name": "string"}` |
| DELETE | `/api/categories/:id` | Удалить категорию | - |

### API задач

| Метод | Эндпоинт | Описание | Параметры |
|-------|----------|----------|-----------|
| GET | `/api/todos` | Получить список задач | `?page=1&limit=10&categoryId=1&search=text&sortBy=created_at&sortOrder=desc` |
| GET | `/api/todos/:id` | Получить задачу по ID | - |
| POST | `/api/todos` | Создать задачу | `{"title": "string", "category_id": number, "due_date": "ISO date"}` |
| PUT | `/api/todos/:id` | Обновить задачу | `{"title": "string", "completed": boolean, "category_id": number, "due_date": "ISO date"}` |
| PATCH | `/api/todos/:id/toggle` | Переключить статус выполнения | - |
| DELETE | `/api/todos/:id` | Удалить задачу | - |

### Возможности фильтрации и сортировки

API поддерживает расширенные возможности для работы со списком задач:

- **Пагинация**: параметры `page` и `limit`
- **Фильтрация по категории**: параметр `categoryId`
- **Поиск по заголовку**: параметр `search`
- **Сортировка**: параметры `sortBy` (created_at, due_date, title) и `sortOrder` (asc, desc)

### Пример ответа

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Купить продукты",
  "completed": false,
  "due_date": "2025-11-15T10:00:00.000Z",
  "created_at": "2025-11-12T08:30:00.000Z",
  "updated_at": "2025-11-12T08:30:00.000Z",
  "category": {
    "id": 1,
    "name": "Покупки"
  }
}
```

## Установка и запуск

### Предварительные требования

- Node.js версии 16 или выше
- npm (входит в состав Node.js)

### Шаги для запуска

1. **Клонируйте репозиторий и перейдите в папку проекта:**
   ```bash
   git clone <repository-url>
   cd src
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```


3. **Запустите приложение:**
   
   Для разработки с автоперезагрузкой:
   ```bash
   npm run dev
   ```
   
   Для production:
   ```bash
   npm start
   ```

4. **Проверьте работу API:**
   
   Откройте в браузере: `http://localhost:3000/api`
   
   Документация Swagger: `http://localhost:3000/api-docs`

### Доступные скрипты

- `npm start` — запуск продакшн версии
- `npm run dev` — запуск в режиме разработки с nodemon


### Особенности реализации

- **Автоматическое создание БД**: При первом запуске автоматически создается файл `db/db.sqlite` и необходимые таблицы
- **Swagger документация**: Автоматически генерируемая документация API доступна по адресу `/api-docs`
- **Валидация данных**: Комплексная валидация на уровне БД и приложения


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
