import { Router } from 'express';
import productController from '../controllers/productController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createProductSchema, updateProductSchema } from '../validations/productValidation';
import { idParamSchema, paginationQuerySchema } from '../validations/uservalidation';

const router = Router();

// Create a new product - VALIDATE BODY
router.post(
  '/',
  validate(createProductSchema),
  productController.createProduct.bind(productController)
);

// Get all products - VALIDATE QUERY
router.get(
  '/',
  validateQuery(paginationQuerySchema),
  productController.getAllProducts.bind(productController)
);

// Get product by ID - VALIDATE PARAMS
router.get(
  '/:id',
  validateParams(idParamSchema),
  productController.getProductById.bind(productController)
);

// Update product by ID - VALIDATE PARAMS + BODY
router.put(
  '/:id',
  validateParams(idParamSchema),
  validate(updateProductSchema),
  productController.updateProduct.bind(productController)
);

// Restore product by ID - VALIDATE PARAMS
router.post(
  '/:id/restore',
  validateParams(idParamSchema),
  productController.restoreProduct.bind(productController)
);

// Hard delete product by ID - VALIDATE PARAMS
router.delete(
  '/:id/hard',
  validateParams(idParamSchema),
  productController.hardDeleteProduct.bind(productController)
);

// Soft delete product by ID - VALIDATE PARAMS
router.delete(
  '/:id',
  validateParams(idParamSchema),
  productController.deleteProduct.bind(productController)
);

export default router;

