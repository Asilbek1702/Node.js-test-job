import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/me', authenticate, userController.getMe);
router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.patch('/:id/block', authenticate, userController.blockUser);

export default router;
