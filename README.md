# User Service API

REST API сервис для управления пользователями.

**Стек:** TypeScript · Express · PostgreSQL (`pg`) · JWT · bcryptjs · Zod · Jest

---

## Структура проекта

```
src/
├── __tests__/
│   └── auth.test.ts              # 23 теста: регистрация, логин, user/admin доступ, блокировка
├── controllers/
│   └── user.controller.ts        # HTTP слой — разбор запроса, вызов сервиса, ответ
├── db/
│   ├── migrations/
│   │   └── 001_create_users_table.sql
│   ├── migrate.ts                # Версионированный раннер миграций
│   ├── pool.ts                   # PostgreSQL connection pool
│   └── seed-admin.ts             # Создание первого Admin
├── middlewares/
│   ├── auth.middleware.ts        # authenticate / requireAdmin / requireSelfOrAdmin
│   ├── error.middleware.ts       # 404 + global error handler
│   └── validate.middleware.ts    # Zod schema validation
├── routes/
│   └── user.routes.ts
├── services/
│   └── user.service.ts           # Бизнес-логика
├── types/
│   └── index.ts                  # Role enum, интерфейсы, DTO
├── utils/
│   ├── errors.ts                 # AppError / NotFoundError / ConflictError / UnauthorizedError
│   ├── jwt.ts                    # signToken / verifyToken
│   ├── response.ts               # sendSuccess / sendError
│   └── validate.ts               # Zod схемы
├── swagger.ts                    # OpenAPI 3.0 документация
├── app.ts
└── server.ts
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

Миграции версионированы — повторный запуск безопасен.

### 5. Создать первого Admin
```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 npm run seed:admin
```

На Windows (PowerShell):
```powershell
$env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="secret123"; npm run seed:admin
```

> Скрипт идемпотентен — если admin уже существует, просто выведет сообщение и завершится.

### 6. Запустить сервер
```bash
npm run dev
```

---

## Запуск через Docker (всё вместе)
```bash
docker-compose up --build
```

После запуска создай admin:
```bash
docker exec user_service_app sh -c "ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 node dist/db/seed-admin.js"
```

---

## Тесты
```bash
npm test                # все тесты
npm run test:coverage   # с отчётом покрытия
```

---

## API Endpoints

| Метод | URL | Доступ | Описание |
|-------|-----|--------|----------|
| `POST` | `/api/users/register` | Публичный | Регистрация (роль всегда USER) |
| `POST` | `/api/users/login` | Публичный | Авторизация, получение JWT |
| `GET` | `/api/users/me` | Авторизованный | Свой профиль |
| `GET` | `/api/users/` | Только Admin | Список с pagination и фильтрами |
| `GET` | `/api/users/:id` | Admin или сам | Пользователь по ID |
| `PATCH` | `/api/users/:id/block` | Admin или сам | Заблокировать пользователя |
| `GET` | `/api/docs` | Публичный | Swagger UI |
| `GET` | `/health` | Публичный | Health check |

### Pagination и фильтры для `GET /api/users/`
```
?page=1&limit=10          — страница и размер
?role=USER                — фильтр по роли (USER | ADMIN)
?isActive=true            — фильтр по статусу
```

---

## Rate Limits

| Эндпоинт | Лимит |
|----------|-------|
| `POST /api/users/login` | 10 запросов / 15 минут |
| Все `/api/*` | 100 запросов / 15 минут |

---

## Безопасность
- **Helmet** — защитные HTTP-заголовки
- **CORS** — Cross-Origin Resource Sharing
- **Rate Limiting** — защита от брутфорса
- **Zod** — валидация входных данных
- **bcryptjs** — хеширование паролей (10 rounds)
- **JWT** — stateless аутентификация
- Роль `ADMIN` не передаётся при регистрации — только через `seed:admin`

---

## Формат ответов

Все ответы имеют единый формат:

```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

Ошибки:
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

---

## Swagger UI

`http://localhost:3000/api/docs`

Нажми **Authorize** → вставь JWT токен → тестируй прямо в браузере.
