export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'User Service API',
    version: '2.0.0',
    description: 'REST API для управления пользователями. Роль назначается автоматически (USER) — самостоятельно стать Admin невозможно.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SafeUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          full_name: { type: 'string', example: 'Иванов Иван Иванович' },
          birth_date: { type: 'string', format: 'date', example: '1995-06-15' },
          email: { type: 'string', format: 'email', example: 'ivan@example.com' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          is_active: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedUsers: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/SafeUser' } },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['fullName', 'birthDate', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, example: 'Иванов Иван Иванович' },
          birthDate: { type: 'string', format: 'date', example: '1995-06-15' },
          email: { type: 'string', format: 'email', example: 'ivan@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
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
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: { nullable: true },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
          data: { nullable: true, example: null },
        },
      },
    },
  },
  paths: {
    '/api/users/register': {
      post: {
        tags: ['Auth'],
        summary: 'Регистрация пользователя',
        description: 'Роль всегда USER — передать role=ADMIN нельзя.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          201: { description: 'Зарегистрирован. Возвращает user + token' },
          400: { description: 'Ошибка валидации', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          409: { description: 'Email уже занят', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['Auth'],
        summary: 'Авторизация',
        description: 'Rate limit: 10 попыток / 15 минут. Заблокированный пользователь получит 401.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          200: { description: 'Успешный логин. Возвращает user + JWT token' },
          400: { description: 'Ошибка валидации' },
          401: { description: 'Неверные credentials или аккаунт заблокирован' },
          429: { description: 'Слишком много попыток входа' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Мой профиль',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Профиль текущего пользователя', content: { 'application/json': { schema: { $ref: '#/components/schemas/SafeUser' } } } },
          401: { description: 'Не авторизован' },
        },
      },
    },
    '/api/users/': {
      get: {
        tags: ['Users'],
        summary: 'Список всех пользователей [Admin only]',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Номер страницы' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Кол-во на страницу' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'USER'] }, description: 'Фильтр по роли' },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Фильтр по статусу' },
        ],
        responses: {
          200: { description: 'Paginated список пользователей', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedUsers' } } } },
          401: { description: 'Не авторизован' },
          403: { description: 'Нет прав (не Admin)' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Получить пользователя по ID [Admin или сам пользователь]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Данные пользователя' },
          401: { description: 'Не авторизован' },
          403: { description: 'Нет прав' },
          404: { description: 'Пользователь не найден' },
        },
      },
    },
    '/api/users/{id}/block': {
      patch: {
        tags: ['Users'],
        summary: 'Заблокировать пользователя [Admin или сам пользователь]',
        description: 'После блокировки вход запрещён (401).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Пользователь заблокирован' },
          401: { description: 'Не авторизован' },
          403: { description: 'Нет прав' },
          404: { description: 'Пользователь не найден' },
        },
      },
    },
  },
};
