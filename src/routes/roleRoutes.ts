import { Router } from 'express';
import roleController from '../controllers/roleController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createRoleSchema, updateRoleSchema, idParamSchema, paginationQuerySchema } from '../validations/roleValidation';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// Middleware chains để tránh lặp lại
const authAdmin = [authenticateToken, requireAdmin];
const authAdminWithParams = [authenticateToken, requireAdmin, validateParams(idParamSchema)];

// Create a new role - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE BODY
router.post(
  '/',
  ...authAdmin,
  validate(createRoleSchema),
  roleController.createRole.bind(roleController)
);

// Get all roles - AUTHENTICATE TOKEN + VALIDATE QUERY
router.get(
  '/',
  authenticateToken,
  validateQuery(paginationQuerySchema),
  roleController.getAllRoles.bind(roleController)
);

// Get role by ID - AUTHENTICATE TOKEN + VALIDATE PARAMS
router.get(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  roleController.getRoleById.bind(roleController)
);

// Update role by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS + BODY
router.put(
  '/:id',
  ...authAdminWithParams,
  validate(updateRoleSchema),
  roleController.updateRole.bind(roleController)
);

// Restore role by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/restore',
  ...authAdminWithParams,
  roleController.restoreRole.bind(roleController)
);

// Hard delete role by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id/hard',
  ...authAdminWithParams,
  roleController.hardDeleteRole.bind(roleController)
);

// Soft delete role by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id',
  ...authAdminWithParams,
  roleController.deleteRole.bind(roleController)
);

export default router;

