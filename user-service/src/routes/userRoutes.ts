import { Router } from 'express';
import userController from '../controllers/userController';

const router = Router();

// Create a new user
router.post('/', userController.createUser.bind(userController));

// Get all users
router.get('/', userController.getAllUsers.bind(userController));

// Get user by ID
router.get('/:id', userController.getUserById.bind(userController));

// Update user by ID
router.put('/:id', userController.updateUser.bind(userController));

// Restore user by ID (must be before /:id route)
router.post('/:id/restore', userController.restoreUser.bind(userController));

// Hard delete user by ID (must be before /:id route)
router.delete('/:id/hard', userController.hardDeleteUser.bind(userController));

// Soft delete user by ID
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;

