import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../utils/validate';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);

// Protected routes
router.get('/me', authenticate, userController.getMe);
router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.patch('/:id/block', authenticate, userController.blockUser);

export default router;
