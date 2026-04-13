export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'User Service API',
    version: '1.0.0',
    description: 'REST API для управления пользователями',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          full_name: { type: 'string' },
          birth_date: { type: 'string', format: 'date' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { nullable: true },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['fullName', 'birthDate', 'email', 'password'],
        properties: {
          fullName: { type: 'string', example: 'Иванов Иван Иванович' },
          birthDate: { type: 'string', format: 'date', example: '1995-06-15' },
          email: { type: 'string', format: 'email', example: 'ivan@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
          role: { type: 'string', enum: ['ADMIN', 'USER'], default: 'USER' },
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
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          201: { description: 'Пользователь зарегистрирован' },
          400: { description: 'Ошибка валидации' },
          409: { description: 'Email уже существует' },
        },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['Auth'],
        summary: 'Авторизация',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          200: { description: 'Успешный логин, возвращает JWT токен' },
          401: { description: 'Неверные credentials или аккаунт заблокирован' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Получить свой профиль',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Профиль текущего пользователя' },
          401: { description: 'Не авторизован' },
        },
      },
    },
    '/api/users/': {
      get: {
        tags: ['Users'],
        summary: 'Список всех пользователей (только Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Массив пользователей' },
          401: { description: 'Не авторизован' },
          403: { description: 'Нет прав (не Admin)' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Получить пользователя по ID (Admin или сам пользователь)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Данные пользователя' },
          403: { description: 'Нет прав' },
          404: { description: 'Пользователь не найден' },
        },
      },
    },
    '/api/users/{id}/block': {
      patch: {
        tags: ['Users'],
        summary: 'Заблокировать пользователя (Admin или сам пользователь)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Пользователь заблокирован' },
          403: { description: 'Нет прав' },
          404: { description: 'Пользователь не найден' },
        },
      },
    },
  },
};
