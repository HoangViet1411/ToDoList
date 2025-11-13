import Joi from 'joi';
import { OrderStatus, PaymentMethod } from '../models/Order';

// Schema for CreateOrderItemDto (order item)
export const createOrderItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required().messages({
    'number.base': 'product_id must be a number',
    'number.integer': 'product_id must be an integer',
    'number.positive': 'product_id must be positive',
    'any.required': 'product_id is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'quantity must be a number',
    'number.integer': 'quantity must be an integer',
    'number.min': 'quantity must be at least 1',
    'any.required': 'quantity is required',
  }),
  unit_price: Joi.number().positive().optional().messages({
    'number.base': 'unit_price must be a number',
    'number.positive': 'unit_price must be positive',
  }),
});

// Schema for CreateOrderDto
export const createOrderSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    'number.base': 'user_id must be a number',
    'number.integer': 'user_id must be an integer',
    'number.positive': 'user_id must be positive',
    'any.required': 'user_id is required',
  }),
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional()
    .messages({
      'any.only': `status must be one of: ${Object.values(OrderStatus).join(', ')}`,
    }),
  note: Joi.string().optional().allow(null, '').messages({
    'string.base': 'note must be a string',
  }),
  shipping_address: Joi.string().optional().allow(null, '').messages({
    'string.base': 'shipping_address must be a string',
  }),
  payment_method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `payment_method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
    }),
  items: Joi.array()
    .items(createOrderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.base': 'items must be an array',
      'array.min': 'items must contain at least one item',
      'any.required': 'items is required',
    }),
});

// Schema for UpdateOrderDto
export const updateOrderSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional()
    .messages({
      'any.only': `status must be one of: ${Object.values(OrderStatus).join(', ')}`,
    }),
  note: Joi.string().optional().allow(null, '').messages({
    'string.base': 'note must be a string',
  }),
  shipping_address: Joi.string().optional().allow(null, '').messages({
    'string.base': 'shipping_address must be a string',
  }),
  payment_method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `payment_method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
    }),
  items: Joi.array()
    .items(createOrderItemSchema)
    .optional()
    .messages({
      'array.base': 'items must be an array',
    }),
});

// Schema for ID parameter (dùng chung với user)
export { idParamSchema } from './uservalidation';

// Schema for pagination (dùng chung với user)
export { paginationQuerySchema } from './uservalidation';

