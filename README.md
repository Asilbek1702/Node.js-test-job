# User Service API

REST API сервис для управления пользователями.

**Стек:** TypeScript · Express · PostgreSQL (`pg`) · JWT · bcryptjs · Zod · Jest

---

## Структура проекта

```
src/
├── __tests__/
│   └── auth.test.ts          # Jest + Supertest интеграционные тесты
├── controllers/
│   └── user.controller.ts    # HTTP слой — разбор запроса, вызов сервиса, ответ
├── db/
│   ├── migrations/
│   │   └── 001_create_users_table.sql  # Версионированная миграция
│   ├── migrate.ts            # Раннер миграций (отслеживает через _migrations)
│   └── pool.ts               # PostgreSQL connection pool
├── middlewares/
│   ├── auth.middleware.ts    # authenticate + requireAdmin
│   ├── error.middleware.ts   # 404 + global error handler
│   └── validate.middleware.ts # Zod schema validation
├── routes/
│   └── user.routes.ts
├── services/
│   └── user.service.ts       # Бизнес-логика
├── types/
│   └── index.ts
├── utils/
│   ├── jwt.ts                # signToken / verifyToken
│   ├── response.ts           # sendSuccess / sendError
│   └── validate.ts           # Zod схемы (registerSchema, loginSchema)
├── swagger.ts                # OpenAPI 3.0 документация
├── app.ts                    # Express app (middleware, routes)
└── server.ts                 # Точка входа
```

---

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Создать `.env`

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/user_service_db
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
PORT=3000
```

### 3. Запустить PostgreSQL

```bash
docker-compose up -d postgres
```

### 4. Применить миграции

```bash
npm run db:migrate
```

Миграции версионированы — повторный запуск безопасен, уже применённые пропускаются.

### 5. Запустить сервер

```bash
npm run dev
```

---

## Запуск через Docker (всё вместе)

```bash
docker-compose up --build
```

---

## Тесты

```bash
npm test                # запустить тесты
npm run test:coverage   # с отчётом покрытия
```

---

## API Endpoints

| Метод | URL | Доступ | Описание |
|-------|-----|--------|----------|
| `POST` | `/api/users/register` | Публичный | Регистрация |
| `POST` | `/api/users/login` | Публичный | Авторизация, получение JWT |
| `GET` | `/api/users/me` | Авторизованный | Свой профиль |
| `GET` | `/api/users/` | Только Admin | Список всех пользователей |
| `GET` | `/api/users/:id` | Admin или сам | Пользователь по ID |
| `PATCH` | `/api/users/:id/block` | Admin или сам | Заблокировать пользователя |
| `GET` | `/api/docs` | Публичный | Swagger UI |
| `GET` | `/health` | Публичный | Health check |

### Swagger UI

Открой в браузере: `http://localhost:3000/api/docs`

---

## Безопасность

- **Helmet** — защитные HTTP-заголовки
- **CORS** — Cross-Origin Resource Sharing
- **Rate Limiting** — 100 запросов / 15 минут на IP
- **Zod** — валидация входных данных
- **bcryptjs** — хеширование паролей (10 rounds)
- **JWT** — stateless аутентификация

---

## Формат ответов

```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

---

## Модель пользователя

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `full_name` | VARCHAR | ФИО |
| `birth_date` | DATE | Дата рождения |
| `email` | VARCHAR | Email (уникальный) |
| `password` | VARCHAR | Хеш пароля (bcrypt, не возвращается в ответах) |
| `role` | ENUM | `USER` или `ADMIN` |
| `is_active` | BOOLEAN | Статус (активен/заблокирован) |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `updated_at` | TIMESTAMPTZ | Дата обновления |
