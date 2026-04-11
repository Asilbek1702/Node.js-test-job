# User Service API

REST API сервис для управления пользователями. Построен на **TypeScript + Express + Prisma + PostgreSQL**.

## Стек

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM**: Prisma
- **БД**: PostgreSQL
- **Auth**: JWT (Bearer token)
- **Хеширование паролей**: bcryptjs

## Структура проекта

```
src/
├── controllers/      # Обработка HTTP-запросов и ответов
│   └── user.controller.ts
├── services/         # Бизнес-логика
│   └── user.service.ts
├── routes/           # Роутинг
│   └── user.routes.ts
├── middlewares/      # Auth, error handling
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── utils/            # JWT, стандартные ответы
│   ├── jwt.ts
│   └── response.ts
├── types/            # TypeScript типы
│   └── index.ts
├── app.ts            # Express приложение
└── server.ts         # Точка входа
prisma/
└── schema.prisma     # Схема БД
```

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Создать `.env` файл

```bash
cp .env.example .env
```

Содержимое `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/user_service_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Запустить PostgreSQL через Docker

```bash
docker-compose up -d
```

### 4. Применить миграции и сгенерировать Prisma Client

```bash
npm run db:migrate
npm run db:generate
```

### 5. Запустить сервер

```bash
npm run dev
```

Сервер стартует на `http://localhost:3000`

---

## API Endpoints

### Публичные (без токена)

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/api/users/register` | Регистрация нового пользователя |
| `POST` | `/api/users/login` | Авторизация, получение JWT |

### Защищённые (требуют `Authorization: Bearer <token>`)

| Метод | URL | Доступ | Описание |
|-------|-----|--------|----------|
| `GET` | `/api/users/me` | Любой авторизованный | Получить свой профиль |
| `GET` | `/api/users/:id` | Admin или сам пользователь | Получить пользователя по ID |
| `GET` | `/api/users/` | Только Admin | Список всех пользователей |
| `PATCH` | `/api/users/:id/block` | Admin или сам пользователь | Заблокировать пользователя |

---

## Примеры запросов

### Регистрация

```http
POST /api/users/register
Content-Type: application/json

{
  "fullName": "Иванов Иван Иванович",
  "birthDate": "1995-06-15",
  "email": "ivan@example.com",
  "password": "secret123",
  "role": "USER"
}
```

### Авторизация

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "ivan@example.com",
  "password": "secret123"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "fullName": "...", ... },
    "token": "eyJhbGc..."
  }
}
```

### Получить пользователя по ID

```http
GET /api/users/some-uuid
Authorization: Bearer eyJhbGc...
```

### Заблокировать пользователя

```http
PATCH /api/users/some-uuid/block
Authorization: Bearer eyJhbGc...
```

---

## Формат ответов

Все ответы имеют единый формат:

```json
{
  "success": true | false,
  "message": "...",
  "data": { ... } | null
}
```

## Модель пользователя

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `fullName` | String | ФИО |
| `birthDate` | DateTime | Дата рождения |
| `email` | String | Email (уникальный) |
| `password` | String | Хешированный пароль (bcrypt) |
| `role` | Enum | `USER` или `ADMIN` |
| `isActive` | Boolean | Статус (активен/заблокирован) |
