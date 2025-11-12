import { Router } from 'express';
import userController from '../controllers/userController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createUserSchema, updateUserSchema, idParamSchema, paginationQuerySchema } from '../validations/uservalidation';

const router = Router();

// Create a new user - VALIDATE BODY
router.post(
  '/',
  validate(createUserSchema),
  userController.createUser.bind(userController)
);

// Get all users - VALIDATE QUERY
router.get(
  '/',
  validateQuery(paginationQuerySchema), // Dynamic attributes/includes support
  userController.getAllUsers.bind(userController)
);

// Get user by ID - VALIDATE PARAMS
router.get(
  '/:id',
  validateParams(idParamSchema),
  userController.getUserById.bind(userController)
);

// Update user by ID - VALIDATE PARAMS + BODY
router.put(
  '/:id',
  validateParams(idParamSchema),
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

// Restore user by ID - VALIDATE PARAMS
router.post(
  '/:id/restore',
  validateParams(idParamSchema),
  userController.restoreUser.bind(userController)
);

// Hard delete user by ID - VALIDATE PARAMS
router.delete(
  '/:id/hard',
  validateParams(idParamSchema),
  userController.hardDeleteUser.bind(userController)
);

// Soft delete user by ID - VALIDATE PARAMS
router.delete(
  '/:id',
  validateParams(idParamSchema),
  userController.deleteUser.bind(userController)
);

export default router;