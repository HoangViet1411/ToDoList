import { Router } from 'express';
import orderController from '../controllers/orderController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createOrderSchema, updateOrderSchema } from '../validations/orderValidation';
import { idParamSchema, paginationQuerySchema } from '../validations/uservalidation';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// Middleware chains để tránh lặp lại
const authAdminWithParams = [authenticateToken, requireAdmin, validateParams(idParamSchema)];

// Create a new order - AUTHENTICATE TOKEN + VALIDATE BODY (All authenticated users can create order)
router.post(
  '/',
  authenticateToken,
  validate(createOrderSchema),
  orderController.createOrder.bind(orderController)
);

// Get all orders - AUTHENTICATE TOKEN + VALIDATE QUERY (All authenticated users can access)
router.get(
  '/',
  authenticateToken,
  validateQuery(paginationQuerySchema),
  orderController.getAllOrders.bind(orderController)
);

// Get order by ID - AUTHENTICATE TOKEN + VALIDATE PARAMS (All authenticated users can access)
router.get(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  orderController.getOrderById.bind(orderController)
);

// Update order by ID - AUTHENTICATE TOKEN + VALIDATE PARAMS + BODY (All authenticated users can update order)
router.put(
  '/:id',
  authenticateToken,
  validateParams(idParamSchema),
  validate(updateOrderSchema),
  orderController.updateOrder.bind(orderController)
);

// Restore order by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.post(
  '/:id/restore',
  ...authAdminWithParams,
  orderController.restoreOrder.bind(orderController)
);

// Hard delete order by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id/hard',
  ...authAdminWithParams,
  orderController.hardDeleteOrder.bind(orderController)
);

// Soft delete order by ID - AUTHENTICATE TOKEN + ADMIN ONLY + VALIDATE PARAMS
router.delete(
  '/:id',
  ...authAdminWithParams,
  orderController.deleteOrder.bind(orderController)
);

export default router;

