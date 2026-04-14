import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as userController from '../controllers/user.controller';
import { authenticate, requireAdmin, requireSelfOrAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../utils/validate';

const router = Router();

// Strict rate limit specifically for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, try again in 15 minutes', data: null },
});

// Public
router.post('/register', validate(registerSchema), userController.register);
router.post('/login', loginLimiter, validate(loginSchema), userController.login);

// Protected - authenticated
router.get('/me', authenticate, userController.getMe);

// Protected - admin only
router.get('/', authenticate, requireAdmin, userController.getAllUsers);

// Protected - admin or self
router.get('/:id', authenticate, requireSelfOrAdmin, userController.getUserById);
router.patch('/:id/block', authenticate, requireSelfOrAdmin, userController.blockUser);

export default router;
