import { Router } from 'express';
import productController from '../controllers/productController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createProductSchema, updateProductSchema } from '../validations/productValidation';
import { idParamSchema, paginationQuerySchema } from '../validations/uservalidation';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// Middleware chains để tránh lặp lại
const authAdmin = [authenticateToken, requireAdmin];
const authAdminWithParams = [authenticateToken, requireAdmin, validateParams(idParamSchema)];

// Create a new product - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE BODY
router.post(
  '/',
  ...authAdmin,
  validate(createProductSchema),
  productController.createProduct.bind(productController)
);

// Get all products - AUTHENTICATE TOKEN + VALIDATE QUERY
router.get(
  '/',
  authenticateToken,
  validateQuery(paginationQuerySchema),
  productController.getAllProducts.bind(productController)
);

// Get product by ID - AUTHENTICATE TOKEN + VALIDATE PARAMS
router.get(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  productController.getProductById.bind(productController)
);

// Update product by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS + BODY
router.put(
  '/:id',
  ...authAdminWithParams,
  validate(updateProductSchema),
  productController.updateProduct.bind(productController)
);

// Restore product by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/restore',
  ...authAdminWithParams,
  productController.restoreProduct.bind(productController)
);

// Hard delete product by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id/hard',
  ...authAdminWithParams,
  productController.hardDeleteProduct.bind(productController)
);

// Soft delete product by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id',
  ...authAdminWithParams,
  productController.deleteProduct.bind(productController)
);

export default router;

