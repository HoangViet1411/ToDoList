import { Router } from 'express';
import orderController from '../controllers/orderController';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { createOrderSchema, updateOrderSchema } from '../validations/orderValidation';
import { idParamSchema, paginationQuerySchema } from '../validations/uservalidation';

const router = Router();

// Create a new order - VALIDATE BODY
router.post(
  '/',
  validate(createOrderSchema),
  orderController.createOrder.bind(orderController)
);

// Get all orders - VALIDATE QUERY
router.get(
  '/',
  validateQuery(paginationQuerySchema),
  orderController.getAllOrders.bind(orderController)
);

// Get order by ID - VALIDATE PARAMS
router.get(
  '/:id',
  validateParams(idParamSchema),
  orderController.getOrderById.bind(orderController)
);

// Update order by ID - VALIDATE PARAMS + BODY
router.put(
  '/:id',
  validateParams(idParamSchema),
  validate(updateOrderSchema),
  orderController.updateOrder.bind(orderController)
);

// Restore order by ID - VALIDATE PARAMS
router.post(
  '/:id/restore',
  validateParams(idParamSchema),
  orderController.restoreOrder.bind(orderController)
);

// Hard delete order by ID - VALIDATE PARAMS
router.delete(
  '/:id/hard',
  validateParams(idParamSchema),
  orderController.hardDeleteOrder.bind(orderController)
);

// Soft delete order by ID - VALIDATE PARAMS
router.delete(
  '/:id',
  validateParams(idParamSchema),
  orderController.deleteOrder.bind(orderController)
);

export default router;

