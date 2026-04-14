const SafeUser = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    full_name: { type: 'string', example: 'Иванов Иван Иванович' },
    birth_date: { type: 'string', format: 'date', example: '1995-06-15' },
    email: { type: 'string', format: 'email', example: 'ivan@example.com' },
    role: { type: 'string', enum: ['ADMIN', 'USER'], example: 'USER' },
    is_active: { type: 'boolean', example: true },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const ApiError = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Error description' },
    data: { nullable: true, example: null },
  },
};

const authResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: SafeUser,
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
      },
    },
  },
});

const userResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'OK' }, data: SafeUser } } } },
});

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ApiError } },
});

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'User Service API',
    version: '2.0.0',
    description: `
REST API для управления пользователями.

## Роли
- **USER** — роль по умолчанию при регистрации. Нельзя передать \`role=ADMIN\` при регистрации.
- **ADMIN** — создаётся через \`npm run seed:admin\`.

## Rate Limits
| Эндпоинт | Лимит |
|----------|-------|
| \`POST /api/users/login\` | 10 запросов / 15 минут |
| Все остальные \`/api/*\` | 100 запросов / 15 минут |

## Аутентификация
Все защищённые эндпоинты требуют заголовок:
\`\`\`
Authorization: Bearer <JWT_TOKEN>
\`\`\`
    `.trim(),
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SafeUser,
      ApiError,
      PaginatedUsers: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: {
            type: 'object',
            properties: {
              data: { type: 'array', items: SafeUser },
              total: { type: 'integer', example: 42 },
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              totalPages: { type: 'integer', example: 5 },
            },
          },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['fullName', 'birthDate', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 255, example: 'Иванов Иван Иванович' },
          birthDate: { type: 'string', format: 'date', example: '1995-06-15', description: 'Формат YYYY-MM-DD' },
          email: { type: 'string', format: 'email', example: 'ivan@example.com' },
          password: { type: 'string', minLength: 6, maxLength: 100, example: 'secret123' },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ivan@example.com' },
          password: { type: 'string', example: 'secret123' },
        },
      },
    },
  },
  paths: {
    '/api/users/register': {
      post: {
        tags: ['Auth'],
        summary: 'Регистрация пользователя',
        description: 'Роль всегда `USER`. Передача `role=ADMIN` игнорируется.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          201: authResponse('Успешная регистрация'),
          400: errorResponse('Ошибка валидации (невалидный email, короткий пароль, неверный формат даты)'),
          409: errorResponse('Email уже занят'),
        },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['Auth'],
        summary: 'Авторизация',
        description: '**Rate limit:** 10 попыток / 15 минут на IP. Заблокированный пользователь получит `401`.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          200: authResponse('Успешный логин'),
          400: errorResponse('Ошибка валидации'),
          401: errorResponse('Неверные credentials или аккаунт заблокирован'),
          429: errorResponse('Превышен лимит попыток входа'),
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Мой профиль',
        description: 'Возвращает профиль текущего авторизованного пользователя.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: userResponse('Профиль текущего пользователя'),
          401: errorResponse('Не авторизован'),
        },
      },
    },
    '/api/users/': {
      get: {
        tags: ['Users'],
        summary: 'Список пользователей',
        description: '**Только Admin.** Поддерживает pagination и фильтрацию.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 }, description: 'Номер страницы' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 }, description: 'Записей на странице' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'USER'] }, description: 'Фильтр по роли' },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Фильтр по статусу активности' },
        ],
        responses: {
          200: { description: 'Paginated список пользователей', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedUsers' } } } },
          401: errorResponse('Не авторизован'),
          403: errorResponse('Недостаточно прав — требуется роль ADMIN'),
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Получить пользователя по ID',
        description: 'Admin может получить любого. User — только себя.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'UUID пользователя' }],
        responses: {
          200: userResponse('Данные пользователя'),
          401: errorResponse('Не авторизован'),
          403: errorResponse('Нет прав на просмотр этого пользователя'),
          404: errorResponse('Пользователь не найден'),
        },
      },
    },
    '/api/users/{id}/block': {
      patch: {
        tags: ['Users'],
        summary: 'Заблокировать пользователя',
        description: 'Admin может заблокировать любого. User — только себя. После блокировки вход запрещён (`401`).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'UUID пользователя' }],
        responses: {
          200: userResponse('Пользователь заблокирован, `is_active: false`'),
          401: errorResponse('Не авторизован'),
          403: errorResponse('Нет прав на блокировку этого пользователя'),
          404: errorResponse('Пользователь не найден'),
        },
      },
    },
  },
};
