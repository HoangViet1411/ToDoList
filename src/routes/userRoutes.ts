import { Router } from 'express';
import userController from '../controllers/userController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createUserSchema, updateUserSchema, idParamSchema, paginationQuerySchema } from '../validations/uservalidation';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';
import { validateProfile } from '../middleware/profileValidation';

const router = Router();

// Middleware chains để tránh lặp lại
const authAdmin = [authenticateToken, requireAdmin];
const authAdminWithParams = [authenticateToken, requireAdmin, validateParams(idParamSchema)];

// Create or update profile - AUTHENTICATE TOKEN + VALIDATE BODY
// User tự tạo/update profile của mình sau khi signup
// Validation sẽ tự động chọn schema phù hợp (create vs update)
router.post(
  '/profile',
  authenticateToken,
  validateProfile,
  userController.createOrUpdateProfile.bind(userController)
);

// Create a new user - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE BODY
router.post(
  '/',
  ...authAdmin,
  validate(createUserSchema),
  userController.createUser.bind(userController)
);

// Get all users - AUTHENTICATE TOKEN + VALIDATE QUERY
router.get(
  '/',
  authenticateToken,
  validateQuery(paginationQuerySchema), // Dynamic attributes/includes support
  userController.getAllUsers.bind(userController)
);

// Get user by ID - AUTHENTICATE TOKEN + VALIDATE PARAMS
router.get(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  userController.getUserById.bind(userController)
);

// Update user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS + BODY
router.put(
  '/:id',
  ...authAdminWithParams,
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

// Restore user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/restore',
  ...authAdminWithParams,
  userController.restoreUser.bind(userController)
);

// Hard delete user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id/hard',
  ...authAdminWithParams,
  userController.hardDeleteUser.bind(userController)
);

// Soft delete user by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id',
  ...authAdminWithParams,
  userController.deleteUser.bind(userController)
);

export default router;