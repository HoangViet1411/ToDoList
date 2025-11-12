import { Router } from 'express';
import roleController from '../controllers/roleController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createRoleSchema, updateRoleSchema, idParamSchema, paginationQuerySchema } from '../validations/roleValidation';

const router = Router();

// Create a new role
router.post(
  '/',
  validate(createRoleSchema),
  roleController.createRole.bind(roleController)
);

// Get all roles
router.get(
  '/',
  validateQuery(paginationQuerySchema),
  roleController.getAllRoles.bind(roleController)
);

// Get role by ID
router.get(
  '/:id',
  validateParams(idParamSchema),
  roleController.getRoleById.bind(roleController)
);

// Update role by ID
router.put(
  '/:id',
  validateParams(idParamSchema),
  validate(updateRoleSchema),
  roleController.updateRole.bind(roleController)
);

// Restore role by ID
router.post(
  '/:id/restore',
  validateParams(idParamSchema),
  roleController.restoreRole.bind(roleController)
);

// Hard delete role by ID
router.delete(
  '/:id/hard',
  validateParams(idParamSchema),
  roleController.hardDeleteRole.bind(roleController)
);

// Soft delete role by ID
router.delete(
  '/:id',
  validateParams(idParamSchema),
  roleController.deleteRole.bind(roleController)
);

export default router;

